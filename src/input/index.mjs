// input: the keyboard, a Node. Its surface: intentFor, listen.

import * as intent from "../../shapes/intent/index.mjs";

// A frozen map from key to intent, built once from the table with intent's constructors.
const KEY_MAP = {
  "ArrowUp": intent.move(0, -1), "w": intent.move(0, -1), "W": intent.move(0, -1), "k": intent.move(0, -1), "K": intent.move(0, -1),
  "ArrowDown": intent.move(0, 1), "s": intent.move(0, 1), "S": intent.move(0, 1), "j": intent.move(0, 1), "J": intent.move(0, 1),
  "ArrowLeft": intent.move(-1, 0), "a": intent.move(-1, 0), "A": intent.move(-1, 0), "h": intent.move(-1, 0), "H": intent.move(-1, 0),
  "ArrowRight": intent.move(1, 0), "d": intent.move(1, 0), "D": intent.move(1, 0), "l": intent.move(1, 0), "L": intent.move(1, 0),
  ".": intent.wait(), " ": intent.wait(), "z": intent.wait(), "Z": intent.wait(),
  ">": intent.descend(),
  "Enter": intent.descend(),
  "r": intent.restart(), "R": intent.restart(),
};

/** `intentFor(key) -> intent`. The table's intent for a `KeyboardEvent.key` value; `null` for any other key (and for anything not a string). */
export function intentFor(key) {
  if (typeof key !== "string") return null;
  return KEY_MAP[key] ?? null;
}

/** `listen(target, onIntent) -> function`. Adds a `keydown` listener to `target` (any `EventTarget`): for an event whose `key` has an intent and with none of `ctrlKey`, `altKey`, `metaKey` true, it calls `event.preventDefault()` and then `onIntent(intent)`, once; other events are left alone. Answers `stop`, a function that removes the listener (calling it again does nothing). */
export function listen(target, onIntent) {
  const handler = (event) => {
    if (event.type !== "keydown") return;
    const intent = intentFor(event.key);
    if (!intent) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    onIntent(intent);
  };
  target.addEventListener("keydown", handler);
  let active = true;
  const stop = () => {
    if (!active) return;
    target.removeEventListener("keydown", handler);
    active = false;
  };
  return stop;
}
