// The edge test for dungeon: one test per intrinsic of generate, built from the plan.

import { test } from "node:test";
import assert from "node:assert/strict";

import { generate } from "../../../edges/edge_to_dungeon.mjs";

import * as floorPlan from "../../../shapes/floor-plan/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as level from "../../../shapes/level/index.mjs";

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
  const depths = [1, 2, 3, 4, 5, 8, 12, 15, 26, 29, 33];
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
      assert.strictEqual(plan.boss, null);
      assert.deepStrictEqual(plan.levers, []);
    }
  }
});

// Intrinsic - connected:
test("generate: connected", () => {
  const depths = [1, 2, 3, 4, 5, 8, 12, 15, 26, 29, 33, 6, 7, 14, 27];
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
  const depths = [1, 2, 3, 4, 5, 8, 12, 15, 26, 29, 33];
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
  const depths = [6, 13, 20, 27];
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
        point.of(15, 13),
        point.of(17, 13),
        point.of(19, 13),
        point.of(21, 13),
        point.of(23, 13),
        point.of(25, 13),
        point.of(27, 13),
        point.of(29, 13),
        point.of(31, 13),
        point.of(15, 16),
        point.of(17, 16),
        point.of(19, 16),
        point.of(21, 16),
        point.of(23, 16),
        point.of(25, 16),
        point.of(27, 16),
        point.of(29, 16),
        point.of(31, 16),
      ];
      assert.strictEqual(plan.spots.length, 18);
      for (let i = 0; i < 18; i++) {
        assert.ok(point.equals(plan.spots[i], expectedSpots[i]));
      }
      assert.strictEqual(plan.boss, null);
      assert.deepStrictEqual(g.tiles(), shopTiles);
    }
  }
});

// Intrinsic - lair:
test("generate: lair", () => {
  const s7Tiles = generate(0, 7).grid.tiles();
  // depth 7: boss, levers, 72 spots
  for (const s of [0, 4294967295]) {
    const plan = generate(s, 7);
    const g = plan.grid;
    assert.strictEqual(g.width, 48);
    assert.strictEqual(g.height, 32);
    assert.strictEqual(g.at(6, 4), "floor");
    assert.strictEqual(g.at(41, 27), "floor");
    assert.strictEqual(g.at(20, 20), "floor");
    assert.strictEqual(g.at(5, 4), "wall");
    assert.strictEqual(g.at(42, 16), "wall");
    assert.strictEqual(g.at(20, 3), "wall");
    assert.strictEqual(g.at(33, 16), "stairs");
    assert.ok(point.equals(plan.stairs, point.of(33, 16)));
    assert.ok(point.equals(plan.start, point.of(8, 16)));
    assert.ok(point.equals(plan.boss, point.of(32, 15)));
    assert.strictEqual(plan.levers.length, 3);
    assert.ok(point.equals(plan.levers[0], point.of(39, 7)));
    assert.ok(point.equals(plan.levers[1], point.of(39, 25)));
    assert.ok(point.equals(plan.levers[2], point.of(39, 16)));
    assert.strictEqual(plan.spots.length, 72);
    assert.ok(point.equals(plan.spots[0], point.of(37, 5)));
    assert.ok(point.equals(plan.spots[23], point.of(41, 9)));
    assert.ok(point.equals(plan.spots[24], point.of(37, 23)));
    assert.ok(point.equals(plan.spots[71], point.of(41, 18)));
    for (const sp of plan.spots) {
      for (const lever of plan.levers) {
        assert.ok(!point.equals(sp, lever));
      }
      // no spot within 2 of the boss's square (x 32 to 34, y 15 to 17)
      const dx = Math.max(32 - sp.x, 0, sp.x - 34);
      const dy = Math.max(15 - sp.y, 0, sp.y - 17);
      assert.ok(Math.max(dx, dy) > 2);
    }
    assert.deepStrictEqual(g.tiles(), s7Tiles);
  }
  // depth 14: serpent's lair, boss (32, 15), no levers, no spots
  {
    const plan = generate(0, 14);
    const g = plan.grid;
    assert.deepStrictEqual(g.tiles(), s7Tiles);
    assert.ok(point.equals(plan.stairs, point.of(33, 16)));
    assert.ok(point.equals(plan.start, point.of(8, 16)));
    assert.ok(point.equals(plan.boss, point.of(32, 15)));
    assert.deepStrictEqual(plan.levers, []);
    assert.deepStrictEqual(plan.spots, []);
  }
  // depths 21, 28: empty hall, no boss, no levers, no spots
  for (const d of [21, 28]) {
    const plan = generate(0, d);
    const g = plan.grid;
    assert.deepStrictEqual(g.tiles(), s7Tiles);
    assert.ok(point.equals(plan.stairs, point.of(33, 16)));
    assert.ok(point.equals(plan.start, point.of(8, 16)));
    assert.strictEqual(plan.boss, null);
    assert.deepStrictEqual(plan.levers, []);
    assert.deepStrictEqual(plan.spots, []);
  }
});

