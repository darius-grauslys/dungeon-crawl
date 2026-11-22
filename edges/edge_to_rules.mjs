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
// `fromSave(save) -> world`. `save` a `save` (anything else throws a `TypeError`). As `newGame(save.seed)`, but on the floor of `save.depth`, freshly placed (on a lair, as **Lairs** says), with the save's players as its heroes, in their order, each alive with the saved stats (a saved `hp` of 0 is 1), `pending` null, `ready` 0, the `i`-th player's `colour` `i` and `group` 0, on the floor's start cells (the ISD); `visible` what they see (on a shop, every cell), `explored` the same; `entry` the save (with any `hp` of 0 made 1); the log the welcome line.
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
// `join(world, name) -> world | null`. `name` a name (`save`'s `isName`; anything else throws a `TypeError`). A hero of that name already in the world: the same world (`===`). Else, with 4 heroes: `null`. Else the world with a new hero of that name at the end of `heroes`: the starting stats, alive, `pending` null, `ready` the world's `time`, its `colour` the smallest of 0 to 3 no other hero has and its `group` 0, on the first free start cell, its actor's `id` the smallest of 0 to 3 no hero has; added to `entry`'s players too (with the starting stats); `visible` and `explored` taking in what it sees; the log line `<name> joins the party.`
// __nirnroot_end__
export function join(...args) {
  return target.join(...args);
}

// __nirnroot_begin__ intend
// `intend(world, name, intent) -> world`. `intent` an `intent` (anything else throws a `TypeError`). A name no hero has, a hero not alive, or a world whose state is not `playing`: the same world (`===`). A `face(dx, dy)`: the world with that hero's actor aiming `(dx, dy)` and facing `actor.facingFor(dx, dy)`, nothing else changed (its `pending` stays). Any other intent: the world with that hero's `pending` the intent.
// __nirnroot_end__
export function intend(...args) {
  return target.intend(...args);
}

// __nirnroot_begin__ advance
// `advance(world, ms) -> world`. `ms` an integer from 1 to 1000 (anything else throws a `TypeError`). The world `ms` later: `time` is `ms` more. A world whose state is not `playing` changes no more than that. Otherwise, in this order:
// 1. **Heroes**, in their order: each alive hero whose `ready` is at most the new `time` and that has a `pending` intent fires it:
//    - `move` onto a ware's cell, or `attack` toward a ware next to it: a bump (above); onto a lever's cell, or toward a lever next to it: a pull (above).
//    - `move` into a `wall`, across a cut corner, or onto another alive hero: nothing happens.
//    - `move` onto a cell a monster covers: a melee attack on that monster (`reach` 1).
//    - `attack` toward a direction (or `attack()`, toward its aim): an attack along its range (**Attacks and range**); striking nothing, nothing happens.
//    - `move` onto an open cell no creature, ware or lever holds: the hero steps there and picks up every item there (as the `item` shape says, the gold the party's); when one of them is a `potion`, `sword`, `armor`, `ring` or `necklace`, its actor's `gesture` becomes `{kind: 'power', at}` (`at` the time it fired).
//    - `use`: a use of nothing: its actor's `gesture` becomes `{kind: 'use', at}`, and nothing else happens (yet).
//    - `wait`: nothing happens.
//    - `descend` (a grid with no `stairs` cell: nothing happens): when every alive hero is within 5 of the stairs, the party goes down (the step 4 below takes it, after the monsters); otherwise nothing but the log line `All party members must be within 5 units of the exit!`.
// 2. **Monsters**, in the order of `monsters` (one removed before its turn does nothing): each whose `ready` is at most the new `time` takes its action: a `dormant` one may wake (**Lairs**); then `monsters.decide`, with its foes the creatures hostile to it (the alive heroes, then the monsters), its threats the monsters it flees, and the cells it may not step onto: every other alive creature's cells, the wares' and the levers'. With no foe and no threat, it waits. A `move` whose moved square reaches a cell a hostile creature covers is a melee attack on that creature (the alive heroes before the monsters, in their order); a `move` onto cells all open, holding no creature, ware or lever, and not cutting a corner, is a step there; anything else, nothing. An `attack` is an attack along its range. A hero brought to 0 hit points is no longer alive (its actor stays where it fell, and no one else sees it there: it blocks nothing and is not drawn).
// 3. **A wipe**: with at least one hero and none alive, the floor starts again from `entry`: the world `fromSave(entry)` would give, but keeping `time`, `gold` and the log (every `ready` the current `time`), with the line `The party has fallen. <label> begins again.` (`<label>` `level.label(depth)`: `Level 3`, `Shop`, `Lair`).
// 4. **The stairs**: only when a `descend` fired in step 1 with every alive hero within 5 of the stairs, and a hero is still alive and every alive hero is still within 5 of them after step 2 (else the line `All party members must be within 5 units of the exit!`): on depth 33 the state becomes `won` (log `The party escapes the dungeon with <g> gold!`); otherwise the next depth's floor, freshly placed (monsters' `ready` the current `time`), every hero on its start cells, alive, its `colour` and `group` kept, `gesture` null, each `maxHp` 4 more, `hp` 4 more for one that was alive (never above `maxHp`) and 1 for one that wasn't, `ready` the current `time`, `pending` null, `offer` null, `slow` 0, `held` 0; `explored` reset; `entry` the save of the new floor and the heroes as they now are; the log: on a dungeon floor `The party descends to level <n>.` (`<n>` `level.number(depth)`); on a shop `The party descends to a shop.` and `A shop! Bump a ware twice to buy it.`; on the golem's lair `The party descends into a lair.` and `A golem guards the way down. Pull the levers to weaken it!`; on another lair `The party descends into a lair.` alone.
// 5. `visible` is computed again from every alive hero's cell (radius 7) (on a shop: every cell), and `explored` takes in `visible`.
// Every event adds a line to the log (the 50 most recent are kept).
// __nirnroot_end__
export function advance(...args) {
  return target.advance(...args);
}
