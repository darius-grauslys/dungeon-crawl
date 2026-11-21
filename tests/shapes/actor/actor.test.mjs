// The tests of the shape actor.

import { test } from "node:test";
import assert from "node:assert";

import * as pointShape from '../../../shapes/point/index.mjs';
import * as statsShape from '../../../shapes/stats/index.mjs';
import * as actorShape from '../../../shapes/actor/index.mjs';

const { of, KINDS } = actorShape;

test("actor of builds a frozen actor with the given values", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  assert.strictEqual(a.id, 0);
  assert.strictEqual(a.kind, 'hero');
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);
  assert.strictEqual(a.stats.hp, 5);
  assert.strictEqual(a.ready, 0);
  assert.strictEqual(Object.isFrozen(a), true);
});

test("actor of with ready: 250 has ready 250", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, ready: 250 });
  assert.strictEqual(a.ready, 250);
});

test("actor KINDS is the six kind names in order and frozen", () => {
  assert.deepStrictEqual(KINDS, ['hero', 'bat', 'slime', 'snake', 'skeleton', 'demon']);
  assert.strictEqual(Object.isFrozen(KINDS), true);
});

test("actor of refuses kind: 'dragon'", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'dragon', pos: pointShape.of(1, 2), stats: s }), TypeError);
});

test("actor of refuses id: -1", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: -1, kind: 'hero', pos: pointShape.of(1, 2), stats: s }), TypeError);
});

test("actor of refuses pos as plain object (not a point)", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: { x: 1, y: 2 }, stats: s }), TypeError);
});

test("actor of refuses missing stats", () => {
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2) }), TypeError);
});

test("actor of refuses ready: -1", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, ready: -1 }), TypeError);
});

test("actor of refuses ready: 1.5", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, ready: 1.5 }), TypeError);
});

test("actor with returns a new actor with changed pos, leaving the original unchanged", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  const b = a.with({ pos: pointShape.of(3, 3) });
  assert.strictEqual(b.pos.x, 3);
  assert.strictEqual(b.pos.y, 3);
  assert.strictEqual(b.id, 0);
  assert.strictEqual(b.kind, 'hero');
  assert.strictEqual(b.stats, a.stats);
  assert.strictEqual(b.ready, a.ready);
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);
  assert.notStrictEqual(a, b);
});

test("actor with returns a new actor with changed ready, leaving the original unchanged", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, ready: 250 });
  const b = a.with({ ready: 400 });
  assert.strictEqual(b.ready, 400);
  assert.strictEqual(a.ready, 250);
  assert.notStrictEqual(a, b);
});

test("two actors made by of from the same fields are deep equal", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  const b = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  assert.deepStrictEqual(a, b);
});

test("with is a shared method, not an own property of an actor", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  assert.strictEqual(Object.hasOwn(a, 'with'), false);
  assert.strictEqual(Object.hasOwn(a, 'id'), true);
  assert.strictEqual(Object.hasOwn(a, 'kind'), true);
  assert.strictEqual(Object.hasOwn(a, 'pos'), true);
  assert.strictEqual(Object.hasOwn(a, 'stats'), true);
  assert.strictEqual(Object.hasOwn(a, 'ready'), true);
});
