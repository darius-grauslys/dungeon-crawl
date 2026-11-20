// atlas: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `load(base) -> promise`. `base` a URL prefix ending in `/` (the page's is `/assets/`); each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all five are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves. */
export function load(...args) {
  throw new Error("not implemented: atlas.load");
}

/** `sprite(name) -> sprite`. The `sprite` for a name of the table: its `image` the keyed sheet (a canvas), its rectangle the table's, 16 by 16. Before a `load` has resolved, answers `null`. A name not in the table throws a `TypeError`, loaded or not. */
export function sprite(...args) {
  throw new Error("not implemented: atlas.sprite");
}

/** `names() -> array`. The thirteen names, in the table's order, a fresh array each call. */
export function names(...args) {
  throw new Error("not implemented: atlas.names");
}
