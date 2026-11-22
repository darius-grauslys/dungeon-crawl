// strike: an API Shape.

/**
 * Build a strike from {hit, critical, damage, magic}.
 * hit and critical are booleans, damage is an integer of 0 or more,
 * magic is an integer from 0 to damage (left out: 0), the part of damage that is magic.
 * A miss (hit false) has critical false, damage 0 and magic 0; a hit has damage at least 1.
 * Any other input is refused with a TypeError.
 */
export function of({ hit, critical, damage, magic }) {
  if (typeof hit !== "boolean") {
    throw new TypeError("strike: hit must be a boolean");
  }
  if (typeof critical !== "boolean") {
    throw new TypeError("strike: critical must be a boolean");
  }
  if (typeof damage !== "number" || !Number.isInteger(damage) || damage < 0) {
    throw new TypeError("strike: damage must be an integer of 0 or more");
  }
  if (magic === undefined) {
    magic = 0;
  }
  if (typeof magic !== "number" || !Number.isInteger(magic) || magic < 0) {
    throw new TypeError("strike: magic must be an integer of 0 or more");
  }
  if (magic > damage) {
    throw new TypeError("strike: magic must not exceed damage");
  }

  if (!hit) {
    if (critical !== false) {
      throw new TypeError("strike: a miss has critical false");
    }
    if (damage !== 0) {
      throw new TypeError("strike: a miss has damage 0");
    }
    if (magic !== 0) {
      throw new TypeError("strike: a miss has magic 0");
    }
  } else if (damage < 1) {
    throw new TypeError("strike: a hit has damage at least 1");
  }

  const strike = { hit, critical, damage, magic };
  return Object.freeze(strike);
}
