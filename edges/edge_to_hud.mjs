// The call site for hud: forwards to its surface, nothing else.
// hud's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/hud/index.mjs";

// __nirnroot_begin__ lines
// `lines(world) -> array of strings`. First the status line, `HP <hp>/<maxHp>   ATK <attack>   DEF <defense>   Gold <gold>   Depth <depth>/5` (three spaces between the parts), then the last three lines of the world's log, oldest first (fewer when the log is shorter).
// __nirnroot_end__
export function lines(...args) {
  return target.lines(...args);
}

// __nirnroot_begin__ draw
// `draw(ctx, x, y, width, height, world)`. Draws the panel into the rectangle (`x`, `y`, `width`, `height`) of the 2D context `ctx`, and nothing outside it (it clips to it). `x`, `y` integers, `width` and `height` integers of 1 or more; anything else, or a `world` that isn't one, throws a `TypeError`.
// __nirnroot_end__
export function draw(...args) {
  return target.draw(...args);
}
