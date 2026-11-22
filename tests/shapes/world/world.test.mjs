// The tests of the shape world: its intrinsics valid and data.

import { test } from "node:test";
import assert from "node:assert";

import * as pointShape from '../../../shapes/point/index.mjs';
import * as statsShape from '../../../shapes/stats/index.mjs';
import * as tileGridShape from '../../../shapes/tile-grid/index.mjs';
import * as actorShape from '../../../shapes/actor/index.mjs';
import * as itemShape from '../../../shapes/item/index.mjs';
import * as maskShape from '../../../shapes/mask/index.mjs';
import * as saveShape from '../../../shapes/save/index.mjs';
import * as heroShape from '../../../shapes/hero/index.mjs';
import * as intentShape from '../../../shapes/intent/index.mjs';
import { of as worldOf, fromData as worldFromData } from '../../../shapes/world/index.mjs';

function makeValidComponents() {
  const grid = tileGridShape.fromRows(['#####', '#...#', '#####']);
  const heroActor = actorShape.of({
    id: 0,
    kind: 'hero',
    pos: pointShape.of(1, 1),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 })
  });
  const hero = heroShape.of({ name: 'Ann', actor: heroActor });
  const monster = actorShape.of({
    id: 1,
    kind: 'slime',
    pos: pointShape.of(2, 0),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 2, defense: 1 })
  });
  const item = itemShape.of({ id: 0, kind: 'gold', pos: pointShape.of(3, 1), amount: 10 });
  const visible = maskShape.empty(5, 3);
  const explored = maskShape.empty(5, 3);
  const entry = saveShape.of({ seed: 1, depth: 1, players: [] });
  return { grid, hero, monster, item, visible, explored, entry };
}

function makeWorld(overrides = {}) {
  const { grid, hero, monster, item, visible, explored, entry } = makeValidComponents();
  const fields = {
    seed: 123,
    rng: 456,
    depth: 2,
    time: 0,
    state: 'playing',
    grid,
    heroes: [hero],
    monsters: [monster],
    items: [item],
    visible,
    explored,
    gold: 7,
    log: ['start'],
    entry
  };
  return { world: worldOf({ ...fields, ...overrides }), fields };
}

test('world: intrinsic valid builds a frozen world with all values', () => {
  const { world } = makeWorld();

  assert.strictEqual(world.seed, 123);
  assert.strictEqual(world.rng, 456);
  assert.strictEqual(world.depth, 2);
  assert.strictEqual(world.time, 0);
  assert.strictEqual(world.state, 'playing');
  assert.strictEqual(world.grid.width, 5);
  assert.strictEqual(world.grid.height, 3);
  assert.deepStrictEqual(world.heroes.length, 1);
  assert.strictEqual(world.heroes[0].name, 'Ann');
  assert.deepStrictEqual(world.monsters.length, 1);
  assert.strictEqual(world.monsters[0].kind, 'slime');
  assert.deepStrictEqual(world.items.length, 1);
  assert.strictEqual(world.items[0].kind, 'gold');
  assert.strictEqual(world.visible, world.visible);
  assert.strictEqual(world.explored, world.explored);
  assert.strictEqual(world.gold, 7);
  assert.deepStrictEqual(world.log, ['start']);
  assert.strictEqual(world.entry, world.entry);

  assert.ok(Object.isFrozen(world));
  assert.ok(Object.isFrozen(world.heroes));
  assert.ok(Object.isFrozen(world.monsters));
  assert.ok(Object.isFrozen(world.items));
  assert.ok(Object.isFrozen(world.log));
});

test('world: intrinsic valid - state: dead throws TypeError', () => {
  const { fields } = makeWorld();
  assert.throws(() => worldOf({ ...fields, state: 'dead' }), TypeError);
});

test('world: intrinsic valid - depth: 33 accepted', () => {
  const { fields } = makeWorld();
  const w = worldOf({ ...fields, depth: 33 });
  assert.strictEqual(w.depth, 33);
});

