# rules: edge test `turns`

Plain `node:test` tests in Node. Build the small worlds the intrinsics
describe with `world`'s `of`: the grid from `tile-grid`'s `fromRows`, the
hero and monsters with `actor`'s `of` (hero id 0, monsters ids 1, 2, ...;
stats as the intrinsic says, else `{hp: 24, maxHp: 24, attack: 4,
defense: 1}` for the hero and `{hp: 5, maxHp: 5, attack: 2, defense: 0}`
for a monster), items with `item`'s `of`, `mask`'s `empty` for both
masks, seed 1, rng 1 (unless the intrinsic varies it), depth 1, turn 0,
state `playing`, gold 0 and an empty log. Intents come from `intent`'s
constructors. Compare worlds with `assert.deepStrictEqual` only where the
EED says deep equal.

The edge under test:

- [eed:rules](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:point](../../../shapes/point.md)

# Intrinsics:
## Intrinsic - new-game:
As the EED states.

## Intrinsic - immutable:
As the EED states: check it for `newGame(3)` with each of the four moves, `wait()` and `descend()`, comparing against a deep copy (`structuredClone` can't copy frozen class instances: compare `JSON.stringify` of the world before and after, or the values field by field).

## Intrinsic - wall-bump:
As the EED states.

## Intrinsic - picks-up:
As the EED states, one world per item kind.

## Intrinsic - attacks:
As the EED states.

## Intrinsic - monsters-act:
As the EED states.

## Intrinsic - dies:
As the EED states.

## Intrinsic - descends:
As the EED states.

## Intrinsic - restarts:
As the EED states: from `newGame(9)` itself, from it after a `wait()`, and from a copy of it with `state: 'dead'` (`with`).

## Intrinsic - refuses:
As the EED states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - intent/valid:
As the shape states.
