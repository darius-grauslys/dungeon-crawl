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
import * as level from "../../../shapes/level/index.mjs";

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

test("aim", async () => {
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

  const makeAnn = (aim, range) => {
    const a = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1, range: range ?? 1 }), aim: aim ?? { dx: 1, dy: 0 } });
    return hero.of({ name: "Ann", actor: a, pending: null, alive: true });
  };

  const makeWorld = (hAnn) => world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn], monsters: [], items: [],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  // range 1, aiming (1,0)
  {
    const hAnn = makeAnn({ dx: 1, dy: 0 }, 1);
    const w = makeWorld(hAnn);
    draw(w, "Ann", false, 300);
    let p = getData(120, 72);
    assert.equal(p.r, 255); assert.equal(p.g, 140); assert.equal(p.b, 0);
    draw(w, "Ann", false, 0);
    p = getData(120, 72);
    assert.equal(p.r, 230); assert.equal(p.g, 200); assert.equal(p.b, 60);
    draw(w, "Ann", false, 600);
    p = getData(120, 72);
    assert.equal(p.r, 230); assert.equal(p.g, 200); assert.equal(p.b, 60);
  }

  // range 3, aiming (1,0)
  {
    const hAnn = makeAnn({ dx: 1, dy: 0 }, 3);
    const w = makeWorld(hAnn);
    draw(w, "Ann", false, 300);
    let p = getData(216, 72);
    assert.equal(p.r, 255); assert.equal(p.g, 140); assert.equal(p.b, 0);
    p = getData(120, 72);
    assert.equal(p.r, 230); assert.equal(p.g, 200); assert.equal(p.b, 60);
  }

  // aiming (-1,0), wall next to her
  {
    const hAnn = makeAnn({ dx: -1, dy: 0 }, 1);
    const w = makeWorld(hAnn);
    draw(w, "Ann", false, 300);
    const data = ctx.getImageData(0, 0, 800, 480).data;
    let hasDot = false;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 140 && data[i + 2] === 0) hasDot = true;
    }
    assert.ok(!hasDot, "no aim dot when aiming at wall");
  }

  // draw for 'Eve' (not in world) draws no dot
  {
    const hAnn = makeAnn({ dx: 1, dy: 0 }, 1);
    const w = makeWorld(hAnn);
    draw(w, "Eve", false, 300);
    const data = ctx.getImageData(0, 0, 800, 480).data;
    let hasDot = false;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 140 && data[i + 2] === 0) hasDot = true;
    }
    assert.ok(!hasDot, "no aim dot when me is not in world");
  }
});

test("sizes", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);
  const hAnn = makeHero("Ann", 0, 1, 1, true);

  const ctx = canvas.getContext("2d");
  const getData = (cx, cy) => {
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  };

  // golem of size 3 at (3,0)
  {
    const golem = actor.of({ id: 2, kind: "golem", pos: point.of(3, 0), stats: makeStats(), size: 3 });
    const w = world.of({
      seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
      grid, heroes: [hAnn], monsters: [golem], items: [],
      visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
    });
    draw(w, "Ann", false);
    let p = getData(168, 24);
    assert.equal(p.r, 220); assert.equal(p.g, 50); assert.equal(p.b, 50);
    p = getData(216, 72);
    assert.equal(p.r, 220); assert.equal(p.g, 50); assert.equal(p.b, 50);
    p = getData(264, 120);
    assert.equal(p.r, 220); assert.equal(p.g, 50); assert.equal(p.b, 50);
  }

  // golem small at size 1 at (4,1)
  {
    const golem = actor.of({ id: 2, kind: "golem", pos: point.of(4, 1), stats: makeStats(), size: 1, small: true });
    const w = world.of({
      seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
      grid, heroes: [hAnn], monsters: [golem], items: [],
      visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
    });
    draw(w, "Ann", false);
    let p = getData(216, 72);
    assert.equal(p.r, 220); assert.equal(p.g, 50); assert.equal(p.b, 50);
    p = getData(204, 60);
    assert.equal(p.r, 50); assert.equal(p.g, 36); assert.equal(p.b, 44);
  }
});

