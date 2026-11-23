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
  assert.strictEqual(intentFor("."), null);
  assert.strictEqual(intentFor(""), null);
  assert.strictEqual(intentFor(null), null);
  assert.strictEqual(intentFor(5), null);
});

test("intentFor: '>' answers descend() with and without Shift", () => {
  let noShift = intentFor(">");
  assert.strictEqual(noShift.kind, "descend");
  assert.strictEqual(noShift.dx, 0);
  assert.strictEqual(noShift.dy, 0);
  let withShift = intentFor(">", true);
  assert.strictEqual(withShift.kind, "descend");
  assert.strictEqual(withShift.dx, 0);
  assert.strictEqual(withShift.dy, 0);
});

test("intentFor: space answers attack() with and without Shift", () => {
  let noShift = intentFor(" ");
  assert.strictEqual(noShift.kind, "attack");
  assert.strictEqual(noShift.dx, 0);
  assert.strictEqual(noShift.dy, 0);
  let withShift = intentFor(" ", true);
  assert.strictEqual(withShift.kind, "attack");
  assert.strictEqual(withShift.dx, 0);
  assert.strictEqual(withShift.dy, 0);
});

test("intentFor: e, E answer use() with and without Shift", () => {
  for (const k of ["e", "E"]) {
    let noShift = intentFor(k);
    assert.strictEqual(noShift.kind, "use");
    assert.strictEqual(noShift.dx, 0);
    assert.strictEqual(noShift.dy, 0);
    let withShift = intentFor(k, true);
    assert.strictEqual(withShift.kind, "use");
  }
});

