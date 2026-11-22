// The tests of the shape actor.

import { test } from "node:test";
import assert from "node:assert";

import * as pointShape from '../../../shapes/point/index.mjs';
import * as statsShape from '../../../shapes/stats/index.mjs';
import * as actorShape from '../../../shapes/actor/index.mjs';

const { of, KINDS, facingFor } = actorShape;

test("actor of builds a frozen actor with the given values", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  assert.strictEqual(a.id, 0);
  assert.strictEqual(a.kind, 'hero');
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);
  assert.strictEqual(a.stats.hp, 5);
  assert.strictEqual(a.ready, 0);
  assert.strictEqual(a.held, 0);
  assert.strictEqual(a.facing, 'right');
  assert.strictEqual(a.last, null);
  assert.deepStrictEqual(a.aim, { dx: 1, dy: 0 });
  assert.strictEqual(a.slow, 0);
  assert.strictEqual(a.mode, 'roam');
  assert.strictEqual(a.size, 1);
  assert.strictEqual(a.small, false);
  assert.strictEqual(a.gesture, null);
  assert.strictEqual(Object.isFrozen(a), true);
  assert.strictEqual(Object.isFrozen(a.last), true);
  assert.strictEqual(Object.isFrozen(a.aim), true);
});

test("actor of with ready: 250 has ready 250", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, ready: 250 });
  assert.strictEqual(a.ready, 250);
});

test("actor KINDS has 19 kinds, first hero, then bat, last golem, and frozen", () => {
  assert.strictEqual(KINDS.length, 19);
  assert.strictEqual(KINDS[0], 'hero');
  assert.strictEqual(KINDS[1], 'bat');
  assert.strictEqual(KINDS[18], 'golem');
  assert.strictEqual(Object.isFrozen(KINDS), true);
});

test("actor of accepts a golem of size 3, mode dormant", () => {
  const s = statsShape.of({ hp: 40, maxHp: 40, attack: 16, defense: 12 });
  const a = of({ id: 1, kind: 'golem', pos: pointShape.of(0, 0), stats: s, size: 3, mode: 'dormant' });
  assert.strictEqual(a.kind, 'golem');
  assert.strictEqual(a.size, 3);
  assert.strictEqual(a.mode, 'dormant');
});

test("actor of accepts an archer of aim {dx: -1, dy: 1} and slow 2", () => {
  const s = statsShape.of({ hp: 7, maxHp: 7, attack: 3, defense: 1 });
  const a = of({ id: 2, kind: 'archer', pos: pointShape.of(0, 0), stats: s, aim: { dx: -1, dy: 1 }, slow: 2 });
  assert.strictEqual(a.kind, 'archer');
  assert.deepStrictEqual(a.aim, { dx: -1, dy: 1 });
  assert.strictEqual(a.slow, 2);
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

test("actor of refuses held: -1", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, held: -1 }), TypeError);
});

test("actor of refuses facing: 'up'", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, facing: 'up' }), TypeError);
});

test("actor of refuses aim: {dx: 0, dy: 0}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, aim: { dx: 0, dy: 0 } }), TypeError);
});

test("actor of refuses aim: {dx: 2, dy: 0}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, aim: { dx: 2, dy: 0 } }), TypeError);
});

test("actor of refuses slow: 4", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, slow: 4 }), TypeError);
});

test("actor of refuses mode: 'sleep'", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, mode: 'sleep' }), TypeError);
});

test("actor of refuses size: 4", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'golem', pos: pointShape.of(1, 2), stats: s, size: 4 }), TypeError);
});

test("actor of refuses a hero of size 2", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, size: 2 }), TypeError);
});

test("actor of refuses a hero of mode 'guard'", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, mode: 'guard' }), TypeError);
});

test("actor of refuses small: 1", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, small: 1 }), TypeError);
});

test("actor of refuses last: {kind: 'use', dx: 0, dy: 0, at: 0}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, last: { kind: 'use', dx: 0, dy: 0, at: 0 } }), TypeError);
});

