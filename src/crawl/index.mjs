// crawl: the root Node of the Crawl game.

/** `main() -> promise`. Starts `server` on the port of the `PORT` environment variable (an integer; unset or not an integer: 8000) with the project's directory (the current directory) as `root`, then prints `Crawl is running at <url>` (the server's `url`) to standard output, and resolves. The server keeps the process alive. */
export async function main() {
  const portRaw = process.env.PORT;
  let port = 8000;
  if (portRaw !== undefined) {
    const parsed = Number.parseInt(portRaw, 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 65535) {
      port = parsed;
    }
  }
  const server = await import("../../edges/edge_to_server.mjs");
  const result = await server.start({ port, root: process.cwd() });
  console.log(`Crawl is running at ${result.url}`);
}
