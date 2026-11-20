# stats

What a creature (the hero or a monster) is in a fight. Immutable.

The module (`shapes/stats/index.mjs`) exports `of({hp, maxHp, attack,
defense})`, answering frozen stats. Every value is an integer; `maxHp`
at least 1; `hp` from 0 to `maxHp` (0: dead); `attack` and `defense`
at least 0. Any other input, a missing key included, is refused with a
`TypeError`.

# Fields:
## Field - hp:
Hit points left. Property `hp`.

## Field - maxHp:
Hit points when whole. Property `maxHp`.

## Field - attack:
Property `attack`.

## Field - defense:
Property `defense`.

# Intrinsics:
## Intrinsic - valid:
`of({hp: 5, maxHp: 10, attack: 3, defense: 1})` has those four values and
is frozen; `hp` 0 is accepted. `hp` 11 with `maxHp` 10, `maxHp` 0,
`attack` -1, `defense` 1.5, and a missing `hp`, each throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
