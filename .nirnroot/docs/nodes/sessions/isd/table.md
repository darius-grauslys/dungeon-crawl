# sessions: `table`

A closure (or a class instance) per `table` call: a `Map` from session id
to `{paused, activity, members}` in creation order (a `Map`
keeps it), `members` an array of `{connection, name}`, and a `Map` from
connection to its session id. Ids from `random` as the EED says; an id that a session of the table has already is drawn again. Every
answer is a fresh object or array: changing one changes nothing in the
table.

This Node's edge:

- [eed:sessions](../EED.md)

# API Shapes:
None

# Inbound Side-Effects:
None: it reads only its arguments and its `random`.

# Outbound Side-Effects:
None: its state is its own.
