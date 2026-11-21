# rules

The game itself, in real time: making a new game or one from a save,
players joining the party, each player's next action, and the clock that
fires them. Pure: every function answers a new `world` and changes
nothing; everything random comes from the world's `rng`, so the same
world and arguments always give the same answer.

**Latency.** Every actor has a `ready` time (its actor's `ready`, in world
milliseconds). A hero's action fires as soon as the world's `time` has
reached its `ready` and it has a `pending` intent: the last one asked for
with `intend` (a later `intend` replaces an earlier one that hasn't fired).
Firing clears `pending` and sets `ready` to the time it fired plus
**200**. A monster acts whenever its `ready` has been reached, and then
its `ready` is that time plus **400**. Every action costs the same, of
every kind.

A hero starts with stats `{hp: 24, maxHp: 24, attack: 4, defense: 1}`.
Depths run from 1 to 5. Two cells are **within 5** of each other when
`max(|dx|, |dy|) <= 5`.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:intent](../../shapes/intent.md)
- [shape:save](../../shapes/save.md)

# Functions:
## Function - new-game:
`newGame(seed) -> world`. `seed` an integer from 0 to 4294967295 (anything else throws a `TypeError`). Depth 1, time 0, state `playing`, gold 0, no heroes, the floor `dungeon` makes for this seed and depth 1, `2 + 2 * depth` monsters and the floor's items placed on its spots, every monster's `ready` 0, `visible` and `explored` all false, `entry` the save of this seed, depth 1 and no players, and a log of one line: `Welcome to the dungeon. Find the stairs (>).`

## Function - from-save:
`fromSave(save) -> world`. `save` a `save` (anything else throws a `TypeError`). As `newGame(save.seed)`, but on the floor of `save.depth`, freshly placed, with the save's players as its heroes, in their order, each alive with the saved stats (a saved `hp` of 0 is 1), `pending` null, `ready` 0, on the floor's start cells (the ISD); `visible` what they see, `explored` the same; `entry` the save (with any `hp` of 0 made 1); the log the welcome line.

## Function - to-save:
`toSave(world) -> save`. The world's seed and depth, and its heroes, in order, each `{name, stats}` with its stats as they are now, but a hero that is not alive saved at 1 hit point.

