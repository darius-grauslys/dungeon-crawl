# world

The whole state of one session's game at one moment: everything `rules`
needs to go on, and everything the screen shows. Immutable: every change
makes a new world. The server holds one per session and sends it to the
session's players (as `data()`), who rebuild it with `fromData`.

The module (`shapes/world/index.mjs`) exports `of(fields)`, answering a
frozen world, with `fields` an object of these keys:

| key | value |
|---|---|
| `seed` | integer, 0 to 4294967295: the game's seed |
| `rng` | integer, 0 to 4294967295: the random generator's state |
| `depth` | integer, 1 to 33 (`level`'s `MAX_DEPTH`): the floor the party is on |
| `time` | integer of 0 or more: milliseconds of play on this session (it stops while paused) |
| `state` | `playing` or `won` |
| `grid` | a `tile-grid` |
| `heroes` | an array of 0 to 4 `hero`s: no two with one name, no two actors with one `id` |
| `monsters` | an array of `actor`s, none of kind `hero` |
| `items` | an array of `item`s |
| `visible` | a `mask` the grid's size: what the living heroes see now |
| `explored` | a `mask` the grid's size: what the party has ever seen on this floor |
| `gold` | integer of 0 or more: the party's |
| `log` | an array of strings, the oldest first, at most 50 |
| `entry` | a `save`: the party as it entered this floor (a wipe starts the floor again from it) |

Arrays are copied and answered frozen. Any key missing, of the wrong type,
or a mask of another size than the grid, is refused with a `TypeError`.

It also exports `fromData(data)`: the world whose `data()` is `data`,
checked as `of` checks it (a `TypeError` for anything else), built with
the constructors of the shapes it holds.

**The data** (`data()`), every part a plain value:

| key | data |
|---|---|
| `seed`, `rng`, `depth`, `time`, `state`, `gold` | as they are |
| `log` | a plain array of the strings |
| `grid` | an array of strings, one per row, with `tile-grid`'s chars (`#`, `.`, `>`) |
| `visible`, `explored` | an array of strings, one per row, `1` for true and `0` for false |
| `heroes` | `[{name, alive, pending, offer, colour, group, actor}]`: `pending` `null` or `{kind, dx, dy}`; `offer` `null` or a ware's id |
| `monsters` | `[actor]` |
| `items` | `[{id, kind, pos: {x, y}, amount, price, pulled, flung}]`: `flung` `null` or `{x, y, at}` |
| `entry` | the save's `data()` |

An actor's data is `{id, kind, pos: {x, y}, stats: {hp, maxHp, attack, defense, range, magic, magicPower, magicResist}, ready, held, facing, last, aim: {dx, dy}, slow, mode, size, small, gesture}`,
`last` `null` or `{kind, dx, dy, at, reach}`, `gesture` `null` or `{kind, at}`.

# Fields:
## Field - seed:
Property `seed`.

## Field - rng:
Property `rng`.

## Field - depth:
Property `depth`.

## Field - time:
Property `time`.

## Field - state:
Property `state`.

## Field - grid:
Property `grid`.

## Field - heroes:
Property `heroes`, a frozen array.

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

## Field - entry:
Property `entry`, a `save`.

## Field - with:
`with(changes)` answers a new world: this one with the keys of `changes`
put in, checked as `of` checks them; this one is unchanged. `with` is a
method every world shares (on its prototype, as a class method is), never
an own property: a world's own properties are its data keys alone, so two
worlds of equal fields are deep equal (`assert.deepStrictEqual`).

## Field - data:
`data()` answers the data above, a fresh plain object. A method on the
prototype, never an own property.

# Intrinsics:
## Intrinsic - valid:
A world built from a 5 by 3 grid (`fromRows`), one hero `Ann` at (1, 1),
one `slime` monster, one `gold` item, `empty(5, 3)` masks, an `entry` of
`save.of({seed: 1, depth: 1, players: []})`, and the other keys in range,
has every value it was given, is frozen, and its `heroes`, `monsters`,
`items` and `log` are frozen. `depth: 33` is accepted. `state: 'dead'`, `depth: 34`, `time: -1`,
`visible: empty(4, 3)`, a monster of kind `hero`, five heroes, two heroes
named `Ann`, a `log` of 51 strings, a missing `gold` and a missing
`entry` each throw a `TypeError`. `w.with({time: 9}).time` is 9 and
`w.time` is unchanged. Two worlds made by `of` from the same fields pass
`assert.deepStrictEqual`; neither `with` nor `data` is an own property.

## Intrinsic - data:
For that world `w` (with Ann's `pending` `move(1, 0)`, her actor's
`held` 300, `facing` `'left'` and `last` `{kind: 'attack', dx: -1, dy: 0,
at: 50}` and `offer` 12, the slime's `last` `{kind: 'move', dx: 0, dy: 1, at: 20}`,
a second item, a `sword` ware of `id` 12 and `price` 30 at (3, 1), a
third, a `lever` `pulled` at (2, 1), a fourth, a `gold` of amount 5
`flung` from (1, 1) at 40, a second monster, a `golem` of `size` 2,
`small` true, `mode` `'dormant'`, `slow` 1, `aim` `{dx: -1, dy: 1}` and
stats of `range` 1, an `archer` third monster whose `last` is `{kind:
'attack', dx: 1, dy: 1, at: 30, reach: 3}` and stats of `range` 4, and
a `visible` true at (1, 1) alone): `fromData(JSON.parse(JSON.stringify(w.data())))`
passes `assert.deepStrictEqual` with `w`; `w.data().grid` is
`['#####', '#...#', '#####']` for `fromRows` of those rows, and
`w.data().visible[1]` is `'01000'`. `w.data().items[1].price` is 30 and
`w.data().heroes[0].offer` 12; `w.data().items[2].pulled` is true and
`w.data().items[3].flung` `{x: 1, y: 1, at: 40}`; `w.data().monsters[2].last.reach`
is 3 and `w.data().monsters[2].stats.range` 4. `fromData({})`, and `w.data()` with
`depth` 34, throw a `TypeError`.

# Callbacks:
None

# API Shapes:
- [shape:tile-grid](tile-grid.md)
- [shape:hero](hero.md)
- [shape:actor](actor.md)
- [shape:item](item.md)
- [shape:mask](mask.md)
- [shape:save](save.md)
- [shape:intent](intent.md)
- [shape:point](point.md)
- [shape:stats](stats.md)
- [shape:level](level.md)
- [shape:bestiary](bestiary.md)