test("intentFor: direction keys answer move without Shift and face with Shift", () => {
  // ArrowUp: move(0, -1) without shift, face(0, -1) with shift.
  let up = intentFor("ArrowUp");
  assert.strictEqual(up.kind, "move");
  assert.strictEqual(up.dx, 0);
  assert.strictEqual(up.dy, -1);
  let upShift = intentFor("ArrowUp", true);
  assert.strictEqual(upShift.kind, "face");
  assert.strictEqual(upShift.dx, 0);
  assert.strictEqual(upShift.dy, -1);

  // ArrowDown: move(0, 1) without shift, face(0, 1) with shift.
  let down = intentFor("ArrowDown");
  assert.strictEqual(down.kind, "move");
  assert.strictEqual(down.dx, 0);
  assert.strictEqual(down.dy, 1);
  let downShift = intentFor("ArrowDown", true);
  assert.strictEqual(downShift.kind, "face");
  assert.strictEqual(downShift.dx, 0);
  assert.strictEqual(downShift.dy, 1);

  // ArrowLeft: move(-1, 0) without shift, face(-1, 0) with shift.
  let left = intentFor("ArrowLeft");
  assert.strictEqual(left.kind, "move");
  assert.strictEqual(left.dx, -1);
  assert.strictEqual(left.dy, 0);
  let leftShift = intentFor("ArrowLeft", true);
  assert.strictEqual(leftShift.kind, "face");
  assert.strictEqual(leftShift.dx, -1);
  assert.strictEqual(leftShift.dy, 0);

  // ArrowRight: move(1, 0) without shift, face(1, 0) with shift.
  let right = intentFor("ArrowRight");
  assert.strictEqual(right.kind, "move");
  assert.strictEqual(right.dx, 1);
  assert.strictEqual(right.dy, 0);
  let rightShift = intentFor("ArrowRight", true);
  assert.strictEqual(rightShift.kind, "face");
  assert.strictEqual(rightShift.dx, 1);
  assert.strictEqual(rightShift.dy, 0);

  // w/W/k/K: move(0, -1) without shift, face(0, -1) with shift.
  for (const k of ["w", "W", "k", "K"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, 0);
    assert.strictEqual(ki.dy, -1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
  }

  // s/S/j/J: move(0, 1) without shift, face(0, 1) with shift.
  for (const k of ["s", "S", "j", "J"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dy, 1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
  }

  // a/A/h/H: move(-1, 0) without shift, face(-1, 0) with shift.
  for (const k of ["a", "A", "h", "H"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, -1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
  }

  // d/D/l/L: move(1, 0) without shift, face(1, 0) with shift.
  for (const k of ["d", "D", "l", "L"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, 1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
  }
});

test("intentFor: diagonal and numpad keys", () => {
  // y/Y/Home/7: up-left (-1, -1)
  for (const k of ["y", "Y", "Home", "7"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, -1);
    assert.strictEqual(ki.dy, -1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
    assert.strictEqual(kiShift.dx, -1);
    assert.strictEqual(kiShift.dy, -1);
  }
  // u/U/PageUp/9: up-right (1, -1)
  for (const k of ["u", "U", "PageUp", "9"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, 1);
    assert.strictEqual(ki.dy, -1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
  }
  // b/B/End/1: down-left (-1, 1)
  for (const k of ["b", "B", "End", "1"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, -1);
    assert.strictEqual(ki.dy, 1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
  }
  // n/N/PageDown/3: down-right (1, 1)
  for (const k of ["n", "N", "PageDown", "3"]) {
    let ki = intentFor(k);
    assert.strictEqual(ki.kind, "move");
    assert.strictEqual(ki.dx, 1);
    assert.strictEqual(ki.dy, 1);
    let kiShift = intentFor(k, true);
    assert.strictEqual(kiShift.kind, "face");
  }
  // numpad vertical/horizontal: 8 up, 2 down, 4 left, 6 right
  assert.strictEqual(intentFor("8").kind, "move");
  assert.strictEqual(intentFor("8").dx, 0);
  assert.strictEqual(intentFor("8").dy, -1);
  assert.strictEqual(intentFor("2").dy, 1);
  assert.strictEqual(intentFor("4").dx, -1);
  assert.strictEqual(intentFor("6").dx, 1);
});

test("commandFor: Escape->menu, P->pause, m/M->mute, -/_->quieter, =/+->louder, w->null", () => {
  assert.strictEqual(commandFor("Escape"), "menu");
  assert.strictEqual(commandFor("p"), "pause");
  assert.strictEqual(commandFor("P"), "pause");
  assert.strictEqual(commandFor("m"), "mute");
  assert.strictEqual(commandFor("M"), "mute");
  assert.strictEqual(commandFor("-"), "quieter");
  assert.strictEqual(commandFor("_"), "quieter");
  assert.strictEqual(commandFor("="), "louder");
  assert.strictEqual(commandFor("+"), "louder");
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

test("listen: keydown with intent and shift calls f with face", () => {
  const t = new MockTarget();
  let called = 0;
  let lastIntent = null;
  const f = (intentArg) => { called++; lastIntent = intentArg; };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: "ArrowLeft", shiftKey: true });
  t.dispatch(ev);
  assert.strictEqual(called, 1);
  assert.strictEqual(lastIntent.kind, "face");
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

test("listen: keydown with mute/quieter/louder commands calls g and prevents default", () => {
  const t = new MockTarget();
  const f = () => {};
  for (const [key, cmd] of [
    ["m", "mute"],
    ["M", "mute"],
    ["-", "quieter"],
    ["_", "quieter"],
    ["=", "louder"],
    ["+", "louder"],
  ]) {
    let gCalled = 0;
    let lastCommand = null;
    const g = (c) => { gCalled++; lastCommand = c; };
    const stop = listen(t, { intent: f, command: g });
    const ev = new MockEvent("keydown", { key });
    t.dispatch(ev);
    assert.strictEqual(gCalled, 1, `command called for ${key}`);
    assert.strictEqual(lastCommand, cmd, `command for ${key}`);
    assert.strictEqual(ev.defaultPrevented, true, `default prevented for ${key}`);
    stop();
  }
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

test("listen: keydown with '>' and shift calls f once with descend", () => {
  const t = new MockTarget();
  let called = 0;
  let lastIntent = null;
  const f = (intentArg) => { called++; lastIntent = intentArg; };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: ">", shiftKey: true });
  t.dispatch(ev);
  assert.strictEqual(called, 1);
  assert.strictEqual(lastIntent.kind, "descend");
  assert.strictEqual(lastIntent.dx, 0);
  assert.strictEqual(lastIntent.dy, 0);
  assert.strictEqual(ev.defaultPrevented, true);
});

test("listen: keydown with space calls f with attack()", () => {
  const t = new MockTarget();
  let called = 0;
  let lastIntent = null;
  const f = (intentArg) => { called++; lastIntent = intentArg; };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });
  const ev = new MockEvent("keydown", { key: " " });
  t.dispatch(ev);
  assert.strictEqual(called, 1);
  assert.strictEqual(lastIntent.kind, "attack");
  assert.strictEqual(lastIntent.dx, 0);
  assert.strictEqual(lastIntent.dy, 0);
  assert.strictEqual(ev.defaultPrevented, true);
});

test("listen: chords make diagonal from held orthogonal keys", () => {
  const t = new MockTarget();
  let calls = [];
  const f = (intentArg) => { calls.push(intentArg); };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });

  // keydown ArrowUp: move(0, -1)
  t.dispatch(new MockEvent("keydown", { key: "ArrowUp" }));
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].kind, "move");
  assert.strictEqual(calls[0].dx, 0);
  assert.strictEqual(calls[0].dy, -1);

  // keydown ArrowRight without keyup ArrowUp: move(1, -1)
  t.dispatch(new MockEvent("keydown", { key: "ArrowRight" }));
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[1].kind, "move");
  assert.strictEqual(calls[1].dx, 1);
  assert.strictEqual(calls[1].dy, -1);

  // keydown ArrowRight repeat: move(1, -1) again
  t.dispatch(new MockEvent("keydown", { key: "ArrowRight" }));
  assert.strictEqual(calls.length, 3);
  assert.strictEqual(calls[2].dx, 1);
  assert.strictEqual(calls[2].dy, -1);

  // keyup ArrowUp
  t.dispatch(new MockEvent("keyup", { key: "ArrowUp" }));

  // keydown ArrowRight: move(1, 0)
  t.dispatch(new MockEvent("keydown", { key: "ArrowRight" }));
  assert.strictEqual(calls.length, 4);
  assert.strictEqual(calls[3].kind, "move");
  assert.strictEqual(calls[3].dx, 1);
  assert.strictEqual(calls[3].dy, 0);

  stop();
});

test("listen: chords with shift give face", () => {
  const t = new MockTarget();
  let calls = [];
  const f = (intentArg) => { calls.push(intentArg); };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });

  // Holding s: keydown s
  t.dispatch(new MockEvent("keydown", { key: "s" }));
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].kind, "move");

  // keydown a with shiftKey: face(-1, 1)
  t.dispatch(new MockEvent("keydown", { key: "a", shiftKey: true }));
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[1].kind, "face");
  assert.strictEqual(calls[1].dx, -1);
  assert.strictEqual(calls[1].dy, 1);

  stop();
});

