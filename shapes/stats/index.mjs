// stats: an API Shape.

/**
 * Create frozen stats for a creature in a fight.
 * @param {{hp: number, maxHp: number, attack: number, defense: number, range?: number, magic?: number, magicPower?: number, magicResist?: number}} input
 * @returns {{hp: number, maxHp: number, attack: number, defense: number, range: number, magic: number, magicPower: number, magicResist: number}}
 */
export function of({ hp, maxHp, attack, defense, range = 1, magic = 0, magicPower = 1, magicResist = 0 }) {
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

  if (!Number.isInteger(range) || range < 1 || range > 9) {
    throw new TypeError("stats: range must be an integer from 1 to 9");
  }

  if (!Number.isInteger(magic) || magic < 0) {
    throw new TypeError("stats: magic must be an integer of 0 or more");
  }

  if (!Number.isInteger(magicPower) || magicPower < 1) {
    throw new TypeError("stats: magicPower must be an integer of 1 or more");
  }

  if (!Number.isInteger(magicResist) || magicResist < 0) {
    throw new TypeError("stats: magicResist must be an integer of 0 or more");
  }

  return Object.freeze({ hp, maxHp, attack, defense, range, magic, magicPower, magicResist });
}
