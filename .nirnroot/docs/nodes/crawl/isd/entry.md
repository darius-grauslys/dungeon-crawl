# crawl: `entry`

`main` reads `process.env.PORT` (`Number.parseInt`; anything that isn't an
integer from 0 to 65535 gives 8000), reads `--host` from `process.argv.slice(2)` (`--host <a>` or
`--host=<a>`; the last one given wins; a `--host` with no address is
ignored), calls `server.start({port, root: process.cwd(), host})` (`host`
only when given), awaits it, logs the line with `console.log`, and
returns. If `start` rejects, the rejection propagates (the launcher shows
it). `play` is what the server bundles for the browser: the root never
calls it.

This Node's edge:

- [eed:crawl](../EED.md)

Children this specification reaches:

- [eed:server](../../server/EED.md)
- [eed:play](../../play/EED.md)

# API Shapes:
None

# Inbound Side-Effects:
The `PORT` environment variable, the command line's arguments and the current directory.

# Outbound Side-Effects:
One line on standard output; the server it starts.
