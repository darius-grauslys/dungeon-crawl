// crawl: a stub, seeded by nirnroot. Its implementation replaces it.

import * as serve from "../../edges/edge_to_serve.mjs";

// `main() -> promise`. Starts `serve` on the port of the `PORT` environment variable (an integer; unset or not an integer: 8000) with the project's directory (the current directory) as `root`, then prints `Crawl is running at <url>` (the server's `url`) to standard output, and resolves. The server keeps the process alive.
export async function main() {
  const portRaw = process.env.PORT;
  const port = (() => {
    if (portRaw === undefined) return 8000;
    const n = Number(portRaw);
    if (!Number.isInteger(n)) return 8000;
    return n;
  })();
  const { url } = await serve.serve({ port, root: process.cwd() });
  console.log(`Crawl is running at ${url}`);
}
