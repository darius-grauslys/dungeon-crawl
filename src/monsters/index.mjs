// monsters: a Node, its surface replaces the stub.

import * as actor from "../../shapes/actor/index.mjs";
import * as intent from "../../shapes/intent/index.mjs";
import * as point from "../../shapes/point/index.mjs";
import * as tileGrid from "../../shapes/tile-grid/index.mjs";
import * as stats from "../../shapes/stats/index.mjs";
import * as bestiary from "../../shapes/bestiary/index.mjs";

const KINDS = actor.KINDS;

// Directions in order of preference:
// up, right, down, left, up-right, down-right, down-left, up-left.
const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: -1 },
];

// Distance: max(|dx|, |dy|).
function dist(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// Distance squared: dx*dx + dy*dy.
function distSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** `decide(monster, grid, foes, threats, blocked, turn) -> intent`. `monster` an `actor` not of kind `hero`; `grid` a `tile-grid`; `foes` an array of `point`s, the cells of the creatures it fights (every cell each covers), in the caller's order of preference; `threats` an array of `point`s, the cells of the creatures it flees; `blocked` an array of `point`s, the cells it may not step onto (other creatures, wares, levers); `turn` an integer of 0 or more. Anything else throws a `TypeError`. In order, the first that applies: 1. A `dormant` monster waits; so does one whose `bestiary` `ability` is `summon`. 2. A slime (`bestiary`'s `SLIMES`) on an odd `turn` waits. 3. **Keeping its distance.** A monster whose `mode` is `roam` and whose `stats.range` is above 1, with the nearest foe's cell at a distance below its `range` (a foe has come close): among its free steps, the one that leaves it farthest from the nearest foe's cell (the first in the order of preference on a tie), if that is farther than it is now: it backs off, one step at a time, until the foe is at its full range. With no step that takes it farther (it is cornered), go on to the next rules (it fights where it stands). 4. If it is next to a foe's cell (the first such in `foes`): a `move` toward that cell (an attack); but a monster whose `ability` is `fuse` (a pumpkin) never attacks: next to a foe, it waits. 5. A `guard` waits. 6. If a threat's cell is within 5 of it: it flees: among its free steps, the one that leaves it farthest from the nearest threat's cell (the first in the order of preference on a tie), if that is farther than it is now; else it waits. 7. If its `stats.range` is above 1 and a foe's cell is in line (the first such in `foes`): an `attack` toward it (the direction from the monster to the cell). 8. If a foe's cell is within its `reach` (the nearest such cell; on a tie, the first in `foes`): a step toward it: count, with a breadth-first search of free steps to a depth of 20, how many steps each square needs to be next to that cell; among its free steps, the one whose square needs the fewest more; on a tie, the one whose moved square's nearest cell to the foe's cell is the nearest to it by `dx * dx + dy * dy`; then the first in the order of preference. With no such path of at most 20 steps, it waits. 9. Otherwise it waits. */
export function decide(monster, grid, foes, threats, blocked, turn) {
  // Validate monster: an actor not of kind hero.
  if (!monster || typeof monster.kind !== "string" || !KINDS.includes(monster.kind) || monster.kind === "hero") {
    throw new TypeError("monster must be an actor not of kind hero");
  }
  // Validate grid: a tile-grid.
  if (!grid || typeof grid.width !== "number" || typeof grid.height !== "number" || typeof grid.open !== "function") {
    throw new TypeError("grid must be a tile-grid");
  }
  // Validate foes: an array of points.
  if (!Array.isArray(foes)) {
    throw new TypeError("foes must be an array of points");
  }
  for (const f of foes) {
    if (!f || typeof f.x !== "number" || !Number.isInteger(f.x) || typeof f.y !== "number" || !Number.isInteger(f.y) || !Object.isFrozen(f)) {
      throw new TypeError("foes elements must be points");
    }
  }
  // Validate threats: an array of points.
  if (!Array.isArray(threats)) {
    throw new TypeError("threats must be an array of points");
  }
  for (const t of threats) {
    if (!t || typeof t.x !== "number" || !Number.isInteger(t.x) || typeof t.y !== "number" || !Number.isInteger(t.y) || !Object.isFrozen(t)) {
      throw new TypeError("threats elements must be points");
    }
  }
  // Validate blocked: an array of points.
  if (!Array.isArray(blocked)) {
    throw new TypeError("blocked must be an array of points");
  }
  for (const b of blocked) {
    if (!b || typeof b.x !== "number" || !Number.isInteger(b.x) || typeof b.y !== "number" || !Number.isInteger(b.y) || !Object.isFrozen(b)) {
      throw new TypeError("blocked elements must be points");
    }
  }
  // Validate turn: an integer of 0 or more.
  if (typeof turn !== "number" || !Number.isInteger(turn) || turn < 0) {
    throw new TypeError("turn must be an integer of 0 or more");
  }

  const mk = monster.kind;
  const mpos = monster.pos;
  const size = monster.size;
  const mode = monster.mode;

  const best = bestiary.entry(mk);
  const reach = best.reach;
  const range = monster.stats.range;
  const isSlime = bestiary.SLIMES.includes(mk);

  // Blocked set for quick lookup.
  const blockedSet = new Set(blocked.map((b) => `${b.x},${b.y}`));

  // Helper: cells the monster's square covers at a given top-left position.
  function cellsAt(px, py) {
    const cells = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        cells.push({ x: px + i, y: py + j });
      }
    }
    return cells;
  }

  // Helper: nearest covered cell to a target, and its distance.
  // Ties in distance are broken by the least squared distance.
  function nearestCell(px, py, target) {
    let bestCell = null;
    let bestD = Infinity;
    let bestSq = Infinity;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const c = { x: px + i, y: py + j };
        const d = dist(c, target);
        const sq = distSq(c, target);
        if (d < bestD || (d === bestD && sq < bestSq)) {
          bestD = d;
          bestSq = sq;
          bestCell = c;
        }
      }
    }
    return { cell: bestCell, dist: bestD };
  }

  // Helper: is a step of the monster's square free?
  // free(x, y, dx, dy): step from position (x, y) in direction (dx, dy).
  function isFree(x, y, dx, dy) {
    // Every cell the moved square covers is open and not in blocked.
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const nx = x + dx + i;
        const ny = y + dy + j;
        if (!grid.open(nx, ny)) return false;
        if (blockedSet.has(`${nx},${ny}`)) return false;
      }
    }
    // For a diagonal, the two orthogonal steps (dx, 0) and (0, dy) each
    // move the square onto open cells only (corner check on walls alone).
    if (dx !== 0 && dy !== 0) {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const nx1 = x + dx + i;
          const ny1 = y + j;
          if (!grid.open(nx1, ny1)) return false;
          const nx2 = x + i;
          const ny2 = y + dy + j;
          if (!grid.open(nx2, ny2)) return false;
        }
      }
    }
    return true;
  }

  // Helper: direction toward a cell if the monster is next to it, else null.
  function nextTo(px, py, cell) {
    const { cell: ncell, dist: d } = nearestCell(px, py, cell);
    if (d !== 1) return null;
    const odx = cell.x - ncell.x;
    const ody = cell.y - ncell.y;
    if (Math.abs(odx) === 1 && Math.abs(ody) === 1) {
      // Diagonal: neither of the two cells between them orthogonally is a wall.
      const c1 = { x: cell.x, y: ncell.y };
      const c2 = { x: ncell.x, y: cell.y };
      if (!grid.open(c1.x, c1.y) || !grid.open(c2.x, c2.y)) return null;
    }
    return { dx: Math.sign(odx), dy: Math.sign(ody) };
  }

  // Helper: is a cell in line of a size-1 monster?
  function inLine(cell) {
    if (size !== 1) return false;
    const odx = cell.x - mpos.x;
    const ody = cell.y - mpos.y;
    if (!(ody === 0 || odx === 0 || Math.abs(odx) === Math.abs(ody))) return false;
    if (odx === 0 && ody === 0) return false;
    if (Math.max(Math.abs(odx), Math.abs(ody)) > range) return false;
    const steps = Math.max(Math.abs(odx), Math.abs(ody));
    const sdx = steps === 0 ? 0 : Math.sign(odx);
    const sdy = steps === 0 ? 0 : Math.sign(ody);
    for (let s = 1; s < steps; s++) {
      const cx = mpos.x + s * sdx;
      const cy = mpos.y + s * sdy;
      if (!grid.open(cx, cy)) return false;
    }
    return true;
  }

  // Helper: the free step that leaves the monster farthest from a reference cell,
  // or null when none is farther than now.
  function farthestStepFrom(cell) {
    let curDist = Infinity;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const c = { x: mpos.x + i, y: mpos.y + j };
        const d = dist(c, cell);
        if (d < curDist) curDist = d;
      }
    }
    let bestStep = null;
    let bestFarDist = -1;
    for (const dir of DIRECTIONS) {
      const nx = mpos.x + dir.dx;
      const ny = mpos.y + dir.dy;
      if (!isFree(mpos.x, mpos.y, dir.dx, dir.dy)) continue;
      let newDist = Infinity;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const c = { x: nx + i, y: ny + j };
          const d = dist(c, cell);
          if (d < newDist) newDist = d;
        }
      }
      if (newDist > bestFarDist) {
        bestFarDist = newDist;
        bestStep = dir;
      }
    }
    if (bestStep && bestFarDist > curDist) {
      return bestStep;
    }
    return null;
  }

  // 1. A dormant monster waits; so does one whose ability is summmon.
  if (mode === "dormant" || best.ability === "summon") {
    return intent.wait();
  }

  // 2. A slime on an odd turn waits.
  if (isSlime && (turn % 2) === 1) {
    return intent.wait();
  }

  // 3. Keeping its distance: a roam monster with range above 1, with the
  // nearest foe's cell closer than its range: if its last is a move and a
  // foe's cell is in line, shoot toward it; otherwise back off one step.
  if (mode === "roam" && range > 1) {
    let nearestFoe = null;
    let nearestFoeDist = Infinity;
    for (const foe of foes) {
      const { dist: d } = nearestCell(mpos.x, mpos.y, foe);
      if (d < nearestFoeDist) {
        nearestFoeDist = d;
        nearestFoe = foe;
      }
    }
    if (nearestFoe && nearestFoeDist < range) {
      // If its last is a move and a foe's cell is in line, shoot between steps.
      if (monster.last && monster.last.kind === "move") {
        for (const foe of foes) {
          if (inLine(foe)) {
            const shootDir = { dx: Math.sign(foe.x - mpos.x), dy: Math.sign(foe.y - mpos.y) };
            return intent.attack(shootDir.dx, shootDir.dy);
          }
        }
      }
      const step = farthestStepFrom(nearestFoe);
      if (step) {
        return intent.move(step.dx, step.dy);
      }
    }
  }

  // 4. Next to a foe's cell?
  let nextDir = null;
  for (const foe of foes) {
    const dir = nextTo(mpos.x, mpos.y, foe);
    if (dir) {
      nextDir = dir;
      break;
    }
  }
  if (nextDir) {
    // a monster whose ability is fuse (a pumpkin) never attacks: next to a foe, it waits.
    if (best.ability === "fuse") {
      return intent.wait();
    }
    return intent.move(nextDir.dx, nextDir.dy);
  }

  // 5. A guard waits.
  if (mode === "guard") {
    return intent.wait();
  }

  // 6. Flee: nearest threat within 5.
  let nearestThreat = null;
  let nearestThreatDist = Infinity;
  for (const t of threats) {
    const { dist: d } = nearestCell(mpos.x, mpos.y, t);
    if (d < nearestThreatDist) {
      nearestThreatDist = d;
      nearestThreat = t;
    }
  }
  if (nearestThreat && nearestThreatDist <= 5) {
    const step = farthestStepFrom(nearestThreat);
    if (step) {
      return intent.move(step.dx, step.dy);
    }
    return intent.wait();
  }

  // 7. Shoot in line.
  let shootDir = null;
  for (const foe of foes) {
    if (range > 1 && inLine(foe)) {
      shootDir = { dx: Math.sign(foe.x - mpos.x), dy: Math.sign(foe.y - mpos.y) };
      break;
    }
  }
  if (shootDir) {
    return intent.attack(shootDir.dx, shootDir.dy);
  }

  // 8. Chase: nearest foe within reach.
  let nearestFoe = null;
  let nearestFoeDist = Infinity;
  for (const foe of foes) {
    const { dist: d } = nearestCell(mpos.x, mpos.y, foe);
    if (d < nearestFoeDist) {
      nearestFoeDist = d;
      nearestFoe = foe;
    }
  }
  if (nearestFoe && nearestFoeDist <= reach) {
    // BFS from the goal: record how many steps each square position needs
    // to be next to the foe's cell.
    const bfsMap = new Map();
    const startPositions = [];
    const r = size + 2;
    for (let py = nearestFoe.y - r; py <= nearestFoe.y + r; py++) {
      for (let px = nearestFoe.x - r; px <= nearestFoe.x + r; px++) {
        const { cell: nc, dist: nd } = nearestCell(px, py, nearestFoe);
        if (nd !== 1) continue;
        const odx = nearestFoe.x - nc.x;
        const ody = nearestFoe.y - nc.y;
        let cornerOk = true;
        if (Math.abs(odx) === 1 && Math.abs(ody) === 1) {
          const c1 = { x: nearestFoe.x, y: nc.y };
          const c2 = { x: nc.x, y: nearestFoe.y };
          if (!grid.open(c1.x, c1.y) || !grid.open(c2.x, c2.y)) cornerOk = false;
        }
        if (!cornerOk) continue;
        let ok = true;
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const cx = px + i;
            const cy = py + j;
            if (!grid.open(cx, cy)) { ok = false; break; }
            if (blockedSet.has(`${cx},${cy}`)) { ok = false; break; }
          }
          if (!ok) break;
        }
        if (!ok) continue;
        startPositions.push({ x: px, y: py });
      }
    }

    let queue = startPositions;
    for (const sp of startPositions) {
      bfsMap.set(`${sp.x},${sp.y}`, 0);
    }
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      const curDist = bfsMap.get(`${cur.x},${cur.y}`);
      if (curDist >= 20) continue;
      for (const dir of DIRECTIONS) {
        const ax = cur.x - dir.dx;
        const ay = cur.y - dir.dy;
        if (!isFree(ax, ay, dir.dx, dir.dy)) continue;
        const aKey = `${ax},${ay}`;
        if (bfsMap.has(aKey)) continue;
        bfsMap.set(aKey, curDist + 1);
        queue.push({ x: ax, y: ay });
      }
    }

    let bestStep = null;
    let bestStepsDist = Infinity;
    let bestSqDist = Infinity;
    for (const dir of DIRECTIONS) {
      const nx = mpos.x + dir.dx;
      const ny = mpos.y + dir.dy;
      const nKey = `${nx},${ny}`;
      if (!bfsMap.has(nKey)) continue;
      if (!isFree(mpos.x, mpos.y, dir.dx, dir.dy)) continue;
      const stepsDist = bfsMap.get(nKey);
      let sqDist = Infinity;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const c = { x: nx + i, y: ny + j };
          sqDist = Math.min(sqDist, distSq(c, nearestFoe));
        }
      }
      if (stepsDist < bestStepsDist || (stepsDist === bestStepsDist && sqDist < bestSqDist)) {
        bestStepsDist = stepsDist;
        bestSqDist = sqDist;
        bestStep = dir;
      }
    }
    if (bestStep) {
      return intent.move(bestStep.dx, bestStep.dy);
    }
    return intent.wait();
  }

  // 9. Otherwise it waits.
  return intent.wait();
}
