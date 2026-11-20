// world: an API Shape, a stub seeded by nirnroot. Its implementer replaces it.

export const _sheo_stub = true;

/** Fields: seed, rng, depth, turn, state, grid, hero, monsters, items, visible, explored, gold, log, with. */
export class World {
  constructor(...args) {
    throw new Error("not implemented: shape world");
  }
}
