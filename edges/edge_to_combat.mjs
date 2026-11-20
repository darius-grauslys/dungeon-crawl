// The call site for combat: forwards to its surface, nothing else.
// combat's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/combat/index.mjs";

// __nirnroot_begin__ resolve
// `resolve(attacker, defender, roll) -> strike`. `attacker` and `defender` are `stats`; `roll` an integer from 1 to 20; anything else throws a `TypeError`. A roll of 1 always misses. A roll of 20 always hits and is critical: damage `2 * max(1, attacker.attack - defender.defense)`. Any other roll hits when `roll + attacker.attack >= 10 + defender.defense`, for damage `max(1, attacker.attack - defender.defense)`, not critical. A miss has damage 0. Neither stats is changed: the caller applies the damage.
// __nirnroot_end__
export function resolve(...args) {
  return target.resolve(...args);
}
