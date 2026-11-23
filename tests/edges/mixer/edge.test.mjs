// The edge test for mixer: loads, plays, mutes, music, resumes, and cue/valid.

import { test } from "node:test";
import assert from "node:assert/strict";
import { of as cueOf, NAMES as cueNames } from "../../../shapes/cue/index.mjs";
import { create, load, play, music, volume, mute, resume } from "../../../edges/edge_to_mixer.mjs";

function makeFakeContext() {
  const gains = [];
  const sources = [];
  let currentTime = 0;
  let state = "running";

  function createGain() {
    const node = {
      gain: {
        value: 0,
        calls: [],
        setValueAtTime(v, t) { node.gain.value = v; node.gain.calls.push(["setValueAtTime", v, t]); },
        linearRampToValueAtTime(v, t) { node.gain.calls.push(["linearRampToValueAtTime", v, t]); },
      },
      connectedTo: null,
      connect(n) { this.connectedTo = n; },
    };
    gains.push(node);
    return node;
  }

  function createBufferSource() {
    const src = {
      buffer: null,
      loop: false,
      connectedTo: null,
      startedCount: 0,
      stoppedAt: null,
      connect(n) { this.connectedTo = n; },
      start() { this.startedCount++; },
      stop(t) { this.stoppedAt = t; },
    };
    sources.push(src);
    return src;
  }

  const context = {
    createGain,
    createBufferSource,
    decodeAudioDataCount: 0,
    decodeAudioData(ab) { this.decodeAudioDataCount++; return Promise.resolve({ from: ab.url }); },
    get destination() { return this._destination; },
    set destination(d) { this._destination = d; },
    _destination: null,
    get currentTime() { return currentTime; },
    set currentTime(v) { currentTime = v; },
    get state() { return state; },
    set state(v) { state = v; },
    resumeCount: 0,
    resume() { this.resumeCount++; },
    gains, sources,
  };
  context.destination = { __isDestination: true };

  return context;
}

function makeFetch(records) {
  return (url) => {
    records.push(url);
    return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve({ url }) });
  };
}

function failingFetch(records, failUrl) {
  return (url) => {
    records.push(url);
    if (url.includes(failUrl)) {
      return Promise.resolve({ ok: false, arrayBuffer: () => Promise.resolve({ url }) });
    }
    return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve({ url }) });
  };
}

function masterOf(context) {
  return context.gains.find((g) => g.connectedTo === context.destination);
}

async function settle() { await Promise.resolve(); await Promise.resolve(); }

// Intrinsic - loads
test("mixer: loads fetches and decodes fourteen sound files", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch });
  await load(mixer);
  const expected = [
    "/assets/sfx/step-1.mp3", "/assets/sfx/step-2.mp3", "/assets/sfx/step-3.mp3", "/assets/sfx/step-4.mp3",
    "/assets/sfx/swing.mp3", "/assets/sfx/shot.mp3", "/assets/sfx/hit.mp3", "/assets/sfx/death.mp3",
    "/assets/sfx/coin.mp3", "/assets/sfx/powerup.mp3", "/assets/sfx/use.mp3", "/assets/sfx/stairs.mp3",
    "/assets/sfx/hiss.mp3", "/assets/sfx/boom.mp3",
  ];
  assert.deepEqual(records, expected);
  assert.equal(context.gains.length, 3);
  assert.equal(context.decodeAudioDataCount, 14);
});

test("mixer: loads respects base", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, base: "/x/" });
  await load(mixer);
  assert.equal(records.length, 14);
  assert.ok(records[0].startsWith("/x/sfx/step-1.mp3"));
  assert.ok(records.every((r) => r.startsWith("/x/sfx/")));
});

test("mixer: loads rejects when a file is not ok", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = failingFetch(records, "coin.mp3");
  const mixer = create({ context, fetch });
  await assert.rejects(load(mixer), /sfx\/coin\.mp3/);
});

test("mixer: create throws without context", () => {
  assert.throws(() => create({}), TypeError);
});

// Intrinsic - plays
test("mixer: plays step picks step-3 with random 0.6", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0.6 });
  await load(mixer);
  play(mixer, cueOf({ name: "step", gain: 0.5 }));
  const stepSources = context.sources.filter((s) => s.buffer && s.buffer.from && s.buffer.from.includes("step-3.mp3"));
  assert.equal(stepSources.length, 1);
  const src = stepSources[0];
  assert.equal(src.startedCount, 1);
  const gain = src.connectedTo;
  assert.equal(gain.gain.value, 0.5);
});

test("mixer: plays swing uses swing.mp3", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  play(mixer, cueOf({ name: "swing", gain: 0.5 }));
  const swingSources = context.sources.filter((s) => s.buffer && s.buffer.from && s.buffer.from.includes("swing.mp3"));
  assert.equal(swingSources.length, 1);
});

test("mixer: play before load resolves starts nothing", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  play(mixer, cueOf({ name: "step", gain: 0.5 }));
  assert.equal(context.sources.length, 0);
});

test("mixer: play with plain object throws", () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  assert.throws(() => play(mixer, { name: "step", gain: 1 }), TypeError);
});

// Intrinsic - mutes
test("mixer: mutes toggles master gain and blocks play", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  const m = masterOf(context);
  assert.equal(m.gain.value, 0.7);
  mute(mixer, true);
  assert.equal(m.gain.value, 0);
  assert.equal(mute(mixer), true);
  play(mixer, cueOf({ name: "step", gain: 0.5 }));
  assert.equal(context.sources.filter((s) => s.startedCount > 0).length, 0);
  mute(mixer, false);
  assert.equal(m.gain.value, 0.7);
});

