// net: a Node, the page's connection to the server: one WebSocket, messages out, messages in.

import * as message from "../../shapes/message/index.mjs";

/** `connect(url, open) -> connection`. `open(url)` answers a socket with the browser `WebSocket` surface (`send(text)`, `close()`, and the `onopen`, `onmessage`, `onclose`, `onerror` handlers, which this sets); left out, `url => new WebSocket(url)`. Calls `open(url)` once, at once. Answers a connection: - `send(message)`: sends `message.text()`. Before the socket's open event the texts are kept, and sent in order once it has opened; after its close event, a no-op. A `message` that isn't one throws a `TypeError`. - `drain() -> array`: every message received since the last `drain`, in order, each parsed with `message.parse`; a text that doesn't parse is dropped (and logged with `console.warn`). - `status() -> string`: `connecting` until the open event, `open` after it, `closed` after the close event (or an error event). - `close()`: closes the socket. */
export function connect(url, open) {
  const factory = typeof open === "function" ? open : (u) => new WebSocket(u);
  const socket = factory(url);

  let status = "connecting";
  const outbox = [];
  const inbox = [];

  socket.onopen = () => {
    status = "open";
    while (outbox.length > 0) {
      const text = outbox.shift();
      socket.send(text);
    }
  };

  socket.onmessage = (event) => {
    inbox.push(event.data);
  };

  socket.onclose = () => {
    status = "closed";
  };

  socket.onerror = () => {
    status = "closed";
  };

  function send(message) {
    if (status === "closed") return;
    if (typeof message.text !== "function") {
      throw new TypeError("not a message");
    }
    const text = message.text();
    if (status === "connecting") {
      outbox.push(text);
    } else if (status === "open") {
      socket.send(text);
    }
  }

  function drain() {
    const out = [];
    while (inbox.length > 0) {
      const text = inbox.shift();
      try {
        out.push(message.parse(text));
      } catch (e) {
        console.warn(`dropping unparsed text: ${text}`);
      }
    }
    return out;
  }

  function statusFn() {
    return status;
  }

  function close() {
    socket.close();
  }

  return { send, drain, status: statusFn, close };
}
