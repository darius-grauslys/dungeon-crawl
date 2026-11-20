// The edge test for rules.

import { test } from "node:test";
import * as assert from "node:assert";

import { newGame, step } from "../../../edges/edge_to_rules.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as item from "../../../shapes/item/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as point from "../../../shapes/point/index.mjs";

const HERO_STATS = { hp: 24, maxHp: 24, attack: 4, defense: 1 };
const MONSTER_STATS = { hp: 5, maxHp: 5, attack: 2, defense: 0 };

test("new-game", () => {
  const a = newGame(5);
  const b = newGame(5);
  assert.deepStrictEqual(a, b);
  assert.strictEqual(a.depth, 1);
  assert.strictEqual(a.turn, 0);
  assert.strictEqual(a.state, "playing");
  assert.strictEqual(a.gold, 0);
  assert.strictEqual(a.seed, 5);
  assert.strictEqual(a.hero.id, 0);
  assert.strictEqual(a.hero.kind, "hero");
  assert.strictEqual(a.monsters.length, 4);
  assert.strictEqual(a.grid.width, 48);
  assert.strictEqual(a.grid.height, 32);
  assert.strictEqual(a.log.length, 1);
  assert.strictEqual(a.log[0], "Welcome to the dungeon. Find the stairs (>).");
  assert.strictEqual(a.visible.at(a.hero.pos.x, a.hero.pos.y), true);
  assert.deepStrictEqual(a.explored.cells(), a.visible.cells());
  assert.ok(a.items.length >= 4);
});

test("immutable", () => {
  const w = newGame(3);
  const before = JSON.stringify(w);
  const intents = [
    intent.move(1, 0),
    intent.move(-1, 0),
    intent.move(0, 1),
    intent.move(0, -1),
    intent.wait(),
    intent.descend(),
  ];
  for (const i of intents) {
    step(w, i);
    assert.strictEqual(JSON.stringify(w), before);
  }
});

test("wall-bump", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS) });
  const w = world.of({
    seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero,
    monsters: [], items: [],
    visible: mask.empty(grid.width, grid.height),
    explored: mask.empty(grid.width, grid.height),
    gold: 0, log: [],
  });

  const w1 = step(w, intent.move(-1, 0));
  assert.strictEqual(w1.turn, 0);
  assert.strictEqual(w1.hero.pos.x, 1);
  assert.strictEqual(w1.hero.pos.y, 1);

  const w2 = step(w, intent.move(1, 0));
  assert.strictEqual(w2.hero.pos.x, 2);
  assert.strictEqual(w2.hero.pos.y, 1);
  assert.strictEqual(w2.turn, 1);
  assert.strictEqual(w2.visible.at(3, 1), true);
  const visCells = w2.visible.cells();
  const expCells = w2.explored.cells();
  for (let k = 0; k < visCells.length; k++) {
    if (visCells[k]) assert.strictEqual(expCells[k], true);
  }
});

test("picks-up", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);

  // gold
  let hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS) });
  let gItem = item.of({ id: 1, kind: "gold", pos: point.of(2, 1), amount: 7 });
  let w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [], items: [gItem], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  let w1 = step(w, intent.move(1, 0));
  assert.strictEqual(w1.items.length, 0);
  assert.strictEqual(w1.gold, 7);

  // potion, hero at 10/24
  hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 24, attack: 4, defense: 1 }) });
  let pItem = item.of({ id: 1, kind: "potion", pos: point.of(2, 1), amount: 0 });
  w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [], items: [pItem], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  w1 = step(w, intent.move(1, 0));
  assert.strictEqual(w1.hero.stats.hp, 18);

  // potion, hero at 20/24
  hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) });
  w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [], items: [pItem], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  w1 = step(w, intent.move(1, 0));
  assert.strictEqual(w1.hero.stats.hp, 24);

  // sword
  hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS) });
  let sItem = item.of({ id: 1, kind: "sword", pos: point.of(2, 1), amount: 0 });
  w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [], items: [sItem], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  w1 = step(w, intent.move(1, 0));
  assert.strictEqual(w1.hero.stats.attack, 6);

  // armor
  hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS) });
  let aItem = item.of({ id: 1, kind: "armor", pos: point.of(2, 1), amount: 0 });
  w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [], items: [aItem], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  w1 = step(w, intent.move(1, 0));
  assert.strictEqual(w1.hero.stats.defense, 2);
});

