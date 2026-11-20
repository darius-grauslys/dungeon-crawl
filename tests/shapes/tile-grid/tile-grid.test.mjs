// The tests of the shape tile-grid.

import { test } from "node:test";
import assert from "node:assert";

import { of, fromRows } from "../../../shapes/tile-grid/index.mjs";

test("tile-grid valid: fromRows basic values", () => {
  const grid = fromRows(['###', '#.>', '###']);
  assert.strictEqual(grid.width, 3);
  assert.strictEqual(grid.height, 3);
  assert.strictEqual(grid.at(1, 1), 'floor');
  assert.strictEqual(grid.at(2, 1), 'stairs');
  assert.strictEqual(grid.at(0, 0), 'wall');
  assert.strictEqual(grid.at(-1, 0), 'wall');
  assert.strictEqual(grid.at(3, 1), 'wall');
  assert.strictEqual(grid.open(1, 1), true);
  assert.strictEqual(grid.open(2, 1), true);
  assert.strictEqual(grid.open(0, 1), false);
  assert.ok(Object.isFrozen(grid));
});

test("tile-grid valid: tiles() returns copy row by row", () => {
  const grid = fromRows(['###', '#.>', '###']);
  assert.deepStrictEqual(grid.tiles(), [
    'wall', 'wall', 'wall',
    'wall', 'floor', 'stairs',
    'wall', 'wall', 'wall',
  ]);
});

test("tile-grid valid: of basic values", () => {
  const grid = of(2, 1, ['floor', 'wall']);
  assert.strictEqual(grid.at(0, 0), 'floor');
});

test("tile-grid valid: of and fromRows throw TypeError", () => {
  assert.throws(() => of(2, 2, ['floor']), TypeError);
  assert.throws(() => of(1, 1, ['lava']), TypeError);
  assert.throws(() => of(0, 1, []), TypeError);
  assert.throws(() => fromRows([]), TypeError);
  assert.throws(() => fromRows(['##', '#']), TypeError);
  assert.throws(() => fromRows(['#x']), TypeError);
});

test("tile-grid valid: arrays are copied", () => {
  const input = ['floor', 'wall'];
  const grid = of(2, 1, input);
  input[0] = 'wall';
  assert.strictEqual(grid.at(0, 0), 'floor');

  const t = grid.tiles();
  t[0] = 'wall';
  assert.strictEqual(grid.at(0, 0), 'floor');
});
