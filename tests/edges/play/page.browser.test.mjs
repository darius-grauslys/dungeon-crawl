// play: edge test `page`. Browser tests for the play Node, reached only
// through its call site. One test per intrinsic of the EET page.

import test from "node:test";
import assert from "node:assert/strict";

import { start } from "../../../edges/edge_to_play.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as message from "../../../shapes/message/index.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as hero from "../../../shapes/hero/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as item from "../../../shapes/item/index.mjs";

// A fake socket factory: records the url, answers an object with send(text)
// (recording the texts), close(), and the onopen, onmessage, onclose,
// onerror properties net sets.
function makeSocketFactory() {
  let url;
  const texts = [];
  let socket = null;
  const open = (u) => {
    url = u;
    socket = {
      texts,
      send(text) { texts.push(text); },
      close() {},
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
    };
    return socket;
  };
  open.recordedUrl = () => url;
  open.recordedTexts = () => texts;
  open.socket = () => socket;
  return open;
}

// A recording download function.
function makeDownload() {
  const calls = [];
  const download = (filename, text) => { calls.push({ filename, text }); };
  download.calls = () => calls;
  return download;
}

// A small world: 5 by 3 grid, one hero Ann at (1, 1), one slime monster,
// one gold item, empty masks, entry the save of seed 1, depth 1, no players.
function makeWorld() {
  const grid = tileGrid.fromRows(['#####', '#...#', '#####']);
  const heroActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const heroShape = hero.of({ name: 'Ann', actor: heroActor });
  const monsterActor = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const goldItem = item.of({ id: 0, kind: 'gold', pos: point.of(3, 1), amount: 10 });
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  return world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: 'playing',
    grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem],
    visible, explored, gold: 0, log: [], entry
  });
}

function makeSave(depth) {
  return save.of({ seed: 1, depth, players: [] });
}

