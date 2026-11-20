// The call site for input: forwards to its surface, nothing else.
// input's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/input/index.mjs";

// __nirnroot_begin__ intent-for
// `intentFor(key) -> intent`. The table's intent for a `KeyboardEvent.key` value; `null` for any other key (and for anything not a string).
// __nirnroot_end__
export function intentFor(...args) {
  return target.intentFor(...args);
}

// __nirnroot_begin__ listen
// `listen(target, onIntent) -> function`. Adds a `keydown` listener to `target` (any `EventTarget`): for an event whose `key` has an intent and with none of `ctrlKey`, `altKey`, `metaKey` true, it calls `event.preventDefault()` and then `onIntent(intent)`, once; other events are left alone. Answers `stop`, a function that removes the listener (calling it again does nothing).
// __nirnroot_end__
export function listen(...args) {
  return target.listen(...args);
}