test("flies", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);
  const hAnn = makeHero("Ann", 0, 1, 1, true);

  const ctx = canvas.getContext("2d");
  const getData = (cx, cy) => {
    const data = ctx.getImageData(cx, cy, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  };

  // flung gold
  {
    const gold = item.of({ id: 0, kind: "gold", pos: point.of(5, 1), amount: 5, flung: { x: 3, y: 1, at: 0 } });
    const w = world.of({
      seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
      grid, heroes: [hAnn], monsters: [], items: [gold],
      visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
    });
    draw(w, "Ann", false, 200);
    let p = getData(216, 40);
    assert.equal(p.r, 240); assert.equal(p.g, 180); assert.equal(p.b, 40);
    p = getData(264, 72);
    assert.equal(p.r, 50); assert.equal(p.g, 36); assert.equal(p.b, 44);

    draw(w, "Ann", false, 400);
    p = getData(264, 72);
    assert.equal(p.r, 240); assert.equal(p.g, 180); assert.equal(p.b, 40);
  }

  // projectile from ranged attack
  {
    const a = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: makeStats(), last: { kind: "attack", dx: 1, dy: 0, at: 0, reach: 3 } });
    const hAnn2 = hero.of({ name: "Ann", actor: a, pending: null, alive: true });
    const w = world.of({
      seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
      grid, heroes: [hAnn2], monsters: [], items: [],
      visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
    });
    draw(w, "Ann", false, 180);
    let p = getData(144, 72);
    assert.equal(p.r, 255); assert.equal(p.g, 160); assert.equal(p.b, 40);
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
    return world.of({
      seed: 1, rng: 1, depth, time: 0, state: "playing",
      grid, heroes: [hAnn, hBob], monsters: [monster], items: [],
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
  const wall8 = collectPixels(makeWorldForDepth(8), 96, 0, 48);
  const floor1 = collectPixels(makeWorldForDepth(1), 240, 48, 48);
  const floor8 = collectPixels(makeWorldForDepth(8), 240, 48, 48);

  assert.ok(diffPixels(wall1, wall8) >= 10, "wall cell (2,0) differs between depth 1 and 8 by at least 10 pixels");
  assert.ok(diffPixels(floor1, floor8) >= 10, "floor cell (5,1) differs between depth 1 and 8 by at least 10 pixels");

  const wall6 = collectPixels(makeWorldForDepth(6), 96, 0, 48);
  assert.ok(diffPixels(wall1, wall6) >= 1, "wall cell (2,0) at depth 6 differs from depth 1");
  assert.ok(diffPixels(wall8, wall6) >= 1, "wall cell (2,0) at depth 6 differs from depth 8");

  // lair blend comparison
  const makeGrid32x3 = () => tileGrid.fromRows([
    "#".repeat(32),
    "#" + ".".repeat(30) + "#",
    "#".repeat(32)
  ]);

  const makeHeroForPos = (name, id, px, py) => {
    const a = actor.of({ id, kind: "hero", pos: point.of(px, py), stats: makeStats() });
    return hero.of({ name, actor: a, pending: null, alive: true });
  };

  const makeWorld32x3 = (depth, px, py) => {
    const grid = makeGrid32x3();
    const visible = fullMask(32, 3);
    const explored = fullMask(32, 3);
    const hAnn = makeHeroForPos("Ann", 0, px, py);
    return world.of({
      seed: 1, rng: 1, depth, time: 0, state: "playing",
      grid, heroes: [hAnn], monsters: [], items: [],
      visible, explored, gold: 0, log: ["hello"], entry: save.of({ seed: 1, depth, players: [] })
    });
  };

  const collectCellPixels32x3 = (w, cx, cy) => {
    const cam = camera(w, "Ann", 16, 10);
    draw(w, "Ann", false);
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData((cx - cam.x) * 48, (cy - cam.y) * 48, 48, 48).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push(`${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`);
    }
    return pixels;
  };

  const worldDepth1A = makeWorld32x3(1, 1, 1);
  const worldDepth7A = makeWorld32x3(7, 1, 1);
  const pixel1A = collectCellPixels32x3(worldDepth1A, 3, 1);
  const pixel7A = collectCellPixels32x3(worldDepth7A, 3, 1);
  assert.deepEqual(pixel1A, pixel7A, "cell (3,1) at depth 7 is pixel for pixel same as depth 1");

  const worldDepth1B = makeWorld32x3(1, 30, 1);
  const worldDepth8B = makeWorld32x3(8, 30, 1);
  const worldDepth7B = makeWorld32x3(7, 30, 1);
  const pixel1B = collectCellPixels32x3(worldDepth1B, 28, 1);
  const pixel8B = collectCellPixels32x3(worldDepth8B, 28, 1);
  const pixel7B = collectCellPixels32x3(worldDepth7B, 28, 1);
  assert.deepEqual(pixel7B, pixel8B, "cell (28,1) at depth 7 is pixel for pixel same as depth 8");
  assert.ok(diffPixels(pixel1B, pixel7B) >= 10, "cell (28,1) at depth 7 differs from depth 1 in at least 10 pixels");
});

