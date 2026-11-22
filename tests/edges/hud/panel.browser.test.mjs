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
import * as level from "../../../shapes/level/index.mjs";

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
  assert.deepEqual(lines(w, 'Ann'), ['Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25', 'Party: Ann 18/24, Bob fallen', 'c', 'd']);
  assert.deepEqual(lines(w, 'Bob')[0], 'Bob   HP 0/28 (fallen)   ATK 4   DEF 1   Gold 7   Level 2/25');
  assert.deepEqual(lines(w, 'Eve')[0], 'Watching   Gold 7   Level 2/25');
  const w2 = makeWorld({ log: ['a'] });
  assert.deepEqual(lines(w2, 'Ann'), ['Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25', 'Party: Ann 18/24, Bob fallen', 'a']);
  const w9 = makeWorld({ depth: 9 });
  assert.deepEqual(lines(w9, 'Ann')[0], 'Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 7/25');
  const w13 = makeWorld({ depth: 13 });
  assert.deepEqual(lines(w13, 'Ann')[0], 'Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Shop');
  const w14 = makeWorld({ depth: 14 });
  assert.deepEqual(lines(w14, 'Ann')[0], 'Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Lair');
  const slowActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }), slow: 2 });
  const slowHero = hero.of({ name: 'Ann', actor: slowActor, alive: true });
  const wSlow = world.of({ seed: 1, rng: 1, depth: 2, time: 0, state: 'playing', grid: tileGrid.fromRows(['####', '#..#', '####']), heroes: [slowHero, hero.of({ name: 'Bob', actor: actor.of({ id: 1, kind: 'hero', pos: point.of(2, 1), stats: stats.of({ hp: 0, maxHp: 28, attack: 4, defense: 1 }) }), alive: false })], monsters: [], items: [], visible: mask.empty(4, 3), explored: mask.empty(4, 3), gold: 7, log: ['a', 'b', 'c', 'd'], entry: save.of({ seed: 1, depth: 1, players: [] }) });
  assert.deepEqual(lines(wSlow, 'Ann')[0], 'Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25   Slowed 2');
  const mpActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1, magicPower: 2 }) });
  const mpHero = hero.of({ name: 'Ann', actor: mpActor, alive: true });
  const wMp = world.of({ seed: 1, rng: 1, depth: 2, time: 0, state: 'playing', grid: tileGrid.fromRows(['####', '#..#', '####']), heroes: [mpHero, hero.of({ name: 'Bob', actor: actor.of({ id: 1, kind: 'hero', pos: point.of(2, 1), stats: stats.of({ hp: 0, maxHp: 28, attack: 4, defense: 1 }) }), alive: false })], monsters: [], items: [], visible: mask.empty(4, 3), explored: mask.empty(4, 3), gold: 7, log: ['a', 'b', 'c', 'd'], entry: save.of({ seed: 1, depth: 1, players: [] }) });
  assert.deepEqual(lines(wMp, 'Ann')[0], 'Ann   HP 18/24   ATK 4   DEF 1   MP 2   MR 0   Gold 7   Level 2/25');
  const mrActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1, magicPower: 1, magicResist: 1 }) });
  const mrHero = hero.of({ name: 'Ann', actor: mrActor, alive: true });
  const wMr = world.of({ seed: 1, rng: 1, depth: 2, time: 0, state: 'playing', grid: tileGrid.fromRows(['####', '#..#', '####']), heroes: [mrHero, hero.of({ name: 'Bob', actor: actor.of({ id: 1, kind: 'hero', pos: point.of(2, 1), stats: stats.of({ hp: 0, maxHp: 28, attack: 4, defense: 1 }) }), alive: false })], monsters: [], items: [], visible: mask.empty(4, 3), explored: mask.empty(4, 3), gold: 7, log: ['a', 'b', 'c', 'd'], entry: save.of({ seed: 1, depth: 1, players: [] }) });
  assert.deepEqual(lines(wMr, 'Ann')[0], 'Ann   HP 18/24   ATK 4   DEF 1   MP 1   MR 1   Gold 7   Level 2/25');
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
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 34, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: -1, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: mask.empty(4, 3), explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [actor.of({ id: 1, kind: 'hero', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) })], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  const badHero2 = hero.of({ name: 'Bob', actor: actor.of({ id: 1, kind: 'hero', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) }), alive: true });
  const badHero3 = hero.of({ name: 'Carol', actor: actor.of({ id: 2, kind: 'hero', pos: point.of(3, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) }), alive: true });
  const badHero4 = hero.of({ name: 'Dave', actor: actor.of({ id: 3, kind: 'hero', pos: point.of(1, 3), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) }), alive: true });
  const badHero5 = hero.of({ name: 'Eve', actor: actor.of({ id: 4, kind: 'hero', pos: point.of(2, 3), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) }), alive: true });
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero, badHero2, badHero3, badHero4, badHero5], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  const badAnnActor2 = actor.of({ id: 5, kind: 'hero', pos: point.of(3, 3), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }) });
  const badAnnHero2 = hero.of({ name: 'Ann', actor: badAnnActor2, alive: true });
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero, badAnnHero2], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, log: [], entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: Array(51).fill('x'), entry: badEntry }), TypeError);
  assert.throws(() => world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [] }), TypeError);

  const w29 = world.of({ seed: 1, rng: 1, depth: 29, time: 0, state: 'playing', grid: badGrid, heroes: [badAnnHero], monsters: [badMonster], items: [], visible: badVisible, explored: badExplored, gold: 0, log: [], entry: badEntry });
  assert.equal(w29.depth, 29);

  assert.equal(w.with({ time: 9 }).time, 9);
  assert.equal(w.time, 0);

  const w2 = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [annHero], monsters: [monster], items: [itemGold], visible, explored, gold: 0, log: [], entry });
  assert.deepStrictEqual(w, w2);
  assert.equal(Object.hasOwn(w, 'with'), false);
  assert.equal(Object.hasOwn(w, 'data'), false);
});

