# input: `keys`

Constant tables (a `Map` from key to direction, one from key to the
other intents, and one from key to command), and the intent built with
`intent`'s constructors at each call. `listen` keeps, per listener, the
latest held orthogonal key of each axis (horizontal and vertical) and its
direction: a `keydown` of an orthogonal direction key records it on its
axis; a `keyup` of the key recorded on an axis clears that axis; `blur`
clears both. A direction key's direction is summed with the held key of
the other axis, if any (never for a diagonal key). `listen` keeps the
handlers it added so that `stop` removes exactly them.

This Node's edge:

- [eed:input](../EED.md)

# API Shapes:
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
`keydown`, `keyup` and `blur` events on the target.

# Outbound Side-Effects:
`preventDefault` on the events it handles; the callbacks it is given.
