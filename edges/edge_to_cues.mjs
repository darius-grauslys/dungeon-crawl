// The call site for cues: forwards to its surface, nothing else.
// cues's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/cues/index.mjs";

// __nirnroot_begin__ cues
// `cues(prev, next, me) -> array of cue`. `prev` a `world` or `null`; `next` a `world`; `me` a string. A fresh array of `cue`s, as **What makes a sound** says. Anything else throws a `TypeError`. Neither world is changed.
// __nirnroot_end__
export function cues(...args) {
  return target.cues(...args);
}
