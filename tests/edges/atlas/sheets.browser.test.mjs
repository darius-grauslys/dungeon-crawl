// atlas: edge test `sheets`

import test from "node:test";
import assert from "node:assert/strict";

import { load, sprite, tile, names } from "../../../edges/edge_to_atlas.mjs";
import * as spriteShape from "../../../shapes/sprite/index.mjs";

const NAMES = [
  "wall", "floor", "stairs", "hero", "skeleton", "slime", "snake",
  "bat", "demon", "potion", "gold", "sword", "armor",
  "archer", "blue-slime", "blue-snake", "golem", "beetle", "mummy",
  "cultist", "spider", "ghost", "reaper", "worm", "fire-slime", "imp",
  "lever", "lever-pulled",
  "wall-0", "wall-1", "wall-2", "wall-3", "wall-4", "wall-5",
  "wall-6", "wall-7", "wall-8", "wall-9", "wall-10", "wall-11",
  "wall-12", "wall-13", "wall-14", "wall-15"
];

// Intrinsic - themes:
// Before any `load`, `tile('frozen', 'floor')` is `null`; `tile('lava', 'floor')`, `tile('frozen', 'wall-16')` and `tile('frozen', 'hero')` throw a `TypeError`.
test("themes: before load, tile('frozen','floor') is null and sprite('hero') is null; throws for invalid theme/name", () => {
  assert.equal(sprite("hero"), null);
  assert.equal(tile("frozen", "floor"), null);
  assert.throws(() => tile("lava", "floor"), TypeError);
  assert.throws(() => tile("frozen", "wall-16"), TypeError);
  assert.throws(() => tile("frozen", "hero"), TypeError);
});

