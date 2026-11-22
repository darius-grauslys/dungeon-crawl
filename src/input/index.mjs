// input: the keyboard, a Node. Its surface: intentFor, commandFor, listen.

import * as intent from "../../shapes/intent/index.mjs";

// A constant Map from key to direction (dx, dy).
const DIR_MAP = new Map([
  ["ArrowUp", [0, -1]], ["w", [0, -1]], ["W", [0, -1]], ["k", [0, -1]], ["K", [0, -1]], ["8", [0, -1]],
  ["ArrowDown", [0, 1]], ["s", [0, 1]], ["S", [0, 1]], ["j", [0, 1]], ["J", [0, 1]], ["2", [0, 1]],
  ["ArrowLeft", [-1, 0]], ["a", [-1, 0]], ["A", [-1, 0]], ["h", [-1, 0]], ["H", [-1, 0]], ["4", [-1, 0]],
  ["ArrowRight", [1, 0]], ["d", [1, 0]], ["D", [1, 0]], ["l", [1, 0]], ["L", [1, 0]], ["6", [1, 0]],
  ["y", [-1, -1]], ["Y", [-1, -1]], ["Home", [-1, -1]], ["7", [-1, -1]],
  ["u", [1, -1]], ["U", [1, -1]], ["PageUp", [1, -1]], ["9", [1, -1]],
  ["b", [-1, 1]], ["B", [-1, 1]], ["End", [-1, 1]], ["1", [-1, 1]],
  ["n", [1, 1]], ["N", [1, 1]], ["PageDown", [1, 1]], ["3", [1, 1]],
]);

// A constant Map from key to command.
const CMD_MAP = new Map([
  ["Escape", "menu"],
  ["p", "pause"],
  ["P", "pause"],
  ["m", "mute"],
  ["M", "mute"],
  ["-", "quieter"],
  ["_", "quieter"],
  ["=", "louder"],
  ["+", "louder"],
]);

/** `intentFor(key, shift) -> intent`. The intent of one key alone, without chords: a direction key's `move` (or, with `shift` true, `face`), or the second table's; `null` for any other key (and for anything not a string). */
export function intentFor(key, shift) {
  if (typeof key !== "string") return null;
  // > -> descend() regardless of shift.
  if (key === ">") {
    return intent.descend();
  }
  // e, E -> use() regardless of shift.
  if (key === "e" || key === "E") {
    return intent.use();
  }
  // space -> attack() regardless of shift.
  if (key === " ") {
    return intent.attack(0, 0);
  }
  const dir = DIR_MAP.get(key);
  if (!dir) return null;
  const [dx, dy] = dir;
  return shift ? intent.face(dx, dy) : intent.move(dx, dy);
}

/** `commandFor(key) -> string`. The last table's command (`menu`, `pause`, `mute`, `quieter` or `louder`) for a key; `null` for any other. */
export function commandFor(key) {
  if (typeof key !== "string") return null;
  return CMD_MAP.get(key) ?? null;
}

/** `listen(target, {intent, command}) -> function`. Adds a `keydown`, a `keyup` and a `blur` listener to `target` (any `EventTarget`). For a `keydown` with none of `ctrlKey`, `altKey`, `metaKey` true, whose `key` has an intent (as `intentFor(key, shiftKey)`, made diagonal by a chord as above) or a command, it calls `event.preventDefault()` and then `intent(i)` or `command(c)`, once; other events are left alone. A `keyup` (and a `blur`) only lets keys go. Answers `stop`, a function that removes the listeners (calling it again does nothing). */
export function listen(target, { intent: onIntent, command }) {
  // Per-listener axis tracking: latest held orthogonal key of each axis.
  let heldVertical = null; // { key, dy }
  let heldHorizontal = null; // { key, dx }

  const keydownHandler = (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const key = event.key;
    const shift = !!event.shiftKey;

    const dir = DIR_MAP.get(key);
    let i;

    if (dir) {
      const [odx, ody] = dir;
      let dx = odx;
      let dy = ody;

      if (odx === 0 || ody === 0) {
        // Orthogonal key: record on its axis, sum with the other axis.
        if (odx === 0) {
          // Vertical key.
          heldVertical = { key, dy: ody };
          dx = heldHorizontal ? heldHorizontal.dx : 0;
          dy = ody;
        } else {
          // Horizontal key.
          heldHorizontal = { key, dx: odx };
          dy = heldVertical ? heldVertical.dy : 0;
          dx = odx;
        }
      }
      // Diagonal keys: never summed, never recorded on an axis.

      i = shift ? intent.face(dx, dy) : intent.move(dx, dy);
    } else {
      i = intentFor(key, shift);
    }

    if (i) {
      event.preventDefault();
      onIntent(i);
      return;
    }

    const c = commandFor(key);
    if (c) {
      event.preventDefault();
      command(c);
      return;
    }
  };

  const keyupHandler = (event) => {
    const key = event.key;
    const dir = DIR_MAP.get(key);
    if (!dir) return;
    const [odx, ody] = dir;
    if (odx === 0) {
      if (heldVertical && heldVertical.key === key) {
        heldVertical = null;
      }
    } else {
      if (heldHorizontal && heldHorizontal.key === key) {
        heldHorizontal = null;
      }
    }
  };

  const blurHandler = () => {
    heldVertical = null;
    heldHorizontal = null;
  };

  target.addEventListener("keydown", keydownHandler);
  target.addEventListener("keyup", keyupHandler);
  target.addEventListener("blur", blurHandler);

  let active = true;
  const stop = () => {
    if (!active) return;
    target.removeEventListener("keydown", keydownHandler);
    target.removeEventListener("keyup", keyupHandler);
    target.removeEventListener("blur", blurHandler);
    active = false;
  };
  return stop;
}
