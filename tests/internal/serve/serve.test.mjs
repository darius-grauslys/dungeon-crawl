import test from "node:test";
import assert from "node:assert/strict";
import { request, get } from "node:http";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { serve } from "../../../src/serve/index.mjs";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x37, 0x0d, 0x0a, 0x0d, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x4a, 0x43, 0x57, 0x0d, 0x0a, 0x1b, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x2d, 0x51, 0x5e, 0x55, 0x0a,
]);

async function makeFixture() {
  const dir = path.join(process.cwd(), "tests/internal/serve/.tmp");
  await mkdir(path.join(dir, "edges"), { recursive: true });
  await mkdir(path.join(dir, "assets", "sheets"), { recursive: true });
  await writeFile(
    path.join(dir, "edges", "edge_to_play.mjs"),
    `export function start(doc) {\n` +
    `  const x = '` + "a".repeat(2000) + `';\n` +
    `  return doc;\n}\n`
  );
  await writeFile(path.join(dir, "assets", "sheets", "heroes.png"), PNG);
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

test("closes", async () => {
  const root = await makeFixture();
  const srv = await serve({ port: 0, root });
  const port = srv.port;
  await srv.close();
  const result = await new Promise((resolve) => {
    const req = get({ host: "127.0.0.1", port }, (res) => {
      resolve({ ok: false, status: res.statusCode });
    });
    req.on("error", () => resolve({ ok: true }));
    req.setTimeout(500, () => resolve({ ok: false }));
  });
  assert.ok(result.ok, "request after close should fail to connect");
});