test("poses", async () => {
  const canvas = document.querySelector("canvas");
  init(canvas);

  await load("/assets/");

  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = fullMask(7, 3);
  const explored = fullMask(7, 3);

  const ctx = canvas.getContext("2d");
  const collectAnnCell = (w, now) => {
    draw(w, "Ann", false, now);
    const data = ctx.getImageData(48, 48, 48, 48).data;
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

  const makeAnn = (colour, gesture, last) => {
    const a = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: makeStats(), gesture, last });
    return hero.of({ name: "Ann", actor: a, pending: null, alive: true, colour });
  };

  const makeWorld = (hAnn) => world.of({
    seed: 1, rng: 1, depth: 1, time: 0, state: "playing",
    grid, heroes: [hAnn], monsters: [], items: [],
    visible, explored, gold: 0, log: ["hello"], entry: makeEntry()
  });

  // idle frames: draw at 0 and 250 differ by >= 5 pixels; draw at 750 same as at 0
  {
    const hAnn = makeAnn(0, null, null);
    const w = makeWorld(hAnn);

    const cell0 = collectAnnCell(w, 0);
    const cell250 = collectAnnCell(w, 250);
    assert.ok(diffPixels(cell0, cell250) >= 5, "idle frames 0 and 1 differ in at least 5 pixels");
    const cell750 = collectAnnCell(w, 750);
    assert.deepEqual(cell0, cell750, "frame at 750 is same as at 0 (frame 0 again)");
  }

  // colour 1 differs from colour 0 in at least 5 pixels
  {
    const hAnn0 = makeAnn(0, null, null);
    const w0 = makeWorld(hAnn0);
    const cell0 = collectAnnCell(w0, 0);

    const hAnn1 = makeAnn(1, null, null);
    const w1 = makeWorld(hAnn1);
    const cell1 = collectAnnCell(w1, 0);

    assert.ok(diffPixels(cell0, cell1) >= 5, "colour 1 differs from colour 0 in at least 5 pixels");
  }

  // power gesture: at now 350 differs from idle cell at 0 in at least 20 pixels; at 600 same as idle frame 2
  {
    const hAnnIdle = makeAnn(0, null, null);
    const wIdle = makeWorld(hAnnIdle);
    const idleCell0 = collectAnnCell(wIdle, 0);

    const aPower = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: makeStats(), gesture: { kind: "power", at: 0 }, last: null });
    const hAnnPower = hero.of({ name: "Ann", actor: aPower, pending: null, alive: true, colour: 0 });
    const wPower = makeWorld(hAnnPower);

    const powerCell350 = collectAnnCell(wPower, 350);
    assert.ok(diffPixels(idleCell0, powerCell350) >= 20, "power cell at 350 differs from idle cell at 0 in at least 20 pixels");

    const powerCell600 = collectAnnCell(wPower, 600);
    const idleCell600 = collectAnnCell(wIdle, 600);
    assert.deepEqual(powerCell600, idleCell600, "at 600 past gesture, same as idle frame Math.floor(600/250)%3=2 drawn without gesture");
  }

  // use gesture: at now 300 same as power at 200 (both power_up frame 2); at 450 idle again
  {
    const aUse = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: makeStats(), gesture: { kind: "use", at: 0 }, last: null });
    const hAnnUse = hero.of({ name: "Ann", actor: aUse, pending: null, alive: true, colour: 0 });
    const wUse = makeWorld(hAnnUse);

    const aPower = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: makeStats(), gesture: { kind: "power", at: 0 }, last: null });
    const hAnnPower = hero.of({ name: "Ann", actor: aPower, pending: null, alive: true, colour: 0 });
    const wPower = makeWorld(hAnnPower);

    const powerCell200 = collectAnnCell(wPower, 200);

    const useCell300 = collectAnnCell(wUse, 300);
    assert.deepEqual(useCell300, powerCell200, "use at 300 same as power at 200 (both power_up frame 2)");

    const useCell450 = collectAnnCell(wUse, 450);

    const hAnnIdle = makeAnn(0, null, null);
    const wIdle = makeWorld(hAnnIdle);
    const idleCell450 = collectAnnCell(wIdle, 450);
    assert.deepEqual(useCell450, idleCell450, "at 450 use gesture is idle again");
  }
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

  const wDepth6 = world.of({ seed: 1, rng: 1, depth: 6, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry });
  assert.equal(wDepth6.depth, 6);

  const wDepth29 = world.of({ seed: 1, rng: 1, depth: 29, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry });
  assert.equal(wDepth29.depth, 29);

  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "dead", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 34, time: 0, state: "playing", grid: grid5x3, heroes: [heroAnn], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: ["hello"], entry }), TypeError);
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
  badData.depth = 34;
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

