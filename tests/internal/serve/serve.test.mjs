import test from "node:test";
import assert from "node:assert/strict";
import { request, get } from "node:http";
import net from "node:net";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { serve } from "../../../src/serve/index.mjs";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x37, 0x0d, 0x0a, 0x0d, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x4a, 0x43, 0x57, 0x0d, 0x0a, 0x1b, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x2d, 0x51, 0x5e, 0x55, 0x0a,
]);

const MP3 = Buffer.from([
  0x4d, 0x50, 0x33, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

async function makeFixture() {
  const dir = path.join(process.cwd(), "tests/internal/serve/.tmp");
  await mkdir(path.join(dir, "edges"), { recursive: true });
  await mkdir(path.join(dir, "assets", "sheets"), { recursive: true });
  await mkdir(path.join(dir, "assets", "sfx"), { recursive: true });
  await writeFile(
    path.join(dir, "edges", "edge_to_play.mjs"),
    `export function start(doc) {\n` +
    `  const x = '` + "a".repeat(2000) + `';\n` +
    `  return doc;\n}\n`
  );
  await writeFile(path.join(dir, "assets", "sheets", "heroes.png"), PNG);
  await writeFile(path.join(dir, "assets", "sfx", "coin.mp3"), MP3);
  return dir;
}

async function fetch(port, p, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path: p, method }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function collectDrain(srv) {
  for (let i = 0; i < 200; i++) {
    const d = srv.drain();
    if (d.length > 0) return d;
    await new Promise((r) => setTimeout(r, 5));
  }
  return srv.drain();
}

async function emptyDrain(srv) {
  for (let i = 0; i < 200; i++) {
    const d = srv.drain();
    if (d.length === 0) return d;
    await new Promise((r) => setTimeout(r, 5));
  }
  return srv.drain();
}

function connectWs(port) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
  });
}

test("page", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const r = await fetch(srv.port, "/");
    assert.equal(r.status, 200);
    assert.match(r.headers["content-type"], /text\/html/);
    assert.ok(r.body.includes("<canvas"));
    assert.ok(r.body.includes('width="960"'));
    assert.ok(r.body.includes('height="720"'));
    assert.ok(r.body.includes("/game.js"));
  } finally {
    await srv.close();
  }
});

test("bundle", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const r = await fetch(srv.port, "/game.js");
    assert.equal(r.status, 200);
    assert.match(r.headers["content-type"], /text\/javascript/);
    assert.ok(r.body.length > 1000);
    assert.match(r.body.toString(), /export\s*\{[^}]*\bstart\b/);
  } finally {
    await srv.close();
  }
});

test("assets", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const r = await fetch(srv.port, "/assets/sheets/heroes.png");
    assert.equal(r.status, 200);
    assert.equal(r.headers["content-type"], "image/png");
    assert.equal(Buffer.compare(r.body, PNG), 0);

    const r2 = await fetch(srv.port, "/assets/sfx/coin.mp3");
    assert.equal(r2.status, 200);
    assert.equal(r2.headers["content-type"], "audio/mpeg");
    assert.equal(Buffer.compare(r2.body, MP3), 0);
  } finally {
    await srv.close();
  }
});

test("not-found", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    for (const p of ["/nope", "/assets/none.png", "/assets/../package.json", "/assets/%2e%2e/package.json"]) {
      const r = await fetch(srv.port, p);
      assert.equal(r.status, 404, `expected 404 for ${p}, got ${r.status}`);
    }
    const r = await fetch(srv.port, "/", "POST");
    assert.equal(r.status, 405);
  } finally {
    await srv.close();
  }
});

test("query", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const r1 = await fetch(srv.port, "/?debug=true");
    assert.equal(r1.status, 200);
    assert.match(r1.headers["content-type"], /text\/html/);
    const rPage = await fetch(srv.port, "/");
    assert.equal(r1.body.toString(), rPage.body.toString());

    const r2 = await fetch(srv.port, "/game.js?v=2");
    assert.equal(r2.status, 200);
    assert.match(r2.headers["content-type"], /text\/javascript/);

    const r3 = await fetch(srv.port, "/assets/sfx/coin.mp3?x=1");
    assert.equal(r3.status, 200);
    assert.equal(r3.headers["content-type"], "audio/mpeg");
    assert.equal(Buffer.compare(r3.body, MP3), 0);

    const r4 = await fetch(srv.port, "/nope?debug=true");
    assert.equal(r4.status, 404);

    const r5 = await fetch(srv.port, "/?debug=true#frag");
    assert.equal(r5.status, 200);
  } finally {
    await srv.close();
  }
});

