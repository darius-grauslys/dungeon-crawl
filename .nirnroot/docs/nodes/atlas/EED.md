# atlas

The game's pictures: it loads the twenty sprite sheets and answers where
each named picture is, and each theme's terrain tiles. Runs in a browser.

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
| `slime` | `sheets/monsters.png` | 64 | 48 |
| `snake` | `sheets/monsters.png` | 0 | 64 |
| `bat` | `sheets/monsters.png` | 128 | 0 |
| `demon` | `sheets/monsters.png` | 128 | 32 |
| `potion` | `sheets/items.png` | 64 | 0 |
| `gold` | `sheets/items.png` | 48 | 80 |
| `sword` | `sheets/items.png` | 64 | 16 |
| `armor` | `sheets/items.png` | 64 | 48 |
| `archer` | `sheets/monsters.png` | 64 | 0 |
| `blue-slime` | `sheets/monsters.png` | 0 | 48 |
| `blue-snake` | `sheets/frozen-monsters.png` | 0 | 16 |
| `golem` | `sheets/monsters.png` | 64 | 112 |
| `beetle` | `sheets/arid-monsters.png` | 0 | 0 |
| `mummy` | `sheets/arid-monsters.png` | 0 | 48 |
| `cultist` | `sheets/arid-monsters.png` | 0 | 32 |
| `spider` | `sheets/temple-monsters.png` | 128 | 16 |
| `ghost` | `sheets/temple-monsters.png` | 64 | 32 |
| `reaper` | `sheets/temple-monsters.png` | 128 | 32 |
| `worm` | `sheets/magma-monsters.png` | 0 | 48 |
| `fire-slime` | `sheets/magma-monsters.png` | 64 | 48 |
| `imp` | `sheets/magma-monsters.png` | 64 | 32 |
| `lever` | `sheets/generics.png` | 16 | 80 |
| `lever-pulled` | `sheets/generics.png` | 32 | 80 |
| `ring` | `sheets/items.png` | 0 | 64 |
| `necklace` | `sheets/items.png` | 128 | 64 |
| `mage` | `sheets/monsters.png` | 0 | 16 |
| `swordsman` | `sheets/monsters.png` | 64 | 16 |
| `blue-spider` | `sheets/monsters.png` | 64 | 96 |
| `serpent` | `sheets/frozen-monsters.png` | 0 | 16 |
| `bread` | `sheets/items.png` | 0 | 144 |
| `meat` | `sheets/items.png` | 16 | 144 |
| `cheese` | `sheets/items.png` | 32 | 144 |
| `sword-2` | `sheets/items.png` | 80 | 16 |
| `sword-3` | `sheets/items.png` | 0 | 16 |
| `sword-4` | `sheets/items.png` | 16 | 16 |
| `armor-2` | `sheets/items.png` | 0 | 48 |
| `armor-3` | `sheets/items.png` | 16 | 48 |
| `armor-4` | `sheets/items.png` | 32 | 48 |
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

**Themes.** Each floor is drawn in its theme's terrain: its `floor`,
its `stairs` and its sixteen `wall-<m>`. A theme's `wall-<m>` lies on
its wall sheet at the same `sx` and `sy` as the table's `wall-<m>` (the
sheets share the layout of their walls); its `floor` and `stairs` where
this table says:

| theme | wall sheet | floor | stairs |
|---|---|---|---|
| `dungeon` | `sheets/dungeon.png` | `sheets/floor.png` 0, 48 | `sheets/dungeon.png` 0, 96 |
| `frozen` | `sheets/frozen.png` | `sheets/frozen-floor.png` 0, 48 | `sheets/frozen.png` 16, 256 |
| `arid` | `sheets/arid.png` | `sheets/arid-floor.png` 0, 0 | `sheets/arid.png` 0, 352 |
| `temple` | `sheets/temple.png` | `sheets/temple-floor.png` 0, 0 | `sheets/temple.png` 16, 256 |
| `magma` | `sheets/magma.png` | `sheets/magma-floor.png` 0, 0 | `sheets/magma.png` 0, 112 |
| `interior` | `sheets/interior.png` | `sheets/interior-floor.png` 224, 112 | `sheets/dungeon.png` 32, 96 |

So the `dungeon` theme's tiles are the table's `floor`, `stairs` and
`wall-<m>`. The twenty sheets are the ten of the first table and the ten
of this one (`dungeon.png` and `floor.png` in both); each is loaded
once, and keyed as above.

