// combat: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `resolve(attacker, defender, roll) -> strike`. `attacker` and `defender` are `stats`; `roll` an integer from 1 to 20; anything else throws a `TypeError`. A roll of 1 always misses. A roll of 20 always hits and is critical: damage `2 * max(1, attacker.attack - defender.defense)`. Any other roll hits when `roll + attacker.attack >= 10 + defender.defense`, for damage `max(1, attacker.attack - defender.defense)`, not critical. A miss has damage 0. Neither stats is changed: the caller applies the damage. */
export function resolve(...args) {
  throw new Error("not implemented: combat.resolve");
}
