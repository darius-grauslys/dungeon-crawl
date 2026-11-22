# cues: edge test `sounds`

Pure: plain `node:test` tests. Build the worlds with `world`'s `of`:
the grid with `tile-grid`'s `fromRows`, `visible` and `explored` with
`mask`'s constructors, heroes with `hero`'s `of` around `actor`'s `of`
(stats with `stats`'s `of`), monsters with `actor`'s `of`, `entry` the
save of seed 1, the world's depth and the heroes' stats; build `next`
from `prev` with `with`. Compare cues by `name` and `gain` (gains with a
tolerance of 1e-9).

The edge under test:

- [eed:cues](../EED.md)

# API Shapes:
- [shape:cue](../../../shapes/cue.md)
- [shape:world](../../../shapes/world.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:point](../../../shapes/point.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:save](../../../shapes/save.md)

# Intrinsics:
## Intrinsic - steps:
As the EED states.

## Intrinsic - attacks:
As the EED states.

## Intrinsic - distance:
As the EED states.

## Intrinsic - gestures:
As the EED states.

## Intrinsic - one-of-each:
As the EED states.

## Intrinsic - stairs:
As the EED states.

## Intrinsic - dies:
As the EED states.

## Intrinsic - refuses:
As the EED states.

## Intrinsic - cue/valid:
As the shape states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - world/data:
As the shape states.
