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
  assert.throws(() => dungeon.generate(1, 6), TypeError);
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
