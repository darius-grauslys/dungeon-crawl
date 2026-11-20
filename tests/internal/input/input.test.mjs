import test from "node:test";
import assert from "node:assert/strict";
import { intentFor, listen } from "../../../src/input/index.mjs";

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

test("intentFor: valid keys answer their intent", () => {
  const up = intentFor("ArrowUp");
  assert.strictEqual(up.kind, "move");
  assert.strictEqual(up.dx, 0);
  assert.strictEqual(up.dy, -1);

  const down = intentFor("ArrowDown");
  assert.strictEqual(down.kind, "move");
  assert.strictEqual(down.dx, 0);
  assert.strictEqual(down.dy, 1);

  const left = intentFor("ArrowLeft");
  assert.strictEqual(left.kind, "move");
  assert.strictEqual(left.dx, -1);
  assert.strictEqual(left.dy, 0);

  const right = intentFor("ArrowRight");
  assert.strictEqual(right.kind, "move");
  assert.strictEqual(right.dx, 1);
  assert.strictEqual(right.dy, 0);

  const w = intentFor("w");
  assert.strictEqual(w.kind, "move");
  assert.strictEqual(w.dx, 0);
  assert.strictEqual(w.dy, -1);

  const sp = intentFor(" ");
  assert.strictEqual(sp.kind, "wait");
  assert.strictEqual(sp.dx, 0);
  assert.strictEqual(sp.dy, 0);

  const enter = intentFor("Enter");
  assert.strictEqual(enter.kind, "descend");
  assert.strictEqual(enter.dx, 0);
  assert.strictEqual(enter.dy, 0);

  const r = intentFor("r");
  assert.strictEqual(r.kind, "restart");
  assert.strictEqual(r.dx, 0);
  assert.strictEqual(r.dy, 0);
});

test("listen: keydown with intent calls f once and prevents default", () => {
  const t = new MockTarget();
  let called = 0;
  let lastIntent = null;
  const f = (intent) => { called++; lastIntent = intent; };
  const stop = listen(t, f);
  const ev = new MockEvent("keydown", { key: "ArrowLeft" });
  t.dispatch(ev);
  assert.strictEqual(called, 1);
  assert.strictEqual(lastIntent.kind, "move");
  assert.strictEqual(lastIntent.dx, -1);
  assert.strictEqual(lastIntent.dy, 0);
  assert.strictEqual(ev.defaultPrevented, true);
});

test("listen: keydown without intent doesn't call f and doesn't prevent default", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const stop = listen(t, f);
  const ev = new MockEvent("keydown", { key: "x" });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
  assert.strictEqual(ev.defaultPrevented, false);
});

test("listen: modifier keys don't trigger", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const stop = listen(t, f);
  const ev = new MockEvent("keydown", { key: "w", ctrlKey: true });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
});

test("listen: keyup doesn't trigger", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const stop = listen(t, f);
  const ev = new MockEvent("keyup", { key: "w" });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
});

test("listen: stop removes listener and calling stop again doesn't throw", () => {
  const t = new MockTarget();
  let called = 0;
  const f = () => { called++; };
  const stop = listen(t, f);
  stop();
  const ev = new MockEvent("keydown", { key: "w" });
  t.dispatch(ev);
  assert.strictEqual(called, 0);
  assert.doesNotThrow(() => stop());
});
