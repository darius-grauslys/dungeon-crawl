// atlas: edge test `sheets`

import test from "node:test";
import assert from "node:assert/strict";

import { load, sprite, tile, pose, frames, floors, names } from "../../../edges/edge_to_atlas.mjs";
import * as spriteShape from "../../../shapes/sprite/index.mjs";

const NAMES = [
  "wall", "floor", "stairs", "hero", "skeleton", "slime", "snake",
  "bat", "demon", "potion", "gold", "sword", "armor",
  "archer", "blue-slime", "blue-snake", "golem", "beetle", "mummy",
  "cultist", "spider", "ghost", "reaper", "worm", "fire-slime", "imp",
  "lever", "lever-pulled", "ring", "necklace",
  "mage", "swordsman", "blue-spider", "serpent",
  "snowman", "snow-skeleton", "wolf-man", "enraged-wolf-man",
  "scarecrow", "swarm", "pumpkin", "beholder",
  "sparkle-0", "sparkle-1", "sparkle-2",
  "bread", "meat", "cheese",
  "sword-2", "sword-3", "sword-4",
  "armor-2", "armor-3", "armor-4",
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
// `sprite('dragon')` throws a `TypeError`. `names()` has 70 names, `wall-0` to `wall-15` the last sixteen in order, `armor-4` just before `wall-0`, the eleven from `snowman` to `sparkle-2` right after `serpent` and before `bread`, `mage` just after `necklace`, `ring` before `necklace`, `lever-pulled` before `ring`;
// `sprite('ring')` has `sx` 0 and `sy` 64, `sprite('necklace')` `sx` 128 and `sy` 64;
// `sprite('wall-16')` throws a `TypeError`.
test("table: before load, sprite('hero') is null; sprite('dragon') and sprite('wall-16') throw; names() has 70 names with armor-4 before wall-0, the 11 from snowman to sparkle-2 after serpent and before bread, mage after necklace, ring before necklace, lever-pulled before ring, wall-0..wall-15 last", () => {
  assert.equal(sprite("hero"), null);
  assert.throws(() => sprite("dragon"), TypeError);
  assert.throws(() => sprite("wall-16"), TypeError);
  const n = names();
  assert.equal(n.length, 70);
  assert.deepEqual(n.slice(-16), [
    "wall-0", "wall-1", "wall-2", "wall-3", "wall-4", "wall-5", "wall-6", "wall-7",
    "wall-8", "wall-9", "wall-10", "wall-11", "wall-12", "wall-13", "wall-14", "wall-15"
  ]);
  assert.equal(n[n.length - 17], "armor-4");
  const serpentIdx = n.indexOf("serpent");
  assert.equal(n[serpentIdx + 1], "snowman");
  assert.equal(n[serpentIdx + 11], "sparkle-2");
  assert.equal(n[serpentIdx + 12], "bread");
  const necklaceIdx = n.indexOf("necklace");
  assert.equal(n[necklaceIdx - 1], "ring");
  assert.equal(n[necklaceIdx + 1], "mage");
  const ringIdx = n.indexOf("ring");
  assert.equal(n[ringIdx - 1], "lever-pulled");
  assert.deepEqual(n, NAMES);
});

// Intrinsic - poses:
// Before any `load`, `pose('hero', 'idle', 0)` is `null`; `pose('hero', 'idle', 3)`, `pose('hero', 'walk', 0)`, `pose('bat', 'sleep', 0)` and `pose('hero', 'idle', 0, {colour: 4, group: 0})` throw a `TypeError`.
test("poses: before load, pose('hero','idle',0) is null; pose('hero','idle',3), pose('hero','walk',0), pose('bat','sleep',0), pose('hero','idle',0,{colour:4,group:0}) throw", () => {
  assert.equal(pose("hero", "idle", 0), null);
  assert.throws(() => pose("hero", "idle", 3), TypeError);
  assert.throws(() => pose("hero", "walk", 0), TypeError);
  assert.throws(() => pose("bat", "sleep", 0), TypeError);
  assert.throws(() => pose("hero", "idle", 0, { colour: 4, group: 0 }), TypeError);
});

// Intrinsic - floors:
// Before any `load`, `floors('dungeon')` is `null`; `floors('lava')` throws a `TypeError`.
test("floors: before load, floors('dungeon') is null and floors('lava') throws", () => {
  assert.equal(floors("dungeon"), null);
  assert.throws(() => floors("lava"), TypeError);
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
    ring: [0, 64],
    necklace: [128, 64],
    mage: [0, 16],
    swordsman: [64, 16],
    "blue-spider": [64, 96],
    serpent: [0, 16],
    "snowman": [0, 0],
    "snow-skeleton": [0, 48],
    "wolf-man": [64, 16],
    "enraged-wolf-man": [0, 32],
    "scarecrow": [64, 16],
    "swarm": [128, 0],
    "pumpkin": [0, 32],
    "beholder": [0, 32],
    "sparkle-0": [0, 208],
    "sparkle-1": [16, 208],
    "sparkle-2": [32, 208],
    bread: [0, 144],
    meat: [16, 144],
    cheese: [32, 144],
    "sword-2": [80, 16],
    "sword-3": [0, 16],
    "sword-4": [16, 16],
    "armor-2": [0, 48],
    "armor-3": [16, 48],
    "armor-4": [32, 48],
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

// Intrinsic - poses:
// After `load('/assets/')` resolves: `frames('hero', 'idle')` is 3, `frames('hero', 'sleep')` 4, `frames('hero', 'debuff')` 4, `frames('hero', 'power_up')` 6, `frames('hero', 'stun')` 5, `frames('golem', 'idle')` 3; `frames('golem', 'stun')`, `frames('dragon', 'idle')` and `frames('wall-0', 'idle')` throw a `TypeError`. `pose('hero', 'idle', 0)` has the same `image`, `sx` and `sy` as `sprite('hero')`; `pose('hero', 'idle', 2)` `sx` 32, `sy` 0; `pose('hero', 'idle', 1, {colour: 3, group: 0})` `sx` 208, `sy` 0; `pose('hero', 'sleep', 2)` `sx` 0, `sy` 48; `pose('hero', 'debuff', 1, {colour: 1, group: 0})` `sx` 80, `sy` 80; `pose('hero', 'power_up', 3, {colour: 1, group: 0})` `sx` 64, `sy` 144; `pose('hero', 'power_up', 5)` `sx` 32, `sy` 144; `pose('hero', 'stun', 4, {colour: 2, group: 0})` `sx` 160, `sy` 192; `pose('hero', 'idle', 0, {colour: 0, group: 2})` `sx` 0, `sy` 480; `pose('golem', 'idle', 2)` `sx` 96, `sy` 112 and the same `image` as `sprite('golem')`; `pose('blue-snake', 'idle', 1)` `sx` 16, `sy` 16; every pose is 16 by 16.
test("poses: after load, frames counts and pose positions match EED", async () => {
  await load("/assets/");

  // frames counts
  assert.equal(frames("hero", "idle"), 3);
  assert.equal(frames("hero", "sleep"), 4);
  assert.equal(frames("hero", "debuff"), 4);
  assert.equal(frames("hero", "power_up"), 6);
  assert.equal(frames("hero", "stun"), 5);
  assert.equal(frames("golem", "idle"), 3);
  assert.throws(() => frames("golem", "stun"), TypeError);
  assert.throws(() => frames("dragon", "idle"), TypeError);
  assert.throws(() => frames("wall-0", "idle"), TypeError);

  // pose positions
  const heroPose0 = pose("hero", "idle", 0);
  const heroSprite = sprite("hero");
  assert.equal(heroPose0.image, heroSprite.image);
  assert.equal(heroPose0.sx, heroSprite.sx);
  assert.equal(heroPose0.sy, heroSprite.sy);

  const idle2 = pose("hero", "idle", 2);
  assert.equal(idle2.sx, 32);
  assert.equal(idle2.sy, 0);

  const idle1c3 = pose("hero", "idle", 1, { colour: 3, group: 0 });
  assert.equal(idle1c3.sx, 208);
  assert.equal(idle1c3.sy, 0);

  const sleep2 = pose("hero", "sleep", 2);
  assert.equal(sleep2.sx, 0);
  assert.equal(sleep2.sy, 48);

  const buff1 = pose("hero", "debuff", 1, { colour: 1, group: 0 });
  assert.equal(buff1.sx, 80);
  assert.equal(buff1.sy, 80);

  const pu3 = pose("hero", "power_up", 3, { colour: 1, group: 0 });
  assert.equal(pu3.sx, 64);
  assert.equal(pu3.sy, 144);

  const pu5 = pose("hero", "power_up", 5);
  assert.equal(pu5.sx, 32);
  assert.equal(pu5.sy, 144);

  const stun4 = pose("hero", "stun", 4, { colour: 2, group: 0 });
  assert.equal(stun4.sx, 160);
  assert.equal(stun4.sy, 192);

  const idle0g2 = pose("hero", "idle", 0, { colour: 0, group: 2 });
  assert.equal(idle0g2.sx, 0);
  assert.equal(idle0g2.sy, 480);

  const golemPose2 = pose("golem", "idle", 2);
  assert.equal(golemPose2.sx, 96);
  assert.equal(golemPose2.sy, 112);
  assert.equal(golemPose2.image, sprite("golem").image);

  const blueSnakePose1 = pose("blue-snake", "idle", 1);
  assert.equal(blueSnakePose1.sx, 16);
  assert.equal(blueSnakePose1.sy, 16);

  // every pose is 16 by 16
  for (const p of [heroPose0, idle2, idle1c3, sleep2, buff1, pu3, pu5, stun4, idle0g2, golemPose2, blueSnakePose1]) {
    assert.equal(p.sw, 16);
    assert.equal(p.sh, 16);
  }
});

// Intrinsic - floors:
// After `load('/assets/')` resolves: `floors('dungeon')` has 23 sprites, the first with `sx` 0 and `sy` 304, the last `sy` 256, each with the same `image` as `tile('dungeon', 'floor')`; `floors('temple')` has 12, the first `sy` 160; `floors('magma')` 19, the last `sy` 208; `floors('interior')` one, with the `sx`, `sy` and `image` of `tile('interior', 'floor')`; each is 16 by 16. `sprite('snowman')` has `sx` 0 and `sy` 0 and an `image` other than `sprite('serpent')`'s; `sprite('wolf-man')` `sx` 64, `sy` 16 and the same `image` as `sprite('snowman')`; `sprite('pumpkin')` `sx` 0, `sy` 32 and the same `image` as `sprite('spider')`; `sprite('sparkle-1')` `sx` 16 and `sy` 208; `pose('swarm', 'idle', 2)` has `sx` 160 and `sy` 0.
test("floors: after load, dungeon has 23 with first sy 304 last sy 256 all same image as tile('dungeon','floor'), temple has 12 first sy 160, magma 19 last sy 208, interior 1 matching tile('interior','floor'), each 16x16; snowman/wolf-man/pumpkin/sparkle-1/pose(swarm) checks", async () => {
  await load("/assets/");

  const dungeonFloors = floors("dungeon");
  assert.ok(dungeonFloors, "floors('dungeon') should exist");
  assert.equal(dungeonFloors.length, 23);
  assert.equal(dungeonFloors[0].sx, 0);
  assert.equal(dungeonFloors[0].sy, 304);
  assert.equal(dungeonFloors[22].sy, 256);
  const dungeonFloorTile = tile("dungeon", "floor");
  for (const f of dungeonFloors) {
    assert.equal(f.image, dungeonFloorTile.image, `dungeon floor ${f.sy} image`);
    assert.equal(f.sw, 16);
    assert.equal(f.sh, 16);
  }

  const templeFloors = floors("temple");
  assert.ok(templeFloors, "floors('temple') should exist");
  assert.equal(templeFloors.length, 12);
  assert.equal(templeFloors[0].sy, 160);
  for (const f of templeFloors) {
    assert.equal(f.sw, 16);
    assert.equal(f.sh, 16);
  }

  const magmaFloors = floors("magma");
  assert.ok(magmaFloors, "floors('magma') should exist");
  assert.equal(magmaFloors.length, 19);
  assert.equal(magmaFloors[18].sy, 208);
  for (const f of magmaFloors) {
    assert.equal(f.sw, 16);
    assert.equal(f.sh, 16);
  }

  const interiorFloors = floors("interior");
  assert.ok(interiorFloors, "floors('interior') should exist");
  assert.equal(interiorFloors.length, 1);
  const interiorFloorTile = tile("interior", "floor");
  assert.equal(interiorFloors[0].sx, interiorFloorTile.sx);
  assert.equal(interiorFloors[0].sy, interiorFloorTile.sy);
  assert.equal(interiorFloors[0].image, interiorFloorTile.image);
  assert.equal(interiorFloors[0].sw, 16);
  assert.equal(interiorFloors[0].sh, 16);

  // additional checks from floors intrinsic
  const snowman = sprite("snowman");
  assert.equal(snowman.sx, 0);
  assert.equal(snowman.sy, 0);
  assert.notEqual(snowman.image, sprite("serpent").image);

  const wolfMan = sprite("wolf-man");
  assert.equal(wolfMan.sx, 64);
  assert.equal(wolfMan.sy, 16);
  assert.equal(wolfMan.image, snowman.image);

  const pumpkin = sprite("pumpkin");
  assert.equal(pumpkin.sx, 0);
  assert.equal(pumpkin.sy, 32);
  assert.equal(pumpkin.image, sprite("spider").image);

  const sparkle1 = sprite("sparkle-1");
  assert.equal(sparkle1.sx, 16);
  assert.equal(sparkle1.sy, 208);

  const warmPose2 = pose("swarm", "idle", 2);
  assert.equal(warmPose2.sx, 160);
  assert.equal(warmPose2.sy, 0);
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
