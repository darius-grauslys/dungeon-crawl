# dungeon

Makes dungeon floors: rooms joined by corridors, a start, a staircase, and
cells to place things on. Pure: the same seed and depth always give the
same floor, and nothing else is read or changed.

# API Shapes:
- [shape:floor-plan](../../shapes/floor-plan.md)

# Functions:
## Function - generate:
`generate(seed, depth) -> floor-plan`. `seed` an integer from 0 to 4294967295, `depth` an integer from 1 to 5; anything else throws a `TypeError`. Answers a floor 48 cells wide and 32 high: every cell of its outer border is `wall`; rooms and corridors are `floor`; exactly one cell is `stairs`. `start` is where the hero arrives. `spots` holds from 12 to 40 points, each at a Manhattan distance of at least 5 from `start`. Every `floor` and `stairs` cell can be reached from `start` by orthogonal steps over `floor` and `stairs` cells.

# Intrinsics:
## Intrinsic - deterministic:
`generate(s, d)` twice gives plans with equal grids (`tiles()` deep equal), starts, stairs and spots, for `s` in 0, 1, 77, 4294967295 and `d` in 1 and 5. `generate(1, 1)` and `generate(2, 1)` have different `tiles()`; so do `generate(1, 1)` and `generate(1, 2)`.

## Intrinsic - bounded:
For seeds 0 to 19 and each depth 1 to 5: the grid is 48 wide and 32 high, every border cell is `wall`, and exactly one cell is `stairs`, at `stairs`.

## Intrinsic - connected:
For seeds 0 to 19 and each depth 1 to 5: a flood fill by orthogonal steps from `start` over cells that are `floor` or `stairs` reaches every such cell of the grid.

## Intrinsic - spots-apart:
For seeds 0 to 19 and each depth 1 to 5: `spots` has from 12 to 40 points; each is `floor`, none equals another, `start` or `stairs`, and each is at a Manhattan distance of at least 5 from `start`. `stairs` is at a Manhattan distance of at least 10 from `start`.

## Intrinsic - refuses:
`generate(-1, 1)`, `generate(1.5, 1)`, `generate(4294967296, 1)`, `generate(1, 0)`, `generate(1, 6)` and `generate('1', 1)` throw a `TypeError`.
