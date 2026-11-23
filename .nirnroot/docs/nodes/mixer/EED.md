# mixer

Plays the game's sounds and music through the Web Audio API: it loads
the sound files, plays a sound when asked, loops one music track at a
time with a crossfade, and holds the volume and the mute. Runs in a
browser.

**The sounds.** Each cue name has its files, under the asset area:

| name | files |
|---|---|
| `step` | `sfx/step-1.mp3`, `sfx/step-2.mp3`, `sfx/step-3.mp3`, `sfx/step-4.mp3` |
| `swing` | `sfx/swing.mp3` |
| `shot` | `sfx/shot.mp3` |
| `hit` | `sfx/hit.mp3` |
| `death` | `sfx/death.mp3` |
| `coin` | `sfx/coin.mp3` |
| `powerup` | `sfx/powerup.mp3` |
| `use` | `sfx/use.mp3` |
| `stairs` | `sfx/stairs.mp3` |
| `hiss` | `sfx/hiss.mp3` |
| `boom` | `sfx/boom.mp3` |

Fourteen files in all. A sound of several files plays one of them, picked
each time: file `Math.floor(random() * n)` of its `n`.

**The music.** Tracks 1 to 5 are `music/dungeon-1.mp3` to
`music/dungeon-5.mp3`; track 0 is silence. One track loops at a time.

**The graph.** Every sound plays through its own gain node (its cue's
`gain`) into the **effects bus** (a gain of 1); the music through its own
gain node into the **music bus** (a gain of 0.4); both buses into the
**master** gain, whose value is the volume (0 while muted), into the
context's `destination`. The buses and the master are made once, by
`create`.

# API Shapes:
- [shape:cue](../../shapes/cue.md)

# Functions:
## Function - create:
`create(options) -> mixer`. `options`: `context`, an `AudioContext` (or anything with the same methods: `createGain()`, `createBufferSource()`, `decodeAudioData(arrayBuffer)` answering a promise, `destination`, `currentTime`, `state`, `resume()`); `fetch` (left out: the global `fetch`); `base`, a URL prefix ending in `/` (left out: `'/assets/'`); `random` (left out: `Math.random`). A missing `context` throws a `TypeError`. Answers a mixer, with the functions below; its volume 0.7, not muted, no music.

## Function - load:
`mixer.load() -> promise`. Fetches the fourteen sound files (`base` plus each path), and decodes each (`response.arrayBuffer()`, then `context.decodeAudioData`). Resolves, with nothing, once all fourteen are decoded; rejects, with an `Error` whose message holds the file's path, as soon as one fails (a response not `ok` fails). A sound plays only once its files are decoded.

## Function - play:
`mixer.play(cue)`. `cue` a `cue` (anything else throws a `TypeError`). Muted, or its files not decoded: nothing. Otherwise a buffer source of one of its files (above), through a new gain node of value `cue.gain` into the effects bus, started at once (`start()`).

## Function - music:
`mixer.music(track)`. `track` an integer from 0 to 5 (anything else throws a `TypeError`). The track playing already: nothing. Otherwise the track playing (if any) fades out: its gain ramps linearly to 0 over 1.5 seconds from `currentTime` (`linearRampToValueAtTime(0, currentTime + 1.5)`) and its source is stopped then (`stop(currentTime + 1.5)`). Then, for a track above 0: its file is fetched and decoded (once: a track played before is kept decoded), and a source of it, `loop` true, starts through a new gain node that ramps linearly from 0 to 1 over 1.5 seconds (`setValueAtTime(0, currentTime)`, then `linearRampToValueAtTime(1, currentTime + 1.5)`), into the music bus; if the track asked for has changed again before its file is decoded, it does not start. A track that fails to load is logged (`console.error`) and the music stays silent. Muting does not stop the music: the master is silent.

## Function - volume:
`mixer.setVolume(v)`: `v` a number from 0 to 1 (anything else throws a `TypeError`): the volume; the master's gain becomes `v` unless muted. `mixer.volume()`: the volume.

## Function - mute:
`mixer.setMuted(m)`: `m` a boolean (anything else throws a `TypeError`): muted or not; the master's gain becomes 0, or the volume. `mixer.muted()`: whether muted.

## Function - resume:
`mixer.resume() -> promise`. Browsers start an `AudioContext` suspended until the player has pressed a key or clicked: with the context's `state` `'suspended'`, `context.resume()`; otherwise nothing. Resolves once done.

# Intrinsics:
## Intrinsic - loads:
With a fake context and a fake `fetch` (answering `{ok: true, arrayBuffer()}` and recording the URLs): `create({context, fetch}).load()` resolves after `fetch` was called with each of the fourteen URLs `'/assets/sfx/...'` of the table, and `decodeAudioData` 14 times. With `base` `'/x/'`, the URLs begin `/x/sfx/`. A `fetch` answering `{ok: false}` for `sfx/coin.mp3`: `load()` rejects with an `Error` whose message contains `sfx/coin.mp3`. `create({})` throws a `TypeError`.

## Intrinsic - plays:
After `load()`, with `random` answering 0.6: `play(cue.of({name: 'step', gain: 0.5}))` creates one buffer source whose `buffer` is the decoded `sfx/step-3.mp3`, connected to a gain node of value 0.5, and calls its `start` once. `play` of `swing` uses `sfx/swing.mp3`. Before `load()` resolves, `play` starts nothing. `play({name: 'step', gain: 1})` (a plain object) throws a `TypeError`.

## Intrinsic - mutes:
After `load()`: the master's gain is 0.7; `setMuted(true)`: it is 0, `muted()` is true, and `play` of any cue starts nothing; `setMuted(false)`: 0.7 again. `setVolume(0.3)`: 0.3, `volume()` 0.3; while muted, `setVolume(0.5)` leaves the master at 0, and unmuting makes it 0.5. `setVolume(1.5)`, `setVolume('1')` and `setMuted(1)` throw a `TypeError`.

## Intrinsic - music:
With the fake context's `currentTime` 10: `music(2)` fetches `/assets/music/dungeon-2.mp3` and, once it is decoded, starts a source with `loop` true whose gain node got `setValueAtTime(0, 10)` and `linearRampToValueAtTime(1, 11.5)`. `music(2)` again: no fetch, no new source. `music(3)`: the track 2 gain node gets `linearRampToValueAtTime(0, 11.5)`, its source `stop(11.5)`, and a track 3 source starts. `music(2)` once more: no new fetch (track 2 is kept decoded). `music(0)`: the playing track fades out and nothing starts. `music(6)` and `music(1.5)` throw a `TypeError`.

## Intrinsic - resumes:
With the fake context's `state` `'suspended'`, `resume()` calls `context.resume()` once; with `'running'`, not at all.
