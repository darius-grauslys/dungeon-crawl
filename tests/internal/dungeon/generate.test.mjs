// tests/internal/dungeon/generate.test.mjs: dungeon.generate determinism and the
// regenerate-until-valid loop.

import test from "node:test";
import assert from "node:assert/strict";
import * as dungeon from "../../../src/dungeon/index.mjs";

test("generate is deterministic: same seed and depth give equal plans", () => {
  const p1 = dungeon.generate(1, 1);
  const p2 = dungeon.generate(1, 1);
  assert.deepStrictEqual(p1.grid.tiles(), p2.grid.tiles());
  assert.strictEqual(p1.start.x, p2.start.x);
  assert.strictEqual(p1.start.y, p2.start.y);
  assert.strictEqual(p1.stairs.x, p2.stairs.x);
  assert.strictEqual(p1.stairs.y, p2.stairs.y);
  assert.strictEqual(p1.spots.length, p2.spots.length);
});

test("generate differs for different seeds", () => {
  const p1 = dungeon.generate(1, 1);
  const p2 = dungeon.generate(2, 1);
  assert.notDeepStrictEqual(p1.grid.tiles(), p2.grid.tiles());
});

test("generate differs for different depths", () => {
  const p1 = dungeon.generate(1, 1);
  const p2 = dungeon.generate(1, 2);
  assert.notDeepStrictEqual(p1.grid.tiles(), p2.grid.tiles());
});

test("generate refuses invalid seed with TypeError", () => {
  assert.throws(() => dungeon.generate(-1, 1), TypeError);
  assert.throws(() => dungeon.generate(1.5, 1), TypeError);
  assert.throws(() => dungeon.generate(4294967296, 1), TypeError);
  assert.throws(() => dungeon.generate("1", 1), TypeError);
});

test("generate refuses invalid depth with TypeError", () => {
  assert.throws(() => dungeon.generate(1, 0), TypeError);
  assert.throws(() => dungeon.generate(1, 30), TypeError);
});

test("generate returns the fixed shop plan on shop depths", () => {
  for (const d of [6, 12, 18, 24]) {
    const p = dungeon.generate(0, d);
    assert.strictEqual(p.grid.width, 48);
    assert.strictEqual(p.grid.height, 32);
    assert.strictEqual(p.grid.at(14, 10), 'floor');
    assert.strictEqual(p.grid.at(33, 21), 'floor');
    assert.strictEqual(p.grid.at(16, 12), 'floor');
    assert.strictEqual(p.grid.at(13, 10), 'wall');
    assert.strictEqual(p.grid.at(34, 15), 'wall');
    assert.strictEqual(p.grid.at(20, 9), 'wall');
    assert.strictEqual(p.grid.at(31, 19), 'stairs');
    assert.strictEqual(p.start.x, 16);
    assert.strictEqual(p.start.y, 19);
    assert.strictEqual(p.stairs.x, 31);
    assert.strictEqual(p.stairs.y, 19);
    assert.strictEqual(p.spots.length, 6);
    assert.strictEqual(p.spots[0].x, 16);
    assert.strictEqual(p.spots[0].y, 13);
    assert.strictEqual(p.spots[1].x, 19);
    assert.strictEqual(p.spots[1].y, 13);
    assert.strictEqual(p.spots[2].x, 22);
    assert.strictEqual(p.spots[2].y, 13);
    assert.strictEqual(p.spots[3].x, 25);
    assert.strictEqual(p.spots[3].y, 13);
    assert.strictEqual(p.spots[4].x, 28);
    assert.strictEqual(p.spots[4].y, 13);
    assert.strictEqual(p.spots[5].x, 31);
    assert.strictEqual(p.spots[5].y, 13);
    // deterministic across seeds
    const p2 = dungeon.generate(4294967295, d);
    assert.deepStrictEqual(p.grid.tiles(), p2.grid.tiles());
  }
});

test("generate works for depths above 5 (non-shop depths)", () => {
  for (const d of [7, 11, 13, 23, 25, 29]) {
    for (const s of [0, 1, 19]) {
      const p = dungeon.generate(s, d);
      assert.strictEqual(p.grid.width, 48);
      assert.strictEqual(p.grid.height, 32);
      assert.ok(p.spots.length >= 12 && p.spots.length <= 40);
    }
  }
});

test("generate loop produces a valid plan (regenerate-until-valid)", () => {
  // For seeds 0 to 19 and depths 1 to 5, generate should always return a plan.
  for (let s = 0; s <= 19; s++) {
    for (let d = 1; d <= 5; d++) {
      const p = dungeon.generate(s, d);
      assert.strictEqual(p.grid.width, 48);
      assert.strictEqual(p.grid.height, 32);
      assert.ok(p.spots.length >= 12 && p.spots.length <= 40);
    }
  }
});