test("attacks", () => {
  const grid = tileGrid.fromRows(["######", "#....#", "######"]);
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS) });
  const bat = actor.of({ id: 1, kind: "bat", pos: point.of(2, 1), stats: stats.of({ hp: 1, maxHp: 5, attack: 2, defense: 0 }) });

  let goneCount = 0;
  let staysCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = world.of({ seed: 1, rng, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [bat], items: [], visible: mask.empty(6, 3), explored: mask.empty(6, 3), gold: 0, log: [] });
    const w1 = step(w, intent.move(1, 0));
    assert.strictEqual(w1.hero.pos.x, 1);
    assert.strictEqual(w1.hero.pos.y, 1);
    const batStill = w1.monsters.find((m) => m.kind === "bat");
    if (!batStill) goneCount++;
    else if (batStill.stats.hp === 1) staysCount++;
  }
  assert.ok(goneCount >= 1);
  assert.ok(staysCount >= 1);
});

test("monsters-act", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS) });
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(4, 1), stats: stats.of(MONSTER_STATS) });
  const w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [skeleton], items: [], visible: mask.empty(7, 3), explored: mask.empty(7, 3), gold: 0, log: [] });
  const w1 = step(w, intent.wait());
  const sk = w1.monsters[0];
  assert.strictEqual(sk.pos.x, 3);
  assert.strictEqual(sk.pos.y, 1);
  assert.strictEqual(w1.turn, 1);
});

test("dies", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 1, maxHp: 24, attack: 4, defense: 0 }) });
  const demon = actor.of({ id: 1, kind: "demon", pos: point.of(2, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 6, defense: 1 }) });

  let deadCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = world.of({ seed: 1, rng, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [demon], items: [], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
    const w1 = step(w, intent.wait());
    if (w1.state === "dead" && w1.hero.stats.hp === 0) deadCount++;
  }
  assert.ok(deadCount >= 1);

  const deadW = world.of({ seed: 1, rng: 1, depth: 1, turn: 1, state: "dead", grid, hero, monsters: [demon], items: [], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  const before = JSON.stringify(deadW);
  const w2 = step(deadW, intent.move(1, 0));
  assert.strictEqual(JSON.stringify(w2), before);
  const w3 = step(deadW, intent.wait());
  assert.strictEqual(JSON.stringify(w3), before);
});

test("descends", () => {
  const grid = tileGrid.fromRows(["#####", "#.>.#", "#####"]);

  // descend on stairs
  let hero = actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) });
  let w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [], items: [], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  let w1 = step(w, intent.descend());
  assert.strictEqual(w1.depth, 2);
  assert.strictEqual(w1.grid.width, 48);
  assert.strictEqual(w1.grid.height, 32);
  assert.strictEqual(w1.hero.stats.hp, 24);
  assert.strictEqual(w1.hero.stats.maxHp, 28);
  assert.strictEqual(w1.hero.stats.attack, 4);
  assert.strictEqual(w1.hero.stats.defense, 1);
  assert.strictEqual(w1.log[w1.log.length - 1], "You descend to depth 2.");

  // descend off stairs
  hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) });
  w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [], items: [], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  w1 = step(w, intent.descend());
  assert.strictEqual(w1.turn, 0);
  assert.strictEqual(w1.depth, 1);
  assert.strictEqual(w1.log[w1.log.length - 1], "There are no stairs here.");

  // descend at depth 5
  hero = actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) });
  w = world.of({ seed: 1, rng: 1, depth: 5, turn: 0, state: "playing", grid, hero, monsters: [], items: [], visible: mask.empty(3, 3), explored: mask.empty(3, 3), gold: 0, log: [] });
  w1 = step(w, intent.descend());
  assert.strictEqual(w1.state, "won");
});

