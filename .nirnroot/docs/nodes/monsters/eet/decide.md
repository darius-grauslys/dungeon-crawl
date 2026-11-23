# monsters: edge test `decide`

Pure: plain `node:test` tests in Node. Build monsters with `actor`'s `of`
(any `stats`, e.g. `{hp: 5, maxHp: 5, attack: 2, defense: 0}`, id 1;
`range` 4 for the `archer`; `mode` and `size` as the intrinsic says),
grids with `tile-grid`'s `of` or `fromRows`, and compare the answer's
`kind`, `dx` and `dy`. `foes` is the one foe's cell, `threats`,
`blocked` `[]` and `turn` 0 unless the EED says otherwise.

The edge under test:

- [eed:monsters](../EED.md)

# API Shapes:
- [shape:actor](../../../shapes/actor.md)
- [shape:point](../../../shapes/point.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:bestiary](../../../shapes/bestiary.md)

# Intrinsics:
## Intrinsic - adjacent-attacks:
As the EED states.

## Intrinsic - chases:
As the EED states.

## Intrinsic - reach:
As the EED states.

## Intrinsic - slime-slow:
As the EED states, in an all-`floor` 5 by 5 grid, the slime at (2, 2) and the foe at (2, 1).

## Intrinsic - guard:
As the EED states.

## Intrinsic - dormant:
As the EED states.

## Intrinsic - flees:
As the EED states.

## Intrinsic - shoots:
As the EED states.

## Intrinsic - kites:
As the EED states (`blocked` `[]`: the foe's own cell is not in it; set `last` with `actor`'s `of` or `with`).

## Intrinsic - abilities:
As the EED states.

## Intrinsic - no-path:
As the EED states.

## Intrinsic - refuses:
As the EED states.

## Intrinsic - actor/valid:
As the shape states.

## Intrinsic - actor/facing:
As the shape states.

## Intrinsic - point/valid:
As the shape states.

## Intrinsic - tile-grid/valid:
As the shape states.

## Intrinsic - actor/covers:
As the shape states.

## Intrinsic - bestiary/valid:
As the shape states.

## Intrinsic - intent/valid:
As the shape states.

## Intrinsic - stats/valid:
As the shape states.
