// The edge test for travel.

import test from "node:test";
import assert from "node:assert/strict";

import { explore, toward, sighted } from "../../../edges/edge_to_travel.mjs";

import { of as worldOf, fromData as worldFromData } from "../../../shapes/world/index.mjs";
import { of as pointOf, equals as pointEquals } from "../../../shapes/point/index.mjs";
import { move, attack, use, wait, descend, face, KINDS as intentKINDS } from "../../../shapes/intent/index.mjs";
import { of as heroOf } from "../../../shapes/hero/index.mjs";
import { of as actorOf } from "../../../shapes/actor/index.mjs";
import { of as itemOf } from "../../../shapes/item/index.mjs";
import { empty, of as maskOf } from "../../../shapes/mask/index.mjs";
import { of as tileGridOf, fromRows as tileGridFromRows } from "../../../shapes/tile-grid/index.mjs";
import { of as saveOf } from "../../../shapes/save/index.mjs";
import { of as statsOf } from "../../../shapes/stats/index.mjs";

function heroActor(id, pos, { hp = 24 } = {}) {
  return actorOf({ id, kind: "hero", pos: pointOf(pos.x, pos.y), stats: statsOf({ hp, maxHp: hp, attack: 4, defense: 1 }) });
}

function hero(name, actor, { alive = true, pending = null, offer = null, colour = 0, group = 0 } = {}) {
  return heroOf({ name, actor, pending, alive, offer, colour, group });
}

function monsterActor(id, kind, pos, { hp = 5 } = {}) {
  return actorOf({ id, kind, pos: pointOf(pos.x, pos.y), stats: statsOf({ hp, maxHp: hp, attack: 2, defense: 0 }) });
}

function buildWorld({ grid, heroes, monsters = [], items = [], explored, visible }) {
  const save = saveOf({ seed: 1, depth: 1, players: [] });
  const g = grid ? tileGridFromRows(grid) : tileGridOf(20, 20, new Array(20 * 20).fill("floor"));
  const w = grid ? grid[0].length : 20;
  const h = grid ? grid.length : 20;
  const exp = explored ?? maskOf(w, h, new Array(w * h).fill(true));
  const vis = visible ?? empty(w, h);
  return worldOf({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid: g, heroes, monsters, items, visible: vis, explored: exp, gold: 0, log: [], entry: save
  });
}

test("explores", () => {
  const grid = ["#######", "#.....#", "#######"];
  const explored = maskOf(7, 3, [
    true, true, true, true, false, false, false,
    true, true, true, true, false, false, false,
    true, true, true, true, false, false, false,
  ]);
  const w = buildWorld({ grid, heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))], explored });
  const e = explore(w, "Ann");
  assert.strictEqual(e.kind, "move");
  assert.strictEqual(e.dx, 1);
  assert.strictEqual(e.dy, 0);

  const wAll = buildWorld({ grid, heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))] });
  assert.strictEqual(explore(wAll, "Ann"), null);

  const gridStairs = ["#######", "#...>.#", "#######"];
  const wStairs = buildWorld({ grid: gridStairs, heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))] });
  const es = explore(wStairs, "Ann");
  assert.strictEqual(es.kind, "move");
  assert.strictEqual(es.dx, 1);
  assert.strictEqual(es.dy, 0);

  const wStairsOn = buildWorld({ grid: gridStairs, heroes: [hero("Ann", heroActor(0, { x: 4, y: 1 }))] });
  assert.strictEqual(explore(wStairsOn, "Ann"), null);

  assert.strictEqual(explore(w, "Eve"), null);
  const wDead = buildWorld({ grid, heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }), { alive: false })] });
  assert.strictEqual(explore(wDead, "Ann"), null);
});

