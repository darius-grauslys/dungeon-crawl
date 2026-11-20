// The tests of the shape intent.

import { test } from "node:test";
import assert from "node:assert";

import { move, wait, descend, restart } from "../../../shapes/intent/index.mjs";

test("move(0, -1) has kind move, dx 0, dy -1 and is frozen", () => {
  const i = move(0, -1);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);
  assert.ok(Object.isFrozen(i));
});

test("wait() has kind wait, dx 0, dy 0", () => {
  const i = wait();
  assert.strictEqual(i.kind, "wait");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 0);
  assert.ok(Object.isFrozen(i));
});

test("descend() has kind descend, dx 0, dy 0", () => {
  const i = descend();
  assert.strictEqual(i.kind, "descend");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 0);
  assert.ok(Object.isFrozen(i));
});

test("restart() has kind restart, dx 0, dy 0", () => {
  const i = restart();
  assert.strictEqual(i.kind, "restart");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 0);
  assert.ok(Object.isFrozen(i));
});

test("move(1, 1) throws a TypeError", () => {
  assert.throws(() => move(1, 1), TypeError);
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
