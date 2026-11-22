# mixer: edge test `sounds`

Plain `node:test` tests in Node: no browser is needed, because the
mixer is given its `context` and `fetch`. Write a fake context that
records what is done to it: `createGain()` answering a node `{gain:
{value, setValueAtTime(v, t), linearRampToValueAtTime(v, t)}, connect(n)}`
(the value set by `value =` and by `setValueAtTime`), recording each
call; `createBufferSource()` answering `{buffer, loop, connect(n),
start(), stop(t)}`, recording each; `decodeAudioData(ab)` answering a
promise of a decoded-buffer object that says which file it came from
(have the fake `fetch` answer, for a URL, `{ok: true, arrayBuffer: () =>
Promise.resolve({url})}`, and `decodeAudioData` answer `{from: ab.url}`);
`destination`; a settable `currentTime` and `state`; `resume()`. Follow
connections to find a source's gain node and the master. Await the
promises the mixer answers, and settle pending microtasks before
checking music that is still decoding.

The edge under test:

- [eed:mixer](../EED.md)

# API Shapes:
- [shape:cue](../../../shapes/cue.md)

# Intrinsics:
## Intrinsic - loads:
As the EED states.

## Intrinsic - plays:
As the EED states.

## Intrinsic - mutes:
As the EED states.

## Intrinsic - music:
As the EED states.

## Intrinsic - resumes:
As the EED states.

## Intrinsic - cue/valid:
As the shape states.