test("toward", () => {
  const grid = ["#######", "#.....#", "#.....#", "#######"];
  const w = buildWorld({
    grid,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))],
    explored: maskOf(7, 4, new Array(28).fill(true)),
    visible: maskOf(7, 4, new Array(28).fill(true)),
  });

  let t = toward(w, "Ann", pointOf(2, 2));
  assert.strictEqual(t.kind, "move");
  assert.strictEqual(t.dx, 1);
  assert.strictEqual(t.dy, 1);

  t = toward(w, "Ann", pointOf(5, 2));
  assert.strictEqual(t.kind, "move");
  assert.strictEqual(t.dx, 1);
  assert.strictEqual(t.dy, 0);

  t = toward(w, "Ann", pointOf(1, 2));
  assert.strictEqual(t.kind, "move");
  assert.strictEqual(t.dx, 0);
  assert.strictEqual(t.dy, 1);

  assert.strictEqual(toward(w, "Ann", pointOf(1, 1)), null);
  assert.strictEqual(toward(w, "Ann", pointOf(0, 0)), null);

  const wSlime = buildWorld({
    grid,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))],
    monsters: [monsterActor(10, "slime", { x: 2, y: 1 })],
    explored: maskOf(7, 4, new Array(28).fill(true)),
    visible: maskOf(7, 4, new Array(28).fill(true)),
  });
  t = toward(wSlime, "Ann", pointOf(3, 1));
  assert.strictEqual(t.kind, "move");
  assert.strictEqual(t.dx, 1);
  assert.strictEqual(t.dy, 1);

  assert.strictEqual(toward(wSlime, "Ann", pointOf(2, 1)), null);

  const wSlimeHidden = buildWorld({
    grid,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))],
    monsters: [monsterActor(10, "slime", { x: 2, y: 1 })],
    explored: maskOf(7, 4, new Array(28).fill(true)),
    visible: empty(7, 4),
  });
  t = toward(wSlimeHidden, "Ann", pointOf(3, 1));
  assert.strictEqual(t.kind, "move");
  assert.strictEqual(t.dx, 1);
  assert.strictEqual(t.dy, 0);

  const wJustMe = buildWorld({
    grid,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))],
    explored: maskOf(7, 4, [
      false, false, false, false, false, false, false,
      false, true, false, false, false, false, false,
      false, false, false, false, false, false, false,
      false, false, false, false, false, false, false,
    ]),
    visible: empty(7, 4),
  });
  assert.strictEqual(toward(wJustMe, "Ann", pointOf(3, 1)), null);
});

test("corners", () => {
  const grid = ["#####", "#.#.#", "#...#", "#####"];
  const w = buildWorld({
    grid,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))],
    explored: maskOf(5, 4, new Array(20).fill(true)),
  });
  const t = toward(w, "Ann", pointOf(3, 1));
  assert.strictEqual(t.kind, "move");
  assert.strictEqual(t.dx, 0);
  assert.strictEqual(t.dy, 1);
});

test("blocked", () => {
  const grid = ["#######", "#.....#", "#######"];
  const wBobAlive = buildWorld({
    grid,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 })), hero("Bob", heroActor(1, { x: 2, y: 1 }))],
    explored: maskOf(7, 3, new Array(21).fill(true)),
    visible: maskOf(7, 3, new Array(21).fill(true)),
  });
  assert.strictEqual(toward(wBobAlive, "Ann", pointOf(4, 1)), null);

  const wBobDead = buildWorld({
    grid,
    heroes: [
      hero("Ann", heroActor(0, { x: 1, y: 1 })),
      hero("Bob", heroActor(1, { x: 2, y: 1 }), { alive: false }),
    ],
    explored: maskOf(7, 3, new Array(21).fill(true)),
    visible: maskOf(7, 3, new Array(21).fill(true)),
  });
  const t = toward(wBobDead, "Ann", pointOf(4, 1));
  assert.strictEqual(t.kind, "move");
  assert.strictEqual(t.dx, 1);
  assert.strictEqual(t.dy, 0);

  const wWare = buildWorld({
    grid,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))],
    items: [itemOf({ id: 1, kind: "sword", pos: pointOf(3, 1), price: 30 })],
    explored: maskOf(7, 3, new Array(21).fill(true)),
    visible: maskOf(7, 3, new Array(21).fill(true)),
  });
  assert.strictEqual(toward(wWare, "Ann", pointOf(5, 1)), null);
  const tw = toward(wWare, "Ann", pointOf(3, 1));
  assert.strictEqual(tw.kind, "move");
  assert.strictEqual(tw.dx, 1);
  assert.strictEqual(tw.dy, 0);
});

test("sighted", () => {
  const w = buildWorld({
    heroes: [hero("Ann", heroActor(0, { x: 2, y: 2 }))],
    monsters: [monsterActor(10, "bat", { x: 5, y: 5 }), monsterActor(11, "slime", { x: 12, y: 2 })],
  });
  assert.deepStrictEqual(sighted(w, "Ann"), [10]);

  const wBob = buildWorld({
    heroes: [hero("Ann", heroActor(0, { x: 2, y: 2 })), hero("Bob", heroActor(1, { x: 11, y: 2 }))],
    monsters: [monsterActor(10, "bat", { x: 5, y: 5 }), monsterActor(11, "slime", { x: 12, y: 2 })],
  });
  assert.deepStrictEqual(sighted(wBob, "Ann"), [10]);

  const wNoBatVis = buildWorld({
    heroes: [hero("Ann", heroActor(0, { x: 2, y: 2 }))],
    monsters: [monsterActor(10, "bat", { x: 5, y: 5 }), monsterActor(11, "slime", { x: 12, y: 2 })],
    visible: maskOf(20, 20, new Array(400).fill(false)),
  });
  assert.deepStrictEqual(sighted(wNoBatVis, "Ann"), []);

  const gridWall = ["#########", "#...#...#", "#########"];
  const wWall = buildWorld({
    grid: gridWall,
    heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))],
    monsters: [monsterActor(10, "bat", { x: 6, y: 1 })],
    explored: maskOf(9, 3, new Array(27).fill(true)),
    visible: maskOf(9, 3, new Array(27).fill(true)),
  });
  assert.deepStrictEqual(sighted(wWall, "Ann"), []);

  assert.deepStrictEqual(sighted(w, "Eve"), []);
});