test("closes", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  const port = srv.port;
  const c1 = await connectWs(srv.port);
  let c1closed = false;
  c1.onclose = () => { c1closed = true; };
  await srv.close();
  for (let i = 0; i < 200 && !c1closed; i++) {
    await new Promise((r) => setTimeout(r, 5));
  }
  assert.equal(c1.readyState, WebSocket.CLOSED);
  const result = await new Promise((resolve) => {
    const req = get({ host: "127.0.0.1", port }, (res) => {
      resolve({ ok: false, status: res.statusCode });
    });
    req.on("error", () => resolve({ ok: true }));
    req.setTimeout(500, () => resolve({ ok: false }));
  });
  assert.ok(result.ok, "request after close should fail to connect");
});

test("connections", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const c1 = await connectWs(srv.port);
    const c2 = await connectWs(srv.port);

    c2.send("hello");
    let drained = await collectDrain(srv);
    assert.deepEqual(drained, [[2, "hello"]]);

    drained = await emptyDrain(srv);
    assert.deepEqual(drained, []);

    let m1 = null;
    c1.onmessage = (e) => { m1 = e.data; };
    srv.send(1, "hi");
    for (let i = 0; i < 200 && m1 === null; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.equal(m1, "hi");

    await new Promise((r) => setTimeout(r, 50));
    assert.equal(c2.readyState, WebSocket.OPEN);

    c1.close();
    c2.close();
  } finally {
    await srv.close();
  }
});

test("connections-large", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const c1 = await connectWs(srv.port);
    const bigText = "a".repeat(70000);

    c1.send(bigText);
    let drained = await collectDrain(srv);
    assert.deepEqual(drained, [[1, bigText]]);

    let m1 = null;
    c1.onmessage = (e) => { m1 = e.data; };
    srv.send(1, bigText);
    for (let i = 0; i < 200 && m1 === null; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.equal(m1, bigText);

    c1.close();
  } finally {
    await srv.close();
  }
});

test("closed", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const c1 = await connectWs(srv.port);
    c1.close();
    await new Promise((r) => setTimeout(r, 50));
    let closed = await srv.closed();
    assert.deepEqual(closed, [1]);

    closed = await srv.closed();
    assert.deepEqual(closed, []);

    const c2 = await connectWs(srv.port);
    srv.end(2);
    await new Promise((resolve) => { c2.onclose = resolve; });
    assert.equal(c2.readyState, WebSocket.CLOSED);
    closed = await srv.closed();
    assert.deepEqual(closed, [2]);

    c1.close?.();
    c2.close?.();
  } finally {
    await srv.close();
  }
});

// --- framing tests with raw sockets ---

function rawConnect(port) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString("base64");
    const accept = crypto.createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    const client = net.connect(port, "127.0.0.1", () => {
      client.write(
        `GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\n\r\n`
      );
    });
    let data = Buffer.alloc(0);
    let handshakeDone = false;
    client.on("data", (chunk) => {
      data = Buffer.concat([data, chunk]);
      const idx = data.indexOf("\r\n\r\n");
      if (idx !== -1 && !handshakeDone) {
        handshakeDone = true;
        const resp = data.slice(0, idx).toString();
        if (!resp.includes("101")) { client.destroy(); reject(new Error("no 101")); return; }
        if (!resp.includes(`Sec-WebSocket-Accept: ${accept}`)) { client.destroy(); reject(new Error("bad accept")); return; }
        resolve({ socket: client, key });
      }
    });
    client.on("error", reject);
  });
}

function rawSendText(socket, text, fin = true) {
  const payload = Buffer.from(text, "utf8");
  const header = Buffer.alloc(2);
  header[0] = (fin ? 0x80 : 0) | 1;
  const len = payload.length;
  if (len < 126) {
    header[1] = len;
    socket.write(Buffer.concat([header, payload]));
  } else if (len <= 65535) {
    header[1] = 126;
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16BE(len, 0);
    socket.write(Buffer.concat([header, lenBuf, payload]));
  } else {
    header[1] = 127;
    const lenBuf = Buffer.alloc(8);
    const hi = Math.floor(len / 4294967296);
    const lo = len - hi * 4294967296;
    lenBuf.writeUInt32BE(hi, 0);
    lenBuf.writeUInt32BE(lo, 4);
    socket.write(Buffer.concat([header, lenBuf, payload]));
  }
}

