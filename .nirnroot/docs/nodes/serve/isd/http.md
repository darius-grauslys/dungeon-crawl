# serve: `http`

`node:http`'s `createServer`, listening with no host (every interface).
Build the bundle first with esbuild's `build({entryPoints:
[path.join(root, 'edges/edge_to_play.mjs')], bundle: true, format: 'esm',
platform: 'browser', write: false})` and keep its text; then listen. For
`/assets/`, decode the rest of the path (`decodeURIComponent`; a decoding
error is 404), resolve it against `<root>/assets/`, and answer 404 unless
the resolved path is inside that folder and is a regular file; read it
with `node:fs/promises`. Write the page as a constant string.

## WebSocket (RFC 6455, server side, text only)

No package does it (the project adds no dependency): on the server's
`upgrade` event for `/ws`, check `Upgrade: websocket` and
`Sec-WebSocket-Key` (else answer 400 and destroy the socket); answer 101
with `Sec-WebSocket-Accept` = base64(sha1(key +
`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)) using `node:crypto`. Then on the
raw socket: buffer what arrives and parse frames (FIN, opcode, mask bit,
7/16/64-bit length, the 4-byte mask of client frames, which are always
masked); unmask; text frames (opcode 1, possibly continued by opcode 0
until FIN) are decoded as UTF-8 into the inbox as `[connection, text]`.
Ping (9) is answered with pong (10) carrying the same payload; pong is
ignored; close (8) is answered with a close frame and the socket ends;
binary (2) closes with 1003. Outbound: `send` writes one unmasked text
frame (server frames are never masked) with the right length encoding
(7-bit, 16-bit for 126 to 65535 bytes, 64-bit above). `end(c)` sends a
close frame with 1000 and destroys the socket after the peer's close or
a second. A socket's `close` (any cause) marks the connection closed and
puts it in the closed list once.

`close()` ends every connection with 1001, closes the listener, and also
ends kept-alive HTTP connections (`server.closeAllConnections()`), so it
resolves promptly.

## State

The listener; the connections by number (socket, a partial-frame buffer,
a partial message, open flag); the inbox (taken whole by `drain`); the
numbers closed since the last `closed()`; the bundle text; the next
connection number.

This Node's edge:

- [eed:serve](../EED.md)

# API Shapes:
None

# Inbound Side-Effects:
HTTP requests and WebSocket frames on the port; the files under
`<root>/assets/`; the source files the bundle is built from, read once at
start.

# Outbound Side-Effects:
A socket listening on every interface until `close()`; HTTP responses;
WebSocket frames written to sockets; closing sockets and the listener.
