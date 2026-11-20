import test from "node:test";
import assert from "node:assert/strict";
import { draw } from "../../../src/hud/index.mjs";

function getPixel(ctx, x, y) {
  const data = ctx.getImageData(x, y, 1, 1).data;
  return [data[0], data[1], data[2]];
}

function makeWorld(hp, maxHp) {
  return { hero: { stats: { hp, maxHp, attack: 1, defense: 1 } }, gold: 0, depth: 1, log: [] };
}

function greenCanvas(ctx) {
  ctx.fillStyle = "rgb(0, 255, 0)";
  ctx.fillRect(0, 0, 800, 600);
}

test("draw: refuses bad coordinates", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  const world = makeWorld(12, 24);
  assert.throws(() => draw(ctx, 0, 0, 0, 10, world), TypeError);
  assert.throws(() => draw(ctx, 0.5, 0, 10, 10, world), TypeError);
});

test("draw: refuses a world that isn't one", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, {}), TypeError);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, { gold: 0, depth: 1, log: [] }), TypeError);
});

test("draw: bar rendering at 12 of 24", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  draw(ctx, 0, 480, 800, 120, makeWorld(12, 24));
  assert.deepStrictEqual(getPixel(ctx, 58, 494), [200, 40, 40]);
  assert.deepStrictEqual(getPixel(ctx, 158, 494), [60, 20, 20]);
  assert.deepStrictEqual(getPixel(ctx, 4, 476), [0, 255, 0]);
  assert.deepStrictEqual(getPixel(ctx, 796, 596), [40, 26, 34]);
});

test("draw: bar rendering at 24 of 24", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  greenCanvas(ctx);
  draw(ctx, 0, 480, 800, 120, makeWorld(24, 24));
  assert.deepStrictEqual(getPixel(ctx, 206, 494), [200, 40, 40]);
});
