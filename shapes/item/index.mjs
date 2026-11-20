// item: an API Shape, a stub seeded by nirnroot. Its implementer replaces it.

export const _sheo_stub = true;

/** Fields: id, kind, pos, amount. */
export class Item {
  constructor(...args) {
    throw new Error("not implemented: shape item");
  }
}
