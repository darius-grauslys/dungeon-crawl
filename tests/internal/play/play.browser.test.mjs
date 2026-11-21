import test from "node:test";
import assert from "node:assert/strict";

import * as playEdge from "../../../src/play/index.mjs";
import * as messageShape from "../../../shapes/message/index.mjs";
import * as intentShape from "../../../shapes/intent/index.mjs";
import * as saveShape from "../../../shapes/save/index.mjs";
import * as worldShape from "../../../shapes/world/index.mjs";
import * as tileGridShape from "../../../shapes/tile-grid/index.mjs";
import * as maskShape from "../../../shapes/mask/index.mjs";
import * as pointShape from "../../../shapes/point/index.mjs";
import * as statsShape from "../../../shapes/stats/index.mjs";
import * as actorShape from "../../../shapes/actor/index.mjs";
import * as heroShape from "../../../shapes/hero/index.mjs";
import * as itemShape from "../../../shapes/item/index.mjs";

function makeFakeSocket() {
  const sent = [];
  const socket = {
    sent: () => sent,
    open: () => { if (socket.onopen) socket.onopen(); },
    message: (data) => { if (socket.onmessage) socket.onmessage({ data }); },
    close: () => { if (socket.onclose) socket.onclose(); },
    error: () => { if (socket.onerror) socket.onerror(); },
    send: (text) => { sent.push(text); },
  };
  return socket;
}

function makeSmallWorld() {
  const grid = tileGridShape.fromRows(["#####", "#...#", "#####"]);
  const heroActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 10, maxHp: 10, attack: 3, defense: 1 }) });
  const hero = heroShape.of({ name: "Ann", actor: heroActor });
  const monster = actorShape.of({ id: 1, kind: "slime", pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 5, maxHp: 5, attack: 2, defense: 1 }) });
  const item = itemShape.of({ id: 2, kind: "gold", pos: pointShape.of(3, 1), amount: 10 });
  const visible = maskShape.empty(5, 3);
  const explored = maskShape.empty(5, 3);
  const save = saveShape.of({ seed: 1, depth: 1, players: [] });
  return worldShape.of({
    seed: 1, rng: 2, depth: 1, time: 100, state: "playing", grid, heroes: [hero], monsters: [monster], items: [item], visible, explored, gold: 0, log: [], entry: save,
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

test("starts", async () => {
  let openCalls = [];
  let socket;
  const open = (url) => {
    openCalls.push(url);
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open });

  assert.strictEqual(h.screen(), "landing");
  assert.strictEqual(h.world(), null);
  assert.strictEqual(h.me(), null);
  assert.strictEqual(openCalls.length, 1);
  assert.ok(openCalls[0].endsWith("/ws"));
  assert.ok(document.querySelector("#landing"));

  const ev = new KeyboardEvent("keydown", { key: "w", cancelable: true });
  document.dispatchEvent(ev);
  assert.strictEqual(ev.defaultPrevented, false);

  h.stop();
});

test("creates", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();

  assert.strictEqual(socket.sent()[0], messageShape.create(null).text());

  socket.message(messageShape.created("ABCDEF", "xyz234").text());
  while (socket.sent().length < 2) {
    await delay(10);
  }
  assert.strictEqual(socket.sent()[1], messageShape.join("ABCDEF", "xyz234", "Ann").text());

  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  await delay(500);
  assert.strictEqual(h.screen(), "game");
  assert.strictEqual(h.me(), "Ann");
  assert.ok(!document.querySelector("#landing"));

  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);
  assert.strictEqual(h.world().time, w.time);

  h.stop();
});

test("refused", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open });

  await delay(10);
  socket.open();

  socket.message(messageShape.refused("bad-password").text());
  await delay(500);
  assert.strictEqual(document.querySelector("#landing-error").textContent, "Wrong password.");
  assert.strictEqual(h.screen(), "landing");

  h.stop();
});

test("keys", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF", "xyz234").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  const evLeft = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
  document.dispatchEvent(evLeft);
  assert.strictEqual(evLeft.defaultPrevented, true);
  assert.strictEqual(socket.sent()[2], messageShape.act(intentShape.move(-1, 0)).text());

  const evShift = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true, shiftKey: true });
  document.dispatchEvent(evShift);
  assert.strictEqual(socket.sent()[3], messageShape.act(intentShape.attack(-1, 0)).text());

  const evE = new KeyboardEvent("keydown", { key: "e", cancelable: true });
  document.dispatchEvent(evE);
  assert.strictEqual(socket.sent()[4], messageShape.act(intentShape.use()).text());

  const evP = new KeyboardEvent("keydown", { key: "p", cancelable: true });
  document.dispatchEvent(evP);
  assert.strictEqual(socket.sent()[5], messageShape.pause(true).text());

  h.stop();
});

test("menu", async () => {
  let socket;
  let downloadCalls = [];
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const download = (filename, text) => { downloadCalls.push([filename, text]); };
  const h = playEdge.start(document, { open, download });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF", "xyz234").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  const evEsc = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  document.dispatchEvent(evEsc);
  assert.strictEqual(h.menuOpen(), true);
  assert.notStrictEqual(getComputedStyle(document.querySelector("#menu")).display, "none");
  assert.ok(document.querySelector("#menu-session").textContent.includes("ABCDEF"));
  assert.ok(document.querySelector("#menu-session").textContent.includes("xyz234"));

  const evArrow = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
  document.dispatchEvent(evArrow);
  const beforeCount = socket.sent().length;
  await delay(50);
  assert.strictEqual(socket.sent().length, beforeCount);

  document.querySelector("#menu-save").click();
  assert.strictEqual(socket.sent()[socket.sent().length - 1], messageShape.requestSave().text());

  const s = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: statsShape.of({ hp: 10, maxHp: 10, attack: 3, defense: 1 }) }] });
  socket.message(messageShape.saved(s).text());
  await delay(500);
  assert.strictEqual(downloadCalls.length, 1);
  assert.strictEqual(downloadCalls[0][0], "crawl-depth2.json");
  assert.strictEqual(downloadCalls[0][1], s.text());

  document.querySelector("#menu-pause").click();
  assert.strictEqual(socket.sent()[socket.sent().length - 1], messageShape.pause(true).text());
  socket.message(messageShape.state(w, true).text());
  await delay(500);
  assert.strictEqual(document.querySelector("#menu-pause").textContent, "Resume");

  document.querySelector("#menu-back").click();
  await delay(50);
  assert.strictEqual(h.menuOpen(), false);

  const evEsc2 = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  document.dispatchEvent(evEsc2);
  assert.strictEqual(h.menuOpen(), true);
  const evEsc3 = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  document.dispatchEvent(evEsc3);
  assert.strictEqual(h.menuOpen(), false);

  h.stop();
});

test("creates-canvas", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const doc = document.implementation.createHTMLDocument("t");
  const h = playEdge.start(doc, { open });

  const canvases = doc.querySelectorAll("canvas");
  assert.strictEqual(canvases.length, 1);
  assert.strictEqual(canvases[0].width, 960);
  assert.strictEqual(canvases[0].height, 720);

  h.stop();
});