test('world: intrinsic valid - depth: 34 throws TypeError', () => {
  const { fields } = makeWorld();
  assert.throws(() => worldOf({ ...fields, depth: 34 }), TypeError);
});

test('world: intrinsic valid - time: -1 throws TypeError', () => {
  const { fields } = makeWorld();
  assert.throws(() => worldOf({ ...fields, time: -1 }), TypeError);
});

test('world: intrinsic valid - visible: empty(4, 3) throws TypeError', () => {
  const { fields } = makeWorld();
  assert.throws(() => worldOf({ ...fields, visible: maskShape.empty(4, 3) }), TypeError);
});

test('world: intrinsic valid - monster of kind hero throws TypeError', () => {
  const { grid, hero, item, visible, explored, entry } = makeValidComponents();
  const heroMonster = actorShape.of({
    id: 1,
    kind: 'hero',
    pos: pointShape.of(2, 0),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 2, defense: 1 })
  });
  assert.throws(() => worldOf({
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes: [hero], monsters: [heroMonster], items: [item], visible, explored, gold: 7, log: [], entry
  }), TypeError);
});

test('world: intrinsic valid - five heroes throws TypeError', () => {
  const { grid, monster, item, visible, explored, entry } = makeValidComponents();
  const heroes = [];
  for (let i = 0; i < 5; i++) {
    const ha = actorShape.of({
      id: i,
      kind: 'hero',
      pos: pointShape.of(1, 1),
      stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 })
    });
    heroes.push(heroShape.of({ name: 'H' + i, actor: ha }));
  }
  assert.throws(() => worldOf({
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes, monsters: [monster], items: [item], visible, explored, gold: 7, log: [], entry
  }), TypeError);
});

test('world: intrinsic valid - two heroes named Ann throws TypeError', () => {
  const { grid, monster, item, visible, explored, entry } = makeValidComponents();
  const annActor1 = actorShape.of({
    id: 0,
    kind: 'hero',
    pos: pointShape.of(1, 1),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 })
  });
  const hero1 = heroShape.of({ name: 'Ann', actor: annActor1 });
  const annActor2 = actorShape.of({
    id: 2,
    kind: 'hero',
    pos: pointShape.of(1, 1),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 })
  });
  const hero2 = heroShape.of({ name: 'Ann', actor: annActor2 });
  const heroes = [hero1, hero2];
  assert.throws(() => worldOf({
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes, monsters: [monster], items: [item], visible, explored, gold: 7, log: [], entry
  }), TypeError);
});

test('world: intrinsic valid - log of 51 strings throws TypeError', () => {
  const { fields } = makeWorld();
  const log = [];
  for (let i = 0; i < 51; i++) log.push('line ' + i);
  assert.throws(() => worldOf({ ...fields, log }), TypeError);
});

test('world: intrinsic valid - missing gold throws TypeError', () => {
  const { grid, hero, monster, item, visible, explored, entry } = makeValidComponents();
  const fields = {
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes: [hero], monsters: [monster], items: [item], visible, explored, log: [], entry
  };
  assert.throws(() => worldOf(fields), TypeError);
});

test('world: intrinsic valid - missing entry throws TypeError', () => {
  const { grid, hero, monster, item, visible, explored, gold } = makeValidComponents();
  const fields = {
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes: [hero], monsters: [monster], items: [item], visible, explored, gold, log: []
  };
  assert.throws(() => worldOf(fields), TypeError);
});

test('world: with returns new world with changed time, original unchanged', () => {
  const { world } = makeWorld();
  const w2 = world.with({ time: 9 });
  assert.strictEqual(w2.time, 9);
  assert.strictEqual(world.time, 0);
  assert.notStrictEqual(world, w2);
});