test("actor of refuses last: {kind: 'move', dx: 0, dy: 0, at: 0}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, last: { kind: 'move', dx: 0, dy: 0, at: 0 } }), TypeError);
});

test("actor of refuses last: {kind: 'move', dx: 1, dy: 0, at: -5}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, last: { kind: 'move', dx: 1, dy: 0, at: -5 } }), TypeError);
});

test("actor of refuses last: {kind: 'attack', dx: 1, dy: 0, at: 0, reach: 0}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, last: { kind: 'attack', dx: 1, dy: 0, at: 0, reach: 0 } }), TypeError);
});

test("actor of accepts last: {kind: 'move', dx: 1, dy: 1, at: 0}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, last: { kind: 'move', dx: 1, dy: 1, at: 0 } });
  assert.deepStrictEqual(a.last, { kind: 'move', dx: 1, dy: 1, at: 0, reach: 1 });
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
  assert.strictEqual(b.held, a.held);
  assert.strictEqual(b.facing, a.facing);
  assert.strictEqual(b.last, a.last);
  assert.deepStrictEqual(b.aim, a.aim);
  assert.strictEqual(b.slow, a.slow);
  assert.strictEqual(b.mode, a.mode);
  assert.strictEqual(b.size, a.size);
  assert.strictEqual(b.small, a.small);
  assert.strictEqual(b.gesture, a.gesture);
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

test("actor with returns a new actor with changed held, facing, last", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  const b = a.with({ held: 300, facing: 'left', last: { kind: 'attack', dx: -1, dy: 1, at: 50 } });
  assert.strictEqual(b.held, 300);
  assert.strictEqual(b.facing, 'left');
  assert.strictEqual(Object.isFrozen(b.last), true);
  assert.deepStrictEqual(b.last, { kind: 'attack', dx: -1, dy: 1, at: 50, reach: 1 });
  assert.strictEqual(a.held, 0);
  assert.strictEqual(a.facing, 'right');
  assert.strictEqual(a.last, null);
  assert.notStrictEqual(a, b);
});

test("two actors made by of from the same fields are deep equal", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  const b = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  assert.deepStrictEqual(a, b);
});

test("actor of accepts stats with magic: 6, magicPower: 2, magicResist: 1 and keeps them", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magic: 6, magicPower: 2, magicResist: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  assert.strictEqual(a.stats.hp, 5);
  assert.strictEqual(a.stats.maxHp, 10);
  assert.strictEqual(a.stats.attack, 3);
  assert.strictEqual(a.stats.defense, 1);
  assert.strictEqual(a.stats.range, 1);
  assert.strictEqual(a.stats.magic, 6);
  assert.strictEqual(a.stats.magicPower, 2);
  assert.strictEqual(a.stats.magicResist, 1);
});

test("actor with({stats}) keeps stats with magic fields", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magic: 6, magicPower: 2, magicResist: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  const s2 = statsShape.of({ hp: 4, maxHp: 10, attack: 3, defense: 1, magic: 6, magicPower: 2, magicResist: 1 });
  const b = a.with({ stats: s2 });
  assert.strictEqual(b.stats.hp, 4);
  assert.strictEqual(b.stats.magic, 6);
  assert.strictEqual(b.stats.magicPower, 2);
  assert.strictEqual(b.stats.magicResist, 1);
  assert.strictEqual(a.stats.magic, 6);
  assert.strictEqual(a.stats.magicPower, 2);
  assert.strictEqual(a.stats.magicResist, 1);
  assert.notStrictEqual(a, b);
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
  assert.strictEqual(Object.hasOwn(a, 'held'), true);
  assert.strictEqual(Object.hasOwn(a, 'facing'), true);
  assert.strictEqual(Object.hasOwn(a, 'last'), true);
  assert.strictEqual(Object.hasOwn(a, 'aim'), true);
  assert.strictEqual(Object.hasOwn(a, 'slow'), true);
  assert.strictEqual(Object.hasOwn(a, 'mode'), true);
  assert.strictEqual(Object.hasOwn(a, 'size'), true);
  assert.strictEqual(Object.hasOwn(a, 'small'), true);
  assert.strictEqual(Object.hasOwn(a, 'gesture'), true);
  assert.strictEqual(Object.hasOwn(a, 'covers'), false);
  assert.strictEqual(Object.hasOwn(a, 'cells'), false);
});

