// mask: an API Shape.

/**
 * A mask is a grid of booleans, immutable.
 */
export class Mask {
  constructor(width, height, cells) {
    this._width = width;
    this._height = height;
    this._cells = cells;
    Object.freeze(this._cells);
    Object.freeze(this);
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  at(x, y) {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return false;
    }
    return this._cells[y * this._width + x];
  }

  count() {
    let c = 0;
    for (const v of this._cells) {
      if (v) c++;
    }
    return c;
  }

  cells() {
    return this._cells.slice();
  }
}

function _isValidDim(v) {
  return Number.isInteger(v) && v >= 1 && v <= 256;
}

/** @returns {Mask} */
export function empty(width, height) {
  if (!_isValidDim(width) || !_isValidDim(height)) {
    throw new TypeError("width and height must be integers from 1 to 256");
  }
  const cells = new Array(width * height).fill(false);
  return new Mask(width, height, cells);
}

/** @returns {Mask} */
export function of(width, height, cells) {
  if (!_isValidDim(width) || !_isValidDim(height)) {
    throw new TypeError("width and height must be integers from 1 to 256");
  }
  if (!Array.isArray(cells) || cells.length !== width * height) {
    throw new TypeError("cells must be an array of exactly width * height booleans");
  }
  const copied = new Array(width * height);
  for (let i = 0; i < cells.length; i++) {
    if (typeof cells[i] !== "boolean") {
      throw new TypeError("cells must be booleans");
    }
    copied[i] = cells[i];
  }
  return new Mask(width, height, copied);
}

/** @returns {Mask} */
export function union(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new TypeError("union requires masks of the same width and height");
  }
  const cells = [];
  for (let i = 0; i < a._cells.length; i++) {
    cells.push(a._cells[i] || b._cells[i]);
  }
  return new Mask(a.width, a.height, cells);
}
