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
  assert.strictEqual(Object.isFrozen(a), true);
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

test("actor with returns a new actor with changed pos, leaving the original unchanged", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  const b = a.with({ pos: pointShape.of(3, 3) });
  assert.strictEqual(b.pos.x, 3);
  assert.strictEqual(b.pos.y, 3);
  assert.strictEqual(b.id, 0);
  assert.strictEqual(b.kind, 'hero');
  assert.strictEqual(b.stats, a.stats);
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);
  assert.notStrictEqual(a, b);
});