test("covers: golem of size 3 at (4, 5)", () => {
  const s = statsShape.of({ hp: 40, maxHp: 40, attack: 16, defense: 12 });
  const a = of({ id: 1, kind: 'golem', pos: pointShape.of(4, 5), stats: s, size: 3 });
  assert.strictEqual(a.covers(4, 5), true);
  assert.strictEqual(a.covers(6, 7), true);
  assert.strictEqual(a.covers(5, 6), true);
  assert.strictEqual(a.covers(7, 5), false);
  assert.strictEqual(a.covers(3, 5), false);
  const cells = a.cells();
  assert.strictEqual(cells.length, 9);
  assert.deepStrictEqual(cells[0], pointShape.of(4, 5));
  assert.deepStrictEqual(cells[1], pointShape.of(5, 5));
  assert.deepStrictEqual(cells[8], pointShape.of(6, 7));
});

test("covers: actor of size 1 at (2, 2)", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(2, 2), stats: s });
  assert.strictEqual(a.covers(2, 2), true);
  assert.strictEqual(a.covers(3, 2), false);
  const cells = a.cells();
  assert.strictEqual(cells.length, 1);
  assert.deepStrictEqual(cells[0], pointShape.of(2, 2));
});

test("facingFor returns left for (-1, 0), (-1, -1) and (0, 1)", () => {
  assert.strictEqual(facingFor(-1, 0), 'left');
  assert.strictEqual(facingFor(-1, -1), 'left');
  assert.strictEqual(facingFor(0, 1), 'left');
});

test("facingFor returns right for (1, 0), (1, 1) and (0, -1)", () => {
  assert.strictEqual(facingFor(1, 0), 'right');
  assert.strictEqual(facingFor(1, 1), 'right');
  assert.strictEqual(facingFor(0, -1), 'right');
});

test("facingFor throws for (0, 0) and (2, 0)", () => {
  assert.throws(() => facingFor(0, 0), TypeError);
  assert.throws(() => facingFor(2, 0), TypeError);
});

test("actor with({gesture: {kind: 'power', at: 50}}) has frozen gesture deep equal to {kind: 'power', at: 50}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s });
  const b = a.with({ gesture: { kind: 'power', at: 50 } });
  assert.strictEqual(Object.isFrozen(b.gesture), true);
  assert.deepStrictEqual(b.gesture, { kind: 'power', at: 50 });
  assert.strictEqual(a.gesture, null);
  assert.notStrictEqual(a, b);
});

test("actor of refuses gesture: {kind: 'wave', at: 0}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, gesture: { kind: 'wave', at: 0 } }), TypeError);
});

test("actor of refuses gesture: {kind: 'use', at: -1}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, gesture: { kind: 'use', at: -1 } }), TypeError);
});

test("actor of refuses gesture: {kind: 'use'}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.throws(() => of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, gesture: { kind: 'use' } }), TypeError);
});

test("actor of accepts gesture: {kind: 'use', at: 0} and {kind: 'power', at: 100}", () => {
  const s = statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = of({ id: 0, kind: 'hero', pos: pointShape.of(1, 2), stats: s, gesture: { kind: 'use', at: 0 } });
  assert.strictEqual(Object.isFrozen(a.gesture), true);
  assert.deepStrictEqual(a.gesture, { kind: 'use', at: 0 });
  const b = of({ id: 1, kind: 'hero', pos: pointShape.of(2, 2), stats: s, gesture: { kind: 'power', at: 100 } });
  assert.strictEqual(Object.isFrozen(b.gesture), true);
  assert.deepStrictEqual(b.gesture, { kind: 'power', at: 100 });
});
