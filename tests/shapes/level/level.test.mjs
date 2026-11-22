// The tests of the shape level: the valid intrinsic.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MAX_DEPTH, MAX_LEVEL, THEMES, DUNGEON_THEMES, kind, theme, blend, tier, stage, round, number, label } from "../../../shapes/level/index.mjs";

test("valid: constants", () => {
  assert.equal(MAX_DEPTH, 33);
  assert.equal(MAX_LEVEL, 25);
  assert.deepEqual(THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma', 'interior']);
  assert.deepEqual(DUNGEON_THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma']);
  assert.ok(Object.isFrozen(THEMES));
  assert.ok(Object.isFrozen(DUNGEON_THEMES));
});

test("valid: kind", () => {
  assert.equal(kind(1), 'dungeon');
  assert.equal(kind(5), 'dungeon');
  assert.equal(kind(8), 'dungeon');
  assert.equal(kind(33), 'dungeon');
  assert.equal(kind(6), 'interior');
  assert.equal(kind(13), 'interior');
  assert.equal(kind(20), 'interior');
  assert.equal(kind(27), 'interior');
  assert.equal(kind(7), 'boss');
  assert.equal(kind(14), 'boss');
  assert.equal(kind(21), 'boss');
  assert.equal(kind(28), 'boss');
});

test("valid: theme", () => {
  assert.equal(theme(1), 'dungeon');
  assert.equal(theme(6), 'interior');
  assert.equal(theme(7), 'dungeon');
  assert.equal(theme(8), 'frozen');
  assert.equal(theme(15), 'arid');
  assert.equal(theme(26), 'temple');
  assert.equal(theme(28), 'temple');
  assert.equal(theme(29), 'magma');
  assert.equal(theme(33), 'magma');
});

test("valid: blend", () => {
  assert.deepEqual(blend(7), ['dungeon', 'frozen']);
  assert.ok(Object.isFrozen(blend(7)));
  assert.deepEqual(blend(28), ['temple', 'magma']);
  assert.equal(blend(6), null);
  assert.equal(blend(8), null);
});

test("valid: tier", () => {
  assert.equal(tier(5), 0);
  assert.equal(tier(6), 0);
  assert.equal(tier(7), 0);
  assert.equal(tier(8), 1);
  assert.equal(tier(33), 4);
});

test("valid: stage", () => {
  assert.equal(stage(1), 1);
  assert.equal(stage(12), 5);
  assert.equal(stage(13), 6);
  assert.equal(stage(14), 7);
  assert.equal(stage(29), 1);
});

test("valid: round", () => {
  assert.equal(round(6), 1);
  assert.equal(round(7), 1);
  assert.equal(round(27), 4);
  assert.equal(round(8), 0);
});

test("valid: number", () => {
  assert.equal(number(1), 1);
  assert.equal(number(5), 5);
  assert.equal(number(8), 6);
  assert.equal(number(12), 10);
  assert.equal(number(33), 25);
  assert.equal(number(6), 0);
  assert.equal(number(7), 0);
});

test("valid: label", () => {
  assert.equal(label(8), 'Level 6');
  assert.equal(label(13), 'Shop');
  assert.equal(label(14), 'Lair');
});

test("valid: refuses invalid depths", () => {
  assert.throws(() => kind(0), TypeError);
  assert.throws(() => theme(34), TypeError);
  assert.throws(() => tier(1.5), TypeError);
  assert.throws(() => blend(40), TypeError);
  assert.throws(() => number('3'), TypeError);
  assert.throws(() => label(null), TypeError);
});
