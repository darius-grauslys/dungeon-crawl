// The edge test for cues.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as cueShape from "../../../shapes/cue/index.mjs";
import * as worldShape from "../../../shapes/world/index.mjs";
import * as heroShape from "../../../shapes/hero/index.mjs";
import * as actorShape from "../../../shapes/actor/index.mjs";
import * as statsShape from "../../../shapes/stats/index.mjs";
import * as pointShape from "../../../shapes/point/index.mjs";
import * as tileGridShape from "../../../shapes/tile-grid/index.mjs";
import * as maskShape from "../../../shapes/mask/index.mjs";
import * as saveShape from "../../../shapes/save/index.mjs";
import * as intentShape from "../../../shapes/intent/index.mjs";
import * as itemShape from "../../../shapes/item/index.mjs";

import { cues } from "../../../edges/edge_to_cues.mjs";

const TOL = 1e-9;

function makeCue(name, gain) {
  return { name, gain };
}

function assertCues(actual, expected) {
  assert.strictEqual(actual.length, expected.length, `length ${actual.length} vs ${expected.length}`);
  for (let i = 0; i < actual.length; i++) {
    assert.strictEqual(actual[i].name, expected[i].name, `cue ${i} name`);
    assert.ok(Math.abs(actual[i].gain - expected[i].gain) <= TOL, `cue ${i}: gain ${actual[i].gain} vs ${expected[i].gain}`);
  }
}

function makeHeroActor(id, name, x, y, last = null, gesture = null, alive = true, hp = 10) {
  const actor = actorShape.of({
    id,
    kind: "hero",
    pos: pointShape.of(x, y),
    stats: statsShape.of({ hp, maxHp: 10, attack: 5, defense: 2, range: 1 }),
    last,
    gesture,
  });
  return heroShape.of({ name, actor, alive });
}

function makeMonsterActor(id, kind, x, y, hp, last = null, gesture = null, fuse = null) {
  const stats = statsShape.of({ hp, maxHp: hp, attack: 2, defense: 1, range: 1 });
  return actorShape.of({ id, kind, pos: pointShape.of(x, y), stats, last, gesture, fuse });
}

function buildWorld({ gridRows, depth = 1, gold = 0, heroes, monsters = [], items = [], visibleCells, exploredCells, time = 0, state = "playing", effects = [] }) {
  const grid = tileGridShape.fromRows(gridRows);
  const W = grid.width;
  const H = grid.height;
  const visible = visibleCells ? maskShape.of(W, H, visibleCells) : maskShape.empty(W, H);
  const explored = exploredCells ? maskShape.of(W, H, exploredCells) : maskShape.empty(W, H);
  return worldShape.of({
    seed: 1,
    rng: 0,
    depth,
    time,
    state,
    grid,
    heroes,
    monsters,
    items,
    visible,
    explored,
    gold,
    log: [],
    entry: saveShape.of({ seed: 1, depth, players: [] }),
    effects,
  });
}

function allVisible(W, H) {
  const cells = [];
  for (let i = 0; i < W * H; i++) cells.push(true);
  return cells;
}

// ----------------------------------------------------------------- EED intrinsics

test("cues: steps", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    visibleCells: vc,
  });

  const next = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 2, 1, { kind: "move", dx: 1, dy: 0, at: 50 })],
    visibleCells: vc,
  });

  assertCues(cues(prev, next, "Ann"), [makeCue("step", 1)]);
  assert.deepEqual(cues(prev, prev, "Ann"), []);
  assert.deepEqual(cues(null, next, "Ann"), []);
});

test("cues: attacks", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "bat", 4, 1, 3)],
    visibleCells: vc,
  });

  const nextShot = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, { kind: "attack", dx: 1, dy: 0, at: 50, reach: 3 })],
    monsters: [makeMonsterActor(10, "bat", 4, 1, 2)],
    visibleCells: vc,
  });

  assertCues(cues(prev, nextShot, "Ann"), [makeCue("shot", 1), makeCue("hit", 1 - 3 / 12)]);

  const nextSwing = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, { kind: "attack", dx: 1, dy: 0, at: 50, reach: 1 })],
    monsters: [makeMonsterActor(10, "bat", 4, 1, 2)],
    visibleCells: vc,
  });

  assertCues(cues(prev, nextSwing, "Ann"), [makeCue("swing", 1), makeCue("hit", 1 - 3 / 12)]);

  const nextGone = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, { kind: "attack", dx: 1, dy: 0, at: 50, reach: 3 })],
    monsters: [],
    visibleCells: vc,
  });

  assertCues(cues(prev, nextGone, "Ann"), [makeCue("shot", 1), makeCue("death", 1 - 3 / 12)]);
});

