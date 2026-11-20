// The call site for fov: forwards to its surface, nothing else.
// fov's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/fov/index.mjs";

// __nirnroot_begin__ compute
// `compute(grid, origin, radius) -> mask`. `grid` a `tile-grid`, `origin` a `point` inside it, `radius` an integer from 1 to 30; anything else throws a `TypeError`. Answers a mask of the grid's size, true for exactly the cells in sight from `origin`.
// __nirnroot_end__
export function compute(...args) {
  return target.compute(...args);
}
