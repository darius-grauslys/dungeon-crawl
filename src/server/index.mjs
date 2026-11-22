// server: the authority. It starts serve, keeps a sessions table and one
// world per session, and runs the loop: every 50 ms it drains, answers
// messages, advances unpaused sessions, expires idle sessions and sends
// changed states.

import { serve } from "../../edges/edge_to_serve.mjs";
import { table as sessionsTable } from "../../edges/edge_to_sessions.mjs";
import { newGame, fromSave, toSave, join, intend, advance } from "../../edges/edge_to_rules.mjs";
import * as messageShape from "../../shapes/message/index.mjs";
import { getRandomValues } from "node:crypto";

const MAX_SEED = 4294967295;

function randomSeed() {
  const buf = new Uint32Array(1);
  try {
    getRandomValues(buf);
    return buf[0] % (MAX_SEED + 1);
  } catch {
    return Math.floor(Math.random() * (MAX_SEED + 1));
  }
}

/** `start({port, root, idle, host}) -> promise`. `port` an integer from 0 to 65535 (0: any free port); `root` the project's directory; `idle` the milliseconds a session may go without activity (left out: 1800000, thirty minutes); `host` (left out: none) the address to listen on, handed to `serve` as it is. Starts `serve` on that port, root and host, then the loop. Resolves to `{port, url, close}`: `serve`'s port and url, and `close()`, answering a promise that resolves once the loop and the server have stopped. Rejects as `serve` does. */
export async function start({ port = 0, root, idle = 1800000, host }) {
  const handle = host === undefined ? await serve({ port, root }) : await serve({ port, root, host });
  const t = sessionsTable({ idle });
  const worlds = new Map();
  const sent = new Map(); // connection -> { world, paused }

  const interval = setInterval(iterate, 50);

  async function close() {
    clearInterval(interval);
    await handle.close();
  }

  function iterate() {
    const now = Date.now();

    // 1. Inbound.
    const dr = handle.drain();
    for (const [connection, text] of dr) {
      let msg;
      try {
        msg = messageShape.parse(text);
      } catch {
        msg = null;
      }
      if (!msg || !msg.upward) {
        handle.send(connection, messageShape.refused("malformed").text());
        continue;
      }

      try {
        switch (msg.kind) {
          case "list": {
            const sessions = t.ids().map((id) => ({
              session: id,
              players: t.members(id).map((m) => m.name),
              depth: worlds.get(id).depth,
            }));
            handle.send(connection, JSON.stringify({ kind: "lobby", sessions }));
            break;
          }
          case "create": {
            const id = t.create(now);
            if (id === null) {
              handle.send(connection, messageShape.refused("full").text());
            } else {
              const seed = randomSeed();
              const w = msg.save ? fromSave(msg.save) : newGame(seed);
              worlds.set(id, w);
              handle.send(connection, JSON.stringify({ kind: "created", session: id }));
            }
            break;
          }
          case "join": {
            const reason = t.join(connection, msg.session, msg.name, now);
            if (reason !== null) {
              handle.send(connection, messageShape.refused(reason).text());
            } else {
              const next = join(worlds.get(msg.session), msg.name);
              if (next === null) {
                t.leave(connection);
                handle.send(connection, messageShape.refused("party-full").text());
              } else {
                worlds.set(msg.session, next);
                handle.send(connection, messageShape.joined(msg.session, msg.name).text());
                sent.delete(connection);
              }
            }
            break;
          }
          case "act": {
            const member = t.member(connection);
            if (!member) {
              handle.send(connection, messageShape.refused("not-joined").text());
            } else {
              t.touch(member.session, now);
              const w = worlds.get(member.session);
              worlds.set(member.session, intend(w, member.name, msg.intent));
            }
            break;
          }
          case "pause": {
            const member = t.member(connection);
            if (!member) {
              handle.send(connection, messageShape.refused("not-joined").text());
            } else {
              t.touch(member.session, now);
              t.setPaused(member.session, msg.paused);
            }
            break;
          }
          case "save": {
            const member = t.member(connection);
            if (!member) {
              handle.send(connection, messageShape.refused("not-joined").text());
            } else {
              t.touch(member.session, now);
              handle.send(connection, messageShape.saved(toSave(worlds.get(member.session))).text());
            }
            break;
          }
          default:
            handle.send(connection, messageShape.refused("malformed").text());
        }
      } catch (err) {
        console.error(err);
      }
    }

    for (const connection of handle.closed()) {
      t.leave(connection);
      sent.delete(connection);
    }

    // 2. Advance.
    for (const id of t.ids()) {
      if (t.paused(id)) continue;
      try {
        worlds.set(id, advance(worlds.get(id), 50));
      } catch (err) {
        console.error(err);
      }
    }

    // 3. Expire.
    for (const id of t.expire(now)) {
      worlds.delete(id);
    }

    // 4. Send.
    for (const id of t.ids()) {
      const paused = t.paused(id);
      for (const { connection } of t.members(id)) {
        const w = worlds.get(id);
        const last = sent.get(connection);
        if (!last || w !== last.world || paused !== last.paused) {
          handle.send(connection, messageShape.state(w, paused).text());
          sent.set(connection, { world: w, paused });
        }
      }
    }
  }

  return { port: handle.port, url: handle.url, close };
}
