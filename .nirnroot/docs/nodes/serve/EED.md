# serve

The game's one port: over HTTP it answers the page, the game's code
bundled for the browser, and the asset area; at `/ws` it holds the pages'
WebSocket connections, text frames in and text frames out. It knows
nothing of what the texts mean: its parent drains what arrived and sends
what it has to. Runs in Node.

| path | answer |
|---|---|
| `/` | 200, `text/html; charset=utf-8`: the page (below) |
| `/game.js` | 200, `text/javascript; charset=utf-8`: the bundle |
| `/assets/<path>` | 200, the file `<root>/assets/<path>`, typed by its extension (`.png` `image/png`, `.json` `application/json`, `.txt` `text/plain; charset=utf-8`, `.mp3` `audio/mpeg`, anything else `application/octet-stream`) |
| `/ws`, as a WebSocket upgrade | 101: a new connection |
| anything else, a missing file, or a path that would leave `<root>/assets/` | 404 |

Only `GET` (and `HEAD`) are answered; any other method is 405.

The page is a complete HTML document titled `Crawl`, with a dark
background (`#160d13`), one `<canvas width="960" height="720">` centred,
drawn pixelated (`image-rendering: pixelated`), and one module script:
`import { start } from '/game.js'; start(document);`.

The bundle is `<root>/edges/edge_to_play.mjs` with all it imports,
bundled by `esbuild` (`bundle: true, format: 'esm', platform: 'browser'`)
when the server starts, so it exports `start`.

Connections are numbered from 1 in the order they are accepted, and a
number is never used again by the same server.

# API Shapes:
None

# Functions:
## Function - serve:
`serve({port, root, host}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory; `host` (left out: every interface) a non-empty string, the address to listen on (`'0.0.0.0'`, `'127.0.0.1'`, a machine's address). Left out, it listens on every interface (so other machines of the network can play). Resolves, once listening, to a handle: `port`, the port it listens on; `url`, `http://<host>:<port>/` with the `host` given, or `http://127.0.0.1:<port>/` with none; `drain()`, every text frame received since the last `drain`, in arrival order, as `[connection, text]` pairs; `closed()`, the connections that closed since the last call, for any reason, each once; `send(connection, text)`, one text frame to that connection (a no-op for one that is closed or unknown); `end(connection)`, closing that connection (close code 1000; it then appears in `closed()`; a no-op for one not open); and `close()`, answering a promise that resolves once every connection (close code 1001) and the listener have closed. Rejects if the bundle fails to build or the port can't be had.

# Intrinsics:
## Intrinsic - page:
`GET /` answers 200, a `text/html` content type, and a body containing `<canvas`, `width="960"`, `height="720"` and `/game.js`.

## Intrinsic - bundle:
`GET /game.js` answers 200, a `text/javascript` content type, and a non-empty body that matches `/export\s*\{[^}]*\bstart\b/` (its length depends on how much of `play` is implemented, so no length is asked).

## Intrinsic - assets:
`GET /assets/sheets/heroes.png` answers 200, `image/png`, and exactly the bytes of `<root>/assets/sheets/heroes.png`; `GET /assets/sfx/coin.mp3` answers 200, `audio/mpeg`, and exactly the bytes of `<root>/assets/sfx/coin.mp3`.

## Intrinsic - not-found:
`GET /nope`, `GET /assets/none.png`, `GET /assets/../package.json` (sent as written, not normalised: use `http.request` with that `path`) and `GET /assets/%2e%2e/package.json` answer 404; `POST /` answers 405.

## Intrinsic - connections:
Two WebSocket clients connecting to `/ws` are connections 1 and 2; a text `hello` sent by the second comes out of `drain()` as `[2, 'hello']` (and the next `drain()` is empty); `send(1, 'hi')` arrives at the first client as `hi` and at the second not at all. A text of 70000 characters sent either way arrives whole.

## Intrinsic - closed:
A client that closes appears in `closed()` exactly once; one closed with `end` too, and its client sees the socket close.

## Intrinsic - host:
`serve({port: 0, root, host: '127.0.0.1'})` resolves with a `url` of `http://127.0.0.1:<port>/`, and `GET /` on it answers 200; with `host: '0.0.0.0'`, the `url` is `http://0.0.0.0:<port>/` and `GET /` on `http://127.0.0.1:<port>/` answers 200; with no `host`, the `url` is `http://127.0.0.1:<port>/`. `host: ''` and `host: 5` reject (or throw) a `TypeError`. Close each handle.

## Intrinsic - closes:
After `close()` resolves, an open client has seen its socket close, and a request to the port fails to connect.
