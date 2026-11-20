# serve: `http`

`node:http`'s `createServer`. Build the bundle first with esbuild's
`build({entryPoints: [path.join(root, 'edges/edge_to_play.mjs')], bundle:
true, format: 'esm', platform: 'browser', write: false})` and keep its
text; then listen. For `/assets/`, decode the rest of the path
(`decodeURIComponent`; a decoding error is 404), resolve it against
`<root>/assets/`, and answer 404 unless the resolved path is inside that
folder and is a regular file; read it with `node:fs/promises`. Write the
page as a constant string. `close()` also ends kept-alive connections
(`server.closeAllConnections()`), so it resolves promptly.

This Node's edge:

- [eed:serve](../EED.md)

# API Shapes:
None

# Inbound Side-Effects:
HTTP requests on the port; the files under `<root>/assets/`; the source
files the bundle is built from, read once at start.

# Outbound Side-Effects:
A listening socket on 127.0.0.1 until `close()`; HTTP responses.
