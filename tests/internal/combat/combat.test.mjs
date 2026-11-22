// internal tests for combat.resolve

import test from "node:test";
import assert from "node:assert/strict";

import * as strikeShape from "../../../shapes/strike/index.mjs";
import { resolve } from "../../../src/combat/index.mjs";

const stats = (hp, maxHp, attack, defense, range = 1, magic = 0, magicPower = 1, magicResist = 0) =>
  Object.freeze({ hp, maxHp, attack, defense, range, magic, magicPower, magicResist });

test("combat.resolve: refuses a roll of 0", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 0, 50), TypeError);
});

test("combat.resolve: refuses a roll of 21", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 21, 50), TypeError);
});

test("combat.resolve: refuses a non-integer roll", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 2.5, 50), TypeError);
  assert.throws(() => resolve(a, d, "7", 50), TypeError);
});

test("combat.resolve: refuses a ward of 0", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 10, 0), TypeError);
});

test("combat.resolve: refuses a ward of 101", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 10, 101), TypeError);
});

test("combat.resolve: refuses a non-integer ward", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 10, 1.5), TypeError);
  assert.throws(() => resolve(a, d, 10, "7"), TypeError);
});

test("combat.resolve: refuses a plain object in place of stats", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve({}, {}, 10, 50), TypeError);
  assert.throws(() => resolve({ hp: 10 }, {}, 10, 50), TypeError);
  assert.throws(() => resolve({}, { hp: 10, maxHp: 10, attack: 0, defense: 1 }, 10, 50), TypeError);
});

if (!strikeShape._sheo_stub) {
  test("combat.resolve: rolls intrinsic", () => {
    const a = stats(10, 10, 4, 0);
    const d = stats(10, 10, 0, 1);
    const miss1 = resolve(a, d, 1, 50);
    assert.equal(miss1.hit, false);
    assert.equal(miss1.critical, false);
    assert.equal(miss1.damage, 0);
    assert.equal(miss1.magic, 0);
    const miss6 = resolve(a, d, 6, 50);
    assert.equal(miss6.hit, false);
    assert.equal(miss6.critical, false);
    assert.equal(miss6.damage, 0);
    assert.equal(miss6.magic, 0);
    const hit7 = resolve(a, d, 7, 50);
    assert.equal(hit7.hit, true);
    assert.equal(hit7.critical, false);
    assert.equal(hit7.damage, 3);
    assert.equal(hit7.magic, 0);
    const hit19 = resolve(a, d, 19, 50);
    assert.equal(hit19.hit, true);
    assert.equal(hit19.critical, false);
    assert.equal(hit19.damage, 3);
    assert.equal(hit19.magic, 0);
    const crit20 = resolve(a, d, 20, 50);
    assert.equal(crit20.hit, true);
    assert.equal(crit20.critical, true);
    assert.equal(crit20.damage, 6);
    assert.equal(crit20.magic, 0);
  });

  test("combat.resolve: minimum intrinsic", () => {
    const a = stats(10, 10, 2, 0);
    const d = stats(10, 10, 0, 5);
    const miss12 = resolve(a, d, 12, 50);
    assert.equal(miss12.hit, false);
    assert.equal(miss12.critical, false);
    assert.equal(miss12.damage, 0);
    const hit13 = resolve(a, d, 13, 50);
    assert.equal(hit13.hit, true);
    assert.equal(hit13.critical, false);
    assert.equal(hit13.damage, 1);
    const hit19 = resolve(a, d, 19, 50);
    assert.equal(hit19.hit, true);
    assert.equal(hit19.critical, false);
    assert.equal(hit19.damage, 1);
    const crit20 = resolve(a, d, 20, 50);
    assert.equal(crit20.hit, true);
    assert.equal(crit20.critical, true);
    assert.equal(crit20.damage, 2);
  });

  test("combat.resolve: magic intrinsic", () => {
    const a = stats(10, 10, 12, 12, 1, 6, 2, 0);
    const d = stats(10, 10, 4, 1, 1, 0, 1, 0);
    const miss1 = resolve(a, d, 1, 1);
    assert.equal(miss1.hit, false);
    assert.equal(miss1.critical, false);
    assert.equal(miss1.damage, 0);
    assert.equal(miss1.magic, 0);
    const hit19 = resolve(a, d, 19, 1);
    assert.equal(hit19.hit, true);
    assert.equal(hit19.critical, false);
    assert.equal(hit19.damage, 17);
    assert.equal(hit19.magic, 6);
    const crit20 = resolve(a, d, 20, 1);
    assert.equal(crit20.hit, true);
    assert.equal(crit20.critical, true);
    assert.equal(crit20.damage, 28);
    assert.equal(crit20.magic, 6);
    const d20 = stats(10, 10, 4, 20, 1, 0, 1, 0);
    const crit20b = resolve(a, d20, 20, 1);
    assert.equal(crit20b.hit, true);
    assert.equal(crit20b.critical, true);
    assert.equal(crit20b.damage, 8);
    assert.equal(crit20b.magic, 6);
  });

  test("combat.resolve: ward intrinsic", () => {
    const a = stats(10, 10, 12, 12, 1, 6, 2, 0);
    // magicResist 1, chance 50
    const d1 = stats(10, 10, 4, 1, 1, 0, 1, 1);
    const w50 = resolve(a, d1, 19, 50);
    assert.equal(w50.damage, 12);
    assert.equal(w50.magic, 1);
    const w51 = resolve(a, d1, 19, 51);
    assert.equal(w51.damage, 17);
    assert.equal(w51.magic, 6);
    // magicResist 3, chance 75
    const d3 = stats(10, 10, 4, 1, 1, 0, 1, 3);
    const w75 = resolve(a, d3, 19, 75);
    assert.equal(w75.magic, 1);
    const w76 = resolve(a, d3, 19, 76);
    assert.equal(w76.magic, 6);
    // magicResist 4, chance 99 (capped)
    const d4 = stats(10, 10, 4, 1, 1, 0, 1, 4);
    const w99 = resolve(a, d4, 19, 99);
    assert.equal(w99.magic, 1);
    const w100 = resolve(a, d4, 19, 100);
    assert.equal(w100.magic, 6);
    // magicPower 1, magic 6, magicResist 1, chance 99
    const a1 = stats(10, 10, 12, 12, 1, 6, 1, 0);
    const d1p = stats(10, 10, 4, 1, 1, 0, 1, 1);
    const w99a = resolve(a1, d1p, 19, 99);
    assert.equal(w99a.magic, 1);
    const w100a = resolve(a1, d1p, 19, 100);
    assert.equal(w100a.magic, 6);
    // magic 0, magicResist 1, ward 1: magic 0
    const a0 = stats(10, 10, 12, 12, 1, 0, 2, 0);
    const d0 = stats(10, 10, 4, 1, 1, 0, 1, 1);
    const w1 = resolve(a0, d0, 19, 1);
    assert.equal(w1.magic, 0);
  });
}
