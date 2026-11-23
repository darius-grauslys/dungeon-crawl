# dungeon

Makes the floors: on a dungeon depth, rooms joined by corridors, a
start, a staircase, and cells to place things on; on a shop depth (6,
13, 20 and 27), the shop, one room laid out the same every time, its
`spots` the cells where the wares may stand; on a lair depth (7, 14, 21 and
28), the lair, one great hall laid out the same every time, the first
of them with its boss's place and its levers. `level` (the shape) says
which depth is which. Pure: the same seed and depth always give the
same floor, and nothing else is read or changed.

**The shop** is 48 by 32 cells, all `wall` but the room: every cell with
`x` from 14 to 33 and `y` from 10 to 21 is `floor`, except `stairs` at
(31, 19). `start` is (16, 19). `spots` are eighteen cells in two
rows of nine, every other column: (15, 13), (17, 13), ..., (31, 13) (the
`x` 15 to 31 by 2), then (15, 16), (17, 16), ..., (31, 16), in that order
(the row above each is left free for the price shown over each ware; a
shop puts its wares on the first of them, as many as it sells). No
`boss`, no `levers`.

**The lair** is 48 by 32 cells, all `wall` but the hall: every cell with
`x` from 6 to 41 and `y` from 4 to 27 is `floor`, except `stairs` at
(33, 16). `start` is (8, 16). On the first lair (depth 7, `level.round`
1), the golem's lair:
- `boss` is (32, 15): the boss's 3 by 3 square covers `x` 32 to 34 and
  `y` 15 to 17, the stairs (33, 16) at its centre (the way out forms
  there when the boss dies);
- `levers` are (39, 7), (39, 25) and (39, 16), in that order: behind
  the golem, on the hall's far (east) side, so the party must pass it
  to reach them;
- `spots` are the guards' cells: for each lever in order, the 24 cells
  within 2 of it (`max(|dx|, |dy|) <= 2`) other than the lever itself,
  row by row (top row first, left to right): 72 points, the first
  (37, 5), the 24th (41, 9), the 25th (37, 23), the last (41, 18).
On the second lair (depth 14, round 2), the serpent's: `boss` (32, 15)
(the same square), no `levers`, no `spots`. On the other lairs (21 and
28): `boss` `null`, no `levers`, no `spots` (an empty hall, its stairs
open).

# API Shapes:
- [shape:floor-plan](../../shapes/floor-plan.md)
- [shape:level](../../shapes/level.md)

# Functions:
## Function - generate:
`generate(seed, depth) -> floor-plan`. `seed` an integer from 0 to 4294967295, `depth` an integer from 1 to 33 (`level`'s `MAX_DEPTH`); anything else throws a `TypeError`. On a shop depth (`level.kind(depth)` `interior`), the shop above, whatever the seed; on a lair depth (`boss`), the lair above, whatever the seed. On any other depth, a floor 48 cells wide and 32 high: every cell of its outer border is `wall`; rooms and corridors are `floor`; exactly one cell is `stairs`. `start` is where the hero arrives. `spots` holds from 12 to 40 points, each at a Manhattan distance of at least 5 from `start`. No `boss`, no `levers`. Every `floor` and `stairs` cell can be reached from `start` by orthogonal steps over `floor` and `stairs` cells.

# Intrinsics:
## Intrinsic - deterministic:
`generate(s, d)` twice gives plans with equal grids (`tiles()` deep equal), starts, stairs and spots, for `s` in 0, 1, 77, 4294967295 and `d` in 1 and 5. `generate(1, 1)` and `generate(2, 1)` have different `tiles()`; so do `generate(1, 1)` and `generate(1, 2)`.

## Intrinsic - bounded:
For seeds 0 to 19 and the depths 1, 2, 3, 4, 5, 8, 12, 15, 26, 29 and 33: the grid is 48 wide and 32 high, every border cell is `wall`, exactly one cell is `stairs`, at `stairs`, `boss` is `null` and `levers` empty.

## Intrinsic - connected:
For seeds 0 to 19 and the depths of `bounded`, and for the depths 6, 7, 14 and 27: a flood fill by orthogonal steps from `start` over cells that are `floor` or `stairs` reaches every such cell of the grid.

## Intrinsic - spots-apart:
For seeds 0 to 19 and the depths of `bounded`: `spots` has from 12 to 40 points; each is `floor`, none equals another, `start` or `stairs`, and each is at a Manhattan distance of at least 5 from `start`. `stairs` is at a Manhattan distance of at least 10 from `start`.

## Intrinsic - shop:
`generate(s, d)` for `s` in 0, 1 and 4294967295 and `d` in 6, 13, 20 and 27: the grid is 48 by 32, `at(14, 10)`, `at(33, 21)` and `at(16, 12)` are `floor`, `at(13, 10)`, `at(34, 15)` and `at(20, 9)` `wall`, `at(31, 19)` `stairs`, and the plan's `stairs` (31, 19); `start` is (16, 19); `spots` are the eighteen cells above, in order (the first (15, 13), the ninth (31, 13), the tenth (15, 16), the last (31, 16)), each `floor`; `boss` is `null`; every `tiles()` is deep equal to `generate(0, 6)`'s.

## Intrinsic - lair:
`generate(s, 7)` for `s` in 0 and 4294967295: the grid is 48 by 32, `at(6, 4)`, `at(41, 27)` and `at(20, 20)` are `floor`, `at(5, 4)`, `at(42, 16)` and `at(20, 3)` `wall`, `at(33, 16)` `stairs`; `stairs` is (33, 16), `start` (8, 16), `boss` (32, 15); `levers` are (39, 7), (39, 25) and (39, 16) in order; `spots` has 72 points, the first (37, 5), the 24th (41, 9), the 25th (37, 23) and the last (41, 18), none of them a lever, and none within 2 of the boss's square (`x` 32 to 34, `y` 15 to 17). `generate(s, 14)`: `tiles()` deep equal to `generate(0, 7)`'s, `stairs` (33, 16), `start` (8, 16), `boss` (32, 15), `levers` and `spots` empty. `generate(s, d)` for `d` in 21 and 28: `tiles()` deep equal to `generate(0, 7)`'s, `stairs` (33, 16), `start` (8, 16), `boss` `null`, `levers` and `spots` empty.

## Intrinsic - refuses:
`generate(-1, 1)`, `generate(1.5, 1)`, `generate(4294967296, 1)`, `generate(1, 0)`, `generate(1, 34)` and `generate('1', 1)` throw a `TypeError`.
