// atlas: edge test `sheets`

import test from "node:test";
import assert from "node:assert/strict";

import { load, sprite, names } from "../../../edges/edge_to_atlas.mjs";
import * as spriteShape from "../../../shapes/sprite/index.mjs";

const NAMES = [
  "wall", "floor", "stairs", "hero", "skeleton", "slime", "snake",
  "bat", "demon", "potion", "gold", "sword", "armor"
];

// Intrinsic - table:
// `names()` is the table's names in order. Before any `load`, `sprite('hero')` is `null`;
// `sprite('dragon')` throws a `TypeError`.
test("table: before load, sprite('hero') is null; sprite('dragon') throws; names() in order", () => {
  assert.equal(sprite("hero"), null);
  assert.throws(() => sprite("dragon"), TypeError);
  assert.deepEqual(names(), NAMES);
});

// Intrinsic - keyed:
// After `load('/assets/')`, on a canvas filled with pure green (0, 255, 0), drawing
// `sprite('hero')` at (0, 0) at its own size leaves pixel (0, 0) pure green, and at least
// 20 of the 256 pixels not pure green.
test("keyed: after load, hero sprite draws with transparent background and >= 20 non-green pixels", async () => {
  await load("/assets/");
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const imgData = ctx.createImageData(16, 16);
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = 0;
    imgData.data[i + 1] = 255;
    imgData.data[i + 2] = 0;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const sp = sprite("hero");
  assert.ok(sp, "hero sprite should exist after load");
  ctx.drawImage(sp.image, sp.sx, sp.sy, sp.sw, sp.sh, 0, 0, 16, 16);
  const data = ctx.getImageData(0, 0, 16, 16).data;
  assert.equal(data[0], 0);
  assert.equal(data[1], 255);
  assert.equal(data[2], 0);
  assert.equal(data[3], 255);
  let notGreen = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!(data[i] === 0 && data[i + 1] === 255 && data[i + 2] === 0)) notGreen++;
  }
  assert.ok(notGreen >= 20, `expected at least 20 non-green pixels, got ${notGreen}`);
});

// Intrinsic - table:
// After `load('/assets/')` resolves, each name's sprite has the table's `sx`, `sy`, `sw` 16 and `sh` 16.
test("table: after load, each name's sprite has the EED table's sx, sy, sw 16, sh 16", async () => {
  await load("/assets/");
  const table = {
    wall: [48, 16],
    floor: [0, 48],
    stairs: [0, 96],
    hero: [0, 0],
    skeleton: [0, 0],
    slime: [0, 48],
    snake: [0, 64],
    bat: [128, 0],
    demon: [128, 32],
    potion: [64, 0],
    gold: [48, 80],
    sword: [64, 16],
    armor: [64, 48]
  };
  for (const name of NAMES) {
    const sp = sprite(name);
    assert.ok(sp, `sprite('${name}') should exist after load`);
    const [sx, sy] = table[name];
    assert.equal(sp.sx, sx, `sprite('${name}').sx`);
    assert.equal(sp.sy, sy, `sprite('${name}').sy`);
    assert.equal(sp.sw, 16, `sprite('${name}').sw`);
    assert.equal(sp.sh, 16, `sprite('${name}').sh`);
  }
});

// Intrinsic - fails:
// `load('/nowhere/')` rejects with an `Error` whose message contains `sheets/`.
test("fails: load('/nowhere/') rejects with Error containing sheets/", async () => {
  await assert.rejects(load("/nowhere/"), (err) => err instanceof Error && /sheets\//.test(err.message));
});

// Intrinsic - sprite/valid:
// `of({image: {}, sx: 16, sy: 0, sw: 16, sh: 16})` has those values and is frozen.
// `image: null`, `sx: -1`, `sw: 0` and `sy: 2.5` each throw a `TypeError`.
test("sprite/valid: of builds a frozen sprite; bad inputs throw TypeError", () => {
  const img = {};
  const s = spriteShape.of({ image: img, sx: 16, sy: 0, sw: 16, sh: 16 });
  assert.equal(s.image, img);
  assert.equal(s.sx, 16);
  assert.equal(s.sy, 0);
  assert.equal(s.sw, 16);
  assert.equal(s.sh, 16);
  assert.ok(Object.isFrozen(s));
  assert.throws(() => spriteShape.of({ image: null, sx: 16, sy: 0, sw: 16, sh: 16 }), TypeError);
  assert.throws(() => spriteShape.of({ image: {}, sx: -1, sy: 0, sw: 16, sh: 16 }), TypeError);
  assert.throws(() => spriteShape.of({ image: {}, sx: 16, sy: 0, sw: 0, sh: 16 }), TypeError);
  assert.throws(() => spriteShape.of({ image: {}, sx: 16, sy: 2.5, sw: 16, sh: 16 }), TypeError);
});
