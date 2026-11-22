// view: edge test `screen` — browser tests on the page's 800x600 canvas.

import test from "node:test";
import assert from "node:assert/strict";

import { init, load, camera, draw } from "../../../edges/edge_to_view.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as hero from "../../../shapes/hero/index.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as item from "../../../shapes/item/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";

function makeStats() {
  return stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 });
}

function makeHeroActor(id, px, py, alive) {
  const hp = alive ? 24 : 0;
  return actor.of({ id, kind: "hero", pos: point.of(px, py), stats: stats.of({ hp, maxHp: 24, attack: 4, defense: 1 }) });
}

function makeHero(name, id, px, py, alive) {
  const a = makeHeroActor(id, px, py, alive);
  return hero.of({ name, actor: a, pending: null, alive });
}

function makeMonster(id, kind, px, py) {
  return actor.of({ id, kind, pos: point.of(px, py), stats: makeStats() });
}

function makeItem(id, kind, px, py, amount) {
  return item.of({ id, kind, pos: point.of(px, py), amount: amount ?? 0 });
}

function makeEntry() {
  return save.of({ seed: 1, depth: 1, players: [] });
}

function fullMask(width, height) {
  return mask.of(width, height, Array(width * height).fill(true));
}

test("camera", () => {
  const makeGrid48x32 = () => {
    const tiles = Array(48 * 32).fill("floor");
    return tileGrid.of(48, 32, tiles);
  };
  const g48x32 = makeGrid48x32();

  const heroAt = (name, px, py, alive) => world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid: g48x32, heroes: [makeHero(name, 0, px, py, alive !== false)], monsters: [], items: [],
    visible: mask.empty(48, 32), explored: mask.empty(48, 32), gold: 0, log: ["hello"], entry: makeEntry()
  });

  let c = camera(heroAt("Ann", 2, 2, true), "Ann", 16, 10);
  assert.deepEqual(c, point.of(0, 0));
  c = camera(heroAt("Ann", 40, 30, true), "Ann", 16, 10);
  assert.deepEqual(c, point.of(32, 22));
  c = camera(heroAt("Ann", 20, 15, true), "Ann", 16, 10);
  assert.deepEqual(c, point.of(12, 10));

  const hAnn = makeHero("Ann", 0, 2, 2, false);
  const hBob = makeHero("Bob", 1, 20, 15, true);
  const wBob = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid: g48x32, heroes: [hAnn, hBob], monsters: [], items: [],
    visible: mask.empty(48, 32), explored: mask.empty(48, 32), gold: 0, log: ["hello"], entry: makeEntry()
  });
  c = camera(wBob, "Ann", 16, 10);
  assert.deepEqual(c, point.of(12, 10));

  const hDead = makeHero("Ann", 0, 2, 2, false);
  const wDead = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid: g48x32, heroes: [hDead], monsters: [], items: [],
    visible: mask.empty(48, 32), explored: mask.empty(48, 32), gold: 0, log: ["hello"], entry: makeEntry()
  });
  c = camera(wDead, "Ann", 16, 10);
  assert.deepEqual(c, point.of(0, 0));

  const makeGrid10x5 = () => {
    const tiles = Array(10 * 5).fill("floor");
    return tileGrid.of(10, 5, tiles);
  };
  const g10x5 = makeGrid10x5();
  const h10x5 = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid: g10x5, heroes: [makeHero("Ann", 0, 5, 2, true)], monsters: [], items: [],
    visible: mask.empty(10, 5), explored: mask.empty(10, 5), gold: 0, log: ["hello"], entry: makeEntry()
  });
  c = camera(h10x5, "Ann", 16, 10);
  assert.deepEqual(c, point.of(0, 0));
});

