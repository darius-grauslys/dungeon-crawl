// hud: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `lines(world) -> array of strings`. First the status line, `HP <hp>/<maxHp> ATK <attack> DEF <defense> Gold <gold> Depth <depth>/5` (three spaces between the parts), then the last three lines of the world's log, oldest first (fewer when the log is shorter). */
export function lines(...args) {
  throw new Error("not implemented: hud.lines");
}

/** `draw(ctx, x, y, width, height, world)`. Draws the panel into the rectangle (`x`, `y`, `width`, `height`) of the 2D context `ctx`, and nothing outside it (it clips to it). `x`, `y` integers, `width` and `height` integers of 1 or more; anything else, or a `world` that isn't one, throws a `TypeError`. */
export function draw(...args) {
  throw new Error("not implemented: hud.draw");
}
