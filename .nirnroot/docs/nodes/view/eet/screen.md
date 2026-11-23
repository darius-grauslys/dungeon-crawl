# view: edge test `screen`

Browser tests (`*.browser.test.mjs`) on the page's 800 by 600 canvas
(`cols` 16, `rows` 10: the map's top 480 pixels, the panel below). The
page serves the project's asset area under `/assets/`. Build the worlds
with `world`'s `of` (masks with `mask`'s `of` or `empty`; seed 1, rng 1,
depth 1, time 0, state `playing`, gold 0, log `['hello']`, `entry` the
save of seed 1, depth 1 and no players; each hero with `hero`'s `of`
around an `actor` of kind `hero`, `{hp: 24, maxHp: 24, attack: 4,
defense: 1}`, or 0 hit points and `alive: false` for one not alive; a
monster a `slime` of any stats, unless the intrinsic says another kind;
actors' `held` 0, `facing` and `last` left out unless said). Read pixels back with `getImageData`.
Write the `flat-colours`, `fog`, `paused`, `walls`, `animates`, `aim`, `sizes`, `flies`, `effects`, `spikes`, `leaps` and `glides` tests before the `sprites`
one (and the `floors` one), in the same file or in files whose names sort before them: once
loaded, the sprites are used for good.

The edge under test:

- [eed:view](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:point](../../../shapes/point.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:save](../../../shapes/save.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:level](../../../shapes/level.md)

# Assets:
- [asset:sheets/floor.png](../../../../../assets/sheets/floor.png)

# Intrinsics:
## Intrinsic - floors:
As the EED states. The dungeon's floor patterns lie on `/assets/sheets/floor.png`, all at `sx` 0, ranked calmest first by `sy`: 304, 336, 0, 320, 352, 368, 16, 32, 144, 160, 48, 176, 224, 64, 80, 208, 96, 112, 128, 240, 288, 272, 256 (23; "next to each other in the ranking" is two neighbours of this list, "at most 1 apart" the same or neighbours). Load the sheet yourself (`new Image()`, `src` `/assets/sheets/floor.png`, await `decode()`); for each `sy`, on a scratch canvas filled with rgb(22, 13, 19), draw the 16 by 16 rectangle at (0, sy) of a copy of the sheet whose rgb(22, 13, 19) pixels were made transparent, scaled to 48 by 48 with smoothing off, and compare its pixels with the cell's to find each cell's pattern. There is no other floor file: use only that sheet. (The old test of calm centres and busy edges is stale: replace it.)

## Intrinsic - spikes:
As the EED states: set the world's `spikes` with the shape.

## Intrinsic - leaps:
As the EED states: set the spider's `air` with `actor`'s `of`.

## Intrinsic - glides:
As the EED states: set the snake's `last` and `flung` with `actor`'s `of`.

## Intrinsic - effects:
As the EED states: set the actors' `fuse` and `chant`, and the world's `effects`, with the shapes.

## Intrinsic - camera:
As the EED states.

## Intrinsic - cell-at:
As the EED states: compare each answer's `x` and `y`.

## Intrinsic - flat-colours:
As the EED states.

## Intrinsic - fog:
As the EED states.

## Intrinsic - paused:
As the EED states.

## Intrinsic - walls:
As the EED states.

## Intrinsic - animates:
As the EED states.

## Intrinsic - aim:
As the EED states.

## Intrinsic - sizes:
As the EED states.

## Intrinsic - flies:
As the EED states.

## Intrinsic - prices:
As the EED states: the ware with `item`'s `of` and its `price`, Ann's `offer` with `hero`'s `of`.

## Intrinsic - themes:
As the EED states: the same world with `depth` 1, 6, 7 and 8 (each `entry` of that depth).

## Intrinsic - poses:
As the EED states: build Ann's actor with `gesture` and her hero with `colour` as said; compare her 48 by 48 cell's pixels with `getImageData`.

## Intrinsic - sprites:
As the EED states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - world/data:
As the shape states.

## Intrinsic - point/valid:
As the shape states.

## Intrinsic - level/valid:
As the shape states.