test("flat-colours", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);
  const hAnn = makeHero("Ann", 0, 1, 1, true);
  const hBob = makeHero("Bob", 1, 3, 1, true);
  const monster = makeMonster(2, "slime", 4, 1);
  const itemGold = makeItem(0, "gold", 5, 1, 10);
  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monster], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  draw(w, "Ann", false);

  const ctx = canvas.getContext("2d");
  const getData = (cx, cy) => {
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  };

  let p = getData(24, 24);
  assert.equal(p.r, 90); assert.equal(p.g, 80); assert.equal(p.b, 90);

  p = getData(120, 72);
  assert.equal(p.r, 230); assert.equal(p.g, 200); assert.equal(p.b, 60);

  p = getData(72, 72);
  assert.equal(p.r, 60); assert.equal(p.g, 120); assert.equal(p.b, 255);

  p = getData(168, 72);
  assert.equal(p.r, 60); assert.equal(p.g, 200); assert.equal(p.b, 120);

  p = getData(216, 72);
  assert.equal(p.r, 220); assert.equal(p.g, 50); assert.equal(p.b, 50);

  p = getData(264, 72);
  assert.equal(p.r, 240); assert.equal(p.g, 180); assert.equal(p.b, 40);

  draw(w, "Bob", false);
  p = getData(72, 72);
  assert.equal(p.r, 60); assert.equal(p.g, 200); assert.equal(p.b, 120);
  p = getData(168, 72);
  assert.equal(p.r, 60); assert.equal(p.g, 120); assert.equal(p.b, 255);

  const hBobDead = makeHero("Bob", 1, 3, 1, false);
  const wDeadBob = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBobDead], monsters: [monster], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });
  draw(wDeadBob, "Ann", false);
  p = getData(168, 72);
  assert.equal(p.r, 50); assert.equal(p.g, 36); assert.equal(p.b, 44);

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
  const hAnn = makeHero("Ann", 0, 1, 1, true);
  const hBob = makeHero("Bob", 1, 3, 1, true);
  const monster = makeMonster(2, "slime", 4, 1);
  const itemGold = makeItem(0, "gold", 5, 1, 10);
  const w1 = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monster], items: [itemGold],
    visible: visible1, explored: explored1, gold: 0, log: ["hello"], entry: makeEntry()
  });

  draw(w1, "Ann", false);

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
  const w2 = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monster], items: [itemGold],
    visible: visible1, explored: explored2, gold: 0, log: ["hello"], entry: makeEntry()
  });

  draw(w2, "Ann", false);
  p = getData(264, 72);
  assert.equal(p.r, 22); assert.equal(p.g, 13); assert.equal(p.b, 19);
});

test("paused", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);
  const hAnn = makeHero("Ann", 0, 1, 1, true);
  const hBob = makeHero("Bob", 1, 3, 1, true);
  const monster = makeMonster(2, "slime", 4, 1);
  const itemGold = makeItem(0, "gold", 5, 1, 10);
  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monster], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  const ctx = canvas.getContext("2d");

  draw(w, "Ann", true);
  let p = ctx.getImageData(4, 240, 1, 1).data;
  assert.equal(p[0], 0); assert.equal(p[1], 0); assert.equal(p[2], 0);
  p = ctx.getImageData(4, 218, 1, 1).data;
  assert.equal(p[0], 0); assert.equal(p[1], 0); assert.equal(p[2], 0);

  draw(w, "Ann", false);
  p = ctx.getImageData(4, 240, 1, 1).data;
  assert.ok(!(p[0] === 0 && p[1] === 0 && p[2] === 0), "row 240 not paused band");
});

test("walls", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######", "#######"]);
  const visible = fullMask(7, 4);
  const explored = fullMask(7, 4);
  const hAnn = makeHero("Ann", 0, 1, 1, true);
  const hBob = makeHero("Bob", 1, 3, 1, true);
  const monster = makeMonster(2, "slime", 4, 1);
  const itemGold = makeItem(0, "gold", 5, 1, 10);
  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monster], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  draw(w, "Ann", false);

  const ctx = canvas.getContext("2d");
  const getData = (cx, cy) => {
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  };

  let p = getData(3 * 48 + 24, 2 * 48 + 24);
  assert.equal(p.r, 90); assert.equal(p.g, 80); assert.equal(p.b, 90);

  p = getData(3 * 48 + 24, 3 * 48 + 24);
  assert.equal(p.r, 22); assert.equal(p.g, 13); assert.equal(p.b, 19);
});

