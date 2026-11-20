// strike: an API Shape.

/**
 * Build a strike from {hit, critical, damage}.
 * hit and critical are booleans, damage is an integer of 0 or more.
 * A miss (hit false) has critical false and damage 0; a hit has damage at least 1.
 * Any other input is refused with a TypeError.
 */
export function of({ hit, critical, damage }) {
  if (typeof hit !== "boolean") {
    throw new TypeError("strike: hit must be a boolean");
  }
  if (typeof critical !== "boolean") {
    throw new TypeError("strike: critical must be a boolean");
  }
  if (typeof damage !== "number" || !Number.isInteger(damage) || damage < 0) {
    throw new TypeError("strike: damage must be an integer of 0 or more");
  }

  if (!hit) {
    if (critical !== false) {
      throw new TypeError("strike: a miss has critical false");
    }
    if (damage !== 0) {
      throw new TypeError("strike: a miss has damage 0");
    }
  } else if (damage < 1) {
    throw new TypeError("strike: a hit has damage at least 1");
  }

  const strike = { hit, critical, damage };
  return Object.freeze(strike);
}
