// The tests of the shape item: its intrinsic valid.

import { test } from "node:test";
import assert from "node:assert";

import { of, KINDS } from "../../../shapes/item/index.mjs";
import * as point from "../../../shapes/point/index.mjs";

test("item valid: builds a gold item with the given values and is frozen", () => {
  const item = of({ id: 4, kind: 'gold', pos: point.of(2, 2), amount: 10 });
  assert.strictEqual(item.id, 4);
  assert.strictEqual(item.kind, 'gold');
  assert.strictEqual(item.pos.x, 2);
  assert.strictEqual(item.pos.y, 2);
  assert.strictEqual(item.amount, 10);
  assert.strictEqual(item.price, 0);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: defaults amount and price to 0 when left out", () => {
  const item = of({ id: 5, kind: 'potion', pos: point.of(1, 1) });
  assert.strictEqual(item.id, 5);
  assert.strictEqual(item.kind, 'potion');
  assert.strictEqual(item.pos.x, 1);
  assert.strictEqual(item.pos.y, 1);
  assert.strictEqual(item.amount, 0);
  assert.strictEqual(item.price, 0);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: builds a ware sword with price 30", () => {
  const item = of({ id: 6, kind: 'sword', pos: point.of(1, 1), price: 30 });
  assert.strictEqual(item.id, 6);
  assert.strictEqual(item.kind, 'sword');
  assert.strictEqual(item.pos.x, 1);
  assert.strictEqual(item.pos.y, 1);
  assert.strictEqual(item.price, 30);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: builds a pulled lever", () => {
  const item = of({ id: 7, kind: 'lever', pos: point.of(3, 3), pulled: true });
  assert.strictEqual(item.id, 7);
  assert.strictEqual(item.kind, 'lever');
  assert.strictEqual(item.pos.x, 3);
  assert.strictEqual(item.pos.y, 3);
  assert.strictEqual(item.pulled, true);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: builds a flung gold item with a frozen flung copy", () => {
  const item = of({ id: 8, kind: 'gold', pos: point.of(2, 2), amount: 5, flung: {x: 4, y: 4, at: 100} });
  assert.strictEqual(item.id, 8);
  assert.strictEqual(item.kind, 'gold');
  assert.strictEqual(item.pos.x, 2);
  assert.strictEqual(item.pos.y, 2);
  assert.strictEqual(item.amount, 5);
  assert.strictEqual(item.pulled, false);
  assert.ok(Object.isFrozen(item.flung));
  assert.deepStrictEqual(item.flung, {x: 4, y: 4, at: 100});
  assert.ok(Object.isFrozen(item));
});

test("item valid: KINDS is the sixteen kind names in the table's order and is frozen", () => {
  assert.deepStrictEqual(KINDS, ['potion', 'gold', 'sword', 'armor', 'ring', 'necklace', 'lever', 'bread', 'meat', 'cheese', 'sword-2', 'sword-3', 'sword-4', 'armor-2', 'armor-3', 'armor-4']);
  assert.ok(Object.isFrozen(KINDS));
});

test("item valid: refuses kind 'gem'", () => {
  assert.throws(() => of({ id: 0, kind: 'gem', pos: point.of(0, 0) }), TypeError);
});

test("item valid: refuses a gold of amount 0", () => {
  assert.throws(() => of({ id: 0, kind: 'gold', pos: point.of(0, 0), amount: 0 }), TypeError);
});

test("item valid: refuses a sword of amount 3", () => {
  assert.throws(() => of({ id: 0, kind: 'sword', pos: point.of(0, 0), amount: 3 }), TypeError);
});

test("item valid: refuses pos as an array", () => {
  assert.throws(() => of({ id: 0, kind: 'sword', pos: [1, 1] }), TypeError);
});

test("item valid: refuses a price of -1", () => {
  assert.throws(() => of({ id: 0, kind: 'sword', pos: point.of(0, 0), price: -1 }), TypeError);
});

test("item valid: refuses a price of 2.5", () => {
  assert.throws(() => of({ id: 0, kind: 'sword', pos: point.of(0, 0), price: 2.5 }), TypeError);
});

