# rules

The game itself, in real time: making a new game or one from a save,
players joining the party, each player's next action, and the clock that
fires them. Pure: every function answers a new `world` and changes
nothing; everything random comes from the world's `rng`, so the same
world and arguments always give the same answer.

**Latency.** Every actor has its own `ready` time (its actor's `ready`,
in world milliseconds). A hero's action fires as soon as the world's
`time` has reached its `ready` and it has a `pending` intent: the last one
asked for with `intend` (a later `intend` replaces an earlier one that
hasn't fired). Firing clears `pending` and sets `ready` to the time it
fired plus that action's latency. A monster acts whenever its `ready` has
been reached, and then its `ready` is that time plus its action's latency.
Each kind of action has its own latency; a monster's are its kind's
`step` and `strike` (`bestiary`):

| action | hero | monster |
|---|---|---|
| a step (a `move` onto an open cell, or into a wall or a blocked cell) | **200** | `step` |
| an attack (an `attack`, a `move` onto a creature it fights, a bump, a pull) | **350** | `strike` |
| `use` | **250** | |
| `wait`, `descend` | **200** | `step` (a monster that waits) |

**Slowed.** A creature damaged by an attacker whose kind `slows`
(`bestiary`: the `blue-slime` and the `blue-snake`) is slowed: its
actor's `slow` becomes 3, and for a hero the log adds `<h>: you are
slowed!`. While its `slow` is above 0, each of its moves (steps, and
moves that go nowhere) and attacks (with bumps and pulls) that fires
takes twice its latency, and takes 1 off `slow`; its other actions are
as usual.

**Held.** An attack takes **300** ms to land. A creature attacked (hit or
missed) at time `t` is **held** until `t + 300` (its actor's `held`, the
larger of the old and the new): while the world's `time` is below its
`held`, it may not step. A hero's pending `move` that would not be an
attack stays pending, unfired, until `held` has passed; its `attack`,
`use`, `wait` and `descend` fire as usual. A held monster whose action
would be a step does nothing, and its `ready` becomes its `held` (it
decides again then); its attacks go on as usual.

**Directions and diagonals.** A `move` or an `attack` goes toward any
of the eight directions (`intent`). A diagonal step `(dx, dy)` **cuts a
corner** when either of the cells `(x + dx, y)` and `(x, y + dy)` beside
it is not open: a move that cuts a corner is a move into a wall (nothing
happens), and nothing is attacked across a cut corner.

**Aim and facing.** Every actor aims toward a direction (its actor's
`aim`; a new one aims right, `(1, 0)`). Every `move` and every `attack`
toward a direction that fires (even one into a wall, or toward an empty
cell) aims its actor that way and turns it to `actor.facingFor(dx, dy)`.
An `attack()` (both 0) goes toward the actor's `aim`, which it keeps. A
`face(dx, dy)` is not an action and never waits: `intend` aims the hero
that way and turns it at once (its `pending` and `ready` untouched).
An actor's `last` is set to `{kind, dx, dy, at, reach}` (`at` the time
it fired, `(dx, dy)` the direction it went) when it steps onto a new cell
(`kind` `move`, `reach` 1) or attacks (`kind` `attack`: every `attack`
that fires, every `move` onto a creature it fights, every bump and pull;
`reach` how many cells away the creature it struck was, else 1); a step
that goes nowhere leaves `last` as it was. The screen animates from
these. A new actor (a new game, a join, a new floor, a wipe) has `held`
0, `facing` `right`, `aim` `(1, 0)`, `slow` 0 and `last` null.

**Attacks and range.** An attack toward `(dx, dy)` by an actor of
`stats.range` `r` looks along the cells `pos + k * (dx, dy)` for `k` from
1 to `r` (for a creature bigger than one cell: from its `pos`): it stops
at the first cell that is not open (a wall), and at `k` 1 at a cut
corner; it strikes the first creature it reaches that is hostile to the
attacker (`bestiary`'s `hostile`; for a creature covering several cells,
any cell it covers), passing through friends; with none, nothing
happens. For a hero, a ware or a lever on the cell at `k` 1 is bumped or
pulled instead (below). Every hit is `combat`'s, a roll from the world's
`rng`; a creature brought to 0 hit points: a monster is removed, a hero
is no longer alive.

**Groups.** Monsters fight whatever is hostile to them: the alive
heroes, and, for a `demon`, the `vermin` (who fight back). A `vermin`
flees from a `demon` near it (`monsters`).

A hero starts with stats `{hp: 24, maxHp: 24, attack: 4, defense: 1,
range: 1}`. Two cells are **within 5** of each other when `max(|dx|,
|dy|) <= 5`; a creature is within `n` of a cell when one of the cells it
covers is.

**Depths.** Depths run from 1 to 33 (`level`): five themes of five
dungeon floors each (the levels 1 to 25), the monsters growing stronger
from one theme to the next, and between two themes a **shop** (depths 6,
13, 20 and 27) and then a **lair** (7, 14, 21 and 28). The stairs of
depth 33 win the game. Which monsters live on which floors is the ISD's.

**Shops.** A shop floor has no monsters, and every cell of it is
`visible` and `explored`. Its items are six **wares** (items with a
`price`), standing on the plan's spots, whose prices rise by a quarter
from each shop to the next (the ISD). A ware is never picked up: a hero
buys it by bumping it twice. A fired `move` onto a ware's cell, or
`attack` toward it (its cell next to the hero), is a **bump**: it fires
as an attack does (its latency, its aim and `facing`, its `last` of kind
`attack`), and it holds no one. On a bump of a ware that is not the
hero's `offer`, the hero's `offer` becomes that ware's `id`, with the
line `<h> looks at <ware>: <p> gold. Bump it again to buy.` On a bump of
the ware that is its `offer`: with the party's gold at least the price,
the gold goes down by the price, the ware is gone from `items`, the hero
gets its effect as if picked up (a potion heals 8 to at most `maxHp`, a
sword 2 more `attack`, an armor 1 more `defense`), and the line is `<h>
buys <ware> for <p> gold.`; with less, the line `Not enough gold for
<ware>: <p> needed, the party has <g>.`, and nothing else changes;
either way the `offer` is `null` again. Every other action of a hero
that fires sets its `offer` to `null` (a `face` is not one).
`<ware>` is `a potion`, `a sword` or `armor`, `<p>` its price.

**Lairs.** The first lair (depth 7) is the golem's. The `golem`
(`bestiary`; stats 40/40/16/12) stands on the plan's `boss` square, 3 by
3 cells, `dormant`, facing left; while it lives, the cell of the plan's
`stairs` (at the centre of its square) is `floor`: there is no way down.
A `lever` item stands on each of the plan's `levers`, and on every one
of the plan's `spots` a `slime` **guard** (`mode` `guard`, the slime's
stats of tier 0: 6/6/2/1): guards never move, but attack any foe next to
them. The other lairs are empty halls with their stairs open: no
monsters, no items.
- **Waking.** When a `dormant` monster's `ready` is reached, if an alive
  hero is within 4 of it (`max(|dx|, |dy|) <= 4` to a cell it covers),
  its `mode` becomes `roam` and the log adds `The <m> awakens!`; it then
  acts as any monster does (very slowly). Otherwise it waits.
- **Levers.** A hero's fired `move` onto a lever's cell, or `attack`
  toward it (next to it), **pulls** it if it is not yet `pulled`: it
  fires as an attack does (as a bump), the lever is `pulled`, and, while
  a `golem` lives, the golem's `attack` and `defense` are halved
  (`Math.floor`) and it shrinks: a `size` of 3 becomes 2, a `size` of 2
  becomes 1, and at `size` 1 it becomes `small` (it keeps its `pos`, the
  top-left cell). The line is `<h> pulls a lever. The golem weakens!`
  (with no golem alive, `<h> pulls a lever.`). A pulled lever bumped
  again: it fires as an attack, and nothing else happens. A lever is
  never picked up, and blocks a step like a ware.
- **The golem's death.** When the `golem` is brought to 0 hit points:
  it is removed, with the line `The golem is slain.`; every `guard`
  monster is removed too (`The guardians crumble.`); the plan's `stairs`
  cell (of `dungeon.generate(seed, depth)`) becomes `stairs` (`The way
  down opens!`); and gold spills from it (`Gold spills from the
  golem!`): from 25 to 75 gold in all, in 1 to 5 `gold` items (the ISD
  says how many and where), each on a `floor` cell within 2 of the
  golem's last square and outside it, holding no item and no creature,
  each `flung` from the cell at the centre of its square (`pos` plus
  `Math.floor(size / 2)` each way) at the time it died.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:intent](../../shapes/intent.md)
- [shape:save](../../shapes/save.md)
- [shape:level](../../shapes/level.md)
- [shape:bestiary](../../shapes/bestiary.md)

# Functions:
## Function - new-game:
`newGame(seed) -> world`. `seed` an integer from 0 to 4294967295 (anything else throws a `TypeError`). Depth 1, time 0, state `playing`, gold 0, no heroes, the floor `dungeon` makes for this seed and depth 1, the floor's monsters and items placed on its spots as the ISD says, every monster's `ready` 0, `visible` and `explored` all false, `entry` the save of this seed, depth 1 and no players, and a log of one line: `Welcome to the dungeon. Find the stairs (>).`

## Function - from-save:
`fromSave(save) -> world`. `save` a `save` (anything else throws a `TypeError`). As `newGame(save.seed)`, but on the floor of `save.depth`, freshly placed (on a lair, as **Lairs** says), with the save's players as its heroes, in their order, each alive with the saved stats (a saved `hp` of 0 is 1), `pending` null, `ready` 0, on the floor's start cells (the ISD); `visible` what they see (on a shop, every cell), `explored` the same; `entry` the save (with any `hp` of 0 made 1); the log the welcome line.

## Function - to-save:
`toSave(world) -> save`. The world's seed and depth, and its heroes, in order, each `{name, stats}` with its stats as they are now, but a hero that is not alive saved at 1 hit point.

## Function - join:
`join(world, name) -> world | null`. `name` a name (`save`'s `isName`; anything else throws a `TypeError`). A hero of that name already in the world: the same world (`===`). Else, with 4 heroes: `null`. Else the world with a new hero of that name at the end of `heroes`: the starting stats, alive, `pending` null, `ready` the world's `time`, on the first free start cell, its actor's `id` the smallest of 0 to 3 no hero has; added to `entry`'s players too (with the starting stats); `visible` and `explored` taking in what it sees; the log line `<name> joins the party.`

## Function - intend:
`intend(world, name, intent) -> world`. `intent` an `intent` (anything else throws a `TypeError`). A name no hero has, a hero not alive, or a world whose state is not `playing`: the same world (`===`). A `face(dx, dy)`: the world with that hero's actor aiming `(dx, dy)` and facing `actor.facingFor(dx, dy)`, nothing else changed (its `pending` stays). Any other intent: the world with that hero's `pending` the intent.

## Function - advance:
`advance(world, ms) -> world`. `ms` an integer from 1 to 1000 (anything else throws a `TypeError`). The world `ms` later: `time` is `ms` more. A world whose state is not `playing` changes no more than that. Otherwise, in this order:
1. **Heroes**, in their order: each alive hero whose `ready` is at most the new `time` and that has a `pending` intent fires it:
   - `move` onto a ware's cell, or `attack` toward a ware next to it: a bump (above); onto a lever's cell, or toward a lever next to it: a pull (above).
   - `move` into a `wall`, across a cut corner, or onto another alive hero: nothing happens.
   - `move` onto a cell a monster covers: a melee attack on that monster (`reach` 1).
   - `attack` toward a direction (or `attack()`, toward its aim): an attack along its range (**Attacks and range**); striking nothing, nothing happens.
   - `move` onto an open cell no creature, ware or lever holds: the hero steps there and picks up every item there (as the `item` shape says, the gold the party's).
   - `use`, `wait`: nothing happens (yet).
   - `descend` (a grid with no `stairs` cell: nothing happens): when every alive hero is within 5 of the stairs, the party goes down (the step 4 below takes it, after the monsters); otherwise nothing but the log line `All party members must be within 5 units of the exit!`.
2. **Monsters**, in the order of `monsters` (one removed before its turn does nothing): each whose `ready` is at most the new `time` takes its action: a `dormant` one may wake (**Lairs**); then `monsters.decide`, with its foes the creatures hostile to it (the alive heroes, then the monsters), its threats the monsters it flees, and the cells it may not step onto: every other alive creature's cells, the wares' and the levers'. With no foe and no threat, it waits. A `move` whose moved square reaches a cell a hostile creature covers is a melee attack on that creature (the alive heroes before the monsters, in their order); a `move` onto cells all open, holding no creature, ware or lever, and not cutting a corner, is a step there; anything else, nothing. An `attack` is an attack along its range. A hero brought to 0 hit points is no longer alive (its actor stays where it fell, and no one else sees it there: it blocks nothing and is not drawn).
3. **A wipe**: with at least one hero and none alive, the floor starts again from `entry`: the world `fromSave(entry)` would give, but keeping `time`, `gold` and the log (every `ready` the current `time`), with the line `The party has fallen. <label> begins again.` (`<label>` `level.label(depth)`: `Level 3`, `Shop`, `Lair`).
4. **The stairs**: only when a `descend` fired in step 1 with every alive hero within 5 of the stairs, and a hero is still alive and every alive hero is still within 5 of them after step 2 (else the line `All party members must be within 5 units of the exit!`): on depth 33 the state becomes `won` (log `The party escapes the dungeon with <g> gold!`); otherwise the next depth's floor, freshly placed (monsters' `ready` the current `time`), every hero on its start cells, alive, each `maxHp` 4 more, `hp` 4 more for one that was alive (never above `maxHp`) and 1 for one that wasn't, `ready` the current `time`, `pending` null, `offer` null, `slow` 0, `held` 0; `explored` reset; `entry` the save of the new floor and the heroes as they now are; the log: on a dungeon floor `The party descends to level <n>.` (`<n>` `level.number(depth)`); on a shop `The party descends to a shop.` and `A shop! Bump a ware twice to buy it.`; on the golem's lair `The party descends into a lair.` and `A golem guards the way down. Pull the levers to weaken it!`; on another lair `The party descends into a lair.` alone.
5. `visible` is computed again from every alive hero's cell (radius 7) (on a shop: every cell), and `explored` takes in `visible`.
Every event adds a line to the log (the 50 most recent are kept).

# Intrinsics:
## Intrinsic - new-game:
`newGame(5)` twice gives deep-equal worlds. `newGame(5)`: depth 1, time 0, state `playing`, gold 0, seed 5, no heroes, exactly 4 monsters, each a `bat`, `slime` or `snake`, on an open cell, no two on one cell, each `ready` 0, `mode` `roam`; at least 4 items; `visible.count()` and `explored.count()` 0; `entry` deep equal to `save.of({seed: 5, depth: 1, players: []})`; the log exactly `['Welcome to the dungeon. Find the stairs (>).']`. The grid is 48 by 32.

## Intrinsic - joins:
`w = join(newGame(5), 'Ann')`: one hero `Ann`, alive, `pending` null, stats `{hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1}`, `ready` 0, on an open cell no monster holds, its actor's `id` no monster's or item's, its `aim` `{dx: 1, dy: 0}`; `visible.at` its cell true; `entry.players` one entry, `Ann` with those stats; the log's last line `Ann joins the party.` `join(w, 'Ann')` is `w`. `join(w, 'Bob')` puts `Bob` on another cell. With four heroes, `join(w4, 'Eve')` is `null`. `join(w, '')` throws a `TypeError`.

## Intrinsic - immutable:
For a world `w` with a hero, `intend(w, ...)`, `advance(w, ...)`, `join(w, ...)` and `toSave(w)` leave `w` as it was before.

## Intrinsic - latency:
In a world on `['#######', '#.....#', '#######']` with `Ann` at (1, 1), `ready` 0, time 0, no monsters: `advance(intend(w, 'Ann', move(1, 0)), 50)` has Ann at (2, 1), her `ready` 250, `pending` null, time 50. Then `intend` of `move(1, 0)` and then `move(-1, 0)`, and `advance` by 50 three times: Ann is still at (2, 1) with `pending` `move(-1, 0)`; a fourth `advance` by 50 (time 250): Ann at (1, 1), `ready` 450. A `move(0, -1)` into the wall fires (her `ready` is pushed on by 200) and leaves her where she was. With no `pending`, `advance` leaves her `ready` as it was. In that world with Ann at (2, 1) at time 0, `attack(1, 0)` (toward nothing) advanced by 50 makes her `ready` 400; `use()`, 300; `wait()` and `descend()`, 250. Two heroes keep their own clocks: with `Bob` at (4, 1), `ready` 0, Ann's `attack(1, 0)` and Bob's `move(-1, 0)` advanced by 50 give Ann `ready` 400 and Bob `ready` 250 at (3, 1).

## Intrinsic - diagonal:
In a world on `['#####', '#...#', '#...#', '#####']` with `Ann` at (1, 1): `advance(intend(w, 'Ann', move(1, 1)), 50)` has Ann at (2, 2), `ready` 250, `aim` `{dx: 1, dy: 1}`, `facing` `right`, `last` `{kind: 'move', dx: 1, dy: 1, at: 50, reach: 1}`. In a world on `['#####', '#.#.#', '#...#', '#####']` with Ann at (1, 1), her `move(1, 1)` cuts the corner (2, 1): she stays at (1, 1), `ready` 250, `aim` `{dx: 1, dy: 1}`. In the first world with a `bat` of 1 hit point (defense 0, `ready` 10000) at (2, 2): for `rng` from 0 to 39, Ann's `move(1, 1)` leaves her at (1, 1) and in at least one the bat is gone, in at least one it is there with `held` 350.

## Intrinsic - faces:
In the `latency` world with Ann at (2, 1): a fired `move(-1, 0)` turns her `left`, `move(0, 1)` (into the wall) `left`, `move(1, 0)` `right`, `move(0, -1)` `right`, each aiming her that way. After her `move(1, 0)` fires at time 50, her `last` is `{kind: 'move', dx: 1, dy: 0, at: 50, reach: 1}`; after a `move(0, -1)` into the wall, `last` is as it was. `intend(w, 'Ann', face(-1, 1))` answers at once a world with Ann's `aim` `{dx: -1, dy: 1}`, `facing` `left`, and her `pending`, `ready`, cell and the world's `time` unchanged; with a `move(1, 0)` intended first, it is still her `pending` after the `face`. A hero who joins has `held` 0, `facing` `right`, `aim` `{dx: 1, dy: 0}` and `last` null. In the `monsters-act` world, the skeleton's first step leaves it `facing` `left` with `last` `{kind: 'move', dx: -1, dy: 0, at: 50, reach: 1}`.

## Intrinsic - picks-up:
In the `latency` world, with an item at (2, 1), after Ann's `move(1, 0)` fires the item is gone from `items` and: a `gold` of amount 7 makes `gold` 7 more; a `potion`, with Ann at 10 of 24 hit points, makes her `hp` 18, and at 20 of 24 makes it 24; a `sword` makes her `attack` 2 more; an `armor` makes her `defense` 1 more.

## Intrinsic - attacks:
In a world on `['######', '#....#', '######']` with `Ann` (attack 4) at (1, 1) and a `bat` of 1 hit point (defense 0, `ready` 10000) at (2, 1): for `rng` from 0 to 39, Ann's `move(1, 0)` (one `advance` by 50) leaves her at (1, 1) every time; in at least one the bat is gone from `monsters`, and in at least one it is still there with 1 hit point. In every one Ann's `ready` is 400 and the bat's `held`, if it is still there, 350. `attack(1, 0)` does the same, and so does `attack()` (her `aim` is `(1, 0)`); `attack(-1, 0)` (toward the wall) changes nothing but Ann's `ready` (400), `aim` (`{dx: -1, dy: 0}`), `facing` (`left`) and `last` (`{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 1}`).

## Intrinsic - ranged:
In a world on `['#######', '#.....#', '#######']` with `Ann` of stats 24/24/4/1 and `range` 3 at (1, 1), `Bob` at (2, 1), and a `bat` of 1 hit point (defense 0, `ready` 10000) at (4, 1): for `rng` from 0 to 39, Ann's `attack()` advanced by 50 leaves Ann and Bob where they were, Bob's hit points 24, Ann's `ready` 400 and `last` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 3}`; in at least one the bat is gone, in at least one it is there with `held` 350. With the bat at (5, 1) (4 away) instead, the bat is untouched (`held` 0) and Ann's `last` has `reach` 1. In a world on `['#######', '#..#..#', '#######']` with Ann (`range` 3) at (1, 1) and the bat at (4, 1), it is untouched (the wall stops the attack). In the first world with Ann alone at (1, 1) and an `archer` (stats 7/7/3/1, `range` 4, `ready` 0) at (5, 1): `advance(w, 50)` gives Ann `held` 350 and the archer `ready` 750, `facing` `left`, `last` `{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 4}`.

## Intrinsic - slowed:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24 of 24, defense 1) at (2, 1) and a `blue-snake` (attack 3, `ready` 0) at (3, 1): for `rng` from 0 to 39, in at least one `advance(w, 50)` Ann has fewer than 24 hit points, `slow` 3, and the log's last line `Ann: you are slowed!`; in every one where she has 24, her `slow` is 0. With Ann alone at (1, 1), `slow` 3, at time 0: her `move(1, 0)` advanced by 50 gives `ready` 450 and `slow` 2; then her `attack(1, 0)` advanced to time 450 gives `ready` 1150 and `slow` 1; then a `wait()` advanced to 1150 gives `ready` 1350 and `slow` still 1.

## Intrinsic - held:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24 of 24) at (2, 1) and a `skeleton` (attack 4, `ready` 0) at (3, 1): `advance(w, 50)` gives Ann `held` 350 (whether the skeleton hit or missed) and the skeleton `ready` 650, `facing` `left`, `last` `{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 1}`. Ann then intends `move(-1, 0)`: after `advance`s by 50 up to time 300 she is still at (2, 1), her `pending` `move(-1, 0)`; at time 350 she is at (1, 1). Instead, at time 100, an `attack(1, 0)` fires at once (her `ready` 450 and the skeleton's `held` 400). A held skeleton (`held` 1000, `ready` 0) at (4, 1) with Ann at (1, 1) does not step at time 50, and its `ready` is 1000.

## Intrinsic - monsters-act:
In a world on `['#########', '#.......#', '#########']` with `Ann` at (1, 1) and a `skeleton` at (4, 1) of `ready` 0: after `advance(w, 50)` the skeleton is at (3, 1) and its `ready` 450; after more `advance`s by 50 up to time 400 it is still there, and at time 450 it is at (2, 1). With `Bob` also there, at (6, 1), the skeleton's first step is to (5, 1) (Bob is the nearer).

## Intrinsic - groups:
In a world on `['#########', '#.......#', '#########']` with `Ann` at (7, 1), a `demon` (attack 6, `ready` 0) at (2, 1) and a `bat` (5 hit points, `ready` 10000) at (3, 1): `advance(w, 50)` leaves the demon at (2, 1) with `ready` 650 and `last` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 1}`, and the bat, if it is still there, with `held` 350; the log's last line names the demon and the bat (`The demon hits the bat for <n>.`, `Critical! The demon hits the bat for <n>.`, `The demon misses the bat.` or `The bat is slain.`). With an `imp` (`ready` 10000) at (2, 1), a `worm` (`ready` 0) at (4, 1) and Ann at (7, 1): the worm flees to (5, 1). A `skeleton` (`ready` 0) at (2, 1) next to a `bat` at (3, 1), with Ann at (7, 1), steps nowhere and attacks nothing (the bat is a friend): it stays at (2, 1), the bat untouched.

## Intrinsic - dies:
In a world on `['#########', '#.......#', '#########']` with `Ann` at 1 of 24 hit points, defense 0, at (1, 1), `Bob` at (7, 1), and a `demon` (attack 6, `ready` 0) at (2, 1): for `rng` from 0 to 39, after `advance(w, 50)` in at least one Ann is not alive, at 0 hit points, Bob is alive, and the depth is still 1. `intend` for a hero not alive answers the same world.

## Intrinsic - wipe:
In a world on `['#####', '#...#', '#####']` with the one hero `Ann` at 1 of 24 hit points, defense 0, at (1, 1), a `demon` (attack 6, `ready` 0) at (2, 1), gold 3, and `entry` `save.of({seed: 1, depth: 1, players: [{name: 'Ann', stats: 24/24/4/1}]})`: for `rng` from 0 to 39, in at least one `advance(w, 50)` answers a world at depth 1 on a 48 by 32 grid (`newGame(1)`'s), with `Ann` alive at 24 of 24, time 50, gold 3, and the log's last line `The party has fallen. Level 1 begins again.`

## Intrinsic - descends:
In a world on `['##########', '#.>......#', '##########']` at depth 1 with `Ann` (20 of 24) at (7, 1) and `Bob` not alive (0 of 24) at (1, 1): `advance(w, 50)` is still at depth 1 (nobody asked). `advance(intend(w, 'Ann', descend()), 50)` is at depth 2, its grid 48 by 32, Ann alive at 24 of 28, Bob alive at 1 of 28, both on open cells, `explored` holding nothing that isn't `visible`, `entry` the save of depth 2 with those two, and the log's last line `The party descends to level 2.` With Ann at (8, 1) instead (6 from the stairs): still depth 1, and the log's last line `All party members must be within 5 units of the exit!`. With Bob alive (24 of 24) at (1, 1) and Ann at (8, 1), Bob's `descend()` gives that same line and depth 1. At depth 5, within 5, after a `descend()`: depth 6, the log's last two lines `The party descends to a shop.` and `A shop! Bump a ware twice to buy it.` At depth 6: depth 7, the last two lines `The party descends into a lair.` and `A golem guards the way down. Pull the levers to weaken it!`. At depth 14: depth 15, the last line `The party descends to level 11.` At depth 33, within 5, after a `descend()`: the state is `won`, the log's last line `The party escapes the dungeon with <gold> gold!`, and a later `advance` changes only `time`.

## Intrinsic - shop:
`w = fromSave(save.of({seed: 4, depth: 6, players: [{name: 'Ann', stats: 24/24/4/1}]}))`: depth 6, its grid `at(31, 19)` `stairs` and `at(14, 10)` `floor`, no monsters, and six items, every one with a `price` above 0, on (16, 13), (19, 13), (22, 13), (25, 13), (28, 13) and (31, 13), of the kinds `potion`, `sword`, `armor`, `potion`, `sword`, `armor` in that order; each potion's price from 8 to 32, each sword's from 24 to 36, each armor's from 34 to 46; `visible.count()` and `explored.count()` 1536. At depth 27 the prices are from 27 to 51, 53 to 65 and 72 to 84.

## Intrinsic - buys:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24/24/4/1) at (1, 1), gold 50, and a `sword` ware of `id` 12 and `price` 30 at (2, 1): `advance(intend(w, 'Ann', move(1, 0)), 50)` leaves Ann at (1, 1) with `offer` 12, `ready` 400, `facing` `right`, `last` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 1}`, the ware still there, gold 50, and the log's last line `Ann looks at a sword: 30 gold. Bump it again to buy.` Then her `move(1, 0)` again, advanced by 350 (time 400): her `attack` is 6, `offer` null, the ware gone, gold 20, the log's last line `Ann buys a sword for 30 gold.` With gold 10 instead, the second bump leaves the ware there, gold 10, `offer` null, and the line `Not enough gold for a sword: 30 needed, the party has 10.` With a `wait()` fired between the two bumps, the second is a first again (`offer` 12, the ware there, gold 50); a `face(1, 0)` between them changes nothing (the second still buys). An `attack(1, 0)` bumps as the `move` does. An `armor` ware bought gives `defense` 2; a `potion` ware, with Ann at 10 of 24, `hp` 18.

