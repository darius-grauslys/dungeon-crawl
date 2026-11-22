// The tests of the shape bestiary: the valid intrinsic.

import { test } from "node:test";
import assert from "node:assert/strict";

import { KINDS, GROUPS, SLIMES, entry, group, hostile, flees } from "../../../shapes/bestiary/index.mjs";

test("KINDS: 18 kinds, first bat, last golem, frozen", () => {
  assert.equal(KINDS.length, 18);
  assert.equal(KINDS[0], "bat");
  assert.equal(KINDS[17], "golem");
  assert.ok(Object.isFrozen(KINDS));
});

test("GROUPS: human, undead, vmin, demon, construct, frozen", () => {
  assert.deepEqual(GROUPS, ["human", "undead", "vermin", "demon", "construct"]);
  assert.ok(Object.isFrozen(GROUPS));
});

test("SLIMES: slime, blue-slime, fire-slime, frozen", () => {
  assert.deepEqual(SLIMES, ["slime", "blue-slime", "fire-slime"]);
  assert.ok(Object.isFrozen(SLIMES));
});

test("entry('archer'): correct row, frozen", () => {
  const e = entry("archer");
  assert.deepEqual(e, {
    kind: "archer",
    group: "undead",
    hp: 7,
    attack: 3,
    defense: 1,
    magic: 0,
    magicPower: 1,
    range: 4,
    slows: false,
    reach: 7,
    step: 400,
    strike: 700,
    size: 1,
  });
  assert.ok(Object.isFrozen(e));
});

test("entry('blue-snake').slows is true", () => {
  assert.equal(entry("blue-snake").slows, true);
});

test("entry('golem'): size 3, step 1600, attack 12, defense 12, magic 6, magicPower 2", () => {
  const e = entry("golem");
  assert.equal(e.size, 3);
  assert.equal(e.step, 1600);
  assert.equal(e.attack, 12);
  assert.equal(e.defense, 12);
  assert.equal(e.magic, 6);
  assert.equal(e.magicPower, 2);
});

test("entry('cultist').range is 4", () => {
  assert.equal(entry("cultist").range, 4);
});

test("group: hero is human, imp is demon, golem is construct", () => {
  assert.equal(group("hero"), "human");
  assert.equal(group("imp"), "demon");
  assert.equal(group("golem"), "construct");
});

test("hostile: hero vs non-hero, non-hero vs hero are true", () => {
  assert.equal(hostile("hero", "bat"), true);
  assert.equal(hostile("skeleton", "hero"), true);
});

test("hostile: hero vs hero, bat vs skeleton, imp vs skeleton are false", () => {
  assert.equal(hostile("hero", "hero"), false);
  assert.equal(hostile("bat", "skeleton"), false);
  assert.equal(hostile("imp", "skeleton"), false);
});

test("hostile: demon vs vmin, vmin vs demon are true", () => {
  assert.equal(hostile("demon", "worm"), true);
  assert.equal(hostile("fire-slime", "imp"), true);
});

test("flees: vmin flees demon, otherwise false", () => {
  assert.equal(flees("worm", "demon"), true);
  assert.equal(flees("demon", "worm"), false);
  assert.equal(flees("worm", "hero"), false);
});

test("entry, group, hostile throw TypeError on invalid input", () => {
  assert.throws(() => entry("hero"), TypeError);
  assert.throws(() => entry("dragon"), TypeError);
  assert.throws(() => group(5), TypeError);
  assert.throws(() => hostile("bat", "dragon"), TypeError);
});