// Wait up to a half second for a condition to hold.
async function waitUntil(cond, ms = 500) {
  const start = performance.now();
  while (performance.now() - start < ms) {
    if (cond()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test("starts", () => {
  const open = makeSocketFactory();
  const h = start(document, { open });
  assert.equal(document.querySelectorAll("canvas").length, 1);
  assert.ok(document.getElementById("landing"));
  assert.equal(h.screen(), "landing");
  assert.equal(h.world(), null);
  assert.equal(h.me(), null);
  assert.equal(open.recordedUrl().endsWith("/ws"), true);

  const ev = new KeyboardEvent("keydown", { key: "w", cancelable: true });
  const prevented = !document.dispatchEvent(ev);
  assert.equal(prevented, false);

  h.stop();
});

test("creates", async () => {
  const open = makeSocketFactory();
  const h = start(document, { open });

  document.getElementById("landing-name").value = "Ann";
  document.getElementById("landing-create").click();

  const socket = open.socket();
  socket.onopen();

  await waitUntil(() => open.recordedTexts().length >= 1);
  assert.equal(open.recordedTexts()[0], message.create(null).text());

  socket.onmessage({ data: message.created('ABCDEF', 'xyz234').text() });
  await waitUntil(() => open.recordedTexts().length >= 2);
  assert.equal(open.recordedTexts()[1], message.join('ABCDEF', 'xyz234', 'Ann').text());

  socket.onmessage({ data: message.joined('ABCDEF', 'Ann').text() });
  await waitUntil(() => h.screen() === "game");
  assert.equal(h.screen(), "game");
  assert.equal(h.me(), "Ann");
  assert.equal(document.getElementById("landing"), null);

  const w = makeWorld();
  socket.onmessage({ data: message.state(w, false).text() });
  await waitUntil(() => h.world() !== null && h.world().time === w.time);
  assert.equal(h.world().time, w.time);

  h.stop();
});

test("refused", async () => {
  const open = makeSocketFactory();
  const h = start(document, { open });

  const socket = open.socket();
  socket.onopen();
  socket.onmessage({ data: message.refused('bad-password').text() });
  await waitUntil(() => document.getElementById("landing-error")?.textContent === "Wrong password.");

  assert.equal(document.getElementById("landing-error").textContent, "Wrong password.");
  assert.equal(h.screen(), "landing");

  h.stop();
});

test("keys", async () => {
  const open = makeSocketFactory();
  const h = start(document, { open });

  document.getElementById("landing-name").value = "Ann";
  document.getElementById("landing-create").click();

  const socket = open.socket();
  socket.onopen();

  await waitUntil(() => open.recordedTexts().length >= 1);
  assert.equal(open.recordedTexts()[0], message.create(null).text());

  socket.onmessage({ data: message.created('ABCDEF', 'xyz234').text() });
  await waitUntil(() => open.recordedTexts().length >= 2);
  assert.equal(open.recordedTexts()[1], message.join('ABCDEF', 'xyz234', 'Ann').text());

  socket.onmessage({ data: message.joined('ABCDEF', 'Ann').text() });
  await waitUntil(() => h.screen() === "game");

  const w = makeWorld();
  socket.onmessage({ data: message.state(w, false).text() });
  await waitUntil(() => h.world() !== null);

  let ev = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
  const prevented = !document.dispatchEvent(ev);
  assert.equal(prevented, true);
  assert.equal(open.recordedTexts()[open.recordedTexts().length - 1], message.act(intent.move(-1, 0)).text());

  ev = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true, shiftKey: true });
  document.dispatchEvent(ev);
  assert.equal(open.recordedTexts()[open.recordedTexts().length - 1], message.act(intent.attack(-1, 0)).text());

  ev = new KeyboardEvent("keydown", { key: "e", cancelable: true });
  document.dispatchEvent(ev);
  assert.equal(open.recordedTexts()[open.recordedTexts().length - 1], message.act(intent.use()).text());

  ev = new KeyboardEvent("keydown", { key: ">", cancelable: true, shiftKey: true });
  document.dispatchEvent(ev);
  assert.equal(open.recordedTexts()[open.recordedTexts().length - 1], message.act(intent.descend()).text());

  ev = new KeyboardEvent("keydown", { key: "p", cancelable: true });
  document.dispatchEvent(ev);
  assert.equal(open.recordedTexts()[open.recordedTexts().length - 1], message.pause(true).text());

  h.stop();
});

test("menu", async () => {
  const open = makeSocketFactory();
  const download = makeDownload();
  const h = start(document, { open, download });

  document.getElementById("landing-name").value = "Ann";
  document.getElementById("landing-create").click();

  const socket = open.socket();
  socket.onopen();

  await waitUntil(() => open.recordedTexts().length >= 1);
  assert.equal(open.recordedTexts()[0], message.create(null).text());

  socket.onmessage({ data: message.created('ABCDEF', 'xyz234').text() });
  await waitUntil(() => open.recordedTexts().length >= 2);
  assert.equal(open.recordedTexts()[1], message.join('ABCDEF', 'xyz234', 'Ann').text());

  socket.onmessage({ data: message.joined('ABCDEF', 'Ann').text() });
  await waitUntil(() => h.screen() === "game");

  const w = makeWorld();
  socket.onmessage({ data: message.state(w, false).text() });
  await waitUntil(() => h.world() !== null);

  let ev = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  document.dispatchEvent(ev);
  assert.equal(document.getElementById("menu").style.display !== "none", true);
  assert.equal(h.menuOpen(), true);
  const sessionText = document.getElementById("menu-session").textContent;
  assert.ok(sessionText.includes("ABCDEF"));
  assert.ok(sessionText.includes("xyz234"));

  ev = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
  document.dispatchEvent(ev);
  const before = open.recordedTexts().length;
  await waitUntil(() => open.recordedTexts().length === before);
  assert.equal(open.recordedTexts().length, before);

  document.getElementById("menu-save").click();
  assert.equal(open.recordedTexts()[open.recordedTexts().length - 1], message.requestSave().text());

  const s = makeSave(2);
  socket.onmessage({ data: message.saved(s).text() });
  await waitUntil(() => download.calls().length === 1);
  assert.equal(download.calls().length, 1);
  assert.equal(download.calls()[0].filename, "crawl-depth2.json");
  assert.equal(download.calls()[0].text, s.text());

  document.getElementById("menu-pause").click();
  assert.equal(open.recordedTexts()[open.recordedTexts().length - 1], message.pause(true).text());

  socket.onmessage({ data: message.state(w, true).text() });
  await waitUntil(() => document.getElementById("menu-pause").textContent === "Resume");
  assert.equal(document.getElementById("menu-pause").textContent, "Resume");

  document.getElementById("menu-back").click();
  await waitUntil(() => !h.menuOpen());
  assert.equal(h.menuOpen(), false);

  ev = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  document.dispatchEvent(ev);
  assert.equal(h.menuOpen(), true);
  ev = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  document.dispatchEvent(ev);
  assert.equal(h.menuOpen(), false);

  h.stop();
});

test("creates-canvas", () => {
  const doc = document.implementation.createHTMLDocument("t");
  const open = makeSocketFactory();
  const h = start(doc, { open });
  const canvases = doc.querySelectorAll("canvas");
  assert.equal(canvases.length, 1);
  assert.equal(canvases[0].width, 960);
  assert.equal(canvases[0].height, 720);
  assert.equal(doc.body.contains(canvases[0]), true);
  h.stop();
});

test("world/valid", () => {
  const grid = tileGrid.fromRows(['#####', '#...#', '#####']);
  const heroActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const heroShape = hero.of({ name: 'Ann', actor: heroActor });
  const monsterActor = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const goldItem = item.of({ id: 0, kind: 'gold', pos: point.of(3, 3), amount: 10 });
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth: 1, players: [] });

  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: 'playing',
    grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem],
    visible, explored, gold: 0, log: [], entry
  });

  assert.equal(w.seed, 1);
  assert.equal(w.rng, 1);
  assert.equal(w.depth, 1);
  assert.equal(w.time, 0);
  assert.equal(w.state, 'playing');
  assert.equal(w.gold, 0);
  assert.ok(w.grid === grid);
  assert.equal(w.heroes.length, 1);
  assert.ok(w.heroes[0] === heroShape);
  assert.equal(w.monsters.length, 1);
  assert.ok(w.monsters[0] === monsterActor);
  assert.equal(w.items.length, 1);
  assert.ok(w.items[0] === goldItem);
  assert.ok(w.visible === visible);
  assert.ok(w.explored === explored);
  assert.equal(w.log.length, 0);

  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.heroes));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));

  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'dead', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: [], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 6, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: [], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: -1, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: [], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible: mask.empty(4, 3), explored, gold: 0, log: [], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [heroActor], items: [goldItem], visible, explored, gold: 0, log: [], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape, heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: [], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: Array(51).fill('x'), entry }), TypeError);
  const noGold = { seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, log: [], entry };
  assert.throws(() => world.of(noGold), TypeError);
  const noEntry = { seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: [] };
  assert.throws(() => world.of(noEntry), TypeError);

  const w2 = w.with({ time: 9 });
  assert.equal(w2.time, 9);
  assert.equal(w.time, 0);

  const a = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: [], entry });
  const b = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem], visible, explored, gold: 0, log: [], entry });
  assert.deepStrictEqual(a, b);
  assert.equal(Object.hasOwn(w, 'with'), false);
  assert.equal(Object.hasOwn(w, 'data'), false);
});

