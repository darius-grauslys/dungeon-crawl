// The call site for play: forwards to its surface, nothing else.
// play's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/play/index.mjs";

// __nirnroot_begin__ start
// `start(document, seed) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. Starts a game of `seed` (an integer from 0 to 4294967295; left out, `Date.now() % 4294967296`), draws it at once, starts loading the sprites from `/assets/` and draws again when they are in (if they fail, it logs the error with `console.error` and plays on in flat colours), and from then on, for every key press on `document` that means an intent (the `input` Node's table), takes the turn and draws the new world. Answers a handle: `world()`, the current world; `stop()`, which stops listening to the keyboard (the game no longer changes).
// __nirnroot_end__
export function start(...args) {
  return target.start(...args);
}
