// monsters: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `decide(monster, hero, grid, blocked, turn) -> intent`. `monster` an `actor` not of kind `hero`; `hero` a `point` (where the hero stands); `grid` a `tile-grid`; `blocked` an array of `point`s (the other monsters' cells); `turn` an integer of 0 or more. Anything else throws a `TypeError`. In order, the first that applies: 1. A `slime` on an odd `turn` waits. 2. If the hero is one orthogonal step away: a `move` onto the hero (an attack). 3. If the hero is within the monster's reach (Manhattan distance at most 6; for a `bat`, 9): the first step of a shortest path to the hero by orthogonal steps over open cells (`grid.open`) not in `blocked` (the hero's cell is the goal, so it counts as open), among the first steps that begin a shortest path the first in the order of preference; with no such path of at most 20 steps, it waits. 4. Otherwise it waits. */
export function decide(...args) {
  throw new Error("not implemented: monsters.decide");
}
