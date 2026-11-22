// The edge test for audio: plays, music, controls, silent, world/valid, world/data, level/valid.

import { test } from "node:test";
import * as assert from "node:assert";

import { create, load, update, resume } from "../../../edges/edge_to_audio.mjs";

import * as worldShape from "../../../shapes/world/index.mjs";
import * as levelShape from "../../../shapes/level/index.mjs";
import * as tileGridShape from "../../../shapes/tile-grid/index.mjs";
import * as maskShape from "../../../shapes/mask/index.mjs";
import * as saveShape from "../../../shapes/save/index.mjs";
import * as heroShape from "../../../shapes/hero/index.mjs";
import * as actorShape from "../../../shapes/actor/index.mjs";
import * as statsShape from "../../../shapes/stats/index.mjs";
import * as pointShape from "../../../shapes/point/index.mjs";

// Fake context: createGain returns {gain: {value, setValueAtTime, linearRampToValueAtTime}, connect};
// the fake context exposes destination, currentTime, state and resume;
// createBufferSource returns buffer, loop, start, stop and connect;
// decodeAudioData returns { from: ab.url }.
class FakeAudioContext {
  constructor() {
    this.gainNodes = [];
    this.bufferSources = [];
    this.destination = null;
    this.currentTime = 0;
    this.state = "ready";
  }
  resume() {}
  createGain() {
    const gain = {
      value: 0.7,
      setValueAtTime(v, t) { gain.value = v; },
      linearRampToValueAtTime(v, t) { gain.value = v; },
    };
    const node = {
      gain,
      connect(n) {},
    };
    this.gainNodes.push(node);
    return node;
  }
  createBufferSource() {
    const node = {
      buffer: null,
      loop: false,
      start() { this._started = true; },
      stop() { this._stopped = true; },
      connect() {},
    };
    this.bufferSources.push(node);
    return node;
  }
  decodeAudioData(ab) {
    return Promise.resolve({ from: ab.url });
  }
}

// Fake fetch that records URLs and provides arrayBuffer() resolving to {url}.
function makeFakeFetch() {
  const state = { urls: [] };
  const fetchFn = async (url) => {
    state.urls.push(url);
    return { ok: true, async arrayBuffer() { return Promise.resolve({ url }); } };
  };
  fetchFn.urls = () => state.urls;
  return fetchFn;
}

async function settleDecoding() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function makeWorld({ depth = 1, state = "playing" } = {}) {
  const grid = tileGridShape.fromRows(["###", "#.>", "###"]);
  const visibleCells = [true, true, true, true, true, true, true, true, true];
  const visible = maskShape.of(3, 3, visibleCells);
  const explored = maskShape.of(3, 3, [false, false, false, false, true, false, false, false, false]);
  const stats = statsShape.of({ hp: 10, maxHp: 10, attack: 3, defense: 1 });
  const actor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats });
  const hero = heroShape.of({ name: "Ann", actor });
  const save = saveShape.of({ seed: 1, depth, players: [] });
  return worldShape.of({
    seed: 1, rng: 2, depth, time: 0, state, grid,
    heroes: [hero], monsters: [], items: [], visible, explored, gold: 0, log: [], entry: save,
  });
}

function makeSteppedWorld(world) {
  const hero = world.heroes[0];
  const actor = hero.actor.with({ pos: pointShape.of(2, 1), last: { kind: "move", dx: 1, dy: 0, at: 10, reach: 1 } });
  const hero2 = hero.with({ actor });
  return world.with({ heroes: [hero2] });
}

test("audio: plays", async () => {
  const context = new FakeAudioContext();
  const fetchFn = makeFakeFetch();
  const audio = create({ context, fetch: fetchFn, base: "" });
  await load(audio);

  const next = makeSteppedWorld(makeWorld({ depth: 1 }));
  const prev = makeWorld({ depth: 1 });

  context.bufferSources.length = 0;
  await update(audio, prev, next, "Ann");
  await settleDecoding();

  const sources = context.bufferSources.filter((s) => s._started && !s.loop);
  assert.strictEqual(sources.length, 1, "one buffer source for a step");
  const from = sources[0].buffer?.from || "";
  assert.match(from, /step-\d+\.mp3/, "step file matches sfx/step-*.mp3");

  // update(null, next) starts no sound source
  context.bufferSources.length = 0;
  await update(audio, null, next, "Ann");
  await settleDecoding();
  const sources2 = context.bufferSources.filter((s) => s._started && !s.loop);
  assert.strictEqual(sources2.length, 0, "no sound source when prev is null");
});

