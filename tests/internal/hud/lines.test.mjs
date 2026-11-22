import test from "node:test";
import assert from "node:assert/strict";
import { lines } from "../../../src/hud/index.mjs";

function makeWorld(gold, depth, log, heroes) {
  return { gold, depth, log, heroes };
}

test("lines: status line for a hero, party line, last two log lines", () => {
  const world = makeWorld(7, 2, ["a", "b", "c", "d"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 }, slow: 0 } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 }, slow: 0 } }
  ]);
  assert.deepStrictEqual(lines(world, "Ann"), ["Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25", "Party: Ann 18/24, Bob fallen", "c", "d"]);
});

test("lines: status line for a fallen hero", () => {
  const world = makeWorld(7, 2, ["a", "b", "c", "d"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 }, slow: 0 } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 }, slow: 0 } }
  ]);
  assert.strictEqual(lines(world, "Bob")[0], "Bob   HP 0/28 (fallen)   ATK 4   DEF 1   Gold 7   Level 2/25");
});

test("lines: no hero of that name gives Watching line", () => {
  const world = makeWorld(7, 2, ["a", "b", "c", "d"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 }, slow: 0 } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 }, slow: 0 } }
  ]);
  assert.strictEqual(lines(world, "Eve")[0], "Watching   Gold 7   Level 2/25");
});

test("lines: short log gives status, party, and one log line", () => {
  const world = makeWorld(7, 2, ["a"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 }, slow: 0 } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 }, slow: 0 } }
  ]);
  assert.deepStrictEqual(lines(world, "Ann"), ["Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25", "Party: Ann 18/24, Bob fallen", "a"]);
});

test("lines: no heroes gives Party: none", () => {
  const world = makeWorld(7, 2, ["a", "b"], []);
  assert.deepStrictEqual(lines(world, "Eve"), ["Watching   Gold 7   Level 2/25", "Party: none", "a", "b"]);
});

test("lines: where is Level n/25 at dungeon floors", () => {
  const hero = { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 }, slow: 0 } };
  const world9 = makeWorld(7, 9, [], [hero]);
  assert.strictEqual(lines(world9, "Ann")[0].slice(-10), "Level 7/25");
  const world13 = makeWorld(7, 13, [], [hero]);
  assert.strictEqual(lines(world13, "Ann")[0], "Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Shop");
  const world14 = makeWorld(7, 14, [], [hero]);
  assert.strictEqual(lines(world14, "Ann")[0], "Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Lair");
});

test("lines: Slowed line when slow above 0", () => {
  const world = makeWorld(7, 2, ["a", "b", "c", "d"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 }, slow: 2 } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 }, slow: 0 } }
  ]);
  assert.strictEqual(lines(world, "Ann")[0], "Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25   Slowed 2");
});