## Intrinsic - lair:
`w = fromSave(save.of({seed: 4, depth: 7, players: [{name: 'Ann', stats: 24/24/4/1}]}))`: depth 7, Ann at (8, 16), the grid `at(33, 16)` `floor` (no stairs anywhere); 73 monsters: the first a `golem` at (32, 15), `size` 3, `mode` `dormant`, stats 40/40/16/12 (`range` 1), `facing` `left`; the other 72 each a `slime` of `mode` `guard` and stats 6/6/2/1, on the plan's 72 spots; 3 items, each a `lever` not `pulled`, on (12, 8), (12, 24) and (22, 16). `fromSave` at depth 14: no monsters, no items, `at(33, 16)` `stairs`.

## Intrinsic - levers:
In a world on `['##########', '#........#', '#........#', '#........#', '#........#', '##########']` with `Ann` (24/24/4/1) at (1, 1), `lever`s (ids 20, 21, 22) at (2, 1), (1, 2) and (2, 2), and a `golem` (id 10, stats 40/40/16/12, `size` 3, `mode` `dormant`, `ready` 10000) at (5, 2): Ann's `move(1, 0)` advanced by 50 leaves her at (1, 1), `ready` 400, `last` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 1}`, the lever (2, 1) `pulled`, the golem's `attack` 8, `defense` 6, `size` 2, `small` false, and the log's last line `Ann pulls a lever. The golem weakens!`. Then her `move(0, 1)` at time 400: the golem 4/3, `size` 1; then her `move(1, 1)` at time 750: the golem 2/1, `size` 1, `small` true, `pos` still (5, 2). A pulled lever bumped again changes nothing but Ann's `ready`, `aim`, `facing` and `last`. Ann never stands on a lever.

