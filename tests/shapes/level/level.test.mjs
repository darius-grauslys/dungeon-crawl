// The tests of the shape level: the valid intrinsic.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MAX_DEPTH, THEMES, DUNGEON_THEMES, kind, theme, tier, stage, round } from "../../../shapes/level/index.mjs";

test("valid: constants", () => {
  assert.equal(MAX_DEPTH, 29);
  assert.deepEqual(THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma', 'interior']);
  assert.deepEqual(DUNGEON_THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma']);
  assert.ok(Object.isFrozen(THEMES));
  assert.ok(Object.isFrozen(DUNGEON_THEMES));
});

test("valid: kind", () => {
  assert.equal(kind(1), 'dungeon');
  assert.equal(kind(5), 'dungeon');
  assert.equal(kind(29), 'dungeon');
  assert.equal(kind(6), 'interior');
  assert.equal(kind(12), 'interior');
  assert.equal(kind(18), 'interior');
  assert.equal(kind(24), 'interior');
});

test("valid: theme", () => {
  assert.equal(theme(1), 'dungeon');
  assert.equal(theme(6), 'interior');
  assert.equal(theme(7), 'frozen');
  assert.equal(theme(13), 'arid');
  assert.equal(theme(23), 'temple');
  assert.equal(theme(25), 'magma');
  assert.equal(theme(29), 'magma');
});

test("valid: tier", () => {
  assert.equal(tier(5), 0);
  assert.equal(tier(6), 0);
  assert.equal(tier(7), 1);
  assert.equal(tier(29), 4);
});

test("valid: stage", () => {
  assert.equal(stage(1), 1);
  assert.equal(stage(11), 5);
  assert.equal(stage(25), 1);
  assert.equal(stage(12), 6);
});

test("valid: round", () => {
  assert.equal(round(6), 1);
  assert.equal(round(24), 4);
  assert.equal(round(7), 0);
});

test("valid: refuses invalid depths", () => {
  assert.throws(() => kind(0), TypeError);
  assert.throws(() => theme(30), TypeError);
  assert.throws(() => tier(1.5), TypeError);
  assert.throws(() => stage('3'), TypeError);
});
