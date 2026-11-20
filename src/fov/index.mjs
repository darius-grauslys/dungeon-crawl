// fov: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `compute(grid, origin, radius) -> mask`. `grid` a `tile-grid`, `origin` a `point` inside it, `radius` an integer from 1 to 30; anything else throws a `TypeError`. Answers a mask of the grid's size, true for exactly the cells in sight from `origin`. */
export function compute(...args) {
  throw new Error("not implemented: fov.compute");
}
