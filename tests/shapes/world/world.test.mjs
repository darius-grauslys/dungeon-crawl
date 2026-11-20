// The tests of the shape world: its intrinsic valid.

import { test } from "node:test";
import assert from "node:assert";

import * as pointShape from '../../../shapes/point/index.mjs';
import * as statsShape from '../../../shapes/stats/index.mjs';
import * as tileGridShape from '../../../shapes/tile-grid/index.mjs';
import * as actorShape from '../../../shapes/actor/index.mjs';
import * as itemShape from '../../../shapes/item/index.mjs';
import * as maskShape from '../../../shapes/mask/index.mjs';
import { of as worldOf } from '../../../shapes/world/index.mjs';

function makeValidComponents() {
  const grid = tileGridShape.fromRows(['#####', '#.>>>', '#####']);
  const hero = actorShape.of({
    id: 0,
    kind: 'hero',
    pos: pointShape.of(1, 1),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 })
  });
  const monster = actorShape.of({
    id: 1,
    kind: 'slime',
    pos: pointShape.of(2, 0),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 2, defense: 1 })
  });
  const item = itemShape.of({ id: 0, kind: 'gold', pos: pointShape.of(3, 1), amount: 10 });
  const visible = maskShape.empty(5, 3);
  const explored = maskShape.empty(5, 3);
  return { grid, hero, monster, item, visible, explored };
}

function makeWorld(overrides = {}) {
  const { grid, hero, monster, item, visible, explored } = makeValidComponents();
  const fields = {
    seed: 123,
    rng: 456,
    depth: 2,
    turn: 0,
    state: 'playing',
    grid,
    hero,
    monsters: [monster],
    items: [item],
    visible,
    explored,
    gold: 7,
    log: ['start']
  };
  return { world: worldOf({ ...fields, ...overrides }), fields };
}

test('world: intrinsic valid builds a frozen world with all values', () => {
  const { world } = makeWorld();

  assert.strictEqual(world.seed, 123);
  assert.strictEqual(world.rng, 456);
  assert.strictEqual(world.depth, 2);
  assert.strictEqual(world.turn, 0);
  assert.strictEqual(world.state, 'playing');
  assert.strictEqual(world.grid.width, 5);
  assert.strictEqual(world.grid.height, 3);
  assert.strictEqual(world.hero, world.hero);
  assert.strictEqual(world.hero.kind, 'hero');
  assert.deepStrictEqual(world.monsters.length, 1);
  assert.strictEqual(world.monsters[0].kind, 'slime');
  assert.deepStrictEqual(world.items.length, 1);
  assert.strictEqual(world.items[0].kind, 'gold');
  assert.strictEqual(world.visible, world.visible);
  assert.strictEqual(world.explored, world.explored);
  assert.strictEqual(world.gold, 7);
  assert.deepStrictEqual(world.log, ['start']);

  assert.ok(Object.isFrozen(world));
  assert.ok(Object.isFrozen(world.monsters));
  assert.ok(Object.isFrozen(world.items));
  assert.ok(Object.isFrozen(world.log));
});

test('world: intrinsic valid - state: paused throws TypeError', () => {
  const { fields } = makeWorld();
  assert.throws(() => worldOf({ ...fields, state: 'paused' }), TypeError);
});

test('world: intrinsic valid - depth: 6 throws TypeError', () => {
  const { fields } = makeWorld();
  assert.throws(() => worldOf({ ...fields, depth: 6 }), TypeError);
});

test('world: intrinsic valid - visible: empty(4, 3) throws TypeError', () => {
  const { fields } = makeWorld();
  assert.throws(() => worldOf({ ...fields, visible: maskShape.empty(4, 3) }), TypeError);
});

test('world: intrinsic valid - monster of kind hero throws TypeError', () => {
  const { grid, hero, item, visible, explored } = makeValidComponents();
  const heroMonster = actorShape.of({
    id: 1,
    kind: 'hero',
    pos: pointShape.of(2, 0),
    stats: statsShape.of({ hp: 5, maxHp: 10, attack: 2, defense: 1 })
  });
  assert.throws(() => worldOf({
    seed: 123, rng: 456, depth: 2, turn: 0, state: 'playing',
    grid, hero, monsters: [heroMonster], items: [item], visible, explored, gold: 7, log: []
  }), TypeError);
});

test('world: intrinsic valid - log of 51 strings throws TypeError', () => {
  const { fields } = makeWorld();
  const log = [];
  for (let i = 0; i < 51; i++) log.push('line ' + i);
  assert.throws(() => worldOf({ ...fields, log }), TypeError);
});

test('world: intrinsic valid - missing gold throws TypeError', () => {
  const { grid, hero, monster, item, visible, explored } = makeValidComponents();
  const fields = {
    seed: 123, rng: 456, depth: 2, turn: 0, state: 'playing',
    grid, hero, monsters: [monster], items: [item], visible, explored, log: []
  };
  assert.throws(() => worldOf(fields), TypeError);
});

test('world: with returns new world with changed turn, original unchanged', () => {
  const { world } = makeWorld();
  const w2 = world.with({ turn: 9 });
  assert.strictEqual(w2.turn, 9);
  assert.strictEqual(world.turn, 0);
  assert.notStrictEqual(world, w2);
});

test('world: intrinsic valid - two worlds from the same fields are deep equal', () => {
  const { grid, hero, monster, item, visible, explored } = makeValidComponents();
  const fields = {
    seed: 123,
    rng: 456,
    depth: 2,
    turn: 0,
    state: 'playing',
    grid,
    hero,
    monsters: [monster],
    items: [item],
    visible,
    explored,
    gold: 7,
    log: ['start']
  };
  const w1 = worldOf({ ...fields });
  const w2 = worldOf({ ...fields });
  assert.deepStrictEqual(w1, w2);
});

test('world: intrinsic valid - with is a shared method, not an own property', () => {
  const { world } = makeWorld();
  assert.strictEqual(Object.hasOwn(world, 'with'), false);
  assert.strictEqual(typeof world.with, 'function');
});
