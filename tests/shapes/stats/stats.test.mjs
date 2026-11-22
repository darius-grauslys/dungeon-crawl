// The tests of the shape stats.

import { test } from "node:test";
import assert from "node:assert/strict";
import { of } from "../../../shapes/stats/index.mjs";

test("valid: of builds frozen stats with the given values", () => {
  const s = of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.ok(Object.isFrozen(s));
  assert.deepStrictEqual(s, { hp: 5, maxHp: 10, attack: 3, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
});

test("valid: hp 0 is accepted", () => {
  const s = of({ hp: 0, maxHp: 10, attack: 3, defense: 1 });
  assert.strictEqual(s.hp, 0);
  assert.strictEqual(s.maxHp, 10);
  assert.ok(Object.isFrozen(s));
});

test("valid: with range 4, range is 4", () => {
  const s = of({ hp: 5, maxHp: 10, attack: 3, defense: 1, range: 4 });
  assert.strictEqual(s.range, 4);
  assert.ok(Object.isFrozen(s));
});

test("valid: with magic 6, magicPower 2, magicResist 3, those three", () => {
  const s = of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magic: 6, magicPower: 2, magicResist: 3 });
  assert.strictEqual(s.magic, 6);
  assert.strictEqual(s.magicPower, 2);
  assert.strictEqual(s.magicResist, 3);
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

test("valid: range 0 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: 3, defense: 1, range: 0 }), TypeError);
});

test("valid: range 10 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: 3, defense: 1, range: 10 }), TypeError);
});

test("valid: magic -1 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magic: -1 }), TypeError);
});

test("valid: magicPower 0 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magicPower: 0 }), TypeError);
});

test("valid: magicResist -1 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magicResist: -1 }), TypeError);
});

test("valid: magicResist 0.5 throws TypeError", () => {
  assert.throws(() => of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magicResist: 0.5 }), TypeError);
});

test("valid: missing hp throws TypeError", () => {
  assert.throws(() => of({ maxHp: 10, attack: 3, defense: 1 }), TypeError);
});
