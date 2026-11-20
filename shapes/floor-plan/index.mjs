// floor-plan: an API Shape, a freshly generated dungeon floor, before anything lives on it.

import { of as pointOf, equals as pointEquals } from '../point/index.mjs';

/**
 * A floor-plan shape instance.
 */
export class FloorPlan {
  constructor(grid, start, stairs, spots) {
    this._grid = grid;
    this._start = start;
    this._stairs = stairs;
    this._spots = Object.freeze(spots.slice());
    Object.freeze(this);
  }

  get grid() {
    return this._grid;
  }

  get start() {
    return this._start;
  }

  get stairs() {
    return this._stairs;
  }

  get spots() {
    return this._spots;
  }
}

/**
 * Validate that a value is a point.
 */
function isPoint(p) {
  return p && typeof p.x === 'number' && Number.isInteger(p.x) &&
         typeof p.y === 'number' && Number.isInteger(p.y);
}

/**
 * Validate that a value is a tile-grid.
 */
function isTileGrid(g) {
  return g && typeof g.width === 'number' && Number.isInteger(g.width) &&
         g.width >= 1 && typeof g.height === 'number' && Number.isInteger(g.height) &&
         g.height >= 1 && typeof g.at === 'function' &&
         typeof g.tiles === 'function' && typeof g.open === 'function';
}

/**
 * Create a floor-plan.
 * @param {object} options
 * @param {TileGrid} options.grid
 * @param {Point} options.start
 * @param {Point} options.stairs
 * @param {Point[]} options.spots
 * @returns {FloorPlan}
 */
export function of({ grid, start, stairs, spots }) {
  if (!isTileGrid(grid)) {
    throw new TypeError('grid must be a tile-grid');
  }
  if (!isPoint(start)) {
    throw new TypeError('start must be a point');
  }
  if (!isPoint(stairs)) {
    throw new TypeError('stairs must be a point');
  }
  if (!Array.isArray(spots)) {
    throw new TypeError('spots must be an array');
  }
  for (const spot of spots) {
    if (!isPoint(spot)) {
      throw new TypeError('spots must be points');
    }
  }

  if (grid.at(start.x, start.y) !== 'floor') {
    throw new TypeError('start must be on a floor cell');
  }

  if (grid.at(stairs.x, stairs.y) !== 'stairs') {
    throw new TypeError('stairs must be on a stairs cell');
  }

  if (pointEquals(start, stairs)) {
    throw new TypeError('stairs must not equal start');
  }

  const spotSet = new Set();
  for (const spot of spots) {
    if (grid.at(spot.x, spot.y) !== 'floor') {
      throw new TypeError('spot must be on a floor cell');
    }
    if (pointEquals(spot, start)) {
      throw new TypeError('spot must not equal start');
    }
    if (pointEquals(spot, stairs)) {
      throw new TypeError('spot must not equal stairs');
    }
    const key = spot.x + ',' + spot.y;
    if (spotSet.has(key)) {
      throw new TypeError('spots must be distinct');
    }
    spotSet.add(key);
  }

  const spotsCopy = spots.map(s => pointOf(s.x, s.y));
  const fp = new FloorPlan(grid, pointOf(start.x, start.y), pointOf(stairs.x, stairs.y), spotsCopy);
  return fp;
}
