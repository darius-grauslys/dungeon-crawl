# monsters

What a monster does with its turn. Pure and without randomness: the same
situation always gives the same intent.

Moves are orthogonal. The four directions, in this order of preference:
up `(0, -1)`, right `(1, 0)`, down `(0, 1)`, left `(-1, 0)`.

# API Shapes:
- [shape:actor](../../shapes/actor.md)
- [shape:point](../../shapes/point.md)
- [shape:tile-grid](../../shapes/tile-grid.md)
- [shape:intent](../../shapes/intent.md)

# Functions:
## Function - decide:
`decide(monster, hero, grid, blocked, turn) -> intent`. `monster` an `actor` not of kind `hero`; `hero` a `point` (where the hero stands); `grid` a `tile-grid`; `blocked` an array of `point`s (the other monsters' cells); `turn` an integer of 0 or more. Anything else throws a `TypeError`. In order, the first that applies:
1. A `slime` on an odd `turn` waits.
2. If the hero is one orthogonal step away: a `move` onto the hero (an attack).
3. If the hero is within the monster's reach (Manhattan distance at most 6; for a `bat`, 9): the first step of a shortest path to the hero by orthogonal steps over open cells (`grid.open`) not in `blocked` (the hero's cell is the goal, so it counts as open), among the first steps that begin a shortest path the first in the order of preference; with no such path of at most 20 steps, it waits.
4. Otherwise it waits.

# Intrinsics:
## Intrinsic - adjacent-attacks:
In an all-`floor` 7 by 7 grid (`of`), a `skeleton` at (3, 3) with the hero at (3, 2) moves `(0, -1)`; with the hero at (2, 3), `(-1, 0)`; with the hero at (4, 4) (diagonal, not adjacent) it does not move onto the hero but steps right `(1, 0)` (right and down both begin a shortest path; right comes first in the order of preference). With the hero at (4, 2), it steps up `(0, -1)`.

## Intrinsic - chases:
In the grid `['#######', '#.....#', '#.###.#', '#.....#', '#######']`, a `snake` at (1, 3) with the hero at (5, 1) moves `(0, -1)`. With `blocked` holding (1, 2), it moves `(1, 0)`.

## Intrinsic - reach:
In an all-`floor` 20 by 3 grid, a `snake` at (0, 1) waits with the hero at (7, 1) and moves `(1, 0)` with the hero at (6, 1); a `bat` there moves `(1, 0)` with the hero at (9, 1) and waits with the hero at (10, 1).

## Intrinsic - slime-slow:
A `slime` adjacent to the hero waits on turn 3 and moves onto the hero on turn 4.

## Intrinsic - no-path:
In the grid `['#######', '#..#..#', '#######']`, a `skeleton` at (1, 1) with the hero at (4, 1) waits.

## Intrinsic - refuses:
A monster of kind `hero`, a `hero` given as `{x: 1, y: 1}`, `blocked` not an array, and `turn` -1 throw a `TypeError`.
