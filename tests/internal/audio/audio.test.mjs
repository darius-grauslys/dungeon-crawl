// audio: internal tests of the Node's surface (create, controls, silent mode).

import test from "node:test";
import assert from "node:assert/strict";

import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as world from "../../../shapes/world/index.mjs";
import { create, load, update, volume, mute, resume, trackFor } from "../../../src/audio/index.mjs";

function makeWorld(depth = 1, state = "playing") {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth, players: [] });
  return world.of({
    seed: 1, rng: 2, depth, time: 0, state, grid,
    heroes: [], monsters: [], items: [], visible, explored, gold: 0, log: [], entry,
  });
}

test("create: default volume and mute", () => {
  const a = create({ context: null });
  assert.strictEqual(a.volume(), 0.7);
  assert.strictEqual(a.muted(), false);
});

test("create: controls with silent context", () => {
  const a = create({ context: null });
  assert.strictEqual(a.louder(), 0.8);
  assert.strictEqual(a.louder(), 0.9);
  assert.strictEqual(a.louder(), 1);
  assert.strictEqual(a.louder(), 1);
  assert.strictEqual(a.volume(), 1);
  assert.strictEqual(a.quieter(), 0.9);
});

test("create: quieter floors to 0", () => {
  const b = create({ context: null });
  assert.strictEqual(b.quieter(), 0.6);
  assert.strictEqual(b.quieter(), 0.5);
  assert.strictEqual(b.quieter(), 0.4);
  assert.strictEqual(b.quieter(), 0.3);
  assert.strictEqual(b.quieter(), 0.2);
  assert.strictEqual(b.quieter(), 0.1);
  assert.strictEqual(b.quieter(), 0);
  assert.strictEqual(b.quieter(), 0);
});

test("create: toggleMute", () => {
  const a = create({ context: null });
  assert.strictEqual(a.toggleMute(), true);
  assert.strictEqual(a.muted(), true);
  assert.strictEqual(a.toggleMute(), false);
  assert.strictEqual(a.muted(), false);
});

test("create: load and resume resolve", async () => {
  const a = create({ context: null });
  await load(a);
  await resume(a);
});

test("update: validates arguments", () => {
  const a = create({ context: null });
  const next = makeWorld();
  assert.throws(() => update(a, {}, next, "Ann"), TypeError);
  assert.throws(() => update(a, null, {}, "Ann"), TypeError);
  assert.throws(() => update(a, null, next, 5), TypeError);
  assert.throws(() => update(a, null, next), TypeError);
});

test("update: silent mode does nothing and doesn't throw", () => {
  const a = create({ context: null });
  const prev = makeWorld(1, "playing");
  const next = makeWorld(2, "playing");
  assert.doesNotThrow(() => update(a, prev, next, "Ann"));
  assert.doesNotThrow(() => update(a, null, next, "Ann"));
});

test("volume wrapper", () => {
  const a = create({ context: null });
  const v = volume(a);
  assert.strictEqual(v.get(), 0.7);
  assert.strictEqual(v.louder(), 0.8);
});

test("mute wrapper", () => {
  const a = create({ context: null });
  const m = mute(a);
  assert.strictEqual(m.get(), false);
  assert.strictEqual(m.toggle(), true);
  assert.strictEqual(m.get(), true);
});

test("create: context null makes no mixer, load and resume resolve", async () => {
  const a = create({ context: null });
  assert.strictEqual(a.volume(), 0.7);
  assert.strictEqual(a.muted(), false);
  await load(a);
  await resume(a);
});

test("create: context left out uses instance when AudioContext exists", () => {
  class StubAudioContext {
    static instantiated = false;
    constructor() {
      StubAudioContext.instantiated = true;
      this.destination = { value: 1, connect() {}, disconnect() {} };
      this.currentTime = 0;
      this.state = "running";
    }
    createGain() {
      let v = 1;
      return {
        get value() { return v; },
        set value(x) { v = x; },
        connect() {},
        disconnect() {},
        linearRampToValueAtTime() {},
        setValueAtTime() {}
      };
    }
    createBufferSource() {
      return { set loop(x) {}, start() {}, stop() {} };
    }
    decodeAudioData() { return Promise.resolve({}); }
    resume() { return Promise.resolve(); }
  }
  const savedWindow = global.window;
  global.window = { AudioContext: StubAudioContext };
  try {
    let a;
    let err = null;
    try {
      a = create({});
    } catch (e) {
      err = e;
    }
    // The AudioContext must be instantiated (an instance reaches the mixer),
    // not passed as the class itself. If the class were passed, the mixer
    // would throw "context is required".
    assert.strictEqual(StubAudioContext.instantiated, true, "AudioContext should be instantiated, not passed as class");
    if (err) {
      assert.notStrictEqual(err.message, "context is required", "an instance, not the class, should reach the mixer");
    } else {
      assert.strictEqual(a.volume(), 0.7);
      assert.strictEqual(a.muted(), false);
    }
  } finally {
    if (savedWindow === undefined) delete global.window; else global.window = savedWindow;
  }
});

test("create: context left out with no AudioContext makes no mixer", () => {
  const savedWindow = global.window;
  global.window = {};
  try {
    const a = create({});
    assert.strictEqual(a.volume(), 0.7);
    assert.strictEqual(a.muted(), false);
    assert.doesNotThrow(() => load(a));
    assert.doesNotThrow(() => resume(a));
  } finally {
    if (savedWindow === undefined) delete global.window; else global.window = savedWindow;
  }
});

test("trackFor: not playing is 0", () => {
  assert.strictEqual(trackFor({ state: "won", depth: 33 }), 0);
});

test("trackFor: dungeon stages 1,3,5 are tier+1", () => {
  assert.strictEqual(trackFor({ state: "playing", depth: 1 }), 1);
  assert.strictEqual(trackFor({ state: "playing", depth: 3 }), 1);
  assert.strictEqual(trackFor({ state: "playing", depth: 5 }), 1);
  assert.strictEqual(trackFor({ state: "playing", depth: 8 }), 2);
  assert.strictEqual(trackFor({ state: "playing", depth: 33 }), 5);
});

test("trackFor: dungeon stage 2 is 6, stage 4 is 7", () => {
  assert.strictEqual(trackFor({ state: "playing", depth: 2 }), 6);
  assert.strictEqual(trackFor({ state: "playing", depth: 9 }), 6);
  assert.strictEqual(trackFor({ state: "playing", depth: 4 }), 7);
  assert.strictEqual(trackFor({ state: "playing", depth: 11 }), 7);
});

test("trackFor: shop (interior) is 8", () => {
  assert.strictEqual(trackFor({ state: "playing", depth: 6 }), 8);
  assert.strictEqual(trackFor({ state: "playing", depth: 13 }), 8);
  assert.strictEqual(trackFor({ state: "playing", depth: 20 }), 8);
  assert.strictEqual(trackFor({ state: "playing", depth: 27 }), 8);
});

test("trackFor: boss rounds 1..3 are 9", () => {
  assert.strictEqual(trackFor({ state: "playing", depth: 7 }), 9);
  assert.strictEqual(trackFor({ state: "playing", depth: 14 }), 9);
  assert.strictEqual(trackFor({ state: "playing", depth: 21 }), 9);
});

test("trackFor: boss round 4 (empty lair) is tier+1", () => {
  assert.strictEqual(trackFor({ state: "playing", depth: 28 }), 4);
});
