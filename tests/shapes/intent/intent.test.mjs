// The tests of the shape intent.

import { test } from "node:test";
import assert from "node:assert";

import { move, attack, face, use, wait, descend, KINDS } from "../../../shapes/intent/index.mjs";

test("move(0, -1) has kind move, dx 0, dy -1 and is frozen", () => {
  const i = move(0, -1);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);
  assert.ok(Object.isFrozen(i));
});

test("move(1, 1) and move(-1, 1) are accepted (diagonal)", () => {
  const i1 = move(1, 1);
  assert.strictEqual(i1.kind, "move");
  assert.strictEqual(i1.dx, 1);
  assert.strictEqual(i1.dy, 1);
  assert.ok(Object.isFrozen(i1));
  const i2 = move(-1, 1);
  assert.strictEqual(i2.kind, "move");
  assert.strictEqual(i2.dx, -1);
  assert.strictEqual(i2.dy, 1);
  assert.ok(Object.isFrozen(i2));
});

test("attack(1, 0) has kind attack, dx 1, dy 0 and is frozen", () => {
  const i = attack(1, 0);
  assert.strictEqual(i.kind, "attack");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);
  assert.ok(Object.isFrozen(i));
});

test("attack() and attack(0, 0) have dx and dy 0", () => {
  const i1 = attack();
  assert.strictEqual(i1.kind, "attack");
  assert.strictEqual(i1.dx, 0);
  assert.strictEqual(i1.dy, 0);
  assert.ok(Object.isFrozen(i1));
  const i2 = attack(0, 0);
  assert.strictEqual(i2.kind, "attack");
  assert.strictEqual(i2.dx, 0);
  assert.strictEqual(i2.dy, 0);
  assert.ok(Object.isFrozen(i2));
});

test("attack(-1, -1) is accepted", () => {
  const i = attack(-1, -1);
  assert.strictEqual(i.kind, "attack");
  assert.strictEqual(i.dx, -1);
  assert.strictEqual(i.dy, -1);
  assert.ok(Object.isFrozen(i));
});

test("face(1, -1) has kind face, dx 1, dy -1 and is frozen", () => {
  const i = face(1, -1);
  assert.strictEqual(i.kind, "face");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, -1);
  assert.ok(Object.isFrozen(i));
});

test("use() has kind use, dx 0, dy 0 and is frozen", () => {
  const i = use();
  assert.strictEqual(i.kind, "use");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 0);
  assert.ok(Object.isFrozen(i));
});

test("wait() has kind wait, dx 0, dy 0 and is frozen", () => {
  const i = wait();
  assert.strictEqual(i.kind, "wait");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 0);
  assert.ok(Object.isFrozen(i));
});

test("descend() has kind descend, dx 0, dy 0 and is frozen", () => {
  const i = descend();
  assert.strictEqual(i.kind, "descend");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 0);
  assert.ok(Object.isFrozen(i));
});

test("move(0, 0) throws a TypeError", () => {
  assert.throws(() => move(0, 0), TypeError);
});

test("move(2, 0) throws a TypeError", () => {
  assert.throws(() => move(2, 0), TypeError);
});

test("move('1', 0) throws a TypeError", () => {
  assert.throws(() => move("1", 0), TypeError);
});

test("face(0, 0) throws a TypeError", () => {
  assert.throws(() => face(0, 0), TypeError);
});

test("face(0, 2) throws a TypeError", () => {
  assert.throws(() => face(0, 2), TypeError);
});

test("attack(2, 0) throws a TypeError", () => {
  assert.throws(() => attack(2, 0), TypeError);
});

test("attack(1) throws a TypeError", () => {
  assert.throws(() => attack(1), TypeError);
});

test("KINDS is ['move', 'attack', 'use', 'wait', 'descend', 'face'] and is frozen", () => {
  assert.deepStrictEqual(KINDS, ["move", "attack", "use", "wait", "descend", "face"]);
  assert.ok(Object.isFrozen(KINDS));
});