function rawSendFragmented(socket, parts) {
  for (let i = 0; i < parts.length; i++) {
    const part = Buffer.from(parts[i], "utf8");
    const fin = i === parts.length - 1;
    const header = Buffer.alloc(2);
    header[0] = (fin ? 0x80 : 0) | (i === 0 ? 1 : 0);
    const len = part.length;
    if (len < 126) {
      header[1] = len;
      socket.write(Buffer.concat([header, part]));
    } else if (len <= 65535) {
      header[1] = 126;
      const lenBuf = Buffer.alloc(2);
      lenBuf.writeUInt16BE(len, 0);
      socket.write(Buffer.concat([header, lenBuf, part]));
    } else {
      header[1] = 127;
      const lenBuf = Buffer.alloc(8);
      const hi = Math.floor(len / 4294967296);
      const lo = len - hi * 4294967296;
      lenBuf.writeUInt32BE(hi, 0);
      lenBuf.writeUInt32BE(lo, 4);
      socket.write(Buffer.concat([header, lenBuf, part]));
    }
  }
}

test("host", async () => {
  const root = await makeFixture();
  let srv = await serve({ port: 0, root, host: "127.0.0.1" });
  try {
    assert.equal(srv.url, `http://127.0.0.1:${srv.port}/`);
    const r = await fetch(srv.port, "/");
    assert.equal(r.status, 200);
  } finally {
    await srv.close();
  }

  srv = await serve({ port: 0, root, host: "0.0.0.0" });
  try {
    assert.equal(srv.url, `http://0.0.0.0:${srv.port}/`);
    const r = await fetch(srv.port, "/");
    assert.equal(r.status, 200);
  } finally {
    await srv.close();
  }

  srv = await serve({ port: 0, root });
  try {
    assert.equal(srv.url, `http://127.0.0.1:${srv.port}/`);
  } finally {
    await srv.close();
  }

  await assert.rejects(() => serve({ port: 0, root, host: "" }), TypeError);
  await assert.rejects(() => serve({ port: 0, root, host: 5 }), TypeError);
});

test("framing-fragmented", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const { socket } = await rawConnect(srv.port);
    rawSendFragmented(socket, ["hel", "lo", " world"]);
    const drained = await collectDrain(srv);
    assert.deepEqual(drained, [[1, "hello world"]]);
    socket.destroy();
  } finally {
    await srv.close();
  }
});

test("framing-16bit", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const { socket } = await rawConnect(srv.port);
    const text = "a".repeat(5000);
    rawSendText(socket, text);
    const drained = await collectDrain(srv);
    assert.deepEqual(drained, [[1, text]]);
    socket.destroy();
  } finally {
    await srv.close();
  }
});

test("framing-pingpong", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const { socket } = await rawConnect(srv.port);
    const ping = Buffer.from("pingdata");
    const header = Buffer.alloc(2);
    header[0] = 0x80 | 9;
    header[1] = ping.length;
    socket.write(Buffer.concat([header, ping]));
    let pong = null;
    const handler = (chunk) => {
      if (chunk[0] === 0x8a && chunk.slice(2).toString() === "pingdata") pong = chunk;
    };
    socket.on("data", handler);
    for (let i = 0; i < 200 && pong === null; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.ok(pong, "expected pong");
    socket.off("data", handler);
    socket.destroy();
  } finally {
    await srv.close();
  }
});

test("framing-64bit", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const { socket } = await rawConnect(srv.port);
    const text = "a".repeat(70000);
    rawSendText(socket, text);
    const drained = await collectDrain(srv);
    assert.deepEqual(drained, [[1, text]]);
    socket.destroy();
  } finally {
    await srv.close();
  }
});

test("framing-masked", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  try {
    const { socket } = await rawConnect(srv.port);
    const text = "masked text";
    const payload = Buffer.from(text, "utf8");
    const header = Buffer.alloc(2);
    header[0] = 0x80 | 1;
    header[1] = payload.length | 0x80;
    const mask = crypto.randomBytes(4);
    const masked = Buffer.allocUnsafe(payload.length);
    for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
    socket.write(Buffer.concat([header, mask, masked]));
    const drained = await collectDrain(srv);
    assert.deepEqual(drained, [[1, text]]);
    socket.destroy();
  } finally {
    await srv.close();
  }
});
