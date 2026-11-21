// The edge test for hud: panel browser test.

import test from "node:test";
import assert from "node:assert/strict";

import { lines, draw } from "../../../edges/edge_to_hud.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as hero from "../../../shapes/hero/index.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as item from "../../../shapes/item/index.mjs";

function makeWorld(changes) {
  const grid = tileGrid.fromRows(['####', '#..#', '####']);
  const annActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const bobActor = actor.of({ id: 1, kind: 'hero', pos: point.of(2, 1), stats: stats.of({ hp: 0, maxHp: 28, attack: 4, defense: 1 }) });
  const annHero = hero.of({ name: 'Ann', actor: annActor, alive: true });
  const bobHero = hero.of({ name: 'Bob', actor: bobActor, alive: false });
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const visible = mask.empty(4, 3);
  const explored = mask.empty(4, 3);
  return world.of({
    seed: 1, rng: 1, depth: 2, time: 0, state: 'playing', grid,
    heroes: [annHero, bobHero], monsters: [], items: [],
    visible, explored, gold: 7, log: ['a', 'b', 'c', 'd'],
    entry,
    ...changes,
  });
}

test("lines", () => {
  const w = makeWorld();
  assert.deepEqual(lines(w, 'Ann'), ['Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/5', 'Party: Ann 18/24, Bob fallen', 'c', 'd']);
  assert.deepEqual(lines(w, 'Bob')[0], 'Bob   HP 0/28 (fallen)   ATK 4   DEF 1   Gold 7   Depth 2/5');
  assert.deepEqual(lines(w, 'Eve')[0], 'Watching   Gold 7   Depth 2/5');
  const w2 = makeWorld({ log: ['a'] });
  assert.deepEqual(lines(w2, 'Ann'), ['Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/5', 'Party: Ann 18/24, Bob fallen', 'a']);
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

  const grid = tileGrid.fromRows(['####', '#..#', '####']);
  const annActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 12, maxHp: 24, attack: 4, defense: 1 }) });
  const annHero = hero.of({ name: 'Ann', actor: annActor, alive: true });
  const bobActor = actor.of({ id: 1, kind: 'hero', pos: point.of(2, 1), stats: stats.of({ hp: 0, maxHp: 28, attack: 4, defense: 1 }) });
  const bobHero = hero.of({ name: 'Bob', actor: bobActor, alive: false });
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const visible = mask.empty(4, 3);
  const explored = mask.empty(4, 3);
  const w = world.of({ seed: 1, rng: 1, depth: 2, time: 0, state: 'playing', grid, heroes: [annHero, bobHero], monsters: [], items: [], visible, explored, gold: 7, log: [], entry });
  draw(ctx, 0, 480, 800, 120, w, 'Ann');

  let img = ctx.getImageData(58, 494, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [200, 40, 40]);
  img = ctx.getImageData(158, 494, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [60, 20, 20]);

  const annActor24 = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const annHero24 = hero.of({ name: 'Ann', actor: annActor24, alive: true });
  const w24 = world.of({ seed: 1, rng: 1, depth: 2, time: 0, state: 'playing', grid, heroes: [annHero24, bobHero], monsters: [], items: [], visible, explored, gold: 7, log: [], entry });
  draw(ctx, 0, 480, 800, 120, w24, 'Ann');
  img = ctx.getImageData(206, 494, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [200, 40, 40]);

  ctx.putImageData(grd, 0, 0);
  draw(ctx, 0, 480, 800, 120, w, 'Eve');
  img = ctx.getImageData(58, 494, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [60, 20, 20]);

  ctx.putImageData(grd, 0, 0);
  draw(ctx, 0, 480, 800, 120, w, 'Ann');
  img = ctx.getImageData(4, 476, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [0, 255, 0]);
  img = ctx.getImageData(796, 596, 1, 1).data;
  assert.deepEqual([img[0], img[1], img[2]], [40, 26, 34]);
});

test("refuses", () => {
  const w = makeWorld();
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  assert.throws(() => draw(ctx, 0, 0, 0, 10, w, 'Ann'), TypeError);
  assert.throws(() => draw(ctx, 0.5, 0, 10, 10, w, 'Ann'), TypeError);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, {}, 'Ann'), TypeError);
  assert.throws(() => draw(ctx, 0, 0, 10, 10, w, 5), TypeError);
});

test("world/valid", () => {
  const grid = tileGrid.fromRows(['#####', '.....', '#####']);
  const annActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const annHero = hero.of({ name: 'Ann', actor: annActor, alive: true });
  const monster = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const itemGold = item.of({ id: 0, kind: 'gold', pos: point.of(3, 1), amount: 1 });
  const visible = mask.empty(5, 3);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const w = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [annHero], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: [], entry });
  assert.equal(w.seed, 1);
  assert.equal(w.rng, 1);
  assert.equal(w.depth, 1);
  assert.equal(w.time, 0);
  assert.equal(w.state, 'playing');
  assert.equal(w.gold, 0);
  assert.equal(Object.isFrozen(w), true);
  assert.equal(Object.isFrozen(w.heroes), true);
  assert.equal(Object.isFrozen(w.monsters), true);
  assert.equal(Object.isFrozen(w.items), true);
  assert.equal(Object.isFrozen(w.log), true);

  const badGrid = tileGrid.fromRows(['#####', '.....', '#####']);
  const badAnnActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const badAnnHero = hero.of({ name: 'Ann', actor: badAnnActor, alive: true });
  const badMonster = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const badVisible = mask.empty(5, 3);
  const badExplored = mask.empty(5, 3);
  const badEntry = save.of({ seed: 1, depth: 1, players: [] });

  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'dead', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 6, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: -1, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: mask.empty(4, 3), explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [actor.of({ id: 1, kind: 'hero', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) })], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero, badAnnHero, badAnnHero, badAnnHero, badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: Array(51).fill('x'), entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [] }), TypeError);

  assert.equal(w.with({ time: 9 }).time, 9);
  assert.equal(w.time, 0);
});

test("world/data", () => {
  const grid = tileGrid.fromRows(['#####', '#...#', '#####']);
  const annActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }), held: 300, facing: 'left', last: { kind: 'attack', dx: -1, dy: 0, at: 50 } });
  const annHero = hero.of({ name: 'Ann', actor: annActor, pending: intent.move(1, 0), alive: true });
  const monster = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }), last: { kind: 'move', dx: 0, dy: 1, at: 20 } });
  const itemGold = item.of({ id: 0, kind: 'gold', pos: point.of(3, 1), amount: 1 });
  const visible = mask.of(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const w = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [annHero], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: [], entry });
  const data = JSON.parse(JSON.stringify(w.data()));
  const w2 = world.fromData(data);
  assert.deepStrictEqual(w2, w);
  assert.deepEqual(w.data().grid, ['#####', '#...#', '#####']);
  assert.equal(w.data().visible[1], '01000');
  const badData = JSON.parse(JSON.stringify(w.data()));
  badData.depth = 9;
  assert.throws(() => world.fromData(badData), TypeError);
  assert.throws(() => world.fromData({}), TypeError);
});
