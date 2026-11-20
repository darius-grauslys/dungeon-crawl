// The tests of the shape mask.

import { test } from "node:test";
import assert from "node:assert/strict";
import { empty, of, union } from "../../../shapes/mask/index.mjs";

test("valid: empty", () => {
  const m = empty(3, 2);
  assert.strictEqual(m.width, 3);
  assert.strictEqual(m.height, 2);
  assert.strictEqual(m.count(), 0);
});

test("valid: at and union", () => {
  const a = of(2, 1, [true, false]);
  const b = of(2, 1, [false, true]);
  assert.strictEqual(a.at(0, 0), true);
  assert.strictEqual(a.at(1, 0), false);
  assert.strictEqual(a.at(5, 5), false);
  assert.strictEqual(union(a, b).count(), 2);
});

test("valid: frozen", () => {
  const a = of(2, 1, [true, false]);
  assert.ok(Object.isFrozen(a));
});

test("valid: of throws length", () => {
  assert.throws(() => of(2, 1, [true]), TypeError);
});

test("valid: of throws not boolean", () => {
  assert.throws(() => of(1, 1, [1]), TypeError);
});

test("valid: union throws mismatch", () => {
  assert.throws(() => union(empty(1, 1), empty(2, 1)), TypeError);
});

test("valid: empty throws dim", () => {
  assert.throws(() => empty(0, 3), TypeError);
});
