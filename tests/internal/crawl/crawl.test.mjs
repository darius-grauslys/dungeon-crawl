import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

test("crawl.main starts the server, prints the line, and answers 200 for /", async () => {
  const child = spawn(process.execPath, ["bin/dungeon-game.mjs"], {
    env: { ...process.env, PORT: "0" },
    stdio: "pipe",
  });
  let out = "";
  let err = "";

  const lineRe = /Crawl is running at http:\/\/127\.0\.0\.1:(\d+)\//;
  let port = null;

  const waitForLine = new Promise((resolve) => {
    const timer = setTimeout(resolve, 15000);
    child.stdout.on("data", (d) => {
      out += d.toString();
      const m = lineRe.exec(out);
      if (m) { port = Number(m[1]); clearTimeout(timer); resolve(); }
    });
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.on("exit", () => { clearTimeout(timer); resolve(); });
  });

  await waitForLine;

  if (port === null) {
    assert.fail(`the launcher did not print the running line; stderr: ${err.slice(0, 500)}`);
  }

  const resp = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(resp.status, 200, "GET / returns 200");

  child.kill();
});