test("listen: same axis chord takes latest", () => {
  const t = new MockTarget();
  let calls = [];
  const f = (intentArg) => { calls.push(intentArg); };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });

  // keydown ArrowUp: move(0, -1)
  t.dispatch(new MockEvent("keydown", { key: "ArrowUp" }));
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].dy, -1);

  // keydown ArrowDown (holding ArrowUp): move(0, 1)
  t.dispatch(new MockEvent("keydown", { key: "ArrowDown" }));
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[1].kind, "move");
  assert.strictEqual(calls[1].dx, 0);
  assert.strictEqual(calls[1].dy, 1);

  stop();
});

test("listen: blur clears held keys", () => {
  const t = new MockTarget();
  let calls = [];
  const f = (intentArg) => { calls.push(intentArg); };
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });

  // keydown ArrowLeft
  t.dispatch(new MockEvent("keydown", { key: "ArrowLeft" }));
  assert.strictEqual(calls.length, 1);

  // blur
  t.dispatch(new MockEvent("blur"));

  // keydown ArrowUp: move(0, -1)
  t.dispatch(new MockEvent("keydown", { key: "ArrowUp" }));
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[1].kind, "move");
  assert.strictEqual(calls[1].dx, 0);
  assert.strictEqual(calls[1].dy, -1);

  stop();
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

test("listen: Shift keydown calls aiming(true), not prevented, no intent/command", () => {
  const t = new MockTarget();
  let aCalled = 0;
  let aVal = null;
  let fCalled = 0;
  let gCalled = 0;
  const f = () => { fCalled++; };
  const g = () => { gCalled++; };
  const a = (val) => { aCalled++; aVal = val; };
  const stop = listen(t, { intent: f, command: g, aiming: a });
  const ev = new MockEvent("keydown", { key: "Shift" });
  t.dispatch(ev);
  assert.strictEqual(aCalled, 1);
  assert.strictEqual(aVal, true);
  assert.strictEqual(fCalled, 0);
  assert.strictEqual(gCalled, 0);
  assert.strictEqual(ev.defaultPrevented, false);
});

