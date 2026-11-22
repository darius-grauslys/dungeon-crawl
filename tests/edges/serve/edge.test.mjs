import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import http from "node:http";

async function serve() {
  const mod = await import("../../../edges/edge_to_serve.mjs");
  return mod.serve;
}

async function pollDrain(server) {
  const start = Date.now();
  let drained = await server.drain();
  while (drained.length === 0 && Date.now() - start < 1000) {
    await new Promise((r) => setTimeout(r, 10));
    drained = await server.drain();
  }
  return drained;
}

async function pollClosed(server) {
  const start = Date.now();
  let closed = await server.closed();
  while (closed.length === 0 && Date.now() - start < 1000) {
    await new Promise((r) => setTimeout(r, 10));
    closed = await server.closed();
  }
  return closed;
}

test("page", async () => {
  const srv = await serve();
  const server = await srv({ port: 0, root: process.cwd() });
  try {
    const res = await fetch(`${server.url}`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /text\/html/);
    const body = await res.text();
    assert.ok(body.includes("<canvas"));
    assert.ok(body.includes('width="960"'));
    assert.ok(body.includes('height="720"'));
    assert.ok(body.includes("/game.js"));
  } finally {
    await server.close();
  }
});

test("bundle", async () => {
  const srv = await serve();
  const server = await srv({ port: 0, root: process.cwd() });
  try {
    const res = await fetch(`${server.url}game.js`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /text\/javascript/);
    const body = await res.text();
    assert.ok(body.length > 0);
    assert.match(body, /export\s*\{[^}]*\bstart\b/);
  } finally {
    await server.close();
  }
});

test("assets", async () => {
  const srv = await serve();
  const server = await srv({ port: 0, root: process.cwd() });
  try {
    const res = await fetch(`${server.url}assets/sheets/heroes.png`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /image\/png/);
    const body = Buffer.from(new Uint8Array(await res.arrayBuffer()));
    const expected = readFileSync(process.cwd() + "/assets/sheets/heroes.png");
    assert.ok(body.equals(expected));

    const res2 = await fetch(`${server.url}assets/sfx/coin.mp3`);
    assert.equal(res2.status, 200);
    assert.match(res2.headers.get("content-type") || "", /audio\/mpeg/);
    const body2 = Buffer.from(new Uint8Array(await res2.arrayBuffer()));
    const expected2 = readFileSync(process.cwd() + "/assets/sfx/coin.mp3");
    assert.ok(body2.equals(expected2));
  } finally {
    await server.close();
  }
});

test("not-found", async () => {
  const srv = await serve();
  const server = await srv({ port: 0, root: process.cwd() });
  try {
    assert.equal((await fetch(`${server.url}nope`)).status, 404);
    assert.equal((await fetch(`${server.url}assets/none.png`)).status, 404);
    assert.equal((await fetch(`${server.url}`, { method: "POST" })).status, 405);

    const res1 = await new Promise((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port: server.port, path: "/assets/../package.json", method: "GET" }, (r) => {
        resolve(r.statusCode);
        r.resume();
      });
      req.on("error", reject);
      req.end();
    });
    assert.equal(res1, 404);

    const res2 = await new Promise((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port: server.port, path: "/assets/%2e%2e/package.json", method: "GET" }, (r) => {
        resolve(r.statusCode);
        r.resume();
      });
      req.on("error", reject);
      req.end();
    });
    assert.equal(res2, 404);
  } finally {
    await server.close();
  }
});

test("connections", async () => {
  const srv = await serve();
  const server = await srv({ port: 0, root: process.cwd() });
  try {
    const port = server.port;

    const ws1 = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const ws2 = new WebSocket(`ws://127.0.0.1:${port}/ws`);

    await Promise.all([
      new Promise((resolve, reject) => { ws1.onopen = resolve; ws1.onerror = (e) => reject(e); }),
      new Promise((resolve, reject) => { ws2.onopen = resolve; ws2.onerror = (e) => reject(e); })
    ]);

    // ws2 sends "hello"
    ws2.send("hello");

    // drain comes out as [[2, 'hello']]
    let drained = await pollDrain(server);
    assert.deepEqual(drained, [[2, "hello"]]);

    // the next drain() is empty
    drained = await server.drain();
    assert.deepEqual(drained, []);

    // send(1, 'hi') arrives at the first client as 'hi'
    server.send(1, "hi");
    const msg1 = await new Promise((resolve, reject) => {
      ws1.onmessage = (e) => resolve(e.data);
      ws1.onerror = (e) => reject(e);
      setTimeout(() => reject("timeout"), 1000);
    });
    assert.equal(msg1, "hi");

    // and at the second not at all
    let ws2msg = null;
    ws2.onmessage = (e) => { ws2msg = e.data; };
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(ws2msg, null);

    // A text of 70000 characters sent either way arrives whole
    const bigText = "a".repeat(70000);
    ws1.send(bigText);
    let drainedBig = await pollDrain(server);
    assert.deepEqual(drainedBig, [[1, bigText]]);

    // server sends 70000 chars to client, arrives whole
    server.send(2, bigText);
    const msg2Big = await new Promise((resolve, reject) => {
      ws2.onmessage = (e) => resolve(e.data);
      ws2.onerror = (e) => reject(e);
      setTimeout(() => reject("timeout"), 1000);
    });
    assert.equal(msg2Big, bigText);
  } finally {
    await server.close();
  }
});

test("closed", async () => {
  const srv = await serve();
  const server = await srv({ port: 0, root: process.cwd() });
  try {
    const port = server.port;

    const ws1 = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    await new Promise((resolve, reject) => { ws1.onopen = resolve; ws1.onerror = (e) => reject(e); });

    // a client that closes appears in closed() exactly once
    ws1.close();
    let closed = await pollClosed(server);
    assert.deepEqual(closed, [1]);

    closed = await server.closed();
    assert.deepEqual(closed, []);

    // one closed with end too, and its client sees the socket close
    const ws2 = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    await new Promise((resolve, reject) => { ws2.onopen = resolve; ws2.onerror = (e) => reject(e); });

    let closedSeen = false;
    ws2.onclose = () => { closedSeen = true; };
    server.end(2);

    const start = Date.now();
    while (!closedSeen && Date.now() - start < 1000) {
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(closedSeen);

    closed = await pollClosed(server);
    assert.deepEqual(closed, [2]);
  } finally {
    await server.close();
  }
});

test("closes", async () => {
  const srv = await serve();
  const server = await srv({ port: 0, root: process.cwd() });
  const port = server.port;
  await server.close();
  const result = await new Promise((resolve) => {
    const req = http.request({ host: "127.0.0.1", port, path: "/", method: "GET" }, () => resolve("connected"));
    req.on("error", (err) => resolve(err.code || "failed"));
    req.on("timeout", () => resolve("timeout"));
    req.setTimeout(1000);
    req.end();
  });
  assert.equal(result, "ECONNREFUSED");
});
