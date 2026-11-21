# save

A save file: the party (each player's name and stats) and the level they
are on (the game's seed and the depth). Nothing else is kept: loading a
save starts that level afresh. Immutable.

**A name** (a player's) is a string of 1 to 16 characters, none of them a
control character (code below 32, or 127), neither its first nor its last
a space. The module's `isName(value)` says whether a value is one; every
shape and Node that checks a name uses it.

The module (`shapes/save/index.mjs`) exports:

- `of({seed, depth, players})`: `seed` an integer from 0 to 4294967295;
  `depth` an integer from 1 to 5; `players` an array of 0 to 4 entries,
  each `{name, stats}`, `name` a name, `stats` a `stats`, no two names
  equal. Answers a frozen save; `players` is copied and answered frozen,
  each entry a frozen `{name, stats}`. Any other input is refused with a
  `TypeError`.
- `fromData(data)`: the save whose `data()` is `data` (the format below),
  checked as `of` checks it; a `TypeError` for anything else.
- `parse(text)`: `fromData(JSON.parse(text))`; text that is not JSON is a
  `TypeError` too.
- `isName(value)`: true for a name, false for anything else.

**The format** (`data()`): `{format: 'crawl-save', version: 1, seed,
depth, players: [{name, stats: {hp, maxHp, attack, defense}}, ...]}`. A
`format` or `version` other than these is refused.

# Fields:
## Field - seed:
Property `seed`.

## Field - depth:
Property `depth`.

## Field - players:
Property `players`, a frozen array of frozen `{name, stats}`.

## Field - data:
`data()` answers the format above as a fresh plain object (plain arrays and
objects, numbers and strings only), so `JSON.stringify` writes it whole.
A method on the prototype, never an own property.

## Field - text:
`text()` answers `JSON.stringify(data(), null, 2)`: the file's contents.
A method on the prototype, never an own property.

# Intrinsics:
## Intrinsic - valid:
`s = of({seed: 9, depth: 3, players: [{name: 'Cy', stats: stats.of({hp: 10, maxHp: 30, attack: 6, defense: 2})}]})`
has those values, is frozen, and `s.players` is frozen.
`parse(s.text())` passes `assert.deepStrictEqual` with `s`, and
`s.data().format` is `'crawl-save'`. `depth: 6`, `seed: -1`, five
players, two players named `'Cy'`, a name `''`, a name of 17 characters,
a name `' Cy'`, a name holding `'\n'`, and stats given as a plain object
each throw a `TypeError`; so do `parse('nope')`, `parse('{}')` and the
text of `s` with `version` 2. `isName('Ann')` is true; `isName('')`,
`isName('Ann ')` and `isName(5)` are false. `players: []` is accepted.

# Callbacks:
None

# API Shapes:
- [shape:stats](stats.md)
