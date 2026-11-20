// The edge test for hud: panel browser test.

import test from "node:test";
import assert from "node:assert/strict";

import { lines, draw } from "../../../edges/edge_to_hud.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as point from "../../../shapes/point/index.mjs";

function makeWorld(changes) {
  const grid = tileGrid.fromRows(['###', '#.#', '###']);
  const hero = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const visible = mask.empty(3, 3);
  const explored = mask.empty(3, 3);
  return world.of({
    seed: 1, rng: 1, depth: 2, turn: 0, state: 'playing', grid, hero,
    monsters: [], items: [], visible, explored, gold: 7, log: ['a', 'b', 'c', 'd'],
    ...changes,
  });
}

test("lines", () => {
  const w = makeWorld();
  assert.deepEqual(lines(w), ['HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/5', 'b', 'c', 'd']);
  const w2 = makeWorld({ log: ['a'] });
  assert.deepEqual(lines(w2), ['HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/5', 'a']);
});

test("bar", async () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const grd = ctx.createImageData(800, 600);
  for (let i = 0; i < grd.data.length; i += 4) {
    grd.data[i] = 0;
    grd.data[i + 1] = 255;
    grd.data[i + 2] = 0;
    grd.data[i + 3] = 255;
  }
  ctx.putImageData(grd, 0, 0);

  const grid = tileGrid.fromRows(['###', '#.#', '###']);
  const hero = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 12, maxHp: 24, attack: 4, defense: 1 }) });
  const visible = mask.empty(3, 3);
  const explored = mask.empty(3, 3);
  const w = world.of({ seed: 1, rng: 1, depth: 2, turn: 0, state: 'playing', grid, hero, monsters: [], items: [], visible, explored, gold: 7, log: [] });
  draw(ctx, 0, 480, 800, 120, w);

  let img = ctx.getImageData(58, 494, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [200, 40, 40]);
  img = ctx.getImageData(158, 494, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [60, 20, 20]);

  const hero24 = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const w24 = world.of({ seed: 1, rng: 1, depth: 2, turn: 0, state: 'playing', grid, hero: hero24, monsters: [], items: [], visible, explored, gold: 7, log: [] });
  draw(ctx, 0, 480, 800, 120, w24);
  img = ctx.getImageData(206, 494, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [200, 40, 40]);

  ctx.putImageData(grd, 0, 0);
  draw(ctx, 0, 480, 800, 120, w);
  img = ctx.getImageData(4, 476, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [0, 255, 0]);
  img = ctx.getImageData(796, 596, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [40, 26, 34]);
});

test("refuses", () => {
  const grid = tileGrid.fromRows(['###', '#.#', '###']);
  const hero = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 12, maxHp: 24, attack: 4, defense: 1 }) });
  const visible = mask.empty(3, 3);
  const explored = mask.empty(3, 3);
  const w = world.of({ seed: 1, rng: 1, depth: 2, turn: 0, state: 'playing', grid, hero, monsters: [], items: [], visible, explored, gold: 7, log: [] });
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  assert.throws(() => draw(ctx, 0, 0, 0, 10, w), TypeError);
  assert.throws(() => draw(ctx, 0.5, 0, 10, 10, w), TypeError);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, {}), TypeError);
});

test("world/valid", () => {
  const grid = tileGrid.fromRows(['#####', '.....', '#####']);
  const hero = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const monster = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid, hero, monsters: [monster], items: [], visible, explored, gold: 0, log: [] });
  assert.equal(w.seed, 1);
  assert.equal(w.rng, 1);
  assert.equal(w.depth, 1);
  assert.equal(w.turn, 0);
  assert.equal(w.state, 'playing');
  assert.equal(w.gold, 0);
  assert.equal(Object.isFrozen(w), true);
  assert.equal(Object.isFrozen(w.monsters), true);
  assert.equal(Object.isFrozen(w.items), true);
  assert.equal(Object.isFrozen(w.log), true);

  const badGrid = tileGrid.fromRows(['#####', '.....', '#####']);
  const badHero = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const badMonster = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const badVisible = mask.empty(5, 3);
  const badExplored = mask.empty(5, 3);

  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'paused', grid: badGrid, hero: badHero, monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [] }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 6, turn: 0, state: 'playing', grid: badGrid, hero: badHero, monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [] }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid: badGrid, hero: badHero, monsters: [badMonster], items: [], visible: mask.empty(4, 3), explored: badExplored, gold: 0, log: [] }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid: badGrid, hero: badHero, monsters: [actor.of({ id: 1, kind: 'hero', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) })], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [] }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid: badGrid, hero: badHero, monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: Array(51).fill('x') }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid: badGrid, hero: badHero, monsters: [badMonster], items: [], visible: badVisible, explored: badExplored }), TypeError);

  assert.equal(w.with({ turn: 9 }).turn, 9);
  assert.equal(w.turn, 0);
});
