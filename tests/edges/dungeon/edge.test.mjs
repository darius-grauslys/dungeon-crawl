// The edge test for dungeon: one test per intrinsic of generate, built from the plan.

import { test } from "node:test";
import assert from "node:assert/strict";

import { generate } from "../../../edges/edge_to_dungeon.mjs";

import * as floorPlan from "../../../shapes/floor-plan/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as point from "../../../shapes/point/index.mjs";

// Intrinsic - deterministic:
test("generate: deterministic", () => {
  const seeds = [0, 1, 77, 4294967295];
  const depths = [1, 5];
  for (const s of seeds) {
    for (const d of depths) {
      const a = generate(s, d);
      const b = generate(s, d);
      assert.deepStrictEqual(a.grid.tiles(), b.grid.tiles());
      assert.ok(point.equals(a.start, b.start));
      assert.ok(point.equals(a.stairs, b.stairs));
      assert.strictEqual(a.spots.length, b.spots.length);
      for (let i = 0; i < a.spots.length; i++) {
        assert.ok(point.equals(a.spots[i], b.spots[i]));
      }
    }
  }
  const g11 = generate(1, 1).grid.tiles();
  const g21 = generate(2, 1).grid.tiles();
  let same = true;
  if (g11.length !== g21.length) same = false;
  else for (let i = 0; i < g11.length; i++) if (g11[i] !== g21[i]) { same = false; break; }
  assert.ok(!same, "generate(1, 1) and generate(2, 1) should differ");
  const g12 = generate(1, 2).grid.tiles();
  same = true;
  if (g11.length !== g12.length) same = false;
  else for (let i = 0; i < g11.length; i++) if (g11[i] !== g12[i]) { same = false; break; }
  assert.ok(!same, "generate(1, 1) and generate(1, 2) should differ");
});

// Intrinsic - bounded:
test("generate: bounded", () => {
  const depths = [1, 2, 3, 4, 5, 7, 11, 13, 23, 25, 29];
  for (let s = 0; s <= 19; s++) {
    for (const d of depths) {
      const plan = generate(s, d);
      const g = plan.grid;
      assert.strictEqual(g.width, 48);
      assert.strictEqual(g.height, 32);
      let stairsCount = 0;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 48; x++) {
          const isBorder = x === 0 || y === 0 || x === 47 || y === 31;
          if (isBorder) {
            assert.strictEqual(g.at(x, y), "wall");
          } else if (g.at(x, y) === "stairs") {
            stairsCount++;
            assert.ok(point.equals(plan.stairs, point.of(x, y)));
          }
        }
      }
      assert.strictEqual(stairsCount, 1);
    }
  }
});

// Intrinsic - connected:
test("generate: connected", () => {
  const depths = [1, 2, 3, 4, 5, 7, 11, 13, 23, 25, 29, 6, 24];
  for (let s = 0; s <= 19; s++) {
    for (const d of depths) {
      const plan = generate(s, d);
      const g = plan.grid;
      const visited = new Set();
      const stack = [plan.start];
      visited.add(plan.start.x + "," + plan.start.y);
      while (stack.length) {
        const p = stack.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = p.x + dx;
          const ny = p.y + dy;
          if (g.open(nx, ny)) {
            const key = nx + "," + ny;
            if (!visited.has(key)) {
              visited.add(key);
              stack.push(point.of(nx, ny));
            }
          }
        }
      }
      for (let y = 0; y < g.height; y++) {
        for (let x = 0; x < g.width; x++) {
          if (g.open(x, y)) assert.ok(visited.has(x + "," + y));
        }
      }
    }
  }
});

