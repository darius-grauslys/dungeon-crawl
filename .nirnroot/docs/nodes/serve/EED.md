# serve

The game's web server: it answers the page, the game's code bundled for
the browser, and the asset area. Runs in Node.

| path | answer |
|---|---|
| `/` | 200, `text/html; charset=utf-8`: the page (below) |
| `/game.js` | 200, `text/javascript; charset=utf-8`: the bundle |
| `/assets/<path>` | 200, the file `<root>/assets/<path>`, typed by its extension (`.png` `image/png`, `.json` `application/json`, `.txt` `text/plain; charset=utf-8`, anything else `application/octet-stream`) |
| anything else, a missing file, or a path that would leave `<root>/assets/` | 404 |

Only `GET` (and `HEAD`) are answered; any other method is 405.

The page is a complete HTML document titled `Crawl`, with a dark
background (`#160d13`), one `<canvas width="960" height="720">` centred,
drawn pixelated (`image-rendering: pixelated`), and one module script:
`import { start } from '/game.js'; start(document);`.

The bundle is `<root>/edges/edge_to_play.mjs` with all it imports,
bundled by `esbuild` (`bundle: true, format: 'esm', platform: 'browser'`)
when the server starts, so it exports `start`.

# API Shapes:
None

# Functions:
## Function - serve:
`serve({port, root}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory. Listens on `127.0.0.1`. Resolves, once listening, to `{port, url, close}`: the port it listens on, `url` `http://127.0.0.1:<port>/`, and `close()`, answering a promise that resolves once the server has stopped. Rejects if the bundle fails to build or the port can't be had.

# Intrinsics:
## Intrinsic - page:
`GET /` answers 200, a `text/html` content type, and a body containing `<canvas`, `width="960"`, `height="720"` and `/game.js`.

## Intrinsic - bundle:
`GET /game.js` answers 200, a `text/javascript` content type, and a body of more than 1000 characters that matches `/export\s*\{[^}]*\bstart\b/`.

## Intrinsic - assets:
`GET /assets/sheets/heroes.png` answers 200, `image/png`, and exactly the bytes of `<root>/assets/sheets/heroes.png`.

## Intrinsic - not-found:
`GET /nope`, `GET /assets/none.png`, `GET /assets/../package.json` (sent as written, not normalised: use `http.request` with that `path`) and `GET /assets/%2e%2e/package.json` answer 404; `POST /` answers 405.

## Intrinsic - closes:
After `close()` resolves, a request to the port fails to connect.
