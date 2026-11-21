// The tests of the shape message: valid and round-trip for all ten kinds.

import test from "node:test";
import assert from "node:assert/strict";

import { move, attack, use, wait, descend } from "../../../shapes/intent/index.mjs";
import { of as saveOf, isName } from "../../../shapes/save/index.mjs";
import { of as statsOf } from "../../../shapes/stats/index.mjs";
import { of as pointOf } from "../../../shapes/point/index.mjs";
import { fromRows } from "../../../shapes/tile-grid/index.mjs";
import { empty as maskEmpty } from "../../../shapes/mask/index.mjs";
import { of as actorOf, KINDS as actorKINDS } from "../../../shapes/actor/index.mjs";
import { of as heroOf } from "../../../shapes/hero/index.mjs";
import { of as itemOf } from "../../../shapes/item/index.mjs";
import { of as worldOf } from "../../../shapes/world/index.mjs";

import {
  create, join, act, pause, requestSave,
  created, joined, refused, state, saved, parse,
} from "../../../shapes/message/index.mjs";

test("message valid: upward flag and frozen", () => {
  const mAct = act(move(1, 0));
  assert.strictEqual(mAct.upward, true);
  assert.strictEqual(mAct.kind, "act");
  assert(Object.isFrozen(mAct));

  const mRefused = refused("full");
  assert.strictEqual(mRefused.upward, false);
  assert.strictEqual(mRefused.kind, "refused");
  assert(Object.isFrozen(mRefused));

  const mPause = pause(false);
  assert.strictEqual(mPause.upward, true);
  assert.strictEqual(mPause.kind, "pause");
  assert(Object.isFrozen(mPause));

  const mCreated = created("s1", "p1");
  assert.strictEqual(mCreated.upward, false);
  assert.strictEqual(mCreated.kind, "created");
  assert(Object.isFrozen(mCreated));
});

test("message valid: constructors throw on bad input", () => {
  assert.throws(() => refused("nope"), TypeError);
  assert.throws(() => join("", "x", "Ann"), TypeError);
  assert.throws(() => join("ABCDEF", "x", ""), TypeError);
  assert.throws(() => act({ kind: "move", dx: 1, dy: 0 }), TypeError);
  assert.throws(() => pause("yes"), TypeError);
  assert.throws(() => create({}), TypeError);
});

test("message valid: parse throws on bad input", () => {
  assert.throws(() => parse("nope"), TypeError);
  assert.throws(() => parse("{}"), TypeError);
  assert.throws(() => parse('{"kind":"fly"}'), TypeError);
  assert.throws(() => parse('{"kind":"pause"}'), TypeError);
});

test("message round-trip: all ten kinds", () => {
  const grid = fromRows(["#####", "#...#", "#####", "#...#", "#####"]);
  const heroActor = actorOf({
    id: 0,
    kind: "hero",
    pos: pointOf(1, 1),
    stats: statsOf({ hp: 5, maxHp: 10, attack: 3, defense: 1 }),
    held: 300,
    facing: 'left',
    last: { kind: 'attack', dx: -1, dy: 0, at: 50 },
  });
  const h = heroOf({ name: "Ann", actor: heroActor, pending: move(1, 0), alive: true });
  const monsterActor = actorOf({
    id: 1,
    kind: "slime",
    pos: pointOf(2, 2),
    stats: statsOf({ hp: 3, maxHp: 5, attack: 2, defense: 1 }),
  });
  const goldItem = itemOf({ id: 2, kind: "gold", pos: pointOf(1, 2), amount: 5 });
  const visible = maskEmpty(5, 5);
  const explored = maskEmpty(5, 5);
  const entry = saveOf({ seed: 1, depth: 1, players: [] });
  const w = worldOf({
    seed: 1, rng: 2, depth: 1, time: 100, state: "playing", grid,
    heroes: [h], monsters: [monsterActor], items: [goldItem],
    visible, explored, gold: 5, log: [], entry,
  });

  const saveOne = saveOf({
    seed: 9, depth: 3,
    players: [{ name: "Cy", stats: statsOf({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }],
  });

  const messages = [
    create(null),
    create(saveOne),
    join("sess1", "pass1", "Ann"),
    act(move(1, 0)),
    act(attack(1, 0)),
    act(use()),
    act(wait()),
    act(descend()),
    pause(false),
    requestSave(),
    created("sess1", "pass1"),
    joined("sess1", "Ann"),
    refused("full"),
    state(w, false),
    saved(saveOne),
  ];

  for (const m of messages) {
    const parsed = parse(m.text());
    assert.deepStrictEqual(parsed, m);
  }
});

test("message round-trip: create(null)", () => {
  const m = create(null);
  const parsed = parse(m.text());
  assert.deepStrictEqual(parsed, m);
});
