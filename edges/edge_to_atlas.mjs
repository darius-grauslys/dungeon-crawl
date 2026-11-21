// The call site for atlas: forwards to its surface, nothing else.
// atlas's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/atlas/index.mjs";

// __nirnroot_begin__ load
// `load(base) -> promise`. `base` a URL prefix ending in `/` (the page's is `/assets/`); each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all five are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves.
// __nirnroot_end__
export function load(...args) {
  return target.load(...args);
}

// __nirnroot_begin__ sprite
// `sprite(name) -> sprite`. The `sprite` for a name of the table: its `image` the keyed sheet (a canvas), its rectangle the table's, 16 by 16. Before a `load` has resolved, answers `null`. A name not in the table throws a `TypeError`, loaded or not.
// __nirnroot_end__
export function sprite(...args) {
  return target.sprite(...args);
}

// __nirnroot_begin__ names
// `names() -> array`. The twenty-nine names, in the table's order, a fresh array each call.
// __nirnroot_end__
export function names(...args) {
  return target.names(...args);
}
