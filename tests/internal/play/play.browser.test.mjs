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
  const h = playEdge.start(document, { open, audioContext: null });

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
  const h = playEdge.start(document, { open, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();

  assert.strictEqual(socket.sent()[0], messageShape.list().text());
  assert.strictEqual(socket.sent()[1], messageShape.create(null).text());

  socket.message(messageShape.created("ABCDEF").text());
  while (socket.sent().length < 3) {
    await delay(10);
  }
  assert.strictEqual(socket.sent()[2], messageShape.join("ABCDEF", "Ann").text());

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

test("lobby", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  await delay(10);
  socket.open();

  assert.strictEqual(socket.sent()[0], messageShape.list().text());

  await delay(2100);
  assert.strictEqual(socket.sent()[1], messageShape.list().text());

  socket.message(messageShape.lobby([{ session: "ABCDEF", players: ["Bob"], depth: 2 }]).text());
  await delay(500);

  const joinButton = document.querySelector("#landing-lobby button.landing-join");
  assert.ok(joinButton);
  assert.strictEqual(joinButton.getAttribute("data-session"), "ABCDEF");

  document.querySelector("#landing-name").value = "Ann";
  joinButton.click();
  await delay(50);
  assert.strictEqual(socket.sent()[2], messageShape.join("ABCDEF", "Ann").text());

  h.stop();
});

test("refused", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  await delay(10);
  socket.open();

  socket.message(messageShape.refused("no-session").text());
  await delay(500);
  assert.strictEqual(document.querySelector("#landing-error").textContent, "No such session.");
  assert.strictEqual(h.screen(), "landing");

  h.stop();
});

test("keys", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  const evLeft = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
  document.dispatchEvent(evLeft);
  assert.strictEqual(evLeft.defaultPrevented, true);
  assert.strictEqual(socket.sent()[3], messageShape.act(intentShape.move(-1, 0)).text());

  const evShift = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true, shiftKey: true });
  document.dispatchEvent(evShift);
  assert.strictEqual(socket.sent()[4], messageShape.act(intentShape.face(-1, 0)).text());

  const evU = new KeyboardEvent("keydown", { key: "u", cancelable: true });
  document.dispatchEvent(evU);
  assert.strictEqual(socket.sent()[5], messageShape.act(intentShape.move(1, -1)).text());

  const evSpace = new KeyboardEvent("keydown", { key: " ", cancelable: true });
  document.dispatchEvent(evSpace);
  assert.strictEqual(socket.sent()[6], messageShape.act(intentShape.attack()).text());

  const evE = new KeyboardEvent("keydown", { key: "e", cancelable: true });
  document.dispatchEvent(evE);
  assert.strictEqual(socket.sent()[7], messageShape.act(intentShape.use()).text());

  const evDescend = new KeyboardEvent("keydown", { key: ">", cancelable: true, shiftKey: true });
  document.dispatchEvent(evDescend);
  assert.strictEqual(socket.sent()[8], messageShape.act(intentShape.descend()).text());

  const evP = new KeyboardEvent("keydown", { key: "p", cancelable: true });
  document.dispatchEvent(evP);
  assert.strictEqual(socket.sent()[9], messageShape.pause(true).text());

  const evShiftKey = new KeyboardEvent("keydown", { key: "Shift", cancelable: true });
  document.dispatchEvent(evShiftKey);
  assert.strictEqual(evShiftKey.defaultPrevented, false);

  const evMute = new KeyboardEvent("keydown", { key: "m", cancelable: true });
  document.dispatchEvent(evMute);
  assert.strictEqual(evMute.defaultPrevented, true);
  assert.strictEqual(socket.sent().length, 10);

  const evQuieter = new KeyboardEvent("keydown", { key: "-", cancelable: true });
  document.dispatchEvent(evQuieter);
  assert.strictEqual(evQuieter.defaultPrevented, true);
  assert.strictEqual(socket.sent().length, 10);

  const evLouder = new KeyboardEvent("keydown", { key: "=", cancelable: true });
  document.dispatchEvent(evLouder);
  assert.strictEqual(evLouder.defaultPrevented, true);
  assert.strictEqual(socket.sent().length, 10);

  h.stop();
});

test("aiming", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  // Shift keydown: not prevented, aims true
  const evShiftDown = new KeyboardEvent("keydown", { key: "Shift", cancelable: true });
  document.dispatchEvent(evShiftDown);
  assert.strictEqual(evShiftDown.defaultPrevented, false);

  // A direction key with shiftKey while aiming sends face
  const evFace = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true, shiftKey: true });
  document.dispatchEvent(evFace);
  assert.strictEqual(evFace.defaultPrevented, true);
  assert.strictEqual(socket.sent()[3], messageShape.act(intentShape.face(-1, 0)).text());

  // Shift keyup: not prevented, aims false
  const evShiftUp = new KeyboardEvent("keyup", { key: "Shift", cancelable: true });
  document.dispatchEvent(evShiftUp);
  assert.strictEqual(evShiftUp.defaultPrevented, false);

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
  const h = playEdge.start(document, { open, download, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  const evEsc = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
  document.dispatchEvent(evEsc);
  assert.strictEqual(h.menuOpen(), true);
  assert.notStrictEqual(getComputedStyle(document.querySelector("#menu")).display, "none");
  assert.ok(document.querySelector("#menu-session").textContent.includes("ABCDEF"));

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

test("first world updates audio", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  await delay(500);

  // First world: previousWorld is null. sound.update(null, world, 'Ann') must not throw.
  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);
  assert.strictEqual(h.world().time, w.time);

  h.stop();
});

test("creates-canvas", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const doc = document.implementation.createHTMLDocument("t");
  const h = playEdge.start(doc, { open, audioContext: null });

  const canvases = doc.querySelectorAll("canvas");
  assert.strictEqual(canvases.length, 1);
  assert.strictEqual(canvases[0].width, 960);
  assert.strictEqual(canvases[0].height, 720);

  h.stop();
});

test("explores", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  await delay(500);

  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  const evZ = new KeyboardEvent("keydown", { key: "z", cancelable: true });
  document.dispatchEvent(evZ);
  await delay(500);
  assert.strictEqual(socket.sent().length, 2);
  assert.strictEqual(socket.sent()[1], messageShape.act({ command: "explore" }).text());

  h.stop();
});

test("enemy", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  await delay(500);

  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  const evZ = new KeyboardEvent("keydown", { key: "z", cancelable: true });
  document.dispatchEvent(evZ);
  await delay(500);

  h.stop();
});

test("clicks", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, audioContext: null });

  document.querySelector("#landing-name").value = "Ann";
  document.querySelector("#landing-create").click();

  await delay(10);
  socket.open();
  socket.message(messageShape.created("ABCDEF").text());
  socket.message(messageShape.joined("ABCDEF", "Ann").text());
  await delay(500);

  const w = makeSmallWorld();
  socket.message(messageShape.state(w, false).text());
  await delay(500);

  const canvas = document.querySelector("canvas");
  const clickEv = new MouseEvent("click", { clientX: 100, clientY: 100, bubbles: true });
  canvas.dispatchEvent(clickEv);
  await delay(500);

  h.stop();
});

test("debug", async () => {
  let socket;
  const open = (url) => {
    socket = makeFakeSocket();
    return socket;
  };
  const h = playEdge.start(document, { open, debug: true, audioContext: null });

  await delay(50);
  assert.strictEqual(document.querySelector("#landing-debug") !== null, true);

  h.stop();
});
