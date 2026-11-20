// combat: settles one attack from the two fighters' stats and a twenty-sided roll. Pure.

import * as statsShape from "../../shapes/stats/index.mjs";
import * as strikeShape from "../../shapes/strike/index.mjs";

/** `resolve(attacker, defender, roll) -> strike`. `attacker` and `defender` are `stats`; `roll` an integer from 1 to 20; anything else throws a `TypeError`. A roll of 1 always misses. A roll of 20 always hits and is critical: damage `2 * max(1, attacker.attack - defender.defense)`. Any other roll hits when `roll + attacker.attack >= 10 + defender.defense`, for damage `max(1, attacker.attack - defender.defense)`, not critical. A miss has damage 0. Neither stats is changed: the caller applies the damage. */
export function resolve(attacker, defender, roll) {
  const statsOf = (s, who) => {
    if (typeof s !== "object" || s === null || !Object.isFrozen(s)) {
      throw new TypeError(`${who} must be a stats object`);
    }
    for (const f of ["hp", "maxHp", "attack", "defense"]) {
      if (!(f in s) || !Number.isInteger(s[f])) {
        throw new TypeError(`${who} stats must have integer fields hp, maxHp, attack, defense`);
      }
    }
  };

  statsOf(attacker, "attacker");
  statsOf(defender, "defender");

  if (!Number.isInteger(roll) || roll < 1 || roll > 20) {
    throw new TypeError("roll must be an integer from 1 to 20");
  }

  let hit, critical, damage;
  if (roll === 1) {
    hit = false;
    critical = false;
    damage = 0;
  } else if (roll === 20) {
    hit = true;
    critical = true;
    damage = 2 * Math.max(1, attacker.attack - defender.defense);
  } else {
    const threshold = 10 + defender.defense;
    if (roll + attacker.attack >= threshold) {
      hit = true;
      critical = false;
      damage = Math.max(1, attacker.attack - defender.defense);
    } else {
      hit = false;
      critical = false;
      damage = 0;
    }
  }

  return strikeShape.of({ hit, critical, damage });
}
