// view: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `init(canvas)`. The canvas to draw into from now on (a page's `<canvas>` element). Draws nothing. */
export function init(...args) {
  throw new Error("not implemented: view.init");
}

/** `load(base) -> promise`. Loads the sprites from the asset URL prefix `base` (the page's is `/assets/`); resolves once they are in, and from the next `draw` they are used. Rejects as the sprites' loading does; the flat colours stay. */
export function load(...args) {
  throw new Error("not implemented: view.load");
}

/** `camera(world, cols, rows) -> point`. The camera, as the layout says, for a view of `cols` by `rows` cells. */
export function camera(...args) {
  throw new Error("not implemented: view.camera");
}

/** `draw(world)`. Draws the world, as above, onto the canvas given to `init` (throws an `Error` if none was given). */
export function draw(...args) {
  throw new Error("not implemented: view.draw");
}
