// The edge test for input: keys, listens, intent/valid.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as intent from "../../../shapes/intent/index.mjs";

// Intrinsic - keys: intentFor answers the table's intent for each key, null otherwise; commandFor answers menu/pause or null.
test("keys: intentFor answers the table's intent for each key, null otherwise", async () => {
  const { intentFor, commandFor, listen } = await import("../../../edges/edge_to_input.mjs");
  // ArrowUp, w, W, k, K -> move(0, -1) without Shift, attack(0, -1) with Shift
  for (const k of ["ArrowUp", "w", "W", "k", "K"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, -1);
    const s = intentFor(k, true);
    assert.equal(s.kind, "attack");
    assert.equal(s.dx, 0);
    assert.equal(s.dy, -1);
  }
  // ArrowDown, s, S, j, J -> move(0, 1) without Shift, attack(0, 1) with Shift
  for (const k of ["ArrowDown", "s", "S", "j", "J"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 1);
    const s = intentFor(k, true);
    assert.equal(s.kind, "attack");
    assert.equal(s.dx, 0);
    assert.equal(s.dy, 1);
  }
  // ArrowLeft, a, A, h, H -> move(-1, 0) without Shift, attack(-1, 0) with Shift
  for (const k of ["ArrowLeft", "a", "A", "h", "H"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, -1);
    assert.equal(i.dy, 0);
    const s = intentFor(k, true);
    assert.equal(s.kind, "attack");
    assert.equal(s.dx, -1);
    assert.equal(s.dy, 0);
  }
  // ArrowRight, d, D, l, L -> move(1, 0) without Shift, attack(1, 0) with Shift
  for (const k of ["ArrowRight", "d", "D", "l", "L"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 1);
    assert.equal(i.dy, 0);
    const s = intentFor(k, true);
    assert.equal(s.kind, "attack");
    assert.equal(s.dx, 1);
    assert.equal(s.dy, 0);
  }
  // e, E, ' ' -> use() without and with Shift
  for (const k of ["e", "E", " "]) {
    const i = intentFor(k);
    assert.equal(i.kind, "use");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 0);
    const s = intentFor(k, true);
    assert.equal(s.kind, "use");
    assert.equal(s.dx, 0);
    assert.equal(s.dy, 0);
  }
  // '>' -> descend() without and with Shift
  for (const shift of [false, true]) {
    const i = intentFor(">", shift);
    assert.equal(i.kind, "descend");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 0);
  }
  // '.', 'x', 'Escape', '', null, 5 answer null
  for (const k of [".", "x", "Escape", "", null, 5]) {
    assert.equal(intentFor(k), null);
  }

  // commandFor
  assert.equal(commandFor("Escape"), "menu");
  assert.equal(commandFor("P"), "pause");
  assert.equal(commandFor("w"), null);
});

