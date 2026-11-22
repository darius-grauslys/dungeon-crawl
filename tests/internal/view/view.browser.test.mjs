import test from "node:test";
import assert from "node:assert/strict";
import * as view from "../../../src/view/index.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as item from "../../../shapes/item/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as heroShape from "../../../shapes/hero/index.mjs";
import * as saveShape from "../../../shapes/save/index.mjs";

function makeWorld(annAlive = true, bobAlive = true) {
  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = mask.of(7, 3, Array(21).fill(true));
  const explored = mask.of(7, 3, Array(21).fill(true));
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const bobActor = actor.of({ id: 1, kind: "hero", pos: point.of(3, 1), stats: stats.of({ hp: bobAlive ? 18 : 0, maxHp: 24, attack: 4, defense: 1 }) });
  const monster = actor.of({ id: 2, kind: "slime", pos: point.of(4, 1), stats: stats.of({ hp: 10, maxHp: 10, attack: 2, defense: 2 }) });
  const gold = item.of({ id: 0, kind: "gold", pos: point.of(5, 1), amount: 5 });
  const heroes = [
    heroShape.of({ name: "Ann", actor: annActor, alive: annAlive }),
    heroShape.of({ name: "Bob", actor: bobActor, alive: bobAlive })
  ];
  const entry = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }, { name: "Bob", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  return world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes, monsters: [monster], items: [gold], visible, explored, gold: 5, log: ["a", "b", "c", "d"], entry });
}

function centrePixel(img, cx, cy) {
  const px = cx * 48 + 24;
  const py = cy * 48 + 24;
  const i = (py * 800 + px) * 4;
  return [img[i], img[i + 1], img[i + 2], img[i + 3]];
}

function pixelAt(img, x, y) {
  const i = (y * 800 + x) * 4;
  return [img[i], img[i + 1], img[i + 2], img[i + 3]];
}

test("flat-colours: tiles, hero, monster, gold (me Ann)", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWorld();
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(centrePixel(img, 0, 0), [90, 80, 90, 255]);
  assert.deepEqual(centrePixel(img, 2, 1), [230, 200, 60, 255]);
  assert.deepEqual(centrePixel(img, 1, 1), [60, 120, 255, 255]);
  assert.deepEqual(centrePixel(img, 3, 1), [60, 200, 120, 255]);
  assert.deepEqual(centrePixel(img, 4, 1), [220, 50, 50, 255]);
  assert.deepEqual(centrePixel(img, 5, 1), [240, 180, 40, 255]);
});

test("flat-colours: me Bob", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWorld();
  view.draw(w, "Bob", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(centrePixel(img, 1, 1), [60, 200, 120, 255]);
  assert.deepEqual(centrePixel(img, 3, 1), [60, 120, 255, 255]);
});

test("flat-colours: Bob not alive", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWorld(true, false);
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(centrePixel(img, 3, 1), [50, 36, 44, 255]);
});

test("panel is drawn", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWorld();
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  const i = (596 * 800 + 796) * 4;
  const rgb = [img[i], img[i + 1], img[i + 2]];
  assert.notDeepEqual(rgb, [22, 13, 19]);
});

test("paused band drawn", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWorld();
  view.draw(w, "Ann", true);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  // 10 rows: map's middle is pixel row 240, band from 216 to 264
  const i240 = (240 * 800 + 4) * 4;
  assert.deepEqual([img[i240], img[i240 + 1], img[i240 + 2]], [0, 0, 0]);
  const i218 = (218 * 800 + 4) * 4;
  assert.deepEqual([img[i218], img[i218 + 1], img[i218 + 2]], [0, 0, 0]);
});

test("paused band not drawn when false", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWorld();
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  // row 240 is cell row 5, outside the 3-row grid: the background
  const i240 = (240 * 800 + 4) * 4;
  assert.notDeepEqual([img[i240], img[i240 + 1], img[i240 + 2]], [0, 0, 0]);
});

function makeWallsWorld() {
  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######", "#######"]);
  const cells = [];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 7; x++) cells.push(true);
  const visible = mask.of(7, 4, cells);
  const explored = visible;
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const heroes = [heroShape.of({ name: "Ann", actor: annActor, alive: true })];
  const entry = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  return world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes, monsters: [], items: [], visible, explored, gold: 5, log: [], entry });
}

test("walls: standing and non-standing", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWallsWorld();
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  // (3, 2) stands: wall rgb(90,80,90)
  assert.deepEqual(centrePixel(img, 3, 2), [90, 80, 90, 255]);
  // (3, 3) does not stand: background rgb(22,13,19)
  assert.deepEqual(centrePixel(img, 3, 3), [22, 13, 19, 255]);
});

