import test from "node:test";
import assert from "node:assert/strict";
import { lines } from "../../../src/hud/index.mjs";

test("lines: status line and last three log lines, oldest first", () => {
  const world = {
    hero: { stats: { hp: 18, maxHp: 24, attack: 4, defense: 1 } },
    gold: 7,
    depth: 2,
    log: ['a', 'b', 'c', 'd']
  };
  assert.deepStrictEqual(lines(world), ['HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/5', 'b', 'c', 'd']);
});

test("lines: short log gives status line and that line", () => {
  const world = {
    hero: { stats: { hp: 12, maxHp: 24, attack: 3, defense: 2 } },
    gold: 0,
    depth: 1,
    log: ['a']
  };
  assert.deepStrictEqual(lines(world), ['HP 12/24   ATK 3   DEF 2   Gold 0   Depth 1/5', 'a']);
});

test("lines: empty log gives just the status line", () => {
  const world = {
    hero: { stats: { hp: 0, maxHp: 10, attack: 0, defense: 0 } },
    gold: 0,
    depth: 3,
    log: []
  };
  assert.deepStrictEqual(lines(world), ['HP 0/10   ATK 0   DEF 0   Gold 0   Depth 3/5']);
});