test("item valid: refuses a gold of price 5", () => {
  assert.throws(() => of({ id: 0, kind: 'gold', pos: point.of(0, 0), amount: 1, price: 5 }), TypeError);
});

test("item valid: refuses a lever of price 5", () => {
  assert.throws(() => of({ id: 0, kind: 'lever', pos: point.of(0, 0), price: 5 }), TypeError);
});

test("item valid: refuses a potion that is pulled", () => {
  assert.throws(() => of({ id: 0, kind: 'potion', pos: point.of(0, 0), pulled: true }), TypeError);
});

test("item valid: refuses pulled 'yes'", () => {
  assert.throws(() => of({ id: 0, kind: 'lever', pos: point.of(0, 0), pulled: 'yes' }), TypeError);
});

test("item valid: refuses flung of {x: 1, y: 1}", () => {
  assert.throws(() => of({ id: 0, kind: 'gold', pos: point.of(0, 0), amount: 1, flung: {x: 1, y: 1} }), TypeError);
});

test("item valid: refuses flung of {x: -1, y: 1, at: 0}", () => {
  assert.throws(() => of({ id: 0, kind: 'gold', pos: point.of(0, 0), amount: 1, flung: {x: -1, y: 1, at: 0} }), TypeError);
});

test("item valid: builds a ware ring with price 35", () => {
  const item = of({ id: 9, kind: 'ring', pos: point.of(1, 1), price: 35 });
  assert.strictEqual(item.id, 9);
  assert.strictEqual(item.kind, 'ring');
  assert.strictEqual(item.pos.x, 1);
  assert.strictEqual(item.pos.y, 1);
  assert.strictEqual(item.amount, 0);
  assert.strictEqual(item.price, 35);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: builds a necklace with amount 0 and price 0", () => {
  const item = of({ id: 10, kind: 'necklace', pos: point.of(1, 1) });
  assert.strictEqual(item.id, 10);
  assert.strictEqual(item.kind, 'necklace');
  assert.strictEqual(item.pos.x, 1);
  assert.strictEqual(item.pos.y, 1);
  assert.strictEqual(item.amount, 0);
  assert.strictEqual(item.price, 0);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: builds a cheese food item", () => {
  const item = of({ id: 11, kind: 'cheese', pos: point.of(1, 1) });
  assert.strictEqual(item.id, 11);
  assert.strictEqual(item.kind, 'cheese');
  assert.strictEqual(item.pos.x, 1);
  assert.strictEqual(item.pos.y, 1);
  assert.strictEqual(item.amount, 0);
  assert.strictEqual(item.price, 0);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: builds a ware armor-3 with price 70", () => {
  const item = of({ id: 12, kind: 'armor-3', pos: point.of(1, 1), price: 70 });
  assert.strictEqual(item.id, 12);
  assert.strictEqual(item.kind, 'armor-3');
  assert.strictEqual(item.pos.x, 1);
  assert.strictEqual(item.pos.y, 1);
  assert.strictEqual(item.amount, 0);
  assert.strictEqual(item.price, 70);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: builds a ware sword-4 with price 0", () => {
  const item = of({ id: 13, kind: 'sword-4', pos: point.of(1, 1) });
  assert.strictEqual(item.id, 13);
  assert.strictEqual(item.kind, 'sword-4');
  assert.strictEqual(item.pos.x, 1);
  assert.strictEqual(item.pos.y, 1);
  assert.strictEqual(item.amount, 0);
  assert.strictEqual(item.price, 0);
  assert.strictEqual(item.pulled, false);
  assert.strictEqual(item.flung, null);
  assert.ok(Object.isFrozen(item));
});

test("item valid: refuses a meat of amount 2", () => {
  assert.throws(() => of({ id: 0, kind: 'meat', pos: point.of(0, 0), amount: 2 }), TypeError);
});

test("item valid: refuses kind 'armor-5'", () => {
  assert.throws(() => of({ id: 0, kind: 'armor-5', pos: point.of(0, 0) }), TypeError);
});