## Intrinsic - wakes:
In a world on `['##########', '#........#', '#........#', '#........#', '##########']` with `Ann` at (1, 1) and a `golem` (stats 40/40/16/12, `size` 3, `mode` `dormant`, `ready` 0) at (5, 1): `advance(w, 50)` gives the golem `mode` `roam` and `ready` 1650, the log holding `The golem awakens!`, and the golem at (4, 1). With the golem at (6, 1) (5 away): it stays `dormant` at (6, 1), `ready` 1650.

## Intrinsic - golem-dies:
`w` the `lair` world, with Ann's stats 24/24/40/1 and her at (31, 16), and the golem's `hp` 1, `defense` 0 and `ready` 10000: for `rng` from 0 to 39, Ann's `move(1, 0)` advanced by 50, in at least one: no monster left (the golem and every guard gone), `at(33, 16)` `stairs`, the log holding `The golem is slain.`, `The guardians crumble.`, `The way down opens!` and `Gold spills from the golem!`; from 1 to 5 new `gold` items, of amounts adding up to 25 to 75, each on a `floor` cell from 1 to 2 cells (`max(|dx|, |dy|)`) outside the golem's 3 by 3 square at (32, 15), no two on one cell, each `flung` `{x: 33, y: 16, at: 50}`. Ann's `descend()` then takes the party to depth 8.