test("animates", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);

  const ctx = canvas.getContext("2d");
  const getData = (cx, cy) => {
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  };

  const makeAnn = (last) => {
    const a = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: makeStats(), last });
    return hero.of({ name: "Ann", actor: a, pending: null, alive: true });
  };

  const makeWorld = (hAnn) => world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn], monsters: [], items: [],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  // {kind: 'attack', dx: 1, dy: 0, at: 0}
  {
    const hAnn = makeAnn({ kind: "attack", dx: 1, dy: 0, at: 0 });
    const w = makeWorld(hAnn);
    draw(w, "Ann", false, 150);
    let p = getData(72, 44);
    assert.equal(p.r, 60); assert.equal(p.g, 120); assert.equal(p.b, 255);
    draw(w, "Ann", false, 210);
    p = getData(100, 72);
    assert.equal(p.r, 60); assert.equal(p.g, 120); assert.equal(p.b, 255);
    draw(w, "Ann", false, 400);
    p = getData(72, 44);
    assert.equal(p.r, 90); assert.equal(p.g, 80); assert.equal(p.b, 90);
    p = getData(100, 72);
    assert.equal(p.r, 230); assert.equal(p.g, 200); assert.equal(p.b, 60);
    draw(w, "Ann", false);
    p = getData(72, 44);
    assert.equal(p.r, 90); assert.equal(p.g, 80); assert.equal(p.b, 90);
    p = getData(100, 72);
    assert.equal(p.r, 230); assert.equal(p.g, 200); assert.equal(p.b, 60);
  }

  // {kind: 'move', dx: 1, dy: 0, at: 0}
  {
    const hAnn = makeAnn({ kind: "move", dx: 1, dy: 0, at: 0 });
    const w = makeWorld(hAnn);
    draw(w, "Ann", false, 80);
    let p = getData(72, 46);
    assert.equal(p.r, 60); assert.equal(p.g, 120); assert.equal(p.b, 255);
    draw(w, "Ann", false, 200);
    p = getData(72, 46);
    assert.equal(p.r, 90); assert.equal(p.g, 80); assert.equal(p.b, 90);
  }

  // {kind: 'attack', dx: 0, dy: -1, at: 0}
  {
    const hAnn = makeAnn({ kind: "attack", dx: 0, dy: -1, at: 0 });
    const w = makeWorld(hAnn);
    draw(w, "Ann", false, 150);
    let p = getData(54, 56);
    assert.equal(p.r, 60); assert.equal(p.g, 120); assert.equal(p.b, 255);
    draw(w, "Ann", false, 0);
    p = getData(54, 56);
    assert.equal(p.r, 50); assert.equal(p.g, 36); assert.equal(p.b, 44);
  }
});

test("prices", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.....#", "#.....#", "#######"]);
  const visible = fullMask(7, 4);
  const explored = fullMask(7, 4);
  const hAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: makeStats() }) });
  const sword = item.of({ id: 12, kind: "sword", pos: point.of(3, 2), price: 30 });
  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn], monsters: [], items: [sword],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  draw(w, "Ann", false);

  const ctx = canvas.getContext("2d");
  const getPixels = (x0, y0, w, h) => {
    const data = ctx.getImageData(x0, y0, w, h).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
    return pixels;
  };

  const band = getPixels(144, 64, 48, 32);
  let redHigh = 0, greenHighRedLow = 0;
  for (const p of band) {
    if (p.r > 200 && p.g >= 160 && p.g <= 240 && p.b < 140) redHigh++;
    if (p.g > 245 && p.r < 170) greenHighRedLow++;
  }
  assert.ok(redHigh >= 5, "at least 5 pixels with red above 200, green 160-240, blue below 140");
  assert.equal(greenHighRedLow, 0, "none with green above 245 and red below 170");

  const hAnnOffer = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: makeStats() }), offer: 12 });
  const wOffer = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnnOffer], monsters: [], items: [sword],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });
  draw(wOffer, "Ann", false);
  const bandOffer = getPixels(144, 64, 48, 32);
  let greenHigh = 0;
  for (const p of bandOffer) {
    if (p.g > 200 && p.r < 170) greenHigh++;
  }
  assert.ok(greenHigh >= 5, "with offer, at least 5 pixels with green above 200 and red below 170");

  const bandAnn = getPixels(48, 64, 48, 32);
  let redHighAnn = 0, greenHighRedLowAnn = 0;
  for (const p of bandAnn) {
    if (p.r > 200 && p.g >= 160 && p.g <= 240 && p.b < 140) redHighAnn++;
    if (p.g > 245 && p.r < 170) greenHighRedLowAnn++;
  }
  assert.equal(redHighAnn, 0, "above Ann, none with red above 200, green 160-240, blue below 140");
  assert.equal(greenHighRedLowAnn, 0, "above Ann, none with green above 245 and red below 170");
});