test("world/data", () => {
  const grid = tileGrid.fromRows(['#####', '#...#', '#####']);
  const annActor = actor.of({ id: 0, kind: 'hero', pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }), held: 300, facing: 'left', last: { kind: 'attack', dx: -1, dy: 0, at: 50 } });
  const annHero = hero.of({ name: 'Ann', actor: annActor, pending: intent.move(1, 0), alive: true, offer: 12 });
  const monster = actor.of({ id: 1, kind: 'slime', pos: point.of(2, 2), stats: stats.of({ hp: 10, maxHp: 20, attack: 2, defense: 2 }), last: { kind: 'move', dx: 0, dy: 1, at: 20 } });
  const itemGold = item.of({ id: 0, kind: 'gold', pos: point.of(3, 1), amount: 1 });
  const itemSword = item.of({ id: 12, kind: 'sword', pos: point.of(3, 1), price: 30 });
  const visible = mask.of(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const explored = mask.empty(5, 3);
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const w = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: 'playing', grid, heroes: [annHero], monsters: [monster], items: [itemGold, itemSword], visible, explored, gold: 0, log: [], entry });
  const data = JSON.parse(JSON.stringify(w.data()));
  const w2 = world.fromData(data);
  assert.deepStrictEqual(w2, w);
  assert.deepEqual(w.data().grid, ['#####', '#...#', '#####']);
  assert.equal(w.data().visible[1], '01000');
  assert.equal(w.data().items[1].price, 30);
  assert.equal(w.data().heroes[0].offer, 12);
  const badData = JSON.parse(JSON.stringify(w.data()));
  badData.depth = 34;
  assert.throws(() => world.fromData(badData), TypeError);
  assert.throws(() => world.fromData({}), TypeError);
});

test("level/valid", () => {
  assert.equal(level.MAX_DEPTH, 33);
  assert.equal(level.MAX_LEVEL, 25);
  assert.deepEqual(level.THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma', 'interior']);
  assert.deepEqual(level.DUNGEON_THEMES, ['dungeon', 'frozen', 'arid', 'temple', 'magma']);
  assert.equal(Object.isFrozen(level.THEMES), true);
  assert.equal(Object.isFrozen(level.DUNGEON_THEMES), true);
  assert.equal(level.kind(1), 'dungeon');
  assert.equal(level.kind(5), 'dungeon');
  assert.equal(level.kind(8), 'dungeon');
  assert.equal(level.kind(33), 'dungeon');
  assert.equal(level.kind(6), 'interior');
  assert.equal(level.kind(13), 'interior');
  assert.equal(level.kind(20), 'interior');
  assert.equal(level.kind(27), 'interior');
  assert.equal(level.kind(7), 'boss');
  assert.equal(level.kind(14), 'boss');
  assert.equal(level.kind(21), 'boss');
  assert.equal(level.kind(28), 'boss');
  assert.equal(level.theme(1), 'dungeon');
  assert.equal(level.theme(6), 'interior');
  assert.equal(level.theme(7), 'dungeon');
  assert.equal(level.theme(8), 'frozen');
  assert.equal(level.theme(15), 'arid');
  assert.equal(level.theme(26), 'temple');
  assert.equal(level.theme(28), 'temple');
  assert.equal(level.theme(29), 'magma');
  assert.equal(level.theme(33), 'magma');
  assert.deepEqual(level.blend(7), ['dungeon', 'frozen']);
  assert.equal(Object.isFrozen(level.blend(7)), true);
  assert.deepEqual(level.blend(28), ['temple', 'magma']);
  assert.equal(level.blend(6), null);
  assert.equal(level.blend(8), null);
  assert.equal(level.tier(5), 0);
  assert.equal(level.tier(6), 0);
  assert.equal(level.tier(7), 0);
  assert.equal(level.tier(8), 1);
  assert.equal(level.tier(33), 4);
  assert.equal(level.stage(1), 1);
  assert.equal(level.stage(12), 5);
  assert.equal(level.stage(13), 6);
  assert.equal(level.stage(14), 7);
  assert.equal(level.stage(29), 1);
  assert.equal(level.round(6), 1);
  assert.equal(level.round(7), 1);
  assert.equal(level.round(27), 4);
  assert.equal(level.round(8), 0);
  assert.equal(level.number(1), 1);
  assert.equal(level.number(5), 5);
  assert.equal(level.number(8), 6);
  assert.equal(level.number(12), 10);
  assert.equal(level.number(33), 25);
  assert.equal(level.number(6), 0);
  assert.equal(level.number(7), 0);
  assert.equal(level.label(8), 'Level 6');
  assert.equal(level.label(13), 'Shop');
  assert.equal(level.label(14), 'Lair');
  assert.throws(() => level.kind(0), TypeError);
  assert.throws(() => level.theme(34), TypeError);
  assert.throws(() => level.tier(1.5), TypeError);
  assert.throws(() => level.blend(40), TypeError);
  assert.throws(() => level.number('3'), TypeError);
  assert.throws(() => level.label(null), TypeError);
});
