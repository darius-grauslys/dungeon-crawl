// The edge test for server: loop.

import { test } from "node:test";
import assert from "node:assert/strict";

import { start } from "../../../edges/edge_to_server.mjs";
import * as message from "../../../shapes/message/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";

const WS_URL = (port) => `ws://127.0.0.1:${port}/ws`;

class Client {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.queue = [];
    this.opened = new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(new Error("ws open error"));
    });
    this.ws.onmessage = (e) => { this.queue.push(message.parse(e.data)); };
  }

  send(m) { this.ws.send(m.text()); }

  close() { this.ws.close(); }

  async waitFor(kind, timeoutMs = 1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      for (let i = 0; i < this.queue.length; i++) {
        const m = this.queue[i];
        if (m.kind === "refused" && kind !== "refused") {
          throw new Error(`refused (${m.reason}) while waiting for ${kind}`);
        }
        if (m.kind === kind) {
          return this.queue.splice(i, 1)[0];
        }
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error(`timeout waiting for ${kind}`);
  }

  async drain(kind, timeoutMs = 1000) {
    const out = [];
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (this.queue.length > 0) {
        const m = this.queue.shift();
        if (m.kind === kind) { out.push(m); continue; }
      } else {
        await new Promise((r) => setTimeout(r, 10));
      }
    }
    return out;
  }
}

function findHero(world, name) {
  for (const h of world.heroes) { if (h.name === name) return h; }
  return null;
}

test("page: GET / answers 200 text/html", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const res = await fetch(srv.url);
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  await srv.close();
});

test("create-join", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const client = new Client(WS_URL(srv.port));
  await client.opened;
  client.send(message.create(null));
  const created = await client.waitFor("created");
  assert.match(created.session, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  assert.match(created.password, /^[abcdefghjkmnpqrstuvwxyz23456789]{6}$/);
  client.send(message.join(created.session, created.password, "Ann"));
  const joined = await client.waitFor("joined");
  assert.strictEqual(joined.session, created.session);
  assert.strictEqual(joined.name, "Ann");
  const state = await client.waitFor("state");
  assert.strictEqual(state.world.depth, 1);
  assert.strictEqual(state.world.state, "playing");
  assert.strictEqual(state.paused, false);
  const hero = findHero(state.world, "Ann");
  assert.ok(hero);
  assert.strictEqual(hero.alive, true);
  assert.strictEqual(hero.actor.stats.hp, 24);
  assert.strictEqual(hero.actor.stats.maxHp, 24);
  client.close();
  await srv.close();
});

test("refusals", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const client = new Client(WS_URL(srv.port));
  await client.opened;
  client.send(message.create(null));
  const created = await client.waitFor("created");
  const bad = new Client(WS_URL(srv.port));
  await bad.opened;
  bad.send(message.join(created.session, "wrong", "Ann"));
  const r1 = await bad.waitFor("refused");
  assert.strictEqual(r1.reason, "bad-password");
  bad.close();

  const noSession = new Client(WS_URL(srv.port));
  await noSession.opened;
  noSession.send(message.join("ZZZZZZ", "x", "Ann"));
  const r2 = await noSession.waitFor("refused");
  assert.strictEqual(r2.reason, "no-session");
  noSession.close();

  const unjoined = new Client(WS_URL(srv.port));
  await unjoined.opened;
  unjoined.send(message.act(intent.wait()));
  const r3 = await unjoined.waitFor("refused");
  assert.strictEqual(r3.reason, "not-joined");
  unjoined.close();

  const malformed = new Client(WS_URL(srv.port));
  await malformed.opened;
  malformed.ws.send("nonsense");
  const r4 = await malformed.waitFor("refused");
  assert.strictEqual(r4.reason, "malformed");
  malformed.send(message.create(null));
  const created2 = await malformed.waitFor("created");
  assert.ok(created2.session);
  malformed.close();
  await srv.close();
});