test("world/data", () => {
  const grid = tileGrid.fromRows(['#####', '#...#', '#####']);
  const heroActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), held: 300, facing: 'left', last: { kind: 'attack', dx: -1, dy: 0, at: 50 } });
  const heroShape = hero.of({ name: 'Ann', actor: heroActor, pending: intent.move(1, 0) });
  const monsterActor = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), last: { kind: 'move', dx: 0, dy: 1, at: 20 } });
  const goldItem = item.of({ id: 0, kind: 'gold', pos: point.of(3, 3), amount: 10 });
  const visible = mask.of(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth: 1, players: [] });

  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: 'playing',
    grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem],
    visible, explored, gold: 0, log: [], entry
  });

  const data = JSON.parse(JSON.stringify(w.data()));
  const w2 = world.fromData(data);
  assert.deepStrictEqual(w2, w);

  assert.deepStrictEqual(w.data().grid, ['#####', '#...#', '#####']);
  assert.equal(w.data().visible[1], '01000');

  assert.throws(() => world.fromData({}), TypeError);
  const badData = w.data();
  badData.depth = 9;
  assert.throws(() => world.fromData(badData), TypeError);
});

test("message/valid", () => {
  assert.equal(message.create(null).upward, true);
  assert.equal(message.created('s', 'p').upward, false);
  assert.throws(() => message.refused('nope'), TypeError);
  assert.throws(() => message.join('', 'x', 'Ann'), TypeError);
  assert.throws(() => message.join('ABCDEF', 'x', ''), TypeError);
  assert.throws(() => message.act({ kind: 'move', dx: 1, dy: 0 }), TypeError);
  assert.throws(() => message.pause('yes'), TypeError);
  assert.throws(() => message.create({}), TypeError);

  assert.throws(() => message.parse('nope'), TypeError);
  assert.throws(() => message.parse('{}'), TypeError);
  assert.throws(() => message.parse('{"kind":"fly"}'), TypeError);
  assert.throws(() => message.parse('{"kind":"pause"}'), TypeError);
});

