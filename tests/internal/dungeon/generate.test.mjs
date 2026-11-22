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
  assert.throws(() => dungeon.generate(1, 34), TypeError);
});

test("generate returns the fixed shop plan on shop depths", () => {
  for (const d of [6, 13, 20, 27]) {
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

test("generate returns the fixed lair plan on lair depth 7 (round 1)", () => {
  for (const s of [0, 4294967295]) {
    const p = dungeon.generate(s, 7);
    assert.strictEqual(p.grid.width, 48);
    assert.strictEqual(p.grid.height, 32);
    assert.strictEqual(p.grid.at(6, 4), 'floor');
    assert.strictEqual(p.grid.at(41, 27), 'floor');
    assert.strictEqual(p.grid.at(20, 20), 'floor');
    assert.strictEqual(p.grid.at(5, 4), 'wall');
    assert.strictEqual(p.grid.at(42, 16), 'wall');
    assert.strictEqual(p.grid.at(20, 3), 'wall');
    assert.strictEqual(p.grid.at(33, 16), 'stairs');
    assert.strictEqual(p.stairs.x, 33);
    assert.strictEqual(p.stairs.y, 16);
    assert.strictEqual(p.start.x, 8);
    assert.strictEqual(p.start.y, 16);
    assert.strictEqual(p.boss.x, 32);
    assert.strictEqual(p.boss.y, 15);
    assert.strictEqual(p.levers.length, 3);
    assert.strictEqual(p.levers[0].x, 12);
    assert.strictEqual(p.levers[0].y, 8);
    assert.strictEqual(p.levers[1].x, 12);
    assert.strictEqual(p.levers[1].y, 24);
    assert.strictEqual(p.levers[2].x, 22);
    assert.strictEqual(p.levers[2].y, 16);
    assert.strictEqual(p.spots.length, 72);
    assert.strictEqual(p.spots[0].x, 10);
    assert.strictEqual(p.spots[0].y, 6);
    assert.strictEqual(p.spots[23].x, 14);
    assert.strictEqual(p.spots[23].y, 10);
    assert.strictEqual(p.spots[24].x, 10);
    assert.strictEqual(p.spots[24].y, 22);
    assert.strictEqual(p.spots[71].x, 24);
    assert.strictEqual(p.spots[71].y, 18);
    // levers are not spots
    for (const lever of p.levers) {
      for (const spot of p.spots) {
        assert.ok(!(spot.x === lever.x && spot.y === lever.y));
      }
    }
    // deterministic across seeds
    const p2 = dungeon.generate(4294967295, 7);
    assert.deepStrictEqual(p.grid.tiles(), p2.grid.tiles());
  }
});

test("generate returns the empty lair plan on lair depths 14, 21, 28", () => {
  for (const d of [14, 21, 28]) {
    for (const s of [0, 1, 19]) {
      const p = dungeon.generate(s, d);
      assert.strictEqual(p.grid.width, 48);
      assert.strictEqual(p.grid.height, 32);
      assert.strictEqual(p.stairs.x, 33);
      assert.strictEqual(p.stairs.y, 16);
      assert.strictEqual(p.start.x, 8);
      assert.strictEqual(p.start.y, 16);
      assert.strictEqual(p.boss, null);
      assert.strictEqual(p.levers.length, 0);
      assert.strictEqual(p.spots.length, 0);
      // tiles deep equal to depth 7
      const p7 = dungeon.generate(0, 7);
      assert.deepStrictEqual(p.grid.tiles(), p7.grid.tiles());
    }
  }
});

test("generate works for dungeon depths (non-shop, non-lair)", () => {
  for (const d of [1, 2, 3, 4, 5, 8, 9, 11, 15, 16, 19, 22, 23, 25, 26, 29, 30, 33]) {
    for (const s of [0, 1, 19]) {
      const p = dungeon.generate(s, d);
      assert.strictEqual(p.grid.width, 48);
      assert.strictEqual(p.grid.height, 32);
      assert.ok(p.spots.length >= 12 && p.spots.length <= 40);
      assert.strictEqual(p.boss, null);
      assert.strictEqual(p.levers.length, 0);
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
