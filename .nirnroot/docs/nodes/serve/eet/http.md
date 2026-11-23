# serve: edge test `http`

Plain `node:test` tests in Node: `serve({port: 0, root: process.cwd()})`
(tests run from the project's root), requests with `fetch` or
`node:http`, WebSocket clients with Node's global `WebSocket` at
`ws://127.0.0.1:<port>/ws`, and `close()` at the end of each test. The
asset's bytes come from `node:fs` reading the file listed below. `drain`
and `closed` are polled: wait up to a second for what a step expects.

The edge under test:

- [eed:serve](../EED.md)

# API Shapes:
None

# Assets:
- [asset:sheets/heroes.png](../../../../../assets/sheets/heroes.png)
- [asset:sfx/coin.mp3](../../../../../assets/sfx/coin.mp3)

# Intrinsics:
## Intrinsic - page:
As the EED states.

## Intrinsic - query:
As the EED states.

## Intrinsic - bundle:
As the EED states.

## Intrinsic - assets:
As the EED states.

## Intrinsic - not-found:
As the EED states.

## Intrinsic - connections:
As the EED states.

## Intrinsic - closed:
As the EED states.

## Intrinsic - host:
As the EED states.

## Intrinsic - closes:
As the EED states.
