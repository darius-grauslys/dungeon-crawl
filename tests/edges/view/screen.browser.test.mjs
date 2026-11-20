// view: edge test `screen` — browser tests on the page's 800x600 canvas.

import test from "node:test";
import assert from "node:assert/strict";

import { init, load, camera, draw } from "../../../edges/edge_to_view.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as item from "../../../shapes/item/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";

function makeStats() {
  return stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 });
}

function makeHero(px, py) {
  return actor.of({ id: 0, kind: "hero", pos: point.of(px, py), stats: makeStats() });
}

function makeMonster(kind, px, py) {
  return actor.of({ id: 1, kind, pos: point.of(px, py), stats: makeStats() });
}

function makeItem(kind, px, py, amount) {
  return item.of({ id: 0, kind, pos: point.of(px, py), amount: amount ?? 0 });
}

function makeGrid(width, height) {
  const tiles = Array(width * height).fill("floor");
  return tileGrid.of(width, height, tiles);
}

function makeWorld(grid, heroPos, monsters, items, visible, explored) {
  const monsterActors = monsters.map((m, i) => makeMonster(m.kind, m.px, m.py));
  const itemObjs = items.map((it, i) => makeItem(it.kind, it.px, it.py, it.amount));
  return world.of({
    seed: 1, rng: 1, depth: 1, turn: 0, state: "playing",
    grid, hero: makeHero(heroPos[0], heroPos[1]),
    monsters: monsterActors, items: itemObjs,
    visible, explored, gold: 0, log: ["hello"]
  });
}

function fullMask(width, height) {
  return mask.of(width, height, Array(width * height).fill(true));
}

test("camera", () => {
  const g48x32 = makeGrid(48, 32);
  const heroAt = (px, py) => makeWorld(g48x32, [px, py], [], [], mask.empty(48, 32), mask.empty(48, 32));

  let c = camera(heroAt(2, 2), 16, 10);
  assert.deepEqual(c, point.of(0, 0));
  c = camera(heroAt(40, 30), 16, 10);
  assert.deepEqual(c, point.of(32, 22));
  c = camera(heroAt(20, 15), 16, 10);
  assert.deepEqual(c, point.of(12, 10));

  const g10x5 = makeGrid(10, 5);
  const h10x5 = makeWorld(g10x5, [5, 2], [], [], mask.empty(10, 5), mask.empty(10, 5));
  c = camera(h10x5, 16, 10);
  assert.deepEqual(c, point.of(0, 0));
});

test("flat-colours", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);
  const w = makeWorld(grid, [1, 1], [{ kind: "slime", px: 4, py: 1 }], [{ kind: "gold", px: 5, py: 1, amount: 10 }], visible, explored);

  draw(w);

  const ctx = canvas.getContext("2d");
  const getData = (cx, cy) => {
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  };

  let p = getData(24, 24);
  assert.equal(p.r, 90); assert.equal(p.g, 80); assert.equal(p.b, 90);

  p = getData(120, 72);
  assert.equal(p.r, 230); assert.equal(p.g, 200); assert.equal(p.b, 60);

  p = getData(168, 72);
  assert.equal(p.r, 50); assert.equal(p.g, 36); assert.equal(p.b, 44);

  p = getData(72, 72);
  assert.equal(p.r, 60); assert.equal(p.g, 120); assert.equal(p.b, 255);

  p = getData(216, 72);
  assert.equal(p.r, 220); assert.equal(p.g, 50); assert.equal(p.b, 50);

  p = getData(264, 72);
  assert.equal(p.r, 240); assert.equal(p.g, 180); assert.equal(p.b, 40);

  p = getData(796, 596);
  assert.ok(!(p.r === 22 && p.g === 13 && p.b === 19), "pixel (796,596) should not be background");
});

