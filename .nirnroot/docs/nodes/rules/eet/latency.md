# rules: edge test `latency`

Plain `node:test` tests in Node. Build the small worlds the intrinsics
describe with `world`'s `of`: the grid from `tile-grid`'s `fromRows`, each
hero with `hero`'s `of` around an `actor` of kind `hero` (ids 0, 1, ...;
stats as the intrinsic says, else `{hp: 24, maxHp: 24, attack: 4,
defense: 1}`; `ready` 0 unless said), monsters with `actor`'s `of` (ids
10, 11, ...; stats as the intrinsic says, else `{hp: 5, maxHp: 5,
attack: 2, defense: 0}`; `ready` 10000 unless said, so they stay out of
the way), items with `item`'s `of`, `mask`'s `empty` for both masks, seed
1, rng 1 (unless the intrinsic varies it), depth 1, time 0, state
`playing`, gold 0, an empty log, and `entry` the save of seed 1, depth 1
and the heroes' names and stats. Intents come from `intent`'s
constructors; "`x/y/a/d`" stats are `{hp: x, maxHp: y, attack: a,
defense: d}`. Find a hero by `name`. Compare worlds with
`assert.deepStrictEqual` only where the EED says deep equal; to check a
world unchanged, compare `JSON.stringify(w.data())` before and after.

The edge under test:

- [eed:rules](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:save](../../../shapes/save.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:point](../../../shapes/point.md)

# Intrinsics:
## Intrinsic - new-game:
As the EED states.

## Intrinsic - joins:
As the EED states.

## Intrinsic - immutable:
As the EED states: for `join(newGame(3), 'Ann')` with each of the four moves, `attack`, `use` and `wait` intended and then advanced by 50, 200 and 1000.

## Intrinsic - latency:
As the EED states.

## Intrinsic - picks-up:
As the EED states, one world per item kind.

## Intrinsic - attacks:
As the EED states.

## Intrinsic - monsters-act:
As the EED states.

## Intrinsic - dies:
As the EED states.

## Intrinsic - wipe:
As the EED states.

## Intrinsic - descends:
As the EED states.

## Intrinsic - saves:
As the EED states.

## Intrinsic - refuses:
As the EED states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - world/data:
As the shape states.

## Intrinsic - intent/valid:
As the shape states.

## Intrinsic - save/valid:
As the shape states.