test("refuses", () => {
  const grid = ["#######", "#.....#", "#######"];
  const w = buildWorld({ grid, heroes: [hero("Ann", heroActor(0, { x: 1, y: 1 }))] });
  assert.throws(() => explore({}, "Ann"), TypeError);
  assert.throws(() => toward(w, "Ann", { x: 1, y: 1 }), TypeError);
  assert.throws(() => sighted(null, "Ann"), TypeError);
});

test("world/valid", () => {
  const grid = tileGridFromRows(["#####", "#...#", "#####"]);
  const heroA = heroOf({ name: "Ann", actor: heroActor(0, { x: 1, y: 1 }) });
  const monsterA = monsterActor(10, "slime", { x: 2, y: 1 });
  const itemA = itemOf({ id: 1, kind: "gold", pos: pointOf(1, 1), amount: 1 });
  const entry = saveOf({ seed: 1, depth: 1, players: [] });
  const w = worldOf({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [heroA], monsters: [monsterA], items: [itemA],
    visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry,
  });
  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.heroes));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));
  assert.strictEqual(worldOf({ seed: 1, rng: 1, depth: 33, time: 0, state: "playing", grid, heroes: [heroA], monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry }).depth, 33);

  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "dead", grid, heroes: [heroA], monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry }), TypeError);
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 34, time: 0, state: "playing", grid, heroes: [heroA], monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry }), TypeError);
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: -1, state: "playing", grid, heroes: [heroA], monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry }), TypeError);
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [heroA], monsters: [], items: [], visible: empty(4, 3), explored: empty(5, 3), gold: 0, log: [], entry }), TypeError);
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [heroA], monsters: [monsterActor(10, "hero", { x: 2, y: 1 })], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry }), TypeError);
  const heroes5 = [heroA, hero("B", heroActor(1, { x: 2, y: 1 })), hero("C", heroActor(2, { x: 3, y: 1 })), hero("D", heroActor(3, { x: 1, y: 2 })), hero("E", heroActor(4, { x: 2, y: 2 }))];
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: heroes5, monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry }), TypeError);
  const heroesAnn = [heroA, hero("Ann", heroActor(1, { x: 2, y: 1 })), hero("C", heroActor(2, { x: 3, y: 1 })), hero("D", heroActor(3, { x: 1, y: 2 }))];
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: heroesAnn, monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry }), TypeError);
  const log51 = []; for (let i = 0; i < 51; i++) log51.push("l" + i);
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [heroA], monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: log51, entry }), TypeError);
  assert.throws(() => worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [heroA], monsters: [], items: [], visible: empty(5, 3), explored: empty(5, 3), gold: 0, entry }), TypeError);

  const w2 = w.with({ time: 9 });
  assert.strictEqual(w2.time, 9);
  assert.strictEqual(w.time, 0);

  const wSame = worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [heroA], monsters: [monsterA], items: [itemA], visible: empty(5, 3), explored: empty(5, 3), gold: 0, log: [], entry });
  assert.deepStrictEqual(w, wSame);
  assert.ok(!Object.hasOwn(w, "with"));
  assert.ok(!Object.hasOwn(w, "data"));
});

