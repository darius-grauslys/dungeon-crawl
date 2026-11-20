// tile-grid: an API Shape representing a dungeon floor's terrain. Immutable.

const CHAR_KINDS = {
  '#': 'wall',
  '.': 'floor',
  '>': 'stairs',
};

const VALID_KINDS = new Set(['wall', 'floor', 'stairs']);

/**
 * A tile-grid shape instance.
 */
export class TileGrid {
  constructor(width, height, tiles) {
    this._width = width;
    this._height = height;
    this._tiles = tiles.slice();
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  at(x, y) {
    if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
      return 'wall';
    }
    return this._tiles[y * this._width + x];
  }

  tiles() {
    return this._tiles.slice();
  }

  open(x, y) {
    const kind = this.at(x, y);
    return kind === 'floor' || kind === 'stairs';
  }
}

/**
 * Create a tile-grid from width, height, and tiles array.
 */
export function of(width, height, tiles) {
  if (!Number.isInteger(width) || width < 1 || width > 256) {
    throw new TypeError('width must be an integer from 1 to 256');
  }
  if (!Number.isInteger(height) || height < 1 || height > 256) {
    throw new TypeError('height must be an integer from 1 to 256');
  }
  if (!Array.isArray(tiles)) {
    throw new TypeError('tiles must be an array');
  }
  if (tiles.length !== width * height) {
    throw new TypeError('tiles must have exactly width * height kind names');
  }
  for (const tile of tiles) {
    if (!VALID_KINDS.has(tile)) {
      throw new TypeError('invalid tile kind name: ' + tile);
    }
  }
  const grid = new TileGrid(width, height, tiles);
  Object.freeze(grid);
  return grid;
}

/**
 * Create a tile-grid from rows of chars.
 */
export function fromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new TypeError('rows must be a non-empty array');
  }
  let width = null;
  for (const row of rows) {
    if (typeof row !== 'string') {
      throw new TypeError('rows must be strings');
    }
    if (width === null) {
      width = row.length;
    } else if (row.length !== width) {
      throw new TypeError('rows must be of equal length');
    }
  }
  const height = rows.length;
  const tiles = [];
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (!(ch in CHAR_KINDS)) {
        throw new TypeError('invalid char: ' + ch);
      }
      tiles.push(CHAR_KINDS[ch]);
    }
  }
  return of(width, height, tiles);
}
