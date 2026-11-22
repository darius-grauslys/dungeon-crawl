# fov

Field of view: which cells the hero can see from where it stands. Pure.

A cell `c` is **in sight** from `o` when it is within the radius
(`(c.x - o.x)² + (c.y - o.y)² <= radius²`) and no `wall` lies strictly
between them on the line from `o` to `c`: the cells of that line are
those Bresenham's algorithm gives, stepping one cell at a time along the
longer of the two axes from `o` to `c`, `o` and `c` left out. `c` itself
may be a wall: a wall in sight is seen. `o` is always in sight.

A cell is **seen** when it is in sight, or when it is a `wall` and at
least one of its eight neighbours (orthogonal or diagonal) is in sight
and open (`floor` or `stairs`): revealing an open cell reveals the walls
around it, its corners included. Only walls are added this way, and only
next to an open cell that is itself in sight (it doesn't chain: a wall
next to a seen wall, or next to an open cell out of sight, is not seen).

# API Shapes:
- [shape:tile-grid](../../shapes/tile-grid.md)
- [shape:point](../../shapes/point.md)
- [shape:mask](../../shapes/mask.md)

# Functions:
## Function - compute:
`compute(grid, origin, radius) -> mask`. `grid` a `tile-grid`, `origin` a `point` inside it, `radius` an integer from 1 to 30; anything else throws a `TypeError`. Answers a mask of the grid's size, true for exactly the cells seen from `origin` (in sight, and the walls around the open cells in sight).

# Intrinsics:
## Intrinsic - open-room:
In a grid of `fromRows` 11 by 11, all `floor` inside a border of `wall`, from (5, 5) with radius 8: every cell is in sight (all 121, the border walls included). With radius 2: exactly the 13 cells within distance 2 of (5, 5).

## Intrinsic - walls-block:
In the grid `['#######', '#.....#', '#.#...#', '#.....#', '#######']`, from (1, 2) with radius 6: (2, 2), the wall, is in sight, and (3, 2), (4, 2), (5, 2) behind it on the same row are not; (1, 1) and (1, 3) are.

## Intrinsic - corridor:
In the grid `['#####', '#...#', '###.#', '###.#', '#####']`, from (1, 1) with radius 10: (3, 1) is in sight and (3, 3) is not.

## Intrinsic - origin-seen:
The origin's cell is in sight for every origin of an all-`floor` 6 by 4 grid (`of`) and radius 1; with radius 1 in that grid, from (2, 2), exactly 5 cells are in sight.

## Intrinsic - wall-edges:
In the grid `['#######', '#.....#', '#.....#', '#.....#', '#######']`, from (3, 2) with radius 1: the five cells in sight, (3, 2), (2, 2), (4, 2), (3, 1) and (3, 3), are seen, and so are the walls (2, 0), (3, 0), (4, 0), (2, 4), (3, 4) and (4, 4) ((2, 0) and (4, 0) touch (3, 1) only at a corner); the walls (1, 0), (5, 0), (0, 2) and (6, 2) are not, nor are the floor cells (2, 1) and (1, 1) (out of the radius); exactly 11 cells are seen. In the `corridor` grid from (1, 1) with radius 10: the wall (4, 0) is seen (its line is blocked at (3, 0), but it touches (3, 1), in sight, at a corner), and the wall (3, 4) is not (its only open neighbour, (3, 3), is not in sight).

## Intrinsic - refuses:
`compute(g, point.of(-1, 0), 3)`, `compute(g, point.of(0, 0), 0)`, `compute(g, point.of(0, 0), 31)`, `compute(g, {x: 0, y: 0}, 3)` and `compute(null, point.of(0, 0), 3)` throw a `TypeError`.
