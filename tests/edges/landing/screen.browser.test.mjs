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
    join(session, password, name) { calls.join.push([session, password, name]); },
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
  assert.ok(document.querySelector("#landing-save"));
  assert.ok(document.querySelector("#landing-create"));
  assert.ok(document.querySelector("#landing-session"));
  assert.ok(document.querySelector("#landing-password"));
  assert.ok(document.querySelector("#landing-join"));
  assert.ok(document.querySelector("#landing-error"));
  assert.strictEqual(document.querySelector("#landing-error").textContent, "");
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

test("joins", () => {
  const handlers = makeHandlers();
  const handle = show(document, handlers);
  const nameInput = document.querySelector("#landing-name");
  const sessionInput = document.querySelector("#landing-session");
  const passwordInput = document.querySelector("#landing-password");
  const joinBtn = document.querySelector("#landing-join");

  nameInput.value = "Bob";
  sessionInput.value = " abcdef ";
  passwordInput.value = "xyz234";
  joinBtn.click();
  assert.strictEqual(handlers.calls.join.length, 1);
  assert.deepStrictEqual(handlers.calls.join[0], ["ABCDEF", "xyz234", "Bob"]);

  handlers.calls.join.length = 0;
  nameInput.value = "Bob";
  sessionInput.value = " abcdef ";
  passwordInput.value = "";
  joinBtn.click();
  assert.strictEqual(handlers.calls.join.length, 0);
  assert.strictEqual(document.querySelector("#landing-error").textContent, "Enter the session and its password.");

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
  assert.throws(() => save.of({ seed: 9, depth: 6, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: -1, depth: 3, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }, { name: "e" }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy" }, { name: "Cy" }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "" }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "01234567890123456" }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: " Cy" }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "a\nb" }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: {} }] }), TypeError);
  assert.throws(() => save.parse("nope"), TypeError);
  assert.throws(() => save.parse("{}"), TypeError);
  const badText = s.text().replace('"version": 1', '"version": 2');
  assert.throws(() => save.parse(badText), TypeError);
  const empty = save.of({ seed: 9, depth: 3, players: [] });
  assert.ok(empty);
});
