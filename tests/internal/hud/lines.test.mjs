import test from "node:test";
import assert from "node:assert/strict";
import { lines } from "../../../src/hud/index.mjs";

function makeWorld(gold, depth, log, heroes) {
  return { gold, depth, log, heroes };
}

test("lines: status line for a hero, party line, last two log lines", () => {
  const world = makeWorld(7, 2, ["a", "b", "c", "d"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 } } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 } } }
  ]);
  assert.deepStrictEqual(lines(world, "Ann"), ["Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/29", "Party: Ann 18/24, Bob fallen", "c", "d"]);
});

test("lines: status line for a fallen hero", () => {
  const world = makeWorld(7, 2, ["a", "b", "c", "d"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 } } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 } } }
  ]);
  assert.strictEqual(lines(world, "Bob")[0], "Bob   HP 0/28 (fallen)   ATK 4   DEF 1   Gold 7   Depth 2/29");
});

test("lines: no hero of that name gives Watching line", () => {
  const world = makeWorld(7, 2, ["a", "b", "c", "d"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 } } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 } } }
  ]);
  assert.strictEqual(lines(world, "Eve")[0], "Watching   Gold 7   Depth 2/29");
});

test("lines: short log gives status, party, and one log line", () => {
  const world = makeWorld(7, 2, ["a"], [
    { name: "Ann", alive: true, actor: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 } } },
    { name: "Bob", alive: false, actor: { stats: { hp: 0, maxHp: 28, attack: 4, defense: 1 } } }
  ]);
  assert.deepStrictEqual(lines(world, "Ann"), ["Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/29", "Party: Ann 18/24, Bob fallen", "a"]);
});

test("lines: no heroes gives Party: none", () => {
  const world = makeWorld(7, 2, ["a", "b"], []);
  assert.deepStrictEqual(lines(world, "Eve"), ["Watching   Gold 7   Depth 2/29", "Party: none", "a", "b"]);
});
