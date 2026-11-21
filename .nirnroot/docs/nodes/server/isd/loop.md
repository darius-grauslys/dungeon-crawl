# server: `loop`

## `start({port, root, idle})`

`handle = serve.serve({port, root})`, awaited. `table =
sessions.table({idle})` (its default random). `worlds`: a `Map` from
session id to world; `sent`: per connection, the world and the pause last
sent to it. Then `setInterval(iterate, 50)`. Answer `{port: handle.port,
url: handle.url, close}`; `close` clears the interval, then awaits
`handle.close()`.

## `iterate`

`now = Date.now()`. In this order:

1. **Inbound.** For each `[connection, text]` of `handle.drain()`, parse
   it with `message.parse`; a parse that throws, or a message that is not
   `upward`, is `refused('malformed')`. Otherwise:
   - `create(save)`: `made = table.create(now)`; `null` is
     `refused('full')`; else `worlds.set(made.session, save ?
     rules.fromSave(save) : rules.newGame(seed))`, `seed` a random integer
     from 0 to 4294967295 (`crypto.getRandomValues` or `Math.random`), and
     send `created(made.session, made.password)`.
   - `join(session, password, name)`: `reason = table.join(connection,
     session, password, name, now)`; a reason is `refused(reason)`. Else
     `next = rules.join(worlds.get(session), name)`; `null` means
     `table.leave(connection)` and `refused('party-full')`; else store
     `next`, send `joined(session, name)`, and forget what was last sent
     to the connection (so step 4 sends it the state).
   - `act(intent)`, `pause(paused)`, `save`: `member =
     table.member(connection)`; none is `refused('not-joined')`. Else
     `table.touch(member.session, now)`, and: `act` stores
     `rules.intend(world, member.name, intent)`; `pause` is
     `table.setPaused(member.session, paused)`; `save` sends
     `saved(rules.toSave(world))`.
   Then for each connection of `handle.closed()`: `table.leave(connection)`
   and forget what was sent to it.
2. **Advance.** For each session id of `table.ids()` not
   `table.paused(id)`: `worlds.set(id, rules.advance(worlds.get(id), 50))`.
3. **Expire.** For each id of `table.expire(now)`: `worlds.delete(id)`.
4. **Send.** For each id of `table.ids()`, for each `{connection}` of
   `table.members(id)`: if the world (`!==`) or the pause differs from
   what was last sent to that connection, send `state(world, paused)` and
   remember them.

Every send is `handle.send(connection, m.text())`. An error thrown while
handling one message is caught and logged (`console.error`), and the
loop goes on; so is one thrown while advancing a session (that session's
world is left as it was).

This Node's edge:

- [eed:server](../EED.md)

Children this specification reaches:

- [eed:serve](../../serve/EED.md)
- [eed:sessions](../../sessions/EED.md)
- [eed:rules](../../rules/EED.md)

# API Shapes:
- [shape:message](../../../shapes/message.md)
- [shape:world](../../../shapes/world.md)
- [shape:save](../../../shapes/save.md)
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
The texts `serve` received; the clock (`Date.now`); a random seed for each
new game.

# Outbound Side-Effects:
Texts sent through `serve`; an interval timer until `close`;
`console.error` for errors caught in the loop.
