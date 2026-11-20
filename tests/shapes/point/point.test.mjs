// The tests of the shape point: its intrinsic valid.

import { test } from "node:test";
import assert from "node:assert";
import { of, equals } from "../../../shapes/point/index.mjs";

test("valid: of(3, -2) has x 3 and y -2, and is frozen", () => {
  const p = of(3, -2);
  assert.equal(p.x, 3);
  assert.equal(p.y, -2);
  assert.ok(Object.isFrozen(p));
});

test("valid: of(1.5, 0) throws a TypeError", () => {
  assert.throws(() => of(1.5, 0), TypeError);
});

test("valid: of(0, NaN) throws a TypeError", () => {
  assert.throws(() => of(0, NaN), TypeError);
});

test("valid: of('1', 2) throws a TypeError", () => {
  assert.throws(() => of("1", 2), TypeError);
});

test("valid: of(1) throws a TypeError", () => {
  assert.throws(() => of(1), TypeError);
});

test("valid: equals(of(1, 2), of(1, 2)) is true", () => {
  assert.ok(equals(of(1, 2), of(1, 2)));
});

test("valid: equals(of(1, 2), of(2, 1)) is false", () => {
  assert.ok(!equals(of(1, 2), of(2, 1)));
});
