// item: an API Shape, a thing lying on the floor that the hero picks up by stepping on it.

import { of as pointOf } from '../point/index.mjs';

/** The seventeen kind names, in the table's order. */
export const KINDS = Object.freeze(['potion', 'gold', 'sword', 'armor', 'ring', 'necklace', 'lever', 'bread', 'meat', 'cheese', 'sword-2', 'sword-3', 'sword-4', 'armor-2', 'armor-3', 'armor-4', 'web']);

/**
 * Create an immutable item.
 * @param {object} spec - the item specification
 * @param {number} spec.id - an integer of 0 or more
 * @param {string} spec.kind - one of KINDS
 * @param {Point} spec.pos - a point
 * @param {number} [spec.amount] - an integer, at least 1 for gold, 0 otherwise
 * @param {number} [spec.price] - an integer of 0 or more, 0 for a gold, a lever and a web
 * @param {boolean} [spec.pulled] - a boolean, false for any kind but lever
 * @param {{x:number,y:number,at:number}|null} [spec.flung] - null or {x,y,at}
 * @returns {Item} a frozen item
 */
export function of({ id, kind, pos, amount, price, pulled, flung }) {
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 0) {
    throw new TypeError('item id must be an integer of 0 or more');
  }
  if (!KINDS.includes(kind)) {
    throw new TypeError(`item kind must be one of ${KINDS.join(', ')}`);
  }
  const p = pointOf(pos?.x, pos?.y);
  let amt;
  if (amount === undefined) {
    amt = 0;
  } else if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    throw new TypeError('item amount must be an integer');
  } else {
    amt = amount;
  }
  if (kind === 'gold') {
    if (amt < 1) {
      throw new TypeError('gold amount must be at least 1');
    }
  } else if (amt !== 0) {
    throw new TypeError(`amount must be 0 for kind ${kind}`);
  }
  let prc;
  if (price === undefined) {
    prc = 0;
  } else if (typeof price !== 'number' || !Number.isInteger(price) || price < 0) {
    throw new TypeError('item price must be an integer of 0 or more');
  } else {
    prc = price;
  }
  if ((kind === 'gold' || kind === 'lever' || kind === 'web') && prc !== 0) {
    throw new TypeError(`${kind} price must be 0`);
  }
  let isPulled;
  if (pulled === undefined) {
    isPulled = false;
  } else if (typeof pulled !== 'boolean') {
    throw new TypeError('item pulled must be a boolean');
  } else {
    isPulled = pulled;
  }
  if (isPulled && kind !== 'lever') {
    throw new TypeError('only a lever may be pulled');
  }
  let flungCopy = null;
  if (flung === undefined || flung === null) {
    flungCopy = null;
  } else if (typeof flung !== 'object') {
    throw new TypeError('item flung must be null or {x, y, at}');
  } else {
    const keys = Object.keys(flung);
    if (keys.length !== 3 || !keys.includes('x') || !keys.includes('y') || !keys.includes('at')) {
      throw new TypeError('item flung must be {x, y, at}');
    }
    if (typeof flung.x !== 'number' || !Number.isInteger(flung.x) || flung.x < 0 ||
        typeof flung.y !== 'number' || !Number.isInteger(flung.y) || flung.y < 0 ||
        typeof flung.at !== 'number' || !Number.isInteger(flung.at) || flung.at < 0) {
      throw new TypeError('item flung coordinates must be integers of 0 or more');
    }
    flungCopy = Object.freeze({ x: flung.x, y: flung.y, at: flung.at });
  }
  return Object.freeze({ id, kind, pos: p, amount: amt, price: prc, pulled: isPulled, flung: flungCopy });
}
