# message

The protocol: every text that crosses the WebSocket between a page and
the server, in both directions. One shape: the page builds the upward
kinds and reads the downward ones; the server the other way round. One
constructor per kind, `text()` to send, `parse(text)` to receive, which
refuses anything that is not exactly one of the kinds below with its
fields. The encoding is JSON: `{kind, ...fields}`, the fields under the
keys named below.

**Upward** (page to server). A page never names a position, a world or
another player: it asks for the lobby, says which session it joins as
whom, and what its player wants to do.

| kind | constructor | fields |
|---|---|---|
| `list` | `list()` | none: ask for the lobby, the sessions there are |
| `create` | `create(save)` | `save`: a `save` (sent as its `data()`) or `null`: make a session, from that save or new |
| `join` | `join(session, name)` | `session`: a string of 1 to 32 characters; `name`: a name (`save`'s `isName`) |
| `act` | `act(intent)` | `intent`: an `intent` of any of its six kinds (sent as `{kind, dx, dy}`, and read back with the kind's constructor: `attack` with its `dx`, `dy`, `(0, 0)` included) |
| `pause` | `pause(paused)` | `paused`: a boolean |
| `save` | `requestSave()` | none: ask for the session's save |

**Downward** (server to page).

| kind | constructor | fields |
|---|---|---|
| `lobby` | `lobby(sessions)` | `sessions`: an array of 0 to 4 entries, each `{session, players, depth}`: `session` a string of 1 to 32 characters, `players` an array of 0 to 4 names (the players in it now, in the order they joined), `depth` an integer from 1 to 33 (`level`'s `MAX_DEPTH`) |
| `created` | `created(session)` | the new session's id |
| `joined` | `joined(session, name)` | the session joined, and the name played |
| `refused` | `refused(reason)` | `reason`: one of `full`, `no-session`, `name-taken`, `party-full`, `not-joined`, `malformed` |
| `state` | `state(world, paused)` | `world`: a `world` (sent as its `data()`); `paused`: a boolean |
| `saved` | `saved(save)` | `save`: a `save` (sent as its `data()`) |

Sessions have no password: anyone may join any session the lobby lists.
`lobby` copies its array and each entry (and each `players`), answering
them frozen. A constructor given anything else throws a `TypeError`.

# Fields:
## Field - kind:
Property `kind`.

## Field - upward:
Property `upward`: true for the upward kinds, false for the downward.

## Field - save:
Property `save` (`create`, `saved`): a `save`, or `null` for a `create`
of a new game.

## Field - session:
Property `session` (`join`, `created`, `joined`).

## Field - sessions:
Property `sessions` (`lobby`): a frozen array of frozen `{session,
players, depth}`.

## Field - name:
Property `name` (`join`, `joined`).

## Field - intent:
Property `intent` (`act`): an `intent`.

## Field - paused:
Property `paused` (`pause`, `state`).

## Field - reason:
Property `reason` (`refused`).

## Field - world:
Property `world` (`state`): a `world`.

## Field - text:
`text()`: the JSON text of the message. A method on the prototype.

# Intrinsics:
## Intrinsic - valid:
Each constructor answers a frozen message of its kind with its fields;
`act(move(1, 0)).upward` is true and `refused('full').upward` false.
`refused('nope')`, `refused('bad-password')`, `join('', 'Ann')`, `join('ABCDEF', '')`,
`lobby([{session: 'ABCDEF', players: ['Ann'], depth: 34}])`, `lobby` of
five entries, `created('')`,
`act({kind: 'move', dx: 1, dy: 0})` (a plain object), `pause('yes')` and
`create({})` throw a `TypeError`. `parse` of `'nope'`, `'{}'`,
`'{"kind":"fly"}'` and `'{"kind":"pause"}'` (its field missing) throws a
`TypeError`. `list().upward` is true and `lobby([]).upward` false;
`lobby([{session: 'ABCDEF', players: ['Ann', 'Bob'], depth: 3}]).sessions[0].players[1]`
is `'Bob'`, and the array, the entry and `players` are frozen.

## Intrinsic - round-trip:
For one message of each of the twelve kinds (a `lobby` of two entries
and one of none, an `act` of each of the six intent kinds, `descend()`, `face(1, -1)`, `move(-1, 1)` and `attack()` among them; a `state` holding a small world
with one hero whose actor has `held` 300, `facing` `'left'`, a `last`, `aim` `{dx: 1, dy: 1}` and `slow` 2, a `create` and a `saved` holding a save of one player, a
`create(null)`), `parse(m.text())` passes `assert.deepStrictEqual` with
`m`.

# Callbacks:
None

# API Shapes:
- [shape:save](save.md)
- [shape:intent](intent.md)
- [shape:world](world.md)
- [shape:level](level.md)
