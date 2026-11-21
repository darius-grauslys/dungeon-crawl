import test from "node:test";
import assert from "node:assert/strict";
import { show } from "../../../src/landing/index.mjs";
import * as save from "../../../shapes/save/index.mjs";

test("landing: builds the landing screen", () => {
  const handlers = { create: () => {}, join: () => {} };
  const handle = show(document, handlers);
  assert.ok(document.getElementById("landing"), "has #landing");
  assert.ok(document.getElementById("landing-name"), "has #landing-name");
  assert.strictEqual(document.getElementById("landing-name").maxlength, 16, "name maxlength 16");
  assert.ok(document.getElementById("landing-save"), "has #landing-save");
  assert.strictEqual(document.getElementById("landing-save").type, "file", "save is file input");
  assert.strictEqual(document.getElementById("landing-save").accept, ".json,application/json", "save accepts json");
  assert.ok(document.getElementById("landing-create"), "has #landing-create");
  assert.strictEqual(document.getElementById("landing-create").textContent, "Create session", "create text");
  assert.ok(document.getElementById("landing-session"), "has #landing-session");
  assert.ok(document.getElementById("landing-password"), "has #landing-password");
  assert.ok(document.getElementById("landing-join"), "has #landing-join");
  assert.strictEqual(document.getElementById("landing-join").textContent, "Join session", "join text");
  assert.ok(document.getElementById("landing-error"), "has #landing-error");
  assert.strictEqual(document.getElementById("landing-error").textContent, "", "error empty");
  assert.strictEqual(handle.shown(), true, "shown() true");
  assert.throws(() => show(document, handlers), "second show throws");
  handle.hide();
});

test("landing: creates session", async () => {
  const createCalls = [];
  const handlers = { create: (s, name) => createCalls.push([s, name]), join: () => {} };
  const handle = show(document, handlers);

  const nameInput = document.getElementById("landing-name");
  const createButton = document.getElementById("landing-create");

  nameInput.value = "Ann";
  createButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 1, "create called once");
  assert.strictEqual(createCalls[0][0], null, "no save");
  assert.strictEqual(createCalls[0][1], "Ann", "name trimmed");

  createCalls.length = 0;
  nameInput.value = " Ann ";
  createButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 1, "create called once with spaced name");
  assert.strictEqual(createCalls[0][1], "Ann", "name trimmed");

  createCalls.length = 0;
  nameInput.value = "";
  createButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 0, "create not called for empty name");
  assert.strictEqual(document.getElementById("landing-error").textContent, "Enter a name of 1 to 16 characters.", "error text");

  handle.hide();
});

test("landing: joins session", async () => {
  const joinCalls = [];
  const handlers = { create: () => {}, join: (s, p, n) => joinCalls.push([s, p, n]) };
  const handle = show(document, handlers);

  const nameInput = document.getElementById("landing-name");
  const sessionInput = document.getElementById("landing-session");
  const passwordInput = document.getElementById("landing-password");
  const joinButton = document.getElementById("landing-join");

  nameInput.value = "Bob";
  sessionInput.value = " abcdef ";
  passwordInput.value = "xyz234";
  joinButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(joinCalls.length, 1, "join called once");
  assert.strictEqual(joinCalls[0][0], "ABCDEF", "session uppercased");
  assert.strictEqual(joinCalls[0][1], "xyz234", "password trimmed");
  assert.strictEqual(joinCalls[0][2], "Bob", "name");

  joinCalls.length = 0;
  passwordInput.value = "";
  joinButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(joinCalls.length, 0, "join not called for empty password");
  assert.strictEqual(document.getElementById("landing-error").textContent, "Enter the session and its password.", "error text");

  handle.hide();
});

test("landing: handle", () => {
  const handlers = { create: () => {}, join: () => {} };
  const handle = show(document, handlers);

  handle.error("No such session.");
  assert.strictEqual(document.getElementById("landing-error").textContent, "No such session.", "error text");

  handle.hide();
  assert.strictEqual(handle.shown(), false, "not shown after hide");
  assert.strictEqual(document.getElementById("landing"), null, "landing removed");

  const handle2 = show(document, handlers);
  assert.strictEqual(handle2.shown(), true, "show works again");
  handle2.hide();
});

test("landing: imports save file", async () => {
  const createCalls = [];
  const handlers = { create: (s, name) => createCalls.push([s, name]), join: () => {} };
  const handle = show(document, handlers);

  const nameInput = document.getElementById("landing-name");
  const saveInput = document.getElementById("landing-save");
  const createButton = document.getElementById("landing-create");

  nameInput.value = "Cy";
  const s = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: save.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });
  const file = new File([s.text()], "save.json", { type: "application/json" });
  Object.defineProperty(saveInput, "files", { get() { return [file]; }, configurable: true });

  createButton.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.strictEqual(createCalls.length, 1, "create called once");
  assert.deepStrictEqual(createCalls[0][0], s, "save deep equal");
  assert.strictEqual(createCalls[0][1], "Cy", "name");

  createCalls.length = 0;
  const badFile = new File(["hello"], "bad.json", { type: "text/plain" });
  Object.defineProperty(saveInput, "files", { get() { return [badFile]; }, configurable: true });
  createButton.click();
  await new Promise((r) => setTimeout(r, 50));
  assert.strictEqual(createCalls.length, 0, "create not called for bad file");
  assert.strictEqual(document.getElementById("landing-error").textContent, "That file is not a Crawl save.", "error text");

  handle.hide();
});
