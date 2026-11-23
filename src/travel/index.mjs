// travel: where a player's hero goes next on a journey of many steps.

import * as intentShape from '../../shapes/intent/index.mjs';
import * as pointShape from '../../shapes/point/index.mjs';
import * as worldShape from '../../shapes/world/index.mjs';
import * as heroShape from '../../shapes/hero/index.mjs';
import * as actorShape from '../../shapes/actor/index.mjs';
import * as itemShape from '../../shapes/item/index.mjs';
import * as maskShape from '../../shapes/mask/index.mjs';
import * as tileGridShape from '../../shapes/tile-grid/index.mjs';
import * as bestiaryShape from '../../shapes/bestiary/index.mjs';

const DIRECTIONS = [
  [0, -1],   // up
  [1, 0],    // right
  [0, 1],    // down
  [-1, 0],   // left
  [1, -1],   // up-right
  [1, 1],    // down-right
  [-1, 1],   // down-left
  [-1, -1],  // up-left
];

function isWorld(w) {
  return w && typeof w === 'object' && w.grid && w.grid instanceof tileGridShape.TileGrid &&
    Array.isArray(w.heroes) && Array.isArray(w.monsters) && Array.isArray(w.items) &&
    w.visible instanceof maskShape.Mask && w.explored instanceof maskShape.Mask;
}

function isPoint(p) {
  return p && typeof p === 'object' && Object.isFrozen(p) &&
    typeof p.x === 'number' && Number.isInteger(p.x) &&
    typeof p.y === 'number' && Number.isInteger(p.y);
}

function isKnown(world, x, y) {
  return world.explored.at(x, y) || world.visible.at(x, y);
}

function cornerOpen(grid, x, y, dx, dy) {
  if (dx === 0 || dy === 0) return true;
  return grid.open(x + dx, y) && grid.open(x, y + dy);
}

function isPassable(world, meName, x, y) {
  if (!isKnown(world, x, y)) return false;
  if (!world.grid.open(x, y)) return false;

  for (const m of world.monsters) {
    const visibleOne = m.cells().some((c) => world.visible.at(c.x, c.y));
    if (visibleOne && m.covers(x, y)) return false;
  }
  for (const h of world.heroes) {
    if (h.name === meName) continue;
    if (h.alive && h.actor.covers(x, y)) return false;
  }
  for (const it of world.items) {
    const isWare = it.price > 0;
    const isLever = it.kind === 'lever';
    if ((isWare || isLever) && it.pos.x === x && it.pos.y === y) return false;
  }
  return true;
}

function cellsBetween(ox, oy, cx, cy) {
  const cells = [];
  const ddx = cx - ox;
  const ddy = cy - oy;
  const ax = Math.abs(ddx);
  const ay = Math.abs(ddy);
  if (ax === 0 && ay === 0) return cells;
  if (ax >= ay) {
    const sx = ddx > 0 ? 1 : -1;
    for (let x = ox + sx; x !== cx; x += sx) {
      const t = (x - ox) / ddx;
      const y = Math.round(oy + t * ddy);
      cells.push([x, y]);
    }
  } else {
    const sy = ddy > 0 ? 1 : -1;
    for (let y = oy + sy; y !== cy; y += sy) {
      const t = (y - oy) / ddy;
      const x = Math.round(ox + t * ddx);
      cells.push([x, y]);
    }
  }
  return cells;
}

function inSightOf(world, o, cx, cy) {
  if (!world.visible.at(cx, cy)) return false;
  const dx = cx - o.x, dy = cy - o.y;
  if (dx * dx + dy * dy > 49) return false;
  const between = cellsBetween(o.x, o.y, cx, cy);
  for (const [bx, by] of between) {
    if (world.grid.at(bx, by) === 'wall') return false;
  }
  return true;
}

function search(world, meName, mePos, isGoal) {
  const grid = world.grid;
  const mx = mePos.x, my = mePos.y;

  const queue = [[mx, my]];
  const visited = new Set();
  visited.add(my * grid.width + mx);
  const firstStep = new Map();

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    const idx = cy * grid.width + cx;

    if (isGoal(cx, cy)) {
      if (cx === mx && cy === my) return null;
      const step = firstStep.get(idx);
      return intentShape.move(step.dx, step.dy);
    }

    for (const [dx, dy] of DIRECTIONS) {
      const nx = cx + dx, ny = cy + dy;
      if (!cornerOpen(grid, cx, cy, dx, dy)) continue;
      if (!isPassable(world, meName, nx, ny)) continue;
      const nidx = ny * grid.width + nx;
      if (visited.has(nidx)) continue;
      visited.add(nidx);
      if (cx === mx && cy === my) {
        firstStep.set(nidx, { dx, dy });
      } else {
        firstStep.set(nidx, firstStep.get(idx));
      }
      queue.push([nx, ny]);
    }
  }
  return null;
}

function makeExploreGoal(world, meName, mePos) {
  const grid = world.grid;
  return (x, y) => {
    if (x === mePos.x && y === mePos.y) return false;
    if (!isPassable(world, meName, x, y)) return false;
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
        if (!isKnown(world, nx, ny)) return true;
      }
    }
    return false;
  };
}

function makeStairsGoal(world, mePos) {
  const grid = world.grid;
  const stairsCells = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.at(x, y) === 'stairs' && isKnown(world, x, y)) {
        stairsCells.push([x, y]);
      }
    }
  }
  return (x, y) => {
    if (x === mePos.x && y === mePos.y) return false;
    return stairsCells.some(([sx, sy]) => sx === x && sy === y);
  };
}

export function explore(world, me) {
  if (!isWorld(world)) throw new TypeError('travel: world must be a world');
  const hero = world.heroes.find((h) => h.name === me);
  if (!hero || !hero.alive) return null;
  const mePos = hero.actor.pos;

  const frontierGoal = makeExploreGoal(world, me, mePos);
  const result = search(world, me, mePos, frontierGoal);
  if (result) return result;

  const stairsGoal = makeStairsGoal(world, mePos);
  return search(world, me, mePos, stairsGoal);
}

export function toward(world, me, target) {
  if (!isWorld(world)) throw new TypeError('travel: world must be a world');
  if (!isPoint(target)) throw new TypeError('travel: target must be a point');
  const hero = world.heroes.find((h) => h.name === me);
  if (!hero || !hero.alive) return null;
  const mePos = hero.actor.pos;

  if (!isKnown(world, target.x, target.y)) return null;
  if (!world.grid.open(target.x, target.y)) return null;

  if (isPassable(world, me, target.x, target.y)) {
    return search(world, me, mePos, (x, y) => x === target.x && y === target.y);
  }

  const goalCells = [];
  for (const [dx, dy] of DIRECTIONS) {
    goalCells.push([target.x + dx, target.y + dy]);
  }
  return search(world, me, mePos, (x, y) => goalCells.some(([gx, gy]) => gx === x && gy === y));
}

export function sighted(world, me) {
  if (!isWorld(world)) throw new TypeError('travel: world must be a world');
  const hero = world.heroes.find((h) => h.name === me);
  if (!hero || !hero.alive) return [];
  const mePos = hero.actor.pos;

  const result = [];
  for (const m of world.monsters) {
    if (!bestiaryShape.hostile('hero', m.kind)) continue;
    const inSight = m.cells().some((c) => inSightOf(world, mePos, c.x, c.y));
    if (inSight) result.push(m.id);
  }
  return result;
}
