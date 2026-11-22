# play: edge test `page`

Browser tests (`*.browser.test.mjs`). The page holds one 800 by 600
canvas; its asset area is served under `/assets/`. No server: give
`start` a fake socket factory, `open(url)`, that records the url and
answers an object with `send(text)` (recording the texts), `close()`,
and the `onopen`, `onmessage`, `onclose`, `onerror` properties `net`
sets; the test calls `socket.onopen()` to open it and
`socket.onmessage({data: m.text()})` to deliver a message built with
`message`'s constructors. Give `download` a recording function, and `audioContext: null` (no sound in the tests). Build
worlds with `world`'s `of` (a small grid, one hero `Ann`, `entry` the
save of seed 1, depth 1 and no players). Dispatch keys as
`document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape',
cancelable: true}))`; click with `element.click()`. Wait for what a step
expects (the page reads the socket once a frame) up to half a second.
Call `stop()` on every handle a test made before the test ends, so that
tests don't drive each other's games. Compare texts, or fields of the
world, never whole worlds.

The edge under test:

- [eed:play](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:message](../../../shapes/message.md)
- [shape:save](../../../shapes/save.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:point](../../../shapes/point.md)

# Intrinsics:
## Intrinsic - starts:
As the EED states.

## Intrinsic - lobby:
As the EED states.

## Intrinsic - creates:
As the EED states.

## Intrinsic - refused:
As the EED states.

## Intrinsic - keys:
As the EED states.

## Intrinsic - menu:
As the EED states.

## Intrinsic - creates-canvas:
As the EED states.

## Intrinsic - world/valid:
As the shape states, building the world with the shape's `of` and the shapes it names.

## Intrinsic - world/data:
As the shape states.

## Intrinsic - message/valid:
As the shape states.

## Intrinsic - message/round-trip:
As the shape states.
