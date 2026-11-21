// The call site for net: forwards to its surface, nothing else.
// net's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/net/index.mjs";

// __nirnroot_begin__ connect
// `connect(url, open) -> connection`. `open(url)` answers a socket with the browser `WebSocket` surface (`send(text)`, `close()`, and the `onopen`, `onmessage`, `onclose`, `onerror` handlers, which this sets); left out, `url => new WebSocket(url)`. Calls `open(url)` once, at once. Answers a connection:
// - `send(message)`: sends `message.text()`. Before the socket's open event the texts are kept, and sent in order once it has opened; after its close event, a no-op. A `message` that isn't one throws a `TypeError`.
// - `drain() -> array`: every message received since the last `drain`, in order, each parsed with `message.parse`; a text that doesn't parse is dropped (and logged with `console.warn`).
// - `status() -> string`: `connecting` until the open event, `open` after it, `closed` after the close event (or an error event).
// - `close()`: closes the socket.
// __nirnroot_end__
export function connect(...args) {
  return target.connect(...args);
}
