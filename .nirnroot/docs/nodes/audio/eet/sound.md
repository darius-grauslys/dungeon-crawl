# audio: edge test `sound`

Plain `node:test` tests in Node. Give `create` a fake `context` and a
fake `fetch` (audio's mixer drives them through the Web Audio API).
The fake context records what is done to it:
- `createGain()` answers a node `{gain: {value, setValueAtTime(v, t),
  linearRampToValueAtTime(v, t)}, connect(n)}`: the level is
  `node.gain.value`, never `node.value`, and is set both by `value =`
  and by `setValueAtTime`; it records each call;
- `createBufferSource()` answers `{buffer, loop, connect(n), start(),
  stop(t)}`, and records each one;
- `decodeAudioData(ab)` answers a promise of `{from: ab.url}`;
- it has a `destination`, a settable `currentTime` and `state`, and
  `resume()`.

The fake `fetch` records each URL and answers `{ok: true, arrayBuffer: ()
=> Promise.resolve({url})}`, so a started source's `buffer.from` names
its file (`sfx/step-2.mp3`, `music/dungeon-1.mp3`, with `base` `''`).
Build worlds with `world`'s `of` on a small grid with every cell
`visible` (Ann at (1, 1)), and the stepped world with `with`. Await
`load()`, and settle pending microtasks before checking music still
decoding.

The edge under test:

- [eed:audio](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:level](../../../shapes/level.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:point](../../../shapes/point.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:save](../../../shapes/save.md)

# Intrinsics:
## Intrinsic - plays:
As the EED states.

## Intrinsic - music:
As the EED states.

## Intrinsic - controls:
As the EED states.

## Intrinsic - silent:
As the EED states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - world/data:
As the shape states.

## Intrinsic - level/valid:
As the shape states.
