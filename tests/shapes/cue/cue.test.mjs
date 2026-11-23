// The tests of the shape cue: the valid intrinsic.

import { test } from "node:test";
import assert from "node:assert";

import { of, NAMES } from "../../../shapes/cue/index.mjs";

test("valid: of({name: 'step', gain: 0.5}) has those values and is frozen", () => {
  const c = of({ name: "step", gain: 0.5 });
  assert.strictEqual(c.name, "step");
  assert.strictEqual(c.gain, 0.5);
  assert.ok(Object.isFrozen(c));
});

test("valid: of({name: 'stairs', gain: 1}) is accepted", () => {
  const c = of({ name: "stairs", gain: 1 });
  assert.strictEqual(c.name, "stairs");
  assert.strictEqual(c.gain, 1);
  assert.ok(Object.isFrozen(c));
});

test("valid: name: 'bang' throws a TypeError", () => {
  assert.throws(() => of({ name: "bang", gain: 0.5 }), TypeError);
});

test("valid: of({name: 'hiss', gain: 0.5}) is accepted", () => {
  const c = of({ name: "hiss", gain: 0.5 });
  assert.strictEqual(c.name, "hiss");
  assert.strictEqual(c.gain, 0.5);
  assert.ok(Object.isFrozen(c));
});

test("valid: of({name: 'boom', gain: 1}) is accepted", () => {
  const c = of({ name: "boom", gain: 1 });
  assert.strictEqual(c.name, "boom");
  assert.strictEqual(c.gain, 1);
  assert.ok(Object.isFrozen(c));
});

test("valid: gain: 0 throws a TypeError", () => {
  assert.throws(() => of({ name: "step", gain: 0 }), TypeError);
});

test("valid: gain: 1.5 throws a TypeError", () => {
  assert.throws(() => of({ name: "step", gain: 1.5 }), TypeError);
});

test("valid: gain: '1' throws a TypeError", () => {
  assert.throws(() => of({ name: "step", gain: "1" }), TypeError);
});

test("valid: a missing gain throws a TypeError", () => {
  assert.throws(() => of({ name: "step" }), TypeError);
});

test("valid: NAMES is the table's names and frozen", () => {
  assert.deepStrictEqual(NAMES, [
    "step",
    "swing",
    "shot",
    "hit",
    "death",
    "coin",
    "powerup",
    "use",
    "stairs",
    "hiss",
    "boom",
  ]);
  assert.ok(Object.isFrozen(NAMES));
});
