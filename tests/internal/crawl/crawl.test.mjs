import test from "node:test";
import assert from "node:assert/strict";

test("crawl exports main as a function", async () => {
  const mod = await import("../../../src/crawl/index.mjs");
  assert.strictEqual(typeof mod.main, "function");
});

test("crawl exports parseHostArgv as a function", async () => {
  const mod = await import("../../../src/crawl/index.mjs");
  assert.strictEqual(typeof mod.parseHostArgv, "function");
});

test("crawl.parseHostArgv parses --host <address>", async () => {
  const { parseHostArgv } = await import("../../../src/crawl/index.mjs");
  assert.strictEqual(parseHostArgv(["--host", "0.0.0.0"]), "0.0.0.0");
  assert.strictEqual(parseHostArgv(["--host", "127.0.0.1"]), "127.0.0.1");
  assert.strictEqual(parseHostArgv(["a", "--host", "127.0.0.1", "b"]), "127.0.0.1");
});

test("crawl.parseHostArgv parses --host=<address>", async () => {
  const { parseHostArgv } = await import("../../../src/crawl/index.mjs");
  assert.strictEqual(parseHostArgv(["--host=0.0.0.0"]), "0.0.0.0");
  assert.strictEqual(parseHostArgv(["--host=127.0.0.1"]), "127.0.0.1");
  assert.strictEqual(parseHostArgv(["x", "--host=127.0.0.1"]), "127.0.0.1");
});

test("crawl.parseHostArgv: the last one given wins", async () => {
  const { parseHostArgv } = await import("../../../src/crawl/index.mjs");
  assert.strictEqual(parseHostArgv(["--host", "a", "--host", "b"]), "b");
  assert.strictEqual(parseHostArgv(["--host=a", "--host=b"]), "b");
  assert.strictEqual(parseHostArgv(["--host=a", "--host", "b"]), "b");
  assert.strictEqual(parseHostArgv(["--host", "a", "--host=b"]), "b");
});

test("crawl.parseHostArgv: a --host with no address is ignored", async () => {
  const { parseHostArgv } = await import("../../../src/crawl/index.mjs");
  assert.strictEqual(parseHostArgv(["--host"]), undefined);
  assert.strictEqual(parseHostArgv(["a", "--host"]), undefined);
  assert.strictEqual(parseHostArgv([]), undefined);
});

test("crawl.main starts server and logs the url", async () => {
  const { main } = await import("../../../src/crawl/index.mjs");
  const prevPort = process.env.PORT;
  delete process.env.PORT;
  const origLog = console.log;
  let logged = null;
  console.log = (msg) => { logged = msg; };
  try {
    await main();
  } finally {
    console.log = origLog;
    if (prevPort !== undefined) process.env.PORT = prevPort;
    else delete process.env.PORT;
  }
  assert.ok(
    logged && logged.startsWith("Crawl is running at "),
    `expected log to start with "Crawl is running at ", got "${logged}"`
  );
});
