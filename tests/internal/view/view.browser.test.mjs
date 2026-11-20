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

function makeWorld() {
  const grid = tileGrid.fromRows(["#######", "#.>...#", "#######"]);
  const cells = [true, false, false, false, false, false, false,
                 true, true, true, true, true, true, true,
                 false, false, false, false, false, false, false];
  const visible = mask.of(7, 3, cells);
  const explored = visible;
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(4, 1), stats: stats.of({ hp: 10, maxHp: 10, attack: 2, defense: 2 }) });
  const gold = item.of({ id: 0, kind: "gold", pos: point.of(5, 1), amount: 5 });
  return world.of({ seed: 1, rng: 2, depth: 2, turn: 0, state: "playing", grid, hero, monsters: [monster], items: [gold], visible, explored, gold: 5, log: [] });
}

function centrePixel(img, cx, cy) {
  const px = cx * 48 + 24;
  const py = cy * 48 + 24;
  const i = (py * 800 + px) * 4;
  return [img[i], img[i + 1], img[i + 2], img[i + 3]];
}

test("flat-colours: tiles, hero, monster, gold", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  view.init(canvas);
  const w = makeWorld();
  view.draw(w);
  const img = ctx.getImageData(0, 0, 800, 600).data;
  assert.deepEqual(centrePixel(img, 0, 0), [90, 80, 90, 255]);
  assert.deepEqual(centrePixel(img, 2, 1), [230, 200, 60, 255]);
  assert.deepEqual(centrePixel(img, 3, 1), [50, 36, 44, 255]);
  assert.deepEqual(centrePixel(img, 1, 1), [60, 120, 255, 255]);
  assert.deepEqual(centrePixel(img, 4, 1), [220, 50, 50, 255]);
  assert.deepEqual(centrePixel(img, 5, 1), [240, 180, 40, 255]);
});
