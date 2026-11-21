import { createServer } from "node:http";
import path from "node:path";
import { stat, readFile } from "node:fs/promises";
import esbuild from "esbuild";
import crypto from "node:crypto";

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

// --- WebSocket frame helpers (RFC 6455, server side, text only) ---

function parseFrame(buffer) {
  if (buffer.length < 2) return null;
  const byte0 = buffer[0];
  const byte1 = buffer[1];
  const fin = (byte0 & 0x80) !== 0;
  const opcode = byte0 & 0x0f;
  const masked = (byte1 & 0x80) !== 0;
  let length = byte1 & 0x7f;
  let offset = 2;
  if (length === 126) {
    if (buffer.length < 4) return null;
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    if (buffer.length < 10) return null;
    length = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }
  let mask = null;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    mask = buffer.slice(offset, offset + 4);
    offset += 4;
  }
  if (buffer.length < offset + length) return null;
  const payload = buffer.slice(offset, offset + length);
  let data = payload;
  if (masked && mask) {
    const unmasked = Buffer.allocUnsafe(length);
    for (let i = 0; i < length; i++) {
      unmasked[i] = payload[i] ^ mask[i % 4];
    }
    data = unmasked;
  }
  return { fin, opcode, data, totalBytes: offset + length };
}

function encodeFrame(opcode, text) {
  const payload = Buffer.from(text, "utf8");
  const length = payload.length;
  const header = Buffer.alloc(2);
  header[0] = 0x80 | opcode;
  if (length < 126) {
    header[1] = length;
    return Buffer.concat([header, payload]);
  } else if (length <= 65535) {
    header[1] = 126;
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(length, 0);
    return Buffer.concat([header, buf, payload]);
  } else {
    header[1] = 127;
    const buf = Buffer.alloc(8);
    const hi = Math.floor(length / 4294967296);
    const lo = length - hi * 4294967296;
    buf.writeUInt32BE(hi, 0);
    buf.writeUInt32BE(lo, 4);
    return Buffer.concat([header, buf, payload]);
  }
}

function encodeCloseFrame(code) {
  const payload = Buffer.alloc(2);
  payload.writeUInt16BE(code, 0);
  const header = Buffer.alloc(2);
  header[0] = 0x80 | 8;
  header[1] = 2;
  return Buffer.concat([header, payload]);
}

function encodePingPong(opcode, payload) {
  const p = payload || Buffer.alloc(0);
  const header = Buffer.alloc(2);
  header[0] = 0x80 | opcode;
  header[1] = p.length;
  return Buffer.concat([header, p]);
}

/** `serve({port, root}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory. Listens on every interface (so other machines of the network can play). Resolves, once listening, to a handle: `port`, the port it listens on; `url`, `http://127.0.0.1:<port>/`; `drain()`, every text frame received since the last `drain`, in arrival order, as `[connection, text]` pairs; `closed()`, the connections that closed since the last call, for any reason, each once; `send(connection, text)`, one text frame to that connection (a no-op for one that is closed or unknown); `end(connection)`, closing that connection (close code 1000; it then appears in `closed()`; a no-op for one not open); and `close()`, answering a promise that resolves once every connection (close code 1001) and the listener have closed. Rejects if the bundle fails to build or the port can't be had. */
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

  const connections = new Map(); // connNumber -> { socket, buffer, message, open }
  let nextConnection = 1;
  const inbox = [];
  const closedList = [];

  function markClosed(connNumber) {
    const conn = connections.get(connNumber);
    if (!conn) return;
    conn.open = false;
    if (!closedList.includes(connNumber)) closedList.push(connNumber);
    connections.delete(connNumber);
  }

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

  server.on("upgrade", (req, socket, head) => {
    const url = req.url || "";
    if (url !== "/ws") {
      socket.destroy();
      return;
    }
    const headers = req.headers;
    const upgrade = (headers.upgrade || "").toLowerCase();
    const key = headers["sec-websocket-key"] || headers["sec-webkit-key"];
    if (upgrade !== "websocket" || !key) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    const accept = crypto
      .createHash("sha1")
      .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
      .digest("base64");

    const res = [
      "HTTP/1.1 101 WebSocket Handshake",
      "Upgrade: websocket",
      "Connection: upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "",
      ""
    ].join("\r\n");

    socket.write(res);

    const connNumber = nextConnection++;
    const conn = { socket, buffer: Buffer.alloc(0), message: null, open: true };
    connections.set(connNumber, conn);

    socket.on("data", (chunk) => {
      conn.buffer = Buffer.concat([conn.buffer, chunk]);
      while (true) {
        const frame = parseFrame(conn.buffer);
        if (!frame) break;
        conn.buffer = conn.buffer.slice(frame.totalBytes);
        const { fin, opcode, data } = frame;

        if (opcode === 1 || opcode === 0) {
          if (conn.message === null) conn.message = Buffer.alloc(0);
          conn.message = Buffer.concat([conn.message, data]);
          if (fin) {
            const text = conn.message.toString("utf8");
            inbox.push([connNumber, text]);
            conn.message = null;
          }
        } else if (opcode === 9) {
          const pong = encodePingPong(10, data);
          conn.socket.write(pong);
        } else if (opcode === 10) {
          // ignore pong
        } else if (opcode === 8) {
          markClosed(connNumber);
          const closeFrame = encodeCloseFrame(1000);
          try { conn.socket.write(closeFrame); } catch {}
          try { conn.socket.end(); } catch {}
        } else if (opcode === 2) {
          markClosed(connNumber);
          const closeFrame = encodeCloseFrame(1003);
          try { conn.socket.write(closeFrame); } catch {}
          try { conn.socket.end(); } catch {}
        }
      }
    });

    socket.on("close", () => {
      markClosed(connNumber);
    });

    socket.on("error", () => {
      markClosed(connNumber);
    });
  });

  return new Promise((resolve, reject) => {
    server.on("error", (err) => {
      reject(err);
    });
    server.listen(port || 0, () => {
      const addr = server.address();
      const p = addr && typeof addr.port === "number" ? addr.port : port;
      resolve({
        port: p,
        url: `http://127.0.0.1:${p}/`,
        drain: () => {
          const items = inbox.slice();
          inbox.length = 0;
          return items;
        },
        closed: () => {
          const items = closedList.slice();
          closedList.length = 0;
          return items;
        },
        send: (connection, text) => {
          const conn = connections.get(connection);
          if (!conn || !conn.open) return;
          const frame = encodeFrame(1, text);
          try { conn.socket.write(frame); } catch {}
        },
        end: (connection) => {
          const conn = connections.get(connection);
          if (!conn || !conn.open) return;
          conn.open = false;
          if (!closedList.includes(connection)) closedList.push(connection);
          const closeFrame = encodeCloseFrame(1000);
          try { conn.socket.write(closeFrame); } catch {}
          const timer = setTimeout(() => {
            try { conn.socket.destroy(); } catch {}
          }, 1000);
          conn.socket.once("close", () => {
            clearTimeout(timer);
          });
        },
        close: () => new Promise((res, rej) => {
          const connNumbers = Array.from(connections.keys());
          for (const connNumber of connNumbers) {
            const conn = connections.get(connNumber);
            if (conn) {
              conn.open = false;
              if (!closedList.includes(connNumber)) closedList.push(connNumber);
              const closeFrame = encodeCloseFrame(1001);
              try { conn.socket.write(closeFrame); } catch {}
              try { conn.socket.destroy(); } catch {}
            }
          }
          try { server.closeAllConnections?.(); } catch {}
          server.close((err) => { if (err) rej(err); else res(); });
        }),
      });
    });
  });
}
