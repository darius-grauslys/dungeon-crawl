// The call site for combat: forwards to its surface, nothing else.
// combat's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/combat/index.mjs";

// __nirnroot_begin__ resolve
// `resolve(attacker, defender, roll, ward) -> strike`. `attacker` and `defender` are `stats`; `roll` an integer from 1 to 20; `ward` an integer from 1 to 100; anything else throws a `TypeError`. A roll of 1 always misses. A roll of 20 always hits and is critical: physical damage `2 * max(1, attacker.attack - defender.defense)`. Any other roll hits when `roll + attacker.attack >= 10 + defender.defense`, for physical damage `max(1, attacker.attack - defender.defense)`, not critical. So armor never brings a hit below 1 damage. **An attacker of `attack` 0** (a creature that only casts) deals no physical damage at all: a hit's physical damage is 0, critical or not, and its damage is its magic alone; such an attacker with `magic` 0 misses every roll.
//
// **Magic.** A hit also deals the attacker's `magic` as magic damage (never doubled by a critical, never reduced by `defense`). With `r` the defender's `magicResist` and `p` the attacker's `magicPower`, the **ward chance** is `min(99, floor(100 * min(1, ceil(r)) * max(1, 0.5 * r) / p))` percent: 0 for a defender with no `magicResist`, and never above 99. When the attacker's `magic` is above 0 and `ward <= ` the ward chance, the hit's magic damage is 1 instead of `magic`.
//
// The strike's `damage` is the physical damage plus the magic damage, its `magic` the magic damage. A miss has damage 0 and magic 0 (a miss deals no magic). Neither stats is changed: the caller applies the damage.
// __nirnroot_end__
export function resolve(...args) {
  return target.resolve(...args);
}
