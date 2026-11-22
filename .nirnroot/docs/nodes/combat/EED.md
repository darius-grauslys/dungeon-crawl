# combat

Settles one attack from the two fighters' stats, a twenty-sided roll
and a hundred-sided ward roll. Pure.

# API Shapes:
- [shape:stats](../../shapes/stats.md)
- [shape:strike](../../shapes/strike.md)

# Functions:
## Function - resolve:
`resolve(attacker, defender, roll, ward) -> strike`. `attacker` and `defender` are `stats`; `roll` an integer from 1 to 20; `ward` an integer from 1 to 100; anything else throws a `TypeError`. A roll of 1 always misses. A roll of 20 always hits and is critical: physical damage `2 * max(1, attacker.attack - defender.defense)`. Any other roll hits when `roll + attacker.attack >= 10 + defender.defense`, for physical damage `max(1, attacker.attack - defender.defense)`, not critical. So armor never brings a hit below 1 damage.

**Magic.** A hit also deals the attacker's `magic` as magic damage (never doubled by a critical, never reduced by `defense`). With `r` the defender's `magicResist` and `p` the attacker's `magicPower`, the **ward chance** is `min(99, floor(100 * min(1, ceil(r)) * max(1, 0.5 * r) / p))` percent: 0 for a defender with no `magicResist`, and never above 99. When the attacker's `magic` is above 0 and `ward <= ` the ward chance, the hit's magic damage is 1 instead of `magic`.

The strike's `damage` is the physical damage plus the magic damage, its `magic` the magic damage. A miss has damage 0 and magic 0 (a miss deals no magic). Neither stats is changed: the caller applies the damage.

# Intrinsics:
## Intrinsic - rolls:
With attacker `{hp: 10, maxHp: 10, attack: 4, defense: 0}` and defender `{hp: 10, maxHp: 10, attack: 0, defense: 1}`, ward 50: roll 1 is a miss (damage 0, magic 0, not critical); roll 6 a miss; roll 7 a hit of 3; roll 19 a hit of 3; roll 20 a critical hit of 6; every `magic` 0.

## Intrinsic - minimum:
With attacker attack 2 and defender defense 5, ward 50: roll 12 misses (12 + 2 < 10 + 5), roll 13 hits for 1 (13 + 2 = 10 + 5), roll 19 hits for 1, roll 20 is a critical hit of 2.

## Intrinsic - magic:
With attacker `{attack: 12, defense: 12, magic: 6, magicPower: 2}` and defender `{attack: 4, defense: 1}` (no `magicResist`), ward 1: roll 19 hits for 17 (11 physical, 6 magic: `magic` 6); roll 20 is a critical hit of 28 (22 physical, 6 magic); roll 1 misses (damage 0, magic 0). Against defender defense 20 (and no `magicResist`), roll 20 is a critical hit of 8 (2 physical, 6 magic).

## Intrinsic - ward:
With the same attacker (`magicPower` 2) and roll 19: against a defender of defense 1 and `magicResist` 1 (ward chance `floor(100 * 1 * 1 / 2)` = 50), ward 50 gives damage 12 (`magic` 1) and ward 51 damage 17 (`magic` 6); `magicResist` 3 (chance `floor(100 * 1.5 / 2)` = 75): ward 75 gives `magic` 1, ward 76 `magic` 6; `magicResist` 4 (chance 100, capped at 99): ward 99 gives `magic` 1, ward 100 `magic` 6. With an attacker of `magicPower` 1 and `magic` 6 against `magicResist` 1 (chance 99): ward 99 `magic` 1, ward 100 `magic` 6. An attacker of `magic` 0 against `magicResist` 1, ward 1: `magic` 0.

## Intrinsic - refuses:
A roll of 0, 21, 2.5 or `'7'`, a ward of 0, 101, 1.5 or `'7'`, and a plain object in place of either `stats`, throw a `TypeError`.
