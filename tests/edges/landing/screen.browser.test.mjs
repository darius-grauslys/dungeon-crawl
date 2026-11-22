// landing: edge test `screen`

import test from "node:test";
import assert from "node:assert/strict";

import { show } from "../../../edges/edge_to_landing.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";

function makeSave() {
  return save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });
}

function makeHandlers() {
  const calls = { create: [], join: [] };
  return {
    create(saveArg, name) { calls.create.push([saveArg, name]); },
    join(session, name) { calls.join.push([session, name]); },
    calls,
  };
}

function waitCreate(handlers) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (handlers.calls.create.length >= 1 || Date.now() - start >= 1000) resolve();
      else setTimeout(check, 20);
    };
    check();
  });
}

test("builds", () => {
  const handlers = makeHandlers();
  const handle = show(document, handlers);
  assert.strictEqual(document.querySelectorAll("#landing").length, 1);
  assert.ok(document.querySelector("#landing-name"));
  assert.strictEqual(document.querySelector("#landing-name").maxLength, 16);
  assert.ok(document.querySelector("#landing-lobby"));
  assert.ok(document.querySelector("#landing-save"));
  assert.strictEqual(document.querySelector("#landing-save").type, "file");
  assert.ok(document.querySelector("#landing-create"));
  assert.strictEqual(document.querySelector("#landing-create").textContent, "Create session");
  assert.ok(document.querySelector("#landing-error"));
  assert.strictEqual(document.querySelector("#landing-error").textContent, "");
  assert.strictEqual(document.querySelector("#landing-lobby").querySelectorAll("li").length, 1);
  assert.strictEqual(document.querySelector("#landing-lobby").querySelector("li").textContent, "No sessions yet. Create one!");
  assert.strictEqual(document.querySelector("#landing-lobby").querySelector("button"), null);
  assert.strictEqual(handle.shown(), true);
  assert.throws(() => show(document, handlers));
  handle.hide();
});

test("creates", () => {
  const handlers = makeHandlers();
  const handle = show(document, handlers);
  const nameInput = document.querySelector("#landing-name");
  const createBtn = document.querySelector("#landing-create");

  nameInput.value = "Ann";
  createBtn.click();
  assert.strictEqual(handlers.calls.create.length, 1);
  assert.deepStrictEqual(handlers.calls.create[0], [null, "Ann"]);

  nameInput.value = " Ann ";
  createBtn.click();
  assert.strictEqual(handlers.calls.create.length, 2);
  assert.deepStrictEqual(handlers.calls.create[1], [null, "Ann"]);

  nameInput.value = "";
  createBtn.click();
  assert.strictEqual(handlers.calls.create.length, 2);
  assert.strictEqual(document.querySelector("#landing-error").textContent, "Enter a name of 1 to 16 characters.");

  handle.hide();
});

test("imports", async () => {
  const handlers = makeHandlers();
  const handle = show(document, handlers);
  const nameInput = document.querySelector("#landing-name");
  const saveInput = document.querySelector("#landing-save");
  const createBtn = document.querySelector("#landing-create");

  const s = makeSave();
  nameInput.value = "Cy";
  const dt = new DataTransfer();
  dt.items.add(new File([s.text()], "save.json"));
  saveInput.files = dt.files;
  createBtn.click();
  await waitCreate(handlers);
  assert.strictEqual(handlers.calls.create.length, 1);
  assert.deepStrictEqual(handlers.calls.create[0], [s, "Cy"]);

  handlers.calls.create.length = 0;
  nameInput.value = "Cy";
  const dt2 = new DataTransfer();
  dt2.items.add(new File(["hello"], "save.json"));
  saveInput.files = dt2.files;
  createBtn.click();
  await waitCreate(handlers);
  assert.strictEqual(handlers.calls.create.length, 0);
  assert.strictEqual(document.querySelector("#landing-error").textContent, "That file is not a Crawl save.");

  handle.hide();
});

