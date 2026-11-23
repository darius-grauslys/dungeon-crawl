// travel: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `explore(world, me) -> intent`. The next step of exploring: the path to the frontier cells. With no frontier reachable: the path to the `stairs` cell if it is known (me on it: `null`). Otherwise `null` (nothing left to explore). A `world` that is not a `world` throws a `TypeError`. */
export function explore(...args) {
  throw new Error("not implemented: travel.explore");
}

/** `toward(world, me, target) -> intent`. The next step toward the cell `target` (a `point`): when `target` is passable, the path to it; when it is known and open but not passable (a creature, a ware or a lever stands there), the path to the passable cells next to it (at distance 1, `max(|dx|, |dy|)`), so the hero stops beside it; when it is not known, or not open, `null`. Me at the goal: `null`. A `world` that is not a `world`, or a `target` that is not a `point`, throws a `TypeError`. */
export function toward(...args) {
  throw new Error("not implemented: travel.toward");
}

/** `sighted(world, me) -> array`. The `id`s of the monsters hostile to a hero (`bestiary.hostile('hero', kind)`) with at least one cell they cover in me's sight, in the order of the world's `monsters`: the enemies me sees now. A `world` that is not a `world` throws a `TypeError`. */
export function sighted(...args) {
  throw new Error("not implemented: travel.sighted");
}
