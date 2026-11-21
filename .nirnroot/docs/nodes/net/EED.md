# net

The page's connection to the server: one WebSocket, messages out, messages
in. The socket comes from a factory its caller gives, so a page uses the
browser's `WebSocket` and a test its own. Runs in a browser (or anywhere
the factory works).

# API Shapes:
- [shape:message](../../shapes/message.md)

# Functions:
## Function - connect:
`connect(url, open) -> connection`. `open(url)` answers a socket with the browser `WebSocket` surface (`send(text)`, `close()`, and the `onopen`, `onmessage`, `onclose`, `onerror` handlers, which this sets); left out, `url => new WebSocket(url)`. Calls `open(url)` once, at once. Answers a connection:
- `send(message)`: sends `message.text()`. Before the socket's open event the texts are kept, and sent in order once it has opened; after its close event, a no-op. A `message` that isn't one throws a `TypeError`.
- `drain() -> array`: every message received since the last `drain`, in order, each parsed with `message.parse`; a text that doesn't parse is dropped (and logged with `console.warn`).
- `status() -> string`: `connecting` until the open event, `open` after it, `closed` after the close event (or an error event).
- `close()`: closes the socket.

# Intrinsics:
## Intrinsic - queues:
With a fake socket: `connect('ws://x/ws', open)` calls `open` once with `'ws://x/ws'`; two `send`s before the open event send nothing; once the test fires `onopen`, the socket's `send` has received the two texts, in order; a third `send` goes out at once. `send({kind: 'pause'})` throws a `TypeError`.

## Intrinsic - drains:
Three texts delivered through `onmessage({data})` come out of one `drain()` as the three messages, in order; a fourth, `nope`, is not among them; the next `drain()` is empty.

## Intrinsic - status:
`status()` is `connecting` after `connect`, `open` after `onopen`, `closed` after `onclose`; a `send` after that sends nothing. `close()` calls the socket's `close`.
