// The edge test for input: keys, listens, intent/valid.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as intent from "../../../shapes/intent/index.mjs";
import { intentFor, listen } from "../../../edges/edge_to_input.mjs";

// Intrinsic - keys: intentFor answers the table's intent for each key, null otherwise.
test("keys: intentFor answers the table's intent for each key, null otherwise", () => {
  // ArrowUp, w, W, k, K -> move(0, -1)
  for (const k of ["ArrowUp", "w", "W", "k", "K"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, -1);
  }
  // ArrowDown, s, S, j, J -> move(0, 1)
  for (const k of ["ArrowDown", "s", "S", "j", "J"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 1);
  }
  // ArrowLeft, a, A, h, H -> move(-1, 0)
  for (const k of ["ArrowLeft", "a", "A", "h", "H"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, -1);
    assert.equal(i.dy, 0);
  }
  // ArrowRight, d, D, l, L -> move(1, 0)
  for (const k of ["ArrowRight", "d", "D", "l", "L"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 1);
    assert.equal(i.dy, 0);
  }
  // ., space, z, Z -> wait()
  for (const k of [".", " ", "z", "Z"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "wait");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 0);
  }
  // >, Enter -> descend()
  for (const k of [">", "Enter"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "descend");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 0);
  }
  // r, R -> restart()
  for (const k of ["r", "R"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "restart");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 0);
  }
  // 'x', 'Escape', '', null, 5 answer null
  for (const k of ["x", "Escape", "", null, 5]) {
    assert.equal(intentFor(k), null);
  }
});

// Intrinsic - listens: listen turns keypresses into intents, stops when stopped.
test("listens: listen turns keypresses into intents, stops when stopped", () => {
  const t = new EventTarget();
  let called = 0;
  let received = null;
  const f = (i) => { called++; received = i; };
  const stop = listen(t, f);

  // cancelable keydown with key 'ArrowLeft' calls f once with move(-1, 0) and is defaultPrevented
  const ev1 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev1, "key", { value: "ArrowLeft" });
  t.dispatchEvent(ev1);
  assert.equal(called, 1);
  assert.equal(received.kind, "move");
  assert.equal(received.dx, -1);
  assert.equal(received.dy, 0);
  assert.equal(ev1.defaultPrevented, true);

  // keydown with key 'x' doesn't call f and isn't defaultPrevented
  const ev2 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev2, "key", { value: "x" });
  t.dispatchEvent(ev2);
  assert.equal(called, 1);
  assert.equal(ev2.defaultPrevented, false);

  // keydown with key 'w' and ctrlKey true doesn't call f
  const ev3 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev3, "key", { value: "w" });
  Object.defineProperty(ev3, "ctrlKey", { value: true });
  t.dispatchEvent(ev3);
  assert.equal(called, 1);

  // keyup with key 'w' doesn't call f
  const ev4 = new Event("keyup", { cancelable: true });
  Object.defineProperty(ev4, "key", { value: "w" });
  t.dispatchEvent(ev4);
  assert.equal(called, 1);

  // after stop(), keydown with key 'w' doesn't call f
  stop();
  const ev5 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev5, "key", { value: "w" });
  t.dispatchEvent(ev5);
  assert.equal(called, 1);

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

  const w = intent.wait();
  assert.equal(w.kind, "wait");
  assert.equal(w.dx, 0);
  assert.equal(w.dy, 0);

  const d = intent.descend();
  assert.equal(d.kind, "descend");
  assert.equal(d.dx, 0);
  assert.equal(d.dy, 0);

  const r = intent.restart();
  assert.equal(r.kind, "restart");
  assert.equal(r.dx, 0);
  assert.equal(r.dy, 0);

  for (const args of [[1, 1], [0, 0], [2, 0], ["1", 0]]) {
    assert.throws(() => intent.move(...args), TypeError);
  }
});
