# floor-plan

A freshly generated floor, before anything lives on it: its terrain,
where the heroes arrive, where the stairs are, the cells where monsters
and items may be placed, and, on a lair with a boss, where the boss
stands and where its levers are. Immutable.

The module (`shapes/floor-plan/index.mjs`) exports `of({grid, start,
stairs, spots, boss, levers, spikes})`: `grid` a `tile-grid`; `start` a `point`
whose cell is `floor`; `stairs` a `point` whose cell is `stairs`, not
`start`; `spots` an array of `point`s, each a `floor` cell, distinct,
none `start` or `stairs` (copied, and answered frozen); `boss` `null` or
a `point`, the top-left cell of the 3 by 3 square the boss stands on
(left out: `null`): every cell of that square `floor` or `stairs`, none
`start` or a spot; `levers` an array of `point`s (left out: `[]`), each a
`floor` cell, distinct, none `start`, `stairs`, a spot or a cell of the
boss's square (copied, and answered frozen); `spikes` an array (left
out: `[]`) of `{x, y, shift}` spike traps, each on a `floor` cell, none
`start` or `stairs`, no two on one cell, `shift` an integer from 0 to 5
(copied: each a frozen `{x, y, shift}`, the array frozen). Any other
input is refused with a `TypeError`.

# Fields:
## Field - grid:
Property `grid`.

## Field - start:
Property `start`.

## Field - stairs:
Property `stairs`.

## Field - spots:
Property `spots`: a frozen array of points.

## Field - boss:
Property `boss`: a point, or `null`.

## Field - levers:
Property `levers`: a frozen array of points.

## Field - spikes:
Property `spikes`: a frozen array of frozen `{x, y, shift}`.

# Intrinsics:
## Intrinsic - valid:
With `g = fromRows(['#####', '#..>#', '#####'])`:
`of({grid: g, start: point.of(1, 1), stairs: point.of(3, 1), spots: [point.of(2, 1)]})`
answers those values, `boss` null and `levers` an empty frozen array,
frozen, `spots` frozen too. A `start` on a wall, a `stairs` on a floor
cell, a spot equal to `start`, two equal spots, and `spots` not an array
each throw a `TypeError`. With `h = fromRows(['#######', '#.....#',
'#.....#', '#...>.#', '#.....#', '#######'])`: `of({grid: h, start:
point.of(1, 1), stairs: point.of(4, 3), spots: [point.of(1, 4)], boss:
point.of(3, 2), levers: [point.of(5, 1)]})` has those `boss` and
`levers`; a `boss` of (4, 2) (its square reaches the wall column 6), a
lever on (1, 4) (a spot) and a lever on (3, 2) (the boss's square) each
throw a `TypeError`. The first plan's `spikes` is an empty frozen
array; with `spikes: [{x: 2, y: 1, shift: 4}]` it holds that, frozen;
`spikes` of `[{x: 1, y: 1, shift: 0}]` (`start`), `[{x: 0, y: 0, shift:
0}]` (a wall), `[{x: 2, y: 1, shift: 6}]` or two on (2, 1) throw a
`TypeError`.

# Callbacks:
None

# API Shapes:
- [shape:tile-grid](tile-grid.md)
- [shape:point](point.md)
