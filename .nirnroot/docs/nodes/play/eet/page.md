# play: edge test `page`

Browser tests (`*.browser.test.mjs`). The page holds one 800 by 600
canvas; its asset area is served under `/assets/`. Dispatch key presses as
`document.dispatchEvent(new KeyboardEvent('keydown', {key: 'z',
cancelable: true}))`. Call `stop()` on every handle a test made before
the test ends, so that tests don't drive each other's games. Compare
fields of the world (`seed`, `turn`, `depth`, `state`), never whole
worlds.

The edge under test:

- [eed:play](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)

# Intrinsics:
## Intrinsic - starts:
As the EED states.

## Intrinsic - keys-play:
As the EED states.

## Intrinsic - creates-canvas:
As the EED states.

## Intrinsic - world/valid:
As the shape states, building the world with the shape's `of` and the shapes it names.