Every sprite is 16 by 16.

**Animations.** A creature is drawn as a frame of one of its
animations (`pose`). An animation is a list of frames, each a 16 by 16
rectangle; frame `f` of an animation of `n` frames is its `f`-th.

*Monsters.* Each monster's only animation is `idle`: 3 frames side by
side, at its table's `sx`, `sx + 16` and `sx + 32`, all at its table's
`sy`, on its sheet. The monsters are the twenty-two of `bestiary`'s
`KINDS` (every name of the table that is one).

*Heroes.* `sheets/heroes.png` holds four **colour** variations of the
hero (`colour` 0 to 3), each in a block 64 pixels wide (`colour * 64`
from the left), and six **groups** (`group` 0 to 5, by what the hero
holds; 0 is empty-handed), each 240 pixels tall (`group * 240` from the
top). Within a group and a colour, an animation's frames lie at `sx =
colour * 64 + 16 c` and `sy = group * 240 + r`, for these rows `r` and
columns `c`, in this order:

| animation | frames: row `r` (columns `c`) | count |
|---|---|---|
| `idle` | 0 (0, 1, 2) | 3 |
| `sleep` | 32 (0, 1), then 48 (0, 1) | 4 |
| `debuff` | 80 (0, 1), then 96 (0, 1) | 4 |
| `power_up` | 128 (0, 1, 2), then 144 (0, 1, 2) | 6 |
| `stun` | 176 (0, 1), then 192 (0, 1, 2) | 5 |

So `idle` of group 0 and colour 0 is the table's `hero` at (0, 0), then
(16, 0) and (32, 0); `power_up` of colour 1 has its fourth frame at
(64, 144). (The sheet's particles, right of the four colour blocks, are
not used.)

# API Shapes:
- [shape:sprite](../../shapes/sprite.md)

# Functions:
## Function - load:
`load(base) -> promise`. `base` a URL prefix ending in `/` (the page's is `/assets/`); each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all twenty are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves.

## Function - sprite:
`sprite(name) -> sprite`. The `sprite` for a name of the table: its `image` the keyed sheet (a canvas), its rectangle the table's, 16 by 16. Before a `load` has resolved, answers `null`. A name not in the table throws a `TypeError`, loaded or not.

## Function - tile:
`tile(theme, name) -> sprite`. The `sprite` of the terrain tile `name` (`floor`, `stairs`, or `wall-0` to `wall-15`) of the theme `theme` (one of the six of the themes' table), as that table says: its `image` the keyed sheet, 16 by 16. Before a `load` has resolved, answers `null`. A theme or a name not of those throws a `TypeError`, loaded or not.

## Function - pose:
`pose(name, anim, frame, look) -> sprite`. A frame of a creature's animation, as **Animations** says: `name` `hero` or a monster's; `anim` one of that creature's animations (a monster: `idle`; `hero`: `idle`, `sleep`, `debuff`, `power_up`, `stun`); `frame` an integer from 0 to the animation's count less 1; `look` (left out: `{colour: 0, group: 0}`, used only for `hero`) `{colour, group}`, integers from 0 to 3 and from 0 to 5. Its `image` the keyed sheet, 16 by 16. Before a `load` has resolved, answers `null`. Anything else throws a `TypeError`, loaded or not.

## Function - frames:
`frames(name, anim) -> integer`. How many frames the animation has (a monster's `idle` 3; the hero's as the table says). A name or an animation not of those throws a `TypeError`.

## Function - names:
`names() -> array`. The fifty-nine names, in the table's order, a fresh array each call.

# Intrinsics:
## Intrinsic - table:
`names()` is the table's names in order. Before any `load`, `sprite('hero')` is `null`; `sprite('dragon')` throws a `TypeError`. After `load('/assets/')` resolves, each name's sprite has the table's `sx`, `sy`, `sw` 16 and `sh` 16. `names()` has 59 names, `wall-0` to `wall-15` the last sixteen in order, `armor-4` just before `wall-0`, `mage` just after `necklace`, `ring` before `necklace`, `lever-pulled` before `ring`; `sprite('mage')` has `sx` 0 and `sy` 16, `sprite('swordsman')` `sx` 64 and `sy` 16, `sprite('cheese')` `sx` 32 and `sy` 144, `sprite('armor-3')` `sx` 16 and `sy` 48, `sprite('sword-2')` `sx` 80 and `sy` 16, each the same `image` as `sprite('skeleton')` (the monsters) or `sprite('potion')` (the items); `pose('mage', 'idle', 2)` has `sx` 32 and `sy` 16; `sprite('blue-spider')` has `sx` 64 and `sy` 96; `sprite('serpent')` has the same `image`, `sx` and `sy` as `sprite('blue-snake')` (the serpent is drawn 3 cells square, `view` scales it); `sprite('ring')` has `sx` 0 and `sy` 64, `sprite('necklace')` `sx` 128 and `sy` 64; `sprite('golem')` has `sx` 64 and `sy` 112, `sprite('slime')` `sx` 64 and `sy` 48, and `sprite('blue-snake')` an `image` other than `sprite('snake')`'s; `sprite('wall-6')` has `sx` 32 and `sy` 0, `sprite('wall-9')` `sx` 48 and `sy` 16; `sprite('wall-16')` throws a `TypeError`.

## Intrinsic - poses:
`frames('hero', 'idle')` is 3, `frames('hero', 'sleep')` 4, `frames('hero', 'debuff')` 4, `frames('hero', 'power_up')` 6, `frames('hero', 'stun')` 5, `frames('golem', 'idle')` 3; `frames('golem', 'stun')`, `frames('dragon', 'idle')` and `frames('wall-0', 'idle')` throw a `TypeError`. Before any `load`, `pose('hero', 'idle', 0)` is `null`; `pose('hero', 'idle', 3)`, `pose('hero', 'walk', 0)`, `pose('bat', 'sleep', 0)` and `pose('hero', 'idle', 0, {colour: 4, group: 0})` throw a `TypeError`. After `load('/assets/')` resolves: `pose('hero', 'idle', 0)` has the same `image`, `sx` and `sy` as `sprite('hero')`; `pose('hero', 'idle', 2)` `sx` 32, `sy` 0; `pose('hero', 'idle', 1, {colour: 3, group: 0})` `sx` 208, `sy` 0; `pose('hero', 'sleep', 2)` `sx` 0, `sy` 48; `pose('hero', 'debuff', 1, {colour: 1, group: 0})` `sx` 80, `sy` 80; `pose('hero', 'power_up', 3, {colour: 1, group: 0})` `sx` 64, `sy` 144; `pose('hero', 'power_up', 5)` `sx` 32, `sy` 144; `pose('hero', 'stun', 4, {colour: 2, group: 0})` `sx` 160, `sy` 192; `pose('hero', 'idle', 0, {colour: 0, group: 2})` `sx` 0, `sy` 480; `pose('golem', 'idle', 2)` `sx` 96, `sy` 112 and the same `image` as `sprite('golem')`; `pose('blue-snake', 'idle', 1)` `sx` 16, `sy` 16; every pose is 16 by 16.

## Intrinsic - themes:
Before any `load`, `tile('frozen', 'floor')` is `null`; `tile('lava', 'floor')`, `tile('frozen', 'wall-16')` and `tile('frozen', 'hero')` throw a `TypeError`. After `load('/assets/')` resolves: `tile('dungeon', n)` has the same `image`, `sx` and `sy` as `sprite(n)` for `n` `floor`, `stairs`, `wall-0` and `wall-15`; `tile('frozen', 'wall-6')` has `sx` 32 and `sy` 0 and an `image` other than `sprite('wall-6')`'s; `tile('interior', 'floor')` has `sx` 224 and `sy` 112; `tile('magma', 'stairs')` `sx` 0 and `sy` 112; `tile('interior', 'stairs')` has `sx` 32, `sy` 96 and the same `image` as `sprite('stairs')`; `tile('arid', 'wall-15')`, drawn at its own size on a canvas filled with pure green, leaves at least 100 of the 256 pixels not pure green; for each of the six themes, `tile(theme, 'floor')` and `tile(theme, 'wall-10')` are each 16 by 16.

## Intrinsic - keyed:
After `load('/assets/')`, on a canvas filled with pure green (0, 255, 0), drawing `sprite('hero')` at (0, 0) at its own size leaves the pixel (0, 0) pure green (the sheet's background there is transparent), and leaves at least 20 of the 256 pixels not pure green (the hero is drawn).

## Intrinsic - fails:
`load('/nowhere/')` rejects with an `Error` whose message contains `sheets/`.
