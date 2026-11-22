// mixer: plays the game's sounds and music through the Web Audio API.

import { NAMES as cueNAMES } from '../../shapes/cue/index.mjs';

const SOUNDS = {
  step: ['sfx/step-1.mp3', 'sfx/step-2.mp3', 'sfx/step-3.mp3', 'sfx/step-4.mp3'],
  swing: ['sfx/swing.mp3'],
  shot: ['sfx/shot.mp3'],
  hit: ['sfx/hit.mp3'],
  death: ['sfx/death.mp3'],
  coin: ['sfx/coin.mp3'],
  powerup: ['sfx/powerup.mp3'],
  use: ['sfx/use.mp3'],
  stairs: ['sfx/stairs.mp3'],
};

const SOUND_PATHS = Object.values(SOUNDS).flat();

const MUSIC_PATHS = {
  1: 'music/dungeon-1.mp3',
  2: 'music/dungeon-2.mp3',
  3: 'music/dungeon-3.mp3',
  4: 'music/dungeon-4.mp3',
  5: 'music/dungeon-5.mp3',
};

export function create({ context, fetch: fetcher, base, random }) {
  if (!context || typeof context.createGain !== 'function' || typeof context.createBufferSource !== 'function' || typeof context.decodeAudioData !== 'function') {
    throw new TypeError('context is required');
  }
  const fetchImpl = fetcher ?? (typeof fetch !== 'undefined' ? fetch : undefined);
  const baseImpl = base ?? '/assets/';
  const rand = random ?? Math.random;

  const master = context.createGain();
  master.gain.value = 0.7;
  master.connect(context.destination);

  const effectsBus = context.createGain();
  effectsBus.gain.value = 1;
  effectsBus.connect(master);

  const musicBus = context.createGain();
  musicBus.gain.value = 0.4;
  musicBus.connect(master);

  const state = {
    context,
    fetch: fetchImpl,
    base: baseImpl,
    random: rand,
    master,
    effectsBus,
    musicBus,
    volume: 0.7,
    muted: false,
    soundBuffers: new Map(),
    musicBuffers: new Map(),
    musicInFlight: new Map(),
    currentTrack: 0,
    playingSource: null,
    playingGain: null,
    loadToken: 0,
  };

  function setVolume(v) {
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 1) {
      throw new TypeError('volume must be a number from 0 to 1');
    }
    state.volume = v;
    if (!state.muted) state.master.gain.value = v;
  }

  function volume() {
    return state.volume;
  }

  function setMuted(m) {
    if (typeof m !== 'boolean') {
      throw new TypeError('muted must be a boolean');
    }
    state.muted = m;
    state.master.gain.value = m ? 0 : state.volume;
  }

  function muted() {
    return state.muted;
  }

  async function load() {
    const promises = SOUND_PATHS.map(async (path) => {
      const url = state.base + path;
      const response = await state.fetch(url);
      if (!response.ok) {
        throw new Error(path);
      }
      const buffer = await response.arrayBuffer();
      const decoded = await state.context.decodeAudioData(buffer);
      state.soundBuffers.set(path, decoded);
    });
    await Promise.all(promises);
  }

  function play(cueArg) {
    if (!(cueArg && Object.isFrozen(cueArg) && typeof cueArg.name === 'string' && cueNAMES.includes(cueArg.name) && typeof cueArg.gain === 'number' && !Number.isNaN(cueArg.gain) && cueArg.gain > 0 && cueArg.gain <= 1)) {
      throw new TypeError('cue must be a cue');
    }
    const cue = cueArg;
    if (state.muted) return;
    const paths = SOUNDS[cue.name];
    if (!paths) return;
    for (const p of paths) {
      if (!state.soundBuffers.has(p)) return;
    }
    const idx = Math.floor(state.random() * paths.length);
    const file = paths[idx];
    const buffer = state.soundBuffers.get(file);
    const source = state.context.createBufferSource();
    source.buffer = buffer;
    const gainNode = state.context.createGain();
    gainNode.gain.value = cue.gain;
    source.connect(gainNode);
    gainNode.connect(state.effectsBus);
    source.start();
  }

  function music(track) {
    if (typeof track !== 'number' || !Number.isInteger(track) || track < 0 || track > 5) {
      throw new TypeError('track must be an integer from 0 to 5');
    }
    if (track === state.currentTrack) return;

    if (state.currentTrack > 0 && state.playingSource && state.playingGain) {
      const t = state.context.currentTime;
      state.playingGain.gain.linearRampToValueAtTime(0, t + 1.5);
      state.playingSource.stop(t + 1.5);
    }

    state.currentTrack = track;

    if (track === 0) {
      state.playingSource = null;
      state.playingGain = null;
      return;
    }

    const musicPath = MUSIC_PATHS[track];

    const ensureLoaded = () => {
      if (state.musicBuffers.has(track)) return Promise.resolve(state.musicBuffers.get(track));
      if (state.musicInFlight.has(track)) return state.musicInFlight.get(track);
      const promise = (async () => {
        const url = state.base + musicPath;
        const response = await state.fetch(url);
        if (!response.ok) throw new Error(musicPath);
        const buffer = await response.arrayBuffer();
        const decoded = await state.context.decodeAudioData(buffer);
        state.musicBuffers.set(track, decoded);
        return decoded;
      })();
      state.musicInFlight.set(track, promise);
      promise.finally(() => state.musicInFlight.delete(track));
      return promise;
    };

    const token = ++state.loadToken;

    ensureLoaded().then((decoded) => {
      if (token !== state.loadToken || state.currentTrack !== track) return;
      try {
        const source = state.context.createBufferSource();
        source.buffer = decoded;
        source.loop = true;
        const gainNode = state.context.createGain();
        const t = state.context.currentTime;
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(1, t + 1.5);
        source.connect(gainNode);
        gainNode.connect(state.musicBus);
        source.start();
        state.playingSource = source;
        state.playingGain = gainNode;
      } catch (e) {
        console.error(`music track ${track} failed to load: ${e}`);
      }
    }).catch((e) => {
      console.error(`music track ${track} failed to load: ${e}`);
    });
  }

  async function resume() {
    if (state.context.state === 'suspended') {
      await state.context.resume();
    }
  }

  return { load, play, music, setVolume, volume, setMuted, muted, resume };
}

export function load(mixer) { return mixer.load(); }
export function play(mixer, cue) { return mixer.play(cue); }
export function music(mixer, track) { return mixer.music(track); }
export function volume(mixer, v) { if (v === undefined) return mixer.volume(); return mixer.setVolume(v); }
export function mute(mixer, m) { if (m === undefined) return mixer.muted(); return mixer.setMuted(m); }
export function resume(mixer) { return mixer.resume(); }
