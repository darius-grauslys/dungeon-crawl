// The call site for travel: forwards to its surface, nothing else.
// travel's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/travel/index.mjs";

// __nirnroot_begin__ explore
// `explore(world, me) -> intent`. The next step of exploring: the path to the frontier cells. With no frontier reachable: the path to the `stairs` cell if it is known (me on it: `null`). Otherwise `null` (nothing left to explore). A `world` that is not a `world` throws a `TypeError`.
// __nirnroot_end__
export function explore(...args) {
  return target.explore(...args);
}

// __nirnroot_begin__ toward
// `toward(world, me, target) -> intent`. The next step toward the cell `target` (a `point`): when `target` is passable, the path to it; when it is known and open but not passable (a creature, a ware or a lever stands there), the path to the passable cells next to it (at distance 1, `max(|dx|, |dy|)`), so the hero stops beside it; when it is not known, or not open, `null`. Me at the goal: `null`. A `world` that is not a `world`, or a `target` that is not a `point`, throws a `TypeError`.
// __nirnroot_end__
export function toward(...args) {
  return target.toward(...args);
}

// __nirnroot_begin__ sighted
// `sighted(world, me) -> array`. The `id`s of the monsters hostile to a hero (`bestiary.hostile('hero', kind)`) with at least one cell they cover in me's sight, in the order of the world's `monsters`: the enemies me sees now. A `world` that is not a `world` throws a `TypeError`.
// __nirnroot_end__
export function sighted(...args) {
  return target.sighted(...args);
}
