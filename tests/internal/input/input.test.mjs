import test from "node:test";
import assert from "node:assert/strict";
import { intentFor, commandFor, listen } from "../../../src/input/index.mjs";

class MockTarget {
  constructor() {
    this.listeners = {};
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  removeEventListener(type, fn) {
    const list = this.listeners[type];
    if (list) {
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    }
  }
  dispatch(event) {
    const list = this.listeners[event.type] || [];
    for (const fn of list) fn(event);
  }
}

class MockEvent {
  constructor(type, opts = {}) {
    this.type = type;
    this.key = opts.key;
    this.shiftKey = !!opts.shiftKey;
    this.ctrlKey = !!opts.ctrlKey;
    this.altKey = !!opts.altKey;
    this.metaKey = !!opts.metaKey;
    this.defaultPrevented = false;
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
}

test("intentFor: invalid keys return null", () => {
  assert.strictEqual(intentFor("x"), null);
  assert.strictEqual(intentFor("Escape"), null);
  assert.strictEqual(intentFor(""), null);
  assert.strictEqual(intentFor(null), null);
  assert.strictEqual(intentFor(5), null);
});

test("intentFor: valid keys answer their intent without and with Shift", () => {
  // ArrowUp: move(0, -1) without shift, attack(0, -1) with shift.
  let up = intentFor("ArrowUp");
  assert.strictEqual(up.kind, "move");
  assert.strictEqual(up.dx, 0);
  assert.strictEqual(up.dy, -1);
  let upShift = intentFor("ArrowUp", true);
  assert.strictEqual(upShift.kind, "attack");
  assert.strictEqual(upShift.dx, 0);
  assert.strictEqual(upShift.dy, -1);

  // ArrowDown: move(0, 1) without shift, attack(0, 1) with shift.
  let down = intentFor("ArrowDown");
  assert.strictEqual(down.kind, "move");
  assert.strictEqual(down.dx, 0);
  assert.strictEqual(down.dy, 1);
  let downShift = intentFor("ArrowDown", true);
  assert.strictEqual(downShift.kind, "attack");
  assert.strictEqual(downShift.dx, 0);
  assert.strictEqual(downShift.dy, 1);

  // ArrowLeft: move(-1, 0) without shift, attack(-1, 0) with shift.
  let left = intentFor("ArrowLeft");
  assert.strictEqual(left.kind, "move");
  assert.strictEqual(left.dx, -1);
  assert.strictEqual(left.dy, 0);
  let leftShift = intentFor("ArrowLeft", true);
  assert.strictEqual(leftShift.kind, "attack");
  assert.strictEqual(leftShift.dx, -1);
  assert.strictEqual(leftShift.dy, 0);

  // ArrowRight: move(1, 0) without shift, attack(1, 0) with shift.
  let right = intentFor("ArrowRight");
  assert.strictEqual(right.kind, "move");
  assert.strictEqual(right.dx, 1);
  assert.strictEqual(right.dy, 0);
  let rightShift = intentFor("ArrowRight", true);
  assert.strictEqual(rightShift.kind, "attack");
  assert.strictEqual(rightShift.dx, 1);
  assert.strictEqual(rightShift.dy, 0);

  // w/W/k/K: move(0, -1) without shift, attack(0, -1) with shift.
  for (const k of ["w", "W", "k", "K"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, 0);
    assert.strictEqual(ki.dy, -1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "attack");
  }

  // s/S/j/J: move(0, 1) without shift, attack(0, 1) with shift.
  for (const k of ["s", "S", "j", "J"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dy, 1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "attack");
  }

  // a/A/h/H: move(-1, 0) without shift, attack(-1, 0) with shift.
  for (const k of ["a", "A", "h", "H"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, -1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "attack");
  }

  // d/D/l/L: move(1, 0) without shift, attack(1, 0) with shift.
  for (const k of ["d", "D", "l", "L"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, 1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "attack");
  }

  // e, E, space: use() without and with shift.
  for (const k of ["e", "E", " "]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "use");
    assert.strictEqual(ki.dx, 0);
    assert.strictEqual(ki.dy, 0);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "use");
  }
});

test("commandFor: Escape->menu, P->pause, w->null", () => {
  assert.strictEqual(commandFor("Escape"), "menu");
  assert.strictEqual(commandFor("p"), "pause");
  assert.strictEqual(commandFor("P"), "pause");
  assert.strictEqual(commandFor("w"), null);
  assert.strictEqual(commandFor("x"), null);
  assert.strictEqual(commandFor(""), null);
  assert.strictEqual(commandFor(null), null);
  assert.strictEqual(commandFor(5), null);
});

test("listen: keydown with intent calls f once and prevents default", () => {
  const t = new MockTarget();
  let called = 0;
  let lastIntent = null;
  const f = (intentArg) => { called++; lastIntent = intentArg; };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: "ArrowLeft" });
  t.dispatch(ev);
  assert.strictEqual(called, 1);
  assert.strictEqual(lastIntent.kind, "move");
  assert.strictEqual(lastIntent.dx, -1);
  assert.strictEqual(lastIntent.dy, 0);
  assert.strictEqual(ev.defaultPrevented, true);
});

test("listen: keydown with intent and shift calls f with attack", () => {
  const t = new MockTarget();
  let called = 0;
  let lastIntent = null;
  const f = (intentArg) => { called++; lastIntent = intentArg; };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: "ArrowLeft", shiftKey: true });
  t.dispatch(ev);
  assert.strictEqual(called, 1);
  assert.strictEqual(lastIntent.kind, "attack");
  assert.strictEqual(lastIntent.dx, -1);
  assert.strictEqual(lastIntent.dy, 0);
  assert.strictEqual(ev.defaultPrevented, true);
});

test("listen: keydown with command calls g once and prevents default", () => {
  const t = new MockTarget();
  let gCalled = 0;
  let lastCommand = null;
  const f = () => {};
  const g = (cmd) => { gCalled++; lastCommand = cmd; };
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: "Escape" });
  t.dispatch(ev);
  assert.strictEqual(gCalled, 1);
  assert.strictEqual(lastCommand, "menu");
  assert.strictEqual(ev.defaultPrevented, true);
});

test("listen: keydown without intent or command doesn't call and doesn't prevent default", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const g = () => { called++; };
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: "x" });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
  assert.strictEqual(ev.defaultPrevented, false);
});

test("listen: modifier keys don't trigger", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const g = () => { called++; };
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: "w", ctrlKey: true });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
});

test("listen: keyup doesn't trigger", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const g = () => { called++; };
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keyup", { key: "w" });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
});

test("listen: stop removes listener and calling stop again doesn't throw", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const g = () => { called++; };
  const stop = listen(t, { intent: f, command: g });
  stop();
  const ev = new MockEvent("keydown", { key: "w" });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
  assert.doesNotThrow(() => stop());
});
