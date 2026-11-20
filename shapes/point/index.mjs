// point: an API Shape, a cell of the dungeon's grid.

/**
 * Create a frozen point.
 * @param {number} x - column, an integer
 * @param {number} y - row, an integer
 * @returns {Point} a frozen point
 */
export function of(x, y) {
  if (typeof x !== 'number' || !Number.isInteger(x)) {
    throw new TypeError('point x must be an integer');
  }
  if (typeof y !== 'number' || !Number.isInteger(y)) {
    throw new TypeError('point y must be an integer');
  }
  return Object.freeze({ x, y });
}

/**
 * Compare two points for equality.
 * @param {Point} a
 * @param {Point} b
 * @returns {boolean}
 */
export function equals(a, b) {
  return a.x === b.x && a.y === b.y;
}
