# dungeon: edge test `generate`

Pure functions: plain `node:test` tests in Node, no browser. Build the
expected values from the plan itself (its `grid`'s `at` and `open`);
never assert a particular layout, only what the EED holds for every
floor.

The edge under test:

- [eed:dungeon](../EED.md)

# API Shapes:
- [shape:floor-plan](../../../shapes/floor-plan.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:point](../../../shapes/point.md)

# Intrinsics:
## Intrinsic - deterministic:
As the EED states.

## Intrinsic - bounded:
As the EED states.

## Intrinsic - connected:
As the EED states.

## Intrinsic - spots-apart:
As the EED states.

## Intrinsic - shop:
As the EED states.

## Intrinsic - refuses:
As the EED states.

## Intrinsic - floor-plan/valid:
As the shape states, built with `tile-grid`'s `fromRows` and `point`'s `of`.
