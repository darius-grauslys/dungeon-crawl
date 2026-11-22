// The edge test for fov: one test per intrinsic of the EET `compute`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { compute } from "../../../edges/edge_to_fov.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";

test("compute/open-room", () => {
  const g = tileGrid.fromRows([
    "###########",
    "#.........#",
    "#.........#",
    "#.........#",
    "#.........#",
    "#.........#",
    "#.........#",
    "#.........#",
    "#.........#",
    "#.........#",
    "###########",
  ]);
  const big = compute(g, point.of(5, 5), 8);
  assert.equal(big.count(), 121);
  const small = compute(g, point.of(5, 5), 2);
  assert.equal(small.count(), 13);
});

test("compute/walls-block", () => {
  const g = tileGrid.fromRows(["#######", "#.....#", "#.#...#", "#.....#", "#######"]);
  const m = compute(g, point.of(1, 2), 6);
  assert.equal(m.at(2, 2), true);
  assert.equal(m.at(3, 2), false);
  assert.equal(m.at(4, 2), false);
  assert.equal(m.at(5, 2), false);
  assert.equal(m.at(1, 1), true);
  assert.equal(m.at(1, 3), true);
});

test("compute/corridor", () => {
  const g = tileGrid.fromRows(["#####", "#...#", "###.#", "###.#", "#####"]);
  const m = compute(g, point.of(1, 1), 10);
  assert.equal(m.at(3, 1), true);
  assert.equal(m.at(3, 3), false);
});

test("compute/wall-edges", () => {
  const g = tileGrid.fromRows([
    "#######",
    "#.....#",
    "#.....#",
    "#.....#",
    "#######",
  ]);
  const m = compute(g, point.of(3, 2), 1);
  assert.equal(m.count(), 11);
  // in sight
  assert.equal(m.at(3, 2), true);
  assert.equal(m.at(2, 2), true);
  assert.equal(m.at(4, 2), true);
  assert.equal(m.at(3, 1), true);
  assert.equal(m.at(3, 3), true);
  // walls around open cells in sight
  assert.equal(m.at(2, 0), true);
  assert.equal(m.at(3, 0), true);
  assert.equal(m.at(4, 0), true);
  assert.equal(m.at(2, 4), true);
  assert.equal(m.at(3, 4), true);
  assert.equal(m.at(4, 4), true);
  // not seen
  assert.equal(m.at(1, 0), false);
  assert.equal(m.at(5, 0), false);
  assert.equal(m.at(0, 2), false);
  assert.equal(m.at(6, 2), false);
  assert.equal(m.at(2, 1), false);
  assert.equal(m.at(1, 1), false);

  const c = tileGrid.fromRows(["#####", "#...#", "###.#", "###.#", "#####"]);
  const cm = compute(c, point.of(1, 1), 10);
  assert.equal(cm.at(4, 0), true);
  assert.equal(cm.at(3, 4), false);
});

test("compute/origin-seen", () => {
  const g = tileGrid.of(6, 4, Array.from({ length: 24 }, () => "floor"));
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 6; x++) {
      const m = compute(g, point.of(x, y), 1);
      assert.equal(m.at(x, y), true);
    }
  }
  const m = compute(g, point.of(2, 2), 1);
  assert.equal(m.count(), 5);
});

test("compute/refuses", () => {
  const g = tileGrid.fromRows(["#####", "#...#", "#####"]);
  assert.throws(() => compute(g, point.of(-1, 0), 3), TypeError);
  assert.throws(() => compute(g, point.of(0, 0), 0), TypeError);
  assert.throws(() => compute(g, point.of(0, 0), 31), TypeError);
  assert.throws(() => compute(g, { x: 0, y: 0 }, 3), TypeError);
  assert.throws(() => compute(null, point.of(0, 0), 3), TypeError);
});

test("tile-grid/valid", () => {
  const g = tileGrid.fromRows(["###", "#.>", "###"]);
  assert.equal(g.width, 3);
  assert.equal(g.height, 3);
  assert.equal(g.at(1, 1), "floor");
  assert.equal(g.at(2, 1), "stairs");
  assert.equal(g.at(0, 0), "wall");
  assert.equal(g.at(-1, 0), "wall");
  assert.equal(g.at(3, 1), "wall");
  assert.equal(g.open(1, 1), true);
  assert.equal(g.open(2, 1), true);
  assert.equal(g.open(0, 1), false);
  assert.equal(Object.isFrozen(g), true);

  const arr = ["floor", "wall"];
  const tg = tileGrid.of(2, 1, arr);
  assert.equal(tg.at(0, 0), "floor");
  arr[0] = "wall";
  assert.equal(tg.at(0, 0), "floor");
  const t = tg.tiles();
  t[0] = "wall";
  assert.equal(tg.at(0, 0), "floor");

  assert.throws(() => tileGrid.of(2, 2, ["floor"]), TypeError);
  assert.throws(() => tileGrid.of(1, 1, ["lava"]), TypeError);
  assert.throws(() => tileGrid.of(0, 1, []), TypeError);
  assert.throws(() => tileGrid.fromRows([]), TypeError);
  assert.throws(() => tileGrid.fromRows(["##", "#"]), TypeError);
  assert.throws(() => tileGrid.fromRows(["#x"]), TypeError);
});

test("point/valid", () => {
  const p = point.of(3, -2);
  assert.equal(p.x, 3);
  assert.equal(p.y, -2);
  assert.equal(Object.isFrozen(p), true);
  assert.equal(point.equals(point.of(1, 2), point.of(1, 2)), true);
  assert.equal(point.equals(point.of(1, 2), point.of(2, 1)), false);

  assert.throws(() => point.of(1.5, 0), TypeError);
  assert.throws(() => point.of(0, NaN), TypeError);
  assert.throws(() => point.of("1", 2), TypeError);
  assert.throws(() => point.of(1), TypeError);
});

test("mask/valid", () => {
  const e = mask.empty(3, 2);
  assert.equal(e.width, 3);
  assert.equal(e.height, 2);
  assert.equal(e.count(), 0);

  const a = mask.of(2, 1, [true, false]);
  const b = mask.of(2, 1, [false, true]);
  assert.equal(a.at(0, 0), true);
  assert.equal(a.at(1, 0), false);
  assert.equal(a.at(5, 5), false);
  assert.equal(mask.union(a, b).count(), 2);
  assert.equal(Object.isFrozen(a), true);

  assert.throws(() => mask.of(2, 1, [true]), TypeError);
  assert.throws(() => mask.of(1, 1, [1]), TypeError);
  assert.throws(() => mask.union(mask.empty(1, 1), mask.empty(2, 1)), TypeError);
  assert.throws(() => mask.empty(0, 3), TypeError);
});
