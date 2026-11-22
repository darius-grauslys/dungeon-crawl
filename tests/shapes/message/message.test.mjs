// The tests of the shape message: valid and round-trip for all twelve kinds.

import test from "node:test";
import assert from "node:assert/strict";

import { move, attack, use, wait, descend, face } from "../../../shapes/intent/index.mjs";
import { of as saveOf, isName } from "../../../shapes/save/index.mjs";
import { of as statsOf } from "../../../shapes/stats/index.mjs";
import { of as pointOf } from "../../../shapes/point/index.mjs";
import { fromRows } from "../../../shapes/tile-grid/index.mjs";
import { empty as maskEmpty, of as maskOf } from "../../../shapes/mask/index.mjs";
import { of as actorOf, KINDS as actorKINDS } from "../../../shapes/actor/index.mjs";
import { of as heroOf } from "../../../shapes/hero/index.mjs";
import { of as itemOf } from "../../../shapes/item/index.mjs";
import { of as worldOf, fromData as worldFromData } from "../../../shapes/world/index.mjs";

import {
  list, create, join, act, pause, requestSave,
  lobby, created, joined, refused, state, saved, parse,
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

  const mList = list();
  assert.strictEqual(mList.upward, true);
  assert.strictEqual(mList.kind, "list");
  assert(Object.isFrozen(mList));

  const mLobby = lobby([]);
  assert.strictEqual(mLobby.upward, false);
  assert.strictEqual(mLobby.kind, "lobby");
  assert(Object.isFrozen(mLobby));

  const mCreated = created("s1");
  assert.strictEqual(mCreated.upward, false);
  assert.strictEqual(mCreated.kind, "created");
  assert(Object.isFrozen(mCreated));
});

test("message valid: constructors throw on bad input", () => {
  assert.throws(() => refused("nope"), TypeError);
  assert.throws(() => refused("bad-password"), TypeError);
  assert.throws(() => join("", "Ann"), TypeError);
  assert.throws(() => join("ABCDEF", ""), TypeError);
  assert.throws(() => lobby([{ session: "ABCDEF", players: ["Ann"], depth: 34 }]), TypeError);
  assert.throws(() => lobby([{ session: "a", players: ["A"], depth: 1 }, { session: "b", players: ["B"], depth: 1 }, { session: "c", players: ["C"], depth: 1 }, { session: "d", players: ["D"], depth: 1 }, { session: "e", players: ["E"], depth: 1 }]), TypeError);
  assert.throws(() => created(""), TypeError);
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

test("message valid: lobby frozen and fields", () => {
  const m = lobby([{ session: "ABCDEF", players: ["Ann", "Bob"], depth: 3 }]);
  assert.strictEqual(m.sessions[0].players[1], "Bob");
  assert(Object.isFrozen(m.sessions));
  assert(Object.isFrozen(m.sessions[0]));
  assert(Object.isFrozen(m.sessions[0].players));
});

test("message round-trip: all twelve kinds", () => {
  const grid = fromRows(["#####", "#...#", "#####"]);
  const heroActor = actorOf({
    id: 0,
    kind: "hero",
    pos: pointOf(1, 1),
    stats: statsOf({ hp: 5, maxHp: 10, attack: 3, defense: 1 }),
    held: 300,
    facing: 'left',
    last: { kind: 'attack', dx: -1, dy: 0, at: 50 },
    aim: { dx: 1, dy: 1 },
    slow: 2,
  });
  const h = heroOf({ name: "Ann", actor: heroActor, pending: move(1, 0), alive: true, offer: 12 });
  const monsterActor = actorOf({
    id: 1,
    kind: "slime",
    pos: pointOf(2, 2),
    stats: statsOf({ hp: 3, maxHp: 5, attack: 2, defense: 1 }),
    last: { kind: 'move', dx: 0, dy: 1, at: 20 },
  });
  const goldItem = itemOf({ id: 2, kind: "gold", pos: pointOf(1, 2), amount: 5 });
  const swordItem = itemOf({ id: 12, kind: "sword", pos: pointOf(3, 1), price: 30 });
  const visibleCells = [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false];
  const visible = maskOf(5, 3, visibleCells);
  const explored = maskEmpty(5, 3);
  const entry = saveOf({ seed: 1, depth: 1, players: [] });
  const w = worldOf({
    seed: 1, rng: 2, depth: 1, time: 100, state: "playing", grid,
    heroes: [h], monsters: [monsterActor], items: [goldItem, swordItem],
    visible, explored, gold: 5, log: [], entry,
  });

  const saveOne = saveOf({
    seed: 9, depth: 3,
    players: [{ name: "Cy", stats: statsOf({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }],
  });

  const messages = [
    list(),
    create(saveOne),
    join("sess1", "Ann"),
    act(move(1, 0)),
    act(move(-1, 1)),
    act(attack(1, 0)),
    act(attack()),
    act(use()),
    act(wait()),
    act(descend()),
    act(face(1, -1)),
    pause(false),
    requestSave(),
    lobby([
      { session: "sess1", players: ["Ann", "Bob"], depth: 3 },
      { session: "sess2", players: ["Cy"], depth: 2 },
    ]),
    lobby([]),
    created("sess1"),
    joined("sess1", "Ann"),
    refused("full"),
    state(w, false),
    saved(saveOne),
    create(null),
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
