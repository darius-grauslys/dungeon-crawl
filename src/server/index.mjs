// server: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `start({port, root, idle}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory; `idle` the milliseconds a session may go without activity (left out: 1800000, thirty minutes). Starts `serve` on that port and root, then the loop. Resolves to `{port, url, close}`: `serve`'s port and url, and `close()`, answering a promise that resolves once the loop and the server have stopped. Rejects as `serve` does. */
export function start(...args) {
  throw new Error("not implemented: server.start");
}
