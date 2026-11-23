import test from 'node:test';
import assert from 'node:assert/strict';
import { create } from '../../../src/mixer/index.mjs';
import { of as cueOf, NAMES } from '../../../shapes/cue/index.mjs';

function makeFakeContext(currentTime = 0, state = 'running') {
  const gainNodes = [];
  function createGain() {
    const gain = {
      value: 1,
      setValueAtTimeCalls: [],
      linearRampToValueAtTimeCalls: [],
      setValueAtTime(v, t) { this.setValueAtTimeCalls.push([v, t]); },
      linearRampToValueAtTime(v, t) { this.linearRampToValueAtTimeCalls.push([v, t]); },
    };
    const node = {
      gain,
      connections: [],
      connect(target) { this.connections.push(target); },
    };
    gainNodes.push(node);
    return node;
  }
  const sources = [];
  function createBufferSource() {
    const source = {
      buffer: null,
      loop: false,
      connections: [],
      startCalls: 0,
      stopCalls: [],
      connect(target) { this.connections.push(target); },
      start() { this.startCalls++; },
      stop(t) { this.stopCalls.push(t); },
    };
    sources.push(source);
    return source;
  }
  const decodeCalls = [];
  function decodeAudioData(buffer) {
    decodeCalls.push(buffer);
    return Promise.resolve(buffer);
  }
  const resumeCalls = [];
  function resume() { resumeCalls.push(1); return Promise.resolve(); }

  let ct = currentTime;
  let st = state;
  const ctx = {
    createGain,
    createBufferSource,
    decodeAudioData,
    destination: { name: 'destination' },
    get currentTime() { return ct; },
    set currentTime(v) { ct = v; },
    get state() { return st; },
    set state(v) { st = v; },
    resume,
  };

  return { ctx, gainNodes, sources, decodeCalls, resumeCalls, set currentTime(v) { ct = v; } };
}

const SOUND_PATHS = [
  'sfx/step-1.mp3', 'sfx/step-2.mp3', 'sfx/step-3.mp3', 'sfx/step-4.mp3',
  'sfx/swing.mp3', 'sfx/shot.mp3', 'sfx/hit.mp3', 'sfx/death.mp3',
  'sfx/coin.mp3', 'sfx/powerup.mp3', 'sfx/use.mp3', 'sfx/stairs.mp3',
  'sfx/hiss.mp3', 'sfx/boom.mp3',
];

test('create throws when context is missing', () => {
  assert.throws(() => create({}), TypeError);
  assert.throws(() => create({ context: {} }), TypeError);
});

test('load fetches and decodes the fourteen sound files', async () => {
  const fake = makeFakeContext();
  const urls = [];
  const fetcher = async (url) => {
    urls.push(url);
    return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) };
  };
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  await mixer.load();
  assert.equal(urls.length, 14);
  assert.equal(fake.decodeCalls.length, 14);
  for (const p of SOUND_PATHS) {
    assert.ok(urls.includes(`/assets/${p}`), `expected fetch of /assets/${p}`);
  }
});

test('load uses base prefix', async () => {
  const fake = makeFakeContext();
  const urls = [];
  const fetcher = async (url) => { urls.push(url); return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }; };
  const mixer = create({ context: fake.ctx, fetch: fetcher, base: '/x/' });
  await mixer.load();
  for (const u of urls) assert.ok(u.startsWith('/x/sfx/'), `url ${u} should start with /x/sfx/`);
});

test('load rejects when a fetch is not ok', async () => {
  const fake = makeFakeContext();
  const fetcher = async (url) => {
    if (url.endsWith('sfx/coin.mp3')) return { ok: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) };
    return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) };
  };
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  await assert.rejects(() => mixer.load(), (e) => e.message.includes('sfx/coin.mp3'));
});

test('load works with a fetch that enforces this is undefined or global', async () => {
  const fake = makeFakeContext();
  const globalObj = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : undefined);
  let calledThis = null;
  const strictFetch = async function (url) {
    calledThis = this;
    if (this !== undefined && this !== globalObj) {
      throw new TypeError('fetch must be called with undefined or globalThis as this');
    }
    return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) };
  };
  const mixer = create({ context: fake.ctx, fetch: strictFetch });
  await mixer.load();
  assert.equal(fake.decodeCalls.length, 14);
  assert.equal(calledThis, undefined);
});

