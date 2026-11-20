// The edge test for combat: resolve.

import { test } from "node:test";
import assert from "node:assert/strict";

import { resolve } from "../../../edges/edge_to_combat.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as strike from "../../../shapes/strike/index.mjs";

test("rolls", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 0 });
  const defender = stats.of({ hp: 10, maxHp: 10, attack: 0, defense: 1 });

  let s = resolve(attacker, defender, 1);
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);

  s = resolve(attacker, defender, 6);
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);

  s = resolve(attacker, defender, 7);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 3);

  s = resolve(attacker, defender, 19);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 3);

  s = resolve(attacker, defender, 20);
  assert.equal(s.hit, true);
  assert.equal(s.critical, true);
  assert.equal(s.damage, 6);
});

test("minimum", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 2, defense: 0 });
  const defender = stats.of({ hp: 10, maxHp: 10, attack: 0, defense: 5 });

  let s = resolve(attacker, defender, 12);
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);

  s = resolve(attacker, defender, 13);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 1);

  s = resolve(attacker, defender, 19);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 1);

  s = resolve(attacker, defender, 20);
  assert.equal(s.hit, true);
  assert.equal(s.critical, true);
  assert.equal(s.damage, 2);
});

test("refuses", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 0 });
  const defender = stats.of({ hp: 10, maxHp: 10, attack: 0, defense: 1 });

  for (const roll of [0, 21, 2.5, "7"]) {
    assert.throws(() => resolve(attacker, defender, roll), TypeError);
  }
  assert.throws(() => resolve({}, defender, 10), TypeError);
  assert.throws(() => resolve(attacker, {}, 10), TypeError);
});

test("stats/valid", () => {
  const s = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.equal(s.hp, 5);
  assert.equal(s.maxHp, 10);
  assert.equal(s.attack, 3);
  assert.equal(s.defense, 1);
  assert.ok(Object.isFrozen(s));

  stats.of({ hp: 0, maxHp: 10, attack: 3, defense: 1 });

  assert.throws(() => stats.of({ hp: 11, maxHp: 10, attack: 3, defense: 1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 0, attack: 3, defense: 1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: -1, defense: 1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1.5 }), TypeError);
  assert.throws(() => stats.of({ maxHp: 10, attack: 3, defense: 1 }), TypeError);
});

test("strike/valid", () => {
  const s = strike.of({ hit: true, critical: false, damage: 3 });
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 3);
  assert.ok(Object.isFrozen(s));

  strike.of({ hit: false, critical: false, damage: 0 });

  assert.throws(() => strike.of({ hit: false, critical: false, damage: 2 }), TypeError);
  assert.throws(() => strike.of({ hit: false, critical: true, damage: 0 }), TypeError);
  assert.throws(() => strike.of({ hit: true, critical: false, damage: 0 }), TypeError);
  assert.throws(() => strike.of({ hit: true, critical: false, damage: 1.5 }), TypeError);
});
