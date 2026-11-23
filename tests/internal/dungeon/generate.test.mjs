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
    assert.strictEqual(p.spots.length, 18);
    assert.strictEqual(p.spots[0].x, 15);
    assert.strictEqual(p.spots[0].y, 13);
    assert.strictEqual(p.spots[1].x, 17);
    assert.strictEqual(p.spots[1].y, 13);
    assert.strictEqual(p.spots[2].x, 19);
    assert.strictEqual(p.spots[2].y, 13);
    assert.strictEqual(p.spots[3].x, 21);
    assert.strictEqual(p.spots[3].y, 13);
    assert.strictEqual(p.spots[4].x, 23);
    assert.strictEqual(p.spots[4].y, 13);
    assert.strictEqual(p.spots[5].x, 25);
    assert.strictEqual(p.spots[5].y, 13);
    assert.strictEqual(p.spots[6].x, 27);
    assert.strictEqual(p.spots[6].y, 13);
    assert.strictEqual(p.spots[7].x, 29);
    assert.strictEqual(p.spots[7].y, 13);
    assert.strictEqual(p.spots[8].x, 31);
    assert.strictEqual(p.spots[8].y, 13);
    assert.strictEqual(p.spots[9].x, 15);
    assert.strictEqual(p.spots[9].y, 16);
    assert.strictEqual(p.spots[10].x, 17);
    assert.strictEqual(p.spots[10].y, 16);
    assert.strictEqual(p.spots[11].x, 19);
    assert.strictEqual(p.spots[11].y, 16);
    assert.strictEqual(p.spots[12].x, 21);
    assert.strictEqual(p.spots[12].y, 16);
    assert.strictEqual(p.spots[13].x, 23);
    assert.strictEqual(p.spots[13].y, 16);
    assert.strictEqual(p.spots[14].x, 25);
    assert.strictEqual(p.spots[14].y, 16);
    assert.strictEqual(p.spots[15].x, 27);
    assert.strictEqual(p.spots[15].y, 16);
    assert.strictEqual(p.spots[16].x, 29);
    assert.strictEqual(p.spots[16].y, 16);
    assert.strictEqual(p.spots[17].x, 31);
    assert.strictEqual(p.spots[17].y, 16);
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
    assert.strictEqual(p.levers[0].x, 39);
    assert.strictEqual(p.levers[0].y, 7);
    assert.strictEqual(p.levers[1].x, 39);
    assert.strictEqual(p.levers[1].y, 25);
    assert.strictEqual(p.levers[2].x, 39);
    assert.strictEqual(p.levers[2].y, 16);
    assert.strictEqual(p.spots.length, 72);
    assert.strictEqual(p.spots[0].x, 37);
    assert.strictEqual(p.spots[0].y, 5);
    assert.strictEqual(p.spots[23].x, 41);
    assert.strictEqual(p.spots[23].y, 9);
    assert.strictEqual(p.spots[24].x, 37);
    assert.strictEqual(p.spots[24].y, 23);
    assert.strictEqual(p.spots[71].x, 41);
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

test("generate returns the reaper lair plan on lair depth 21 (round 3)", () => {
  for (const s of [0, 1, 19]) {
    const p = dungeon.generate(s, 21);
    assert.strictEqual(p.grid.width, 48);
    assert.strictEqual(p.grid.height, 32);
    assert.strictEqual(p.stairs.x, 33);
    assert.strictEqual(p.stairs.y, 16);
    assert.strictEqual(p.start.x, 8);
    assert.strictEqual(p.start.y, 16);
    assert.strictEqual(p.boss.x, 32);
    assert.strictEqual(p.boss.y, 15);
    assert.strictEqual(p.levers.length, 0);
    assert.strictEqual(p.spots.length, 0);
    // tiles deep equal to depth 7
    const p7 = dungeon.generate(0, 7);
    assert.deepStrictEqual(p.grid.tiles(), p7.grid.tiles());
  }
});

