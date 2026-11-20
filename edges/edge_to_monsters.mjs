// The call site for monsters: forwards to its surface, nothing else.
// monsters's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/monsters/index.mjs";

// __nirnroot_begin__ decide
// `decide(monster, hero, grid, blocked, turn) -> intent`. `monster` an `actor` not of kind `hero`; `hero` a `point` (where the hero stands); `grid` a `tile-grid`; `blocked` an array of `point`s (the other monsters' cells); `turn` an integer of 0 or more. Anything else throws a `TypeError`. In order, the first that applies:
// 1. A `slime` on an odd `turn` waits.
// 2. If the hero is one orthogonal step away: a `move` onto the hero (an attack).
// 3. If the hero is within the monster's reach (Manhattan distance at most 6; for a `bat`, 9): the first step of a shortest path to the hero by orthogonal steps over open cells (`grid.open`) not in `blocked` (the hero's cell is the goal, so it counts as open), among the first steps that begin a shortest path the first in the order of preference; with no such path of at most 20 steps, it waits.
// 4. Otherwise it waits.
// __nirnroot_end__
export function decide(...args) {
  return target.decide(...args);
}
