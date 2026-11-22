// The call site for mixer: forwards to its surface, nothing else.
// mixer's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/mixer/index.mjs";

// __nirnroot_begin__ create
// `create(options) -> mixer`. `options`: `context`, an `AudioContext` (or anything with the same methods: `createGain()`, `createBufferSource()`, `decodeAudioData(arrayBuffer)` answering a promise, `destination`, `currentTime`, `state`, `resume()`); `fetch` (left out: the global `fetch`); `base`, a URL prefix ending in `/` (left out: `'/assets/'`); `random` (left out: `Math.random`). A missing `context` throws a `TypeError`. Answers a mixer, with the functions below; its volume 0.7, not muted, no music.
// __nirnroot_end__
export function create(...args) {
  return target.create(...args);
}

// __nirnroot_begin__ load
// `mixer.load() -> promise`. Fetches the twelve sound files (`base` plus each path), and decodes each (`response.arrayBuffer()`, then `context.decodeAudioData`). Resolves, with nothing, once all twelve are decoded; rejects, with an `Error` whose message holds the file's path, as soon as one fails (a response not `ok` fails). A sound plays only once its files are decoded.
// __nirnroot_end__
export function load(...args) {
  return target.load(...args);
}

// __nirnroot_begin__ play
// `mixer.play(cue)`. `cue` a `cue` (anything else throws a `TypeError`). Muted, or its files not decoded: nothing. Otherwise a buffer source of one of its files (above), through a new gain node of value `cue.gain` into the effects bus, started at once (`start()`).
// __nirnroot_end__
export function play(...args) {
  return target.play(...args);
}

// __nirnroot_begin__ music
// `mixer.music(track)`. `track` an integer from 0 to 5 (anything else throws a `TypeError`). The track playing already: nothing. Otherwise the track playing (if any) fades out: its gain ramps linearly to 0 over 1.5 seconds from `currentTime` (`linearRampToValueAtTime(0, currentTime + 1.5)`) and its source is stopped then (`stop(currentTime + 1.5)`). Then, for a track above 0: its file is fetched and decoded (once: a track played before is kept decoded), and a source of it, `loop` true, starts through a new gain node that ramps linearly from 0 to 1 over 1.5 seconds (`setValueAtTime(0, currentTime)`, then `linearRampToValueAtTime(1, currentTime + 1.5)`), into the music bus; if the track asked for has changed again before its file is decoded, it does not start. A track that fails to load is logged (`console.error`) and the music stays silent. Muting does not stop the music: the master is silent.
// __nirnroot_end__
export function music(...args) {
  return target.music(...args);
}

// __nirnroot_begin__ volume
// `mixer.setVolume(v)`: `v` a number from 0 to 1 (anything else throws a `TypeError`): the volume; the master's gain becomes `v` unless muted. `mixer.volume()`: the volume.
// __nirnroot_end__
export function volume(...args) {
  return target.volume(...args);
}

// __nirnroot_begin__ mute
// `mixer.setMuted(m)`: `m` a boolean (anything else throws a `TypeError`): muted or not; the master's gain becomes 0, or the volume. `mixer.muted()`: whether muted.
// __nirnroot_end__
export function mute(...args) {
  return target.mute(...args);
}

// __nirnroot_begin__ resume
// `mixer.resume() -> promise`. Browsers start an `AudioContext` suspended until the player has pressed a key or clicked: with the context's `state` `'suspended'`, `context.resume()`; otherwise nothing. Resolves once done.
// __nirnroot_end__
export function resume(...args) {
  return target.resume(...args);
}
