import test from 'node:test';
import assert from 'node:assert/strict';

import * as intentShape from '../../../shapes/intent/index.mjs';
import * as pointShape from '../../../shapes/point/index.mjs';
import * as tileGridShape from '../../../shapes/tile-grid/index.mjs';
import * as maskShape from '../../../shapes/mask/index.mjs';
import * as actorShape from '../../../shapes/actor/index.mjs';
import * as statsShape from '../../../shapes/stats/index.mjs';
import * as heroShape from '../../../shapes/hero/index.mjs';
import * as itemShape from '../../../shapes/item/index.mjs';
import * as saveShape from '../../../shapes/save/index.mjs';
import * as worldShape from '../../../shapes/world/index.mjs';
import { explore, toward, sighted } from '../../../src/travel/index.mjs';

function boolsFromRows(rows, width, height) {
  const cells = [];
  for (const row of rows) {
    for (const ch of row) cells.push(ch === '1');
  }
  return cells;
}

function makeWorld(gridRows, heroes, monsters, items, exploredRows, visibleRows) {
  const grid = tileGridShape.fromRows(gridRows);
  const explored = maskShape.of(grid.width, grid.height, boolsFromRows(exploredRows, grid.width, gridRows.length));
  const visible = maskShape.of(grid.width, grid.height, boolsFromRows(visibleRows, grid.width, gridRows.length));
  const entry = saveShape.of({ seed: 1, depth: 1, players: [] });
  return worldShape.of({
    seed: 1, rng: 0, depth: 1, time: 0, state: 'playing',
    grid, heroes, monsters, items, visible, explored, gold: 0,
    log: [], entry
  });
}

let _heroId = 0;

function makeHeroActor(name, x, y, hp = 10) {
  const stats = statsShape.of({ hp, maxHp: 20, attack: 3, defense: 1 });
  return actorShape.of({ id: _heroId++, kind: 'hero', pos: pointShape.of(x, y), stats });
}

function makeHero(name, x, y, alive = true) {
  return heroShape.of({ name, actor: makeHeroActor(name, x, y, alive ? 10 : 0), alive });
}

function makeMonster(kind, id, x, y) {
  const entry = bestiaryEntry(kind);
  const stats = statsShape.of({ hp: entry.hp, maxHp: entry.hp, attack: entry.attack, defense: entry.defense, range: entry.range });
  return actorShape.of({ id, kind, pos: pointShape.of(x, y), stats });
}

// mini bestiary entry helper
function bestiaryEntry(kind) {
  const table = {
    bat: { hp: 3, attack: 2, defense: 0, range: 1 },
    slime: { hp: 6, attack: 2, defense: 1, range: 1 },
  };
  return table[kind];
}

test('explore: frontier', () => {
  const gridRows = ['#######', '#.....#', '#######'];
  const exploredRows = ['1111000', '1111000', '1111000'];
  const visibleRows = ['0000000', '0000000', '0000000'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(explore(w, 'Ann').kind, 'move');
  assert.strictEqual(explore(w, 'Ann').dx, 1);
  assert.strictEqual(explore(w, 'Ann').dy, 0);
});

test('explore: nothing left', () => {
  const gridRows = ['#######', '#.....#', '#######'];
  const exploredRows = ['1111111', '1111111', '1111111'];
  const visibleRows = ['0000000', '0000000', '0000000'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(explore(w, 'Ann'), null);
});

test('explore: stairs', () => {
  const gridRows = ['#######', '#...>.#', '#######'];
  const exploredRows = ['1111111', '1111111', '1111111'];
  const visibleRows = ['0000000', '0000000', '0000000'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(explore(w, 'Ann').dx, 1);
  assert.strictEqual(explore(w, 'Ann').dy, 0);
  const w2 = makeWorld(gridRows, [makeHero('Ann', 4, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(explore(w2, 'Ann'), null);
});

test('explore: no hero / not alive', () => {
  const gridRows = ['#######', '#.....#', '#######'];
  const exploredRows = ['1111000', '1111000', '1111000'];
  const visibleRows = ['0000000', '0000000', '0000000'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(explore(w, 'Eve'), null);
  const w2 = makeWorld(gridRows, [makeHero('Ann', 1, 1, false)], [], [], exploredRows, visibleRows);
  assert.strictEqual(explore(w2, 'Ann'), null);
});

test('toward: basic paths', () => {
  const gridRows = ['#######', '#.....#', '#.....#', '#######'];
  const exploredRows = ['1111111', '1111111', '1111111', '1111111'];
  const visibleRows = ['1111111', '1111111', '1111111', '1111111'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(2, 2)).dx, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(2, 2)).dy, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(5, 2)).dx, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(5, 2)).dy, 0);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(1, 2)).dx, 0);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(1, 2)).dy, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(1, 1)), null);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(0, 0)), null);
});

test('toward: around visible monster', () => {
  const gridRows = ['#######', '#.....#', '#.....#', '#######'];
  const exploredRows = ['1111111', '1111111', '1111111', '1111111'];
  const visibleRows = ['1111111', '1111111', '1111111', '1111111'];
  const monsters = [makeMonster('slime', 100, 2, 1)];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], monsters, [], exploredRows, visibleRows);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dx, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dy, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(2, 1)), null);
});

test('toward: unseen monster not planned around', () => {
  const gridRows = ['#######', '#.....#', '#.....#', '#######'];
  const exploredRows = ['1111111', '1111111', '1111111', '1111111'];
  const visibleRows = ['0000000', '0000000', '0000000', '0000000'];
  const monsters = [makeMonster('slime', 100, 2, 1)];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], monsters, [], exploredRows, visibleRows);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dx, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dy, 0);
});

