import test from "node:test";
import assert from "node:assert/strict";
import { show } from "../../../src/landing/index.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";

test("landing: builds the landing screen", () => {
  const handlers = { create: () => {}, join: () => {} };
  const handle = show(document, handlers);
  assert.ok(document.getElementById("landing"), "has #landing");
  assert.ok(document.getElementById("landing-name"), "has #landing-name");
  assert.strictEqual(document.getElementById("landing-name").maxLength, 16, "name maxLength 16");
  assert.ok(document.getElementById("landing-save"), "has #landing-save");
  assert.strictEqual(document.getElementById("landing-save").type, "file", "save is file input");
  assert.strictEqual(document.getElementById("landing-save").accept, ".json,application/json", "save accepts json");
  assert.ok(document.getElementById("landing-create"), "has #landing-create");
  assert.strictEqual(document.getElementById("landing-create").textContent, "Create session", "create text");
  assert.ok(document.getElementById("landing-lobby"), "has #landing-lobby");
  const lobbyItems = document.getElementById("landing-lobby").querySelectorAll("li");
  assert.strictEqual(lobbyItems.length, 1, "one li before first lobby");
  assert.strictEqual(lobbyItems[0].textContent, "No sessions yet. Create one!", "initial li text");
  assert.strictEqual(document.getElementById("landing-lobby").querySelector("button"), null, "no button initially");
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

test("landing: imports save file", async () => {
  const createCalls = [];
  const handlers = { create: (s, name) => createCalls.push([s, name]), join: () => {} };
  const handle = show(document, handlers);

  const nameInput = document.getElementById("landing-name");
  const saveInput = document.getElementById("landing-save");
  const createButton = document.getElementById("landing-create");

  nameInput.value = "Cy";
  const s = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });
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

test("landing: lobby list", () => {
  const handlers = { create: () => {}, join: () => {} };
  const handle = show(document, handlers);

  handle.lobby([
    { session: "ABCDEF", players: ["Ann", "Bob"], depth: 3 },
    { session: "GHJKMN", players: [], depth: 1 },
    { session: "PQRSTU", players: ["A", "B", "C", "D"], depth: 7 },
  ]);

  const lobby = document.getElementById("landing-lobby");
  const items = lobby.querySelectorAll("li");
  assert.strictEqual(items.length, 3, "three li");

  const firstText = items[0].textContent;
  assert.ok(firstText.includes("ABCDEF"), "first has id");
  assert.ok(firstText.includes("Ann, Bob"), "first has players");
  assert.ok(firstText.includes("(2/4)"), "first has count");
  assert.ok(firstText.includes("Depth 3"), "first has depth");

  const secondText = items[1].textContent;
  assert.ok(secondText.includes("GHJKMN"), "second has id");
  assert.ok(secondText.includes("nobody"), "second has nobody");
  assert.ok(secondText.includes("(0/4)"), "second has count");

  const buttons = lobby.querySelectorAll("button.landing-join");
  assert.strictEqual(buttons.length, 3, "three buttons");
  assert.strictEqual(buttons[0].textContent, "Join", "first button text");
  assert.strictEqual(buttons[1].textContent, "Join", "second button text");
  assert.strictEqual(buttons[2].textContent, "Join", "third button text");
  assert.strictEqual(buttons[0].dataset.session, "ABCDEF", "first button session");
  assert.strictEqual(buttons[1].dataset.session, "GHJKMN", "second button session");
  assert.strictEqual(buttons[2].dataset.session, "PQRSTU", "third button session");
  assert.strictEqual(buttons[2].disabled, true, "third disabled");
  assert.strictEqual(buttons[0].disabled, false, "first not disabled");
  assert.strictEqual(buttons[1].disabled, false, "second not disabled");

  handle.hide();
});

test("landing: lobby keeps name and empty", () => {
  const handlers = { create: () => {}, join: () => {} };
  const handle = show(document, handlers);

  const nameInput = document.getElementById("landing-name");
  nameInput.value = "Bob";

  handle.lobby([{ session: "ABCDEF", players: [], depth: 1 }]);

  assert.strictEqual(nameInput.value, "Bob", "name kept");
  const lobby = document.getElementById("landing-lobby");
  const items = lobby.querySelectorAll("li");
  assert.strictEqual(items.length, 1, "one li");

  handle.lobby([]);
  const items2 = lobby.querySelectorAll("li");
  assert.strictEqual(items2.length, 1, "one li after empty");
  assert.strictEqual(items2[0].textContent, "No sessions yet. Create one!", "initial text");

  handle.hide();
});

test("landing: joins session", async () => {
  const joinCalls = [];
  const handlers = { create: () => {}, join: (s, n) => joinCalls.push([s, n]) };
  const handle = show(document, handlers);

  handle.lobby([
    { session: "ABCDEF", players: ["Ann", "Bob"], depth: 3 },
    { session: "GHJKMN", players: [], depth: 1 },
    { session: "PQRSTU", players: ["A", "B", "C", "D"], depth: 7 },
  ]);

  const nameInput = document.getElementById("landing-name");
  const lobby = document.getElementById("landing-lobby");
  const buttons = lobby.querySelectorAll("button.landing-join");

  nameInput.value = " Cy ";
  buttons[0].click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(joinCalls.length, 1, "join called once");
  assert.strictEqual(joinCalls[0][0], "ABCDEF", "session");
  assert.strictEqual(joinCalls[0][1], "Cy", "name trimmed");

  joinCalls.length = 0;
  nameInput.value = "";
  buttons[0].click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(joinCalls.length, 0, "join not called for empty name");
  assert.strictEqual(document.getElementById("landing-error").textContent, "Enter a name of 1 to 16 characters.", "error text");

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

test("landing: debug group presence", () => {
  const handlers = { create: () => {}, join: () => {} };
  const handle = show(document, handlers);
  assert.strictEqual(document.getElementById("landing-debug"), null, "no debug group without options");
  handle.hide();

  const handleDebug = show(document, handlers, { debug: true });
  assert.ok(document.getElementById("landing-debug"), "debug group with options");
  const depthInput = document.getElementById("landing-debug-depth");
  assert.strictEqual(depthInput.value, "1", "depth value 1");

  const buffStats = ["hp", "attack", "defense", "range", "magic", "magicPower", "magicResist"];
  for (const stat of buffStats) {
    const buffInput = document.getElementById(`landing-debug-${stat}`);
    assert.ok(buffInput, `has #landing-debug-${stat}`);
    assert.strictEqual(buffInput.value, "0", `${stat} value 0`);
    assert.strictEqual(buffInput.min, "0", `${stat} min 0`);
    assert.strictEqual(buffInput.step, "1", `${stat} step 1`);
    if (stat === "range") {
      assert.strictEqual(buffInput.max, "8", `range max 8`);
    }
  }

  assert.ok(document.getElementById("landing-debug-create"), "has #landing-debug-create");
  assert.strictEqual(document.getElementById("landing-debug-create").textContent, "Start debug session", "debug create text");

  const bossButtons = document.querySelectorAll("button.landing-debug-boss");
  assert.strictEqual(bossButtons.length, 4, "four boss buttons");
  assert.strictEqual(bossButtons[0].dataset.depth, "7", "first boss depth 7");
  assert.strictEqual(bossButtons[1].dataset.depth, "14", "second boss depth 14");
  assert.strictEqual(bossButtons[2].dataset.depth, "21", "third boss depth 21");
  assert.strictEqual(bossButtons[3].dataset.depth, "28", "fourth boss depth 28");
  assert.strictEqual(bossButtons[0].textContent, "Lair 1 (golem)", "first boss text");
  assert.strictEqual(bossButtons[1].textContent, "Lair 2", "second boss text");
  assert.strictEqual(bossButtons[2].textContent, "Lair 3", "third boss text");
  assert.strictEqual(bossButtons[3].textContent, "Lair 4", "fourth boss text");

  handleDebug.hide();
});

test("landing: debug create", async () => {
  const createCalls = [];
  const handlers = { create: (s, name) => createCalls.push([s, name]), join: () => {} };
  const handle = show(document, handlers, { debug: true });

  const nameInput = document.getElementById("landing-name");
  const debugCreateButton = document.getElementById("landing-debug-create");

  nameInput.value = "Ann";
  const depthInput = document.getElementById("landing-debug-depth");
  depthInput.value = "3";
  document.getElementById("landing-debug-attack").value = "5";
  document.getElementById("landing-debug-hp").value = "10";
  document.getElementById("landing-debug-range").value = "2";

  debugCreateButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 1, "create called once");
  assert.strictEqual(createCalls[0][0].depth, 3, "depth 3");
  assert.ok(Number.isInteger(createCalls[0][0].seed) && createCalls[0][0].seed >= 0 && createCalls[0][0].seed <= 4294967295, "seed in range");
  assert.strictEqual(createCalls[0][0].players.length, 1, "one player");
  assert.strictEqual(createCalls[0][0].players[0].name, "Ann", "player name");
  assert.deepStrictEqual(createCalls[0][0].players[0].stats, { hp: 34, maxHp: 34, attack: 9, defense: 1, range: 3, magic: 0, magicPower: 1, magicResist: 0 }, "stats");
  assert.strictEqual(createCalls[0][1], "Ann", "name");

  handle.hide();
});

test("landing: debug boss button", async () => {
  const createCalls = [];
  const handlers = { create: (s, name) => createCalls.push([s, name]), join: () => {} };
  const handle = show(document, handlers, { debug: true });

  const nameInput = document.getElementById("landing-name");
  nameInput.value = "Ann";
  document.getElementById("landing-debug-attack").value = "5";
  document.getElementById("landing-debug-hp").value = "10";
  document.getElementById("landing-debug-range").value = "2";

  const bossButtons = document.querySelectorAll("button.landing-debug-boss");
  bossButtons[0].click(); // depth 7
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 1, "create called once");
  assert.strictEqual(createCalls[0][0].depth, 7, "depth 7");
  assert.deepStrictEqual(createCalls[0][0].players[0].stats, { hp: 34, maxHp: 34, attack: 9, defense: 1, range: 3, magic: 0, magicPower: 1, magicResist: 0 }, "stats");

  handle.hide();
});

test("landing: debug validation", async () => {
  const createCalls = [];
  const handlers = { create: (s, name) => createCalls.push([s, name]), join: () => {} };
  const handle = show(document, handlers, { debug: true });

  const nameInput = document.getElementById("landing-name");
  const debugCreateButton = document.getElementById("landing-debug-create");

  // depth 40
  nameInput.value = "Ann";
  document.getElementById("landing-debug-depth").value = "40";
  debugCreateButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 0, "create not called for depth 40");
  assert.strictEqual(document.getElementById("landing-error").textContent, "Debug: depth 1 to 33, buffs whole numbers of 0 or more.", "error text");

  createCalls.length = 0;
  // magic -1
  document.getElementById("landing-debug-depth").value = "3";
  document.getElementById("landing-debug-magic").value = "-1";
  debugCreateButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 0, "create not called for magic -1");
  assert.strictEqual(document.getElementById("landing-error").textContent, "Debug: depth 1 to 33, buffs whole numbers of 0 or more.", "error text");

  createCalls.length = 0;
  // empty name
  document.getElementById("landing-debug-magic").value = "0";
  nameInput.value = "";
  debugCreateButton.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(createCalls.length, 0, "create not called for empty name");
  assert.strictEqual(document.getElementById("landing-error").textContent, "Enter a name of 1 to 16 characters.", "name error text");

  handle.hide();
});