// Intrinsic - refuses:
test("generate: refuses", () => {
  const bad = [
    () => generate(-1, 1),
    () => generate(1.5, 1),
    () => generate(4294967296, 1),
    () => generate(1, 0),
    () => generate(1, 34),
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

// Intrinsic - level/valid:
test("level: valid", () => {
  assert.strictEqual(level.MAX_DEPTH, 33);
  assert.strictEqual(level.MAX_LEVEL, 25);
  assert.ok(Object.isFrozen(level.THEMES));
  assert.deepStrictEqual([...level.THEMES], ['dungeon', 'frozen', 'arid', 'temple', 'magma', 'interior']);
  assert.ok(Object.isFrozen(level.DUNGEON_THEMES));
  assert.deepStrictEqual([...level.DUNGEON_THEMES], ['dungeon', 'frozen', 'arid', 'temple', 'magma']);

  assert.strictEqual(level.kind(1), 'dungeon');
  assert.strictEqual(level.kind(5), 'dungeon');
  assert.strictEqual(level.kind(8), 'dungeon');
  assert.strictEqual(level.kind(33), 'dungeon');
  assert.strictEqual(level.kind(6), 'interior');
  assert.strictEqual(level.kind(13), 'interior');
  assert.strictEqual(level.kind(20), 'interior');
  assert.strictEqual(level.kind(27), 'interior');
  assert.strictEqual(level.kind(7), 'boss');
  assert.strictEqual(level.kind(14), 'boss');
  assert.strictEqual(level.kind(21), 'boss');
  assert.strictEqual(level.kind(28), 'boss');

  assert.strictEqual(level.theme(1), 'dungeon');
  assert.strictEqual(level.theme(6), 'interior');
  assert.strictEqual(level.theme(7), 'dungeon');
  assert.strictEqual(level.theme(8), 'frozen');
  assert.strictEqual(level.theme(15), 'arid');
  assert.strictEqual(level.theme(26), 'temple');
  assert.strictEqual(level.theme(28), 'temple');
  assert.strictEqual(level.theme(29), 'magma');
  assert.strictEqual(level.theme(33), 'magma');

  const blend7 = level.blend(7);
  assert.deepStrictEqual([...blend7], ['dungeon', 'frozen']);
  assert.ok(Object.isFrozen(blend7));
  const blend28 = level.blend(28);
  assert.deepStrictEqual([...blend28], ['temple', 'magma']);
  assert.strictEqual(level.blend(6), null);
  assert.strictEqual(level.blend(8), null);

  assert.strictEqual(level.tier(5), 0);
  assert.strictEqual(level.tier(6), 0);
  assert.strictEqual(level.tier(7), 0);
  assert.strictEqual(level.tier(8), 1);
  assert.strictEqual(level.tier(33), 4);

  assert.strictEqual(level.stage(1), 1);
  assert.strictEqual(level.stage(12), 5);
  assert.strictEqual(level.stage(13), 6);
  assert.strictEqual(level.stage(14), 7);
  assert.strictEqual(level.stage(29), 1);

  assert.strictEqual(level.round(6), 1);
  assert.strictEqual(level.round(7), 1);
  assert.strictEqual(level.round(27), 4);
  assert.strictEqual(level.round(8), 0);

  assert.strictEqual(level.number(1), 1);
  assert.strictEqual(level.number(5), 5);
  assert.strictEqual(level.number(8), 6);
  assert.strictEqual(level.number(12), 10);
  assert.strictEqual(level.number(33), 25);
  assert.strictEqual(level.number(6), 0);
  assert.strictEqual(level.number(7), 0);

  assert.strictEqual(level.label(8), 'Level 6');
  assert.strictEqual(level.label(13), 'Shop');
  assert.strictEqual(level.label(14), 'Lair');

  assert.throws(() => level.kind(0), TypeError);
  assert.throws(() => level.theme(34), TypeError);
  assert.throws(() => level.tier(1.5), TypeError);
  assert.throws(() => level.blend(40), TypeError);
  assert.throws(() => level.number('3'), TypeError);
  assert.throws(() => level.label(null), TypeError);
});
