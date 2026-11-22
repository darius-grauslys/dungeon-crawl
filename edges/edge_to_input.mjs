// The call site for input: forwards to its surface, nothing else.
// input's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/input/index.mjs";

// __nirnroot_begin__ intent-for
// `intentFor(key, shift) -> intent`. The intent of one key alone, without chords: a direction key's `move` (or, with `shift` true, `face`), or the second table's; `null` for any other key (and for anything not a string).
// __nirnroot_end__
export function intentFor(...args) {
  return target.intentFor(...args);
}

// __nirnroot_begin__ command-for
// `commandFor(key) -> string`. The last table's command (`menu`, `pause`, `mute`, `quieter` or `louder`) for a key; `null` for any other.
// __nirnroot_end__
export function commandFor(...args) {
  return target.commandFor(...args);
}

// __nirnroot_begin__ listen
// `listen(target, {intent, command}) -> function`. Adds a `keydown`, a `keyup` and a `blur` listener to `target` (any `EventTarget`). For a `keydown` with none of `ctrlKey`, `altKey`, `metaKey` true, whose `key` has an intent (as `intentFor(key, shiftKey)`, made diagonal by a chord as above) or a command, it calls `event.preventDefault()` and then `intent(i)` or `command(c)`, once; other events are left alone. A `keyup` (and a `blur`) only lets keys go. Answers `stop`, a function that removes the listeners (calling it again does nothing).
// __nirnroot_end__
export function listen(...args) {
  return target.listen(...args);
}
