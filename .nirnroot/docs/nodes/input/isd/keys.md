# input: `keys`

Two constant tables (a `Map` from key to direction, and one from key to
command), and the intent built with `intent`'s constructors at each call
(they are frozen, so sharing them would also do). `listen` keeps the
handler it added so that `stop` removes exactly it.

This Node's edge:

- [eed:input](../EED.md)

# API Shapes:
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
`keydown` events on the target.

# Outbound Side-Effects:
`preventDefault` on the events it handles; the callbacks it is given.
