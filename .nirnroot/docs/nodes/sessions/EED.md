# sessions

The server's sessions, without their worlds: which sessions there are
(at most 4), each one's id, which connection plays which
name in which, whether each is paused, and when each last saw a player do
something. It never talks to the wire: its parent asks and answers. Pure
but for its own state and the `random` it is given. Runs in Node.

A **session id** is six characters drawn from
`ABCDEFGHJKMNPQRSTUVWXYZ23456789` (each character
`alphabet[Math.floor(random() * alphabet.length)]`). Sessions have no
password: the lobby lists them, and anyone may join one.

# API Shapes:
None

# Functions:
## Function - table:
`table({random, idle}) -> table`. A fresh, empty table of sessions, independent of any other. `random` a function answering a number in [0, 1) (left out: `Math.random`); `idle` the milliseconds a session may go without activity (left out: 1800000). The table's methods (every `now` an integer of milliseconds, as `Date.now()`; a session id or a connection the table doesn't know is never an error but as said):

- `create(now) -> session | null`: a new session, not paused, its activity `now`, with an id no session of the table has now; `null` when the table holds 4.
- `join(connection, session, name, now) -> reason | null`: `connection` any integer, `name` a string. The first that applies: `no-session` (no such session), `name-taken` (another connection plays that name in that session), `full` (4 other connections are in that session). Otherwise the connection leaves whatever it played before, plays `name` in `session`, the session's activity is `now`, and the answer is `null`.
- `leave(connection) -> session | null`: the connection plays nothing any more; answers the session it was in, `null` if none.
- `member(connection) -> {session, name} | null`.
- `members(session) -> array`: `[{connection, name}]`, in the order they joined; empty for an unknown session.
- `touch(session, now)`: the session's activity is `now`.
- `setPaused(session, paused)`; `paused(session) -> boolean` (false for an unknown session).
- `expire(now) -> array`: removes every session whose activity is `idle` milliseconds or more before `now`, with its members; answers their ids.
- `ids() -> array`: the sessions' ids, in the order they were created.

# Intrinsics:
## Intrinsic - creates:
With `t = table({})`: `create(0)` four times answers four distinct ids of the alphabet and length above (strings), `ids()` lists them in order, and a fifth `create(0)` is `null`. With `table({random: () => 0})`, the first `create` answers `'AAAAAA'`; a second, while the first stands, an id other than `AAAAAA`.

## Intrinsic - joins:
For a session `s`: `join(1, s, 'Ann', 0)` is `null`, `member(1)` is `{session: s, name: 'Ann'}`, `members(s)` is `[{connection: 1, name: 'Ann'}]`. `join(2, 'ZZZZZZ', 'Bob', 0)` is `'no-session'`; `join(2, s, 'Ann', 0)` is `'name-taken'`. With connections 1 to 4 joined, a fifth is `'full'`. After `leave(1)` (answering `s`), `member(1)` is `null` and `join(2, s, 'Ann', 0)` is `null`. A connection joining a second session leaves the first.

## Intrinsic - pauses:
A new session is not paused; after `setPaused(s, true)` it is; after `setPaused(s, false)` it is not.

## Intrinsic - expires:
With `table({idle: 1000})`: a session made at 0 and another at 500; `expire(999)` is `[]`; `expire(1000)` is the first's id alone, which is gone from `ids()` and whose members' `member` is `null`. After `touch(second, 1200)`, `expire(1600)` is `[]` and `expire(2200)` is the second's id. A `join` counts as activity as `touch` does.
