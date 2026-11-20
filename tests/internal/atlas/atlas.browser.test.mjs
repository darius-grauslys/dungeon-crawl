import test from "node:test";
import assert from "node:assert/strict";
import { load, sprite, names } from "../../../src/atlas/index.mjs";

test("names returns the table's names in order, fresh array each call", () => {
  const n = names();
  assert.deepStrictEqual(n, [
    "wall", "floor", "stairs", "hero", "skeleton", "slime", "snake",
    "bat", "demon", "potion", "gold", "sword", "armor"
  ]);
  assert.notStrictEqual(names(), n);
});

test("before load, sprite('hero') is null and sprite('dragon') throws TypeError", () => {
  assert.strictEqual(sprite("hero"), null);
  assert.throws(() => sprite("dragon"), TypeError);
});

test("load rejects with sheets/ in message when it fails", async () => {
  await assert.rejects(load("/nowhere/"), (e) => e.message.includes("sheets/"));
});

test("keyed: colour key after load", async () => {
  await load("/assets/");
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  const fill = ctx.createImageData(16, 16);
  for (let i = 0; i < fill.data.length; i += 4) {
    fill.data[i] = 0;
    fill.data[i + 1] = 255;
    fill.data[i + 2] = 0;
    fill.data[i + 3] = 255;
  }
  ctx.putImageData(fill, 0, 0);
  const h = sprite("hero");
  ctx.drawImage(h.image, h.sx, h.sy, 16, 16, 0, 0, 16, 16);
  const data = ctx.getImageData(0, 0, 16, 16).data;
  assert.strictEqual(data[0], 0);
  assert.strictEqual(data[1], 255);
  assert.strictEqual(data[2], 0);
  let notGreen = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!(data[i] === 0 && data[i + 1] === 255 && data[i + 2] === 0)) notGreen++;
  }
  assert.ok(notGreen >= 20);
});
