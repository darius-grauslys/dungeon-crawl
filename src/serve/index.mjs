import { createServer } from "node:http";
import path from "node:path";
import { stat, readFile } from "node:fs/promises";
import esbuild from "esbuild";

const PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Crawl</title>
<style>
html, body { margin: 0; padding: 0; background: #160d13; overflow: hidden; }
canvas { display: block; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 960px; height: 720px; image-rendering: pixelated; }
</style>
</head>
<body>
<canvas width="960" height="720"></canvas>
<script type="module">import { start } from '/game.js'; start(document);</script>
</body>
</html>`;

const MIME = {
  ".png": "image/png",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

function mimeFor(name) {
  const ext = path.extname(name).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

/** `serve({port, root}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory. Listens on `127.0.0.1`. Resolves, once listening, to `{port, url, close}`: the port it listens on, `url` `http://127.0.0.1:<port>/`, and `close()`, answering a promise that resolves once the server has stopped. Rejects if the bundle fails to build or the port can't be had. */
export async function serve({ port, root }) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("port must be an integer from 0 to 65535");
  }

  const build = await esbuild.build({
    entryPoints: [path.join(root, "edges/edge_to_play.mjs")],
    bundle: true,
    format: "esm",
    platform: "browser",
    write: false,
  });
  const bundle = build.outputFiles[0].text;

  const server = createServer(async (req, res) => {
    const method = req.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }

    const url = req.url || "/";

    if (url === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(method === "HEAD" ? undefined : PAGE);
      return;
    }

    if (url === "/game.js") {
      res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      res.end(method === "HEAD" ? undefined : bundle);
      return;
    }

    if (url.startsWith("/assets/")) {
      const rest = url.slice("/assets/".length);
      let decoded;
      try {
        decoded = decodeURIComponent(rest);
      } catch {
        res.writeHead(404);
        res.end();
        return;
      }
      const resolved = path.resolve(root, "assets", decoded);
      const assetsDir = path.resolve(root, "assets");
      if (!resolved.startsWith(assetsDir + path.sep)) {
        res.writeHead(404);
        res.end();
        return;
      }
      try {
        const st = await stat(resolved);
        if (!st.isFile()) {
          res.writeHead(404);
          res.end();
          return;
        }
        const data = await readFile(resolved);
        res.writeHead(200, { "content-type": mimeFor(resolved) });
        res.end(method === "HEAD" ? undefined : data);
        return;
      } catch {
        res.writeHead(404);
        res.end();
        return;
      }
    }

    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve, reject) => {
    server.on("error", (err) => {
      reject(err);
    });
    server.listen(port || 0, "127.0.0.1", () => {
      const addr = server.address();
      const p = addr && typeof addr.port === "number" ? addr.port : port;
      resolve({
        port: p,
        url: `http://127.0.0.1:${p}/`,
        close: () => new Promise((res, rej) => {
          try { server.closeAllConnections?.(); } catch {}
          server.close((err) => { if (err) rej(err); else res(); });
        }),
      });
    });
  });
}
