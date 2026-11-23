// The edge test for input: keys, listens, chords, intent/valid.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as intent from "../../../shapes/intent/index.mjs";

// Intrinsic - keys: intentFor answers the table's intent for each key, null otherwise; commandFor answers menu/pause or null.
test("keys: intentFor answers the table's intent for each key, null otherwise", async () => {
  const { intentFor, commandFor, listen } = await import("../../../edges/edge_to_input.mjs");
  // ArrowUp, w, W, k, K -> move(0, -1) without Shift, face(0, -1) with Shift
  for (const k of ["ArrowUp", "w", "W", "k", "K"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, -1);
    const s = intentFor(k, true);
    assert.equal(s.kind, "face");
    assert.equal(s.dx, 0);
    assert.equal(s.dy, -1);
  }
  // ArrowDown, s, S, j, J -> move(0, 1) without Shift, face(0, 1) with Shift
  for (const k of ["ArrowDown", "s", "S", "j", "J"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 1);
    const s = intentFor(k, true);
    assert.equal(s.kind, "face");
    assert.equal(s.dx, 0);
    assert.equal(s.dy, 1);
  }
  // ArrowLeft, a, A, h, H -> move(-1, 0) without Shift, face(-1, 0) with Shift
  for (const k of ["ArrowLeft", "a", "A", "h", "H"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, -1);
    assert.equal(i.dy, 0);
    const s = intentFor(k, true);
    assert.equal(s.kind, "face");
    assert.equal(s.dx, -1);
    assert.equal(s.dy, 0);
  }
  // ArrowRight, d, D, l, L -> move(1, 0) without Shift, face(1, 0) with Shift
  for (const k of ["ArrowRight", "d", "D", "l", "L"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, 1);
    assert.equal(i.dy, 0);
    const s = intentFor(k, true);
    assert.equal(s.kind, "face");
    assert.equal(s.dx, 1);
    assert.equal(s.dy, 0);
  }
  // Diagonal keys: y,Y,Home,7 -> up-left (-1,-1); u,U,PageUp,9 -> up-right (1,-1); b,B,End,1 -> down-left (-1,1); n,N,PageDown,3 -> down-right (1,1)
  const diag = {
    "y": [-1, -1], "Y": [-1, -1], "Home": [-1, -1], "7": [-1, -1],
    "u": [1, -1], "U": [1, -1], "PageUp": [1, -1], "9": [1, -1],
    "b": [-1, 1], "B": [-1, 1], "End": [-1, 1], "1": [-1, 1],
    "n": [1, 1], "N": [1, 1], "PageDown": [1, 1], "3": [1, 1],
  };
  for (const [k, [edx, edy]] of Object.entries(diag)) {
    const i = intentFor(k);
    assert.equal(i.kind, "move");
    assert.equal(i.dx, edx);
    assert.equal(i.dy, edy);
    const s = intentFor(k, true);
    assert.equal(s.kind, "face");
    assert.equal(s.dx, edx);
    assert.equal(s.dy, edy);
  }
  // e, E -> use() without and with Shift; ' ' -> attack() without and with Shift
  for (const k of ["e", "E"]) {
    const i = intentFor(k);
    assert.equal(i.kind, "use");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 0);
    const s = intentFor(k, true);
    assert.equal(s.kind, "use");
    assert.equal(s.dx, 0);
    assert.equal(s.dy, 0);
  }
  for (const k of [" "]) {
    const i = intentFor(k);
    assert.equal(i.kind, "attack");
    assert.equal(i.dx, 0);
    assert.equal(i.dy, 0);
    const s = intentFor(k, true);
    assert.equal(s.kind, "attack");
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
  // 'm', 'M', '-', '_', '=', '+' answer null for intentFor (they are commands)
  for (const k of ["m", "M", "-", "_", "=", "+"]) {
    assert.equal(intentFor(k), null);
  }

  // commandFor
  assert.equal(commandFor("Escape"), "menu");
  assert.equal(commandFor("P"), "pause");
  assert.equal(commandFor("m"), "mute");
  assert.equal(commandFor("M"), "mute");
  assert.equal(commandFor("-"), "quieter");
  assert.equal(commandFor("_"), "quieter");
  assert.equal(commandFor("="), "louder");
  assert.equal(commandFor("+"), "louder");
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

  // with shiftKey true too, face(-1, 0)
  const ev2 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev2, "key", { value: "ArrowLeft" });
  Object.defineProperty(ev2, "shiftKey", { value: true });
  t.dispatchEvent(ev2);
  assert.equal(intentCalled, 2);
  assert.equal(intentReceived.kind, "face");
  assert.equal(intentReceived.dx, -1);
  assert.equal(intentReceived.dy, 0);
  assert.equal(ev2.defaultPrevented, true);

  // keydown with key ' ' calls f once with attack()
  const evSpace = new Event("keydown", { cancelable: true });
  Object.defineProperty(evSpace, "key", { value: " " });
  t.dispatchEvent(evSpace);
  assert.equal(intentCalled, 3);
  assert.equal(intentReceived.kind, "attack");
  assert.equal(intentReceived.dx, 0);
  assert.equal(intentReceived.dy, 0);
  assert.equal(evSpace.defaultPrevented, true);

  // keydown with key '>' and shiftKey true calls f once with descend()
  const evGt = new Event("keydown", { cancelable: true });
  Object.defineProperty(evGt, "key", { value: ">" });
  Object.defineProperty(evGt, "shiftKey", { value: true });
  t.dispatchEvent(evGt);
  assert.equal(intentCalled, 4);
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

  // keydown with key 'm' calls g once with 'mute', prevented
  const evMute = new Event("keydown", { cancelable: true });
  Object.defineProperty(evMute, "key", { value: "m" });
  t.dispatchEvent(evMute);
  assert.equal(commandCalled, 2);
  assert.equal(commandReceived, "mute");
  assert.equal(evMute.defaultPrevented, true);

  // keydown with key 'x' calls neither and isn't prevented
  const ev4 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev4, "key", { value: "x" });
  t.dispatchEvent(ev4);
  assert.equal(intentCalled, 4);
  assert.equal(commandCalled, 2);
  assert.equal(ev4.defaultPrevented, false);

  // keydown with key 'w' and ctrlKey true calls neither
  const ev5 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev5, "key", { value: "w" });
  Object.defineProperty(ev5, "ctrlKey", { value: true });
  t.dispatchEvent(ev5);
  assert.equal(intentCalled, 4);
  assert.equal(commandCalled, 2);

  // keyup with key 'w' calls neither
  const ev6 = new Event("keyup", { cancelable: true });
  Object.defineProperty(ev6, "key", { value: "w" });
  t.dispatchEvent(ev6);
  assert.equal(intentCalled, 4);
  assert.equal(commandCalled, 2);

  // after stop(), keydown with key 'w' calls neither
  stop();
  const ev7 = new Event("keydown", { cancelable: true });
  Object.defineProperty(ev7, "key", { value: "w" });
  t.dispatchEvent(ev7);
  assert.equal(intentCalled, 4);
  assert.equal(commandCalled, 2);

  // stop() again doesn't throw
  assert.doesNotThrow(() => stop());
});