test('play starts nothing before load resolves', async () => {
  const fake = makeFakeContext();
  const fetcher = async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  const cue = cueOf({ name: 'step', gain: 0.5 });
  mixer.play(cue);
  assert.equal(fake.sources.length, 0);
});

test('play creates correct source for step with random 0.6', async () => {
  const fake = makeFakeContext();
  const decodedByPath = {};
  const fetcher = async (url) => {
    const path = url.replace('/assets/', '');
    const buf = { __path: path };
    decodedByPath[path] = buf;
    return { ok: true, arrayBuffer: () => Promise.resolve(buf) };
  };
  const mixer = create({ context: fake.ctx, fetch: fetcher, random: () => 0.6 });
  await mixer.load();

  const cue = cueOf({ name: 'step', gain: 0.5 });
  mixer.play(cue);

  assert.equal(fake.sources.length, 1);
  const source = fake.sources[0];
  assert.equal(source.buffer, decodedByPath['sfx/step-3.mp3']);
  assert.equal(source.startCalls, 1);

  const gainNodes = fake.gainNodes;
  assert.equal(gainNodes.length, 4); // master, effectsBus, musicBus, playGain
  const playGain = gainNodes[3];
  assert.equal(playGain.gain.value, 0.5);
  assert.ok(playGain.connections.includes(gainNodes[1])); // effectsBus
});

test('play of swing uses sfx/swing.mp3', async () => {
  const fake = makeFakeContext();
  const decodedByPath = {};
  const fetcher = async (url) => {
    const path = url.replace('/assets/', '');
    const buf = { __path: path };
    decodedByPath[path] = buf;
    return { ok: true, arrayBuffer: () => Promise.resolve(buf) };
  };
  const mixer = create({ context: fake.ctx, fetch: fetcher, random: () => 0 });
  await mixer.load();
  mixer.play(cueOf({ name: 'swing', gain: 0.7 }));
  assert.equal(fake.sources.length, 1);
  assert.equal(fake.sources[0].buffer, decodedByPath['sfx/swing.mp3']);
});

test('play rejects a plain object cue', () => {
  const fake = makeFakeContext();
  const fetcher = async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  assert.throws(() => mixer.play({ name: 'step', gain: 1 }), TypeError);
});

test('mute: master gain, muted(), play blocked', async () => {
  const fake = makeFakeContext();
  const fetcher = async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  await mixer.load();
  assert.equal(fake.gainNodes[0].gain.value, 0.7);

  mixer.setMuted(true);
  assert.equal(fake.gainNodes[0].gain.value, 0);
  assert.equal(mixer.muted(), true);

  const cue = cueOf({ name: 'step', gain: 0.5 });
  mixer.play(cue);
  assert.equal(fake.sources.length, 0);

  mixer.setMuted(false);
  assert.equal(fake.gainNodes[0].gain.value, 0.7);

  mixer.setVolume(0.3);
  assert.equal(mixer.volume(), 0.3);
  assert.equal(fake.gainNodes[0].gain.value, 0.3);

  mixer.setMuted(true);
  mixer.setVolume(0.5);
  assert.equal(fake.gainNodes[0].gain.value, 0);
  mixer.setMuted(false);
  assert.equal(fake.gainNodes[0].gain.value, 0.5);
});

test('mute: invalid volume and muted throw', () => {
  const fake = makeFakeContext();
  const fetcher = async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  assert.throws(() => mixer.setVolume(1.5), TypeError);
  assert.throws(() => mixer.setVolume('1'), TypeError);
  assert.throws(() => mixer.setMuted(1), TypeError);
});

test('music: fetches and starts track 2 with linear ramps', async () => {
  const fake = makeFakeContext(10, 'running');
  const musicUrls = [];
  const fetcher = async (url) => {
    musicUrls.push(url);
    return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) };
  };
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  mixer.music(2);
  assert.equal(musicUrls.length, 1);
  assert.equal(musicUrls[0], '/assets/music/dungeon-2.mp3');

  await new Promise((r) => setTimeout(r, 10));
  assert.equal(fake.sources.length, 1);
  const source = fake.sources[0];
  assert.equal(source.loop, true);
  const gainNode = fake.gainNodes[3];
  assert.deepEqual(gainNode.gain.setValueAtTimeCalls, [[0, 10]]);
  assert.deepEqual(gainNode.gain.linearRampToValueAtTimeCalls, [[1, 11.5]]);
});

