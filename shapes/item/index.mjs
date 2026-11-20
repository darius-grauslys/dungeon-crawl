// item: an API Shape, a thing lying on the floor that the hero picks up by stepping on it.

import { of as pointOf } from '../point/index.mjs';

/** The four kind names, in the table's order. */
export const KINDS = Object.freeze(['potion', 'gold', 'sword', 'armor']);

/**
 * Create an immutable item.
 * @param {object} spec - the item specification
 * @param {number} spec.id - an integer of 0 or more
 * @param {string} spec.kind - one of KINDS
 * @param {Point} spec.pos - a point
 * @param {number} [spec.amount] - an integer, at least 1 for gold, 0 otherwise
 * @returns {Item} a frozen item
 */
export function of({ id, kind, pos, amount }) {
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
  return Object.freeze({ id, kind, pos: p, amount: amt });
}