test('world: intrinsic valid - two worlds from the same fields are deep equal', () => {
  const { world, fields } = makeWorld();
  const w2 = worldOf({ ...fields });
  assert.deepStrictEqual(world, w2);
});

test('world: intrinsic valid - with and data are shared methods, not own properties', () => {
  const { world } = makeWorld();
  assert.strictEqual(Object.hasOwn(world, 'with'), false);
  assert.strictEqual(typeof world.with, 'function');
  assert.strictEqual(Object.hasOwn(world, 'data'), false);
  assert.strictEqual(typeof world.data, 'function');
});

test('world: intrinsic data - fromData(data()) round trip passes deepStrictEqual', () => {
  const { grid, item, visible, explored, entry } = makeValidComponents();
  const heroActor = actorShape.of({
    id: 0,
    kind: 'hero',
    pos: pointShape.of(1, 1),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 }),
    held: 300,
    facing: 'left',
    last: { kind: 'attack', dx: -1, dy: 0, at: 50 }
  });
  const hero = heroShape.of({ name: 'Ann', actor: heroActor, offer: 12 });
  const heroWithPending = hero.with({ pending: intentShape.move(1, 0) });
  const monster = actorShape.of({
    id: 1,
    kind: 'slime',
    pos: pointShape.of(2, 0),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 2, defense: 1 }),
    last: { kind: 'move', dx: 0, dy: 1, at: 20 }
  });
  const golem = actorShape.of({
    id: 2,
    kind: 'golem',
    pos: pointShape.of(4, 2),
    stats: statsShape.of({ hp: 40, maxHp: 40, attack: 16, defense: 12, range: 1 }),
    size: 2,
    small: true,
    mode: 'dormant',
    slow: 1,
    aim: { dx: -1, dy: 1 }
  });
  const archer = actorShape.of({
    id: 3,
    kind: 'archer',
    pos: pointShape.of(1, 2),
    stats: statsShape.of({ hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 }),
    last: { kind: 'attack', dx: 1, dy: 1, at: 30, reach: 3 }
  });
  const swordItem = itemShape.of({ id: 12, kind: 'sword', pos: pointShape.of(3, 1), price: 30 });
  const leverItem = itemShape.of({ id: 13, kind: 'lever', pos: pointShape.of(2, 1), pulled: true });
  const flungGold = itemShape.of({ id: 14, kind: 'gold', pos: pointShape.of(4, 0), amount: 5, flung: { x: 1, y: 1, at: 40 } });
  const ringItem = itemShape.of({ id: 15, kind: 'ring', pos: pointShape.of(1, 0), price: 35 });
  const necklaceItem = itemShape.of({ id: 16, kind: 'necklace', pos: pointShape.of(0, 0) });
  const visibleWithOne = maskShape.of(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const fields = {
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes: [heroWithPending], monsters: [monster, golem, archer], items: [item, swordItem, leverItem, flungGold, ringItem, necklaceItem],
    visible: visibleWithOne, explored, gold: 7, log: ['start'], entry
  };
  const w = worldOf(fields);
  const round = worldFromData(JSON.parse(JSON.stringify(w.data())));
  assert.deepStrictEqual(round, w);
});