// Intrinsic - listens: listen turns keypresses into intents/commands via {intent, command}, stops when stopped.
test("listens: listen turns keypresses into intents, stops when stopped", async () => {
  const { intentFor, commandFor, listen } = await import("../../../edges/edge_to_input.mjs");
  const t = new EventTarget();
  let intentCalled = 0;
  let intentReceived = null;
  let commandCalled = 0;
  let commandReceived = null;
  const f = (i) => { intentCalled++; intentReceived = i; };
  const g = (c) => { commandCalled++; commandReceived = c; };
  const stop = listen(t, { intent: f, command: g });

  // cancelable keydown with key 'ArrowLeft' calls f once with move(-1, 0) and is defaultPrevented
  const ev1 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev1, "key", { value: "ArrowLeft" });
  t.dispatchEvent(ev1);
  assert.equal(intentCalled, 1);
  assert.equal(intentReceived.kind, "move");
  assert.equal(intentReceived.dx, -1);
  assert.equal(intentReceived.dy, 0);
  assert.equal(ev1.defaultPrevented, true);
  assert.equal(commandCalled, 0);

  // with shiftKey true too, attack(-1, 0)
  const ev2 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev2, "key", { value: "ArrowLeft" });
  Object.defineProperty(ev2, "shiftKey", { value: true });
  t.dispatchEvent(ev2);
  assert.equal(intentCalled, 2);
  assert.equal(intentReceived.kind, "attack");
  assert.equal(intentReceived.dx, -1);
  assert.equal(intentReceived.dy, 0);
  assert.equal(ev2.defaultPrevented, true);

  // keydown with key '>' and shiftKey true calls f once with descend()
  const evGt = new Event("keydown", { cancelable: true });
  Object.defineProperty(evGt, "key", { value: ">" });
  Object.defineProperty(evGt, "shiftKey", { value: true });
  t.dispatchEvent(evGt);
  assert.equal(intentCalled, 3);
  assert.equal(intentReceived.kind, "descend");
  assert.equal(intentReceived.dx, 0);
  assert.equal(intentReceived.dy, 0);
  assert.equal(evGt.defaultPrevented, true);

  // keydown with key 'Escape' calls g once with 'menu'
  const ev3 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev3, "key", { value: "Escape" });
  t.dispatchEvent(ev3);
  assert.equal(commandCalled, 1);
  assert.equal(commandReceived, "menu");
  assert.equal(ev3.defaultPrevented, true);

  // keydown with key 'x' calls neither and isn't prevented
  const ev4 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev4, "key", { value: "x" });
  t.dispatchEvent(ev4);
  assert.equal(intentCalled, 3);
  assert.equal(commandCalled, 1);
  assert.equal(ev4.defaultPrevented, false);

  // keydown with key 'w' and ctrlKey true calls neither
  const ev5 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev5, "key", { value: "w" });
  Object.defineProperty(ev5, "ctrlKey", { value: true });
  t.dispatchEvent(ev5);
  assert.equal(intentCalled, 3);
  assert.equal(commandCalled, 1);

  // keyup with key 'w' calls neither
  const ev6 = new Event("keyup", { cancelable: true });
  Object.defineProperty(ev6, "key", { value: "w" });
  t.dispatchEvent(ev6);
  assert.equal(intentCalled, 3);
  assert.equal(commandCalled, 1);

  // after stop(), keydown with key 'w' calls neither
  stop();
  const ev7 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev7, "key", { value: "w" });
  t.dispatchEvent(ev7);
  assert.equal(intentCalled, 3);
  assert.equal(commandCalled, 1);

  // stop() again doesn't throw
  assert.doesNotThrow(() => stop());
});

// Intrinsic - intent/valid: intent shape builds and refuses intents as documented.
test("intent/valid: intent shape builds and refuses intents as documented", () => {
  const m = intent.move(0, -1);
  assert.equal(m.kind, "move");
  assert.equal(m.dx, 0);
  assert.equal(m.dy, -1);
  assert.ok(Object.isFrozen(m));

  const a = intent.attack(1, 0);
  assert.equal(a.kind, "attack");
  assert.equal(a.dx, 1);
  assert.equal(a.dy, 0);

  const u = intent.use();
  assert.equal(u.kind, "use");
  assert.equal(u.dx, 0);
  assert.equal(u.dy, 0);

  const w = intent.wait();
  assert.equal(w.kind, "wait");
  assert.equal(w.dx, 0);
  assert.equal(w.dy, 0);

  const d = intent.descend();
  assert.equal(d.kind, "descend");
  assert.equal(d.dx, 0);
  assert.equal(d.dy, 0);
  assert.ok(Object.isFrozen(d));

  for (const args of [[1, 1], [0, 0], [2, 0], ["1", 0]]) {
    assert.throws(() => intent.move(...args), TypeError);
  }
  assert.throws(() => intent.attack(0, 0), TypeError);

  assert.deepEqual(intent.KINDS, ["move", "attack", "use", "wait", "descend"]);
});