test("cues: distance", () => {
  const grid = ["####################", "#..................#", "####################"];
  const vc = allVisible(20, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "skeleton", 16, 1, 9)],
    visibleCells: vc,
  });

  const next = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "skeleton", 16, 1, 9, { kind: "move", dx: 1, dy: 0, at: 50 })],
    visibleCells: vc,
  });

  assertCues(cues(prev, next, "Ann"), [makeCue("step", 0.25)]);
  assertCues(cues(prev, next, "Eve"), [makeCue("step", 1)]);

  const vcNot = allVisible(20, 3);
  vcNot[1 * 20 + 16] = false;
  const nextNotVisible = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "skeleton", 16, 1, 9, { kind: "move", dx: 1, dy: 0, at: 50 })],
    visibleCells: vcNot,
  });

  assert.deepEqual(cues(prev, nextNotVisible, "Ann"), []);
});

test("cues: gestures", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    visibleCells: vc,
  });

  const nextPower = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, { kind: "move", dx: 1, dy: 0, at: 50 }, { kind: "power", at: 50 }, true, 10)],
    visibleCells: vc,
  });

  assertCues(cues(prev, nextPower, "Ann"), [makeCue("step", 1), makeCue("powerup", 1)]);

  const nextUse = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, { kind: "use", at: 50 }, true, 10)],
    visibleCells: vc,
  });

  assertCues(cues(prev, nextUse, "Ann"), [makeCue("use", 1)]);

  const heroSame = makeHeroActor(0, "Ann", 1, 1, null, { kind: "power", at: 50 }, true, 10);
  const prevSame = buildWorld({ gridRows: grid, depth: 1, heroes: [heroSame], visibleCells: vc });
  const nextSame = buildWorld({ gridRows: grid, depth: 1, heroes: [heroSame], visibleCells: vc });
  assert.deepEqual(cues(prevSame, nextSame, "Ann"), []);
});

test("cues: one-of-each", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    gold: 3,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "bat", 2, 1, 3), makeMonsterActor(11, "bat", 5, 1, 3)],
    visibleCells: vc,
  });

  const heroNext = makeHeroActor(0, "Ann", 1, 1, null, null, true, 10);
  const next = buildWorld({
    gridRows: grid,
    depth: 1,
    gold: 3,
    heroes: [heroNext],
    monsters: [
      makeMonsterActor(10, "bat", 2, 1, 3, { kind: "move", dx: 1, dy: 0, at: 50 }),
      makeMonsterActor(11, "bat", 5, 1, 3, { kind: "move", dx: 1, dy: 0, at: 50 }),
    ],
    visibleCells: vc,
  });

  assertCues(cues(prev, next, "Ann"), [makeCue("step", 1 - 1 / 12)]);

  const goldItem = itemShape.of({ id: 1, kind: "gold", pos: pointShape.of(1, 1), amount: 7 });
  const nextWithGold = buildWorld({
    gridRows: grid,
    depth: 1,
    gold: 10,
    heroes: [heroNext],
    monsters: [
      makeMonsterActor(10, "bat", 2, 1, 3, { kind: "move", dx: 1, dy: 0, at: 50 }),
      makeMonsterActor(11, "bat", 5, 1, 3, { kind: "move", dx: 1, dy: 0, at: 50 }),
    ],
    items: [goldItem],
    visibleCells: vc,
  });

  assertCues(cues(prev, nextWithGold, "Ann"), [makeCue("step", 1 - 1 / 12), makeCue("coin", 1)]);
});

test("cues: stairs", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    visibleCells: vc,
  });

  const next = buildWorld({
    gridRows: grid,
    depth: 2,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    visibleCells: vc,
  });

  assertCues(cues(prev, next, "Ann"), [makeCue("stairs", 1)]);
});

test("cues: dies", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [
      makeHeroActor(0, "Ann", 1, 1, null, null, true, 10),
      makeHeroActor(1, "Bob", 3, 1, null, null, true, 10),
    ],
    visibleCells: vc,
  });

  const next = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [
      makeHeroActor(0, "Ann", 1, 1, null, null, false, 0),
      makeHeroActor(1, "Bob", 3, 1, null, null, true, 10),
    ],
    visibleCells: vc,
  });

  assertCues(cues(prev, next, "Bob"), [makeCue("hit", 1 - 2 / 12), makeCue("death", 1 - 2 / 12)]);
});

