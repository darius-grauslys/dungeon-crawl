import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import http from "node:http";

async function serve() {
  const mod = await import("../../../edges/edge_to_serve.mjs");
  return mod.serve;
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
    assert.ok(body.length > 1000);
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
        r.on("end", () => resolve(r.statusCode));
      });
      req.on("error", reject);
      req.end();
    });
    assert.equal(res1, 404);

    const res2 = await new Promise((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port: server.port, path: "/assets/%2e%2e/package.json", method: "GET" }, (r) => {
        r.on("end", () => resolve(r.statusCode));
      });
      req.on("error", reject);
      req.end();
    });
    assert.equal(res2, 404);
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
