# net: `socket`

One closure per `connect`: the socket, an outbox of texts kept until the
open event, an inbox of texts, and the status. `onopen` sends the outbox
in order and empties it; `onmessage` pushes `event.data` to the inbox;
`onclose` and `onerror` set the status to `closed`. `drain` parses the
inbox (skipping and warning about what doesn't parse) and empties it.

This Node's edge:

- [eed:net](../EED.md)

# API Shapes:
- [shape:message](../../../shapes/message.md)

# Inbound Side-Effects:
The socket's events.

# Outbound Side-Effects:
Texts sent on the socket; its close; `console.warn` for a text that
doesn't parse.
