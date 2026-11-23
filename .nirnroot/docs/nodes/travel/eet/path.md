# travel: edge test `path`

Pure: plain `node:test` tests in Node. Build the worlds with `world`'s
`of`: the grid from `tile-grid`'s `fromRows` (or `of` for an all-`floor`
grid), masks with `mask`'s `of` (true for the cells the intrinsic says,
row by row) or `empty`; seed 1, rng 1, depth 1, time 0, state
`playing`, gold 0, log `[]`, `entry` the save of seed 1, depth 1 and no
players; each hero with `hero`'s `of` around an `actor` of kind `hero`
(ids 0, 1, ...; stats `{hp: 24, maxHp: 24, attack: 4, defense: 1}`, or
`hp` 0 and `alive: false` for one not alive); monsters with `actor`'s
`of` (ids from 10, `{hp: 5, maxHp: 5, attack: 2, defense: 0}`); items
with `item`'s `of`. Unless an intrinsic says otherwise, every cell is
`explored` and none `visible`. Call the Node only through its call site,
define no stand-in for it, and compare an answer's `kind`, `dx` and
`dy` (or that it is `null`).

The edge under test:

- [eed:travel](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:point](../../../shapes/point.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:save](../../../shapes/save.md)
- [shape:stats](../../../shapes/stats.md)

# Intrinsics:
## Intrinsic - explores:
As the EED states.

## Intrinsic - toward:
As the EED states.

## Intrinsic - corners:
As the EED states.

## Intrinsic - blocked:
As the EED states.

## Intrinsic - sighted:
As the EED states.

## Intrinsic - refuses:
As the EED states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - world/data:
As the shape states.

## Intrinsic - point/valid:
As the shape states.

## Intrinsic - intent/valid:
As the shape states.