function makeFogWorldOnlyAnnVisible() {
  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const exploredCells = [true, true, true, true, true, true, true,
                         true, true, true, true, true, true, true,
                         true, true, true, true, true, true, true];
  const explored = mask.of(7, 3, exploredCells);
  const visibleCells = [false, false, false, false, false, false, false,
                        false, true, false, false, false, false, false,
                        false, false, false, false, false, false, false];
  const visible = mask.of(7, 3, visibleCells);
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const monster = actor.of({ id: 2, kind: "slime", pos: point.of(4, 1), stats: stats.of({ hp: 10, maxHp: 10, attack: 2, defense: 2 }) });
  const gold = item.of({ id: 0, kind: "gold", pos: point.of(5, 1), amount: 5 });
  const heroes = [heroShape.of({ name: "Ann", actor: annActor, alive: true })];
  const entry = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  return world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes, monsters: [monster], items: [gold], visible, explored, gold: 5, log: [], entry });
}

function makeFogWorldOnlyAnnExplored() {
  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const exploredCells = [false, false, false, false, false, false, false,
                         false, true, false, false, false, false, false,
                         false, false, false, false, false, false, false];
  const explored = mask.of(7, 3, exploredCells);
  const visible = explored;
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const monster = actor.of({ id: 2, kind: "slime", pos: point.of(4, 1), stats: stats.of({ hp: 10, maxHp: 10, attack: 2, defense: 2 }) });
  const gold = item.of({ id: 0, kind: "gold", pos: point.of(5, 1), amount: 5 });
  const heroes = [heroShape.of({ name: "Ann", actor: annActor, alive: true })];
  const entry = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  return world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes, monsters: [monster], items: [gold], visible, explored, gold: 5, log: [], entry });
}

test("fog: veiled cells", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeFogWorldOnlyAnnVisible();
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  // monster's cell (4,1) centre: 0.4 * floor (50,36,44) ~ (20,14,17), within 3
  const mp = centrePixel(img, 4, 1);
  assert.ok(Math.abs(mp[0] - 20) <= 3 && Math.abs(mp[1] - 14) <= 3 && Math.abs(mp[2] - 17) <= 3);
  // gold's cell (5,1) centre
  const gp = centrePixel(img, 5, 1);
  assert.ok(Math.abs(gp[0] - 20) <= 3 && Math.abs(gp[1] - 14) <= 3 && Math.abs(gp[2] - 17) <= 3);
});

test("fog: nothing explored but Ann's cell", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeFogWorldOnlyAnnExplored();
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  // (5,1) is neither visible nor explored: background rgb(22,13,19)
  assert.deepEqual(centrePixel(img, 5, 1), [22, 13, 19, 255]);
});

function makeAnimatesWorld(last) {
  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const visible = mask.of(7, 3, Array(21).fill(true));
  const explored = mask.of(7, 3, Array(21).fill(true));
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }), last });
  const heroes = [heroShape.of({ name: "Ann", actor: annActor, alive: true })];
  const entry = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  return world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes, monsters: [], items: [], visible, explored, gold: 5, log: [], entry });
}

test("animates: attack and move", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);

  // attack dx:1, dy:0, at:0
  let w = makeAnimatesWorld({ kind: "attack", dx: 1, dy: 0, at: 0 });
  view.draw(w, "Ann", false, 150);
  let img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 72, 44), [60, 120, 255, 255]);

  view.draw(w, "Ann", false, 210);
  img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 100, 72), [60, 120, 255, 255]);

  view.draw(w, "Ann", false, 400);
  img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 72, 44), [90, 80, 90, 255]);
  assert.deepEqual(pixelAt(img, 100, 72), [230, 200, 60, 255]);

  view.draw(w, "Ann", false);
  img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 72, 44), [90, 80, 90, 255]);
  assert.deepEqual(pixelAt(img, 100, 72), [230, 200, 60, 255]);

  // move dx:1, dy:0, at:0
  w = makeAnimatesWorld({ kind: "move", dx: 1, dy: 0, at: 0 });
  view.draw(w, "Ann", false, 80);
  img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 72, 46), [60, 120, 255, 255]);

  view.draw(w, "Ann", false, 200);
  img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 72, 46), [90, 80, 90, 255]);

  // attack dx:0, dy:-1, at:0
  w = makeAnimatesWorld({ kind: "attack", dx: 0, dy: -1, at: 0 });
  view.draw(w, "Ann", false, 150);
  img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 54, 56), [60, 120, 255, 255]);

  view.draw(w, "Ann", false, 0);
  img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(pixelAt(img, 54, 56), [50, 36, 44, 255]);
});

test("sprites: outline for non-me hero", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  await view.load("/assets/");
  const w = makeWorld();
  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  // pixel 1 in from top-left of Bob's cell (3,1) is rgb(60,200,120)
  assert.deepEqual(pixelAt(img, 145, 49), [60, 200, 120, 255]);
});

