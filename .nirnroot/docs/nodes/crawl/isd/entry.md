# crawl: `entry`

`main` reads `process.env.PORT`, calls `serve.serve({port, root:
process.cwd()})`, awaits it, logs the line with `console.log`, and
returns. If `serve` rejects, the rejection propagates (the launcher shows
it). `play` is the server's to bundle for the browser: the root never
calls it.

This Node's edge:

- [eed:crawl](../EED.md)

Children this specification reaches:

- [eed:serve](../../serve/EED.md)
- [eed:play](../../play/EED.md)

# API Shapes:
None

# Inbound Side-Effects:
The `PORT` environment variable and the current directory.

# Outbound Side-Effects:
One line on standard output; the server it starts.
