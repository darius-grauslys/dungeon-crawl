# stats

What a creature (the hero or a monster) is in a fight. Immutable.

The module (`shapes/stats/index.mjs`) exports `of({hp, maxHp, attack,
defense, range, magic, magicPower, magicResist})`, answering frozen
stats, a plain frozen object with those eight keys. Every value is an
integer; `maxHp` at least 1; `hp` from 0 to `maxHp` (0: dead); `attack`
and `defense` at least 0; `range` from 1 to 9 (left out: 1): how many
cells away, in a straight line, the creature can attack; `magic` at
least 0 (left out: 0): the magic damage each of its hits adds, which
armor never reduces; `magicPower` at least 1 (left out: 1): how hard its
magic is to resist; `magicResist` at least 0 (left out: 0): how well it
resists magic (`combat` says how). Any other input, a missing key (but
`range`, `magic`, `magicPower` and `magicResist`) included, is refused
with a `TypeError`.

# Fields:
## Field - hp:
Hit points left. Property `hp`.

## Field - maxHp:
Hit points when whole. Property `maxHp`.

## Field - attack:
Property `attack`.

## Field - defense:
Property `defense`.

## Field - range:
Property `range`.

## Field - magic:
Property `magic`.

## Field - magicPower:
Property `magicPower`.

## Field - magicResist:
Property `magicResist`.

# Intrinsics:
## Intrinsic - valid:
`of({hp: 5, maxHp: 10, attack: 3, defense: 1})` has those four values,
`range` 1, `magic` 0, `magicPower` 1 and `magicResist` 0, and is frozen,
deep equal to `{hp: 5, maxHp: 10, attack: 3, defense: 1, range: 1,
magic: 0, magicPower: 1, magicResist: 0}`; `hp` 0 is accepted; with
`range: 4`, `range` is 4; with `magic: 6, magicPower: 2, magicResist:
3`, those three. `hp` 11 with `maxHp` 10, `maxHp` 0, `attack` -1,
`defense` 1.5, `range` 0, `range` 10, `magic` -1, `magicPower` 0,
`magicResist` -1 or 0.5, and a missing `hp`, each throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
