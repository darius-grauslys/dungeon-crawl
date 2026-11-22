// The tests of the shape hero: every case of its valid intrinsic.

import test from "node:test";
import assert from "node:assert/strict";

import { of } from "../../../shapes/hero/index.mjs";
import * as actorShape from "../../../shapes/actor/index.mjs";
import * as pointShape from "../../../shapes/point/index.mjs";
import * as statsShape from "../../../shapes/stats/index.mjs";
import * as intentShape from "../../../shapes/intent/index.mjs";

const move = intentShape.move;

function heroActor(hp) {
  return actorShape.of({
    id: 0,
    kind: "hero",
    pos: pointShape.of(0, 0),
    stats: statsShape.of({ hp, maxHp: 10, attack: 3, defense: 1 }),
  });
}

test("valid: of builds a hero with defaults", () => {
  const a = heroActor(5);
  const h = of({ name: "Ann", actor: a });
  assert.strictEqual(h.name, "Ann");
  assert.strictEqual(h.actor, a);
  assert.strictEqual(h.pending, null);
  assert.strictEqual(h.alive, true);
  assert.strictEqual(h.offer, null);
  assert.ok(Object.isFrozen(h));
});

test("valid: with replaces pending, leaves original unchanged", () => {
  const a = heroActor(5);
  const h = of({ name: "Ann", actor: a });
  const h2 = h.with({ pending: move(1, 0) });
  assert.strictEqual(h2.pending.kind, "move");
  assert.strictEqual(h.pending, null);
});

test("valid: with replaces offer, leaves original unchanged", () => {
  const a = heroActor(5);
  const h = of({ name: "Ann", actor: a });
  const h2 = h.with({ offer: 12 });
  assert.strictEqual(h2.offer, 12);
  assert.strictEqual(h.offer, null);
});

test("valid: offer: -1 throws a TypeError", () => {
  const a = heroActor(5);
  assert.throws(() => of({ name: "Ann", actor: a, offer: -1 }), TypeError);
});

test("valid: offer: '12' throws a TypeError", () => {
  const a = heroActor(5);
  assert.throws(() => of({ name: "Ann", actor: a, offer: "12" }), TypeError);
});

test("valid: a name '' throws a TypeError", () => {
  const a = heroActor(5);
  assert.throws(() => of({ name: "", actor: a }), TypeError);
});

test("valid: an actor of kind bat throws a TypeError", () => {
  const bat = actorShape.of({
    id: 1,
    kind: "bat",
    pos: pointShape.of(0, 0),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 }),
  });
  assert.throws(() => of({ name: "Ann", actor: bat }), TypeError);
});

test("valid: pending as a plain object throws a TypeError", () => {
  const a = heroActor(5);
  assert.throws(() => of({ name: "Ann", actor: a, pending: { kind: "move", dx: 1, dy: 0 } }), TypeError);
});

test("valid: alive: 'yes' throws a TypeError", () => {
  const a = heroActor(5);
  assert.throws(() => of({ name: "Ann", actor: a, alive: "yes" }), TypeError);
});

test("valid: alive: false with 5 hit points throws a TypeError", () => {
  const a = heroActor(5);
  assert.throws(() => of({ name: "Ann", actor: a, alive: false }), TypeError);
});

test("valid: alive: true with 0 hit points throws a TypeError", () => {
  const a = heroActor(0);
  assert.throws(() => of({ name: "Ann", actor: a, alive: true }), TypeError);
});

test("valid: two heroes from the same fields are deep equal", () => {
  const a = heroActor(5);
  const h1 = of({ name: "Ann", actor: a });
  const h2 = of({ name: "Ann", actor: a });
  assert.deepStrictEqual(h1, h2);
});

test("valid: with is not an own property", () => {
  const a = heroActor(5);
  const h = of({ name: "Ann", actor: a });
  assert.strictEqual(Object.hasOwn(h, "with"), false);
});
