# net: edge test `socket`

Plain `node:test` tests in Node: no page is needed. Give `connect` a
factory that records its url and answers a fake socket the test controls:
it records what `send` is given and what `close` calls, and the test
fires `onopen()`, `onmessage({data})` and `onclose()` itself. Build the
messages with `message`'s constructors and compare texts or kinds.

The edge under test:

- [eed:net](../EED.md)

# API Shapes:
- [shape:message](../../../shapes/message.md)
- [shape:intent](../../../shapes/intent.md)

# Intrinsics:
## Intrinsic - queues:
As the EED states.

## Intrinsic - drains:
As the EED states.

## Intrinsic - status:
As the EED states.

## Intrinsic - message/valid:
As the shape states.

## Intrinsic - message/round-trip:
As the shape states.
