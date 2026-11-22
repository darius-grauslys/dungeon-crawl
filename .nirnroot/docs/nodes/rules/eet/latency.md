# rules: edge test `latency`

Plain `node:test` tests in Node. Build the small worlds the intrinsics
describe with `world`'s `of`: the grid from `tile-grid`'s `fromRows`, each
hero with `hero`'s `of` around an `actor` of kind `hero` (ids 0, 1, ...;
stats as the intrinsic says, else `{hp: 24, maxHp: 24, attack: 4,
defense: 1}`; `ready` 0 unless said), monsters with `actor`'s `of` (ids
10, 11, ...; stats as the intrinsic says, else `{hp: 5, maxHp: 5,
attack: 2, defense: 0}`, `range` 1 unless said; `ready` 10000 unless said, so they stay out of
the way; `held` 0, `facing` `right`, `last` null, `mode` `roam`, `size` 1 unless said), items with `item`'s `of` (`price` 0 unless said), `mask`'s `empty` for both masks, seed
1, rng 1 (unless the intrinsic varies it), depth 1, time 0, state
`playing`, gold 0, an empty log, and `entry` the save of seed 1, depth 1
and the heroes' names and stats. For the `lair`, `levers`' worlds from `fromSave`, change actors
with `with`. Intents come from `intent`'s
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
- [shape:level](../../../shapes/level.md)
- [shape:bestiary](../../../shapes/bestiary.md)

# Intrinsics:
## Intrinsic - new-game:
As the EED states.

## Intrinsic - joins:
As the EED states.

## Intrinsic - immutable:
As the EED states: for `join(newGame(3), 'Ann')` with each of the eight moves, `attack()`, `face(0, 1)`, `use`, `wait` and `descend` intended and then advanced by 50, 200 and 1000.

## Intrinsic - latency:
As the EED states.

## Intrinsic - diagonal:
As the EED states.

## Intrinsic - picks-up:
As the EED states, one world per item kind.

## Intrinsic - attacks:
As the EED states.

## Intrinsic - ranged:
As the EED states.

## Intrinsic - slowed:
As the EED states.

## Intrinsic - held:
As the EED states.

## Intrinsic - faces:
As the EED states.

## Intrinsic - monsters-act:
As the EED states.

## Intrinsic - groups:
As the EED states.

## Intrinsic - dies:
As the EED states.

## Intrinsic - wipe:
As the EED states.

## Intrinsic - descends:
As the EED states.

## Intrinsic - shop:
As the EED states.

## Intrinsic - buys:
As the EED states: the ware with `item`'s `of` and its `price`.

## Intrinsic - lair:
As the EED states.

## Intrinsic - levers:
As the EED states.

## Intrinsic - wakes:
As the EED states.

## Intrinsic - golem-dies:
As the EED states: replace the heroes and monsters of the `lair` world with `with`.

## Intrinsic - misses:
As the EED states: match each log line with a regular expression and read `<n>` from it.

## Intrinsic - rolls-advance:
As the EED states. Read `rng` from the world answered; set the skeleton back to 30 hit points with the shapes (`actor.with`, `stats.of`) between attacks.

## Intrinsic - magic:
As the EED states: build the golem with `actor`'s `of` (`size: 1`, `mode: 'roam'`) and its stats with `stats`'s `of`.

## Intrinsic - themes:
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

## Intrinsic - bestiary/valid:
As the shape states.

## Intrinsic - level/valid:
As the shape states.