// Intrinsic - table:
// `names()` is the table's names in order. Before any `load`, `sprite('hero')` is `null`;
// `sprite('dragon')` throws a `TypeError`. `names()` has 44 names, `wall-0` to `wall-15` the last sixteen in order, `lever-pulled` just before `wall-0`;
// `sprite('wall-16')` throws a `TypeError`.
test("table: before load, sprite('hero') is null; sprite('dragon') and sprite('wall-16') throw; names() has 44 names with lever-pulled before wall-0..wall-15 last", () => {
  assert.equal(sprite("hero"), null);
  assert.throws(() => sprite("dragon"), TypeError);
  assert.throws(() => sprite("wall-16"), TypeError);
  const n = names();
  assert.equal(n.length, 44);
  assert.deepEqual(n.slice(-16), [
    "wall-0", "wall-1", "wall-2", "wall-3", "wall-4", "wall-5", "wall-6", "wall-7",
    "wall-8", "wall-9", "wall-10", "wall-11", "wall-12", "wall-13", "wall-14", "wall-15"
  ]);
  assert.equal(n[n.length - 17], "lever-pulled");
  assert.deepEqual(n, NAMES);
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
    slime: [64, 48],
    snake: [0, 64],
    bat: [128, 0],
    demon: [128, 32],
    potion: [64, 0],
    gold: [48, 80],
    sword: [64, 16],
    armor: [64, 48],
    archer: [64, 0],
    "blue-slime": [0, 48],
    "blue-snake": [0, 16],
    golem: [64, 112],
    beetle: [0, 0],
    mummy: [0, 48],
    cultist: [0, 32],
    spider: [128, 16],
    ghost: [64, 32],
    reaper: [128, 32],
    worm: [0, 48],
    "fire-slime": [64, 48],
    imp: [64, 32],
    lever: [16, 80],
    "lever-pulled": [32, 80],
    "wall-0": [48, 0],
    "wall-1": [0, 32],
    "wall-2": [48, 32],
    "wall-3": [32, 16],
    "wall-4": [16, 32],
    "wall-5": [64, 16],
    "wall-6": [32, 0],
    "wall-7": [0, 16],
    "wall-8": [64, 32],
    "wall-9": [48, 16],
    "wall-10": [48, 0],
    "wall-11": [16, 16],
    "wall-12": [64, 0],
    "wall-13": [16, 0],
    "wall-14": [0, 0],
    "wall-15": [80, 0]
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

// Intrinsic - themes:
// After `load('/assets/')` resolves: `tile('dungeon', n)` has the same `image`, `sx` and `sy` as `sprite(n)` for `n` `floor`, `stairs`, `wall-0` and `wall-15`; `tile('frozen', 'wall-6')` has `sx` 32 and `sy` 0 and an `image` other than `sprite('wall-6')`'s; `tile('interior', 'floor')` has `sx` 224 and `sy` 112; `tile('magma', 'stairs')` `sx` 0 and `sy` 112; `tile('interior', 'stairs')` has `sx` 32, `sy` 96 and the same `image` as `sprite('stairs')`; `tile('arid', 'wall-15')`, drawn at its own size on a canvas filled with pure green, leaves at least 100 of the 256 pixels not pure green; for each of the six themes, `tile(theme, 'floor')` and `tile(theme, 'wall-10')` are each 16 by 16.
test("themes: after load, theme tiles have correct values", async () => {
  await load("/assets/");
  const themes = ["dungeon", "frozen", "arid", "temple", "magma", "interior"];

  // tile('dungeon', n) has same image, sx, sy as sprite(n) for n in floor, stairs, wall-0, wall-15
  for (const n of ["floor", "stairs", "wall-0", "wall-15"]) {
    const t = tile("dungeon", n);
    const s = sprite(n);
    assert.ok(t, `tile('dungeon', '${n}') should exist`);
    assert.equal(t.image, s.image, `tile('dungeon', '${n}').image === sprite('${n}').image`);
    assert.equal(t.sx, s.sx, `tile('dungeon', '${n}').sx === sprite('${n}').sx`);
    assert.equal(t.sy, s.sy, `tile('dungeon', '${n}').sy === sprite('${n}').sy`);
  }

  // tile('frozen', 'wall-6') has sx 32 and sy 0 and an image other than sprite('wall-6')'s
  const frozenWall6 = tile("frozen", "wall-6");
  assert.ok(frozenWall6, "tile('frozen', 'wall-6') should exist");
  assert.equal(frozenWall6.sx, 32);
  assert.equal(frozenWall6.sy, 0);
  assert.notEqual(frozenWall6.image, sprite("wall-6").image);

  // tile('interior', 'floor') has sx 224 and sy 112
  const interiorFloor = tile("interior", "floor");
  assert.ok(interiorFloor, "tile('interior', 'floor') should exist");
  assert.equal(interiorFloor.sx, 224);
  assert.equal(interiorFloor.sy, 112);

  // tile('magma', 'stairs') sx 0 and sy 112
  const magmastairs = tile("magma", "stairs");
  assert.ok(magmastairs, "tile('magma', 'stairs') should exist");
  assert.equal(magmastairs.sx, 0);
  assert.equal(magmastairs.sy, 112);

  // tile('interior', 'stairs') has sx 32, sy 96 and the same image as sprite('stairs')
  const interiorstairs = tile("interior", "stairs");
  assert.ok(interiorstairs, "tile('interior', 'stairs') should exist");
  assert.equal(interiorstairs.sx, 32);
  assert.equal(interiorstairs.sy, 96);
  assert.equal(interiorstairs.image, sprite("stairs").image);

  // tile('arid', 'wall-15'), drawn at its own size on a canvas filled with pure green, leaves at least 100 of the 256 pixels not pure green
  const aridWall15 = tile("arid", "wall-15");
  assert.ok(aridWall15, "tile('arid', 'wall-15') should exist");
  {
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
    ctx.drawImage(aridWall15.image, aridWall15.sx, aridWall15.sy, aridWall15.sw, aridWall15.sh, 0, 0, 16, 16);
    const data = ctx.getImageData(0, 0, 16, 16).data;
    let notGreen = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (!(data[i] === 0 && data[i + 1] === 255 && data[i + 2] === 0)) notGreen++;
    }
    assert.ok(notGreen >= 100, `expected at least 100 non-green pixels for arid wall-15, got ${notGreen}`);
  }

  // for each of the six themes, tile(theme, 'floor') and tile(theme, 'wall-10') are each 16 by 16
  for (const theme of themes) {
    const f = tile(theme, "floor");
    assert.ok(f, `tile('${theme}', 'floor') should exist`);
    assert.equal(f.sw, 16, `tile('${theme}', 'floor').sw`);
    assert.equal(f.sh, 16, `tile('${theme}', 'floor').sh`);
    const w = tile(theme, "wall-10");
    assert.ok(w, `tile('${theme}', 'wall-10') should exist`);
    assert.equal(w.sw, 16, `tile('${theme}', 'wall-10').sw`);
    assert.equal(w.sh, 16, `tile('${theme}', 'wall-10').sh`);
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
