# message

The protocol: every text that crosses the WebSocket between a page and
the server, in both directions. One shape: the page builds the upward
kinds and reads the downward ones; the server the other way round. One
constructor per kind, `text()` to send, `parse(text)` to receive, which
refuses anything that is not exactly one of the kinds below with its
fields. The encoding is JSON: `{kind, ...fields}`, the fields under the
keys named below.

**Upward** (page to server). A page never names a position, a world or
another player: it says which session it joins as whom, and what its
player wants to do.

| kind | constructor | fields |
|---|---|---|
| `create` | `create(save)` | `save`: a `save` (sent as its `data()`) or `null`: make a session, from that save or new |
| `join` | `join(session, password, name)` | `session`, `password`: strings of 1 to 32 characters; `name`: a name (`save`'s `isName`) |
| `act` | `act(intent)` | `intent`: an `intent` (sent as `{kind, dx, dy}`) |
| `pause` | `pause(paused)` | `paused`: a boolean |
| `save` | `requestSave()` | none: ask for the session's save |

**Downward** (server to page).

| kind | constructor | fields |
|---|---|---|
| `created` | `created(session, password)` | the new session's id and password |
| `joined` | `joined(session, name)` | the session joined, and the name played |
| `refused` | `refused(reason)` | `reason`: one of `full`, `no-session`, `bad-password`, `name-taken`, `party-full`, `not-joined`, `malformed` |
| `state` | `state(world, paused)` | `world`: a `world` (sent as its `data()`); `paused`: a boolean |
| `saved` | `saved(save)` | `save`: a `save` (sent as its `data()`) |

A constructor given anything else throws a `TypeError`.

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

## Field - password:
Property `password` (`join`, `created`).

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
`refused('nope')`, `join('', 'x', 'Ann')`, `join('ABCDEF', 'x', '')`,
`act({kind: 'move', dx: 1, dy: 0})` (a plain object), `pause('yes')` and
`create({})` throw a `TypeError`. `parse` of `'nope'`, `'{}'`,
`'{"kind":"fly"}'` and `'{"kind":"pause"}'` (its field missing) throws a
`TypeError`.

## Intrinsic - round-trip:
For one message of each of the ten kinds (a `state` holding a small world
with one hero, a `create` and a `saved` holding a save of one player, a
`create(null)`), `parse(m.text())` passes `assert.deepStrictEqual` with
`m`.

# Callbacks:
None

# API Shapes:
- [shape:save](save.md)
- [shape:intent](intent.md)
- [shape:world](world.md)