// Intrinsic - aiming: listen calls aiming(true) on Shift keydown (not repeat), aiming(false) on Shift keyup or blur; a Shift keydown isn't prevented; no aiming handler: Shift keydown throws nothing.
test("aiming: listen calls aiming handler on Shift held state", async () => {
  const { listen } = await import("../../../edges/edge_to_input.mjs");

  // With listen(t, {intent: f, command: g, aiming: a}) on a fresh EventTarget:
  const t = new EventTarget();
  let aimingCalled = 0;
  let aimingReceived = null;
  let intentCalled = 0;
  let commandCalled = 0;
  let intentReceived = null;
  const f = (i) => { intentCalled++; intentReceived = i; };
  const g = (c) => { commandCalled++; };
  const a = (v) => { aimingCalled++; aimingReceived = v; };
  const stop = listen(t, { intent: f, command: g, aiming: a });

  // a keydown with key 'Shift' calls a once with true (and neither f nor g, and isn't prevented)
  const evShiftDown = new Event("keydown", { cancelable: true });
  Object.defineProperty(evShiftDown, "key", { value: "Shift" });
  t.dispatchEvent(evShiftDown);
  assert.equal(aimingCalled, 1);
  assert.equal(aimingReceived, true);
  assert.equal(intentCalled, 0);
  assert.equal(commandCalled, 0);
  assert.equal(evShiftDown.defaultPrevented, false);

  // another (a repeat) calls nothing
  const evShiftRepeat = new Event("keydown", { cancelable: true });
  Object.defineProperty(evShiftRepeat, "key", { value: "Shift" });
  t.dispatchEvent(evShiftRepeat);
  assert.equal(aimingCalled, 1);
  assert.equal(intentCalled, 0);
  assert.equal(commandCalled, 0);

  // a keydown of ArrowLeft with shiftKey true calls f with face(-1, 0)
  const evArrowLeft = new Event("keydown", { cancelable: true });
  Object.defineProperty(evArrowLeft, "key", { value: "ArrowLeft" });
  Object.defineProperty(evArrowLeft, "shiftKey", { value: true });
  t.dispatchEvent(evArrowLeft);
  assert.equal(intentCalled, 1);
  assert.equal(intentReceived.kind, "face");
  assert.equal(intentReceived.dx, -1);
  assert.equal(intentReceived.dy, 0);
  assert.equal(aimingCalled, 1);

  // a keyup with key 'Shift' calls a with false
  const evShiftUp = new Event("keyup", { cancelable: true });
  Object.defineProperty(evShiftUp, "key", { value: "Shift" });
  t.dispatchEvent(evShiftUp);
  assert.equal(aimingCalled, 2);
  assert.equal(aimingReceived, false);

  // another keyup of Shift calls nothing
  const evShiftUp2 = new Event("keyup", { cancelable: true });
  Object.defineProperty(evShiftUp2, "key", { value: "Shift" });
  t.dispatchEvent(evShiftUp2);
  assert.equal(aimingCalled, 2);

  // Shift down again (a(true)), then a blur: a(false)
  const evShiftDown2 = new Event("keydown", { cancelable: true });
  Object.defineProperty(evShiftDown2, "key", { value: "Shift" });
  t.dispatchEvent(evShiftDown2);
  assert.equal(aimingCalled, 3);
  assert.equal(aimingReceived, true);

  const evBlur = new Event("blur");
  t.dispatchEvent(evBlur);
  assert.equal(aimingCalled, 4);
  assert.equal(aimingReceived, false);

  stop();

  // With no aiming handler, a Shift keydown throws nothing.
  const t2 = new EventTarget();
  const stop2 = listen(t2, { intent: f, command: g });
  const evShiftDown3 = new Event("keydown", { cancelable: true });
  Object.defineProperty(evShiftDown3, "key", { value: "Shift" });
  assert.doesNotThrow(() => t2.dispatchEvent(evShiftDown3));
});

