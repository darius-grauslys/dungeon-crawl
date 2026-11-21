# server: edge test `loop`

Plain `node:test` tests in Node. `start({port: 0, root: process.cwd()})`
(tests run from the project's root; `idle` as the intrinsic says), and
`close()` at the end of each test, after closing every client. Talk to
it with Node's global `WebSocket` at `ws://127.0.0.1:<port>/ws`: send
`m.text()` for messages built with `message`'s constructors, and read
every `onmessage` with `message`'s `parse`. Wait for a message with a
timeout (a second unless the intrinsic says otherwise): skip the ones a
step doesn't ask for (a `state` arrives every 50 milliseconds while a
session plays). Find Ann's hero in a world by `name`.

The edge under test:

- [eed:server](../EED.md)

# API Shapes:
- [shape:message](../../../shapes/message.md)
- [shape:world](../../../shapes/world.md)
- [shape:save](../../../shapes/save.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)

# Intrinsics:
## Intrinsic - page:
As the EED states.

## Intrinsic - create-join:
As the EED states.

## Intrinsic - refusals:
As the EED states.

## Intrinsic - at-most-four:
As the EED states.

## Intrinsic - party:
As the EED states.

## Intrinsic - acts:
As the EED states: read the grid (`at`) and the monsters from the `state`'s world to pick the direction; if none of the four is free, wait for a few states and try again.

## Intrinsic - pause:
As the EED states.

## Intrinsic - save-load:
As the EED states.

## Intrinsic - idle:
As the EED states.

## Intrinsic - closes:
As the EED states.
