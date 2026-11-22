// crawl: the root Node of the Crawl game.

/** Parses `--host <address>` or `--host=<address>` from an argv array. The last one given wins; a `--host` with no address is ignored. Returns the host string, or `undefined` when none was given. */
export function parseHostArgv(argv) {
  let host = undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--host") {
      const next = argv[i + 1];
      if (next !== undefined) {
        host = next;
        i++;
      }
    } else if (arg.startsWith("--host=")) {
      host = arg.slice("--host=".length);
    }
  }
  return host;
}

/** `main() -> promise`. Starts `server` on the port of the `PORT` environment variable (an integer; unset or not an integer: 8000) with the project's directory (the current directory) as `root`, and, when the command line has `--host <address>` or `--host=<address>`, that address as its `host` (otherwise none: every interface), then prints `Crawl is running at <url>` (the server's `url`) to standard output, and resolves. The server keeps the process alive. */
export async function main() {
  const portRaw = process.env.PORT;
  let port = 8000;
  if (portRaw !== undefined) {
    const parsed = Number.parseInt(portRaw, 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 65535) {
      port = parsed;
    }
  }
  const host = parseHostArgv(process.argv.slice(2));
  const server = await import("../../edges/edge_to_server.mjs");
  const args = host !== undefined ? { port, root: process.cwd(), host } : { port, root: process.cwd() };
  const result = await server.start(args);
  console.log(`Crawl is running at ${result.url}`);
}
