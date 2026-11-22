# audio: edge test `sound`

Plain `node:test` tests in Node. Give `create` a fake `context` and a
fake `fetch` as the mixer's edge test describes them: a context that
records its gain nodes and buffer sources, `decodeAudioData` answering
an object naming the file it came from, a `fetch` recording the URLs. Build worlds
with `world`'s `of` on a small grid with every cell `visible` (Ann at
(1, 1)), and the stepped world with `with`. Await `load()`, and settle
pending microtasks before checking music still decoding.

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
