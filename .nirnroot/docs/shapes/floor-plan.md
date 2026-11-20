# floor-plan

A freshly generated dungeon floor, before anything lives on it: its
terrain, where the hero arrives, where the stairs are, and the cells
where monsters and items may be placed. Immutable.

The module (`shapes/floor-plan/index.mjs`) exports `of({grid, start,
stairs, spots})`: `grid` a `tile-grid`; `start` a `point` whose cell is
`floor`; `stairs` a `point` whose cell is `stairs`, not `start`; `spots`
an array of `point`s, each a `floor` cell, distinct, none `start` or
`stairs` (copied, and answered frozen). Any other input is refused with a
`TypeError`.

# Fields:
## Field - grid:
Property `grid`.

## Field - start:
Property `start`.

## Field - stairs:
Property `stairs`.

## Field - spots:
Property `spots`: a frozen array of points.

# Intrinsics:
## Intrinsic - valid:
With `g = fromRows(['#####', '#..>#', '#####'])`:
`of({grid: g, start: point.of(1, 1), stairs: point.of(3, 1), spots: [point.of(2, 1)]})`
answers those values, frozen, `spots` frozen too. A `start` on a wall, a
`stairs` on a floor cell, a spot equal to `start`, two equal spots, and
`spots` not an array each throw a `TypeError`.

# Callbacks:
None

# API Shapes:
- [shape:tile-grid](tile-grid.md)
- [shape:point](point.md)
