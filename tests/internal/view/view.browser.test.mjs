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
  const cells = [true, false, false, false, false, false, false,
                 true, true, true, true, true, true, true,
                 false, false, false, false, false, false, false];
  const visible = mask.of(7, 3, cells);
  const explored = visible;
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