test("themes", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  await load("/assets/");

  const makeWorldForDepth = (depth) => {
    const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
    const visible = fullMask(7, 3);
    const explored = fullMask(7, 3);
    const hAnn = makeHero("Ann", 0, 1, 1, true);
    const hBob = makeHero("Bob", 1, 3, 1, true);
    const monster = makeMonster(2, "slime", 4, 1);
    const itemGold = makeItem(0, "gold", 5, 1, 10);
    return world.of({
      seed: 1, rng: 1, depth, time: 0, state: "playing",
      grid, heroes: [hAnn, hBob], monsters: [monster], items: [itemGold],
      visible, explored, gold: 0, log: ["hello"], entry: save.of({ seed: 1, depth, players: [] })
    });
  };

  const collectPixels = (w, x, y, size) => {
    draw(w, "Ann", false);
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(x, y, size, size).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push(`${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`);
    }
    return pixels;
  };

  const diffPixels = (a, b) => {
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) diff++;
    }
    return diff;
  };

  const wall1 = collectPixels(makeWorldForDepth(1), 96, 0, 48);
  const wall7 = collectPixels(makeWorldForDepth(7), 96, 0, 48);
  const floor1 = collectPixels(makeWorldForDepth(1), 240, 48, 48);
  const floor7 = collectPixels(makeWorldForDepth(7), 240, 48, 48);

  assert.ok(diffPixels(wall1, wall7) >= 10, "wall cell (2,0) differs between depth 1 and 7 by at least 10 pixels");
  assert.ok(diffPixels(floor1, floor7) >= 10, "floor cell (5,1) differs between depth 1 and 7 by at least 10 pixels");

  const wall6 = collectPixels(makeWorldForDepth(6), 96, 0, 48);
  assert.ok(diffPixels(wall1, wall6) >= 1, "wall cell (2,0) at depth 6 differs from depth 1");
  assert.ok(diffPixels(wall7, wall6) >= 1, "wall cell (2,0) at depth 6 differs from depth 7");

  const hero1 = collectPixels(makeWorldForDepth(1), 48, 48, 48);
  const hero7 = collectPixels(makeWorldForDepth(7), 48, 48, 48);
  const hero6 = collectPixels(makeWorldForDepth(6), 48, 48, 48);
  assert.deepEqual(hero1, hero7);
  assert.deepEqual(hero1, hero6);
});

test("sprites", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  await load("/assets/");

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);
  const hAnn = makeHero("Ann", 0, 1, 1, true);
  const hBob = makeHero("Bob", 1, 3, 1, true);
  const monsterRight = actor.of({ id: 2, kind: "snake", pos: point.of(4, 1), stats: makeStats(), facing: "right" });
  const itemGold = makeItem(0, "gold", 5, 1, 10);
  const wRight = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monsterRight], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  draw(wRight, "Ann", false);

  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(48, 48, 48, 48).data;

  const colours = new Set();
  for (let i = 0; i < data.length; i += 4) {
    colours.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  }
  assert.ok(colours.size >= 3, "Ann's cell holds at least 3 colours");

  const cdata = ctx.getImageData(72, 72, 1, 1).data;
  assert.ok(!(cdata[0] === 60 && cdata[1] === 120 && cdata[2] === 255), "centre pixel is not the flat hero colour");

  const bdata = ctx.getImageData(145, 49, 1, 1).data;
  assert.equal(bdata[0], 60); assert.equal(bdata[1], 200); assert.equal(bdata[2], 120);

  const monsterRightData = ctx.getImageData(192, 48, 48, 48).data;

  const monsterLeft = actor.of({ id: 2, kind: "snake", pos: point.of(4, 1), stats: makeStats(), facing: "left" });
  const wLeft = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monsterLeft], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  draw(wLeft, "Ann", false);
  const monsterLeftData = ctx.getImageData(192, 48, 48, 48).data;

  let diffCount = 0;
  for (let i = 0; i < monsterRightData.length; i += 4) {
    const rDiff = monsterRightData[i] !== monsterLeftData[i];
    const gDiff = monsterRightData[i + 1] !== monsterLeftData[i + 1];
    const bDiff = monsterRightData[i + 2] !== monsterLeftData[i + 2];
    const aDiff = monsterRightData[i + 3] !== monsterLeftData[i + 3];
    if (rDiff || gDiff || bDiff || aDiff) diffCount++;
  }
  assert.ok(diffCount >= 10, "at least 10 pixels differ between right and left facing");

  const monsterDefault = actor.of({ id: 2, kind: "snake", pos: point.of(4, 1), stats: makeStats() });
  const wDefault = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn, hBob], monsters: [monsterDefault], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });
  draw(wDefault, "Ann", false);
  const monsterDefaultData = ctx.getImageData(192, 48, 48, 48).data;

  for (let i = 0; i < monsterRightData.length; i++) {
    assert.equal(monsterRightData[i], monsterDefaultData[i], `pixel ${i} matches default facing`);
  }

  const wall20 = ctx.getImageData(96, 0, 48, 48).data;
  const wall40 = ctx.getImageData(192, 0, 48, 48).data;
  const wall00 = ctx.getImageData(0, 0, 48, 48).data;

  for (let i = 0; i < wall20.length; i++) {
    assert.equal(wall20[i], wall40[i], "wall-10 cells (2,0) and (4,0) pixel for pixel same");
  }

  let wallDiff = 0;
  for (let i = 0; i < wall00.length; i++) {
    if (wall00[i] !== wall20[i]) wallDiff++;
  }
  assert.ok(wallDiff >= 10, "wall-6 (0,0) differs from wall-10 (2,0) in at least 10 pixels");
});

