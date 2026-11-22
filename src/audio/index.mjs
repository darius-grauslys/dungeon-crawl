// audio: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `create(options) -> audio`. `options` (left out: `{}`): `context` (left out: a new `AudioContext` of the page, `window.AudioContext` or `window.webkitAudioContext`, or none; `null`: none); `fetch` and `base`, handed to the mixer. Answers an audio with the functions below: volume 0.7, not muted. */
export function create(...args) {
  throw new Error("not implemented: audio.create");
}

/** `audio.load() -> promise`. Loads the sounds (the mixer's `load`). Resolves once they are in; on a failure it logs the error (`console.error`) and resolves all the same (the game plays on, silent where a sound is missing). */
export function load(...args) {
  throw new Error("not implemented: audio.load");
}

/** `audio.update(prev, next, me)`. `prev` the world before (or `null`), `next` the new one (a `world`), `me` the player's name. Plays every cue of `cues.cues(prev, next, me)`, in order, and sets the music to `next`'s track (above). Anything else throws a `TypeError`. */
export function update(...args) {
  throw new Error("not implemented: audio.update");
}

/** `audio.louder()` and `audio.quieter()`: the volume 0.1 more or less (rounded to a tenth, kept from 0 to 1); each answers the new volume. `audio.volume()`: the volume. */
export function volume(...args) {
  throw new Error("not implemented: audio.volume");
}

/** `audio.toggleMute()`: muted becomes not muted and the other way; answers whether it is now muted. `audio.muted()`: whether muted. */
export function mute(...args) {
  throw new Error("not implemented: audio.mute");
}

/** `audio.resume() -> promise`. Lets the browser play sound: call it from a key press or a click (the mixer's `resume`). */
export function resume(...args) {
  throw new Error("not implemented: audio.resume");
}
