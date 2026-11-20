// stats: an API Shape.

/**
 * Create frozen stats for a creature in a fight.
 * @param {{hp: number, maxHp: number, attack: number, defense: number}} input
 * @returns {{hp: number, maxHp: number, attack: number, defense: number}}
 */
export function of({ hp, maxHp, attack, defense }) {
  if (hp === undefined || maxHp === undefined || attack === undefined || defense === undefined) {
    throw new TypeError("stats: missing required field");
  }

  if (!Number.isInteger(hp) || !Number.isInteger(maxHp) || !Number.isInteger(attack) || !Number.isInteger(defense)) {
    throw new TypeError("stats: values must be integers");
  }

  if (maxHp < 1) {
    throw new TypeError("stats: maxHp must be at least 1");
  }

  if (hp < 0 || hp > maxHp) {
    throw new TypeError("stats: hp must be from 0 to maxHp");
  }

  if (attack < 0 || defense < 0) {
    throw new TypeError("stats: attack and defense must be at least 0");
  }

  return Object.freeze({ hp, maxHp, attack, defense });
}