test("generate returns the empty lair plan on lair depth 28", () => {
  for (const s of [0, 1, 19]) {
    const p = dungeon.generate(s, 28);
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
});

test("generate returns the serpent lair plan on lair depth 14 (round 2)", () => {
  for (const s of [0, 1, 19]) {
    const p = dungeon.generate(s, 14);
    assert.strictEqual(p.grid.width, 48);
    assert.strictEqual(p.grid.height, 32);
    assert.strictEqual(p.stairs.x, 33);
    assert.strictEqual(p.stairs.y, 16);
    assert.strictEqual(p.start.x, 8);
    assert.strictEqual(p.start.y, 16);
    assert.strictEqual(p.boss.x, 32);
    assert.strictEqual(p.boss.y, 15);
    assert.strictEqual(p.levers.length, 0);
    assert.strictEqual(p.spots.length, 0);
    // tiles deep equal to depth 7
    const p7 = dungeon.generate(0, 7);
    assert.deepStrictEqual(p.grid.tiles(), p7.grid.tiles());
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

test("generate makes two-cell-wide corridors on temple depths 22-26", () => {
  const isOpen = (p, x, y) => {
    const k = p.grid.at(x, y);
    return k === 'floor' || k === 'stairs';
  };
  const inAny2x2 = (p, x, y) => {
    const blocks = [[-1, -1], [0, -1], [-1, 0], [0, 0]];
    for (const [bx, by] of blocks) {
      const ax = x + bx, ay = y + by;
      if (ax >= 0 && ax < 47 && ay >= 0 && ay < 31) {
        if (isOpen(p, ax, ay) && isOpen(p, ax + 1, ay) && isOpen(p, ax, ay + 1) && isOpen(p, ax + 1, ay + 1)) {
          return true;
        }
      }
    }
    return false;
  };
  for (const d of [22, 23, 24, 25, 26]) {
    for (const s of [0, 1, 19]) {
      const p = dungeon.generate(s, d);
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 48; x++) {
          if (!isOpen(p, x, y)) continue;
          assert.ok(inAny2x2(p, x, y), `cell (${x},${y}) not in any 2x2 block at depth ${d}`);
        }
      }
    }
  }
});

test("generate has one-cell-wide corridors on non-temple depths", () => {
  const isOpen = (p, x, y) => {
    const k = p.grid.at(x, y);
    return k === 'floor' || k === 'stairs';
  };
  const inAny2x2 = (p, x, y) => {
    const blocks = [[-1, -1], [0, -1], [-1, 0], [0, 0]];
    for (const [bx, by] of blocks) {
      const ax = x + bx, ay = y + by;
      if (ax >= 0 && ax < 47 && ay >= 0 && ay < 31) {
        if (isOpen(p, ax, ay) && isOpen(p, ax + 1, ay) && isOpen(p, ax, ay + 1) && isOpen(p, ax + 1, ay + 1)) {
          return true;
        }
      }
    }
    return false;
  };
  for (const s of [0, 1, 19]) {
    const p = dungeon.generate(s, 2);
    let foundNarrow = false;
    for (let y = 0; y < 32 && !foundNarrow; y++) {
      for (let x = 0; x < 48; x++) {
        if (!isOpen(p, x, y)) continue;
        if (!inAny2x2(p, x, y)) { foundNarrow = true; break; }
      }
    }
    assert.ok(foundNarrow, `depth 2 should have at least one cell in no 2x2 block`);
  }
});

test("generate has no spikes on depth 1, shops and lairs", () => {
  for (const s of [0, 1, 2, 3, 4]) {
    const p1 = dungeon.generate(s, 1);
    assert.deepStrictEqual(p1.spikes, []);
    for (const d of [6, 7, 13, 14, 20, 21, 27, 28]) {
      const p = dungeon.generate(s, d);
      assert.deepStrictEqual(p.spikes, []);
    }
  }
});

test("generate has spikes on dungeon floors level 2 and above", () => {
  const depths = [2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33];
  for (const d of depths) {
    for (const s of [0, 1, 19]) {
      const p = dungeon.generate(s, d);
      assert.ok(p.spikes.length >= 4 && p.spikes.length <= 100, `depth ${d}: spikes length ${p.spikes.length}`);
      const seen = new Set();
      for (const sp of p.spikes) {
        assert.strictEqual(p.grid.at(sp.x, sp.y), 'floor');
        assert.ok(sp.shift >= 0 && sp.shift <= 5);
        assert.ok(!(sp.x === p.start.x && sp.y === p.start.y));
        assert.ok(!(sp.x === p.stairs.x && sp.y === p.stairs.y));
        const key = sp.x + ',' + sp.y;
        assert.ok(!seen.has(key), `duplicate spike at ${key} on depth ${d}`);
        seen.add(key);
      }
      const p2 = dungeon.generate(s, d);
      assert.deepStrictEqual(p.spikes, p2.spikes);
    }
  }
});

test("generate spikes include a hallway pattern for some seed/depth", () => {
  const depths = [2, 3, 5, 8, 12, 15, 22, 26, 33];
  let foundHallway = false;
  for (let s = 0; s <= 19 && !foundHallway; s++) {
    for (const d of depths) {
      const p = dungeon.generate(s, d);
      // check rows and columns for hallway pattern k,k,k+1,k+1,...(mod 6) of length >= 4
      const shifts = {};
      for (const sp of p.spikes) shifts[sp.x + ',' + sp.y] = sp.shift;
      const checkLine = (cells) => {
        const vals = cells.map(c => shifts[c]).filter(v => v !== undefined);
        if (vals.length < 4) return false;
        for (let i = 0; i + 3 < vals.length; i++) {
          const k = vals[i];
          if (vals[i] === k && vals[i+1] === k && vals[i+2] === (k+1)%6 && vals[i+3] === (k+1)%6) return true;
        }
        return false;
      };
      for (let y = 0; y < 32; y++) {
        const row = [];
        for (let x = 0; x < 48; x++) row.push(`${x},${y}`);
        if (checkLine(row)) { foundHallway = true; break; }
      }
      for (let x = 0; x < 48; x++) {
        const col = [];
        for (let y = 0; y < 32; y++) col.push(`${x},${y}`);
        if (checkLine(col)) { foundHallway = true; break; }
      }
      if (foundHallway) break;
    }
  }
  assert.ok(foundHallway, 'at least one plan should have a hallway spike pattern');
});