test("at-most-four", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const clients = [];
  for (let i = 0; i < 4; i++) {
    const c = new Client(WS_URL(srv.port));
    await c.opened;
    c.send(message.create(null));
    const c2 = await c.waitFor("created");
    clients.push({ c, created: c2 });
  }
  const fifth = new Client(WS_URL(srv.port));
  await fifth.opened;
  fifth.send(message.create(null));
  const r = await fifth.waitFor("refused");
  assert.strictEqual(r.reason, "full");
  for (const { c } of clients) c.close();
  fifth.close();
  await srv.close();
});

test("party", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const c1 = new Client(WS_URL(srv.port));
  await c1.opened;
  c1.send(message.create(null));
  const created = await c1.waitFor("created");
  c1.send(message.join(created.session, created.password, "Ann"));
  await c1.waitFor("joined");

  const c2 = new Client(WS_URL(srv.port));
  await c2.opened;
  c2.send(message.join(created.session, created.password, "Bob"));
  await c2.waitFor("joined");

  let s1 = null;
  const startParty = Date.now();
  while (Date.now() - startParty < 1000) {
    s1 = await c1.waitFor("state");
    if (findHero(s1.world, "Ann") && findHero(s1.world, "Bob")) break;
  }
  assert.ok(s1, "state with both heroes on c1");
  assert.ok(findHero(s1.world, "Ann"));
  assert.ok(findHero(s1.world, "Bob"));

  let s2 = null;
  const startParty2 = Date.now();
  while (Date.now() - startParty2 < 1000) {
    s2 = await c2.waitFor("state");
    if (findHero(s2.world, "Ann") && findHero(s2.world, "Bob")) break;
  }
  assert.ok(s2, "state with both heroes on c2");
  assert.ok(findHero(s2.world, "Ann"));
  assert.ok(findHero(s2.world, "Bob"));

  const c3 = new Client(WS_URL(srv.port));
  await c3.opened;
  c3.send(message.join(created.session, created.password, "Ann"));
  const r = await c3.waitFor("refused");
  assert.strictEqual(r.reason, "name-taken");
  c3.close();

  c1.close();
  await new Promise((r) => setTimeout(r, 100));
  const c4 = new Client(WS_URL(srv.port));
  await c4.opened;
  c4.send(message.join(created.session, created.password, "Ann"));
  const j = await c4.waitFor("joined");
  assert.strictEqual(j.name, "Ann");
  c4.close();
  c2.close();
  await srv.close();
});

test("acts", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const client = new Client(WS_URL(srv.port));
  await client.opened;
  client.send(message.create(null));
  const created = await client.waitFor("created");
  client.send(message.join(created.session, created.password, "Ann"));
  await client.waitFor("joined");

  let dx = 0, dy = 0;
  let x = 0, y = 0;
  const startPick = Date.now();
  while (Date.now() - startPick < 1000) {
    const s = await client.waitFor("state");
    const world = s.world;
    const hero = findHero(world, "Ann");
    x = hero.actor.pos.x;
    y = hero.actor.pos.y;
    const grid = world.grid;
    const hasMonster = (gx, gy) => world.monsters.some(m => m.pos.x === gx && m.pos.y === gy);
    const pick = (gx, gy) => grid.open(gx, gy) && !hasMonster(gx, gy);
    if (pick(x + 1, y)) { dx = 1; dy = 0; break; }
    else if (pick(x - 1, y)) { dx = -1; dy = 0; break; }
    else if (pick(x, y + 1)) { dx = 0; dy = 1; break; }
    else if (pick(x, y - 1)) { dx = 0; dy = -1; break; }
  }
  assert.ok(dx !== 0 || dy !== 0, "a free direction was found");

  client.send(message.act(intent.move(dx, dy)));
  const targetX = x + dx;
  const targetY = y + dy;
  let moved = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 1000) {
    const s = await client.waitFor("state");
    const h = findHero(s.world, "Ann");
    if (h && h.actor.pos.x === targetX && h.actor.pos.y === targetY) { moved = s; break; }
  }
  assert.ok(moved, "Ann moved to target cell within a second");
  const hero2 = findHero(moved.world, "Ann");
  assert.strictEqual(hero2.actor.pos.x, targetX);
  assert.strictEqual(hero2.actor.pos.y, targetY);
  client.close();
  await srv.close();
});