test("mixer: volume sets and gets master gain", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  const m = masterOf(context);
  volume(mixer, 0.3);
  assert.equal(m.gain.value, 0.3);
  assert.equal(volume(mixer), 0.3);
});

test("mixer: volume while muted leaves master at 0, unmuting restores", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  const m = masterOf(context);
  mute(mixer, true);
  volume(mixer, 0.5);
  assert.equal(m.gain.value, 0);
  mute(mixer, false);
  assert.equal(m.gain.value, 0.5);
});

test("mixer: volume and mute type errors", () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  assert.throws(() => volume(mixer, 1.5), TypeError);
  assert.throws(() => volume(mixer, "1"), TypeError);
  assert.throws(() => mute(mixer, 1), TypeError);
});

// Intrinsic - music
test("mixer: music starts a looping source with ramps", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  context.currentTime = 10;
  await music(mixer, 2);
  await settle();
  assert.ok(records.some((r) => r.includes("/music/dungeon-2.mp3")));
  const musicSources = context.sources.filter((s) => s.loop === true);
  assert.equal(musicSources.length, 1);
  const src = musicSources[0];
  const gain = src.connectedTo;
  assert.ok(gain.gain.calls.some((c) => c[0] === "setValueAtTime" && c[1] === 0 && c[2] === 10));
  assert.ok(gain.gain.calls.some((c) => c[0] === "linearRampToValueAtTime" && c[1] === 1 && c[2] === 11.5));
});

test("mixer: music twice fetches once", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  context.currentTime = 10;
  await music(mixer, 2);
  await settle();
  const before = records.filter((r) => r.includes("/music/dungeon-2.mp3")).length;
  await music(mixer, 2);
  await settle();
  const after = records.filter((r) => r.includes("/music/dungeon-2.mp3")).length;
  assert.equal(after, before);
  assert.equal(context.sources.filter((s) => s.loop === true).length, 1);
});

test("mixer: music switches fade out and start", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  context.currentTime = 10;
  await music(mixer, 2);
  await settle();
  const src2 = context.sources.find((s) => s.loop === true);
  const gain2 = src2.connectedTo;
  context.currentTime = 10;
  await music(mixer, 3);
  await settle();
  assert.ok(gain2.gain.calls.some((c) => c[0] === "linearRampToValueAtTime" && c[1] === 0 && c[2] === 11.5));
  assert.equal(src2.stoppedAt, 11.5);
  const musicSources = context.sources.filter((s) => s.loop === true);
  assert.equal(musicSources.length, 2);
});

test("mixer: music track 2 after 3 no new fetch", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  context.currentTime = 10;
  await music(mixer, 2);
  await settle();
  await music(mixer, 3);
  await settle();
  const before2 = records.filter((r) => r.includes("/music/dungeon-2.mp3")).length;
  await music(mixer, 2);
  await settle();
  const after2 = records.filter((r) => r.includes("/music/dungeon-2.mp3")).length;
  assert.equal(after2, before2);
});

test("mixer: music 0 fades out, nothing starts", async () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await load(mixer);
  context.currentTime = 10;
  await music(mixer, 2);
  await settle();
  const sourcesBefore = context.sources.filter((s) => s.loop === true).length;
  await music(mixer, 0);
  await settle();
  const sourcesAfter = context.sources.filter((s) => s.loop === true).length;
  assert.equal(sourcesAfter, sourcesBefore);
  assert.ok(!records.some((r) => r.includes("/music/dungeon-0")));
});

test("mixer: music type errors", () => {
  const context = makeFakeContext();
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  assert.throws(() => music(mixer, 6), TypeError);
  assert.throws(() => music(mixer, 1.5), TypeError);
});

// Intrinsic - resumes
test("mixer: resumes calls context.resume when suspended", async () => {
  const context = makeFakeContext();
  context.state = "suspended";
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await resume(mixer);
  assert.equal(context.resumeCount, 1);
});

test("mixer: resumes does not call when running", async () => {
  const context = makeFakeContext();
  context.state = "running";
  const records = [];
  const fetch = makeFetch(records);
  const mixer = create({ context, fetch, random: () => 0 });
  await resume(mixer);
  assert.equal(context.resumeCount, 0);
});

// Intrinsic - cue/valid
test("cue/valid builds and refuses", () => {
  assert.deepEqual(cueNames, ["step", "swing", "shot", "hit", "death", "coin", "powerup", "use", "stairs", "hiss", "boom"]);
  const c = cueOf({ name: "step", gain: 0.5 });
  assert.equal(c.name, "step");
  assert.equal(c.gain, 0.5);
  assert.deepEqual(Object.freeze(c), c);
  // 'stairs' with gain 1 is accepted (matching the implementation and the table).
  const stairCue = cueOf({ name: "stairs", gain: 1 });
  assert.equal(stairCue.name, "stairs");
  assert.equal(stairCue.gain, 1);
  assert.throws(() => cueOf({ name: "bang", gain: 1 }), TypeError);
  assert.throws(() => cueOf({ name: "step", gain: 0 }), TypeError);
  assert.throws(() => cueOf({ name: "step", gain: 1.5 }), TypeError);
  assert.throws(() => cueOf({ name: "step", gain: "1" }), TypeError);
  assert.throws(() => cueOf({ name: "step" }), TypeError);
});