## Function - join:
`join(world, name) -> world | null`. `name` a name (`save`'s `isName`; anything else throws a `TypeError`). A hero of that name already in the world: the same world (`===`). Else, with 4 heroes: `null`. Else the world with a new hero of that name at the end of `heroes`: the starting stats, alive, `pending` null, `ready` the world's `time`, on the first free start cell, its actor's `id` the smallest of 0 to 3 no hero has; added to `entry`'s players too (with the starting stats); `visible` and `explored` taking in what it sees; the log line `<name> joins the party.`

## Function - intend:
`intend(world, name, intent) -> world`. `intent` an `intent` (anything else throws a `TypeError`). The world with that hero's `pending` the intent. A name no hero has, a hero not alive, or a world whose state is not `playing`: the same world (`===`).

## Function - advance:
`advance(world, ms) -> world`. `ms` an integer from 1 to 1000 (anything else throws a `TypeError`). The world `ms` later: `time` is `ms` more. A world whose state is not `playing` changes no more than that. Otherwise, in this order:
1. **Heroes**, in their order: each alive hero whose `ready` is at most the new `time` and that has a `pending` intent fires it:
   - `move` into a `wall`, or onto another alive hero: nothing happens.
   - `move` onto a monster, or `attack` toward a cell: an attack on the monster standing there (`combat`, a roll from the world's `rng`); `attack` toward a cell no monster holds: nothing happens. A monster brought to 0 hit points is removed.
   - `move` onto an open cell no creature holds: the hero steps there and picks up every item there (as the `item` shape says, the gold the party's).
   - `use`, `wait`: nothing happens (yet).
2. **Monsters**, in the order of `monsters`: each whose `ready` is at most the new `time` takes its action (`monsters.decide`, going for the nearest alive hero; with none alive it waits): a move onto an alive hero is an attack on it (`combat`); a move onto an open cell no creature holds is a step there; anything else, nothing. A hero brought to 0 hit points is no longer alive (its actor stays where it fell, and no one else sees it there: it blocks nothing and is not drawn).
3. **A wipe**: with at least one hero and none alive, the floor starts again from `entry`: the world `fromSave(entry)` would give, but keeping `time`, `gold` and the log (every `ready` the current `time`), with the line `The party has fallen. Depth <d> begins again.`
4. **The stairs** (a grid with no `stairs` cell never has them): with at least one hero alive and every alive hero within 5 of the stairs: on depth 5 the state becomes `won` (log `The party escapes the dungeon with <g> gold!`); otherwise the next depth's floor, freshly placed (monsters' `ready` the current `time`), every hero on its start cells, alive, each `maxHp` 4 more, `hp` 4 more for one that was alive (never above `maxHp`) and 1 for one that wasn't, `ready` the current `time`, `pending` null; `explored` reset; `entry` the save of the new floor and the heroes as they now are; log `The party descends to depth <d>.`
5. `visible` is computed again from every alive hero's cell (radius 7), and `explored` takes in `visible`.
Every event adds a line to the log (the 50 most recent are kept).

# Intrinsics:
## Intrinsic - new-game:
`newGame(5)` twice gives deep-equal worlds. `newGame(5)`: depth 1, time 0, state `playing`, gold 0, seed 5, no heroes, exactly 4 monsters, each on an open cell, no two on one cell, each `ready` 0; at least 4 items; `visible.count()` and `explored.count()` 0; `entry` deep equal to `save.of({seed: 5, depth: 1, players: []})`; the log exactly `['Welcome to the dungeon. Find the stairs (>).']`. The grid is 48 by 32.

## Intrinsic - joins:
`w = join(newGame(5), 'Ann')`: one hero `Ann`, alive, `pending` null, stats `{hp: 24, maxHp: 24, attack: 4, defense: 1}`, `ready` 0, on an open cell no monster holds, its actor's `id` no monster's or item's; `visible.at` its cell true; `entry.players` one entry, `Ann` with those stats; the log's last line `Ann joins the party.` `join(w, 'Ann')` is `w`. `join(w, 'Bob')` puts `Bob` on another cell. With four heroes, `join(w4, 'Eve')` is `null`. `join(w, '')` throws a `TypeError`.

## Intrinsic - immutable:
For a world `w` with a hero, `intend(w, ...)`, `advance(w, ...)`, `join(w, ...)` and `toSave(w)` leave `w` as it was before.

## Intrinsic - latency:
In a world on `['#######', '#.....#', '#######']` with `Ann` at (1, 1), `ready` 0, time 0, no monsters: `advance(intend(w, 'Ann', move(1, 0)), 50)` has Ann at (2, 1), her `ready` 250, `pending` null, time 50. Then `intend` of `move(1, 0)` and then `move(-1, 0)`, and `advance` by 50 three times: Ann is still at (2, 1) with `pending` `move(-1, 0)`; a fourth `advance` by 50 (time 250): Ann at (1, 1), `ready` 450. A `move(0, -1)` into the wall fires (her `ready` is pushed on by 200) and leaves her where she was. With no `pending`, `advance` leaves her `ready` as it was.

## Intrinsic - picks-up:
In that world, with an item at (2, 1), after Ann's `move(1, 0)` fires the item is gone from `items` and: a `gold` of amount 7 makes `gold` 7 more; a `potion`, with Ann at 10 of 24 hit points, makes her `hp` 18, and at 20 of 24 makes it 24; a `sword` makes her `attack` 2 more; an `armor` makes her `defense` 1 more.

## Intrinsic - attacks:
In a world on `['######', '#....#', '######']` with `Ann` (attack 4) at (1, 1) and a `bat` of 1 hit point (defense 0, `ready` 10000) at (2, 1): for `rng` from 0 to 39, Ann's `move(1, 0)` (one `advance` by 50) leaves her at (1, 1) every time; in at least one the bat is gone from `monsters`, and in at least one it is still there with 1 hit point. `attack(1, 0)` does the same; `attack(-1, 0)` (toward the wall) changes nothing but Ann's `ready`.

## Intrinsic - monsters-act:
In a world on `['#########', '#.......#', '#########']` with `Ann` at (1, 1) and a `skeleton` at (4, 1) of `ready` 0: after `advance(w, 50)` the skeleton is at (3, 1) and its `ready` 450; after more `advance`s by 50 up to time 400 it is still there, and at time 450 it is at (2, 1). With `Bob` also there, at (6, 1), the skeleton's first step is to (5, 1) (Bob is the nearer).

## Intrinsic - dies:
In a world on `['#########', '#.......#', '#########']` with `Ann` at 1 of 24 hit points, defense 0, at (1, 1), `Bob` at (7, 1), and a `demon` (attack 6, `ready` 0) at (2, 1): for `rng` from 0 to 39, after `advance(w, 50)` in at least one Ann is not alive, at 0 hit points, Bob is alive, and the depth is still 1. `intend` for a hero not alive answers the same world.

## Intrinsic - wipe:
In a world on `['#####', '#...#', '#####']` with the one hero `Ann` at 1 of 24 hit points, defense 0, at (1, 1), a `demon` (attack 6, `ready` 0) at (2, 1), gold 3, and `entry` `save.of({seed: 1, depth: 1, players: [{name: 'Ann', stats: 24/24/4/1}]})`: for `rng` from 0 to 39, in at least one `advance(w, 50)` answers a world at depth 1 on a 48 by 32 grid (`newGame(1)`'s), with `Ann` alive at 24 of 24, time 50, gold 3, and the log's last line `The party has fallen. Depth 1 begins again.`

## Intrinsic - descends:
In a world on `['##########', '#.>......#', '##########']` at depth 1 with `Ann` (20 of 24) at (7, 1) and `Bob` not alive (0 of 24) at (1, 1): `advance(w, 50)` is at depth 2, its grid 48 by 32, Ann alive at 24 of 28, Bob alive at 1 of 28, both on open cells, `explored` holding nothing that isn't `visible`, `entry` the save of depth 2 with those two, and the log's last line `The party descends to depth 2.` With Ann at (8, 1) instead (6 from the stairs): still depth 1. At depth 5, within 5: the state is `won`, the log's last line `The party escapes the dungeon with <gold> gold!`, and a later `advance` changes only `time`.

## Intrinsic - saves:
`toSave` of the `descends` world before it descends is `{seed, depth: 1, players: [Ann at 20 of 24, Bob at 1 of 24]}`. For `s = save.of({seed: 9, depth: 3, players: [{name: 'Cy', stats: 10/30/6/2}]})`, `fromSave(s)` is at depth 3, time 0, state `playing`, on a 48 by 32 grid, with the one hero `Cy` alive at those stats on an open cell, its `entry` deep equal to `s`; `fromSave(s)` twice gives deep-equal worlds; a player saved at 0 hit points comes back at 1.

## Intrinsic - refuses:
`newGame(-1)`, `newGame(2.5)`, `advance(w, 0)`, `advance(w, 1.5)`, `advance(w, 1001)`, `intend(w, 'Ann', {kind: 'wait'})` (a plain object, not an `intent`), `join(w, 5)`, `fromSave({})` and `advance({}, 50)` throw a `TypeError`.
