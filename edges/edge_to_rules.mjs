// The call site for rules: forwards to its surface, nothing else.
// rules's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/rules/index.mjs";

// __nirnroot_begin__ new-game
// `newGame(seed) -> world`. `seed` an integer from 0 to 4294967295 (anything else throws a `TypeError`). Depth 1, turn 0, state `playing`, gold 0, the floor `dungeon` makes for this seed and depth 1, the hero (id 0, the starting stats) at its start, `2 + 2 * depth` monsters and the floor's items placed on its spots, `visible` what the hero sees from the start (radius 7), `explored` the same, and a log of one line: `Welcome to the dungeon. Find the stairs (>).`
// __nirnroot_end__
export function newGame(...args) {
  return target.newGame(...args);
}

// __nirnroot_begin__ step
// `step(world, intent) -> world`. `world` a `world`, `intent` an `intent` (anything else throws a `TypeError`). When the world's state is not `playing`, only `restart` does anything; any other intent answers the world unchanged. Otherwise the hero acts:
// - `move` into a `wall`: nothing happens; the world is answered unchanged (no turn passes).
// - `move` into a monster: the hero attacks it (`combat`, a roll from the world's `rng`); a monster brought to 0 hit points is removed.
// - `move` into an open cell with no monster: the hero steps there and picks up every item there (as the `item` shape says).
// - `wait`: nothing.
// - `descend` off the stairs: nothing happens but a log line, `There are no stairs here.`; no turn passes.
// - `descend` on the stairs: on depth 5 the state becomes `won`; otherwise the next depth's floor, freshly placed, with the hero at its start, its `maxHp` 4 more and its `hp` 4 more (never above `maxHp`).
// - `restart`: answers `newGame` of the next seed (`(seed + 1) % 4294967296`), whatever the state.
//
// After the hero's action (unless no turn passes, the game was won, or the hero descended), each monster, in the order of `monsters`, takes its turn (`monsters.decide`): a move onto the hero is an attack on it (`combat`); a move onto an open cell no creature holds is a step there; anything else, nothing. The hero brought to 0 hit points makes the state `dead`, and no monster after acts. Then `turn` is one more, `visible` is computed again from the hero's cell (radius 7), and `explored` takes in `visible`. Every event adds a line to the log (the 50 most recent are kept).
// __nirnroot_end__
export function step(...args) {
  return target.step(...args);
}
