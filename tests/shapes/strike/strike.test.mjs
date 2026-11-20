// The tests of the shape strike: its intrinsic valid.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { of } from "../../../shapes/strike/index.mjs";

test("valid: hit has values and is frozen", () => {
  const s = of({ hit: true, critical: false, damage: 3 });
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 3);
  assert.ok(Object.isFrozen(s));
});

test("valid: miss is accepted", () => {
  const s = of({ hit: false, critical: false, damage: 0 });
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);
});

test("valid: miss with damage 2 throws TypeError", () => {
  assert.throws(() => of({ hit: false, critical: false, damage: 2 }), TypeError);
});

test("valid: miss that is critical throws TypeError", () => {
  assert.throws(() => of({ hit: false, critical: true, damage: 0 }), TypeError);
});

test("valid: hit with damage 0 throws TypeError", () => {
  assert.throws(() => of({ hit: true, critical: false, damage: 0 }), TypeError);
});

test("valid: damage 1.5 throws TypeError", () => {
  assert.throws(() => of({ hit: true, critical: false, damage: 1.5 }), TypeError);
});