test("listen: Shift keydown repeat calls aiming nothing", () => {
  const t = new MockTarget();
  let aCalled = 0;
  const a = () => { aCalled++; };
  const f = () => {};
  const g = () => {};
  const stop = listen(t, { intent: f, command: g, aiming: a });
  t.dispatch(new MockEvent("keydown", { key: "Shift" }));
  assert.strictEqual(aCalled, 1);
  t.dispatch(new MockEvent("keydown", { key: "Shift" }));
  assert.strictEqual(aCalled, 1);
  stop();
});

test("listen: Shift keyup calls aiming(false)", () => {
  const t = new MockTarget();
  let aCalled = 0;
  let aVal = null;
  const a = (val) => { aCalled++; aVal = val; };
  const f = () => {};
  const g = () => {};
  const stop = listen(t, { intent: f, command: g, aiming: a });
  t.dispatch(new MockEvent("keydown", { key: "Shift" }));
  assert.strictEqual(aCalled, 1);
  assert.strictEqual(aVal, true);
  t.dispatch(new MockEvent("keyup", { key: "Shift" }));
  assert.strictEqual(aCalled, 2);
  assert.strictEqual(aVal, false);
  stop();
});

test("listen: Shift keyup without keydown calls aiming nothing", () => {
  const t = new MockTarget();
  let aCalled = 0;
  const a = () => { aCalled++; };
  const f = () => {};
  const g = () => {};
  const stop = listen(t, { intent: f, command: g, aiming: a });
  t.dispatch(new MockEvent("keyup", { key: "Shift" }));
  assert.strictEqual(aCalled, 0);
  stop();
});

test("listen: blur with shift held calls aiming(false)", () => {
  const t = new MockTarget();
  let aCalled = 0;
  let aVal = null;
  const a = (val) => { aCalled++; aVal = val; };
  const f = () => {};
  const g = () => {};
  const stop = listen(t, { intent: f, command: g, aiming: a });
  t.dispatch(new MockEvent("keydown", { key: "Shift" }));
  assert.strictEqual(aCalled, 1);
  assert.strictEqual(aVal, true);
  t.dispatch(new MockEvent("blur"));
  assert.strictEqual(aCalled, 2);
  assert.strictEqual(aVal, false);
  stop();
});

test("listen: Shift keydown with no aiming handler throws nothing", () => {
  const t = new MockTarget();
  const f = () => {};
  const g = () => {};
  const stop = listen(t, { intent: f, command: g });
  assert.doesNotThrow(() => {
    t.dispatch(new MockEvent("keydown", { key: "Shift" }));
  });
  stop();
});

test("listen: aiming sequence - Shift down, ArrowLeft shiftKey, Shift up, repeat Shift up", () => {
  const t = new MockTarget();
  let aCalls = [];
  let fCalls = [];
  const f = (intentArg) => { fCalls.push(intentArg); };
  const g = () => {};
  const a = (val) => { aCalls.push(val); };
  const stop = listen(t, { intent: f, command: g, aiming: a });

  // Shift down: a(true)
  t.dispatch(new MockEvent("keydown", { key: "Shift" }));
  assert.deepStrictEqual(aCalls, [true]);

  // ArrowLeft with shiftKey true: f with face(-1, 0)
  t.dispatch(new MockEvent("keydown", { key: "ArrowLeft", shiftKey: true }));
  assert.strictEqual(fCalls.length, 1);
  assert.strictEqual(fCalls[0].kind, "face");
  assert.strictEqual(fCalls[0].dx, -1);
  assert.strictEqual(fCalls[0].dy, 0);

  // Shift up: a(false)
  t.dispatch(new MockEvent("keyup", { key: "Shift" }));
  assert.deepStrictEqual(aCalls, [true, false]);

  // another Shift up: nothing
  t.dispatch(new MockEvent("keyup", { key: "Shift" }));
  assert.deepStrictEqual(aCalls, [true, false]);

  // Shift down again: a(true)
  t.dispatch(new MockEvent("keydown", { key: "Shift" }));
  assert.deepStrictEqual(aCalls, [true, false, true]);

  stop();
});
