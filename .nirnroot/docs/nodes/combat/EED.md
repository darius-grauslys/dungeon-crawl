# combat

Settles one attack from the two fighters' stats and a twenty-sided roll.
Pure.

# API Shapes:
- [shape:stats](../../shapes/stats.md)
- [shape:strike](../../shapes/strike.md)

# Functions:
## Function - resolve:
`resolve(attacker, defender, roll) -> strike`. `attacker` and `defender` are `stats`; `roll` an integer from 1 to 20; anything else throws a `TypeError`. A roll of 1 always misses. A roll of 20 always hits and is critical: damage `2 * max(1, attacker.attack - defender.defense)`. Any other roll hits when `roll + attacker.attack >= 10 + defender.defense`, for damage `max(1, attacker.attack - defender.defense)`, not critical. A miss has damage 0. Neither stats is changed: the caller applies the damage.

# Intrinsics:
## Intrinsic - rolls:
With attacker `{hp: 10, maxHp: 10, attack: 4, defense: 0}` and defender `{hp: 10, maxHp: 10, attack: 0, defense: 1}`: roll 1 is a miss (damage 0, not critical); roll 6 a miss; roll 7 a hit of 3; roll 19 a hit of 3; roll 20 a critical hit of 6.

## Intrinsic - minimum:
With attacker attack 2 and defender defense 5: roll 12 misses (12 + 2 < 10 + 5), roll 13 hits for 1 (13 + 2 = 10 + 5), roll 19 hits for 1, roll 20 is a critical hit of 2.

## Intrinsic - refuses:
A roll of 0, 21, 2.5 or `'7'`, and a plain object in place of either `stats`, throw a `TypeError`.