function makeThemesWorld(depth) {
  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const cells = Array(21).fill(true);
  const visible = mask.of(7, 3, cells);
  const explored = mask.of(7, 3, cells);
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const heroes = [heroShape.of({ name: "Ann", actor: annActor, alive: true })];
  const entry = saveShape.of({ seed: 1, depth, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  return world.of({ seed: 1, rng: 2, depth, time: 0, state: "playing", grid, heroes, monsters: [], items: [], visible, explored, gold: 5, log: [], entry });
}

test("themes: themed tiles per depth", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  await view.load("/assets/");

  const w1 = makeThemesWorld(1);
  const w8 = makeThemesWorld(8);
  const w6 = makeThemesWorld(6);
  const w7 = makeThemesWorld(7);

  view.draw(w1, "Ann", false);
  const img1 = ctx.getImageData(0, 0, 800, 600).data;
  view.draw(w8, "Ann", false);
  const img8 = ctx.getImageData(0, 0, 800, 600).data;
  view.draw(w6, "Ann", false);
  const img6 = ctx.getImageData(0, 0, 800, 600).data;
  view.draw(w7, "Ann", false);
  const img7 = ctx.getImageData(0, 0, 800, 600).data;

  function countDiff(imgA, imgB, x0, y0, x1, y1) {
    let count = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = (y * 800 + x) * 4;
        if (imgA[i] !== imgB[i] || imgA[i + 1] !== imgB[i + 1] || imgA[i + 2] !== imgB[i + 2]) count++;
      }
    }
    return count;
  }

  function countSame(imgA, imgB, x0, y0, x1, y1) {
    let count = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = (y * 800 + x) * 4;
        if (imgA[i] === imgB[i] && imgA[i + 1] === imgB[i + 1] && imgA[i + 2] === imgB[i + 2]) count++;
      }
    }
    return count;
  }

  // wall cell (2,0): pixels from (96,0) to (143,47)
  const wallDiff18 = countDiff(img1, img8, 96, 0, 143, 47);
  assert.ok(wallDiff18 >= 10, `wall cell (2,0) should differ in >= 10 pixels between depth 1 and 8, got ${wallDiff18}`);

  // floor cell (5,1): pixels from (240,48) to (287,95)
  const floorDiff18 = countDiff(img1, img8, 240, 48, 287, 95);
  assert.ok(floorDiff18 >= 10, `floor cell (5,1) should differ in >= 10 pixels between depth 1 and 8, got ${floorDiff18}`);

  // depth 6 wall cell (2,0) differs from both
  const wallDiff16 = countDiff(img1, img6, 96, 0, 143, 47);
  const wallDiff86 = countDiff(img8, img6, 96, 0, 143, 47);
  assert.ok(wallDiff16 >= 10, `depth 6 wall cell (2,0) should differ from depth 1 in >= 10 pixels, got ${wallDiff16}`);
  assert.ok(wallDiff86 >= 10, `depth 6 wall cell (2,0) should differ from depth 8 in >= 10 pixels, got ${wallDiff86}`);

  // lair-blend check: at depth 7 (first lair), cell (2,0) is blend[0] = dungeon, pixel-for-pixel same as depth 1
  const wallSame17 = countSame(img1, img7, 96, 0, 143, 47);
  assert.ok(wallSame17 === 48 * 48, `wall cell (2,0) at depth 7 should be pixel-for-pixel same as depth 1, got ${wallSame17} same pixels`);
});

test("prices: ware prices over wares", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  // before any load (flat colours)

  const grid = tileGrid.fromRows(["#######", "#.....#", "#.....#", "#######"]);
  const cells = Array(28).fill(true);
  const visible = mask.of(7, 4, cells);
  const explored = mask.of(7, 4, cells);
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const sword = item.of({ id: 12, kind: "sword", pos: point.of(3, 2), price: 30 });
  const entry = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  const w = world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes: [heroShape.of({ name: "Ann", actor: annActor, alive: true })], monsters: [], items: [sword], visible, explored, gold: 5, log: [], entry });

  view.draw(w, "Ann", false);
  const img = ctx.getImageData(0, 0, 800, 600).data;

  function countPixels(img, x0, y0, x1, y1, pred) {
    let count = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = (y * 800 + x) * 4;
        const r = img[i], g = img[i + 1], b = img[i + 2];
        if (pred(r, g, b)) count++;
      }
    }
    return count;
  }

  // band (144, 64) to (191, 95): at least 5 pixels with red > 200, green 160-240, blue < 140
  const priceCount = countPixels(img, 144, 64, 191, 95, (r, g, b) => r > 200 && g >= 160 && g <= 240 && b < 140);
  assert.ok(priceCount >= 5, `expected >= 5 price pixels, got ${priceCount}`);

  // with Ann's offer 12, at least 5 pixels with green > 200 and red < 170
  const sword2 = item.of({ id: 12, kind: "sword", pos: point.of(3, 2), price: 30 });
  const wOffer = world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes: [heroShape.of({ name: "Ann", actor: annActor, alive: true, offer: 12 })], monsters: [], items: [sword2], visible, explored, gold: 5, log: [], entry });
  view.draw(wOffer, "Ann", false);
  const imgOffer = ctx.getImageData(0, 0, 800, 600).data;
  const offerCount = countPixels(imgOffer, 144, 64, 191, 95, (r, g, b) => g > 200 && r < 170);
  assert.ok(offerCount >= 5, `expected >= 5 offer pixels, got ${offerCount}`);
});