// Intrinsic - spots-apart:
test("generate: spots-apart", () => {
  const depths = [1, 2, 3, 4, 5, 7, 11, 13, 23, 25, 29];
  for (let s = 0; s <= 19; s++) {
    for (const d of depths) {
      const plan = generate(s, d);
      const g = plan.grid;
      assert.ok(plan.spots.length >= 12 && plan.spots.length <= 40);
      const seen = new Set();
      for (const sp of plan.spots) {
        const key = sp.x + "," + sp.y;
        assert.ok(!seen.has(key));
        seen.add(key);
        assert.strictEqual(g.at(sp.x, sp.y), "floor");
        assert.ok(!point.equals(sp, plan.start));
        assert.ok(!point.equals(sp, plan.stairs));
        const dStart = Math.abs(sp.x - plan.start.x) + Math.abs(sp.y - plan.start.y);
        assert.ok(dStart >= 5);
      }
      const dStairs = Math.abs(plan.stairs.x - plan.start.x) + Math.abs(plan.stairs.y - plan.start.y);
      assert.ok(dStairs >= 10);
    }
  }
});

// Intrinsic - shop:
test("generate: shop", () => {
  const seeds = [0, 1, 4294967295];
  const depths = [6, 12, 18, 24];
  const shopTiles = generate(0, 6).grid.tiles();
  for (const s of seeds) {
    for (const d of depths) {
      const plan = generate(s, d);
      const g = plan.grid;
      assert.strictEqual(g.width, 48);
      assert.strictEqual(g.height, 32);
      assert.strictEqual(g.at(14, 10), "floor");
      assert.strictEqual(g.at(33, 21), "floor");
      assert.strictEqual(g.at(16, 12), "floor");
      assert.strictEqual(g.at(13, 10), "wall");
      assert.strictEqual(g.at(34, 15), "wall");
      assert.strictEqual(g.at(20, 9), "wall");
      assert.strictEqual(g.at(31, 19), "stairs");
      assert.ok(point.equals(plan.stairs, point.of(31, 19)));
      assert.ok(point.equals(plan.start, point.of(16, 19)));
      const expectedSpots = [
        point.of(16, 13),
        point.of(19, 13),
        point.of(22, 13),
        point.of(25, 13),
        point.of(28, 13),
        point.of(31, 13),
      ];
      assert.strictEqual(plan.spots.length, 6);
      for (let i = 0; i < 6; i++) {
        assert.ok(point.equals(plan.spots[i], expectedSpots[i]));
      }
      assert.deepStrictEqual(g.tiles(), shopTiles);
    }
  }
});

// Intrinsic - refuses:
test("generate: refuses", () => {
  const bad = [
    () => generate(-1, 1),
    () => generate(1.5, 1),
    () => generate(4294967296, 1),
    () => generate(1, 0),
    () => generate(1, 30),
    () => generate("1", 1),
  ];
  for (const fn of bad) {
    assert.throws(fn, TypeError);
  }
});

// Intrinsic - floor-plan/valid:
test("floor-plan: valid", () => {
  const g = tileGrid.fromRows(["#####", "#..>#", "#####"]);
  const plan = floorPlan.of({ grid: g, start: point.of(1, 1), stairs: point.of(3, 1), spots: [point.of(2, 1)] });
  assert.strictEqual(plan.grid, g);
  assert.ok(point.equals(plan.start, point.of(1, 1)));
  assert.ok(point.equals(plan.stairs, point.of(3, 1)));
  assert.strictEqual(plan.spots.length, 1);
  assert.ok(point.equals(plan.spots[0], point.of(2, 1)));
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.spots));

  assert.throws(() => floorPlan.of({ grid: g, start: point.of(0, 1), stairs: point.of(3, 1), spots: [] }), TypeError);
  assert.throws(() => floorPlan.of({ grid: g, start: point.of(1, 1), stairs: point.of(2, 1), spots: [] }), TypeError);
  assert.throws(() => floorPlan.of({ grid: g, start: point.of(1, 1), stairs: point.of(3, 1), spots: [point.of(1, 1)] }), TypeError);
  assert.throws(() => floorPlan.of({ grid: g, start: point.of(1, 1), stairs: point.of(3, 1), spots: [point.of(2, 1), point.of(2, 1)] }), TypeError);
  assert.throws(() => floorPlan.of({ grid: g, start: point.of(1, 1), stairs: point.of(3, 1), spots: {} }), TypeError);
});
