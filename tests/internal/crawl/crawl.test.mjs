import test from "node:test";
import assert from "node:assert/strict";

test("crawl exports main as a function", async () => {
  const mod = await import("../../../src/crawl/index.mjs");
  assert.strictEqual(typeof mod.main, "function");
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