// Intrinsic - chords: listen tracks held keys for chords (keyup and blur).
test("chords: listen tracks held keys for chords", async () => {
  const { listen } = await import("../../../edges/edge_to_input.mjs");

  // Scenario 1+2: ArrowUp, ArrowRight chord, repeat, then keyup ArrowUp, ArrowRight
  {
    const t = new EventTarget();
    let intentCalled = 0;
    let intentReceived = null;
    const f = (i) => { intentCalled++; intentReceived = i; };
    const stop = listen(t, { intent: f, command: () => {} });

    // keydown ArrowUp calls f with move(0, -1)
    const evUp = new Event("keydown", { cancelable: true });
    Object.defineProperty(evUp, "key", { value: "ArrowUp" });
    t.dispatchEvent(evUp);
    assert.equal(intentCalled, 1);
    assert.equal(intentReceived.kind, "move");
    assert.equal(intentReceived.dx, 0);
    assert.equal(intentReceived.dy, -1);

    // then keydown ArrowRight without a keyup of ArrowUp: f with move(1, -1)
    const evRight = new Event("keydown", { cancelable: true });
    Object.defineProperty(evRight, "key", { value: "ArrowRight" });
    t.dispatchEvent(evRight);
    assert.equal(intentCalled, 2);
    assert.equal(intentReceived.kind, "move");
    assert.equal(intentReceived.dx, 1);
    assert.equal(intentReceived.dy, -1);

    // another keydown ArrowRight (a repeat): move(1, -1) again
    const evRight2 = new Event("keydown", { cancelable: true });
    Object.defineProperty(evRight2, "key", { value: "ArrowRight" });
    t.dispatchEvent(evRight2);
    assert.equal(intentCalled, 3);
    assert.equal(intentReceived.kind, "move");
    assert.equal(intentReceived.dx, 1);
    assert.equal(intentReceived.dy, -1);

    // After keyup ArrowUp, a keydown ArrowRight gives move(1, 0)
    const evKeyUpUp = new Event("keyup", { cancelable: true });
    Object.defineProperty(evKeyUpUp, "key", { value: "ArrowUp" });
    t.dispatchEvent(evKeyUpUp);
    const evRight3 = new Event("keydown", { cancelable: true });
    Object.defineProperty(evRight3, "key", { value: "ArrowRight" });
    t.dispatchEvent(evRight3);
    assert.equal(intentCalled, 4);
    assert.equal(intentReceived.kind, "move");
    assert.equal(intentReceived.dx, 1);
    assert.equal(intentReceived.dy, 0);

    stop();
  }

  // Scenario 3: Holding s, keydown a with shiftKey gives face(-1, 1)
  {
    const t = new EventTarget();
    let intentCalled = 0;
    let intentReceived = null;
    const f = (i) => { intentCalled++; intentReceived = i; };
    const stop = listen(t, { intent: f, command: () => {} });

    // keydown s: move(0, 1)
    const evS = new Event("keydown", { cancelable: true });
    Object.defineProperty(evS, "key", { value: "s" });
    t.dispatchEvent(evS);
    assert.equal(intentCalled, 1);
    assert.equal(intentReceived.kind, "move");
    assert.equal(intentReceived.dx, 0);
    assert.equal(intentReceived.dy, 1);

    // keydown a with shiftKey: face(-1, 1)
    const evA = new Event("keydown", { cancelable: true });
    Object.defineProperty(evA, "key", { value: "a" });
    Object.defineProperty(evA, "shiftKey", { value: true });
    t.dispatchEvent(evA);
    assert.equal(intentCalled, 2);
    assert.equal(intentReceived.kind, "face");
    assert.equal(intentReceived.dx, -1);
    assert.equal(intentReceived.dy, 1);

    stop();
  }

  // Scenario 4: Holding ArrowLeft, blur, keydown ArrowUp gives move(0, -1)
  {
    const t = new EventTarget();
    let intentCalled = 0;
    let intentReceived = null;
    const f = (i) => { intentCalled++; intentReceived = i; };
    const stop = listen(t, { intent: f, command: () => {} });

    // keydown ArrowLeft: move(-1, 0)
    const evLeft = new Event("keydown", { cancelable: true });
    Object.defineProperty(evLeft, "key", { value: "ArrowLeft" });
    t.dispatchEvent(evLeft);
    assert.equal(intentCalled, 1);
    assert.equal(intentReceived.kind, "move");
    assert.equal(intentReceived.dx, -1);
    assert.equal(intentReceived.dy, 0);

    // blur: releases keys
    const evBlur = new Event("blur");
    t.dispatchEvent(evBlur);

    // keydown ArrowUp: move(0, -1)
    const evUp2 = new Event("keydown", { cancelable: true });
    Object.defineProperty(evUp2, "key", { value: "ArrowUp" });
    t.dispatchEvent(evUp2);
    assert.equal(intentCalled, 2);
    assert.equal(intentReceived.kind, "move");
    assert.equal(intentReceived.dx, 0);
    assert.equal(intentReceived.dy, -1);

    stop();
  }
});

