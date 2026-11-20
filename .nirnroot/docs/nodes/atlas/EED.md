# atlas

The game's pictures: it loads the five sprite sheets and answers where
each named picture is. Runs in a browser.

The sheets are 16-pixel pixel art on an opaque background colour,
rgb(22, 13, 19): the atlas makes every pixel of exactly that colour fully
transparent, so a sprite drawn over the floor shows the floor around it.

| name | sheet | sx | sy |
|---|---|---|---|
| `wall` | `sheets/dungeon.png` | 48 | 16 |
| `floor` | `sheets/floor.png` | 0 | 48 |
| `stairs` | `sheets/dungeon.png` | 0 | 96 |
| `hero` | `sheets/heroes.png` | 0 | 0 |
| `skeleton` | `sheets/monsters.png` | 0 | 0 |
| `slime` | `sheets/monsters.png` | 0 | 48 |
| `snake` | `sheets/monsters.png` | 0 | 64 |
| `bat` | `sheets/monsters.png` | 128 | 0 |
| `demon` | `sheets/monsters.png` | 128 | 32 |
| `potion` | `sheets/items.png` | 64 | 0 |
| `gold` | `sheets/items.png` | 48 | 80 |
| `sword` | `sheets/items.png` | 64 | 16 |
| `armor` | `sheets/items.png` | 64 | 48 |

Every sprite is 16 by 16.

# API Shapes:
- [shape:sprite](../../shapes/sprite.md)

# Functions:
## Function - load:
`load(base) -> promise`. `base` a URL prefix ending in `/` (the page's is `/assets/`); each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all five are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves.

## Function - sprite:
`sprite(name) -> sprite`. The `sprite` for a name of the table: its `image` the keyed sheet (a canvas), its rectangle the table's, 16 by 16. Before a `load` has resolved, answers `null`. A name not in the table throws a `TypeError`, loaded or not.

## Function - names:
`names() -> array`. The thirteen names, in the table's order, a fresh array each call.

# Intrinsics:
## Intrinsic - table:
`names()` is the table's names in order. Before any `load`, `sprite('hero')` is `null`; `sprite('dragon')` throws a `TypeError`. After `load('/assets/')` resolves, each name's sprite has the table's `sx`, `sy`, `sw` 16 and `sh` 16.

## Intrinsic - keyed:
After `load('/assets/')`, on a canvas filled with pure green (0, 255, 0), drawing `sprite('hero')` at (0, 0) at its own size leaves the pixel (0, 0) pure green (the sheet's background there is transparent), and leaves at least 20 of the 256 pixels not pure green (the hero is drawn).

## Intrinsic - fails:
`load('/nowhere/')` rejects with an `Error` whose message contains `sheets/`.
