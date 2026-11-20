#!/usr/bin/env node
// dungeon-game: the launcher, seeded by nirnroot's Node profile. It imports the root
// Node's surface (src/crawl/index.mjs) and calls its `main`; the root's EED says what
// `main` does. No agent writes this file. Run: `npm start -- [args]` or
// `node bin/dungeon-game.mjs [args]`.

import * as root from "../src/crawl/index.mjs";

if (typeof root.main !== "function") {
  console.error("dungeon-game: the root Node `crawl` exports no `main`: give its EED a Function `main` and implement it");
  process.exitCode = 2;
} else {
  await root.main();
}
