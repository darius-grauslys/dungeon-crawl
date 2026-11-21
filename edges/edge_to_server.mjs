// The call site for server: forwards to its surface, nothing else.
// server's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/server/index.mjs";

// __nirnroot_begin__ start
// `start({port, root, idle}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory; `idle` the milliseconds a session may go without activity (left out: 1800000, thirty minutes). Starts `serve` on that port and root, then the loop. Resolves to `{port, url, close}`: `serve`'s port and url, and `close()`, answering a promise that resolves once the loop and the server have stopped. Rejects as `serve` does.
// __nirnroot_end__
export function start(...args) {
  return target.start(...args);
}
