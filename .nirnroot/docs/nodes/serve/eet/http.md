# serve: edge test `http`

Plain `node:test` tests in Node: `serve({port: 0, root: process.cwd()})`
(tests run from the project's root), requests with `fetch` or
`node:http`, and `close()` at the end of each test. The asset's bytes
come from `node:fs` reading the file listed below.

The edge under test:

- [eed:serve](../EED.md)

# API Shapes:
None

# Assets:
- [asset:sheets/heroes.png](../../../../../assets/sheets/heroes.png)

# Intrinsics:
## Intrinsic - page:
As the EED states.

## Intrinsic - bundle:
As the EED states.

## Intrinsic - assets:
As the EED states.

## Intrinsic - not-found:
As the EED states.

## Intrinsic - closes:
As the EED states.
