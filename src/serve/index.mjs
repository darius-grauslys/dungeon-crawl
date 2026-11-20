// serve: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `serve({port, root}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory. Listens on `127.0.0.1`. Resolves, once listening, to `{port, url, close}`: the port it listens on, `url` `http://127.0.0.1:<port>/`, and `close()`, answering a promise that resolves once the server has stopped. Rejects if the bundle fails to build or the port can't be had. */
export function serve(...args) {
  throw new Error("not implemented: serve.serve");
}
