# level

What a depth is: the game's 29 floors, as five **themes** of five
dungeon floors each, with a **shop** (internal name `interior`, the
`building-interior` floor) between one theme and the next. Pure: a few
functions of a depth, no state.

| depths | kind | theme |
|---|---|---|
| 1 to 5 | `dungeon` | `dungeon` |
| 6 | `interior` | `interior` |
| 7 to 11 | `dungeon` | `frozen` |
| 12 | `interior` | `interior` |
| 13 to 17 | `dungeon` | `arid` |
| 18 | `interior` | `interior` |
| 19 to 23 | `dungeon` | `temple` |
| 24 | `interior` | `interior` |
| 25 to 29 | `dungeon` | `magma` |

So a depth `d` is a shop when `d % 6 === 0`, and a dungeon floor of the
theme `DUNGEON_THEMES[Math.floor((d - 1) / 6)]` otherwise.

The module (`shapes/level/index.mjs`) exports:

- `MAX_DEPTH`: 29, the last floor (its stairs win the game).
- `THEMES`: `['dungeon', 'frozen', 'arid', 'temple', 'magma',
  'interior']` (a frozen array).
- `DUNGEON_THEMES`: the first five of `THEMES`, in that order (a frozen
  array).
- `kind(depth)`: `'interior'` for a shop, `'dungeon'` otherwise.
- `theme(depth)`: the depth's theme, as the table says.
- `tier(depth)`: `Math.floor((depth - 1) / 6)`, 0 to 4: how many themes
  lie above it (a shop has the tier of the theme before it).
- `stage(depth)`: `(depth - 1) % 6 + 1`: a dungeon floor's place in its
  theme, 1 to 5 (a shop's is 6).
- `round(depth)`: a shop's number, `depth / 6` (1 to 4); 0 for a
  dungeon floor.

Every function refuses a `depth` that is not an integer from 1 to
`MAX_DEPTH` with a `TypeError`.

# Fields:
## Field - MAX_DEPTH:
The export `MAX_DEPTH`.

## Field - THEMES:
The export `THEMES`.

## Field - DUNGEON_THEMES:
The export `DUNGEON_THEMES`.

## Field - kind:
The function `kind(depth)`.

## Field - theme:
The function `theme(depth)`.

## Field - tier:
The function `tier(depth)`.

## Field - stage:
The function `stage(depth)`.

## Field - round:
The function `round(depth)`.

# Intrinsics:
## Intrinsic - valid:
`MAX_DEPTH` is 29; `THEMES` and `DUNGEON_THEMES` are as above and
frozen. `kind(1)`, `kind(5)` and `kind(29)` are `'dungeon'`; `kind(6)`,
`kind(12)`, `kind(18)` and `kind(24)` `'interior'`. `theme(1)` is
`'dungeon'`, `theme(6)` `'interior'`, `theme(7)` `'frozen'`, `theme(13)`
`'arid'`, `theme(23)` `'temple'`, `theme(25)` and `theme(29)` `'magma'`.
`tier(5)` is 0, `tier(6)` 0, `tier(7)` 1, `tier(29)` 4. `stage(1)` is 1,
`stage(11)` 5, `stage(25)` 1, `stage(12)` 6. `round(6)` is 1, `round(24)`
4, `round(7)` 0. `kind(0)`, `theme(30)`, `tier(1.5)` and `stage('3')`
throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
