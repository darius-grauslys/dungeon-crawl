# audio

The game's sound: each time a new world arrives it plays the sounds the
change makes (`cues`), and it keeps the music of the floor's theme
playing (`mixer`); it holds the volume and the mute. Runs in a browser.

**The music.** A world whose `state` is not `playing` plays track 0
(silence). Otherwise, for its depth `d`, the first that applies:
- a shop (`level.kind(d)` `'interior'`): track 8 (the shop's tune);
- a lair with a boss (`level.kind(d)` `'boss'` and `level.round(d)` 1
  to 3: the golem's, the serpent's, the reaper's): track 9 (the boss
  tune, for every boss);
- a dungeon floor whose `level.stage(d)` is 2: track 6 (dark comical);
  whose stage is 4: track 7 (desert dungeon): two tunes that vary the
  zones' own, on the second and fourth level of every zone;
- otherwise (stages 1, 3 and 5, and the last lair, an empty hall):
  track `level.tier(d) + 1` (the zone's own tune, 1 to 5).

**Without sound.** In a page with no Web Audio (no `AudioContext`), and
when `create` is given `context: null`, every function below does
nothing (and `load` and `resume` resolve at once); `volume()` still
answers the volume and `muted()` the mute.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:level](../../shapes/level.md)

# Functions:
## Function - create:
`create(options) -> audio`. `options` (left out: `{}`): `context` (left out: a new `AudioContext` of the page, `window.AudioContext` or `window.webkitAudioContext`, or none; `null`: none); `fetch` and `base`, handed to the mixer. Answers an audio with the functions below: volume 0.7, not muted.

## Function - load:
`audio.load() -> promise`. Loads the sounds (the mixer's `load`). Resolves once they are in; on a failure it logs the error (`console.error`) and resolves all the same (the game plays on, silent where a sound is missing).

## Function - update:
`audio.update(prev, next, me)`. `prev` the world before (or `null`), `next` the new one (a `world`), `me` the player's name. Plays every cue of `cues.cues(prev, next, me)`, in order, and sets the music to `next`'s track (above). Anything else throws a `TypeError`.

## Function - volume:
`audio.louder()` and `audio.quieter()`: the volume 0.1 more or less (rounded to a tenth, kept from 0 to 1); each answers the new volume. `audio.volume()`: the volume.

## Function - mute:
`audio.toggleMute()`: muted becomes not muted and the other way; answers whether it is now muted. `audio.muted()`: whether muted.

## Function - resume:
`audio.resume() -> promise`. Lets the browser play sound: call it from a key press or a click (the mixer's `resume`).

# Intrinsics:
## Intrinsic - plays:
With a fake context and `fetch` (as the mixer's edge test makes them) and `load()` resolved: `update(prev, next, 'Ann')` with Ann stepping from (1, 1) to (2, 1) (`last` a `move` in `next`) starts one buffer source of a `sfx/step-*.mp3` file. `update(null, next, 'Ann')` starts no sound source.

## Intrinsic - music:
`update(null, w, 'Ann')` with `w` at depth 1 fetches `music/dungeon-1.mp3` and starts it looping; then a world at depth 8 starts `music/dungeon-2.mp3`, and one at depth 33 `music/dungeon-5.mp3`; depth 2 starts `music/dark-comical.mp3`, depth 4 `music/desert-dungeon.mp3`, depth 11 (stage 4) `music/desert-dungeon.mp3`, depth 6 and depth 27 (shops) `music/shop.mp3`, depths 7, 14 and 21 (the bosses' lairs) `music/boss.mp3`, and depth 28 (the empty lair) `music/dungeon-4.mp3`; a world of depth 33 whose `state` is `won` fades the music out and starts none.

## Intrinsic - controls:
`volume()` is 0.7; `louder()` answers 0.8, then 0.9, 1, 1; `quieter()` from 0.2 answers 0.1, then 0, 0. `toggleMute()` answers true, `muted()` true, and `update` of a stepping world starts no sound; `toggleMute()` again answers false.

## Intrinsic - silent:
`a = create({context: null})`: `a.load()` and `a.resume()` resolve; `a.update(prev, next, 'Ann')` doesn't throw; `a.louder()` answers 0.8 and `a.toggleMute()` true. `a.update({}, next, 'Ann')` throws a `TypeError`.
