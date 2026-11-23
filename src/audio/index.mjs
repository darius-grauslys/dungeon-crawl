// audio: a Node, the game's sound: plays cues and keeps the floor's music.

import * as level from "../../shapes/level/index.mjs";
import * as cues from "../../edges/edge_to_cues.mjs";
import * as mixer from "../../edges/edge_to_mixer.mjs";

/** `trackFor(world)`: the music track for a world (as the EED's The music says): 0 when not playing; 8 for a shop; 9 for a boss with round 1..3; 6 for a dungeon floor of stage 2, 7 of stage 4; otherwise `level.tier(world.depth) + 1`. */
export function trackFor(world) {
  if (world.state !== "playing") return 0;
  const d = world.depth;
  const k = level.kind(d);
  if (k === "interior") return 8;
  if (k === "boss" && level.round(d) >= 1 && level.round(d) <= 3) return 9;
  if (k === "dungeon") {
    const s = level.stage(d);
    if (s === 2) return 6;
    if (s === 4) return 7;
  }
  return level.tier(d) + 1;
}

/** `create(options) -> audio`. `options` (left out: `{}`): `context` (left out: a new `AudioContext` of the page, `window.AudioContext` or `window.webkitAudioContext`, or none; `null`: none); `fetch` and `base`, handed to the mixer. Answers an audio with the functions below: volume 0.7, not muted. */
export function create(options = {}) {
  let context;
  if (options.context === undefined) {
    context = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)
      ? new (window.AudioContext || window.webkitAudioContext)()
      : null;
  } else {
    context = options.context;
  }
  const fetch = options.fetch;
  const base = options.base;

  let volume = 0.7;
  let muted = false;

  let mixerInstance = null;
  if (context) {
    mixerInstance = mixer.create({ context, fetch, base });
    mixerInstance.setVolume(volume);
  }

  const audio = {
    load() {
      if (!mixerInstance) return Promise.resolve();
      return mixerInstance.load().catch((err) => {
        console.error(err);
      });
    },

    update(prev, next, me) {
      const isWorld = (w) => w && typeof w === "object" && typeof w.depth === "number" && Number.isInteger(w.depth) && w.depth >= 1 && w.depth <= 33 && typeof w.state === "string" && (w.state === "playing" || w.state === "won");
      if (prev !== null && !isWorld(prev)) throw new TypeError("audio.update: prev must be a world or null");
      if (!isWorld(next)) throw new TypeError("audio.update: next must be a world");
      if (typeof me !== "string") throw new TypeError("audio.update: me must be a string");

      if (!mixerInstance) return;

      const cs = cues.cues(prev, next, me);
      for (const c of cs) mixerInstance.play(c);

      const track = trackFor(next);
      mixerInstance.music(track);
    },

    louder() {
      volume = Math.min(1, Math.round((volume + 0.1) * 10) / 10);
      if (mixerInstance) mixerInstance.setVolume(volume);
      return volume;
    },

    quieter() {
      volume = Math.max(0, Math.round((volume - 0.1) * 10) / 10);
      if (mixerInstance) mixerInstance.setVolume(volume);
      return volume;
    },

    volume() {
      return volume;
    },

    toggleMute() {
      muted = !muted;
      if (mixerInstance) mixerInstance.setMuted(muted);
      return muted;
    },

    muted() {
      return muted;
    },

    resume() {
      if (!mixerInstance) return Promise.resolve();
      return mixerInstance.resume();
    }
  };

  return audio;
}

/** `audio.load() -> promise`. Loads the sounds (the mixer's `load`). Resolves once they are in; on a failure it logs the error (`console.error`) and resolves all the same (the game plays on, silent where a sound is missing). */
export function load(audio) {
  return audio.load();
}

/** `audio.update(prev, next, me)`. `prev` the world before (or `null`), `next` the new one (a `world`), `me` the player's name. Plays every cue of `cues.cues(prev, next, me)`, in order, and sets the music to `next`'s track (above). Anything else throws a `TypeError`. */
export function update(audio, prev, next, me) {
  return audio.update(prev, next, me);
}

/** `audio.louder()` and `audio.quieter()`: the volume 0.1 more or less (rounded to a tenth, kept from 0 to 1); each answers the new volume. `audio.volume()`: the volume. */
export function volume(audio) {
  return {
    louder: () => audio.louder(),
    quieter: () => audio.quieter(),
    get: () => audio.volume(),
  };
}

/** `audio.toggleMute()`: muted becomes not muted and the other way; answers whether it is now muted. `audio.muted()`: whether muted. */
export function mute(audio) {
  return {
    toggle: () => audio.toggleMute(),
    get: () => audio.muted(),
  };
}

/** `audio.resume() -> promise`. Lets the browser play sound: call it from a key press or a click (the mixer's `resume`). */
export function resume(audio) {
  return audio.resume();
}
