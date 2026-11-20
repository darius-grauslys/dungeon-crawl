// The tests of the shape stats.

import { test } from "node:test";
import assert from "node:assert/strict";
import { of } from "../../../shapes/stats/index.mjs";

test("valid: of builds frozen stats with the given values", () => {
  const s = of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.ok(Object.isFrozen(s));
  assert.strictEqual(s.hp, 5);
  assert.strictEqual(s.maxHp, 10);
  assert.strictEqual(s.attack, 3);
  assert.strictEqual(s.defense, 1);
});

test("valid: hp 0 is accepted", () => {
  const s = of({ hp: 0, maxHp: 10, attack: 3, defense: 1 });
  assert.strictEqual(s.hp, 0);
  assert.strictEqual(s.maxHp, 10);
  assert.ok(Object.isFrozen(s));
});

test("valid: hp 11 with maxHp 10 throws TypeError", () => {
  assert.throws(() => of({ hp: 11, maxHp: 10, attack: 3, defense: 1 }), TypeError);
});

test("valid: maxHp 0 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 0, attack: 3, defense: 1 }), TypeError);
});

test("valid: attack -1 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: -1, defense: 1 }), TypeError);
});

test("valid: defense 1.5 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: 3, defense: 1.5 }), TypeError);
});

test("valid: missing hp throws TypeError", () => {
  assert.throws(() => of({ maxHp: 10, attack: 3, defense: 1 }), TypeError);
});
