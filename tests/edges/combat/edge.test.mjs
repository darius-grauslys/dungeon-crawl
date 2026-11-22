// The edge test for combat: resolve.

import { test } from "node:test";
import assert from "node:assert/strict";

import { resolve } from "../../../edges/edge_to_combat.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as strike from "../../../shapes/strike/index.mjs";

test("rolls", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 0 });
  const defender = stats.of({ hp: 10, maxHp: 10, attack: 0, defense: 1 });

  let s = resolve(attacker, defender, 1, 50);
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 6, 50);
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 7, 50);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 3);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 19, 50);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 3);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 20, 50);
  assert.equal(s.hit, true);
  assert.equal(s.critical, true);
  assert.equal(s.damage, 6);
  assert.equal(s.magic, 0);
});

test("minimum", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 2, defense: 0 });
  const defender = stats.of({ hp: 10, maxHp: 10, attack: 0, defense: 5 });

  let s = resolve(attacker, defender, 12, 50);
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 13, 50);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 1);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 19, 50);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 1);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 20, 50);
  assert.equal(s.hit, true);
  assert.equal(s.critical, true);
  assert.equal(s.damage, 2);
  assert.equal(s.magic, 0);
});

test("magic", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 12, defense: 12, magic: 6, magicPower: 2 });
  const defender = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 1 });

  let s = resolve(attacker, defender, 1, 1);
  assert.equal(s.hit, false);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 0);
  assert.equal(s.magic, 0);

  s = resolve(attacker, defender, 19, 1);
  assert.equal(s.hit, true);
  assert.equal(s.critical, false);
  assert.equal(s.damage, 17);
  assert.equal(s.magic, 6);

  s = resolve(attacker, defender, 20, 1);
  assert.equal(s.hit, true);
  assert.equal(s.critical, true);
  assert.equal(s.damage, 28);
  assert.equal(s.magic, 6);

  const defender20 = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 20 });
  s = resolve(attacker, defender20, 20, 1);
  assert.equal(s.hit, true);
  assert.equal(s.critical, true);
  assert.equal(s.damage, 8);
  assert.equal(s.magic, 6);
});

test("ward", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 12, defense: 12, magic: 6, magicPower: 2 });

  const def1 = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 1, magicResist: 1 });
  let s = resolve(attacker, def1, 19, 50);
  assert.equal(s.damage, 12);
  assert.equal(s.magic, 1);
  s = resolve(attacker, def1, 19, 51);
  assert.equal(s.damage, 17);
  assert.equal(s.magic, 6);

  const def3 = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 1, magicResist: 3 });
  s = resolve(attacker, def3, 19, 75);
  assert.equal(s.magic, 1);
  s = resolve(attacker, def3, 19, 76);
  assert.equal(s.magic, 6);

  const def4 = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 1, magicResist: 4 });
  s = resolve(attacker, def4, 19, 99);
  assert.equal(s.magic, 1);
  s = resolve(attacker, def4, 19, 100);
  assert.equal(s.magic, 6);

  const attacker2 = stats.of({ hp: 10, maxHp: 10, attack: 12, defense: 12, magic: 6, magicPower: 1 });
  const defP1 = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 1, magicResist: 1 });
  s = resolve(attacker2, defP1, 19, 99);
  assert.equal(s.magic, 1);
  s = resolve(attacker2, defP1, 19, 100);
  assert.equal(s.magic, 6);

  const attacker3 = stats.of({ hp: 10, maxHp: 10, attack: 12, defense: 12, magic: 0, magicPower: 2 });
  const defR1 = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 1, magicResist: 1 });
  s = resolve(attacker3, defR1, 19, 1);
  assert.equal(s.magic, 0);
});

test("refuses", () => {
  const attacker = stats.of({ hp: 10, maxHp: 10, attack: 4, defense: 0 });
  const defender = stats.of({ hp: 10, maxHp: 10, attack: 0, defense: 1 });

  for (const roll of [0, 21, 2.5, "7"]) {
    assert.throws(() => resolve(attacker, defender, roll, 50), TypeError);
  }
  for (const ward of [0, 101, 1.5, "7"]) {
    assert.throws(() => resolve(attacker, defender, 10, ward), TypeError);
  }
  assert.throws(() => resolve({}, defender, 10, 50), TypeError);
  assert.throws(() => resolve(attacker, {}, 10, 50), TypeError);
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
