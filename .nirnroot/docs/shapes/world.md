# world

The whole state of a game at one moment: everything `rules` needs to take
the next turn, and everything the screen shows. Immutable: a turn makes a
new world.

The module (`shapes/world/index.mjs`) exports `of(fields)`, answering a
frozen world, with `fields` an object of these keys:

| key | value |
|---|---|
| `seed` | integer, 0 to 4294967295: the game's seed |
| `rng` | integer, 0 to 4294967295: the random generator's state |
| `depth` | integer, 1 to 5: the floor the hero is on |
| `turn` | integer of 0 or more: turns taken |
| `state` | `playing`, `dead` or `won` |
| `grid` | a `tile-grid` |
| `hero` | an `actor` of kind `hero` |
| `monsters` | an array of `actor`s, none of kind `hero` |
| `items` | an array of `item`s |
| `visible` | a `mask` the grid's size: what the hero sees now |
| `explored` | a `mask` the grid's size: what the hero has ever seen |
| `gold` | integer of 0 or more |
| `log` | an array of strings, the oldest first, at most 50 |

Arrays are copied and answered frozen. Any key missing, of the wrong type,
or a mask of another size than the grid, is refused with a `TypeError`.

# Fields:
## Field - seed:
Property `seed`.

## Field - rng:
Property `rng`.

## Field - depth:
Property `depth`.

## Field - turn:
Property `turn`.

## Field - state:
Property `state`.

## Field - grid:
Property `grid`.

## Field - hero:
Property `hero`.

## Field - monsters:
Property `monsters`, a frozen array.

## Field - items:
Property `items`, a frozen array.

## Field - visible:
Property `visible`.

## Field - explored:
Property `explored`.

## Field - gold:
Property `gold`.

## Field - log:
Property `log`, a frozen array of strings.

## Field - with:
`with(changes)` answers a new world: this one with the keys of `changes`
put in, checked as `of` checks them; this one is unchanged. `with` is a
method every world shares (on its prototype, as a class method is), never
an own property: a world's own properties are its data keys alone, so two
worlds of equal fields are deep equal (`assert.deepStrictEqual`).

# Intrinsics:
## Intrinsic - valid:
A world built from a 5 by 3 grid (`fromRows`), a hero at (1, 1), one
`slime` monster, one `gold` item, `empty(5, 3)` masks, and the other keys
in range, has every value it was given, is frozen, and its `monsters`,
`items` and `log` are frozen. `state: 'paused'`, `depth: 6`,
`visible: empty(4, 3)`, a monster of kind `hero`, a `log` of 51 strings,
and a missing `gold`, each throw a `TypeError`. `w.with({turn: 9}).turn`
is 9 and `w.turn` is unchanged. Two worlds made by `of` from the same
fields pass `assert.deepStrictEqual`, and `with` is not an own property
(`Object.hasOwn(w, 'with')` false).

# Callbacks:
None

# API Shapes:
- [shape:tile-grid](tile-grid.md)
- [shape:actor](actor.md)
- [shape:item](item.md)
- [shape:mask](mask.md)
