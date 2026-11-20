// The tests of the shape sprite: its intrinsic `valid`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { of } from "../../../shapes/sprite/index.mjs";

test("valid: builds with the document's values and is frozen", () => {
  const s = of({ image: {}, sx: 16, sy: 0, sw: 16, sh: 16 });
  assert.deepEqual(s, { image: {}, sx: 16, sy: 0, sw: 16, sh: 16 });
  assert.ok(Object.isFrozen(s));
});

test("valid: image null is refused with a TypeError", () => {
  assert.throws(() => of({ image: null, sx: 16, sy: 0, sw: 16, sh: 16 }), TypeError);
});

test("valid: sx of -1 is refused with a TypeError", () => {
  assert.throws(() => of({ image: {}, sx: -1, sy: 0, sw: 16, sh: 16 }), TypeError);
});

test("valid: sw of 0 is refused with a TypeError", () => {
  assert.throws(() => of({ image: {}, sx: 16, sy: 0, sw: 0, sh: 16 }), TypeError);
});

test("valid: sy of 2.5 is refused with a TypeError", () => {
  assert.throws(() => of({ image: {}, sx: 16, sy: 2.5, sw: 16, sh: 16 }), TypeError);
});
