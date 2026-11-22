// floor-plan: an API Shape, a freshly generated dungeon floor, before anything lives on it.

import { of as pointOf, equals as pointEquals } from '../point/index.mjs';

/**
 * A floor-plan shape instance.
 */
export class FloorPlan {
  constructor(grid, start, stairs, spots, boss, levers) {
    this._grid = grid;
    this._start = start;
    this._stairs = stairs;
    this._spots = Object.freeze(spots.slice());
    this._boss = boss;
    this._levers = Object.freeze(levers.slice());
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

  get boss() {
    return this._boss;
  }

  get levers() {
    return this._levers;
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
 * @param {Point|null} options.boss
 * @param {Point[]} options.levers
 * @returns {FloorPlan}
 */
export function of({ grid, start, stairs, spots, boss, levers }) {
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

  if (boss === undefined) {
    boss = null;
  }
  if (boss !== null && !isPoint(boss)) {
    throw new TypeError('boss must be a point or null');
  }

  if (levers === undefined) {
    levers = [];
  }
  if (!Array.isArray(levers)) {
    throw new TypeError('levers must be an array');
  }
  for (const lever of levers) {
    if (!isPoint(lever)) {
      throw new TypeError('levers must be points');
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

  let bossSquareCells = null;
  if (boss !== null) {
    bossSquareCells = new Set();
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const bx = boss.x + dx;
        const by = boss.y + dy;
        const kind = grid.at(bx, by);
        if (kind !== 'floor' && kind !== 'stairs') {
          throw new TypeError('boss square must be floor or stairs cells');
        }
        const bkey = bx + ',' + by;
        bossSquareCells.add(bkey);
        if (bx === start.x && by === start.y) {
          throw new TypeError('boss square must not contain start');
        }
        for (const spot of spots) {
          if (spot.x === bx && spot.y === by) {
            throw new TypeError('boss square must not contain a spot');
          }
        }
      }
    }
  }

  const spotKeySet = new Set();
  for (const spot of spots) {
    spotKeySet.add(spot.x + ',' + spot.y);
  }

  const leverSet = new Set();
  for (const lever of levers) {
    if (grid.at(lever.x, lever.y) !== 'floor') {
      throw new TypeError('lever must be on a floor cell');
    }
    if (lever.x === start.x && lever.y === start.y) {
      throw new TypeError('lever must not equal start');
    }
    if (lever.x === stairs.x && lever.y === stairs.y) {
      throw new TypeError('lever must not equal stairs');
    }
    const lkey = lever.x + ',' + lever.y;
    if (spotKeySet.has(lkey)) {
      throw new TypeError('lever must not be a spot');
    }
    if (bossSquareCells && bossSquareCells.has(lkey)) {
      throw new TypeError('lever must not be a boss square cell');
    }
    if (leverSet.has(lkey)) {
      throw new TypeError('levers must be distinct');
    }
    leverSet.add(lkey);
  }

  const spotsCopy = spots.map(s => pointOf(s.x, s.y));
  const leversCopy = levers.map(l => pointOf(l.x, l.y));
  const bossPoint = boss !== null ? pointOf(boss.x, boss.y) : null;
  const fp = new FloorPlan(grid, pointOf(start.x, start.y), pointOf(stairs.x, stairs.y), spotsCopy, bossPoint, leversCopy);
  return fp;
}