test("cues: fuses", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "pumpkin", 4, 1, 12, null, null, null)],
    visibleCells: vc,
  });

  const nextHiss = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "pumpkin", 4, 1, 12, null, null, { at: 50 })],
    visibleCells: vc,
  });

  assertCues(cues(prev, nextHiss, "Ann"), [makeCue("hiss", 1 - 3 / 12)]);

  const prevSame = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "pumpkin", 4, 1, 12, null, null, { at: 50 })],
    visibleCells: vc,
  });
  const nextSame = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "pumpkin", 4, 1, 12, null, null, { at: 50 })],
    visibleCells: vc,
  });
  assert.deepEqual(cues(prevSame, nextSame, "Ann"), []);

  const prevDeath = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [makeMonsterActor(10, "pumpkin", 4, 1, 12, null, null, null)],
    visibleCells: vc,
  });

  const vcNot = allVisible(7, 3);
  vcNot[1 * 7 + 4] = false;
  const nextDeath = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    monsters: [],
    visibleCells: vcNot,
    effects: [{ kind: "blast", x: 4, y: 1, size: 1, at: 50 }],
  });

  assertCues(cues(prevDeath, nextDeath, "Ann"), [makeCue("death", 1 - 3 / 12), makeCue("boom", 1 - 3 / 12)]);
});

test("cues: refuses", () => {
  const grid = ["#######", "#.....#", "#######"];
  const vc = allVisible(7, 3);

  const prev = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    visibleCells: vc,
  });

  const next = buildWorld({
    gridRows: grid,
    depth: 1,
    heroes: [makeHeroActor(0, "Ann", 1, 1, null, null, true, 10)],
    visibleCells: vc,
  });

  assert.throws(() => cues({}, next, "Ann"), TypeError);
  assert.throws(() => cues(prev, null, "Ann"), TypeError);
  assert.throws(() => cues(prev, next, 5), TypeError);
});

// ----------------------------------------------------------------- shape intrinsics

test("cues edge: cue/valid", () => {
  const c = cueShape.of({ name: "step", gain: 0.5 });
  assert.deepStrictEqual(c, { name: "step", gain: 0.5 });
  assert.ok(Object.isFrozen(c));

  assert.ok(cueShape.of({ name: "stairs", gain: 1 }));

  assert.ok(cueShape.of({ name: "hiss", gain: 0.5 }));
  assert.ok(cueShape.of({ name: "boom", gain: 1 }));

  assert.throws(() => cueShape.of({ name: "step", gain: 0 }), TypeError);
  assert.throws(() => cueShape.of({ name: "step", gain: 1.5 }), TypeError);
  assert.throws(() => cueShape.of({ name: "step", gain: "1" }), TypeError);
  assert.throws(() => cueShape.of({ name: "step" }), TypeError);

  assert.deepStrictEqual(cueShape.NAMES, ["step", "swing", "shot", "hit", "death", "coin", "powerup", "use", "stairs", "hiss", "boom"]);
  assert.ok(Object.isFrozen(cueShape.NAMES));
});

test("cues edge: world/valid", () => {
  const grid = tileGridShape.fromRows(["#####", "#...#", "#####"]);
  const hero = makeHeroActor(0, "Ann", 1, 1, null, null, true, 10);
  const monster = makeMonsterActor(1, "slime", 2, 2, 6);
  const item = itemShape.of({ id: 1, kind: "gold", pos: pointShape.of(1, 1), amount: 1 });
  const entry = saveShape.of({ seed: 1, depth: 1, players: [] });

  const fields = {
    seed: 1,
    rng: 0,
    depth: 1,
    time: 0,
    state: "playing",
    grid,
    heroes: [hero],
    monsters: [monster],
    items: [item],
    visible: maskShape.empty(5, 3),
    explored: maskShape.empty(5, 3),
    gold: 0,
    log: [],
    entry,
  };

  const w = worldShape.of(fields);
  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.heroes));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));
  assert.strictEqual(w.depth, 1);

  const w33 = worldShape.of({ ...fields, depth: 33 });
  assert.strictEqual(w33.depth, 33);

  assert.throws(() => worldShape.of({ ...fields, state: "dead" }), TypeError);
  assert.throws(() => worldShape.of({ ...fields, depth: 34 }), TypeError);
  assert.throws(() => worldShape.of({ ...fields, time: -1 }), TypeError);
  assert.throws(() => worldShape.of({ ...fields, visible: maskShape.empty(4, 3) }), TypeError);
  assert.throws(() => worldShape.of({ ...fields, monsters: [makeMonsterActor(1, "hero", 2, 2, 6)] }), TypeError);
  assert.throws(() => worldShape.of({ ...fields, heroes: [hero, hero, hero, hero, hero] }), TypeError);
  assert.throws(() => worldShape.of({ ...fields, heroes: [makeHeroActor(0, "Ann", 1, 1), makeHeroActor(2, "Ann", 3, 3)] }), TypeError);
  assert.throws(() => worldShape.of({ ...fields, log: Array(51).fill("x") }), TypeError);
  const noGold = { ...fields };
  delete noGold.gold;
  assert.throws(() => worldShape.of(noGold), TypeError);
  const noEntry = { ...fields };
  delete noEntry.entry;
  assert.throws(() => worldShape.of(noEntry), TypeError);

  const w2 = w.with({ time: 9 });
  assert.strictEqual(w2.time, 9);
  assert.strictEqual(w.time, 0);

  const wA = worldShape.of(fields);
  const wB = worldShape.of(fields);
  assert.deepStrictEqual(wA, wB);
  assert.strictEqual(Object.hasOwn(wA, "with"), false);
  assert.strictEqual(Object.hasOwn(wA, "data"), false);
});

