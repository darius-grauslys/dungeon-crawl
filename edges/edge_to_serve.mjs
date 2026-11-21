// The call site for serve: forwards to its surface, nothing else.
// serve's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/serve/index.mjs";

// __nirnroot_begin__ serve
// `serve({port, root}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory. Listens on every interface (so other machines of the network can play). Resolves, once listening, to a handle: `port`, the port it listens on; `url`, `http://127.0.0.1:<port>/`; `drain()`, every text frame received since the last `drain`, in arrival order, as `[connection, text]` pairs; `closed()`, the connections that closed since the last call, for any reason, each once; `send(connection, text)`, one text frame to that connection (a no-op for one that is closed or unknown); `end(connection)`, closing that connection (close code 1000; it then appears in `closed()`; a no-op for one not open); and `close()`, answering a promise that resolves once every connection (close code 1001) and the listener have closed. Rejects if the bundle fails to build or the port can't be had.
// __nirnroot_end__
export function serve(...args) {
  return target.serve(...args);
}