// Intrinsic - intent/valid: intent shape builds and refuses intents as documented.
test("intent/valid: intent shape builds and refuses intents as documented", () => {
  const m = intent.move(0, -1);
  assert.equal(m.kind, "move");
  assert.equal(m.dx, 0);
  assert.equal(m.dy, -1);
  assert.ok(Object.isFrozen(m));

  // move(1, 1) and move(-1, 1) are accepted (diagonal)
  const m11 = intent.move(1, 1);
  assert.equal(m11.kind, "move");
  assert.equal(m11.dx, 1);
  assert.equal(m11.dy, 1);
  const m_11 = intent.move(-1, 1);
  assert.equal(m_11.kind, "move");
  assert.equal(m_11.dx, -1);
  assert.equal(m_11.dy, 1);

  const a = intent.attack(1, 0);
  assert.equal(a.kind, "attack");
  assert.equal(a.dx, 1);
  assert.equal(a.dy, 0);

  // attack() and attack(0, 0) have dx and dy 0; attack(-1, -1) is accepted
  const a0 = intent.attack();
  assert.equal(a0.kind, "attack");
  assert.equal(a0.dx, 0);
  assert.equal(a0.dy, 0);
  const a00 = intent.attack(0, 0);
  assert.equal(a00.kind, "attack");
  assert.equal(a00.dx, 0);
  assert.equal(a00.dy, 0);
  const a_1_1 = intent.attack(-1, -1);
  assert.equal(a_1_1.kind, "attack");
  assert.equal(a_1_1.dx, -1);
  assert.equal(a_1_1.dy, -1);

  const f1 = intent.face(1, -1);
  assert.equal(f1.kind, "face");
  assert.equal(f1.dx, 1);
  assert.equal(f1.dy, -1);

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

  for (const args of [[0, 0], [2, 0], ["1", 0]]) {
    assert.throws(() => intent.move(...args), TypeError);
  }
  for (const args of [[0, 0], [0, 2]]) {
    assert.throws(() => intent.face(...args), TypeError);
  }
  for (const args of [[2, 0], [1]]) {
    assert.throws(() => intent.attack(...args), TypeError);
  }

  assert.deepEqual(intent.KINDS, ["move", "attack", "use", "wait", "descend", "face"]);
});
