// sprite: a source image and the rectangle of it to draw. Immutable.

/**
 * Build a sprite from a source image and a rectangle of it to draw.
 * @param {{image: object, sx: number, sy: number, sw: number, sh: number}} spec
 * @returns {object} A frozen sprite.
 */
export function of({ image, sx, sy, sw, sh }) {
  if (typeof image !== "object" || image === null) {
    throw new TypeError("image must be a non-null object");
  }
  if (!Number.isInteger(sx) || sx < 0) {
    throw new TypeError("sx must be an integer of 0 or more");
  }
  if (!Number.isInteger(sy) || sy < 0) {
    throw new TypeError("sy must be an integer of 0 or more");
  }
  if (!Number.isInteger(sw) || sw < 1) {
    throw new TypeError("sw must be an integer of 1 or more");
  }
  if (!Number.isInteger(sh) || sh < 1) {
    throw new TypeError("sh must be an integer of 1 or more");
  }
  const sprite = { image, sx, sy, sw, sh };
  return Object.freeze(sprite);
}
