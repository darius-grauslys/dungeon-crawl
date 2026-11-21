// The call site for sessions: forwards to its surface, nothing else.
// sessions's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/sessions/index.mjs";

// __nirnroot_begin__ table
// `table({random, idle}) -> table`. A fresh, empty table of sessions, independent of any other. `random` a function answering a number in [0, 1) (left out: `Math.random`); `idle` the milliseconds a session may go without activity (left out: 1800000). The table's methods (every `now` an integer of milliseconds, as `Date.now()`; a session id or a connection the table doesn't know is never an error but as said):
//
// - `create(now) -> {session, password} | null`: a new session, not paused, its activity `now`, with an id no session of the table has now; `null` when the table holds 4.
// - `join(connection, session, password, name, now) -> reason | null`: `connection` any integer, `name` a string. The first that applies: `no-session` (no such session), `bad-password`, `name-taken` (another connection plays that name in that session), `full` (4 other connections are in that session). Otherwise the connection leaves whatever it played before, plays `name` in `session`, the session's activity is `now`, and the answer is `null`.
// - `leave(connection) -> session | null`: the connection plays nothing any more; answers the session it was in, `null` if none.
// - `member(connection) -> {session, name} | null`.
// - `members(session) -> array`: `[{connection, name}]`, in the order they joined; empty for an unknown session.
// - `touch(session, now)`: the session's activity is `now`.
// - `setPaused(session, paused)`; `paused(session) -> boolean` (false for an unknown session).
// - `expire(now) -> array`: removes every session whose activity is `idle` milliseconds or more before `now`, with its members; answers their ids.
// - `ids() -> array`: the sessions' ids, in the order they were created.
// __nirnroot_end__
export function table(...args) {
  return target.table(...args);
}