test('toward: nothing known but own cell', () => {
  const gridRows = ['#######', '#.....#', '#.....#', '#######'];
  const exploredRows = ['0000000', '0100000', '0000000', '0000000'];
  const visibleRows = ['0000000', '0100000', '0000000', '0000000'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)), null);
});

test('toward: corner rule', () => {
  const gridRows = ['#####', '#.#.#', '#...#', '#####'];
  const exploredRows = ['11111', '11111', '11111', '11111'];
  const visibleRows = ['11111', '11111', '11111', '11111'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dx, 0);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dy, 1);
});

test('toward: blocked by hero', () => {
  const gridRows = ['#######', '#.....#', '#######'];
  const exploredRows = ['1111111', '1111111', '1111111'];
  const visibleRows = ['1111111', '1111111', '1111111'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1), makeHero('Bob', 2, 1, true)], [], [], exploredRows, visibleRows);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(4, 1)), null);
  const w2 = makeWorld(gridRows, [makeHero('Ann', 1, 1), makeHero('Bob', 2, 1, false)], [], [], exploredRows, visibleRows);
  assert.strictEqual(toward(w2, 'Ann', pointShape.of(4, 1)).dx, 1);
  assert.strictEqual(toward(w2, 'Ann', pointShape.of(4, 1)).dy, 0);
});

test('toward: blocked by ware', () => {
  const gridRows = ['#######', '#.....#', '#######'];
  const exploredRows = ['1111111', '1111111', '1111111'];
  const visibleRows = ['1111111', '1111111', '1111111'];
  const items = [itemShape.of({ id: 5, kind: 'sword', pos: pointShape.of(3, 1), price: 30 })];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], items, exploredRows, visibleRows);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(5, 1)), null);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dx, 1);
  assert.strictEqual(toward(w, 'Ann', pointShape.of(3, 1)).dy, 0);
});

test('sighted: hostile monsters in sight', () => {
  const grid = tileGridShape.of(20, 20, Array(400).fill('floor'));
  const explored = maskShape.empty(20, 20);
  const visible = maskShape.of(20, 20, Array(400).fill(true));
  const entry = saveShape.of({ seed: 1, depth: 1, players: [] });
  const w = worldShape.of({
    seed: 1, rng: 0, depth: 1, time: 0, state: 'playing', grid,
    heroes: [makeHero('Ann', 2, 2)],
    monsters: [makeMonster('bat', 10, 5, 5), makeMonster('slime', 11, 12, 2)],
    items: [], visible, explored, gold: 0, log: [], entry
  });
  assert.deepStrictEqual(sighted(w, 'Ann'), [10]);
  const w2 = worldShape.of({
    seed: 1, rng: 0, depth: 1, time: 0, state: 'playing', grid,
    heroes: [makeHero('Ann', 2, 2), makeHero('Bob', 11, 2)],
    monsters: [makeMonster('bat', 10, 5, 5), makeMonster('slime', 11, 12, 2)],
    items: [], visible, explored, gold: 0, log: [], entry
  });
  assert.deepStrictEqual(sighted(w2, 'Ann'), [10]);
});

test('sighted: not visible or blocked', () => {
  const grid = tileGridShape.of(20, 20, Array(400).fill('floor'));
  const explored = maskShape.empty(20, 20);
  const cells = Array(400).fill(true);
  cells[5 * 20 + 5] = false; // bat's cell not visible
  const visible = maskShape.of(20, 20, cells);
  const entry = saveShape.of({ seed: 1, depth: 1, players: [] });
  const w = worldShape.of({
    seed: 1, rng: 0, depth: 1, time: 0, state: 'playing', grid,
    heroes: [makeHero('Ann', 2, 2)],
    monsters: [makeMonster('bat', 10, 5, 5), makeMonster('slime', 11, 12, 2)],
    items: [], visible, explored, gold: 0, log: [], entry
  });
  assert.deepStrictEqual(sighted(w, 'Ann'), []);

  const grid2 = tileGridShape.fromRows(['#########', '#...#...#', '#########']);
  const explored2 = maskShape.of(9, 3, boolsFromRows(['111111111', '111111111', '111111111'], 9, 3));
  const visible2 = maskShape.of(9, 3, boolsFromRows(['111111111', '111111111', '111111111'], 9, 3));
  const entry2 = saveShape.of({ seed: 1, depth: 1, players: [] });
  const w2 = worldShape.of({
    seed: 1, rng: 0, depth: 1, time: 0, state: 'playing', grid: grid2,
    heroes: [makeHero('Ann', 1, 1)],
    monsters: [makeMonster('bat', 10, 6, 1)],
    items: [], visible: visible2, explored: explored2, gold: 0, log: [], entry: entry2
  });
  assert.deepStrictEqual(sighted(w2, 'Ann'), []);
  assert.deepStrictEqual(sighted(w2, 'Eve'), []);
});

test('refuses: bad world and target', () => {
  assert.throws(() => explore({}, 'Ann'), TypeError);
  const gridRows = ['#######', '#.....#', '#######'];
  const exploredRows = ['1111000', '1111000', '1111000'];
  const visibleRows = ['0000000', '0000000', '0000000'];
  const w = makeWorld(gridRows, [makeHero('Ann', 1, 1)], [], [], exploredRows, visibleRows);
  assert.throws(() => toward(w, 'Ann', { x: 1, y: 1 }), TypeError);
  assert.throws(() => sighted(null, 'Ann'), TypeError);
});
