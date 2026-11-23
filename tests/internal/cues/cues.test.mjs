// tests/internal/cues/cues.test.mjs

import test from "node:test";
import assert from "node:assert/strict";

import * as cueShape from '../../../shapes/cue/index.mjs';
import * as worldShape from '../../../shapes/world/index.mjs';
import * as tileGridShape from '../../../shapes/tile-grid/index.mjs';
import * as maskShape from '../../../shapes/mask/index.mjs';
import * as pointShape from '../../../shapes/point/index.mjs';
import * as statsShape from '../../../shapes/stats/index.mjs';
import * as actorShape from '../../../shapes/actor/index.mjs';
import * as heroShape from '../../../shapes/hero/index.mjs';
import * as saveShape from '../../../shapes/save/index.mjs';
import * as bestiaryShape from '../../../shapes/bestiary/index.mjs';
import { cues } from '../../../src/cues/index.mjs';

function makeGrid(rows) {
  return tileGridShape.fromRows(rows);
}

function allVisible(width, height) {
  const cells = [];
  for (let i = 0; i < width * height; i++) cells.push(true);
  return maskShape.of(width, height, cells);
}

function makeSave(depth) {
  return saveShape.of({ seed: 1, depth, players: [] });
}

function makeHero(name, x, y, hp, alive = true, last = null, gesture = null) {
  const maxHp = hp > 0 ? hp : 1;
  const stats = statsShape.of({ hp, maxHp, attack: 3, defense: 1, range: 1 });
  const actor = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(x, y), stats, ready: 0, held: 0, last, gesture });
  return heroShape.of({ name, actor, alive });
}

function makeMonster(id, kind, x, y, hp, last = null, gesture = null, fuse = null) {
  const entry = bestiaryShape.entry(kind);
  const stats = statsShape.of({ hp, maxHp: entry.hp, attack: entry.attack, defense: entry.defense, range: entry.range });
  return actorShape.of({ id, kind, pos: pointShape.of(x, y), stats, ready: 0, held: 0, last, gesture, fuse });
}

function makeWorld({ depth = 1, gold = 0, heroes = [], monsters = [], items = [], grid, visible } = {}) {
  const g = grid || makeGrid(['#######', '#.....#', '#######']);
  const w = visible || allVisible(7, 3);
  return worldShape.of({
    seed: 1, rng: 2, depth, time: 0, state: 'playing', grid: g,
    heroes, monsters, items, visible: w, explored: w, gold, log: [], entry: makeSave(depth)
  });
}

test('cues: steps', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsA = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroA0 = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsA }) });
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroA0], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  const heroA1 = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(2, 1), stats: statsA, last: { kind: 'move', dx: 1, dy: 0, at: 50 } }) });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroA1], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  assert.deepStrictEqual(cues(prev, next, 'Ann'), [cueShape.of({ name: 'step', gain: 1 })]);
  assert.deepStrictEqual(cues(next, next, 'Ann'), []);
  assert.deepStrictEqual(cues(null, next, 'Ann'), []);
});

test('cues: attacks', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const statsBat = statsShape.of({ hp: 3, maxHp: 3, attack: 2, defense: 0, range: 1 });
  const bat = makeMonster(10, 'bat', 4, 1, 3);
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn], monsters: [bat], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  const heroAnnNext = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn, last: { kind: 'attack', dx: 1, dy: 0, at: 50, reach: 3 } }) });
  const statsBatNext = statsShape.of({ hp: 2, maxHp: 3, attack: 2, defense: 0, range: 1 });
  const batNext = makeMonster(10, 'bat', 4, 1, 2);
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [batNext], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  assert.deepStrictEqual(cues(prev, next, 'Ann'), [cueShape.of({ name: 'shot', gain: 1 }), cueShape.of({ name: 'hit', gain: 1 - 3 / 12 })]);

  const heroAnnSwing = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn, last: { kind: 'attack', dx: 1, dy: 0, at: 50, reach: 1 } }) });
  const nextSwing = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnSwing], monsters: [batNext], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prev, nextSwing, 'Ann'), [cueShape.of({ name: 'swing', gain: 1 }), cueShape.of({ name: 'hit', gain: 1 - 3 / 12 })]);

  const nextGone = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prev, nextGone, 'Ann'), [cueShape.of({ name: 'shot', gain: 1 }), cueShape.of({ name: 'death', gain: 1 - 3 / 12 })]);
});

test('cues: distance', () => {
  const grid = makeGrid(['##################', '#................#', '##################']);
  const vis = allVisible(18, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  const skeleton = makeMonster(10, 'skeleton', 16, 1, 9);
  const heroAnnNext = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const skeletonNext = makeMonster(10, 'skeleton', 16, 1, 9, { kind: 'move', dx: 1, dy: 0, at: 50 });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [skeletonNext], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  assert.deepStrictEqual(cues(prev, next, 'Ann'), [cueShape.of({ name: 'step', gain: 0.25 })]);
  assert.deepStrictEqual(cues(prev, next, 'Eve'), [cueShape.of({ name: 'step', gain: 1 })]);

  const visHalf = maskShape.of(18, 3, Array(54).fill(false));
  const nextHidden = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [skeletonNext], items: [], visible: visHalf, explored: visHalf, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prev, nextHidden, 'Ann'), []);
});

