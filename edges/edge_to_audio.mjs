// The call site for audio: forwards to its surface, nothing else.
// audio's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/audio/index.mjs";

// __nirnroot_begin__ create
// `create(options) -> audio`. `options` (left out: `{}`): `context` (left out: a new `AudioContext` of the page, `window.AudioContext` or `window.webkitAudioContext`, or none; `null`: none); `fetch` and `base`, handed to the mixer. Answers an audio with the functions below: volume 0.7, not muted.
// __nirnroot_end__
export function create(...args) {
  return target.create(...args);
}

// __nirnroot_begin__ load
// `audio.load() -> promise`. Loads the sounds (the mixer's `load`). Resolves once they are in; on a failure it logs the error (`console.error`) and resolves all the same (the game plays on, silent where a sound is missing).
// __nirnroot_end__
export function load(...args) {
  return target.load(...args);
}

// __nirnroot_begin__ update
// `audio.update(prev, next, me)`. `prev` the world before (or `null`), `next` the new one (a `world`), `me` the player's name. Plays every cue of `cues.cues(prev, next, me)`, in order, and sets the music to `next`'s track (above). Anything else throws a `TypeError`.
// __nirnroot_end__
export function update(...args) {
  return target.update(...args);
}

// __nirnroot_begin__ volume
// `audio.louder()` and `audio.quieter()`: the volume 0.1 more or less (rounded to a tenth, kept from 0 to 1); each answers the new volume. `audio.volume()`: the volume.
// __nirnroot_end__
export function volume(...args) {
  return target.volume(...args);
}

// __nirnroot_begin__ mute
// `audio.toggleMute()`: muted becomes not muted and the other way; answers whether it is now muted. `audio.muted()`: whether muted.
// __nirnroot_end__
export function mute(...args) {
  return target.mute(...args);
}

// __nirnroot_begin__ resume
// `audio.resume() -> promise`. Lets the browser play sound: call it from a key press or a click (the mixer's `resume`).
// __nirnroot_end__
export function resume(...args) {
  return target.resume(...args);
}
