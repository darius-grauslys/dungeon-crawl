// input: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `intentFor(key) -> intent`. The table's intent for a `KeyboardEvent.key` value; `null` for any other key (and for anything not a string). */
export function intentFor(...args) {
  throw new Error("not implemented: input.intentFor");
}

/** `listen(target, onIntent) -> function`. Adds a `keydown` listener to `target` (any `EventTarget`): for an event whose `key` has an intent and with none of `ctrlKey`, `altKey`, `metaKey` true, it calls `event.preventDefault()` and then `onIntent(intent)`, once; other events are left alone. Answers `stop`, a function that removes the listener (calling it again does nothing). */
export function listen(...args) {
  throw new Error("not implemented: input.listen");
}