test("restarts", () => {
  const w9 = newGame(9);
  const r1 = step(w9, intent.restart());
  assert.deepStrictEqual(r1, newGame(10));

  const w9afterWait = step(w9, intent.wait());
  const r2 = step(w9afterWait, intent.restart());
  assert.deepStrictEqual(r2, newGame(10));

  const w9dead = w9.with({ state: "dead" });
  const r3 = step(w9dead, intent.restart());
  assert.deepStrictEqual(r3, newGame(10));

  const wMax = newGame(4294967295);
  const r4 = step(wMax, intent.restart());
  assert.deepStrictEqual(r4, newGame(0));
});

test("refuses", () => {
  assert.throws(() => newGame(-1), TypeError);
  assert.throws(() => newGame(2.5), TypeError);
  const w = newGame(1);
  assert.throws(() => step(w, { kind: "wait" }), TypeError);
  assert.throws(() => step({}, intent.wait()), TypeError);
});

test("world/valid", () => {
  const grid = tileGrid.fromRows(["#####", "#####", "#####"]);
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS) });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS) });
  const gItem = item.of({ id: 2, kind: "gold", pos: point.of(3, 1), amount: 1 });
  const w = world.of({ seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [] });
  assert.strictEqual(w.seed, 1);
  assert.strictEqual(w.depth, 1);
  assert.strictEqual(w.state, "playing");
  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));

  const badState = { seed: 1, rng: 1, depth: 1, turn: 0, grid, hero, monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [] };
  badState.state = "paused";
  assert.throws(() => world.of(badState), TypeError);

  const badDepth = { seed: 1, rng: 1, depth: 6, turn: 0, state: "playing", grid, hero, monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [] };
  assert.throws(() => world.of(badDepth), TypeError);

  const badVisible = { seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [monster], items: [gItem], visible: mask.empty(4, 3), explored: mask.empty(5, 3), gold: 0, log: [] };
  assert.throws(() => world.of(badVisible), TypeError);

  const badMonsterKind = { seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [actor.of({ id: 1, kind: "hero", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS) })], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [] };
  assert.throws(() => world.of(badMonsterKind), TypeError);

  const log51 = [];
  for (let i = 0; i < 51; i++) log51.push("x");
  const badLog = { seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: log51 };
  assert.throws(() => world.of(badLog), TypeError);

  const noGold = { seed: 1, rng: 1, depth: 1, turn: 0, state: "playing", grid, hero, monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), log: [] };
  assert.throws(() => world.of(noGold), TypeError);

  const w2 = w.with({ turn: 9 });
  assert.strictEqual(w2.turn, 9);
  assert.strictEqual(w.turn, 0);
});

test("intent/valid", () => {
  const m = intent.move(0, -1);
  assert.strictEqual(m.kind, "move");
  assert.strictEqual(m.dx, 0);
  assert.strictEqual(m.dy, -1);
  assert.ok(Object.isFrozen(m));

  assert.strictEqual(intent.wait().kind, "wait");
  assert.strictEqual(intent.wait().dx, 0);
  assert.strictEqual(intent.wait().dy, 0);
  assert.strictEqual(intent.descend().kind, "descend");
  assert.strictEqual(intent.restart().kind, "restart");

  assert.throws(() => intent.move(1, 1), TypeError);
  assert.throws(() => intent.move(0, 0), TypeError);
  assert.throws(() => intent.move(2, 0), TypeError);
  assert.throws(() => intent.move("1", 0), TypeError);
});
