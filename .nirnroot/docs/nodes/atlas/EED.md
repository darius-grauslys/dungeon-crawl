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
| `wall-0` | `sheets/dungeon.png` | 48 | 0 |
| `wall-1` | `sheets/dungeon.png` | 0 | 32 |
| `wall-2` | `sheets/dungeon.png` | 48 | 32 |
| `wall-3` | `sheets/dungeon.png` | 32 | 16 |
| `wall-4` | `sheets/dungeon.png` | 16 | 32 |
| `wall-5` | `sheets/dungeon.png` | 64 | 16 |
| `wall-6` | `sheets/dungeon.png` | 32 | 0 |
| `wall-7` | `sheets/dungeon.png` | 0 | 16 |
| `wall-8` | `sheets/dungeon.png` | 64 | 32 |
| `wall-9` | `sheets/dungeon.png` | 48 | 16 |
| `wall-10` | `sheets/dungeon.png` | 48 | 0 |
| `wall-11` | `sheets/dungeon.png` | 16 | 16 |
| `wall-12` | `sheets/dungeon.png` | 64 | 0 |
| `wall-13` | `sheets/dungeon.png` | 16 | 0 |
| `wall-14` | `sheets/dungeon.png` | 0 | 0 |
| `wall-15` | `sheets/dungeon.png` | 80 | 0 |

The sixteen `wall-<m>` are the wall's joins, for drawing walls as
connected pieces: `m` (0 to 15) says which of the wall's four
neighbours are walls too, as the sum of 1 (up), 2 (right), 4 (down) and
8 (left). So `wall-6` is a top-left corner (walls right and down),
`wall-10` a straight piece from left to right, `wall-5` one from top to
bottom, `wall-15` a crossing, `wall-14` a T (walls left, right and down), `wall-1` the
bottom end of a wall that goes up, and `wall-0` a lone pillar.

Every sprite is 16 by 16.

# API Shapes:
- [shape:sprite](../../shapes/sprite.md)

# Functions:
## Function - load:
`load(base) -> promise`. `base` a URL prefix ending in `/` (the page's is `/assets/`); each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all five are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves.

## Function - sprite:
`sprite(name) -> sprite`. The `sprite` for a name of the table: its `image` the keyed sheet (a canvas), its rectangle the table's, 16 by 16. Before a `load` has resolved, answers `null`. A name not in the table throws a `TypeError`, loaded or not.

## Function - names:
`names() -> array`. The twenty-nine names, in the table's order, a fresh array each call.

# Intrinsics:
## Intrinsic - table:
`names()` is the table's names in order. Before any `load`, `sprite('hero')` is `null`; `sprite('dragon')` throws a `TypeError`. After `load('/assets/')` resolves, each name's sprite has the table's `sx`, `sy`, `sw` 16 and `sh` 16. `names()` has 29 names, `wall-0` to `wall-15` the last sixteen in order; `sprite('wall-6')` has `sx` 32 and `sy` 0, `sprite('wall-9')` `sx` 48 and `sy` 16; `sprite('wall-16')` throws a `TypeError`.

## Intrinsic - keyed:
After `load('/assets/')`, on a canvas filled with pure green (0, 255, 0), drawing `sprite('hero')` at (0, 0) at its own size leaves the pixel (0, 0) pure green (the sheet's background there is transparent), and leaves at least 20 of the 256 pixels not pure green (the hero is drawn).

## Intrinsic - fails:
`load('/nowhere/')` rejects with an `Error` whose message contains `sheets/`.
