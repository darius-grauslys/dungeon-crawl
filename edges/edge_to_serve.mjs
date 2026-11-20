// The call site for serve: forwards to its surface, nothing else.
// serve's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/serve/index.mjs";

// __nirnroot_begin__ serve
// `serve({port, root}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory. Listens on `127.0.0.1`. Resolves, once listening, to `{port, url, close}`: the port it listens on, `url` `http://127.0.0.1:<port>/`, and `close()`, answering a promise that resolves once the server has stopped. Rejects if the bundle fails to build or the port can't be had.
// __nirnroot_end__
export function serve(...args) {
  return target.serve(...args);
}
