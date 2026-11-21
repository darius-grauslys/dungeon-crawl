import test from "node:test";
import assert from "node:assert/strict";

import { connect } from "../../../src/net/index.mjs";

// A fake socket with the browser WebSocket surface: send(text), close(), and the
// onopen, onmessage, onclose, onerror handlers, which connect() sets.
function makeFakeSocket() {
  const socket = {
    sent: [],
    closed: false,
    send(text) {
      if (this.closed) throw new Error("socket is closed");
      this.sent.push(text);
    },
    close() {
      this.closed = true;
    },
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    fireOpen() {
      if (this.onopen) this.onopen();
    },
    fireMessage(data) {
      if (this.onmessage) this.onmessage({ data });
    },
    fireClose() {
      if (this.onclose) this.onclose();
    },
    fireError() {
      if (this.onerror) this.onerror();
    },
  };
  return socket;
}

test("queues: open called once with url", () => {
  const socket = makeFakeSocket();
  let openCalls = 0;
  const open = (url) => {
    openCalls++;
    assert.strictEqual(url, "ws://x/ws");
    return socket;
  };
  connect("ws://x/ws", open);
  assert.strictEqual(openCalls, 1);
});

test("queues: sends before open are kept, sent in order once open", () => {
  const socket = makeFakeSocket();
  const open = () => socket;
  const c = connect("ws://x/ws", open);
  const m1 = { text: () => '{"kind":"pause","paused":true}' };
  const m2 = { text: () => '{"kind":"pause","paused":false}' };
  c.send(m1);
  c.send(m2);
  assert.strictEqual(socket.sent.length, 0);
  socket.fireOpen();
  assert.deepStrictEqual(socket.sent, [m1.text(), m2.text()]);
  const m3 = { text: () => '{"kind":"pause","paused":true}' };
  c.send(m3);
  assert.strictEqual(socket.sent.length, 3);
  assert.strictEqual(socket.sent[2], m3.text());
});

test("queues: send of a plain object throws a TypeError", () => {
  const socket = makeFakeSocket();
  const c = connect("ws://x/ws", () => socket);
  assert.throws(() => c.send({ kind: "pause" }), TypeError);
});

test("drains: texts come out as messages in order; unparsed dropped", () => {
  const socket = makeFakeSocket();
  const c = connect("ws://x/ws", () => socket);
  socket.fireOpen();
  socket.fireMessage('{"kind":"pause","paused":true}');
  socket.fireMessage('{"kind":"pause","paused":false}');
  socket.fireMessage('{"kind":"pause","paused":true}');
  socket.fireMessage("nope");
  const msgs = c.drain();
  assert.strictEqual(msgs.length, 3);
  assert.strictEqual(c.drain().length, 0);
});

test("status: connecting, open, closed", () => {
  const socket = makeFakeSocket();
  const c = connect("ws://x/ws", () => socket);
  assert.strictEqual(c.status(), "connecting");
  socket.fireOpen();
  assert.strictEqual(c.status(), "open");
  socket.fireClose();
  assert.strictEqual(c.status(), "closed");
  c.send({ text: () => "x" });
});

test("status: closed after an error event", () => {
  const socket = makeFakeSocket();
  const c = connect("ws://x/ws", () => socket);
  socket.fireError();
  assert.strictEqual(c.status(), "closed");
});

test("close: calls the socket's close", () => {
  const socket = makeFakeSocket();
  const c = connect("ws://x/ws", () => socket);
  c.close();
  assert.strictEqual(socket.closed, true);
});
