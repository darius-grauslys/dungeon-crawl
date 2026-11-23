// The call site for view: forwards to its surface, nothing else.
// view's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/view/index.mjs";

// __nirnroot_begin__ init
// `init(canvas)`. The canvas to draw into from now on (a page's `<canvas>` element). Draws nothing.
// __nirnroot_end__
export function init(...args) {
  return target.init(...args);
}

// __nirnroot_begin__ load
// `load(base) -> promise`. Loads the sprites from the asset URL prefix `base` (the page's is `/assets/`); resolves once they are in, and from the next `draw` they are used. Rejects as the sprites' loading does; the flat colours stay.
// __nirnroot_end__
export function load(...args) {
  return target.load(...args);
}

// __nirnroot_begin__ camera
// `camera(world, me, cols, rows) -> point`. The camera, as the layout says, for the player `me` (a string; any name) and a view of `cols` by `rows` cells.
// __nirnroot_end__
export function camera(...args) {
  return target.camera(...args);
}

// __nirnroot_begin__ cell-at
// `cellAt(world, me, x, y) -> point`. The cell of the grid drawn under the canvas pixel `(x, y)` (canvas pixels, as `draw` lays them out on the canvas given to `init`, for the player `me`): with `cols` and `rows` from the canvas's size and the camera as the layout says, the point `(camera.x + Math.floor(x / 48), camera.y + Math.floor(y / 48))`. `null` when the pixel is not on the map: `x` below 0 or at least `cols * 48`, `y` below 0 or at least `rows * 48` (the panel), or the cell outside the grid. Throws an `Error` if no canvas was given to `init`.
// __nirnroot_end__
export function cellAt(...args) {
  return target.cellAt(...args);
}

// __nirnroot_begin__ draw
// `draw(world, me, paused, now, aiming)`. Draws the world for the player `me`, as above, onto the canvas given to `init` (throws an `Error` if none was given), with the paused band when `paused` is true. `now` is the world time to animate at, a number of 0 or more (left out: the world's `time`): the page draws every frame, with `now` running on from the last world's `time` between two worlds. `aiming` (left out: `false`): whether the player is aiming, so the aim dot is drawn.
// __nirnroot_end__
export function draw(...args) {
  return target.draw(...args);
}
