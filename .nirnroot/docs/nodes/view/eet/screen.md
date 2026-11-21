# view: edge test `screen`

Browser tests (`*.browser.test.mjs`) on the page's 800 by 600 canvas
(`cols` 16, `rows` 10: the map's top 480 pixels, the panel below). The
page serves the project's asset area under `/assets/`. Build the worlds
with `world`'s `of` (masks with `mask`'s `of` or `empty`; seed 1, rng 1,
depth 1, time 0, state `playing`, gold 0, log `['hello']`, `entry` the
save of seed 1, depth 1 and no players; each hero with `hero`'s `of`
around an `actor` of kind `hero`, `{hp: 24, maxHp: 24, attack: 4,
defense: 1}`, or 0 hit points and `alive: false` for one not alive; a
monster a `slime` of any stats). Read pixels back with `getImageData`.
Write the `flat-colours`, `fog` and `paused` tests before the `sprites`
one, in the same file or in files whose names sort before it: once
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

# Intrinsics:
## Intrinsic - camera:
As the EED states.

## Intrinsic - flat-colours:
As the EED states.

## Intrinsic - fog:
As the EED states.

## Intrinsic - paused:
As the EED states.

## Intrinsic - sprites:
As the EED states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - world/data:
As the shape states.

## Intrinsic - point/valid:
As the shape states.
