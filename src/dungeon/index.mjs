// dungeon: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `generate(seed, depth) -> floor-plan`. `seed` an integer from 0 to 4294967295, `depth` an integer from 1 to 5; anything else throws a `TypeError`. Answers a floor 48 cells wide and 32 high: every cell of its outer border is `wall`; rooms and corridors are `floor`; exactly one cell is `stairs`. `start` is where the hero arrives. `spots` holds from 12 to 40 points, each at a Manhattan distance of at least 5 from `start`. Every `floor` and `stairs` cell can be reached from `start` by orthogonal steps over `floor` and `stairs` cells. */
export function generate(...args) {
  throw new Error("not implemented: dungeon.generate");
}
