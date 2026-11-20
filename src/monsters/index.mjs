// monsters: a Node, its surface replaces the stub.

import * as actor from "../../shapes/actor/index.mjs";
import * as intent from "../../shapes/intent/index.mjs";

const KINDS = actor.KINDS;

/** `decide(monster, hero, grid, blocked, turn) -> intent`. `monster` an `actor` not of kind `hero`; `hero` a `point` (where the hero stands); `grid` a `tile-grid`; `blocked` an array of `point`s (the other monsters' cells); `turn` an integer of 0 or more. Anything else throws a `TypeError`. In order, the first that applies: 1. A `slime` on an odd `turn` waits. 2. If the hero is one orthogonal step away: a `move` onto the hero (an attack). 3. If the hero is within the monster's reach (Manhattan distance at most 6; for a `bat`, 9): the first step of a shortest path to the hero by orthogonal steps over open cells (`grid.open`) not in `blocked` (the hero's cell is the goal, so it counts as open), among the first steps that begin a shortest path the first in the order of preference; with no such path of at most 20 steps, it waits. 4. Otherwise it waits. */
export function decide(monster, hero, grid, blocked, turn) {
  // Validate monster: an actor not of kind hero.
  if (!monster || typeof monster.kind !== "string" || !KINDS.includes(monster.kind) || monster.kind === "hero") {
    throw new TypeError("monster must be an actor not of kind hero");
  }
  // Validate hero: a point.
  if (!hero || typeof hero.x !== "number" || !Number.isInteger(hero.x) || typeof hero.y !== "number" || !Number.isInteger(hero.y) || !Object.isFrozen(hero)) {
    throw new TypeError("hero must be a point");
  }
  // Validate grid: a tile-grid.
  if (!grid || typeof grid.width !== "number" || typeof grid.height !== "number" || typeof grid.open !== "function") {
    throw new TypeError("grid must be a tile-grid");
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

  // 1. A slime on an odd turn waits.
  if (mk === "slime" && (turn % 2) === 1) {
    return intent.wait();
  }

  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const heroP = hero;
  const mDist = dist(mpos, heroP);

  // 2. Adjacent: attack.
  if (mDist === 1) {
    return intent.move(heroP.x - mpos.x, heroP.y - mpos.y);
  }

  // 3. Within reach? Manhattan distance at most 6; for a bat, 9.
  const reach = mk === "bat" ? 9 : 6;
  if (mDist > reach) {
    return intent.wait();
  }

  // BFS: neighbours in the order of preference: up, right, down, left.
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];

  const blockedSet = new Set(blocked.map((b) => `${b.x},${b.y}`));
  const startKey = `${mpos.x},${mpos.y}`;
  const heroKey = `${heroP.x},${heroP.y}`;

  const visited = new Map();
  visited.set(startKey, { step: null, dist: 0 });

  let queue = [mpos];
  let heroStep = null;

  while (queue.length > 0) {
    const curr = queue.shift();
    const cKey = `${curr.x},${curr.y}`;
    const curDist = visited.get(cKey).dist;
    if (curDist >= 20) continue;

    for (const dir of directions) {
      const nx = curr.x + dir.dx;
      const ny = curr.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (nKey !== heroKey && !grid.open(nx, ny)) continue;
      if (blockedSet.has(nKey)) continue;
      if (visited.has(nKey)) continue;

      const step = visited.get(cKey).step || dir;
      visited.set(nKey, { step, dist: curDist + 1 });

      if (nKey === heroKey) {
        heroStep = step;
        break;
      }

      queue.push({ x: nx, y: ny });
    }
    if (heroStep) break;
  }

  if (heroStep) {
    return intent.move(heroStep.dx, heroStep.dy);
  }

  return intent.wait();
}