test("level/valid", () => {
  assert.equal(level.MAX_DEPTH, 33);
  assert.equal(level.MAX_LEVEL, 25);
  assert.deepEqual(level.THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma', 'interior']);
  assert.ok(Object.isFrozen(level.THEMES));
  assert.deepEqual(level.DUNGEON_THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma']);
  assert.ok(Object.isFrozen(level.DUNGEON_THEMES));

  assert.equal(level.kind(1), 'dungeon');
  assert.equal(level.kind(5), 'dungeon');
  assert.equal(level.kind(8), 'dungeon');
  assert.equal(level.kind(33), 'dungeon');
  assert.equal(level.kind(6), 'interior');
  assert.equal(level.kind(13), 'interior');
  assert.equal(level.kind(20), 'interior');
  assert.equal(level.kind(27), 'interior');
  assert.equal(level.kind(7), 'boss');
  assert.equal(level.kind(14), 'boss');
  assert.equal(level.kind(21), 'boss');
  assert.equal(level.kind(28), 'boss');

  assert.equal(level.theme(1), 'dungeon');
  assert.equal(level.theme(6), 'interior');
  assert.equal(level.theme(7), 'dungeon');
  assert.equal(level.theme(8), 'frozen');
  assert.equal(level.theme(15), 'arid');
  assert.equal(level.theme(26), 'temple');
  assert.equal(level.theme(28), 'temple');
  assert.equal(level.theme(29), 'magma');
  assert.equal(level.theme(33), 'magma');

  assert.deepEqual(level.blend(7), ['dungeon', 'frozen']);
  assert.ok(Object.isFrozen(level.blend(7)));
  assert.deepEqual(level.blend(28), ['temple', 'magma']);
  assert.equal(level.blend(6), null);
  assert.equal(level.blend(8), null);

  assert.equal(level.tier(5), 0);
  assert.equal(level.tier(6), 0);
  assert.equal(level.tier(7), 0);
  assert.equal(level.tier(8), 1);
  assert.equal(level.tier(33), 4);

  assert.equal(level.stage(1), 1);
  assert.equal(level.stage(12), 5);
  assert.equal(level.stage(13), 6);
  assert.equal(level.stage(14), 7);
  assert.equal(level.stage(29), 1);

  assert.equal(level.round(6), 1);
  assert.equal(level.round(7), 1);
  assert.equal(level.round(27), 4);
  assert.equal(level.round(8), 0);

  assert.equal(level.number(1), 1);
  assert.equal(level.number(5), 5);
  assert.equal(level.number(8), 6);
  assert.equal(level.number(12), 10);
  assert.equal(level.number(33), 25);
  assert.equal(level.number(6), 0);
  assert.equal(level.number(7), 0);

  assert.equal(level.label(8), 'Level 6');
  assert.equal(level.label(13), 'Shop');
  assert.equal(level.label(14), 'Lair');

  assert.throws(() => level.kind(0), TypeError);
  assert.throws(() => level.theme(34), TypeError);
  assert.throws(() => level.tier(1.5), TypeError);
  assert.throws(() => level.blend(40), TypeError);
  assert.throws(() => level.number('3'), TypeError);
  assert.throws(() => level.label(null), TypeError);
});