test('world: intrinsic data - data().grid and data().visible[1]', () => {
  const { grid, item, visible, explored, entry } = makeValidComponents();
  const heroActor = actorShape.of({
    id: 0,
    kind: 'hero',
    pos: pointShape.of(1, 1),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 }),
    held: 300,
    facing: 'left',
    last: { kind: 'attack', dx: -1, dy: 0, at: 50 }
  });
  const hero = heroShape.of({ name: 'Ann', actor: heroActor, offer: 12 });
  const heroWithPending = hero.with({ pending: intentShape.move(1, 0) });
  const monster = actorShape.of({
    id: 1,
    kind: 'slime',
    pos: pointShape.of(2, 0),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 2, defense: 1 }),
    last: { kind: 'move', dx: 0, dy: 1, at: 20 }
  });
  const golem = actorShape.of({
    id: 2,
    kind: 'golem',
    pos: pointShape.of(4, 2),
    stats: statsShape.of({ hp: 40, maxHp: 40, attack: 16, defense: 12, range: 1 }),
    size: 2,
    small: true,
    mode: 'dormant',
    slow: 1,
    aim: { dx: -1, dy: 1 }
  });
  const archer = actorShape.of({
    id: 3,
    kind: 'archer',
    pos: pointShape.of(1, 2),
    stats: statsShape.of({ hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 }),
    last: { kind: 'attack', dx: 1, dy: 1, at: 30, reach: 3 }
  });
  const swordItem = itemShape.of({ id: 12, kind: 'sword', pos: pointShape.of(3, 1), price: 30 });
  const leverItem = itemShape.of({ id: 13, kind: 'lever', pos: pointShape.of(2, 1), pulled: true });
  const flungGold = itemShape.of({ id: 14, kind: 'gold', pos: pointShape.of(4, 0), amount: 5, flung: { x: 1, y: 1, at: 40 } });
  const ringItem = itemShape.of({ id: 15, kind: 'ring', pos: pointShape.of(1, 0), price: 35 });
  const necklaceItem = itemShape.of({ id: 16, kind: 'necklace', pos: pointShape.of(0, 0) });
  const visibleWithOne = maskShape.of(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const fields = {
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes: [heroWithPending], monsters: [monster, golem, archer], items: [item, swordItem, leverItem, flungGold, ringItem, necklaceItem],
    visible: visibleWithOne, explored, gold: 7, log: ['start'], entry
  };
  const w = worldOf(fields);
  assert.deepStrictEqual(w.data().grid, ['#####', '#...#', '#####']);
  assert.strictEqual(w.data().visible[1], '01000');
  assert.strictEqual(w.data().items[1].price, 30);
  assert.strictEqual(w.data().heroes[0].offer, 12);
  assert.strictEqual(w.data().items[2].pulled, true);
  assert.deepStrictEqual(w.data().items[3].flung, { x: 1, y: 1, at: 40 });
  assert.strictEqual(w.data().items[4].kind, 'ring');
  assert.strictEqual(w.data().items[4].price, 35);
  assert.strictEqual(w.data().items[5].kind, 'necklace');
  assert.strictEqual(w.data().items[5].price, 0);
  assert.strictEqual(w.data().monsters[2].last.reach, 3);
  assert.strictEqual(w.data().monsters[2].stats.range, 4);
});

test('world: intrinsic data - fromData({}) throws TypeError', () => {
  assert.throws(() => worldFromData({}), TypeError);
});

test('world: intrinsic data - data() with depth 34 throws TypeError', () => {
  const { world } = makeWorld();
  const d = world.data();
  assert.throws(() => worldFromData({ ...d, depth: 34 }), TypeError);
});

test('world: items may be ring or necklace', () => {
  const { grid, hero, monster, visible, explored, entry } = makeValidComponents();
  const ringItem = itemShape.of({ id: 15, kind: 'ring', pos: pointShape.of(1, 0), price: 35 });
  const necklaceItem = itemShape.of({ id: 16, kind: 'necklace', pos: pointShape.of(0, 0) });
  const w = worldOf({
    seed: 123, rng: 456, depth: 2, time: 0, state: 'playing',
    grid, heroes: [hero], monsters: [monster], items: [ringItem, necklaceItem],
    visible, explored, gold: 7, log: [], entry
  });
  assert.strictEqual(w.items[0].kind, 'ring');
  assert.strictEqual(w.items[0].price, 35);
  assert.strictEqual(w.items[1].kind, 'necklace');
  assert.strictEqual(w.items[1].price, 0);
  const round = worldFromData(JSON.parse(JSON.stringify(w.data())));
  assert.deepStrictEqual(round, w);
});