test('cues: gestures', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });

  const heroA0 = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroA0], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  const heroAPower = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn, last: { kind: 'move', dx: 1, dy: 0, at: 50 }, gesture: { kind: 'power', at: 50 } }) });
  const nextPower = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAPower], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prev, nextPower, 'Ann'), [cueShape.of({ name: 'step', gain: 1 }), cueShape.of({ name: 'powerup', gain: 1 })]);

  const heroAUse = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn, gesture: { kind: 'use', at: 50 } }) });
  const nextUse = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAUse], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prev, nextUse, 'Ann'), [cueShape.of({ name: 'use', gain: 1 })]);

  const heroASame = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn, gesture: { kind: 'power', at: 50 } }) });
  const nextSame = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroASame], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(nextSame, nextSame, 'Ann'), []);
});

test('cues: one-of-each', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn], monsters: [], items: [], visible: vis, explored: vis, gold: 3, log: [], entry: save });

  const bat10 = makeMonster(10, 'bat', 2, 1, 3, { kind: 'move', dx: 1, dy: 0, at: 50 });
  const bat11 = makeMonster(11, 'bat', 5, 1, 3, { kind: 'move', dx: 1, dy: 0, at: 50 });
  const heroAnnNext = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [bat10, bat11], items: [], visible: vis, explored: vis, gold: 10, log: [], entry: save });

  assert.deepStrictEqual(cues(prev, next, 'Ann'), [cueShape.of({ name: 'step', gain: 1 - 1 / 12 }), cueShape.of({ name: 'coin', gain: 1 })]);
});

test('cues: stairs', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: makeSave(1) });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 2, time: 0, state: 'playing', grid, heroes: [heroAnn], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: makeSave(2) });
  assert.deepStrictEqual(cues(prev, next, 'Ann'), [cueShape.of({ name: 'stairs', gain: 1 })]);
});

test('cues: dies', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 }) }) });
  const heroBob = heroShape.of({ name: 'Bob', actor: actorShape.of({ id: 1, kind: 'hero', pos: pointShape.of(3, 1), stats: statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 }) }) });
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn, heroBob], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  const heroAnnDead = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 0, maxHp: 5, attack: 3, defense: 1, range: 1 }) }), alive: false });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnDead, heroBob], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prev, next, 'Bob'), [cueShape.of({ name: 'hit', gain: 1 - 2 / 12 }), cueShape.of({ name: 'death', gain: 1 - 2 / 12 })]);
});

test('cues: hiss', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn0 = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn0], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  const pumpkinNext = makeMonster(10, 'pumpkin', 4, 1, 12, null, null, { at: 50 });
  const heroAnnNext = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [pumpkinNext], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prev, next, 'Ann'), [cueShape.of({ name: 'hiss', gain: 1 - 3 / 12 })]);

  const pumpkinSame = makeMonster(10, 'pumpkin', 4, 1, 12, null, null, { at: 50 });
  const prevSame = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [pumpkinSame], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  const nextSame = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [pumpkinSame], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });
  assert.deepStrictEqual(cues(prevSame, nextSame, 'Ann'), []);
});

test('cues: boom', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const pumpkinPrev = makeMonster(10, 'pumpkin', 4, 1, 12, null, null, null);
  const prev = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn], monsters: [pumpkinPrev], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save, effects: [] });

  const visHalf = maskShape.of(7, 3, Array(21).fill(false));
  const heroAnnNext = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 50, state: 'playing', grid, heroes: [heroAnnNext], monsters: [], items: [], visible: visHalf, explored: visHalf, gold: 0, log: [], entry: save, effects: [{ kind: 'blast', x: 4, y: 1, size: 1, at: 50 }] });
  assert.deepStrictEqual(cues(prev, next, 'Ann'), [cueShape.of({ name: 'death', gain: 1 - 3 / 12 }), cueShape.of({ name: 'boom', gain: 1 - 3 / 12 })]);
});

test('cues: refuses', () => {
  const grid = makeGrid(['#######', '#.....#', '#######']);
  const vis = allVisible(7, 3);
  const save = makeSave(1);
  const statsAnn = statsShape.of({ hp: 5, maxHp: 5, attack: 3, defense: 1, range: 1 });
  const heroAnn = heroShape.of({ name: 'Ann', actor: actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsAnn }) });
  const next = worldShape.of({ seed: 1, rng: 2, depth: 1, time: 0, state: 'playing', grid, heroes: [heroAnn], monsters: [], items: [], visible: vis, explored: vis, gold: 0, log: [], entry: save });

  assert.throws(() => cues({}, next, 'Ann'), TypeError);
  assert.throws(() => cues(next, null, 'Ann'), TypeError);
  assert.throws(() => cues(next, next, 5), TypeError);
});
