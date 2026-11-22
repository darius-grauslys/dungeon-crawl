import test from "node:test";
import assert from "node:assert/strict";
import { load, sprite, names, tile } from "../../../src/atlas/index.mjs";

test("names returns the table's names in order, fresh array each call", () => {
  const n = names();
  assert.deepStrictEqual(n, [
    "wall", "floor", "stairs", "hero", "skeleton", "slime", "snake",
    "bat", "demon", "potion", "gold", "sword", "armor", "archer",
    "blue-slime", "blue-snake", "golem", "beetle", "mummy", "cultist",
    "spider", "ghost", "reaper", "worm", "fire-slime", "imp", "lever",
    "lever-pulled",
    "wall-0", "wall-1", "wall-2", "wall-3", "wall-4", "wall-5", "wall-6",
    "wall-7", "wall-8", "wall-9", "wall-10", "wall-11", "wall-12",
    "wall-13", "wall-14", "wall-15"
  ]);
  assert.notStrictEqual(names(), n);
  assert.strictEqual(n.length, 44);
});

test("before load, sprite('hero') is null and sprite('dragon') throws TypeError", () => {
  assert.strictEqual(sprite("hero"), null);
  assert.throws(() => sprite("dragon"), TypeError);
});

test("wall-0 to wall-15 are the last sixteen names; lever-pulled just before wall-0; wall-16 throws TypeError", () => {
  const n = names();
  const last16 = n.slice(28);
  assert.deepStrictEqual(last16, [
    "wall-0", "wall-1", "wall-2", "wall-3", "wall-4", "wall-5", "wall-6",
    "wall-7", "wall-8", "wall-9", "wall-10", "wall-11", "wall-12",
    "wall-13", "wall-14", "wall-15"
  ]);
  assert.strictEqual(n[27], "lever-pulled");
  assert.throws(() => sprite("wall-16"), TypeError);
});

test("before load, tile('frozen', 'floor') is null; bad theme/name throw TypeError", () => {
  assert.strictEqual(tile("frozen", "floor"), null);
  assert.throws(() => tile("lava", "floor"), TypeError);
  assert.throws(() => tile("frozen", "wall-16"), TypeError);
  assert.throws(() => tile("frozen", "hero"), TypeError);
});

test("after load, wall-6 and wall-9 have correct rects", async () => {
  await load("/assets/");
  const w6 = sprite("wall-6");
  assert.strictEqual(w6.sx, 32);
  assert.strictEqual(w6.sy, 0);
  assert.strictEqual(w6.sw, 16);
  assert.strictEqual(w6.sh, 16);
  const w9 = sprite("wall-9");
  assert.strictEqual(w9.sx, 48);
  assert.strictEqual(w9.sy, 16);
});

test("after load, golem, slime rects and blue-snake image distinct from snake", async () => {
  await load("/assets/");
  const golem = sprite("golem");
  assert.strictEqual(golem.sx, 64);
  assert.strictEqual(golem.sy, 112);
  const slime = sprite("slime");
  assert.strictEqual(slime.sx, 64);
  assert.strictEqual(slime.sy, 48);
  const blueSnake = sprite("blue-snake");
  const snake = sprite("snake");
  assert.notStrictEqual(blueSnake.image, snake.image);
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

test("after load, dungeon tiles match table sprites", async () => {
  await load("/assets/");
  for (const n of ["floor", "stairs", "wall-0", "wall-15"]) {
    const t = tile("dungeon", n);
    const s = sprite(n);
    assert.strictEqual(t.image, s.image);
    assert.strictEqual(t.sx, s.sx);
    assert.strictEqual(t.sy, s.sy);
  }
});

test("after load, frozen wall-6 and interior floor/stairs rects", async () => {
  await load("/assets/");
  const fw6 = tile("frozen", "wall-6");
  assert.strictEqual(fw6.sx, 32);
  assert.strictEqual(fw6.sy, 0);
  assert.notStrictEqual(fw6.image, sprite("wall-6").image);
  const ifloor = tile("interior", "floor");
  assert.strictEqual(ifloor.sx, 224);
  assert.strictEqual(ifloor.sy, 112);
  const istairs = tile("interior", "stairs");
  assert.strictEqual(istairs.sx, 32);
  assert.strictEqual(istairs.sy, 96);
  assert.strictEqual(istairs.image, sprite("stairs").image);
});

test("after load, magma stairs rect and all themes 16x16", async () => {
  await load("/assets/");
  const mstairs = tile("magma", "stairs");
  assert.strictEqual(mstairs.sx, 0);
  assert.strictEqual(mstairs.sy, 112);
  const themes = ["dungeon", "frozen", "arid", "temple", "magma", "interior"];
  for (const th of themes) {
    const f = tile(th, "floor");
    const w = tile(th, "wall-10");
    assert.strictEqual(f.sw, 16);
    assert.strictEqual(f.sh, 16);
    assert.strictEqual(w.sw, 16);
    assert.strictEqual(w.sh, 16);
  }
});
