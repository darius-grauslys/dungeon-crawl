// The call site for input: forwards to its surface, nothing else.
// input's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/input/index.mjs";

// __nirnroot_begin__ intent-for
// `intentFor(key, shift) -> intent`. The first table's intent for a `KeyboardEvent.key` value, with Shift held when `shift` is true; `null` for any other key (and for anything not a string).
// __nirnroot_end__
export function intentFor(...args) {
  return target.intentFor(...args);
}

// __nirnroot_begin__ command-for
// `commandFor(key) -> string`. The second table's command (`menu` or `pause`) for a key; `null` for any other.
// __nirnroot_end__
export function commandFor(...args) {
  return target.commandFor(...args);
}

// __nirnroot_begin__ listen
// `listen(target, {intent, command}) -> function`. Adds a `keydown` listener to `target` (any `EventTarget`): for an event with none of `ctrlKey`, `altKey`, `metaKey` true, whose `key` has an intent (by `intentFor(key, shiftKey)`) or a command, it calls `event.preventDefault()` and then `intent(i)` or `command(c)`, once; other events are left alone. Answers `stop`, a function that removes the listener (calling it again does nothing).
// __nirnroot_end__
export function listen(...args) {
  return target.listen(...args);
}
