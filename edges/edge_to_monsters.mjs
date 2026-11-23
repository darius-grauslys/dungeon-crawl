// The call site for monsters: forwards to its surface, nothing else.
// monsters's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/monsters/index.mjs";

// __nirnroot_begin__ decide
// `decide(monster, grid, foes, threats, blocked, turn) -> intent`. `monster` an `actor` not of kind `hero`; `grid` a `tile-grid`; `foes` an array of `point`s, the cells of the creatures it fights (every cell each covers), in the caller's order of preference; `threats` an array of `point`s, the cells of the creatures it flees; `blocked` an array of `point`s, the cells it may not step onto (other creatures, wares, levers); `turn` an integer of 0 or more. Anything else throws a `TypeError`. With its `reach` from `bestiary.entry(monster.kind)`, in order, the first that applies:
// 1. A `dormant` monster waits; so does one whose `bestiary` `ability` is `summon` (a scarecrow never moves nor attacks: `rules` makes it chant).
// 2. A slime (`bestiary`'s `SLIMES`) on an odd `turn` waits.
// 3. **Keeping its distance.** A monster whose `mode` is `roam` and whose `stats.range` is above 1, with the nearest foe's cell at a distance below its `range` (a foe has come close): **if its `last` is a `move`** (its last action was a step) **and a foe's cell is in line** (the first such in `foes`), it shoots between steps: an `attack` toward that cell. Otherwise, among its free steps, the one that leaves it farthest from the nearest foe's cell (the first in the order of preference on a tie), if that is farther than it is now: it backs off, one step at a time, until the foe is at its full range. With no step that takes it farther (it is cornered), go on to the next rules (it fights where it stands).
// 4. If it is next to a foe's cell (the first such in `foes`): a `move` toward that cell (an attack); but a monster whose `ability` is `fuse` (a pumpkin) never attacks: next to a foe, it waits.
// 5. A `guard` waits.
// 6. If a threat's cell is within 5 of it: it flees: among its free steps, the one that leaves it farthest from the nearest threat's cell (the first in the order of preference on a tie), if that is farther than it is now; else it waits.
// 7. If its `stats.range` is above 1 and a foe's cell is in line (the first such in `foes`): an `attack` toward it (the direction from the monster to the cell).
// 8. If a foe's cell is within its `reach` (the nearest such cell; on a tie, the first in `foes`): a step toward it: count, with a breadth-first search of free steps to a depth of 20, how many steps each square needs to be next to that cell; among its free steps, the one whose square needs the fewest more; on a tie, the one whose moved square's nearest cell to the foe's cell is the nearest to it by `dx * dx + dy * dy`; then the first in the order of preference. With no such path of at most 20 steps, it waits.
// 9. Otherwise it waits.
// __nirnroot_end__
export function decide(...args) {
  return target.decide(...args);
}
