// server: internal tests for the server node, held to the intrinsics in its EED.

import test from "node:test";
import assert from "node:assert/strict";

const TIMEOUT = 2000;

function waitOpen(ws) {
  return Promise.race([
    new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = (e) => reject(e);
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout: onopen")), TIMEOUT))
  ]);
}

function waitMessage(ws, filter) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.onmessage = null;
      reject(new Error("timeout: onmessage"));
    }, TIMEOUT);
    const handler = (e) => {
      let m;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!filter || filter(m)) {
        clearTimeout(timer);
        ws.onmessage = null;
        resolve(e.data);
      }
    };
    ws.onmessage = handler;
  });
}

function makeWs(url) {
  return new WebSocket(url.replace("http", "ws") + "ws");
}

test("server: exports start as a function", async () => {
  const mod = await import("../../../src/server/index.mjs");
  assert.strictEqual(typeof mod.start, "function");
});

test("server: page answers 200 with text/html", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    const res = await fetch(s.url);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get("content-type")?.includes("text/html"));
  } finally {
    await s.close();
  }
});

test("server: list answers lobby", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    const ws = makeWs(s.url);
    await waitOpen(ws);
    ws.send(JSON.stringify({ kind: "list" }));
    const lobby = await waitMessage(ws, (m) => m.kind === "lobby");
    const msg = JSON.parse(lobby);
    assert.strictEqual(msg.kind, "lobby");
    assert.ok(Array.isArray(msg.sessions));
    ws.close();
  } finally {
    await s.close();
  }
});

test("server: create-join flow", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    const ws = makeWs(s.url);
    await waitOpen(ws);
    ws.send(JSON.stringify({ kind: "create", save: null }));
    const created = await waitMessage(ws, (m) => m.kind === "created");
    const msg = JSON.parse(created);
    assert.strictEqual(msg.kind, "created");
    assert.strictEqual(typeof msg.session, "string");
    assert.strictEqual(msg.password, undefined);
    ws.send(JSON.stringify({ kind: "join", session: msg.session, name: "Ann" }));
    const joined = await waitMessage(ws, (m) => m.kind === "joined");
    assert.strictEqual(JSON.parse(joined).kind, "joined");
    ws.close();
  } finally {
    await s.close();
  }
});

test("server: at most four sessions", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    const created = [];
    for (let i = 0; i < 5; i++) {
      const ws = makeWs(s.url);
      await waitOpen(ws);
      ws.send(JSON.stringify({ kind: "create", save: null }));
      const r = await waitMessage(ws, (m) => m.kind === "created" || m.kind === "refused");
      created.push(JSON.parse(r).kind);
      ws.close();
    }
    assert.deepStrictEqual(created, ["created", "created", "created", "created", "refused"]);
  } finally {
    await s.close();
  }
});

test("server: refusals", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    const ws = makeWs(s.url);
    await waitOpen(ws);
    ws.send("nonsense");
    const r = await waitMessage(ws, (m) => m.kind === "refused");
    assert.strictEqual(JSON.parse(r).kind, "refused");
    assert.strictEqual(JSON.parse(r).reason, "malformed");
    ws.close();
  } finally {
    await s.close();
  }
});

test("server: pause and resume", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    const ws = makeWs(s.url);
    await waitOpen(ws);
    ws.send(JSON.stringify({ kind: "create", save: null }));
    const created = await waitMessage(ws, (m) => m.kind === "created");
    const msg = JSON.parse(created);
    ws.send(JSON.stringify({ kind: "join", session: msg.session, name: "Ann" }));
    await waitMessage(ws, (m) => m.kind === "joined");
    ws.send(JSON.stringify({ kind: "pause", paused: true }));
    const st = await waitMessage(ws, (m) => m.kind === "state" && m.paused === true);
    assert.strictEqual(JSON.parse(st).paused, true);
    ws.close();
  } finally {
    await s.close();
  }
});

test("server: closes after close()", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  const port = s.port;
  await s.close();
  try {
    await fetch(`http://127.0.0.1:${port}/`);
    assert.fail("should not connect after close");
  } catch {
    // expected: connection fails
  }
});

test("server: host is handed to serve", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd(), host: "0.0.0.0" });
  try {
    assert.ok(s.url.startsWith("http://0.0.0.0:"), `url was ${s.url}`);
  } finally {
    await s.close();
  }
});

test("server: url without host begins with 127.0.0.1", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    assert.ok(s.url.startsWith("http://127.0.0.1:"), `url was ${s.url}`);
  } finally {
    await s.close();
  }
});

test("server: create with bad save leaves lobby unchanged", async () => {
  const mod = await import("../../../src/server/index.mjs");
  const s = await mod.start({ port: 0, root: process.cwd() });
  try {
    const ws = makeWs(s.url);
    await waitOpen(ws);

    // Create a couple of valid sessions.
    ws.send(JSON.stringify({ kind: "create", save: null }));
    await waitMessage(ws, (m) => m.kind === "created");
    ws.send(JSON.stringify({ kind: "create", save: null }));
    await waitMessage(ws, (m) => m.kind === "created");

    // Count sessions in the lobby.
    ws.send(JSON.stringify({ kind: "list" }));
    const lobby0 = await waitMessage(ws, (m) => m.kind === "lobby");
    const count0 = JSON.parse(lobby0).sessions.length;
    assert.strictEqual(count0, 2);

    // Create with a save whose world can't be made (version 2 is invalid).
    ws.send(JSON.stringify({
      kind: "create",
      save: { format: "crawl-save", version: 2, seed: 1, depth: 1, players: [] },
    }));
    const refused = await waitMessage(ws, (m) => m.kind === "refused");
    assert.strictEqual(JSON.parse(refused).reason, "malformed");

    // The lobby must be unchanged: no session was made.
    ws.send(JSON.stringify({ kind: "list" }));
    const lobby1 = await waitMessage(ws, (m) => m.kind === "lobby");
    const count1 = JSON.parse(lobby1).sessions.length;
    assert.strictEqual(count1, count0);

    ws.close();
  } finally {
    await s.close();
  }
});
