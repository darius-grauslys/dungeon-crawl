# input: edge test `keys`

Plain `node:test` tests in Node. Node has `EventTarget` and `Event` but no
`KeyboardEvent`: make the events with `new Event('keydown', {cancelable:
true})` and give them the properties they need with
`Object.defineProperty(event, 'key', {value: 'w'})` (and `shiftKey`,
`ctrlKey` the same way). The code under test reads only `key`,
`shiftKey`, `ctrlKey`, `altKey`, `metaKey` and calls `preventDefault`.

The edge under test:

- [eed:input](../EED.md)

# API Shapes:
- [shape:intent](../../../shapes/intent.md)

# Intrinsics:
## Intrinsic - keys:
As the EED states.

## Intrinsic - listens:
As the EED states.

## Intrinsic - chords:
As the EED states: a `blur` is `new Event('blur')`.

## Intrinsic - intent/valid:
As the shape states.
