# dungeon

Makes the floors: on a dungeon depth, rooms joined by corridors, a
start, a staircase, and cells to place things on; on a shop depth (every
sixth: 6, 12, 18 and 24), the shop, one room laid out the same every
time, its `spots` the cells where the wares stand. Pure: the same seed
and depth always give the same floor, and nothing else is read or
changed.

**The shop** is 48 by 32 cells, all `wall` but the room: every cell with
`x` from 14 to 33 and `y` from 10 to 21 is `floor`, except `stairs` at
(31, 19). `start` is (16, 19). `spots` are the six cells (16, 13),
(19, 13), (22, 13), (25, 13), (28, 13) and (31, 13), in that order (the
row above them is left free for the price shown over each ware).

# API Shapes:
- [shape:floor-plan](../../shapes/floor-plan.md)

# Functions:
## Function - generate:
`generate(seed, depth) -> floor-plan`. `seed` an integer from 0 to 4294967295, `depth` an integer from 1 to 29; anything else throws a `TypeError`. On a shop depth (`depth % 6` is 0), the shop above, whatever the seed. On any other depth, a floor 48 cells wide and 32 high: every cell of its outer border is `wall`; rooms and corridors are `floor`; exactly one cell is `stairs`. `start` is where the hero arrives. `spots` holds from 12 to 40 points, each at a Manhattan distance of at least 5 from `start`. Every `floor` and `stairs` cell can be reached from `start` by orthogonal steps over `floor` and `stairs` cells.

# Intrinsics:
## Intrinsic - deterministic:
`generate(s, d)` twice gives plans with equal grids (`tiles()` deep equal), starts, stairs and spots, for `s` in 0, 1, 77, 4294967295 and `d` in 1 and 5. `generate(1, 1)` and `generate(2, 1)` have different `tiles()`; so do `generate(1, 1)` and `generate(1, 2)`.

## Intrinsic - bounded:
For seeds 0 to 19 and the depths 1, 2, 3, 4, 5, 7, 11, 13, 23, 25 and 29: the grid is 48 wide and 32 high, every border cell is `wall`, and exactly one cell is `stairs`, at `stairs`.

## Intrinsic - connected:
For seeds 0 to 19 and the depths of `bounded`, and for the depths 6 and 24: a flood fill by orthogonal steps from `start` over cells that are `floor` or `stairs` reaches every such cell of the grid.

## Intrinsic - spots-apart:
For seeds 0 to 19 and the depths of `bounded`: `spots` has from 12 to 40 points; each is `floor`, none equals another, `start` or `stairs`, and each is at a Manhattan distance of at least 5 from `start`. `stairs` is at a Manhattan distance of at least 10 from `start`.

## Intrinsic - shop:
`generate(s, d)` for `s` in 0, 1 and 4294967295 and `d` in 6, 12, 18 and 24: the grid is 48 by 32, `at(14, 10)`, `at(33, 21)` and `at(16, 12)` are `floor`, `at(13, 10)`, `at(34, 15)` and `at(20, 9)` `wall`, `at(31, 19)` `stairs`, and the plan's `stairs` (31, 19); `start` is (16, 19); `spots` are the six cells above, in order; every `tiles()` is deep equal to `generate(0, 6)`'s.

## Intrinsic - refuses:
`generate(-1, 1)`, `generate(1.5, 1)`, `generate(4294967296, 1)`, `generate(1, 0)`, `generate(1, 30)` and `generate('1', 1)` throw a `TypeError`.