test("audio: music", async () => {
  const context = new FakeAudioContext();
  const fetchFn = makeFakeFetch();
  const audio = create({ context, fetch: fetchFn, base: "" });
  await load(audio);

  let w = makeWorld({ depth: 1, state: "playing" });
  context.bufferSources.length = 0;
  await update(audio, null, w, "Ann");
  await settleDecoding();
  assert.ok(fetchFn.urls().includes("music/dungeon-1.mp3"), "depth 1 fetches music/dungeon-1.mp3");
  const loopSources = context.bufferSources.filter((s) => s._started && s.loop);
  assert.strictEqual(loopSources.length, 1, "music starts looping");

  w = makeWorld({ depth: 8, state: "playing" });
  await update(audio, w, w, "Ann");
  await settleDecoding();
  assert.ok(fetchFn.urls().includes("music/dungeon-2.mp3"), "depth 8 fetches music/dungeon-2.mp3");

  w = makeWorld({ depth: 33, state: "playing" });
  await update(audio, w, w, "Ann");
  await settleDecoding();
  assert.ok(fetchFn.urls().includes("music/dungeon-5.mp3"), "depth 33 fetches music/dungeon-5.mp3");

  w = makeWorld({ depth: 33, state: "won" });
  context.bufferSources.length = 0;
  await update(audio, w, w, "Ann");
  await settleDecoding();
  const startedWon = context.bufferSources.filter((s) => s._started);
  assert.strictEqual(startedWon.length, 0, "won state starts no music");
});

test("audio: controls", async () => {
  const context = new FakeAudioContext();
  const fetchFn = makeFakeFetch();
  const audio = create({ context, fetch: fetchFn, base: "" });

  assert.strictEqual(audio.volume(), 0.7, "volume is 0.7");
  assert.strictEqual(audio.louder(), 0.8, "louder 0.8");
  assert.strictEqual(audio.louder(), 0.9, "louder 0.9");
  assert.strictEqual(audio.louder(), 1, "louder 1");
  assert.strictEqual(audio.louder(), 1, "louder stays 1");

  assert.strictEqual(audio.quieter(), 0.9, "quieter 0.9");
  assert.strictEqual(audio.quieter(), 0.8, "quieter 0.8");
  assert.strictEqual(audio.quieter(), 0.7, "quieter 0.7");
  assert.strictEqual(audio.quieter(), 0.6, "quieter 0.6");
  assert.strictEqual(audio.quieter(), 0.5, "quieter 0.5");
  assert.strictEqual(audio.quieter(), 0.4, "quieter 0.4");
  assert.strictEqual(audio.quieter(), 0.3, "quieter 0.3");
  assert.strictEqual(audio.quieter(), 0.2, "quieter 0.2");
  assert.strictEqual(audio.quieter(), 0.1, "quieter 0.1");
  assert.strictEqual(audio.quieter(), 0, "quieter 0");
  assert.strictEqual(audio.quieter(), 0, "quieter stays 0");

  assert.strictEqual(audio.toggleMute(), true, "toggleMute true");
  assert.strictEqual(audio.muted(), true, "muted true");
  const next = makeSteppedWorld(makeWorld({ depth: 1 }));
  const prev = makeWorld({ depth: 1 });
  context.bufferSources.length = 0;
  await update(audio, prev, next, "Ann");
  await settleDecoding();
  const sources = context.bufferSources.filter((s) => s._started && !s.loop);
  assert.strictEqual(sources.length, 0, "muted: update starts no sound");
  assert.strictEqual(audio.toggleMute(), false, "toggleMute false");
});

test("audio: silent", async () => {
  const audio = create({ context: null });
  await load(audio);
  await resume(audio);

  const next = makeWorld({ depth: 1 });
  await update(audio, null, next, "Ann");
  assert.strictEqual(audio.louder(), 0.8, "louder 0.8 without context");
  assert.strictEqual(audio.toggleMute(), true, "toggleMute true without context");

  assert.throws(() => update(audio, {}, next, "Ann"), TypeError, "update with {} prev throws TypeError");
});

