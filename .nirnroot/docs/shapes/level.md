# level

What a depth is: the game's 33 floors, as five **themes** of five
dungeon floors each, and, between one theme and the next, a **shop**
(internal name `interior`, the `building-interior` floor) and then a
**boss** floor (the lair). Pure: a few functions of a depth, no state.

The depth is the game's internal count of floors. The players see the
**level**: only the 25 dungeon floors are numbered (1 to 25); a shop or
a lair has no number.

| depths | kind | theme | levels |
|---|---|---|---|
| 1 to 5 | `dungeon` | `dungeon` | 1 to 5 |
| 6 | `interior` | `interior` | |
| 7 | `boss` | `dungeon` (blended with `frozen`) | |
| 8 to 12 | `dungeon` | `frozen` | 6 to 10 |
| 13 | `interior` | `interior` | |
| 14 | `boss` | `frozen` (blended with `arid`) | |
| 15 to 19 | `dungeon` | `arid` | 11 to 15 |
| 20 | `interior` | `interior` | |
| 21 | `boss` | `arid` (blended with `temple`) | |
| 22 to 26 | `dungeon` | `temple` | 16 to 20 |
| 27 | `interior` | `interior` | |
| 28 | `boss` | `temple` (blended with `magma`) | |
| 29 to 33 | `dungeon` | `magma` | 21 to 25 |

So with `tier = Math.floor((d - 1) / 7)` and `stage = (d - 1) % 7 + 1`,
a depth `d` is a dungeon floor of the theme `DUNGEON_THEMES[tier]` for a
stage of 1 to 5, a shop for stage 6, and a lair for stage 7.

The module (`shapes/level/index.mjs`) exports:

- `MAX_DEPTH`: 33, the last floor (its stairs win the game).
- `MAX_LEVEL`: 25, the last level's number.
- `THEMES`: `['dungeon', 'frozen', 'arid', 'temple', 'magma',
  'interior']` (a frozen array).
- `DUNGEON_THEMES`: the first five of `THEMES`, in that order (a frozen
  array).
- `kind(depth)`: `'dungeon'`, `'interior'` (a shop) or `'boss'` (a lair).
- `theme(depth)`: the depth's theme, as the table says: a dungeon
  floor's theme, `'interior'` for a shop, and for a lair the theme of
  the dungeon floors before it.
- `blend(depth)`: for a lair, a frozen array of two themes, the one
  before it and the one after it (`blend(7)` is `['dungeon', 'frozen']`);
  `null` for any other depth.
- `tier(depth)`: `Math.floor((depth - 1) / 7)`, 0 to 4: how many themes
  lie above it (a shop and a lair have the tier of the theme before them).
- `stage(depth)`: `(depth - 1) % 7 + 1`: a dungeon floor's place in its
  theme, 1 to 5; a shop's is 6, a lair's 7.
- `round(depth)`: a shop's or a lair's number, `tier + 1` (1 to 4); 0
  for a dungeon floor.
- `number(depth)`: a dungeon floor's level, `tier * 5 + stage` (1 to
  25); 0 for a shop or a lair.
- `label(depth)`: what the players are told the floor is: `'Level <n>'`
  for a dungeon floor (`n` its `number`), `'Shop'` for a shop, `'Lair'`
  for a lair.

Every function refuses a `depth` that is not an integer from 1 to
`MAX_DEPTH` with a `TypeError`.

# Fields:
## Field - MAX_DEPTH:
The export `MAX_DEPTH`.

## Field - MAX_LEVEL:
The export `MAX_LEVEL`.

## Field - THEMES:
The export `THEMES`.

## Field - DUNGEON_THEMES:
The export `DUNGEON_THEMES`.

## Field - kind:
The function `kind(depth)`.

## Field - theme:
The function `theme(depth)`.

## Field - blend:
The function `blend(depth)`.

## Field - tier:
The function `tier(depth)`.

## Field - stage:
The function `stage(depth)`.

## Field - round:
The function `round(depth)`.

## Field - number:
The function `number(depth)`.

## Field - label:
The function `label(depth)`.

# Intrinsics:
## Intrinsic - valid:
`MAX_DEPTH` is 33 and `MAX_LEVEL` 25; `THEMES` and `DUNGEON_THEMES` are
as above and frozen. `kind(1)`, `kind(5)`, `kind(8)` and `kind(33)` are
`'dungeon'`; `kind(6)`, `kind(13)`, `kind(20)` and `kind(27)`
`'interior'`; `kind(7)`, `kind(14)`, `kind(21)` and `kind(28)` `'boss'`.
`theme(1)` is `'dungeon'`, `theme(6)` `'interior'`, `theme(7)`
`'dungeon'`, `theme(8)` `'frozen'`, `theme(15)` `'arid'`, `theme(26)`
`'temple'`, `theme(28)` `'temple'`, `theme(29)` and `theme(33)`
`'magma'`. `blend(7)` is `['dungeon', 'frozen']` and frozen, `blend(28)`
`['temple', 'magma']`, `blend(6)` and `blend(8)` `null`. `tier(5)`,
`tier(6)` and `tier(7)` are 0, `tier(8)` 1, `tier(33)` 4. `stage(1)` is
1, `stage(12)` 5, `stage(13)` 6, `stage(14)` 7, `stage(29)` 1. `round(6)`
and `round(7)` are 1, `round(27)` 4, `round(8)` 0. `number(1)` is 1,
`number(5)` 5, `number(8)` 6, `number(12)` 10, `number(33)` 25,
`number(6)` and `number(7)` 0. `label(8)` is `'Level 6'`, `label(13)`
`'Shop'`, `label(14)` `'Lair'`. `kind(0)`, `theme(34)`, `tier(1.5)`,
`blend(40)`, `number('3')` and `label(null)` throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
