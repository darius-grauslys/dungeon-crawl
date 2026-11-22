# server

The authority. It starts `serve` (the page, the bundle, the assets and the
WebSocket), keeps the table of `sessions` and one `world` per session, and
runs the loop: every 50 milliseconds it reads what the pages sent, answers
it, advances every session that isn't paused by 50 milliseconds of game
time with `rules`, sends every player of a session the session's world,
and deletes the sessions that have been idle too long. Runs in Node. The
protocol is the `message` shape, which its ISD names; its edge is the
start and stop of all of it.

How a page plays, as the server answers it:

0. It sends `list()` (any time, joined or not) and gets `lobby(sessions)`:
   every session the server holds, in the order they were made, each
   `{session, players, depth}`: its id, the names of the connections in
   it now (in the order they joined), and its world's depth. Sessions
   have no password.
1. It sends `create(save)` (a save, or `null` for a new game) and gets
   `created(session)`, or `refused('full')` when the server
   already holds 4 sessions. A new game's seed is random; a save's game
   starts on the save's floor with the save's party.
2. It sends `join(session, name)` and gets `joined(session,
   name)` and then the session's `state`; or `refused` with
   `no-session`, `name-taken` (a name already played by
   another open connection in that session), `full` (4 connections are in
   the session already) or `party-full` (the name is none of the
   session's heroes and the party has 4). A name that is a hero of the
   session's world (as after a load) plays that hero; a new name joins
   the party as a new hero. One connection plays one name; a `join` on a
   connection that has one leaves it first.
3. While joined: `act(intent)` asks for its hero's next action (the last
   one asked before the hero is ready is the one that fires);
   `pause(paused)` pauses or resumes the session for all its players;
   `requestSave()` is answered `saved(save)`, the session's save as it
   stands. Any of these from a connection that hasn't joined is
   `refused('not-joined')`.
4. After every iteration, each joined connection whose session's world or
   pause changed since it was last sent one gets `state(world, paused)`.

A text that isn't an upward `message` is answered `refused('malformed')`
and the connection stays open. A session is deleted, its world with it,
once no player has done anything in it (a `create`, a `join`, an `act`, a
`pause`, a `save`; a `list` is none of these) for `idle` milliseconds; its connections stay open and
are no longer joined. A connection that closes leaves its session; its
hero stays in the world.

# API Shapes:
None

# Functions:
## Function - start:
`start({port, root, idle, host}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory; `idle` the milliseconds a session may go without activity (left out: 1800000, thirty minutes); `host` (left out: none) the address to listen on, handed to `serve` as it is. Starts `serve` on that port, root and host, then the loop. Resolves to `{port, url, close}`: `serve`'s port and url, and `close()`, answering a promise that resolves once the loop and the server have stopped. Rejects as `serve` does.

# Intrinsics:
## Intrinsic - page:
`GET /` on the url answers 200 with a `text/html` content type.

## Intrinsic - create-join:
A WebSocket client at `ws://127.0.0.1:<port>/ws` sends `create(null)` and gets `created(session)`, `session` six characters of `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. It sends `join(session, 'Ann')` and gets `joined(session, 'Ann')`, then, within a second, a `state` whose world is at depth 1, state `playing`, with one hero `Ann` alive at 24 of 24 hit points, and `paused` false.

## Intrinsic - refusals:
`join` with a session no one made gets `refused('no-session')`; `act(wait())` from a connection that hasn't joined, `refused('not-joined')`; the text `nonsense`, `refused('malformed')`, and the connection is still open (a `create(null)` on it after is answered `created`).

## Intrinsic - lobby:
On a fresh server, `list()` is answered `lobby([])`. After one client's `create(null)` (answered `created(a)`) and `join(a, 'Ann')`, and another's `create(null)` (answered `created(b)`) with no join, a third client's `list()` (it has joined nothing) is answered `lobby` with two entries: `{session: a, players: ['Ann'], depth: 1}` then `{session: b, players: [], depth: 1}`. Once a second client has joined `a` as `Bob`, `list()` gives `a`'s `players` `['Ann', 'Bob']`; once Ann's connection has closed, `['Bob']`.

## Intrinsic - at-most-four:
Four `create(null)` are each answered `created`; a fifth, `refused('full')`.

## Intrinsic - party:
With `Ann` joined, a second connection joining the same session as `Bob` gets `joined`, and both connections then get `state`s whose world has the heroes `Ann` and `Bob`. A third joining as `Ann` while Ann's connection is open gets `refused('name-taken')`; once Ann's connection has closed, a join as `Ann` is `joined` and plays the same hero.

## Intrinsic - acts:
With `Ann` joined and a `state` in hand, `act(move(dx, dy))` toward a neighbouring cell of Ann's that is `floor` and holds no monster: within a second a `state` arrives with Ann on that cell.

## Intrinsic - pause:
`pause(true)` is followed by a `state` with `paused` true; over the next 300 milliseconds no `state` arrives whose world's `time` differs from that one's. `pause(false)` is followed by `state`s with `paused` false and a growing `time`.

## Intrinsic - save-load:
With `Ann` joined, `requestSave()` is answered `saved(s)`: `s.depth` 1 and `s.players` one entry, `Ann` with stats of `hp` 24, `maxHp` 24, `attack` 4, `defense` 1, `range` 1, `magic` 0, `magicPower` 1 and `magicResist` 0. `create(save.of({seed: 9, depth: 3, players: [{name: 'Cy', stats: {hp: 10, maxHp: 30, attack: 6, defense: 2}}]}))` (the stats a `stats`), then a `join` as `Cy`: the `state`'s world is at depth 3 with the one hero `Cy` of those stats, alive.

## Intrinsic - idle:
With `start({port: 0, root, idle: 300})`: a session made and then left alone for 600 milliseconds is gone: a `join` to it gets `refused('no-session')`, and four more `create(null)` are all answered `created`.

## Intrinsic - host:
`start({port: 0, root, host: '0.0.0.0'})` resolves with a `url` beginning `http://0.0.0.0:`; without `host`, one beginning `http://127.0.0.1:`. Close each.

## Intrinsic - closes:
After `close()` resolves, a request to the port fails to connect.
