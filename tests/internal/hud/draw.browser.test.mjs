import test from "node:test";
import assert from "node:assert/strict";
import { draw } from "../../../src/hud/index.mjs";
import { fromRows } from "../../../shapes/tile-grid/index.mjs";
import { empty, of as maskOf } from "../../../shapes/mask/index.mjs";

function getPixel(ctx, x, y) {
  const data = ctx.getImageData(x, y, 1, 1).data;
  return [data[0], data[1], data[2]];
}

function makeWorld(hp, maxHp) {
  const grid = borderGrid(48, 32);
  const explored = allTrueMask(48, 32);
  const visible = empty(48, 32);
  return { heroes: [{ name: "Ann", alive: true, actor: { pos: { x: 5, y: 5 }, stats: { hp, maxHp, attack: 1, defense: 1 } } }], monsters: [], gold: 0, depth: 1, log: [], grid, explored, visible };
}

function greenCanvas(ctx) {
  ctx.fillStyle = "rgb(0, 255, 0)";
  ctx.fillRect(0, 0, 800, 600);
}

function borderGrid(width, height) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      row += (y === 0 || y === height - 1 || x === 0 || x === width - 1) ? "#" : ".";
    }
    rows.push(row);
  }
  return fromRows(rows);
}

function allTrueMask(width, height) {
  return maskOf(width, height, new Array(width * height).fill(true));
}

function makeFullWorld(depth, monsters, curse) {
  const grid = borderGrid(48, 32);
  const explored = allTrueMask(48, 32);
  const visible = empty(48, 32);
  const heroes = [{ name: "Ann", alive: true, actor: { pos: { x: 5, y: 5 }, stats: { hp: 12, maxHp: 24, attack: 1, defense: 1 }, slow: 0, curse } }];
  return { heroes, monsters, gold: 0, depth, log: [], grid, explored, visible };
}

test("draw: refuses bad coordinates", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  const world = makeWorld(12, 24);
  assert.throws(() => draw(ctx, 0, 0, 0, 10, world, "Ann"), TypeError);
  assert.throws(() => draw(ctx, 0.5, 0, 10, 10, world, "Ann"), TypeError);
});

test("draw: refuses bad me", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  const world = makeWorld(12, 24);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, world, 5), TypeError);
});

test("draw: refuses a world that isn't one", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, {}, "Ann"), TypeError);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, { gold: 0, depth: 1, log: [] }, "Ann"), TypeError);
});

test("draw: bar rendering at 12 of 24", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  draw(ctx, 0, 480, 800, 120, makeWorld(12, 24), "Ann");
  assert.deepStrictEqual(getPixel(ctx, 58, 494), [200, 40, 40]);
  assert.deepStrictEqual(getPixel(ctx, 158, 494), [60, 20, 20]);
  assert.deepStrictEqual(getPixel(ctx, 4, 476), [0, 255, 0]);
  assert.deepStrictEqual(getPixel(ctx, 796, 596), [40, 26, 34]);
});

test("draw: bar rendering at 24 of 24", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  draw(ctx, 0, 480, 800, 120, makeWorld(24, 24), "Ann");
  assert.deepStrictEqual(getPixel(ctx, 206, 494), [200, 40, 40]);
});

test("draw: bar rendering with no hero gives empty bar", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  draw(ctx, 0, 480, 800, 120, makeWorld(12, 24), "Eve");
  assert.deepStrictEqual(getPixel(ctx, 58, 494), [60, 20, 20]);
});

test("draw: minimap explores open cells in theme colour, me white, standing wall halved", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  const world = makeFullWorld(1, [], 0);
  draw(ctx, 0, 480, 800, 120, world, "Ann");
  assert.deepStrictEqual(getPixel(ctx, 717, 549), [95, 87, 94]);
  assert.deepStrictEqual(getPixel(ctx, 706, 538), [255, 255, 255]);
  assert.deepStrictEqual(getPixel(ctx, 696, 528), [47, 43, 47]);
});

test("draw: minimap with nothing explored stays dark", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  const grid = borderGrid(48, 32);
  const explored = empty(48, 32);
  const visible = empty(48, 32);
  const world = { heroes: [{ name: "Ann", alive: true, actor: { pos: { x: 5, y: 5 }, stats: { hp: 12, maxHp: 24, attack: 1, defense: 1 } } }], monsters: [], gold: 0, depth: 1, log: [], grid, explored, visible };
  draw(ctx, 0, 480, 800, 120, world, "Ann");
  assert.deepStrictEqual(getPixel(ctx, 717, 549), [22, 13, 19]);
});

test("draw: minimap theme colour at depth 8 and 22", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  const world8 = makeFullWorld(8, [], 0);
  draw(ctx, 0, 480, 800, 120, world8, "Ann");
  assert.deepStrictEqual(getPixel(ctx, 717, 549), [77, 102, 96]);
  const world22 = makeFullWorld(22, [], 0);
  draw(ctx, 0, 480, 800, 120, world22, "Ann");
  assert.deepStrictEqual(getPixel(ctx, 717, 549), [173, 64, 48]);
});

test("draw: minimap visible monsters red", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  const grid = borderGrid(48, 32);
  const explored = allTrueMask(48, 32);
  const visibleCells = new Array(48 * 32).fill(false);
  visibleCells[6 * 48 + 6] = true;
  const visible = maskOf(48, 32, visibleCells);
  const monster = { id: 1, kind: "slime", pos: { x: 6, y: 6 }, stats: { hp: 6, maxHp: 6, attack: 2, defense: 1 }, ready: 0, held: 0, facing: "right", last: null, aim: { dx: 1, dy: 0 }, slow: 0, mode: "roam", size: 1, small: false, gesture: null, curse: 0, haste: 0, chant: null, cooldown: 0, fuse: null, cells() { return [{ x: 6, y: 6 }]; } };
  const world = { heroes: [{ name: "Ann", alive: true, actor: { pos: { x: 5, y: 5 }, stats: { hp: 12, maxHp: 24, attack: 1, defense: 1 } } }], monsters: [monster], gold: 0, depth: 1, log: [], grid, explored, visible };
  draw(ctx, 0, 480, 800, 120, world, "Ann");
  assert.deepStrictEqual(getPixel(ctx, 708, 540), [220, 50, 50]);
});