test("cues edge: world/data", () => {
  const grid = tileGridShape.fromRows(["#####", "#...#", "#####"]);
  const entry = saveShape.of({ seed: 1, depth: 1, players: [] });

  const heroPendingMove = makeHeroActor(0, "Ann", 1, 1, null, null, true, 10);
  const hero = heroShape.of({
    name: "Ann",
    actor: actorShape.of({
      id: 0,
      kind: "hero",
      pos: pointShape.of(1, 1),
      stats: statsShape.of({ hp: 10, maxHp: 10, attack: 5, defense: 2, range: 1 }),
      held: 300,
      facing: "left",
      last: { kind: "attack", dx: -1, dy: 0, at: 50, reach: 1 },
      gesture: null,
    }),
    pending: intentShape.move(1, 0),
    offer: 12,
  });

  const slime = makeMonsterActor(1, "slime", 2, 2, 6);
  const slimeActor = actorShape.of({
    id: 1,
    kind: "slime",
    pos: pointShape.of(2, 2),
    stats: statsShape.of({ hp: 6, maxHp: 6, attack: 2, defense: 1, range: 1 }),
    last: { kind: "move", dx: 0, dy: 1, at: 20 },
  });

  const sword = itemShape.of({ id: 2, kind: "sword", pos: pointShape.of(3, 1), price: 30 });
  const lever = itemShape.of({ id: 3, kind: "lever", pos: pointShape.of(2, 1), pulled: true });
  const goldFlung = itemShape.of({ id: 4, kind: "gold", pos: pointShape.of(0, 0), amount: 5, flung: { x: 1, y: 1, at: 40 } });

  const golem = actorShape.of({
    id: 2,
    kind: "golem",
    pos: pointShape.of(4, 2),
    stats: statsShape.of({ hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2 }),
    size: 2,
    small: true,
    mode: "dormant",
    slow: 1,
    aim: { dx: -1, dy: 1 },
  });

  const archer = actorShape.of({
    id: 3,
    kind: "archer",
    pos: pointShape.of(3, 2),
    stats: statsShape.of({ hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 }),
    last: { kind: "attack", dx: 1, dy: 1, at: 30, reach: 3 },
  });

  const visibleCells = new Array(15).fill(false);
  visibleCells[1 * 5 + 1] = true;

  const w = worldShape.of({
    seed: 1,
    rng: 0,
    depth: 1,
    time: 0,
    state: "playing",
    grid,
    heroes: [hero],
    monsters: [slimeActor, golem, archer],
    items: [itemShape.of({ id: 1, kind: "gold", pos: pointShape.of(1, 1), amount: 1 }), sword, lever, goldFlung],
    visible: maskShape.of(5, 3, visibleCells),
    explored: maskShape.empty(5, 3),
    gold: 0,
    log: [],
    entry,
  });

  const roundTrip = worldShape.fromData(JSON.parse(JSON.stringify(w.data())));
  assert.deepStrictEqual(roundTrip, w);

  const d = w.data();
  assert.deepStrictEqual(d.grid, ["#####", "#...#", "#####"]);
  assert.strictEqual(d.visible[1], "01000");
  assert.strictEqual(d.items[1].price, 30);
  assert.strictEqual(d.heroes[0].offer, 12);
  assert.strictEqual(d.items[2].pulled, true);
  assert.deepStrictEqual(d.items[3].flung, { x: 1, y: 1, at: 40 });
  assert.strictEqual(d.monsters[2].last.reach, 3);
  assert.strictEqual(d.monsters[2].stats.range, 4);

  for (const pk of ["move(1,1)", "attack()", "attack(-1,0)", "use()", "wait()"]) {
    let pending;
    if (pk === "move(1,1)") pending = intentShape.move(1, 1);
    else if (pk === "attack()") pending = intentShape.attack();
    else if (pk === "attack(-1,0)") pending = intentShape.attack(-1, 0);
    else if (pk === "use()") pending = intentShape.use();
    else if (pk === "wait()") pending = intentShape.wait();
    const h = heroShape.of({ name: "Ann", actor: w.heroes[0].actor, pending, alive: true, offer: 12 });
    const w2 = worldShape.of({ ...w, heroes: [h] });
    const rt = worldShape.fromData(JSON.parse(JSON.stringify(w2.data())));
    assert.deepStrictEqual(rt, w2);
  }

  assert.throws(() => worldShape.fromData({}), TypeError);
  assert.throws(() => worldShape.fromData({ ...w.data(), depth: 34 }), TypeError);
});