test("fog", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);

  const visible1 = mask.of(7, 3, [
    false, false, false, false, false, false, false,
    false, true, false, false, false, false, false,
    false, false, false, false, false, false, false
  ]);
  const explored1 = fullMask(7, 3);
  const w1 = makeWorld(grid, [1, 1], [{ kind: "slime", px: 4, py: 1 }], [{ kind: "gold", px: 5, py: 1, amount: 10 }], visible1, explored1);

  draw(w1);

  const ctx = canvas.getContext("2d");
  const getData = (cx, cy) => {
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  };

  let p = getData(216, 72);
  assert.ok(Math.abs(p.r - 20) <= 3, "monster r");
  assert.ok(Math.abs(p.g - 14) <= 3, "monster g");
  assert.ok(Math.abs(p.b - 18) <= 3, "monster b");

  p = getData(264, 72);
  assert.ok(Math.abs(p.r - 20) <= 3, "gold r");
  assert.ok(Math.abs(p.g - 14) <= 3, "gold g");
  assert.ok(Math.abs(p.b - 18) <= 3, "gold b");

  const explored2 = mask.of(7, 3, [
    false, false, false, false, false, false, false,
    false, true, false, false, false, false, false,
    false, false, false, false, false, false, false
  ]);
  const w2 = makeWorld(grid, [1, 1], [{ kind: "slime", px: 4, py: 1 }], [{ kind: "gold", px: 5, py: 1, amount: 10 }], visible1, explored2);

  draw(w2);
  p = getData(264, 72);
  assert.equal(p.r, 22); assert.equal(p.g, 13); assert.equal(p.b, 19);
});

test("sprites", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  await load("/assets/");

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);
  const w = makeWorld(grid, [1, 1], [{ kind: "slime", px: 4, py: 1 }], [{ kind: "gold", px: 5, py: 1, amount: 10 }], visible, explored);

  draw(w);

  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(48, 48, 48, 48).data;

  const colours = new Set();
  for (let i = 0; i < data.length; i += 4) {
    colours.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  }
  assert.ok(colours.size >= 3, "hero's cell holds at least 3 colours");

  const cdata = ctx.getImageData(72, 72, 1, 1).data;
  assert.ok(!(cdata[0] === 60 && cdata[1] === 120 && cdata[2] === 255), "centre pixel is not the flat hero colour");
});

test("world/valid", () => {
  const grid5x3 = tileGrid.fromRows(["#####", "#.>.#", "#####"]);
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const heroStats = makeStats();
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: heroStats });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(2, 1), stats: heroStats });
  const itemGold = item.of({ id: 0, kind: "gold", pos: point.of(3, 1), amount: 5 });

  const w = world.of({
    seed: 1, rng: 1, depth: 1, turn: 0, state: "playing",
    grid: grid5x3, hero, monsters: [monster], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"]
  });
  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));

  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "paused", grid: grid5x3, hero, monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"] }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 6, turn: 0, state: "playing", grid: grid5x3, hero, monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"] }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid: grid5x3, hero, monsters: [monster], items: [itemGold], visible: mask.empty(4, 3), explored, gold: 0, log: ["hello"] }), TypeError);
  const heroMonster = actor.of({ id: 1, kind: "hero", pos: point.of(2, 1), stats: heroStats });
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid: grid5x3, hero, monsters: [heroMonster], items: [itemGold], visible, explored, gold: 0, log: ["hello"] }), TypeError);
  const longLog = Array(51).fill("hello");
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid: grid5x3, hero, monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: longLog }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid: grid5x3, hero, monsters: [monster], items: [itemGold], visible, explored }), TypeError);

  const w2 = w.with({ turn: 9 });
  assert.equal(w2.turn, 9);
  assert.equal(w.turn, 0);
});

test("point/valid", () => {
  const p = point.of(3, -2);
  assert.equal(p.x, 3);
  assert.equal(p.y, -2);
  assert.ok(Object.isFrozen(p));

  assert.throws(() => point.of(1.5, 0), TypeError);
  assert.throws(() => point.of(0, NaN), TypeError);
  assert.throws(() => point.of("1", 2), TypeError);
  assert.throws(() => point.of(1), TypeError);

  assert.ok(point.equals(point.of(1, 2), point.of(1, 2)));
  assert.ok(!point.equals(point.of(1, 2), point.of(2, 1)));
});