test("world/valid", () => {
  const grid5x3 = tileGrid.fromRows(["#####", "#.>.#", "#####"]);
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const heroStats = makeStats();
  const heroActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: heroStats });
  const heroAnn = hero.of({ name: "Ann", actor: heroActor });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(2, 1), stats: heroStats });
  const itemGold = item.of({ id: 0, kind: "gold", pos: point.of(3, 1), amount: 5 });
  const entry = save.of({ seed: 1, depth: 1, players: [] });

  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry
  });
  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.heroes));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));

  const wDepth29 = world.of({ seed: 1, rng: 1, depth: 29, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry });
  assert.equal(wDepth29.depth, 29);

  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "dead", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 30, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: -1, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible: mask.empty(4, 3), explored, gold: 0, log: ["hello"], entry }), TypeError);
  const heroMonster = actor.of({ id: 1, kind: "hero", pos: point.of(2, 1), stats: heroStats });
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [heroMonster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
  const mkH = (n, i) => hero.of({ name: n, actor: actor.of({ id: i, kind: "hero", pos: point.of(0, 0), stats: heroStats }) });
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid: grid5x3, heroes: [mkH("A", 0), mkH("B", 1), mkH("C", 2), mkH("D", 3), mkH("E", 4)], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
  const heroAnn2 = hero.of({ name: "Ann", actor: actor.of({ id: 6, kind: "hero", pos: point.of(0, 0), stats: heroStats }) });
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn, heroAnn2], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
  const longLog = Array(51).fill("hello");
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: longLog }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"] }), TypeError);

  const w2 = w.with({ time: 9 });
  assert.equal(w2.time, 9);
  assert.equal(w.time, 0);

  const w3 = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry });
  assert.deepStrictEqual(w, w3);
  assert.ok(!Object.hasOwn(w, "with"));
  assert.ok(!Object.hasOwn(w, "data"));
});

test("world/data", () => {
  const grid5x3 = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const visibleCells = [
    false, false, false, false, false,
    false, true, false, false, false,
    false, false, false, false, false
  ];
  const visible = mask.of(5, 3, visibleCells);
  const explored = mask.empty(5, 3);
  const heroStats = makeStats();
  const heroActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: heroStats });
  const heroAnn = hero.of({ name: "Ann", actor: heroActor, pending: intent.move(1, 0) });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(2, 1), stats: heroStats });
  const itemGold = item.of({ id: 0, kind: "gold", pos: point.of(3, 1), amount: 5 });
  const entry = save.of({ seed: 1, depth: 1, players: [] });

  const w = world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold],
    visible, explored, gold: 0, log: ["hello"], entry
  });

  const data = JSON.parse(JSON.stringify(w.data()));
  const wFromData = world.fromData(data);
  assert.deepStrictEqual(wFromData, w);
  assert.deepStrictEqual(w.data().grid, ["#####", "#...#", "#####"]);
  assert.equal(w.data().visible[1], "01000");

  assert.throws(() => world.fromData({}), TypeError);
  const badData = w.data();
  badData.depth = 9;
  assert.throws(() => world.fromData(badData), TypeError);
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
