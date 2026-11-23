# travel

Where a player's hero goes next on a journey of many steps: exploring
the floor (the `z` key), or going to a cell the player clicked. Pure: a
function of the world the page holds and the player's name; it answers
one step at a time, and the page asks again from each new world. Runs
in the browser, on what the player's page knows: never on cells the
party hasn't seen, nor on monsters out of sight.

**Me.** `me` is the player's name; its hero is the one of that name. A
name no hero has, or a hero not alive, has no journey: every function
answers `null` (`sighted`: `[]`).

**Known** cells: those `explored` or `visible` in the world.

**Passable** cells, for planning: known, open (`grid.open`), and holding
none of: a monster on a `visible` cell (any cell it covers, when one of
them is `visible`), another alive hero, a ware (an item whose `price` is
above 0), a `lever`. Gold and other items lying about are passable (the
hero picks them up on the way). Me's own cell counts as passable.

**Steps.** From a cell, the eight directions, in this order: up `(0,
-1)`, right `(1, 0)`, down `(0, 1)`, left `(-1, 0)`, up-right `(1, -1)`,
down-right `(1, 1)`, down-left `(-1, 1)`, up-left `(-1, -1)`. A step is
to a passable cell; a diagonal step must not cut a corner: both cells
`(x + dx, y)` and `(x, y + dy)` must be open (`grid.open`; creatures
there don't count).

**The path** to a set of goal cells is found by a breadth-first search
from me's cell over steps, trying the directions in the order above: the
first goal cell the search reaches, and the first step of the path to
it. So the answer is `intent.move(dx, dy)` of that first step, or `null`
when no goal is reachable, or when me already stands on a goal.

**A frontier** cell is a passable known cell, not me's own, with at
least one of its eight neighbours not known (and inside the grid).

**In sight of me.** A cell `c` is in me's sight when it is `visible`,
within 7 of me's cell `o` (`(c.x - o.x)² + (c.y - o.y)² <= 49`), and no
`wall` lies strictly between them on the line from `o` to `c`: the cells
Bresenham's algorithm gives, stepping one cell at a time along the
longer of the two axes from `o` to `c`, `o` and `c` left out (as the
server's field of view counts it, from me alone: what the other heroes
see is in `visible` but not in me's sight).

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:point](../../shapes/point.md)
- [shape:intent](../../shapes/intent.md)

# Functions:
## Function - explore:
`explore(world, me) -> intent`. The next step of exploring: the path to the frontier cells. With no frontier reachable: the path to the `stairs` cell if it is known (me on it: `null`). Otherwise `null` (nothing left to explore). A `world` that is not a `world` throws a `TypeError`.

## Function - toward:
`toward(world, me, target) -> intent`. The next step toward the cell `target` (a `point`): when `target` is passable, the path to it; when it is known and open but not passable (a creature, a ware or a lever stands there), the path to the passable cells next to it (at distance 1, `max(|dx|, |dy|)`), so the hero stops beside it; when it is not known, or not open, `null`. Me at the goal: `null`. A `world` that is not a `world`, or a `target` that is not a `point`, throws a `TypeError`.

## Function - sighted:
`sighted(world, me) -> array`. The `id`s of the monsters hostile to a hero (`bestiary.hostile('hero', kind)`) with at least one cell they cover in me's sight, in the order of the world's `monsters`: the enemies me sees now. A `world` that is not a `world` throws a `TypeError`.

# Intrinsics:
## Intrinsic - explores:
On the grid `['#######', '#.....#', '#######']` with `Ann` alive at (1, 1) and the cells of the columns 0 to 3 `explored` (every row), none `visible`: `explore(w, 'Ann')` is `move(1, 0)` (toward (3, 1), the frontier). With every cell `explored`: `null` (nothing left, no stairs). On `['#######', '#...>.#', '#######']` with every cell `explored` and Ann at (1, 1): `move(1, 0)` (toward the stairs); with Ann on (4, 1): `null`. `explore(w, 'Eve')` (no such hero) is `null`, and so is it for Ann not alive.

## Intrinsic - toward:
On the grid `['#######', '#.....#', '#.....#', '#######']`, every cell `explored` and `visible`, `Ann` at (1, 1): `toward(w, 'Ann', point(2, 2))` is `move(1, 1)`; `toward(w, 'Ann', point(5, 2))` `move(1, 0)` (of the shortest paths, the one whose first step comes first in the order); `toward(w, 'Ann', point(1, 2))` `move(0, 1)`; `toward(w, 'Ann', point(1, 1))` `null`; `toward(w, 'Ann', point(0, 0))` (a wall) `null`. With a `slime` at (2, 1): `toward(w, 'Ann', point(3, 1))` is `move(1, 1)` (around it), and `toward(w, 'Ann', point(2, 1))` (the slime's own cell) `null`, Ann being next to it already. With the slime at (2, 1) not `visible` (only `explored`), `toward(w, 'Ann', point(3, 1))` is `move(1, 0)` (unseen monsters are not planned around). With nothing `explored` or `visible` but Ann's cell: `toward(w, 'Ann', point(3, 1))` is `null`.

## Intrinsic - corners:
On the grid `['#####', '#.#.#', '#...#', '#####']`, every cell `explored`, `Ann` at (1, 1): `toward(w, 'Ann', point(3, 1))` is `move(0, 1)` (the diagonal to (2, 2) cuts the corner (2, 1): it goes down first).

## Intrinsic - blocked:
On the grid `['#######', '#.....#', '#######']`, every cell `explored` and `visible`, `Ann` at (1, 1) and `Bob` alive at (2, 1): `toward(w, 'Ann', point(4, 1))` is `null` (Bob fills the corridor); with Bob not alive, `move(1, 0)`. With a `sword` ware (`price` 30) at (3, 1) instead: `toward(w, 'Ann', point(5, 1))` is `null`, and `toward(w, 'Ann', point(3, 1))` is `move(1, 0)` (toward (2, 1), beside the ware).

## Intrinsic - sighted:
On an all-`floor` 20 by 20 grid (`of`) with every cell `visible`, `Ann` at (2, 2): a `bat` (id 10) at (5, 5) and a `slime` (id 11) at (12, 2) (10 away): `sighted(w, 'Ann')` is `[10]`. With `Bob` at (11, 2), the slime is still not in Ann's sight: `[10]`. With the bat's cell not `visible`, `[]`. On `['#########', '#...#...#', '#########']`, every cell `visible`, Ann at (1, 1) and a bat (id 10) at (6, 1): `[]` (the wall at (4, 1) is between). `sighted(w, 'Eve')` is `[]`.

## Intrinsic - refuses:
`explore({}, 'Ann')`, `toward(w, 'Ann', {x: 1, y: 1})` (a plain object, not a `point`) and `sighted(null, 'Ann')` throw a `TypeError`.