test("lobby", () => {
  const handlers = makeHandlers();
  const handle = show(document, handlers);

  handle.lobby([
    { session: "ABCDEF", players: ["Ann", "Bob"], depth: 3 },
    { session: "GHJKMN", players: [], depth: 1 },
    { session: "PQRSTU", players: ["A", "B", "C", "D"], depth: 7 },
  ]);

  const lis = document.querySelectorAll("#landing-lobby li");
  assert.strictEqual(lis.length, 3);

  const firstLi = lis[0];
  assert.ok(firstLi.textContent.includes("ABCDEF"));
  assert.ok(firstLi.textContent.includes("Ann, Bob"));
  assert.ok(firstLi.textContent.includes("(2/4)"));
  assert.ok(firstLi.textContent.includes("Depth 3"));
  const firstBtn = firstLi.querySelector("button.landing-join");
  assert.ok(firstBtn);
  assert.strictEqual(firstBtn.textContent, "Join");
  assert.strictEqual(firstBtn.getAttribute("data-session"), "ABCDEF");
  assert.strictEqual(firstBtn.disabled, false);

  const secondLi = lis[1];
  assert.ok(secondLi.textContent.includes("GHJKMN"));
  assert.ok(secondLi.textContent.includes("nobody"));
  assert.ok(secondLi.textContent.includes("(0/4)"));
  const secondBtn = secondLi.querySelector("button.landing-join");
  assert.ok(secondBtn);
  assert.strictEqual(secondBtn.getAttribute("data-session"), "GHJKMN");
  assert.strictEqual(secondBtn.disabled, false);

  const thirdLi = lis[2];
  assert.ok(thirdLi.textContent.includes("PQRSTU"));
  const thirdBtn = thirdLi.querySelector("button.landing-join");
  assert.ok(thirdBtn);
  assert.strictEqual(thirdBtn.getAttribute("data-session"), "PQRSTU");
  assert.strictEqual(thirdBtn.disabled, true);

  // name preserved
  const nameInput = document.querySelector("#landing-name");
  nameInput.value = "Bob";
  handle.lobby([{ session: "ABCDEF", players: [], depth: 1 }]);
  const lis2 = document.querySelectorAll("#landing-lobby li");
  assert.strictEqual(lis2.length, 1);
  assert.strictEqual(nameInput.value, "Bob");

  handle.lobby([]);
  const lis3 = document.querySelectorAll("#landing-lobby li");
  assert.strictEqual(lis3.length, 1);
  assert.strictEqual(lis3[0].textContent, "No sessions yet. Create one!");
  assert.strictEqual(lis3[0].querySelector("button"), null);

  handle.hide();
});

test("joins", () => {
  const handlers = makeHandlers();
  const handle = show(document, handlers);

  handle.lobby([
    { session: "ABCDEF", players: ["Ann", "Bob"], depth: 3 },
    { session: "GHJKMN", players: [], depth: 1 },
    { session: "PQRSTU", players: ["A", "B", "C", "D"], depth: 7 },
  ]);

  const nameInput = document.querySelector("#landing-name");
  const joinBtns = document.querySelectorAll("#landing-lobby button.landing-join");

  nameInput.value = " Cy ";
  joinBtns[0].click();
  assert.strictEqual(handlers.calls.join.length, 1);
  assert.deepStrictEqual(handlers.calls.join[0], ["ABCDEF", "Cy"]);

  handlers.calls.join.length = 0;
  nameInput.value = "";
  joinBtns[0].click();
  assert.strictEqual(handlers.calls.join.length, 0);
  assert.strictEqual(document.querySelector("#landing-error").textContent, "Enter a name of 1 to 16 characters.");

  handle.hide();
});

test("handle", () => {
  const handlers = makeHandlers();
  const handle = show(document, handlers);
  handle.error("No such session.");
  assert.strictEqual(document.querySelector("#landing-error").textContent, "No such session.");
  handle.hide();
  assert.strictEqual(handle.shown(), false);
  assert.strictEqual(document.querySelectorAll("#landing").length, 0);

  const handle2 = show(document, handlers);
  assert.strictEqual(handle2.shown(), true);
  handle2.hide();
});

test("save/valid", () => {
  const s = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });
  assert.deepStrictEqual(save.parse(s.text()), s);
  assert.strictEqual(s.data().format, "crawl-save");
  assert.strictEqual(save.isName("Ann"), true);
  assert.strictEqual(save.isName(""), false);
  assert.strictEqual(save.isName("Ann "), false);
  assert.strictEqual(save.isName(5), false);
  // depth 33 accepted
  const depth33 = save.of({ seed: 9, depth: 33, players: [] });
  assert.ok(depth33);
  // depth 34, 0 throw
  assert.throws(() => save.of({ seed: 9, depth: 34, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 0, players: [] }), TypeError);
  // seed -1 throws
  assert.throws(() => save.of({ seed: -1, depth: 3, players: [] }), TypeError);
  // five players throw
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }, { name: "e" }] }), TypeError);
  // two players named 'Cy' throw
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy" }, { name: "Cy" }] }), TypeError);
  // name '' throws
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "" }] }), TypeError);
  // name of 17 characters throws
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "01234567890123456" }] }), TypeError);
  // name ' Cy' throws
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: " Cy" }] }), TypeError);
  // name holding '\n' throws
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "a\nb" }] }), TypeError);
  // stats of {} throws
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: {} }] }), TypeError);
  // stats of {hp: 5, maxHp: 3, attack: 0, defense: 0} throws
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: { hp: 5, maxHp: 3, attack: 0, defense: 0 } }] }), TypeError);
  // parse('nope') throws
  assert.throws(() => save.parse("nope"), TypeError);
  // parse('{}') throws
  assert.throws(() => save.parse("{}"), TypeError);
  // version 2 throws
  const badText = s.text().replace('"version": 1', '"version": 2');
  assert.throws(() => save.parse(badText), TypeError);
  // players: [] accepted
  const empty = save.of({ seed: 9, depth: 3, players: [] });
  assert.ok(empty);
  // stats given as plain object accepted
  const plainStats = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: { hp: 10, maxHp: 30, attack: 6, defense: 2 } }] });
  assert.ok(plainStats);
  assert.strictEqual(plainStats.players[0].stats.hp, 10);
});