test("world/data", () => {
  const grid = tileGridFromRows(["#####", "#...#", "#####"]);
  const heroA = heroOf({ name: "Ann", actor: heroActor(0, { x: 1, y: 1 }).with({ held: 300, facing: "left", last: { kind: "attack", dx: -1, dy: 0, at: 50 } }).with({ gesture: { kind: "power", at: 10 } }), pending: move(1, 0), offer: 12 });
  const monsterA = monsterActor(10, "slime", { x: 2, y: 1 }).with({ last: { kind: "move", dx: 0, dy: 1, at: 20 } });
  const itemSword = itemOf({ id: 12, kind: "sword", pos: pointOf(3, 1), price: 30 });
  const itemLever = itemOf({ id: 13, kind: "lever", pos: pointOf(2, 1), pulled: true });
  const itemGold = itemOf({ id: 14, kind: "gold", pos: pointOf(1, 1), amount: 5, flung: { x: 1, y: 1, at: 40 } });
  const monsterGolem = monsterActor(11, "golem", { x: 3, y: 1 }, { hp: 40 }).with({ size: 2, small: true, mode: "dormant", slow: 1, aim: { dx: -1, dy: 1 }, stats: statsOf({ hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1 }), gesture: null });
  const monsterArcher = monsterActor(12, "archer", { x: 4, y: 2 }, { hp: 7 }).with({ last: { kind: "attack", dx: 1, dy: 1, at: 30, reach: 3 }, stats: statsOf({ hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 }) });
  const vis = maskOf(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const entry = saveOf({ seed: 1, depth: 1, players: [] });
  const w = worldOf({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [heroA], monsters: [monsterA, monsterGolem, monsterArcher], items: [itemSword, itemLever, itemGold],
    visible: vis, explored: empty(5, 3), gold: 0, log: [], entry,
  });
  const data = JSON.parse(JSON.stringify(w.data()));
  const w2 = worldFromData(data);
  assert.deepStrictEqual(w2, w);
  assert.deepStrictEqual(w.data().grid, ["#####", "#...#", "#####"]);
  assert.strictEqual(w.data().visible[1], "01000");
  assert.strictEqual(w.data().items[1].price, 30);
  assert.strictEqual(w.data().heroes[0].offer, 12);
  assert.strictEqual(w.data().items[2].pulled, true);
  assert.deepStrictEqual(w.data().items[3].flung, { x: 1, y: 1, at: 40 });
  assert.strictEqual(w.data().monsters[2].last.reach, 3);
  assert.strictEqual(w.data().monsters[2].stats.range, 4);

  for (const p of [move(1, 1), attack(), attack(-1, 0), use(), wait(), descend(), face(0, 1)]) {
    const wP = heroA.with({ pending: p });
    const wPw = worldOf({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [wP], monsters: [monsterA, monsterGolem, monsterArcher], items: [itemSword, itemLever, itemGold], visible: vis, explored: empty(5, 3), gold: 0, log: [], entry });
    const d = JSON.parse(JSON.stringify(wPw.data()));
    assert.deepStrictEqual(worldFromData(d), wPw);
  }

  assert.throws(() => worldFromData({}), TypeError);
  const badData = JSON.parse(JSON.stringify(w.data()));
  badData.depth = 34;
  assert.throws(() => worldFromData(badData), TypeError);
});

test("point/valid", () => {
  const p = pointOf(3, -2);
  assert.strictEqual(p.x, 3);
  assert.strictEqual(p.y, -2);
  assert.ok(Object.isFrozen(p));
  assert.throws(() => pointOf(1.5, 0), TypeError);
  assert.throws(() => pointOf(0, NaN), TypeError);
  assert.throws(() => pointOf("1", 2), TypeError);
  assert.throws(() => pointOf(1), TypeError);
  assert.ok(pointEquals(pointOf(1, 2), pointOf(1, 2)));
  assert.ok(!pointEquals(pointOf(1, 2), pointOf(2, 1)));
});

test("intent/valid", () => {
  const m = move(0, -1);
  assert.strictEqual(m.kind, "move");
  assert.strictEqual(m.dx, 0);
  assert.strictEqual(m.dy, -1);
  assert.ok(Object.isFrozen(m));
  const m2 = move(1, 1);
  assert.strictEqual(m2.kind, "move");
  const m3 = move(-1, 1);
  assert.strictEqual(m3.kind, "move");

  const a = attack(1, 0);
  assert.strictEqual(a.kind, "attack");
  assert.strictEqual(a.dx, 1);
  assert.strictEqual(a.dy, 0);
  const a0 = attack();
  assert.strictEqual(a0.dx, 0);
  assert.strictEqual(a0.dy, 0);
  const a00 = attack(0, 0);
  assert.strictEqual(a00.dx, 0);
  assert.strictEqual(a00.dy, 0);
  const a3 = attack(-1, -1);
  assert.strictEqual(a3.kind, "attack");

  const f = face(1, -1);
  assert.strictEqual(f.kind, "face");
  assert.strictEqual(f.dx, 1);
  assert.strictEqual(f.dy, -1);

  const u = use();
  assert.strictEqual(u.kind, "use");
  assert.strictEqual(u.dx, 0);
  assert.strictEqual(u.dy, 0);
  const w = wait();
  assert.strictEqual(w.kind, "wait");
  const d = descend();
  assert.strictEqual(d.kind, "descend");

  assert.throws(() => move(0, 0), TypeError);
  assert.throws(() => move(2, 0), TypeError);
  assert.throws(() => move("1", 0), TypeError);
  assert.throws(() => face(0, 0), TypeError);
  assert.throws(() => face(0, 2), TypeError);
  assert.throws(() => attack(2, 0), TypeError);
  assert.throws(() => attack(1), TypeError);

  assert.deepStrictEqual(intentKINDS, ["move", "attack", "use", "wait", "descend", "face"]);
});
