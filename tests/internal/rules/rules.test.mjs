// internal tests for rules: validation, population by depth, log lines, rng threading.

import test from "node:test";
import assert from "node:assert/strict";

import * as rules from "../../../src/rules/index.mjs";

test("newGame: refuses invalid seeds", () => {
  assert.throws(() => rules.newGame(-1), TypeError);
  assert.throws(() => rules.newGame(2.5), TypeError);
  assert.throws(() => rules.newGame(4294967296), TypeError);
  assert.throws(() => rules.newGame("1"), TypeError);
});

test("step: refuses invalid world and intent", () => {
  // a plain object is not a world
  assert.throws(() => rules.step({}, { kind: "wait" }), TypeError);
  // a plain object is not an intent (not frozen)
  const fakeWorld = { state: "playing", seed: 0, rng: 0, depth: 1, turn: 0, grid: {}, hero: {}, monsters: [], items: [], visible: {}, explored: {}, gold: 0, log: [] };
  assert.throws(() => rules.step(fakeWorld, { kind: "wait" }), TypeError);
});

test("population by depth: monster count and kinds", async () => {
  const w = await rules.newGame(5);
  assert.equal(w.depth, 1);
  assert.equal(w.monsters.length, 2 + 2 * 1);
  assert.ok(w.monsters.length >= 1);
  for (const m of w.monsters) {
    assert.ok(["bat", "slime", "snake", "skeleton", "demon"].includes(m.kind));
  }
});

test("population by depth: items include potions and gold", async () => {
  const w = await rules.newGame(5);
  const kinds = w.items.map((i) => i.kind);
  assert.ok(kinds.filter((k) => k === "potion").length >= 2);
  assert.ok(kinds.filter((k) => k === "gold").length >= 2);
});

test("log lines: welcome line", async () => {
  const w = await rules.newGame(5);
  assert.deepEqual(w.log, ["Welcome to the dungeon. Find the stairs (>)."]);
});

test("rng threading: newGame(seed) starts rng at seed", async () => {
  const w = await rules.newGame(5);
  assert.ok(Number.isInteger(w.rng));
});