test("pause", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const client = new Client(WS_URL(srv.port));
  await client.opened;
  client.send(message.create(null));
  const created = await client.waitFor("created");
  client.send(message.join(created.session, created.password, "Ann"));
  await client.waitFor("joined");
  await client.waitFor("state");
  client.send(message.pause(true));
  let sp = null;
  const startPause = Date.now();
  while (Date.now() - startPause < 1000) {
    const s = await client.waitFor("state");
    if (s.paused) { sp = s; break; }
  }
  assert.ok(sp, "state with paused true");
  const t0 = sp.world.time;
  await new Promise((r) => setTimeout(r, 300));
  const states = await client.drain("state", 300);
  for (const s of states) assert.strictEqual(s.world.time, t0);
  client.send(message.pause(false));
  let sg = null;
  const startResume = Date.now();
  while (Date.now() - startResume < 1000) {
    const s = await client.waitFor("state");
    if (!s.paused) { sg = s; break; }
  }
  assert.ok(sg, "state with paused false");
  assert.strictEqual(sg.paused, false);
  const more = await client.drain("state", 300);
  for (const s of more) assert.ok(s.world.time > t0, "time grows after resume");
  client.close();
  await srv.close();
});

test("save-load", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const client = new Client(WS_URL(srv.port));
  await client.opened;
  client.send(message.create(null));
  const created = await client.waitFor("created");
  client.send(message.join(created.session, created.password, "Ann"));
  await client.waitFor("joined");
  client.send(message.requestSave());
  const saved = await client.waitFor("saved");
  assert.strictEqual(saved.save.depth, 1);
  assert.strictEqual(saved.save.players.length, 1);
  assert.strictEqual(saved.save.players[0].name, "Ann");
  assert.deepStrictEqual(saved.save.players[0].stats, { hp: 24, maxHp: 24, attack: 4, defense: 1 });

  const saveObj = save.of({seed: 9, depth: 3, players: [{name: "Cy", stats: stats.of({hp: 10, maxHp: 30, attack: 6, defense: 2})}]});
  const client2 = new Client(WS_URL(srv.port));
  await client2.opened;
  client2.send(message.create(saveObj));
  const created2 = await client2.waitFor("created");
  client2.send(message.join(created2.session, created2.password, "Cy"));
  await client2.waitFor("joined");
  const state = await client2.waitFor("state");
  assert.strictEqual(state.world.depth, 3);
  const hero = findHero(state.world, "Cy");
  assert.ok(hero);
  assert.strictEqual(hero.actor.stats.hp, 10);
  assert.strictEqual(hero.actor.stats.maxHp, 30);
  client.close();
  client2.close();
  await srv.close();
});

test("idle", async () => {
  const srv = await start({ port: 0, root: process.cwd(), idle: 300 });
  const client = new Client(WS_URL(srv.port));
  await client.opened;
  client.send(message.create(null));
  const created = await client.waitFor("created");
  client.close();
  await new Promise((r) => setTimeout(r, 600));
  const joinClient = new Client(WS_URL(srv.port));
  await joinClient.opened;
  joinClient.send(message.join(created.session, created.password, "Ann"));
  const r = await joinClient.waitFor("refused");
  assert.strictEqual(r.reason, "no-session");
  joinClient.close();
  for (let i = 0; i < 4; i++) {
    const c = new Client(WS_URL(srv.port));
    await c.opened;
    c.send(message.create(null));
    const c2 = await c.waitFor("created");
    assert.ok(c2.session);
    c.close();
  }
  await srv.close();
});

test("closes", async () => {
  const srv = await start({ port: 0, root: process.cwd() });
  const p = srv.port;
  await srv.close();
  const res = await fetch(`http://127.0.0.1:${p}/`).catch((e) => e);
  assert.ok(res instanceof Error || res.status >= 400);
});
