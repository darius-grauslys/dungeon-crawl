// input: the keyboard, a Node. Its surface: intentFor, commandFor, listen.

import * as intent from "../../shapes/intent/index.mjs";

// A constant Map from key to direction (dx, dy).
const DIR_MAP = new Map([
  ["ArrowUp", [0, -1]], ["w", [0, -1]], ["W", [0, -1]], ["k", [0, -1]], ["K", [0, -1]],
  ["ArrowDown", [0, 1]], ["s", [0, 1]], ["S", [0, 1]], ["j", [0, 1]], ["J", [0, 1]],
  ["ArrowLeft", [-1, 0]], ["a", [-1, 0]], ["A", [-1, 0]], ["h", [-1, 0]], ["H", [-1, 0]],
  ["ArrowRight", [1, 0]], ["d", [1, 0]], ["D", [1, 0]], ["l", [1, 0]], ["L", [1, 0]],
]);

// A constant Map from key to command.
const CMD_MAP = new Map([
  ["Escape", "menu"],
  ["p", "pause"],
  ["P", "pause"],
]);

/** `intentFor(key, shift) -> intent`. The first table's intent for a `KeyboardEvent.key` value, with Shift held when `shift` is true; `null` for any other key (and for anything not a string). */
export function intentFor(key, shift) {
  if (typeof key !== "string") return null;
  // e, E, space -> use() regardless of shift.
  if (key === "e" || key === "E" || key === " ") {
    return intent.use();
  }
  const dir = DIR_MAP.get(key);
  if (!dir) return null;
  const [dx, dy] = dir;
  return shift ? intent.attack(dx, dy) : intent.move(dx, dy);
}

/** `commandFor(key) -> string`. The second table's command (`menu` or `pause`) for a key; `null` for any other. */
export function commandFor(key) {
  if (typeof key !== "string") return null;
  return CMD_MAP.get(key) ?? null;
}

/** `listen(target, {intent, command}) -> function`. Adds a `keydown` listener to `target` (any `EventTarget`): for an event with none of `ctrlKey`, `altKey`, `metaKey` true, whose `key` has an intent (by `intentFor(key, shiftKey)`) or a command, it calls `event.preventDefault()` and then `intent(i)` or `command(c)`, once; other events are left alone. Answers `stop`, a function that removes the listener (calling it again does nothing). */
export function listen(target, { intent, command }) {
  const handler = (event) => {
    if (event.type !== "keydown") return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const i = intentFor(event.key, event.shiftKey);
    if (i) {
      event.preventDefault();
      intent(i);
      return;
    }
    const c = commandFor(event.key);
    if (c) {
      event.preventDefault();
      command(c);
      return;
    }
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