## Intrinsic - themes:
`fromSave(save.of({seed: 3, depth: 8, players: [{name: 'Ann', stats: 24/24/4/1}]}))` has 4 monsters, each a `blue-slime` of 9/9/3/1, a `blue-snake` of 7/7/4/0 or a `skeleton` of 13/13/5/2 (`hp`/`maxHp`/`attack`/`defense`); at depth 33, 12 monsters, each a `worm` of 27/27/9/4, a `fire-slime` of 30/30/9/5, an `imp` of 36/36/10/5 or a `demon` of 48/48/11/6; at depth 15, 4 monsters, each a `beetle`, `mummy` or `cultist`, every `cultist` of `range` 4; at depth 22, each a `spider`, `ghost` or `reaper`; at depth 3, 8 monsters, each a `bat` of 3/3/2/0, a `slime` of 6/6/2/1 or a `snake` of 5/5/3/0. Over the seeds 0 to 19 at depth 5 (12 monsters each), every monster is a `bat`, `slime`, `snake`, `skeleton` (9/9/4/2) or `archer` (7/7/3/1, `range` 4), at least one is an `archer`, and the archers are at most a fifth of them all.

## Intrinsic - saves:
`toSave` of the `descends` world is `{seed, depth: 1, players: [Ann at 20 of 24, Bob at 1 of 24]}`. For `s = save.of({seed: 9, depth: 3, players: [{name: 'Cy', stats: 10/30/6/2}]})`, `fromSave(s)` is at depth 3, time 0, state `playing`, on a 48 by 32 grid, with the one hero `Cy` alive at those stats on an open cell, its `entry` deep equal to `s`; `fromSave(s)` twice gives deep-equal worlds; a player saved at 0 hit points comes back at 1.

## Intrinsic - refuses:
`newGame(-1)`, `newGame(2.5)`, `advance(w, 0)`, `advance(w, 1.5)`, `advance(w, 1001)`, `intend(w, 'Ann', {kind: 'wait'})` (a plain object, not an `intent`), `join(w, 5)`, `fromSave({})` and `advance({}, 50)` throw a `TypeError`.