test('music: second music(2) does no fetch or new source', async () => {
  const fake = makeFakeContext(10, 'running');
  const musicUrls = [];
  const fetcher = async (url) => { musicUrls.push(url); return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }; };
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  mixer.music(2);
  await new Promise((r) => setTimeout(r, 10));
  const sourcesBefore = fake.sources.length;
  mixer.music(2);
  assert.equal(musicUrls.length, 1);
  assert.equal(fake.sources.length, sourcesBefore);
});

test('music: music(3) fades track 2 and starts track 3', async () => {
  const fake = makeFakeContext(10, 'running');
  const fetcher = async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  mixer.music(2);
  await new Promise((r) => setTimeout(r, 10));
  const track2Gain = fake.gainNodes[3];
  const track2Source = fake.sources[0];

  fake.currentTime = 10;
  mixer.music(3);
  const fades = track2Gain.gain.linearRampToValueAtTimeCalls;
  assert.ok(fades.some(([v, t]) => v === 0 && t === 11.5), 'track 2 gain faded to 0 at 11.5');
  assert.deepEqual(track2Source.stopCalls, [11.5]);

  await new Promise((r) => setTimeout(r, 10));
  assert.equal(fake.sources.length, 2);
});

test('music: music(2) again reuses decoded track 2', async () => {
  const fake = makeFakeContext(10, 'running');
  const musicUrls = [];
  const fetcher = async (url) => { musicUrls.push(url); return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }; };
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  mixer.music(2);
  await new Promise((r) => setTimeout(r, 10));
  mixer.music(3);
  await new Promise((r) => setTimeout(r, 10));
  mixer.music(2);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(musicUrls.filter((u) => u.includes('dungeon-2')).length, 1);
});

test('music: music(0) fades out and starts nothing', async () => {
  const fake = makeFakeContext(10, 'running');
  const fetcher = async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  mixer.music(2);
  await new Promise((r) => setTimeout(r, 10));
  const track2Gain = fake.gainNodes[3];
  const sourcesBefore = fake.sources.length;
  mixer.music(0);
  const fades = track2Gain.gain.linearRampToValueAtTimeCalls;
  assert.ok(fades.some(([v, t]) => v === 0 && t === 11.5), 'track 2 gain faded to 0 at 11.5');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(fake.sources.length, sourcesBefore);
});

test('music: invalid track throws', () => {
  const fake = makeFakeContext();
  const fetcher = async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
  const mixer = create({ context: fake.ctx, fetch: fetcher });
  assert.throws(() => mixer.music(10), TypeError);
  assert.throws(() => mixer.music(-1), TypeError);
  assert.throws(() => mixer.music(1.5), TypeError);
});

test('music: tracks 6 to 9 fetch the correct files', async () => {
  const fake = makeFakeContext(10, 'running');
  const musicUrls = [];
  const fetcher = async (url) => {
    musicUrls.push(url);
    return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) };
  };
  const mixer = create({ context: fake.ctx, fetch: fetcher });

  mixer.music(9);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(musicUrls.length, 1);
  assert.equal(musicUrls[0], '/assets/music/boss.mp3');

  musicUrls.length = 0;
  mixer.music(8);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(musicUrls.length, 1);
  assert.equal(musicUrls[0], '/assets/music/shop.mp3');

  musicUrls.length = 0;
  mixer.music(6);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(musicUrls.length, 1);
  assert.equal(musicUrls[0], '/assets/music/dark-comical.mp3');

  musicUrls.length = 0;
  mixer.music(7);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(musicUrls.length, 1);
  assert.equal(musicUrls[0], '/assets/music/desert-dungeon.mp3');
});

test('resume: calls context.resume when suspended, not when running', async () => {
  const fakeSuspend = makeFakeContext(0, 'suspended');
  const mixerSuspend = create({ context: fakeSuspend.ctx, fetch: async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }) });
  await mixerSuspend.resume();
  assert.equal(fakeSuspend.resumeCalls.length, 1);

  const fakeRunning = makeFakeContext(0, 'running');
  const mixerRunning = create({ context: fakeRunning.ctx, fetch: async (url) => ({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }) });
  await mixerRunning.resume();
  assert.equal(fakeRunning.resumeCalls.length, 0);
});
