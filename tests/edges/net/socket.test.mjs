// The edge test for net: socket, queues, drains and status, plus message intrinsics.

import test from "node:test";
import assert from "node:assert/strict";
import { move } from "../../../shapes/intent/index.mjs";

async function netModule() {
  return import("../../../edges/edge_to_net.mjs");
}

async function messageModule() {
  return import("../../../shapes/message/index.mjs");
}

// Fake socket factory that records its url, what send is given, and what close calls.
function makeFakeSocketFactory() {
  let url = null;
  const sent = [];
  const closed = [];
  let socket = null;
  function open(u) {
    url = u;
    socket = {
      send(text) {
        sent.push(text);
      },
      close() {
        closed.push("close");
      },
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
    };
    return socket;
  }
  return { open, get url() { return url; }, sent, closed, get socket() { return socket; } };
}

test("queues: connect calls open once with the url", async () => {
  const { connect } = await netModule();
  const f = makeFakeSocketFactory();
  connect("ws://x/ws", f.open);
  assert.strictEqual(f.url, "ws://x/ws");
});

test("queues: sends before open are kept and sent in order on open", async () => {
  const { connect } = await netModule();
  const f = makeFakeSocketFactory();
  const conn = connect("ws://x/ws", f.open);
  const mMod = await messageModule();
  const m1 = mMod.pause(false);
  const m2 = mMod.requestSave();
  conn.send(m1);
  conn.send(m2);
  assert.strictEqual(f.sent.length, 0);
  f.socket.onopen();
  assert.deepStrictEqual(f.sent, [m1.text(), m2.text()]);
  const m3 = mMod.pause(true);
  conn.send(m3);
  assert.deepStrictEqual(f.sent, [m1.text(), m2.text(), m3.text()]);
});

test("queues: send of a plain object throws TypeError", async () => {
  const { connect } = await netModule();
  const f = makeFakeSocketFactory();
  const conn = connect("ws://x/ws", f.open);
  assert.throws(() => conn.send({ kind: "pause" }), TypeError);
});

test("drains: three texts come out as three messages in order", async () => {
  const { connect } = await netModule();
  const mMod = await messageModule();
  const f = makeFakeSocketFactory();
  const conn = connect("ws://x/ws", f.open);
  f.socket.onopen();
  const texts = [mMod.pause(false).text(), mMod.requestSave().text(), mMod.act(move(1, 0)).text()];
  for (const t of texts) {
    f.socket.onmessage({ data: t });
  }
  const msgs = conn.drain();
  assert.strictEqual(msgs.length, 3);
  assert.strictEqual(msgs[0].kind, "pause");
  assert.strictEqual(msgs[1].kind, "save");
  assert.strictEqual(msgs[2].kind, "act");
});

test("drains: a fourth unparsable text is dropped, next drain empty", async () => {
  const { connect } = await netModule();
  const mMod = await messageModule();
  const f = makeFakeSocketFactory();
  const conn = connect("ws://x/ws", f.open);
  f.socket.onopen();
  const texts = [mMod.pause(false).text(), mMod.requestSave().text(), mMod.act(move(1, 0)).text()];
  for (const t of texts) {
    f.socket.onmessage({ data: t });
  }
  let msgs = conn.drain();
  assert.strictEqual(msgs.length, 3);
  f.socket.onmessage({ data: "nope" });
  msgs = conn.drain();
  assert.strictEqual(msgs.length, 0);
});

test("status: connecting, open, closed", async () => {
  const { connect } = await netModule();
  const f = makeFakeSocketFactory();
  const conn = connect("ws://x/ws", f.open);
  assert.strictEqual(conn.status(), "connecting");
  f.socket.onopen();
  assert.strictEqual(conn.status(), "open");
  f.socket.onclose();
  assert.strictEqual(conn.status(), "closed");
});

test("status: send after close sends nothing, close calls socket close", async () => {
  const { connect } = await netModule();
  const f = makeFakeSocketFactory();
  const conn = connect("ws://x/ws", f.open);
  f.socket.onopen();
  f.socket.onclose();
  const mMod = await messageModule();
  const m = mMod.pause(false);
  conn.send(m);
  assert.strictEqual(f.sent.length, 0);
  conn.close();
  assert.strictEqual(f.closed.length, 1);
});

test("message/valid: constructors answer frozen messages with correct upward", async () => {
  const m = await messageModule();
  assert.strictEqual(m.act(move(1, 0)).upward, true);
  assert.strictEqual(m.refused("full").upward, false);
});

test("message/valid: invalid inputs throw TypeError", async () => {
  const m = await messageModule();
  assert.throws(() => m.refused("nope"), TypeError);
  assert.throws(() => m.join("", "x", "Ann"), TypeError);
  assert.throws(() => m.join("ABCDEF", "x", ""), TypeError);
  assert.throws(() => m.act({ kind: "move", dx: 1, dy: 0 }), TypeError);
  assert.throws(() => m.pause("yes"), TypeError);
  assert.throws(() => m.create({}), TypeError);
});

test("message/valid: parse rejects invalid texts", async () => {
  const m = await messageModule();
  assert.throws(() => m.parse("nope"), TypeError);
  assert.throws(() => m.parse("{}"), TypeError);
  assert.throws(() => m.parse('{"kind":"fly"}'), TypeError);
  assert.throws(() => m.parse('{"kind":"pause"}'), TypeError);
});

test("message/round-trip: parse(m.text()) is deepStrictEqual to m for create(null), join, act, pause, save, created, joined, refused", async () => {
  const m = await messageModule();
  const mCreateNull = m.create(null);
  assert.deepStrictEqual(m.parse(mCreateNull.text()), mCreateNull);

  const mJoin = m.join("sess", "pass", "Ann");
  assert.deepStrictEqual(m.parse(mJoin.text()), mJoin);

  const mAct = m.act(move(1, 0));
  assert.deepStrictEqual(m.parse(mAct.text()), mAct);

  const mPause = m.pause(false);
  assert.deepStrictEqual(m.parse(mPause.text()), mPause);

  const mSave = m.requestSave();
  assert.deepStrictEqual(m.parse(mSave.text()), mSave);

  const mCreated = m.created("sess", "pass");
  assert.deepStrictEqual(m.parse(mCreated.text()), mCreated);

  const mJoined = m.joined("sess", "Ann");
  assert.deepStrictEqual(m.parse(mJoined.text()), mJoined);

  const mRefused = m.refused("full");
  assert.deepStrictEqual(m.parse(mRefused.text()), mRefused);
});
