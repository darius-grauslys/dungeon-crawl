# rules

The game itself, turn by turn: making a new game, and taking the hero's
turn and then every monster's. Pure: a turn answers a new `world` and
changes nothing; everything random comes from the world's `rng`, so the
same world and intent always give the same next world.

The hero starts with stats `{hp: 24, maxHp: 24, attack: 4, defense: 1}`.
Depths run from 1 to 5; taking the stairs on depth 5 wins.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:intent](../../shapes/intent.md)

# Functions:
## Function - new-game:
`newGame(seed) -> world`. `seed` an integer from 0 to 4294967295 (anything else throws a `TypeError`). Depth 1, turn 0, state `playing`, gold 0, the floor `dungeon` makes for this seed and depth 1, the hero (id 0, the starting stats) at its start, `2 + 2 * depth` monsters and the floor's items placed on its spots, `visible` what the hero sees from the start (radius 7), `explored` the same, and a log of one line: `Welcome to the dungeon. Find the stairs (>).`

## Function - step:
`step(world, intent) -> world`. `world` a `world`, `intent` an `intent` (anything else throws a `TypeError`). When the world's state is not `playing`, only `restart` does anything; any other intent answers the world unchanged. Otherwise the hero acts:
- `move` into a `wall`: nothing happens; the world is answered unchanged (no turn passes).
- `move` into a monster: the hero attacks it (`combat`, a roll from the world's `rng`); a monster brought to 0 hit points is removed.
- `move` into an open cell with no monster: the hero steps there and picks up every item there (as the `item` shape says).
- `wait`: nothing.
- `descend` off the stairs: nothing happens but a log line, `There are no stairs here.`; no turn passes.
- `descend` on the stairs: on depth 5 the state becomes `won`; otherwise the next depth's floor, freshly placed, with the hero at its start, its `maxHp` 4 more and its `hp` 4 more (never above `maxHp`).
- `restart`: answers `newGame` of the next seed (`(seed + 1) % 4294967296`), whatever the state.

After the hero's action (unless no turn passes, the game was won, or the hero descended), each monster, in the order of `monsters`, takes its turn (`monsters.decide`): a move onto the hero is an attack on it (`combat`); a move onto an open cell no creature holds is a step there; anything else, nothing. The hero brought to 0 hit points makes the state `dead`, and no monster after acts. Then `turn` is one more, `visible` is computed again from the hero's cell (radius 7), and `explored` takes in `visible`. Every event adds a line to the log (the 50 most recent are kept).

# Intrinsics:
## Intrinsic - new-game:
`newGame(5)` twice gives deep-equal worlds. `newGame(5)`: depth 1, turn 0, state `playing`, gold 0, seed 5, the hero of id 0 with the starting stats on an open cell, exactly 4 monsters, each on an open cell, no two on one cell, none on the hero's; at least 4 items; `visible.at(hero.pos.x, hero.pos.y)` true; `explored.cells()` equal to `visible.cells()`; the log exactly `['Welcome to the dungeon. Find the stairs (>).']`. The grid is 48 by 32.

## Intrinsic - immutable:
For a world `w` and any intent, `step(w, i)` leaves `w` deep equal to what it was before.

## Intrinsic - wall-bump:
In a world on `['#####', '#...#', '#####']` with the hero at (1, 1) and no monsters: `step(w, move(-1, 0))` has the same turn and the hero still at (1, 1); `step(w, move(1, 0))` has the hero at (2, 1), turn one more, `visible.at(3, 1)` true, and every cell true in `visible` true in `explored`.

## Intrinsic - picks-up:
In that world, with an item at (2, 1), after `move(1, 0)` the item is gone from `items` and: a `gold` of amount 7 makes `gold` 7 more; a `potion`, with the hero at 10 of 24 hit points, makes `hp` 18, and at 20 of 24 makes it 24; a `sword` makes `attack` 2 more; an `armor` makes `defense` 1 more.

## Intrinsic - attacks:
In a world on `['######', '#....#', '######']` with the hero (attack 4) at (1, 1) and a `bat` of 1 hit point (defense 0) at (2, 1): for `rng` from 0 to 39, `step(w, move(1, 0))` leaves the hero at (1, 1) every time; in at least one the bat is gone from `monsters`, and in at least one it is still there with 1 hit point.

## Intrinsic - monsters-act:
In a world on `['#######', '#.....#', '#######']` with the hero at (1, 1) and a `skeleton` at (4, 1): after `step(w, wait())` the skeleton is at (3, 1) and turn is 1.

## Intrinsic - dies:
In a world on `['#####', '#...#', '#####']` with the hero at 1 of 24 hit points, defense 0, at (1, 1), and a `demon` (attack 6) at (2, 1): for `rng` from 0 to 39, after `step(w, wait())` in at least one the state is `dead` and the hero's `hp` 0. Stepping a `dead` world with `move(1, 0)` or `wait()` answers a world deep equal to it.

## Intrinsic - descends:
In a world on `['#####', '#.>.#', '#####']` at depth 1 with the hero (20 of 24) at (2, 1): `step(w, descend())` is at depth 2, its grid 48 by 32, the hero at 24 of 28 hit points, at its new floor's start, with the same attack and defense, and the log's last line `You descend to depth 2.` With the hero at (1, 1) instead: the same turn, the same depth, and the log's last line `There are no stairs here.` At depth 5 on the stairs: the state is `won`.

## Intrinsic - restarts:
For a world `w` from `newGame(9)`, in any state, `step(w, restart())` is deep equal to `newGame(10)`. For a world of seed 4294967295, it is `newGame(0)`.

## Intrinsic - refuses:
`newGame(-1)`, `newGame(2.5)`, `step(w, {kind: 'wait'})` (a plain object, not an `intent`) and `step({}, wait())` throw a `TypeError`.