test("message/round-trip", () => {
  const grid = tileGrid.fromRows(['#####', '#...#', '#####']);
  const heroActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), held: 300, facing: 'left', last: { kind: 'attack', dx: -1, dy: 0, at: 50 } });
  const heroShape = hero.of({ name: 'Ann', actor: heroActor });
  const monsterActor = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const goldItem = item.of({ id: 0, kind: 'gold', pos: point.of(3, 1), amount: 10 });
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth: 1, players: [] });

  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: 'playing',
    grid, heroes: [heroShape], monsters: [monsterActor], items: [goldItem],
    visible, explored, gold: 0, log: [], entry
  });

  const sOnePlayer = save.of({ seed: 1, depth: 1, players: [{ name: 'Cy', stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });

  const m1 = message.create(sOnePlayer);
  assert.deepStrictEqual(message.parse(m1.text()), m1);

  const m2 = message.create(null);
  assert.deepStrictEqual(message.parse(m2.text()), m2);

  const m3 = message.join('ABCDEF', 'xyz234', 'Ann');
  assert.deepStrictEqual(message.parse(m3.text()), m3);

  const m4 = message.act(intent.move(1, 0));
  assert.deepStrictEqual(message.parse(m4.text()), m4);

  const m5 = message.act(intent.attack(1, 0));
  assert.deepStrictEqual(message.parse(m5.text()), m5);

  const m6 = message.act(intent.use());
  assert.deepStrictEqual(message.parse(m6.text()), m6);

  const m7 = message.act(intent.wait());
  assert.deepStrictEqual(message.parse(m7.text()), m7);

  const m8 = message.act(intent.descend());
  assert.deepStrictEqual(message.parse(m8.text()), m8);

  const m9 = message.pause(false);
  assert.deepStrictEqual(message.parse(m9.text()), m9);

  const m10 = message.requestSave();
  assert.deepStrictEqual(message.parse(m10.text()), m10);

  const m11 = message.created('ABCDEF', 'xyz234');
  assert.deepStrictEqual(message.parse(m11.text()), m11);

  const m12 = message.joined('ABCDEF', 'Ann');
  assert.deepStrictEqual(message.parse(m12.text()), m12);

  const m13 = message.refused('full');
  assert.deepStrictEqual(message.parse(m13.text()), m13);

  const m14 = message.state(w, false);
  assert.deepStrictEqual(message.parse(m14.text()), m14);

  const m15 = message.saved(sOnePlayer);
  assert.deepStrictEqual(message.parse(m15.text()), m15);
});
