// The call site for dungeon: forwards to its surface, nothing else.
// dungeon's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/dungeon/index.mjs";

// __nirnroot_begin__ generate
// `generate(seed, depth) -> floor-plan`. `seed` an integer from 0 to 4294967295, `depth` an integer from 1 to 33 (`level`'s `MAX_DEPTH`); anything else throws a `TypeError`. On a shop depth (`level.kind(depth)` `interior`), the shop above, whatever the seed; on a lair depth (`boss`), the lair above, whatever the seed. On any other depth, a floor 48 cells wide and 32 high: every cell of its outer border is `wall`; rooms and corridors are `floor`; exactly one cell is `stairs`. `start` is where the hero arrives. `spots` holds from 12 to 40 points, each at a Manhattan distance of at least 5 from `start`. No `boss`, no `levers`. Every `floor` and `stairs` cell can be reached from `start` by orthogonal steps over `floor` and `stairs` cells.
// __nirnroot_end__
export function generate(...args) {
  return target.generate(...args);
}