test("world/valid", async () => {
  const grid = tileGridShape.fromRows(["###", "#.>", "###"]);
  const visibleCells = [true, true, true, true, true, true, true, true, true];
  const visible = maskShape.of(3, 3, visibleCells);
  const explored = maskShape.of(3, 3, [false, false, false, false, true, false, false, false, false]);
  const stats = statsShape.of({ hp: 10, maxHp: 10, attack: 3, defense: 1 });
  const actor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats });
  const hero = heroShape.of({ name: "Ann", actor });
  const save = saveShape.of({ seed: 1, depth: 1, players: [] });
  const w = worldShape.of({
    seed: 1, rng: 2, depth: 1, time: 0, state: "playing", grid,
    heroes: [hero], monsters: [], items: [], visible, explored, gold: 0, log: [], entry: save,
  });
  assert.ok(Object.isFrozen(w), "world is frozen");
  assert.strictEqual(w.depth, 1);
  assert.throws(() => worldShape.of({ ...w, state: "dead" }), TypeError, "state dead throws");
  assert.throws(() => worldShape.of({ ...w, depth: 34 }), TypeError, "depth 34 throws");
  assert.throws(() => worldShape.of({ ...w, time: -1 }), TypeError, "time -1 throws");
  assert.throws(() => worldShape.of({ ...w, visible: maskShape.of(2, 3, [true]) }), TypeError, "visible wrong size throws");
});

test("world/data", async () => {
  const grid = tileGridShape.fromRows(["#####", "#...#", "#####"]);
  const visibleCells = [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false];
  const visible = maskShape.of(5, 3, visibleCells);
  const explored = maskShape.of(5, 3, [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]);
  const stats = statsShape.of({ hp: 10, maxHp: 10, attack: 3, defense: 1 });
  const actor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats });
  const hero = heroShape.of({ name: "Ann", actor, offer: 12 });
  const save = saveShape.of({ seed: 1, depth: 1, players: [] });
  const w = worldShape.of({
    seed: 1, rng: 2, depth: 1, time: 0, state: "playing", grid,
    heroes: [hero], monsters: [], items: [], visible, explored, gold: 0, log: [], entry: save,
  });
  const d = w.data();
  assert.deepStrictEqual(d.grid, ["#####", "#...#", "#####"], "grid rows");
  assert.strictEqual(d.visible[1], "01000", "visible row 1");
  const w2 = worldShape.fromData(JSON.parse(JSON.stringify(d)));
  assert.deepStrictEqual(w2, w, "fromData round trip equals w");
  assert.throws(() => worldShape.fromData({}), TypeError, "fromData({}) throws");
});

test("level/valid", async () => {
  assert.strictEqual(levelShape.MAX_DEPTH, 33);
  assert.strictEqual(levelShape.MAX_LEVEL, 25);
  assert.deepStrictEqual([...levelShape.THEMES], ["dungeon", "frozen", "arid", "temple", "magma", "interior"]);
  assert.deepStrictEqual([...levelShape.DUNGEON_THEMES], ["dungeon", "frozen", "arid", "temple", "magma"]);
  assert.strictEqual(levelShape.kind(1), "dungeon");
  assert.strictEqual(levelShape.kind(6), "interior");
  assert.strictEqual(levelShape.kind(7), "boss");
  assert.strictEqual(levelShape.theme(1), "dungeon");
  assert.strictEqual(levelShape.theme(6), "interior");
  assert.deepStrictEqual([...levelShape.blend(7)], ["dungeon", "frozen"]);
  assert.strictEqual(levelShape.tier(5), 0);
  assert.strictEqual(levelShape.tier(33), 4);
  assert.strictEqual(levelShape.stage(1), 1);
  assert.strictEqual(levelShape.round(6), 1);
  assert.strictEqual(levelShape.number(1), 1);
  assert.strictEqual(levelShape.label(8), "Level 6");
  assert.throws(() => levelShape.kind(0), TypeError, "kind(0) throws");
  assert.throws(() => levelShape.theme(34), TypeError, "theme(34) throws");
  assert.throws(() => levelShape.tier(1.5), TypeError, "tier(1.5) throws");
});
