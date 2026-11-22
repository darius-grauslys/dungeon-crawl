// combat: settles one attack from the two fighters' stats and a twenty-sided roll. Pure.

import * as statsShape from "../../shapes/stats/index.mjs";
import * as strikeShape from "../../shapes/strike/index.mjs";

/** `resolve(attacker, defender, roll, ward) -> strike`. `attacker` and `defender` are `stats`; `roll` an integer from 1 to 20; `ward` an integer from 1 to 100; anything else throws a `TypeError`. A roll of 1 always misses. A roll of 20 always hits and is critical: physical damage `2 * max(1, attacker.attack - defender.defense)`. Any other roll hits when `roll + attacker.attack >= 10 + defender.defense`, for physical damage `max(1, attacker.attack - defender.defense)`, not critical. So armor never brings a hit below 1 damage.

**Magic.** A hit also deals the attacker's `magic` as magic damage (never doubled by a critical, never reduced by `defense`). With `r` the defender's `magicResist` and `p` the attacker's `magicPower`, the **ward chance** is `min(99, floor(100 * min(1, ceil(r)) * max(1, 0.5 * r) / p))` percent: 0 for a defender with no `magicResist`, and never above 99. When the attacker's `magic` is above 0 and `ward <= ` the ward chance, the hit's magic damage is 1 instead of `magic`.

The strike's `damage` is the physical damage plus the magic damage, its `magic` the magic damage. A miss has damage 0 and magic 0 (a miss deals no magic). Neither stats is changed: the caller applies the damage. */
export function resolve(attacker, defender, roll, ward) {
  const statsOf = (s, who) => {
    if (typeof s !== "object" || s === null || !Object.isFrozen(s)) {
      throw new TypeError(`${who} must be a stats object`);
    }
    for (const f of ["hp", "maxHp", "attack", "defense", "range", "magic", "magicPower", "magicResist"]) {
      if (!(f in s) || !Number.isInteger(s[f])) {
        throw new TypeError(`${who} stats must have integer fields hp, maxHp, attack, defense, range, magic, magicPower, magicResist`);
      }
    }
  };

  statsOf(attacker, "attacker");
  statsOf(defender, "defender");

  if (!Number.isInteger(roll) || roll < 1 || roll > 20) {
    throw new TypeError("roll must be an integer from 1 to 20");
  }

  if (!Number.isInteger(ward) || ward < 1 || ward > 100) {
    throw new TypeError("ward must be an integer from 1 to 100");
  }

  let hit, critical, physicalDamage;
  if (roll === 1) {
    hit = false;
    critical = false;
    physicalDamage = 0;
  } else if (roll === 20) {
    hit = true;
    critical = true;
    physicalDamage = 2 * Math.max(1, attacker.attack - defender.defense);
  } else {
    const threshold = 10 + defender.defense;
    if (roll + attacker.attack >= threshold) {
      hit = true;
      critical = false;
      physicalDamage = Math.max(1, attacker.attack - defender.defense);
    } else {
      hit = false;
      critical = false;
      physicalDamage = 0;
    }
  }

  let magicDamage = 0;
  if (hit) {
    const r = defender.magicResist;
    const p = attacker.magicPower;
    const chance = Math.min(99, Math.floor(100 * Math.min(1, Math.ceil(r)) * Math.max(1, 0.5 * r) / p));
    if (attacker.magic > 0 && ward <= chance) {
      magicDamage = 1;
    } else {
      magicDamage = attacker.magic;
    }
  }

  const damage = physicalDamage + magicDamage;
  return strikeShape.of({ hit, critical, damage, magic: magicDamage });
}
