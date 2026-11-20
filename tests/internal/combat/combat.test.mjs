// internal tests for combat.resolve

import test from "node:test";
import assert from "node:assert/strict";

import * as strikeShape from "../../../shapes/strike/index.mjs";
import { resolve } from "../../../src/combat/index.mjs";

const stats = (hp, maxHp, attack, defense) =>
  Object.freeze({ hp, maxHp, attack, defense });

test("combat.resolve: refuses a roll of 0", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 0), TypeError);
});

test("combat.resolve: refuses a roll of 21", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 21), TypeError);
});

test("combat.resolve: refuses a non-integer roll", () => {
  const a = stats(10, 10, 4, 0);
  const d = stats(10, 10, 0, 1);
  assert.throws(() => resolve(a, d, 2.5), TypeError);
  assert.throws(() => resolve(a, d, "7"), TypeError);
});

test("combat.resolve: refuses a plain object in place of stats", () => {
  assert.throws(() => resolve({}, {}, 10), TypeError);
  assert.throws(() => resolve({ hp: 10 }, {}, 10), TypeError);
  assert.throws(() => resolve({}, { hp: 10, maxHp: 10, attack: 0, defense: 1 }, 10), TypeError);
});

if (!strikeShape._sheo_stub) {
  test("combat.resolve: rolls intrinsic", () => {
    const a = stats(10, 10, 4, 0);
    const d = stats(10, 10, 0, 1);
    const miss1 = resolve(a, d, 1);
    assert.equal(miss1.hit, false);
    assert.equal(miss1.critical, false);
    assert.equal(miss1.damage, 0);
    const miss6 = resolve(a, d, 6);
    assert.equal(miss6.hit, false);
    assert.equal(miss6.critical, false);
    assert.equal(miss6.damage, 0);
    const hit7 = resolve(a, d, 7);
    assert.equal(hit7.hit, true);
    assert.equal(hit7.critical, false);
    assert.equal(hit7.damage, 3);
    const hit19 = resolve(a, d, 19);
    assert.equal(hit19.hit, true);
    assert.equal(hit19.critical, false);
    assert.equal(hit19.damage, 3);
    const crit20 = resolve(a, d, 20);
    assert.equal(crit20.hit, true);
    assert.equal(crit20.critical, true);
    assert.equal(crit20.damage, 6);
  });

  test("combat.resolve: minimum intrinsic", () => {
    const a = stats(10, 10, 2, 0);
    const d = stats(10, 10, 0, 5);
    const hit19 = resolve(a, d, 19);
    assert.equal(hit19.hit, true);
    assert.equal(hit19.critical, false);
    assert.equal(hit19.damage, 1);
    const crit20 = resolve(a, d, 20);
    assert.equal(crit20.hit, true);
    assert.equal(crit20.critical, true);
    assert.equal(crit20.damage, 2);
  });
}
