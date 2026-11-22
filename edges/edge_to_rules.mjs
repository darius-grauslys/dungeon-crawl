// The call site for rules: forwards to its surface, nothing else.
// rules's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/rules/index.mjs";

// __nirnroot_begin__ new-game
// `newGame(seed) -> world`. `seed` an integer from 0 to 4294967295 (anything else throws a `TypeError`). Depth 1, time 0, state `playing`, gold 0, no heroes, the floor `dungeon` makes for this seed and depth 1, the floor's monsters and items placed on its spots as the ISD says, every monster's `ready` 0, `visible` and `explored` all false, `entry` the save of this seed, depth 1 and no players, and a log of one line: `Welcome to the dungeon. Find the stairs (>).`
// __nirnroot_end__
export function newGame(...args) {
  return target.newGame(...args);
}

// __nirnroot_begin__ from-save
// `fromSave(save) -> world`. `save` a `save` (anything else throws a `TypeError`). As `newGame(save.seed)`, but on the floor of `save.depth`, freshly placed, with the save's players as its heroes, in their order, each alive with the saved stats (a saved `hp` of 0 is 1), `pending` null, `ready` 0, on the floor's start cells (the ISD); `visible` what they see, `explored` the same; `entry` the save (with any `hp` of 0 made 1); the log the welcome line.
// __nirnroot_end__
export function fromSave(...args) {
  return target.fromSave(...args);
}

// __nirnroot_begin__ to-save
// `toSave(world) -> save`. The world's seed and depth, and its heroes, in order, each `{name, stats}` with its stats as they are now, but a hero that is not alive saved at 1 hit point.
// __nirnroot_end__
export function toSave(...args) {
  return target.toSave(...args);
}

// __nirnroot_begin__ join
// `join(world, name) -> world | null`. `name` a name (`save`'s `isName`; anything else throws a `TypeError`). A hero of that name already in the world: the same world (`===`). Else, with 4 heroes: `null`. Else the world with a new hero of that name at the end of `heroes`: the starting stats, alive, `pending` null, `ready` the world's `time`, on the first free start cell, its actor's `id` the smallest of 0 to 3 no hero has; added to `entry`'s players too (with the starting stats); `visible` and `explored` taking in what it sees; the log line `<name> joins the party.`
// __nirnroot_end__
export function join(...args) {
  return target.join(...args);
}

// __nirnroot_begin__ intend
// `intend(world, name, intent) -> world`. `intent` an `intent` (anything else throws a `TypeError`). The world with that hero's `pending` the intent. A name no hero has, a hero not alive, or a world whose state is not `playing`: the same world (`===`).
// __nirnroot_end__
export function intend(...args) {
  return target.intend(...args);
}

// __nirnroot_begin__ advance
// `advance(world, ms) -> world`. `ms` an integer from 1 to 1000 (anything else throws a `TypeError`). The world `ms` later: `time` is `ms` more. A world whose state is not `playing` changes no more than that. Otherwise, in this order:
// 1. **Heroes**, in their order: each alive hero whose `ready` is at most the new `time` and that has a `pending` intent fires it:
//    - `move` onto a ware's cell, or `attack` toward it: a bump (above).
//    - `move` into a `wall`, or onto another alive hero: nothing happens.
//    - `move` onto a monster, or `attack` toward a cell: an attack on the monster standing there (`combat`, a roll from the world's `rng`); `attack` toward a cell no monster holds: nothing happens. A monster brought to 0 hit points is removed.
//    - `move` onto an open cell no creature or ware holds: the hero steps there and picks up every item there (as the `item` shape says, the gold the party's).
//    - `use`, `wait`: nothing happens (yet).
//    - `descend` (a grid with no `stairs` cell: nothing happens): when every alive hero is within 5 of the stairs, the party goes down (the step 4 below takes it, after the monsters); otherwise nothing but the log line `All party members must be within 5 units of the exit!`.
// 2. **Monsters**, in the order of `monsters`: each whose `ready` is at most the new `time` takes its action (`monsters.decide`, going for the nearest alive hero; with none alive it waits): a move onto an alive hero is an attack on it (`combat`); a move onto an open cell no creature or ware holds is a step there; anything else, nothing. A hero brought to 0 hit points is no longer alive (its actor stays where it fell, and no one else sees it there: it blocks nothing and is not drawn).
// 3. **A wipe**: with at least one hero and none alive, the floor starts again from `entry`: the world `fromSave(entry)` would give, but keeping `time`, `gold` and the log (every `ready` the current `time`), with the line `The party has fallen. Depth <d> begins again.`
// 4. **The stairs**: only when a `descend` fired in step 1 with every alive hero within 5 of the stairs, and a hero is still alive and every alive hero is still within 5 of them after step 2 (else the line `All party members must be within 5 units of the exit!`): on depth 29 the state becomes `won` (log `The party escapes the dungeon with <g> gold!`); otherwise the next depth's floor, freshly placed (monsters' `ready` the current `time`), every hero on its start cells, alive, each `maxHp` 4 more, `hp` 4 more for one that was alive (never above `maxHp`) and 1 for one that wasn't, `ready` the current `time`, `pending` null, `offer` null; `explored` reset; `entry` the save of the new floor and the heroes as they now are; log `The party descends to depth <d>.`, and on a shop also `A shop! Bump a ware twice to buy it.`
// 5. `visible` is computed again from every alive hero's cell (radius 7) (on a shop: every cell), and `explored` takes in `visible`.
// Every event adds a line to the log (the 50 most recent are kept).
// __nirnroot_end__
export function advance(...args) {
  return target.advance(...args);
}
