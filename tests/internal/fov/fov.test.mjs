import test from "node:test";
import assert from "node:assert/strict";

import { compute } from "../../../src/fov/index.mjs";
import * as pointShapes from "../../../shapes/point/index.mjs";
import * as tileGridShapes from "../../../shapes/tile-grid/index.mjs";
import * as maskShapes from "../../../shapes/mask/index.mjs";

const pointOf = pointShapes.of;
const gridOf = tileGridShapes.of;
const fromRows = tileGridShapes.fromRows;
const maskOf = maskShapes.of;

test("fov: origin-seen, origin always in sight", () => {
  const grid = gridOf(6, 4, Array(24).fill("floor"));
  const m = compute(grid, pointOf(2, 2), 1);
  assert.equal(m.at(2, 2), true);
});

test("fov: origin-seen, radius 1 from (2,2) gives exactly 5 cells", () => {
  const grid = gridOf(6, 4, Array(24).fill("floor"));
  const m = compute(grid, pointOf(2, 2), 1);
  assert.equal(m.count(), 5);
});

test("fov: open-room radius 2 from (5,5) gives 13 cells", () => {
  const rows = [];
  for (let y = 0; y < 11; y++) {
    let row = "";
    for (let x = 0; x < 11; x++) {
      if (y === 0 || y === 10 || x === 0 || x === 10) row += "#";
      else row += ".";
    }
    rows.push(row);
  }
  const grid = fromRows(rows);
  const m = compute(grid, pointOf(5, 5), 2);
  assert.equal(m.count(), 13);
});

test("fov: open-room radius 8 from (5,5) gives all 121 cells", () => {
  const rows = [];
  for (let y = 0; y < 11; y++) {
    let row = "";
    for (let x = 0; x < 11; x++) {
      if (y === 0 || y === 10 || x === 0 || x === 10) row += "#";
      else row += ".";
    }
    rows.push(row);
  }
  const grid = fromRows(rows);
  const m = compute(grid, pointOf(5, 5), 8);
  assert.equal(m.count(), 121);
});

test("fov: walls-block, (2,2) in sight, (3,2),(4,2),(5,2) not; (1,1),(1,3) are", () => {
  const grid = fromRows(["#######", "#.....#", "#.#...#", "#.....#", "#######"]);
  const m = compute(grid, pointOf(1, 2), 6);
  assert.equal(m.at(2, 2), true);
  assert.equal(m.at(3, 2), false);
  assert.equal(m.at(4, 2), false);
  assert.equal(m.at(5, 2), false);
  assert.equal(m.at(1, 1), true);
  assert.equal(m.at(1, 3), true);
});

test("fov: corridor, (3,1) in sight, (3,3) not", () => {
  const grid = fromRows(["#####", "#...#", "###.#", "###.#", "#####"]);
  const m = compute(grid, pointOf(1, 1), 10);
  assert.equal(m.at(3, 1), true);
  assert.equal(m.at(3, 3), false);
});

test("fov: refuses invalid grid (null)", () => {
  assert.throws(() => compute(null, pointOf(0, 0), 3), TypeError);
});

test("fov: refuses origin not a point", () => {
  const grid = gridOf(3, 3, Array(9).fill("floor"));
  assert.throws(() => compute(grid, { x: 0, y: 0 }, 3), TypeError);
});

test("fov: refuses radius 0", () => {
  const grid = gridOf(3, 3, Array(9).fill("floor"));
  assert.throws(() => compute(grid, pointOf(0, 0), 0), TypeError);
});

test("fov: refuses radius 31", () => {
  const grid = gridOf(3, 3, Array(9).fill("floor"));
  assert.throws(() => compute(grid, pointOf(0, 0), 31), TypeError);
});

test("fov: refuses origin outside grid", () => {
  const grid = gridOf(3, 3, Array(9).fill("floor"));
  assert.throws(() => compute(grid, pointOf(-1, 0), 3), TypeError);
});
