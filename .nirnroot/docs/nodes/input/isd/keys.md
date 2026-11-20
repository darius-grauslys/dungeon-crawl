# input: `keys`

A frozen map from key to intent, built once from the table with
`intent`'s constructors. `listen` keeps the handler function so `stop` can
remove exactly it. A missing modifier property counts as false.

This Node's edge:

- [eed:input](../EED.md)

# API Shapes:
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
`keydown` events from the target given to `listen`.

# Outbound Side-Effects:
`preventDefault` on the events it maps; the `onIntent` calls.
