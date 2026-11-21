// intrinsic tests for rules: new-game, immutable, picks-up, attacks, monsters-act, dies, descends, restarts, refuses.

import test from "node:test";
import assert from "node:assert/strict";

import * as rules from "../../../src/rules/index.mjs";
import * as intentShape from "../../../shapes/intent/index.mjs";
import * as worldShape from "../../../shapes/world/index.mjs";
import * as tileGridShape from "../../../shapes/tile-grid/index.mjs";
import * as pointShape from "../../../shapes/point/index.mjs";
import * as maskShape from "../../../shapes/mask/index.mjs";
import * as actorShape from "../../../shapes/actor/index.mjs";
import * as itemShape from "../../../shapes/item/index.mjs";
import * as statsShape from "../../../shapes/stats/index.mjs";

test("new-game: deterministic and fields", () => {
  const w1 = rules.newGame(5);
  const w2 = rules.newGame(5);
  // compare key fields
  assert.equal(w1.seed, w2.seed);
  assert.equal(w1.rng, w2.rng);
  assert.equal(w1.depth, w2.depth);
  assert.equal(w1.turn, w2.turn);
  assert.equal(w1.state, w2.state);
  assert.equal(w1.gold, w2.gold);
  assert.deepEqual(w1.log, w2.log);
  assert.equal(w1.hero.pos.x, w2.hero.pos.x);
  assert.equal(w1.hero.pos.y, w2.hero.pos.y);
  assert.equal(w1.monsters.length, w2.monsters.length);
  for (let i = 0; i < w1.monsters.length; i++) {
    assert.equal(w1.monsters[i].kind, w2.monsters[i].kind);
    assert.equal(w1.monsters[i].pos.x, w2.monsters[i].pos.x);
    assert.equal(w1.monsters[i].pos.y, w2.monsters[i].pos.y);
  }
  assert.equal(w1.items.length, w2.items.length);
  assert.equal(w1.grid.width, w2.grid.width);
  assert.equal(w1.grid.height, w2.grid.height);
  assert.deepEqual(w1.grid.tiles(), w2.grid.tiles());

  assert.equal(w1.depth, 1);
  assert.equal(w1.turn, 0);
  assert.equal(w1.state, "playing");
  assert.equal(w1.gold, 0);
  assert.equal(w1.seed, 5);
  assert.equal(w1.hero.id, 0);
  assert.equal(w1.monsters.length, 4);
  for (const m of w1.monsters) {
    assert.ok(["bat", "slime"].includes(m.kind));
    assert.ok(w1.grid.open(m.pos.x, m.pos.y));
  }
  // no two monsters on one cell, none on hero
  const monsterCells = w1.monsters.map(m => `${m.pos.x},${m.pos.y}`);
  assert.equal(new Set(monsterCells).size, 4);
  assert.ok(!monsterCells.includes(`${w1.hero.pos.x},${w1.hero.pos.y}`));
  assert.ok(w1.items.length >= 4);
  assert.ok(w1.visible.at(w1.hero.pos.x, w1.hero.pos.y));
  assert.deepEqual(w1.explored.cells(), w1.visible.cells());
  assert.deepEqual(w1.log, ["Welcome to the dungeon. Find the stairs (>)."]);
  assert.equal(w1.grid.width, 48);
  assert.equal(w1.grid.height, 32);
});

test("immutable: step does not mutate input world", () => {
  const w = rules.newGame(5);
  const turnBefore = w.turn;
  const rngBefore = w.rng;
  const i = intentShape.wait();
  const w2 = rules.step(w, i);
  // input world unchanged
  assert.equal(w.turn, turnBefore);
  assert.equal(w.rng, rngBefore);
  // output world has turn incremented (wait passes turn, monsters act)
  assert.equal(w2.turn, 1);
});

test("picks-up: gold, potion, sword, armor", () => {
  const grid = tileGridShape.fromRows(['#####', '#...#', '#####']);
  const visible = maskShape.empty(5, 3);
  const explored = maskShape.empty(5, 3);

  // gold
  const goldItem = itemShape.of({ id: 1, kind: 'gold', pos: pointShape.of(2, 1), amount: 7 });
  const heroG = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 10, maxHp: 24, attack: 4, defense: 1 }) });
  const wG = worldShape.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid, hero: heroG, monsters: [], items: [goldItem], visible, explored, gold: 0, log: [] });
  const wGold = rules.step(wG, intentShape.move(1, 0));
  assert.equal(wGold.gold, 7);
  assert.equal(wGold.items.length, 0);

  // potion: 10 -> 18
  const hero10 = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 10, maxHp: 24, attack: 4, defense: 1 }) });
  const potionItem = itemShape.of({ id: 2, kind: 'potion', pos: pointShape.of(2, 1), amount: 0 });
  const w10 = worldShape.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid, hero: hero10, monsters: [], items: [potionItem], visible, explored, gold: 0, log: [] });
  const wPotion = rules.step(w10, intentShape.move(1, 0));
  assert.equal(wPotion.hero.stats.hp, 18);

  // potion: 20 -> 24
  const hero20 = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) });
  const potionItem2 = itemShape.of({ id: 3, kind: 'potion', pos: pointShape.of(2, 1), amount: 0 });
  const w20 = worldShape.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid, hero: hero20, monsters: [], items: [potionItem2], visible, explored, gold: 0, log: [] });
  const wPotion20 = rules.step(w20, intentShape.move(1, 0));
  assert.equal(wPotion20.hero.stats.hp, 24);

  // sword
  const heroSword = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const swordItem = itemShape.of({ id: 4, kind: 'sword', pos: pointShape.of(2, 1), amount: 0 });
  const wSword = worldShape.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid, hero: heroSword, monsters: [], items: [swordItem], visible, explored, gold: 0, log: [] });
  const wSworded = rules.step(wSword, intentShape.move(1, 0));
  assert.equal(wSworded.hero.stats.attack, 6);

  // armor
  const heroArmor = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const armorItem = itemShape.of({ id: 5, kind: 'armor', pos: pointShape.of(2, 1), amount: 0 });
  const wArmor = worldShape.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid, hero: heroArmor, monsters: [], items: [armorItem], visible, explored, gold: 0, log: [] });
  const wArmored = rules.step(wArmor, intentShape.move(1, 0));
  assert.equal(wArmored.hero.stats.defense, 2);
});

test("wall-bump: move into wall doesn't pass turn", () => {
  const grid = tileGridShape.fromRows(['#####', '#...#', '#####']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const visible = maskShape.empty(5, 3);
  const explored = maskShape.empty(5, 3);
  const w = worldShape.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: 'playing', grid, hero, monsters: [], items: [], visible, explored, gold: 0, log: [] });
  const w2 = rules.step(w, intentShape.move(-1, 0));
  assert.equal(w2.turn, 0);
  assert.equal(w2.hero.pos.x, 1);
});

test("refuses: invalid inputs", () => {
  assert.throws(() => rules.newGame(-1), TypeError);
  assert.throws(() => rules.newGame(2.5), TypeError);
  assert.throws(() => rules.step({}, intentShape.wait()), TypeError);
  assert.throws(() => rules.step(rules.newGame(5), { kind: 'wait' }), TypeError);
});
