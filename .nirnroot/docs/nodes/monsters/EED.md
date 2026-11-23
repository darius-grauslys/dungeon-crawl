# monsters

What a monster does with its turn. Pure and without randomness: the same
situation always gives the same intent.

**Directions.** Moves go to any of the eight neighbouring cells. The
eight directions, in this order of preference: up `(0, -1)`, right
`(1, 0)`, down `(0, 1)`, left `(-1, 0)`, then up-right `(1, -1)`,
down-right `(1, 1)`, down-left `(-1, 1)`, up-left `(-1, -1)`.

**Distance** is counted in steps where a diagonal is one step:
`max(|dx|, |dy|)` between two cells. A creature of `size` s stands on the
s by s square from its `pos` (`actor`'s `covers`); its distance to a cell
is the least distance from any cell it covers.

**A step** of a monster in a direction `(dx, dy)` moves its whole square
by `(dx, dy)`. It is **free** when every cell the moved square covers is
open (`grid.open`) and not in `blocked` (cells the monster itself covers
now are never in `blocked`: the caller leaves them out), and, for a
diagonal, the two orthogonal steps `(dx, 0)` and `(0, dy)` each move the
square onto open cells only (no cutting a wall's corner; `blocked` cells
don't count here).

**Next to.** A monster is next to a cell when the cell is at distance 1
and, if it is diagonal to the cell of the monster's square nearest to it,
neither of the two cells between them orthogonally is a wall. The
direction toward that cell is the sign of each of its offsets from that
nearest covered cell (`Math.sign`).

**In line.** A cell is in line of a monster of size 1 when it lies along
one of the eight directions from it (same row, same column, or a
diagonal), at most `range` cells away (`stats.range`), and every cell
between them is open (creatures in between don't stop a shot).

# API Shapes:
- [shape:actor](../../shapes/actor.md)
- [shape:point](../../shapes/point.md)
- [shape:tile-grid](../../shapes/tile-grid.md)
- [shape:intent](../../shapes/intent.md)
- [shape:bestiary](../../shapes/bestiary.md)
- [shape:stats](../../shapes/stats.md)

# Functions:
## Function - decide:
`decide(monster, grid, foes, threats, blocked, turn) -> intent`. `monster` an `actor` not of kind `hero`; `grid` a `tile-grid`; `foes` an array of `point`s, the cells of the creatures it fights (every cell each covers), in the caller's order of preference; `threats` an array of `point`s, the cells of the creatures it flees; `blocked` an array of `point`s, the cells it may not step onto (other creatures, wares, levers); `turn` an integer of 0 or more. Anything else throws a `TypeError`. With its `reach` from `bestiary.entry(monster.kind)`, in order, the first that applies:
1. A `dormant` monster waits.
2. A slime (`bestiary`'s `SLIMES`) on an odd `turn` waits.
3. **Keeping its distance.** A monster whose `mode` is `roam` and whose `stats.range` is above 1, with the nearest foe's cell at a distance below its `range` (a foe has come close): among its free steps, the one that leaves it farthest from the nearest foe's cell (the first in the order of preference on a tie), if that is farther than it is now: it backs off, one step at a time, until the foe is at its full range. With no step that takes it farther (it is cornered), go on to the next rules (it fights where it stands).
4. If it is next to a foe's cell (the first such in `foes`): a `move` toward that cell (an attack).
5. A `guard` waits.
6. If a threat's cell is within 5 of it: it flees: among its free steps, the one that leaves it farthest from the nearest threat's cell (the first in the order of preference on a tie), if that is farther than it is now; else it waits.
7. If its `stats.range` is above 1 and a foe's cell is in line (the first such in `foes`): an `attack` toward it (the direction from the monster to the cell).
8. If a foe's cell is within its `reach` (the nearest such cell; on a tie, the first in `foes`): a step toward it: count, with a breadth-first search of free steps to a depth of 20, how many steps each square needs to be next to that cell; among its free steps, the one whose square needs the fewest more; on a tie, the one whose moved square's nearest cell to the foe's cell is the nearest to it by `dx * dx + dy * dy`; then the first in the order of preference. With no such path of at most 20 steps, it waits.
9. Otherwise it waits.

# Intrinsics:
## Intrinsic - adjacent-attacks:
In an all-`floor` 7 by 7 grid (`of`), a `skeleton` at (3, 3) with a foe at (3, 2) moves `(0, -1)`; with the foe at (2, 3), `(-1, 0)`; with the foe at (4, 4) (diagonal), `(1, 1)`. With the foe at (5, 1), it steps up-right `(1, -1)`. In the grid `['#####', '#...#', '#...#', '#####']`, a `skeleton` at (1, 2) with a foe at (2, 1) moves `(1, -1)` (an attack: both corners, (2, 2) and (1, 1), are floor). In the grid `['#####', '##..#', '#...#', '#####']` (the corner (1, 1) a wall) it is not next to the foe, and steps `(1, 0)` to (2, 2).

## Intrinsic - chases:
In the grid `['#######', '#.....#', '#.###.#', '#.....#', '#######']`, a `snake` at (1, 3) with a foe at (5, 1) moves `(1, 0)` (up and right each need 4 more steps; right ends nearer the foe). With `blocked` holding (2, 3), it moves `(0, -1)`.

## Intrinsic - reach:
In an all-`floor` 20 by 3 grid, a `snake` at (0, 1) waits with the foe at (7, 1) and moves `(1, 0)` with the foe at (6, 1); a `bat` there moves `(1, 0)` with the foe at (9, 1) and waits with the foe at (10, 1). The `snake` at (0, 1) with the foe at (6, 2) moves `(1, 1)`.

## Intrinsic - slime-slow:
A `slime` next to a foe waits on turn 3 and moves onto it on turn 4; so does a `blue-slime`.

## Intrinsic - guard:
A `slime` of `mode` `guard` at (2, 2) in an all-`floor` 7 by 7 grid: with a foe at (3, 3), on turn 0 it moves `(1, 1)`; with the foe at (4, 2), it waits, on turn 0 and on turn 2.

## Intrinsic - dormant:
A `golem` of `size` 3 and `mode` `dormant` at (1, 1) in an all-`floor` 10 by 10 grid waits with a foe at (4, 2). The same golem of `mode` `roam` moves `(1, 0)` with the foe at (4, 2) (an attack: the cell (3, 2) it covers is next to it), and with the foe at (8, 2) steps `(1, 0)`.

## Intrinsic - flees:
In an all-`floor` 12 by 12 grid, a `worm` at (4, 4) with no foes and a threat at (2, 4) steps `(1, 0)`; with the threat at (4, 2), `(0, 1)`; with the threat at (10, 4) (6 away), it waits. In the grid `['#####', '#...#', '#####']`, a `worm` at (3, 1) with a threat at (1, 1) waits (no step takes it farther).

## Intrinsic - shoots:
In an all-`floor` 9 by 9 grid, an `archer` with `stats.range` 4 at (1, 1): with a foe at (5, 1) it answers `attack(1, 0)`; with the foe at (5, 5), `attack(1, 1)`; with the foe at (6, 1) (5 away) it steps `(1, 0)`; with the foe at (3, 5) (4 away, not in line) it steps `(1, 1)`. In the grid `['#######', '#..#..#', '#######']`, the archer at (1, 1) with a foe at (5, 1) does not shoot (the wall (3, 1) is between) and waits (no path).

## Intrinsic - kites:
In an all-`floor` 12 by 12 grid, an `archer` with `stats.range` 4 at (5, 5): with a foe at (5, 3) (2 away) it steps `(0, 1)` (down, to 3 away: the first of the farthest steps); with the foe at (5, 4) (next to it), `(0, 1)` too; with the foe at (8, 5) (3 away), `(-1, 0)`; with the foe at (5, 1) (4 away, its full range, in line) it answers `attack(0, -1)`. The same archer of `mode` `guard` with the foe at (5, 3) does not step: it waits. A `skeleton` (range 1) at (5, 5) with the foe at (5, 3) steps `(0, -1)` toward it. In the grid `['#######', '#.....#', '#######']`, the archer at (5, 1) with a foe at (4, 1) (next to it; its only step away, `(1, 0)` to (6, 1), is a wall) answers `move(-1, 0)` (a melee attack); with the foe at (3, 1) (2 away, cornered) `attack(-1, 0)`.

## Intrinsic - no-path:
In the grid `['#######', '#..#..#', '#######']`, a `skeleton` at (1, 1) with a foe at (4, 1) waits.

## Intrinsic - refuses:
A monster of kind `hero`, `foes` holding `{x: 1, y: 1}`, `blocked` not an array, `threats` not an array, and `turn` -1 throw a `TypeError`.
