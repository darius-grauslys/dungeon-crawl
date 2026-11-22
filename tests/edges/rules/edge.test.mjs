// The edge test for rules: real-time latency, parties, saves.

import { test } from "node:test";
import * as assert from "node:assert";

import { newGame, fromSave, toSave, join, intend, advance } from "../../../edges/edge_to_rules.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as save from "../../../shapes/save/index.mjs";
import * as hero from "../../../shapes/hero/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as item from "../../../shapes/item/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as bestiary from "../../../shapes/bestiary/index.mjs";
import * as level from "../../../shapes/level/index.mjs";

const HERO_STATS = { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1 };
const MONSTER_STATS = { hp: 5, maxHp: 5, attack: 2, defense: 0, range: 1 };

function makeWorld({ grid, heroes, monsters = [], items = [], rng = 1, depth = 1, time = 0, state = "playing", gold = 0, log = [], entry }) {
  const w = world.of({
    seed: 1,
    rng,
    depth,
    time,
    state,
    grid,
    heroes,
    monsters,
    items,
    visible: mask.empty(grid.width, grid.height),
    explored: mask.empty(grid.width, grid.height),
    gold,
    log,
    entry: entry || save.of({ seed: 1, depth, players: heroes.map((h) => ({ name: h.name, stats: h.actor.stats })) }),
  });
  return w;
}

test("new-game", () => {
  const a = newGame(5);
  const b = newGame(5);
  assert.deepStrictEqual(a, b);
  assert.strictEqual(a.depth, 1);
  assert.strictEqual(a.time, 0);
  assert.strictEqual(a.state, "playing");
  assert.strictEqual(a.gold, 0);
  assert.strictEqual(a.seed, 5);
  assert.strictEqual(a.heroes.length, 0);
  assert.strictEqual(a.monsters.length, 4);
  const monsterPositions = new Set();
  for (const m of a.monsters) {
    assert.ok(a.grid.open(m.pos.x, m.pos.y));
    const key = `${m.pos.x},${m.pos.y}`;
    assert.ok(!monsterPositions.has(key));
    monsterPositions.add(key);
    assert.strictEqual(m.ready, 0);
  }
  assert.ok(a.items.length >= 4);
  assert.strictEqual(a.visible.count(), 0);
  assert.strictEqual(a.explored.count(), 0);
  assert.deepStrictEqual(a.entry, save.of({ seed: 5, depth: 1, players: [] }));
  assert.deepStrictEqual(a.log, ["Welcome to the dungeon. Find the stairs (>)."]);
  assert.strictEqual(a.grid.width, 48);
  assert.strictEqual(a.grid.height, 32);
});

test("joins", () => {
  const w0 = newGame(5);
  let w = join(w0, "Ann");
  assert.strictEqual(w.heroes.length, 1);
  const h = w.heroes[0];
  assert.strictEqual(h.name, "Ann");
  assert.strictEqual(h.alive, true);
  assert.strictEqual(h.pending, null);
  assert.deepStrictEqual(h.actor.stats, { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.strictEqual(h.actor.ready, 0);
  assert.ok(w.grid.open(h.actor.pos.x, h.actor.pos.y));
  for (const m of w.monsters) {
    assert.notStrictEqual(`${m.pos.x},${m.pos.y}`, `${h.actor.pos.x},${h.actor.pos.y}`);
  }
  const ids = new Set();
  for (const m of w.monsters) ids.add(m.id);
  for (const it of w.items) ids.add(it.id);
  assert.ok(!ids.has(h.actor.id));
  assert.strictEqual(w.visible.at(h.actor.pos.x, h.actor.pos.y), true);
  assert.strictEqual(w.entry.players.length, 1);
  assert.strictEqual(w.entry.players[0].name, "Ann");
  assert.deepStrictEqual(w.entry.players[0].stats, { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.strictEqual(w.log[w.log.length - 1], "Ann joins the party.");

  assert.strictEqual(join(w, "Ann"), w);

  const w2 = join(w, "Bob");
  assert.strictEqual(w2.heroes.length, 2);
  const bob = w2.heroes[1];
  assert.notStrictEqual(`${bob.actor.pos.x},${bob.actor.pos.y}`, `${h.actor.pos.x},${h.actor.pos.y}`);

  const w3 = join(w2, "Charlie");
  const w4 = join(w3, "Delta");
  assert.strictEqual(join(w4, "Eve"), null);

  assert.throws(() => join(w0, ""), TypeError);
});

test("immutable", () => {
  const w = join(newGame(3), "Ann");
  const before = JSON.stringify(w.data());
  const moves = [intent.move(1, 0), intent.move(1, 1), intent.move(0, 1), intent.move(-1, 1), intent.move(-1, 0), intent.move(-1, -1), intent.move(0, -1), intent.move(1, -1)];
  const intents = [...moves, intent.attack(), intent.face(0, 1), intent.use(), intent.wait(), intent.descend()];
  for (const i of intents) {
    intend(w, "Ann", i);
    assert.strictEqual(JSON.stringify(w.data()), before);
    advance(w, 50);
    assert.strictEqual(JSON.stringify(w.data()), before);
    advance(w, 200);
    assert.strictEqual(JSON.stringify(w.data()), before);
    advance(w, 1000);
    assert.strictEqual(JSON.stringify(w.data()), before);
  }
  join(w, "Bob");
  assert.strictEqual(JSON.stringify(w.data()), before);
  toSave(w);
  assert.strictEqual(JSON.stringify(w.data()), before);
});

test("latency", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const w0 = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });

  let w = advance(intend(w0, "Ann", intent.move(1, 0)), 50);
  const h1 = w.heroes[0];
  assert.strictEqual(h1.actor.pos.x, 2);
  assert.strictEqual(h1.actor.pos.y, 1);
  assert.strictEqual(h1.actor.ready, 250);
  assert.strictEqual(h1.pending, null);
  assert.strictEqual(w.time, 50);

  w = intend(w, "Ann", intent.move(1, 0));
  w = intend(w, "Ann", intent.move(-1, 0));
  for (let i = 0; i < 3; i++) {
    w = advance(w, 50);
  }
  const h2 = w.heroes[0];
  assert.strictEqual(h2.actor.pos.x, 2);
  assert.strictEqual(h2.actor.pos.y, 1);
  assert.strictEqual(h2.pending.kind, "move");
  assert.strictEqual(h2.pending.dx, -1);
  assert.strictEqual(h2.pending.dy, 0);

  w = advance(w, 50);
  const h3 = w.heroes[0];
  assert.strictEqual(h3.actor.pos.x, 1);
  assert.strictEqual(h3.actor.pos.y, 1);
  assert.strictEqual(h3.actor.ready, 450);
  assert.strictEqual(w.time, 250);

  w = intend(w, "Ann", intent.move(0, -1));
  w = advance(w, 200);
  const h4 = w.heroes[0];
  assert.strictEqual(h4.actor.pos.x, 1);
  assert.strictEqual(h4.actor.pos.y, 1);
  assert.strictEqual(h4.actor.ready, 650);
  assert.strictEqual(h4.pending, null);

  w = advance(w, 50);
  assert.strictEqual(w.heroes[0].actor.ready, 650);
  assert.strictEqual(w.heroes[0].actor.pos.x, 1);
  assert.strictEqual(w.heroes[0].actor.pos.y, 1);

  // attack, use, wait, descend latencies
  const heroAnn2 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wAttack = makeWorld({ grid, heroes: [heroAnn2], monsters: [], items: [] });
  assert.strictEqual(advance(intend(wAttack, "Ann", intent.attack(1, 0)), 50).heroes[0].actor.ready, 400);
  const wUse = makeWorld({ grid, heroes: [heroAnn2], monsters: [], items: [] });
  assert.strictEqual(advance(intend(wUse, "Ann", intent.use()), 50).heroes[0].actor.ready, 300);
  const wWait = makeWorld({ grid, heroes: [heroAnn2], monsters: [], items: [] });
  assert.strictEqual(advance(intend(wWait, "Ann", intent.wait()), 50).heroes[0].actor.ready, 250);
  const wDescend = makeWorld({ grid, heroes: [heroAnn2], monsters: [], items: [] });
  assert.strictEqual(advance(intend(wDescend, "Ann", intent.descend()), 50).heroes[0].actor.ready, 250);

  // two heroes keep their own clocks
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(4, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wTwo = makeWorld({ grid, heroes: [heroAnn2, heroBob], monsters: [], items: [] });
  const wTwoIntended = intend(intend(wTwo, "Ann", intent.attack(1, 0)), "Bob", intent.move(-1, 0));
  const wTwo1 = advance(wTwoIntended, 50);
  const annTwo = wTwo1.heroes.find((h) => h.name === "Ann");
  const bobTwo = wTwo1.heroes.find((h) => h.name === "Bob");
  assert.strictEqual(annTwo.actor.ready, 400);
  assert.strictEqual(bobTwo.actor.ready, 250);
  assert.strictEqual(bobTwo.actor.pos.x, 3);
  assert.strictEqual(bobTwo.actor.pos.y, 1);
});

test("diagonal", () => {
  // diagonal move to (2,2)
  const grid1 = tileGrid.fromRows(["#####", "#...#", "#...#", "#####"]);
  const heroAnn1 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const w1 = makeWorld({ grid: grid1, heroes: [heroAnn1], monsters: [], items: [] });
  const w1a = advance(intend(w1, "Ann", intent.move(1, 1)), 50);
  const h1a = w1a.heroes[0];
  assert.strictEqual(h1a.actor.pos.x, 2);
  assert.strictEqual(h1a.actor.pos.y, 2);
  assert.strictEqual(h1a.actor.ready, 250);
  assert.deepStrictEqual(h1a.actor.aim, { dx: 1, dy: 1 });
  assert.strictEqual(h1a.actor.facing, "right");
  assert.deepStrictEqual(h1a.actor.last, { kind: "move", dx: 1, dy: 1, at: 50, reach: 1 });

  // diagonal move cuts corner
  const grid2 = tileGrid.fromRows(["#####", "#.#.#", "#...#", "#####"]);
  const heroAnn2 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const w2 = makeWorld({ grid: grid2, heroes: [heroAnn2], monsters: [], items: [] });
  const w2a = advance(intend(w2, "Ann", intent.move(1, 1)), 50);
  const h2a = w2a.heroes[0];
  assert.strictEqual(h2a.actor.pos.x, 1);
  assert.strictEqual(h2a.actor.pos.y, 1);
  assert.strictEqual(h2a.actor.ready, 250);
  assert.deepStrictEqual(h2a.actor.aim, { dx: 1, dy: 1 });

  // diagonal melee attack on a bat at (2,2)
  let goneCount = 0;
  let staysCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const bat = actor.of({ id: 1, kind: "bat", pos: point.of(2, 2), stats: stats.of({ hp: 1, maxHp: 5, attack: 2, defense: 0, range: 1 }), ready: 10000 });
    const w3 = makeWorld({ grid: grid1, heroes: [heroAnn1], monsters: [bat], rng });
    const w3a = advance(intend(w3, "Ann", intent.move(1, 1)), 50);
    const ann3 = w3a.heroes[0];
    assert.strictEqual(ann3.actor.pos.x, 1);
    assert.strictEqual(ann3.actor.pos.y, 1);
    const batStill = w3a.monsters.find((m) => m.kind === "bat");
    if (!batStill) goneCount++;
    else {
      assert.strictEqual(batStill.held, 350);
      staysCount++;
    }
  }
  assert.ok(goneCount >= 1);
  assert.ok(staysCount >= 1);
});

test("picks-up", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);

  let heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let gItem = item.of({ id: 1, kind: "gold", pos: point.of(2, 1), amount: 7 });
  let w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [gItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.items.length, 0);
  assert.strictEqual(w.gold, 7);

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  let pItem = item.of({ id: 1, kind: "potion", pos: point.of(2, 1), amount: 0 });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [pItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.stats.hp, 18);

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [pItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.stats.hp, 24);

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let sItem = item.of({ id: 1, kind: "sword", pos: point.of(2, 1), amount: 0 });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [sItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.stats.attack, 6);

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let aItem = item.of({ id: 1, kind: "armor", pos: point.of(2, 1), amount: 0 });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [aItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.stats.defense, 2);

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let rItem = item.of({ id: 1, kind: "ring", pos: point.of(2, 1), amount: 0 });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [rItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.stats.magicPower, 2);
  assert.strictEqual(w.heroes[0].actor.stats.magicResist, 0);
  assert.strictEqual(w.log[w.log.length - 1], "Ann puts on a ring (+1 magic power).");
  assert.deepStrictEqual(w.heroes[0].actor.gesture, { kind: "power", at: 50 });
  assert.deepStrictEqual(w.heroes[0].actor.last, { kind: "move", dx: 1, dy: 0, at: 50, reach: 1 });

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let nItem = item.of({ id: 1, kind: "necklace", pos: point.of(2, 1), amount: 0 });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [nItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.stats.magicResist, 1);
  assert.strictEqual(w.log[w.log.length - 1], "Ann puts on a cross necklace (+1 magic resist).");
  assert.deepStrictEqual(w.heroes[0].actor.gesture, { kind: "power", at: 50 });
  assert.deepStrictEqual(w.heroes[0].actor.last, { kind: "move", dx: 1, dy: 0, at: 50, reach: 1 });

  // use() and wait() gestures
  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  w = advance(intend(w, "Ann", intent.use()), 50);
  assert.deepStrictEqual(w.heroes[0].actor.gesture, { kind: "use", at: 50 });
  assert.strictEqual(w.heroes[0].actor.last, null);
  assert.strictEqual(w.heroes[0].actor.ready, 300);

  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  w = advance(intend(w, "Ann", intent.wait()), 50);
  assert.strictEqual(w.heroes[0].actor.gesture, null);
});

test("attacks", () => {
  const grid = tileGrid.fromRows(["######", "#....#", "######"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const bat = actor.of({ id: 1, kind: "bat", pos: point.of(2, 1), stats: stats.of({ hp: 1, maxHp: 5, attack: 2, defense: 0, range: 1 }), ready: 10000 });

  let goneCount = 0;
  let staysCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [bat], rng });
    const w1 = advance(intend(w, "Ann", intent.move(1, 0)), 50);
    assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
    assert.strictEqual(w1.heroes[0].actor.pos.y, 1);
    assert.strictEqual(w1.heroes[0].actor.ready, 400);
    const batStill = w1.monsters.find((m) => m.kind === "bat");
    if (!batStill) goneCount++;
    else {
      assert.strictEqual(batStill.stats.hp, 1);
      assert.strictEqual(batStill.held, 350);
      staysCount++;
    }
  }
  assert.ok(goneCount >= 1);
  assert.ok(staysCount >= 1);

  goneCount = 0;
  staysCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [bat], rng });
    const w1 = advance(intend(w, "Ann", intent.attack(1, 0)), 50);
    assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
    assert.strictEqual(w1.heroes[0].actor.ready, 400);
    const batStill = w1.monsters.find((m) => m.kind === "bat");
    if (!batStill) goneCount++;
    else {
      assert.strictEqual(batStill.stats.hp, 1);
      assert.strictEqual(batStill.held, 350);
      staysCount++;
    }
  }
  assert.ok(goneCount >= 1);
  assert.ok(staysCount >= 1);

  const w = makeWorld({ grid, heroes: [heroAnn], monsters: [bat], rng: 1 });
  const w1 = advance(intend(w, "Ann", intent.attack(-1, 0)), 50);
  assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
  assert.strictEqual(w1.heroes[0].actor.pos.y, 1);
  assert.strictEqual(w1.heroes[0].actor.ready, 400);
  assert.strictEqual(w1.heroes[0].actor.facing, "left");
  assert.deepStrictEqual(w1.heroes[0].actor.last, { kind: "attack", dx: -1, dy: 0, at: 50, reach: 1 });
  assert.strictEqual(w1.monsters.length, 1);
});

test("ranged", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1, range: 3 }), ready: 0 }), pending: null, alive: true });
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const bat = actor.of({ id: 2, kind: "bat", pos: point.of(4, 1), stats: stats.of({ hp: 1, maxHp: 5, attack: 2, defense: 0, range: 1 }), ready: 10000 });

  let goneCount = 0;
  let staysCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn, heroBob], monsters: [bat], rng });
    const w1 = advance(intend(w, "Ann", intent.attack()), 50);
    assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
    assert.strictEqual(w1.heroes[0].actor.pos.y, 1);
    assert.strictEqual(w1.heroes[1].actor.pos.x, 2);
    assert.strictEqual(w1.heroes[1].actor.pos.y, 1);
    assert.strictEqual(w1.heroes[1].actor.stats.hp, 24);
    assert.strictEqual(w1.heroes[0].actor.ready, 400);
    assert.deepStrictEqual(w1.heroes[0].actor.last, { kind: "attack", dx: 1, dy: 0, at: 50, reach: 3 });
    const batStill = w1.monsters.find((m) => m.kind === "bat");
    if (!batStill) goneCount++;
    else {
      assert.strictEqual(batStill.held, 350);
      staysCount++;
    }
  }
  assert.ok(goneCount >= 1);
  assert.ok(staysCount >= 1);

  // bat at (5,1) is 4 away, untouched
  const batFar = actor.of({ id: 2, kind: "bat", pos: point.of(5, 1), stats: stats.of({ hp: 1, maxHp: 5, attack: 2, defense: 0, range: 1 }), ready: 10000 });
  const wFar = makeWorld({ grid, heroes: [heroAnn], monsters: [batFar], rng: 1 });
  const wFar1 = advance(intend(wFar, "Ann", intent.attack()), 50);
  assert.strictEqual(wFar1.monsters[0].held, 0);
  assert.strictEqual(wFar1.heroes[0].actor.last.reach, 1);

  // wall stops the attack
  const gridWall = tileGrid.fromRows(["#######", "#..#..#", "#######"]);
  const heroAnnW = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1, range: 3 }), ready: 0 }), pending: null, alive: true });
  const batWall = actor.of({ id: 2, kind: "bat", pos: point.of(4, 1), stats: stats.of({ hp: 1, maxHp: 5, attack: 2, defense: 0, range: 1 }), ready: 10000 });
  const wWall = makeWorld({ grid: gridWall, heroes: [heroAnnW], monsters: [batWall], rng: 1 });
  const wWall1 = advance(intend(wWall, "Ann", intent.attack()), 50);
  assert.strictEqual(wWall1.monsters[0].held, 0);

  // archer attacks Ann
  const heroAnnA = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const archer = actor.of({ id: 2, kind: "archer", pos: point.of(5, 1), stats: stats.of({ hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 }), ready: 0 });
  const wA = makeWorld({ grid, heroes: [heroAnnA], monsters: [archer], rng: 1 });
  const wA1 = advance(wA, 50);
  assert.strictEqual(wA1.heroes[0].actor.held, 350);
  const archer1 = wA1.monsters[0];
  assert.strictEqual(archer1.ready, 750);
  assert.strictEqual(archer1.facing, "left");
  assert.deepStrictEqual(archer1.last, { kind: "attack", dx: -1, dy: 0, at: 50, reach: 4 });
});

test("slowed", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);

  let slowedCount = 0;
  let unslowedCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
    const bsnake = actor.of({ id: 1, kind: "blue-snake", pos: point.of(3, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 3, defense: 0, range: 1 }), ready: 0 });
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [bsnake], rng });
    const w1 = advance(w, 50);
    const ann = w1.heroes[0];
    if (ann.actor.stats.hp < 24 && ann.actor.slow === 3 && w1.log[w1.log.length - 1] === "Ann: you are slowed!") {
      slowedCount++;
    } else {
      assert.strictEqual(ann.actor.slow, 0);
      unslowedCount++;
    }
  }
  assert.ok(slowedCount >= 1);

  // slowed latency
  const heroAnnS = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0, slow: 3 }), pending: null, alive: true });
  const wS = makeWorld({ grid, heroes: [heroAnnS], monsters: [], items: [] });
  let wS1 = advance(intend(wS, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(wS1.heroes[0].actor.ready, 450);
  assert.strictEqual(wS1.heroes[0].actor.slow, 2);
  wS1 = intend(wS1, "Ann", intent.attack(1, 0));
  wS1 = advance(wS1, 400);
  assert.strictEqual(wS1.heroes[0].actor.ready, 1150);
  assert.strictEqual(wS1.heroes[0].actor.slow, 1);
  wS1 = intend(wS1, "Ann", intent.wait());
  wS1 = advance(wS1, 700);
  assert.strictEqual(wS1.heroes[0].actor.ready, 1350);
  assert.strictEqual(wS1.heroes[0].actor.slow, 1);
});

test("held", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const skeleton = actor.of({ id: 10, kind: "skeleton", pos: point.of(3, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 4, defense: 0, range: 1 }), ready: 0, held: 0, facing: "right", last: null });

  let w = makeWorld({ grid, heroes: [heroAnn], monsters: [skeleton] });
  w = advance(w, 50);
  const ann1 = w.heroes[0];
  assert.strictEqual(ann1.actor.held, 350);
  const sk1 = w.monsters[0];
  assert.strictEqual(sk1.ready, 650);
  assert.strictEqual(sk1.facing, "left");
  assert.deepStrictEqual(sk1.last, { kind: "attack", dx: -1, dy: 0, at: 50, reach: 1 });

  w = intend(w, "Ann", intent.move(-1, 0));
  for (let i = 0; i < 5; i++) {
    w = advance(w, 50);
  }
  const ann2 = w.heroes[0];
  assert.strictEqual(ann2.actor.pos.x, 2);
  assert.strictEqual(ann2.actor.pos.y, 1);
  assert.strictEqual(ann2.pending.kind, "move");
  assert.strictEqual(ann2.pending.dx, -1);
  assert.strictEqual(ann2.pending.dy, 0);
  assert.strictEqual(w.time, 300);

  w = advance(w, 50);
  const ann3 = w.heroes[0];
  assert.strictEqual(ann3.actor.pos.x, 1);
  assert.strictEqual(ann3.actor.pos.y, 1);
  assert.strictEqual(w.time, 350);

  // Instead, at time 100, an attack(1, 0) fires at once (her ready 450 and the skeleton's held 400).
  const heroAnnA = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const skeletonA = actor.of({ id: 10, kind: "skeleton", pos: point.of(3, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 4, defense: 0, range: 1 }), ready: 0, held: 0, facing: "right", last: null });
  let wA = makeWorld({ grid, heroes: [heroAnnA], monsters: [skeletonA] });
  wA = advance(wA, 50);
  wA = intend(wA, "Ann", intent.attack(1, 0));
  wA = advance(wA, 50);
  const annA = wA.heroes[0];
  assert.strictEqual(annA.actor.ready, 450);
  const skA = wA.monsters[0];
  assert.strictEqual(skA.held, 400);

  // A held skeleton (held 1000, ready 0) at (4, 1) with Ann at (1, 1) does not step at time 50, and its ready is 1000.
  const heroAnnH = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const skeletonH = actor.of({ id: 10, kind: "skeleton", pos: point.of(4, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 4, defense: 0, range: 1 }), ready: 0, held: 1000, facing: "right", last: null });
  const wH = makeWorld({ grid, heroes: [heroAnnH], monsters: [skeletonH] });
  const wH1 = advance(wH, 50);
  const skH = wH1.monsters[0];
  assert.strictEqual(skH.pos.x, 4);
  assert.strictEqual(skH.pos.y, 1);
  assert.strictEqual(skH.ready, 1000);
});

test("faces", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);

  // move(-1, 0) turns left
  let heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  w = advance(intend(w, "Ann", intent.move(-1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.facing, "left");

  // move(0, 1) into wall turns left
  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  w = advance(intend(w, "Ann", intent.move(0, 1)), 50);
  assert.strictEqual(w.heroes[0].actor.facing, "left");

  // move(1, 0) right
  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.facing, "right");

  // move(0, -1) right
  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  w = advance(intend(w, "Ann", intent.move(0, -1)), 50);
  assert.strictEqual(w.heroes[0].actor.facing, "right");

  // After move(1, 0) fires at time 50, last is {kind: 'move', dx: 1, dy: 0, at: 50, reach: 1}
  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.deepStrictEqual(w.heroes[0].actor.last, { kind: "move", dx: 1, dy: 0, at: 50, reach: 1 });

  // after a move(0, -1) into the wall, last is as it was
  w = intend(w, "Ann", intent.move(0, -1));
  w = advance(w, 50);
  assert.deepStrictEqual(w.heroes[0].actor.last, { kind: "move", dx: 1, dy: 0, at: 50, reach: 1 });

  // intend face: aim and facing set, pending/ready/cell/time unchanged
  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of(HERO_STATS), ready: 100 }), pending: intent.move(1, 0), alive: true });
  const wFace = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [] });
  const wFaceFaced = intend(wFace, "Ann", intent.face(-1, 1));
  assert.deepStrictEqual(wFaceFaced.heroes[0].actor.aim, { dx: -1, dy: 1 });
  assert.strictEqual(wFaceFaced.heroes[0].actor.facing, "left");
  assert.deepStrictEqual(wFaceFaced.heroes[0].pending, intent.move(1, 0));
  assert.strictEqual(wFaceFaced.heroes[0].actor.ready, 100);
  assert.strictEqual(wFaceFaced.time, 0);

  // A hero who joins has held 0, facing right and last null
  const wJoin = join(newGame(3), "Joined");
  assert.strictEqual(wJoin.heroes[0].actor.held, 0);
  assert.strictEqual(wJoin.heroes[0].actor.facing, "right");
  assert.strictEqual(wJoin.heroes[0].actor.last, null);
  assert.deepStrictEqual(wJoin.heroes[0].actor.aim, { dx: 1, dy: 0 });

  // In the monsters-act world, the skeleton's first step leaves it facing left with last {kind: 'move', dx: -1, dy: 0, at: 50, reach: 1}
  const mGrid = tileGrid.fromRows(["#########", "#.......#", "#########"]);
  const mAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const mskeleton = actor.of({ id: 10, kind: "skeleton", pos: point.of(4, 1), stats: stats.of(MONSTER_STATS), ready: 0 });
  const mWorld = makeWorld({ grid: mGrid, heroes: [mAnn], monsters: [mskeleton] });
  const mWorld1 = advance(mWorld, 50);
  const ms1 = mWorld1.monsters[0];
  assert.strictEqual(ms1.facing, "left");
  assert.deepStrictEqual(ms1.last, { kind: "move", dx: -1, dy: 0, at: 50, reach: 1 });
});

test("monsters-act", () => {
  const grid = tileGrid.fromRows(["#########", "#.......#", "#########"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const skeleton = actor.of({ id: 10, kind: "skeleton", pos: point.of(4, 1), stats: stats.of(MONSTER_STATS), ready: 0 });

  let w = makeWorld({ grid, heroes: [heroAnn], monsters: [skeleton] });

  w = advance(w, 50);
  const sk1 = w.monsters[0];
  assert.strictEqual(sk1.pos.x, 3);
  assert.strictEqual(sk1.pos.y, 1);
  assert.strictEqual(sk1.ready, 450);
  assert.strictEqual(w.time, 50);

  for (let i = 0; i < 7; i++) {
    w = advance(w, 50);
  }
  const sk2 = w.monsters[0];
  assert.strictEqual(sk2.pos.x, 3);
  assert.strictEqual(sk2.pos.y, 1);
  assert.strictEqual(sk2.ready, 450);
  assert.strictEqual(w.time, 400);

  w = advance(w, 50);
  const sk3 = w.monsters[0];
  assert.strictEqual(sk3.pos.x, 2);
  assert.strictEqual(sk3.pos.y, 1);

  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(6, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wBob = makeWorld({ grid, heroes: [heroAnn, heroBob], monsters: [skeleton] });
  const wBob1 = advance(wBob, 50);
  const sk4 = wBob1.monsters[0];
  assert.strictEqual(sk4.pos.x, 5);
  assert.strictEqual(sk4.pos.y, 1);
});

test("groups", () => {
  const grid = tileGrid.fromRows(["#########", "#.......#", "#########"]);

  // demon hits bat
  const heroG = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(7, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const demon = actor.of({ id: 10, kind: "demon", pos: point.of(2, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 6, defense: 1, range: 1 }), ready: 0 });
  const batG = actor.of({ id: 11, kind: "bat", pos: point.of(3, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 2, defense: 0, range: 1 }), ready: 10000 });
  let wG = makeWorld({ grid, heroes: [heroG], monsters: [demon, batG] });
  wG = advance(wG, 50);
  const demonG = wG.monsters.find((m) => m.kind === "demon");
  assert.strictEqual(demonG.pos.x, 2);
  assert.strictEqual(demonG.ready, 650);
  assert.deepStrictEqual(demonG.last, { kind: "attack", dx: 1, dy: 0, at: 50, reach: 1 });
  const batGStill = wG.monsters.find((m) => m.kind === "bat");
  if (batGStill) assert.strictEqual(batGStill.held, 350);
  assert.ok(/demon.*bat|The bat is slain/.test(wG.log[wG.log.length - 1]));

  // worm flees demon
  const heroF = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(7, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const imp = actor.of({ id: 10, kind: "imp", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS), ready: 10000 });
  const worm = actor.of({ id: 11, kind: "worm", pos: point.of(4, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 5, defense: 2, range: 1 }), ready: 0 });
  const wF = makeWorld({ grid, heroes: [heroF], monsters: [imp, worm] });
  const wF1 = advance(wF, 50);
  const worm1 = wF1.monsters.find((m) => m.kind === "worm");
  assert.strictEqual(worm1.pos.x, 5);

  // skeleton steps nowhere toward a friend bat
  const heroS = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(7, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const skeletonS = actor.of({ id: 10, kind: "skeleton", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS), ready: 0 });
  const batS = actor.of({ id: 11, kind: "bat", pos: point.of(3, 1), stats: stats.of(MONSTER_STATS), ready: 10000 });
  const wS = makeWorld({ grid, heroes: [heroS], monsters: [skeletonS, batS] });
  const wS1 = advance(wS, 50);
  const skeletonS1 = wS1.monsters.find((m) => m.kind === "skeleton");
  const batS1 = wS1.monsters.find((m) => m.kind === "bat");
  assert.strictEqual(skeletonS1.pos.x, 2);
  assert.strictEqual(batS1.held, 0);
});

test("dies", () => {
  const grid = tileGrid.fromRows(["#########", "#.......#", "#########"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 1, maxHp: 24, attack: 4, defense: 0, range: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(7, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const demon = actor.of({ id: 10, kind: "demon", pos: point.of(2, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 6, defense: 1, range: 1 }), ready: 0 });

  let deadCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn, heroBob], monsters: [demon], rng });
    const w1 = advance(w, 50);
    const ann = w1.heroes.find((h) => h.name === "Ann");
    const bob = w1.heroes.find((h) => h.name === "Bob");
    if (!ann.alive && ann.actor.stats.hp === 0 && bob.alive && w1.depth === 1) deadCount++;
  }
  assert.ok(deadCount >= 1);

  const deadAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 0, range: 1 }), ready: 0 }), pending: intent.move(1, 0), alive: false });
  const wDead = makeWorld({ grid, heroes: [deadAnn], monsters: [] });
  const wDeadIntended = intend(wDead, "Ann", intent.move(1, 0));
  assert.strictEqual(wDeadIntended, wDead);
});

test("wipe", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 1, maxHp: 24, attack: 4, defense: 0, range: 1 }), ready: 0 }), pending: null, alive: true });
  const demon = actor.of({ id: 10, kind: "demon", pos: point.of(2, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 6, defense: 1, range: 1 }), ready: 0 });
  const entry = save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] });

  let wipeCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [demon], rng, gold: 3, entry });
    const w1 = advance(w, 50);
    if (w1.depth === 1 && w1.grid.width === 48 && w1.grid.height === 32 && w1.heroes[0].alive && w1.heroes[0].actor.stats.hp === 24 && w1.heroes[0].actor.stats.maxHp === 24 && w1.time === 50 && w1.gold === 3 && w1.log[w1.log.length - 1] === "The party has fallen. Level 1 begins again.") {
      wipeCount++;
    }
  }
  assert.ok(wipeCount >= 1);
});

test("descends", () => {
  const grid = tileGrid.fromRows(["##########", "#.>......#", "##########"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(7, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: false });

  let w = makeWorld({
    grid,
    heroes: [heroAnn, heroBob],
    monsters: [],
    items: [],
    entry: save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }, { name: "Bob", stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });

  w = advance(w, 50);
  assert.strictEqual(w.depth, 1);

  w = advance(intend(w, "Ann", intent.descend()), 50);
  assert.strictEqual(w.depth, 2);
  assert.strictEqual(w.grid.width, 48);
  assert.strictEqual(w.grid.height, 32);
  const ann = w.heroes.find((h) => h.name === "Ann");
  const bob = w.heroes.find((h) => h.name === "Bob");
  assert.ok(ann.alive);
  assert.strictEqual(ann.actor.stats.hp, 24);
  assert.strictEqual(ann.actor.stats.maxHp, 28);
  assert.ok(bob.alive);
  assert.strictEqual(bob.actor.stats.hp, 1);
  assert.strictEqual(bob.actor.stats.maxHp, 28);
  assert.ok(w.grid.open(ann.actor.pos.x, ann.actor.pos.y));
  assert.ok(w.grid.open(bob.actor.pos.x, bob.actor.pos.y));
  for (let y = 0; y < w.explored.height; y++) {
    for (let x = 0; x < w.explored.width; x++) {
      if (w.explored.at(x, y)) assert.strictEqual(w.visible.at(x, y), true);
    }
  }
  assert.strictEqual(w.log[w.log.length - 1], "The party descends to level 2.");

  const heroAnn8 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(8, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBob8 = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: false });
  const w8 = makeWorld({
    grid,
    heroes: [heroAnn8, heroBob8],
    monsters: [],
    items: [],
    entry: save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }, { name: "Bob", stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });
  const w8after = advance(intend(w8, "Ann", intent.descend()), 50);
  assert.strictEqual(w8after.depth, 1);
  assert.strictEqual(w8after.log[w8after.log.length - 1], "All party members must be within 5 units of the exit!");

  const heroAnnAlive5 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(8, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBobAlive5 = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const wBobDescend = makeWorld({
    grid,
    heroes: [heroAnnAlive5, heroBobAlive5],
    monsters: [],
    items: [],
    entry: save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }, { name: "Bob", stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });
  const wBobDescendAfter = advance(intend(wBobDescend, "Bob", intent.descend()), 50);
  assert.strictEqual(wBobDescendAfter.depth, 1);
  assert.strictEqual(wBobDescendAfter.log[wBobDescendAfter.log.length - 1], "All party members must be within 5 units of the exit!");

  const heroAnn5 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const w5 = makeWorld({
    grid,
    heroes: [heroAnn5],
    monsters: [],
    items: [],
    depth: 5,
    gold: 5,
    entry: save.of({ seed: 1, depth: 5, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });
  const w5after = advance(intend(w5, "Ann", intent.descend()), 50);
  assert.strictEqual(w5after.depth, 6);
  assert.strictEqual(w5after.log[w5after.log.length - 2], "The party descends to a shop.");
  assert.strictEqual(w5after.log[w5after.log.length - 1], "A shop! Bump a ware twice to buy it.");

  const heroAnn6 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const w6 = makeWorld({
    grid,
    heroes: [heroAnn6],
    monsters: [],
    items: [],
    depth: 6,
    gold: 7,
    entry: save.of({ seed: 1, depth: 6, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });
  const w6after = advance(intend(w6, "Ann", intent.descend()), 50);
  assert.strictEqual(w6after.depth, 7);
  assert.strictEqual(w6after.log[w6after.log.length - 2], "The party descends into a lair.");
  assert.strictEqual(w6after.log[w6after.log.length - 1], "A golem guards the way down. Pull the levers to weaken it!");

  const heroAnn14 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const w14 = makeWorld({
    grid,
    heroes: [heroAnn14],
    monsters: [],
    items: [],
    depth: 14,
    gold: 7,
    entry: save.of({ seed: 1, depth: 14, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });
  const w14after = advance(intend(w14, "Ann", intent.descend()), 50);
  assert.strictEqual(w14after.depth, 15);
  assert.strictEqual(w14after.log[w14after.log.length - 1], "The party descends to level 11.");

  const heroAnn33 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const w33 = makeWorld({
    grid,
    heroes: [heroAnn33],
    monsters: [],
    items: [],
    depth: 33,
    gold: 15,
    entry: save.of({ seed: 1, depth: 33, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });
  const w33after = advance(intend(w33, "Ann", intent.descend()), 50);
  assert.strictEqual(w33after.state, "won");
  assert.ok(w33after.log[w33after.log.length - 1].startsWith("The party escapes the dungeon with"));
  assert.ok(w33after.log[w33after.log.length - 1].endsWith("gold!"));
  const w33later = advance(w33after, 50);
  assert.strictEqual(w33later.state, "won");
  assert.strictEqual(w33later.time, 100);
});

test("shop", () => {
  const w = fromSave(save.of({ seed: 4, depth: 6, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w.depth, 6);
  assert.strictEqual(w.grid.at(31, 19), "stairs");
  assert.strictEqual(w.grid.at(14, 10), "floor");
  assert.strictEqual(w.monsters.length, 0);
  assert.strictEqual(w.items.length, 6);
  const expectedPositions = [[16, 13], [19, 13], [22, 13], [25, 13], [28, 13], [31, 13]];
  const expectedKinds = ["potion", "sword", "armor", "ring", "necklace", "potion"];
  for (let i = 0; i < 6; i++) {
    const it = w.items[i];
    assert.strictEqual(it.pos.x, expectedPositions[i][0]);
    assert.strictEqual(it.pos.y, expectedPositions[i][1]);
    assert.strictEqual(it.kind, expectedKinds[i]);
    assert.ok(it.price > 0);
  }
  assert.ok(w.items[0].price >= 8 && w.items[0].price <= 32);
  assert.ok(w.items[1].price >= 24 && w.items[1].price <= 36);
  assert.ok(w.items[2].price >= 34 && w.items[2].price <= 46);
  assert.ok(w.items[3].price >= 29 && w.items[3].price <= 41);
  assert.ok(w.items[4].price >= 29 && w.items[4].price <= 41);
  assert.ok(w.items[5].price >= 8 && w.items[5].price <= 32);
  assert.strictEqual(w.visible.count(), 1536);
  assert.strictEqual(w.explored.count(), 1536);

  const w27 = fromSave(save.of({ seed: 4, depth: 27, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w27.depth, 27);
  assert.ok(w27.items[0].price >= 27 && w27.items[0].price <= 51);
  assert.ok(w27.items[1].price >= 53 && w27.items[1].price <= 65);
  assert.ok(w27.items[2].price >= 72 && w27.items[2].price <= 84);
  assert.ok(w27.items[3].price >= 62 && w27.items[3].price <= 74);
  assert.ok(w27.items[4].price >= 62 && w27.items[4].price <= 74);
  assert.ok(w27.items[5].price >= 27 && w27.items[5].price <= 51);
});

test("buys", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);
  const swordItem = item.of({ id: 12, kind: "sword", pos: point.of(2, 1), price: 30 });
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const w0 = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [swordItem], gold: 50 });

  let w = advance(intend(w0, "Ann", intent.move(1, 0)), 50);
  const h1 = w.heroes[0];
  assert.strictEqual(h1.actor.pos.x, 1);
  assert.strictEqual(h1.actor.pos.y, 1);
  assert.strictEqual(h1.offer, 12);
  assert.strictEqual(h1.actor.ready, 400);
  assert.strictEqual(h1.actor.facing, "right");
  assert.deepStrictEqual(h1.actor.last, { kind: "attack", dx: 1, dy: 0, at: 50, reach: 1 });
  assert.strictEqual(w.items.length, 1);
  assert.strictEqual(w.gold, 50);
  assert.strictEqual(w.log[w.log.length - 1], "Ann looks at a sword: 30 gold. Bump it again to buy.");

  w = advance(intend(w, "Ann", intent.move(1, 0)), 350);
  const h2 = w.heroes[0];
  assert.strictEqual(h2.actor.stats.attack, 6);
  assert.strictEqual(h2.offer, null);
  assert.strictEqual(w.items.length, 0);
  assert.strictEqual(w.gold, 20);
  assert.strictEqual(w.log[w.log.length - 1], "Ann buys a sword for 30 gold.");

  const heroAnn10 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const w10 = makeWorld({ grid, heroes: [heroAnn10], monsters: [], items: [swordItem], gold: 10 });
  let w10b = advance(intend(w10, "Ann", intent.move(1, 0)), 50);
  w10b = advance(intend(w10b, "Ann", intent.move(1, 0)), 350);
  assert.strictEqual(w10b.items.length, 1);
  assert.strictEqual(w10b.gold, 10);
  assert.strictEqual(w10b.heroes[0].offer, null);
  assert.strictEqual(w10b.log[w10b.log.length - 1], "Not enough gold for a sword: 30 needed, the party has 10.");

  const heroAnnW = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wW = makeWorld({ grid, heroes: [heroAnnW], monsters: [], items: [swordItem], gold: 50 });
  let wWb = advance(intend(wW, "Ann", intent.move(1, 0)), 50);
  wWb = intend(wWb, "Ann", intent.wait());
  wWb = advance(wWb, 350);
  assert.strictEqual(wWb.heroes[0].offer, null);
  wWb = intend(wWb, "Ann", intent.move(1, 0));
  wWb = advance(wWb, 200);
  assert.strictEqual(wWb.heroes[0].offer, 12);
  assert.strictEqual(wWb.items.length, 1);
  assert.strictEqual(wWb.gold, 50);

  const heroAnnA = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wA = makeWorld({ grid, heroes: [heroAnnA], monsters: [], items: [swordItem], gold: 50 });
  const wAb = advance(intend(wA, "Ann", intent.attack(1, 0)), 50);
  assert.strictEqual(wAb.heroes[0].offer, 12);

  const armorItem = item.of({ id: 13, kind: "armor", pos: point.of(2, 1), price: 34 });
  const heroArmor = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wArmor = makeWorld({ grid, heroes: [heroArmor], monsters: [], items: [armorItem], gold: 50 });
  const wArmorB = advance(intend(wArmor, "Ann", intent.move(1, 0)), 50);
  const wArmorB2 = advance(intend(wArmorB, "Ann", intent.move(1, 0)), 350);
  assert.strictEqual(wArmorB2.heroes[0].actor.stats.defense, 2);

  const potionItem = item.of({ id: 14, kind: "potion", pos: point.of(2, 1), price: 8 });
  const heroPotion = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const wPotion = makeWorld({ grid, heroes: [heroPotion], monsters: [], items: [potionItem], gold: 50 });
  const wPotionB = advance(intend(wPotion, "Ann", intent.move(1, 0)), 50);
  const wPotionB2 = advance(intend(wPotionB, "Ann", intent.move(1, 0)), 350);
  assert.strictEqual(wPotionB2.heroes[0].actor.stats.hp, 18);

  const ringItem = item.of({ id: 15, kind: "ring", pos: point.of(2, 1), price: 35 });
  const heroRing = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wRing = makeWorld({ grid, heroes: [heroRing], monsters: [], items: [ringItem], gold: 50 });
  const wRingB = advance(intend(wRing, "Ann", intent.move(1, 0)), 50);
  const wRingB2 = advance(intend(wRingB, "Ann", intent.move(1, 0)), 350);
  assert.strictEqual(wRingB2.heroes[0].actor.stats.magicPower, 2);
  assert.strictEqual(wRingB2.items.length, 0);
  assert.strictEqual(wRingB2.gold, 15);
  assert.strictEqual(wRingB2.log[wRingB2.log.length - 1], "Ann buys a ring for 35 gold.");

  const necklaceItem = item.of({ id: 16, kind: "necklace", pos: point.of(2, 1), price: 35 });
  const heroNecklace = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const wNecklace = makeWorld({ grid, heroes: [heroNecklace], monsters: [], items: [necklaceItem], gold: 50 });
  const wNecklaceB = advance(intend(wNecklace, "Ann", intent.move(1, 0)), 50);
  const wNecklaceB2 = advance(intend(wNecklaceB, "Ann", intent.move(1, 0)), 350);
  assert.strictEqual(wNecklaceB2.heroes[0].actor.stats.magicResist, 1);
  assert.strictEqual(wNecklaceB2.items.length, 0);
  assert.strictEqual(wNecklaceB2.gold, 15);
  assert.strictEqual(wNecklaceB2.log[wNecklaceB2.log.length - 1], "Ann buys a cross necklace for 35 gold.");
});

test("lair", () => {
  const w = fromSave(save.of({ seed: 4, depth: 7, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w.depth, 7);
  const ann = w.heroes[0];
  assert.strictEqual(ann.name, "Ann");
  assert.strictEqual(ann.actor.pos.x, 8);
  assert.strictEqual(ann.actor.pos.y, 16);
  assert.strictEqual(w.grid.at(33, 16), "floor");
  assert.strictEqual(w.monsters.length, 73);
  const golem = w.monsters[0];
  assert.strictEqual(golem.kind, "golem");
  assert.strictEqual(golem.pos.x, 32);
  assert.strictEqual(golem.pos.y, 15);
  assert.strictEqual(golem.size, 3);
  assert.strictEqual(golem.mode, "dormant");
  assert.deepStrictEqual(golem.stats, { hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2, magicResist: 0 });
  assert.strictEqual(golem.facing, "left");
  for (let i = 1; i < 73; i++) {
    assert.strictEqual(w.monsters[i].kind, "slime");
    assert.strictEqual(w.monsters[i].mode, "guard");
    assert.deepStrictEqual(w.monsters[i].stats, { hp: 6, maxHp: 6, attack: 2, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  }
  assert.strictEqual(w.items.length, 3);
  for (const it of w.items) {
    assert.strictEqual(it.kind, "lever");
    assert.strictEqual(it.pulled, false);
  }
  assert.strictEqual(w.items[0].pos.x, 12);
  assert.strictEqual(w.items[0].pos.y, 8);
  assert.strictEqual(w.items[1].pos.x, 12);
  assert.strictEqual(w.items[1].pos.y, 24);
  assert.strictEqual(w.items[2].pos.x, 22);
  assert.strictEqual(w.items[2].pos.y, 16);

  const w14 = fromSave(save.of({ seed: 4, depth: 14, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w14.monsters.length, 0);
  assert.strictEqual(w14.items.length, 0);
  assert.strictEqual(w14.grid.at(33, 16), "stairs");
});

test("levers", () => {
  const grid = tileGrid.fromRows(["##########", "#........#", "#........#", "#........#", "#........#", "##########"]);
  const lever1 = item.of({ id: 20, kind: "lever", pos: point.of(2, 1) });
  const lever2 = item.of({ id: 21, kind: "lever", pos: point.of(1, 2) });
  const lever3 = item.of({ id: 22, kind: "lever", pos: point.of(2, 2) });
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const golem = actor.of({ id: 10, kind: "golem", pos: point.of(5, 2), stats: stats.of({ hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2, magicResist: 0 }), ready: 10000, mode: "dormant", size: 3 });
  const w = makeWorld({ grid, heroes: [heroAnn], monsters: [golem], items: [lever1, lever2, lever3] });

  let w1 = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
  assert.strictEqual(w1.heroes[0].actor.pos.y, 1);
  assert.strictEqual(w1.heroes[0].actor.ready, 400);
  assert.deepStrictEqual(w1.heroes[0].actor.last, { kind: "attack", dx: 1, dy: 0, at: 50, reach: 1 });
  const lever1p = w1.items.find((it) => it.id === 20);
  assert.strictEqual(lever1p.pulled, true);
  const golem1 = w1.monsters[0];
  assert.strictEqual(golem1.stats.attack, 6);
  assert.strictEqual(golem1.stats.defense, 6);
  assert.strictEqual(golem1.stats.magic, 3);
  assert.strictEqual(golem1.size, 2);
  assert.strictEqual(golem1.small, false);
  assert.strictEqual(w1.log[w1.log.length - 1], "Ann pulls a lever. The golem weakens!");

  let w2 = intend(w1, "Ann", intent.move(0, 1));
  w2 = advance(w2, 350);
  const golem2 = w2.monsters[0];
  assert.strictEqual(golem2.stats.attack, 3);
  assert.strictEqual(golem2.stats.defense, 3);
  assert.strictEqual(golem2.stats.magic, 1);
  assert.strictEqual(golem2.size, 1);

  let w3 = intend(w2, "Ann", intent.move(1, 1));
  w3 = advance(w3, 350);
  const golem3 = w3.monsters[0];
  assert.strictEqual(golem3.stats.attack, 1);
  assert.strictEqual(golem3.stats.defense, 1);
  assert.strictEqual(golem3.stats.magic, 0);
  assert.strictEqual(golem3.size, 1);
  assert.strictEqual(golem3.small, true);
  assert.strictEqual(golem3.pos.x, 5);
  assert.strictEqual(golem3.pos.y, 2);

  // pulled lever bumped again
  let w4 = intend(w3, "Ann", intent.move(1, 0));
  w4 = advance(w4, 350);
  assert.strictEqual(w4.heroes[0].actor.pos.x, 1);
  assert.strictEqual(w4.heroes[0].actor.pos.y, 1);
  assert.strictEqual(w4.heroes[0].actor.ready, 1450);
});

test("wakes", () => {
  const grid = tileGrid.fromRows(["##########", "#........#", "#........#", "#........#", "##########"]);

  // golem wakes
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const golem = actor.of({ id: 10, kind: "golem", pos: point.of(5, 1), stats: stats.of({ hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2, magicResist: 0 }), ready: 0, mode: "dormant", size: 3 });
  const w = makeWorld({ grid, heroes: [heroAnn], monsters: [golem] });
  const w1 = advance(w, 50);
  const golem1 = w1.monsters[0];
  assert.strictEqual(golem1.mode, "roam");
  assert.strictEqual(golem1.ready, 1650);
  assert.ok(w1.log.includes("The golem awakens!"));
  assert.strictEqual(golem1.pos.x, 4);

  // golem stays dormant
  const heroAnnD = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const golemD = actor.of({ id: 10, kind: "golem", pos: point.of(6, 1), stats: stats.of({ hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2, magicResist: 0 }), ready: 0, mode: "dormant", size: 3 });
  const wD = makeWorld({ grid, heroes: [heroAnnD], monsters: [golemD] });
  const wD1 = advance(wD, 50);
  const golemD1 = wD1.monsters[0];
  assert.strictEqual(golemD1.mode, "dormant");
  assert.strictEqual(golemD1.pos.x, 6);
  assert.strictEqual(golemD1.ready, 1650);
});

test("golem-dies", () => {
  const w = fromSave(save.of({ seed: 4, depth: 7, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  const wWithAnn = w.with({ heroes: [hero.of({ name: "Ann", actor: w.heroes[0].actor.with({ stats: stats.of({ hp: 24, maxHp: 24, attack: 40, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 }), pos: point.of(31, 16) }), pending: null, alive: true })] });
  const wGolemDead = wWithAnn.with({ monsters: [wWithAnn.monsters[0].with({ stats: stats.of({ hp: 1, maxHp: 40, attack: 12, defense: 0, range: 1, magic: 6, magicPower: 2, magicResist: 0 }), ready: 10000 }), ...wWithAnn.monsters.slice(1)], heroes: [wWithAnn.heroes[0].with({ actor: wWithAnn.heroes[0].actor.with({ stats: stats.of({ hp: 24, maxHp: 24, attack: 40, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 }), pos: point.of(31, 16) }) })] });

  let goodCount = 0;
  let wGolemDeadSuccess = null;
  for (let rng = 0; rng <= 39; rng++) {
    const wRng = wGolemDead.with({ rng });
    const w1 = advance(intend(wRng, "Ann", intent.move(1, 0)), 50);
    if (w1.monsters.length === 0 && w1.grid.at(33, 16) === "stairs") {
      const log = w1.log.join("\n");
      if (log.includes("The golem is slain.") && log.includes("The guardians crumble.") && log.includes("The way down opens!") && log.includes("Gold spills from the golem!")) {
        const goldItems = w1.items.filter((it) => it.kind === "gold");
        let ok = goldItems.length >= 1 && goldItems.length <= 5;
        let totalAmount = 0;
        const positions = new Set();
        if (ok) {
          for (const gi of goldItems) {
            totalAmount += gi.amount;
            const key = `${gi.pos.x},${gi.pos.y}`;
            if (positions.has(key)) ok = false;
            positions.add(key);
            if (w1.grid.at(gi.pos.x, gi.pos.y) !== "floor") ok = false;
            const minx = 32, maxx = 34;
            const miny = 15, maxy = 17;
            const dx = gi.pos.x < minx ? minx - gi.pos.x : gi.pos.x > maxx ? gi.pos.x - maxx : 0;
            const dy = gi.pos.y < miny ? miny - gi.pos.y : gi.pos.y > maxy ? gi.pos.y - maxy : 0;
            const dist = Math.max(dx, dy);
            if (dist < 1 || dist > 2) ok = false;
            if (!gi.flung || gi.flung.x !== 33 || gi.flung.y !== 16 || gi.flung.at !== 50) ok = false;
          }
          if (totalAmount < 25 || totalAmount > 75) ok = false;
        }
        if (ok) {
          goodCount++;
          wGolemDeadSuccess = w1;
        }
      }
    }
  }
  assert.ok(goodCount >= 1);

  const wDescend = advance(intend(wGolemDeadSuccess, "Ann", intent.descend()), 350);
  assert.strictEqual(wDescend.depth, 8);
});

test("misses", () => {
  const grid = tileGrid.fromRows(["######", "#....#", "######"]);

  // Ann attacks skeleton
  let missCount = 0;
  let hitCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
    const skeleton = actor.of({ id: 10, kind: "skeleton", pos: point.of(2, 1), stats: stats.of({ hp: 30, maxHp: 30, attack: 4, defense: 2, range: 1 }), ready: 10000 });
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [skeleton], rng });
    const w1 = advance(intend(w, "Ann", intent.attack(1, 0)), 50);
    const line = w1.log[w1.log.length - 1];
    const sk = w1.monsters[0];
    if (line === "Ann misses the skeleton.") {
      missCount++;
      assert.strictEqual(sk.stats.hp, 30);
    } else if (line.startsWith("Critical! Ann hits the skeleton for ")) {
      hitCount++;
      const n = parseInt(line.match(/for (\d+)\./)[1], 10);
      assert.strictEqual(sk.stats.hp, 30 - n);
    } else if (line.startsWith("Ann hits the skeleton for ")) {
      hitCount++;
      const n = parseInt(line.match(/for (\d+)\./)[1], 10);
      assert.strictEqual(sk.stats.hp, 30 - n);
    } else {
      throw new Error(`unexpected line: ${line}`);
    }
    assert.ok(!line.endsWith("for 0."));
  }
  assert.ok(missCount >= 1);
  assert.ok(hitCount >= 1);

  // skeleton attacks Ann
  missCount = 0;
  hitCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 10000 }), pending: null, alive: true });
    const skeleton = actor.of({ id: 10, kind: "skeleton", pos: point.of(2, 1), stats: stats.of({ hp: 30, maxHp: 30, attack: 4, defense: 2, range: 1 }), ready: 0 });
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [skeleton], rng });
    const w1 = advance(w, 50);
    const line = w1.log[w1.log.length - 1];
    const ann = w1.heroes[0];
    if (line === "The skeleton misses Ann.") {
      missCount++;
      assert.strictEqual(ann.actor.stats.hp, 24);
    } else if (line.startsWith("Critical! The skeleton hits Ann for ")) {
      hitCount++;
      const n = parseInt(line.match(/for (\d+)\./)[1], 10);
      assert.strictEqual(ann.actor.stats.hp, 24 - n);
    } else if (line.startsWith("The skeleton hits Ann for ")) {
      hitCount++;
      const n = parseInt(line.match(/for (\d+)\./)[1], 10);
      assert.strictEqual(ann.actor.stats.hp, 24 - n);
    } else {
      throw new Error(`unexpected line: ${line}`);
    }
  }
  assert.ok(missCount >= 1);
  assert.ok(hitCount >= 1);
});

test("rolls-advance", () => {
  const grid = tileGrid.fromRows(["######", "#....#", "######"]);

  // rng state advances by the two draws
  for (let rng = 0; rng <= 39; rng++) {
    const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
    const skeleton = actor.of({ id: 10, kind: "skeleton", pos: point.of(2, 1), stats: stats.of({ hp: 30, maxHp: 30, attack: 4, defense: 2, range: 1 }), ready: 10000 });
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [skeleton], rng });
    const w1 = advance(intend(w, "Ann", intent.attack(1, 0)), 50);
    assert.strictEqual(w1.rng, (rng + 2 * 0x6d2b79f5) >>> 0);
  }

  // 20 attacks in a row, skeleton reset to 30 before each
  let missCount = 0;
  let hitCount = 0;
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let skeleton = actor.of({ id: 10, kind: "skeleton", pos: point.of(2, 1), stats: stats.of({ hp: 30, maxHp: 30, attack: 4, defense: 2, range: 1 }), ready: 10000 });
  let w = makeWorld({ grid, heroes: [heroAnn], monsters: [skeleton], rng: 0 });
  for (let i = 0; i < 20; i++) {
    const w1 = advance(intend(w, "Ann", intent.attack(1, 0)), 50);
    const line = w1.log[w1.log.length - 1];
    if (line === "Ann misses the skeleton.") {
      missCount++;
    } else if (line.startsWith("Critical! Ann hits the skeleton for ")) {
      hitCount++;
    } else if (line.startsWith("Ann hits the skeleton for ")) {
      hitCount++;
    }
    skeleton = skeleton.with({ stats: stats.of({ hp: 30, maxHp: 30, attack: 4, defense: 2, range: 1 }) });
    w = makeWorld({ grid, heroes: [heroAnn], monsters: [skeleton], rng: w1.rng });
  }
  assert.ok(missCount >= 1);
  assert.ok(hitCount >= 1);
});

test("magic", () => {
  const grid = tileGrid.fromRows(["######", "#....#", "######"]);

  // size-1 golem hits Ann (golem attacks)
  let sevenCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 10000 }), pending: null, alive: true });
    const golem = actor.of({ id: 10, kind: "golem", pos: point.of(2, 1), stats: stats.of({ hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2, magicResist: 0 }), ready: 0, mode: "roam", size: 1 });
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [golem], rng });
    const w1 = advance(w, 50);
    const hp = w1.heroes[0].actor.stats.hp;
    if (hp === 7) sevenCount++;
  }
  assert.ok(sevenCount >= 1);

  // Ann with magicResist 1: hit gives 7 (unwarded) or 12 (warded)
  let wardCount = 0;
  let unwardCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 1 }), ready: 10000 }), pending: null, alive: true });
    const golem = actor.of({ id: 10, kind: "golem", pos: point.of(2, 1), stats: stats.of({ hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2, magicResist: 0 }), ready: 0, mode: "roam", size: 1 });
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [golem], rng });
    const w1 = advance(w, 50);
    const hp = w1.heroes[0].actor.stats.hp;
    if (hp === 12) wardCount++;
    else if (hp === 7) unwardCount++;
  }
  assert.ok(wardCount >= 1);
  assert.ok(unwardCount >= 1);
});

test("themes", () => {
  const w8 = fromSave(save.of({ seed: 3, depth: 8, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w8.monsters.length, 4);
  for (const m of w8.monsters) {
    if (m.kind === "blue-slime") {
      assert.deepStrictEqual(m.stats, { hp: 9, maxHp: 9, attack: 3, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    } else if (m.kind === "blue-snake") {
      assert.deepStrictEqual(m.stats, { hp: 7, maxHp: 7, attack: 4, defense: 0, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    } else {
      assert.strictEqual(m.kind, "skeleton");
      assert.deepStrictEqual(m.stats, { hp: 13, maxHp: 13, attack: 5, defense: 2, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    }
  }

  const w33 = fromSave(save.of({ seed: 3, depth: 33, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w33.monsters.length, 12);
  for (const m of w33.monsters) {
    if (m.kind === "worm") {
      assert.deepStrictEqual(m.stats, { hp: 27, maxHp: 27, attack: 9, defense: 4, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    } else if (m.kind === "fire-slime") {
      assert.deepStrictEqual(m.stats, { hp: 30, maxHp: 30, attack: 9, defense: 5, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    } else if (m.kind === "imp") {
      assert.deepStrictEqual(m.stats, { hp: 36, maxHp: 36, attack: 10, defense: 5, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    } else {
      assert.strictEqual(m.kind, "demon");
      assert.deepStrictEqual(m.stats, { hp: 48, maxHp: 48, attack: 11, defense: 6, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    }
  }

  const w15 = fromSave(save.of({ seed: 3, depth: 15, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w15.monsters.length, 4);
  for (const m of w15.monsters) {
    assert.ok(["beetle", "mummy", "cultist"].includes(m.kind));
    if (m.kind === "cultist") {
      assert.strictEqual(m.stats.range, 4);
    }
  }

  const w22 = fromSave(save.of({ seed: 3, depth: 22, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  for (const m of w22.monsters) {
    assert.ok(["spider", "ghost", "reaper"].includes(m.kind));
  }

  const w3 = fromSave(save.of({ seed: 3, depth: 3, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
  assert.strictEqual(w3.monsters.length, 8);
  for (const m of w3.monsters) {
    if (m.kind === "bat") {
      assert.deepStrictEqual(m.stats, { hp: 3, maxHp: 3, attack: 2, defense: 0, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    } else if (m.kind === "slime") {
      assert.deepStrictEqual(m.stats, { hp: 6, maxHp: 6, attack: 2, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    } else {
      assert.strictEqual(m.kind, "snake");
      assert.deepStrictEqual(m.stats, { hp: 5, maxHp: 5, attack: 3, defense: 0, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
    }
  }

  // seeds 0 to 19 at depth 5
  let totalArchers = 0;
  for (let seed = 0; seed <= 19; seed++) {
    const w5 = fromSave(save.of({ seed, depth: 5, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] }));
    assert.strictEqual(w5.monsters.length, 12);
    for (const m of w5.monsters) {
      assert.ok(["bat", "slime", "snake", "skeleton", "archer"].includes(m.kind));
      if (m.kind === "archer") {
        totalArchers++;
        assert.deepStrictEqual(m.stats, { hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4, magic: 0, magicPower: 1, magicResist: 0 });
      } else if (m.kind === "skeleton") {
        assert.deepStrictEqual(m.stats, { hp: 9, maxHp: 9, attack: 4, defense: 2, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
      }
    }
  }
  assert.ok(totalArchers >= 1);
  assert.ok(totalArchers <= 48);
});

test("saves", () => {
  const grid = tileGrid.fromRows(["##########", "#.>......#", "##########"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(7, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1, range: 1 }), ready: 0 }), pending: null, alive: false });
  const w = makeWorld({
    grid,
    heroes: [heroAnn, heroBob],
    monsters: [],
    items: [],
    entry: save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1 }) }, { name: "Bob", stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1, range: 1 }) }] }),
  });
  const s = toSave(w);
  assert.strictEqual(s.seed, 1);
  assert.strictEqual(s.depth, 1);
  assert.strictEqual(s.players.length, 2);
  assert.strictEqual(s.players[0].name, "Ann");
  assert.deepStrictEqual(s.players[0].stats, { hp: 20, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.strictEqual(s.players[1].name, "Bob");
  assert.deepStrictEqual(s.players[1].stats, { hp: 1, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });

  const s2 = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] });
  const wFromSave = fromSave(s2);
  assert.strictEqual(wFromSave.depth, 3);
  assert.strictEqual(wFromSave.time, 0);
  assert.strictEqual(wFromSave.state, "playing");
  assert.strictEqual(wFromSave.grid.width, 48);
  assert.strictEqual(wFromSave.grid.height, 32);
  assert.strictEqual(wFromSave.heroes.length, 1);
  assert.strictEqual(wFromSave.heroes[0].name, "Cy");
  assert.strictEqual(wFromSave.heroes[0].alive, true);
  assert.deepStrictEqual(wFromSave.heroes[0].actor.stats, { hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.ok(wFromSave.grid.open(wFromSave.heroes[0].actor.pos.x, wFromSave.heroes[0].actor.pos.y));
  assert.deepStrictEqual(wFromSave.entry, s2);

  const wFromSave2 = fromSave(s2);
  assert.deepStrictEqual(wFromSave, wFromSave2);

  const s3 = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 0, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] });
  const wFromSave3 = fromSave(s3);
  assert.strictEqual(wFromSave3.heroes[0].actor.stats.hp, 1);
});

test("refuses", () => {
  assert.throws(() => newGame(-1), TypeError);
  assert.throws(() => newGame(2.5), TypeError);
  const w = newGame(1);
  assert.throws(() => advance(w, 0), TypeError);
  assert.throws(() => advance(w, 1.5), TypeError);
  assert.throws(() => advance(w, 1001), TypeError);
  assert.throws(() => intend(w, "Ann", { kind: "wait" }), TypeError);
  assert.throws(() => join(w, 5), TypeError);
  assert.throws(() => fromSave({}), TypeError);
  assert.throws(() => advance({}, 50), TypeError);
});

test("world/valid", () => {
  const grid = tileGrid.fromRows(["#####", "#####", "#####"]);
  const ann = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS), ready: 0 });
  const gItem = item.of({ id: 2, kind: "gold", pos: point.of(3, 1), amount: 1 });
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const w = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry });
  assert.strictEqual(w.seed, 1);
  assert.strictEqual(w.depth, 1);
  assert.strictEqual(w.state, "playing");
  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.heroes));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));

  const badState = { seed: 1, rng: 1, depth: 1, time: 0, state: "dead", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  assert.throws(() => world.of(badState), TypeError);

  const depth33 = { seed: 1, rng: 1, depth: 33, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  const w33 = world.of(depth33);
  assert.strictEqual(w33.depth, 33);

  const badDepth = { seed: 1, rng: 1, depth: 34, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  assert.throws(() => world.of(badDepth), TypeError);

  const badTime = { seed: 1, rng: 1, depth: 1, time: -1, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  assert.throws(() => world.of(badTime), TypeError);

  const badVisible = { seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(4, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  assert.throws(() => world.of(badVisible), TypeError);

  const badMonsterKind = { seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [actor.of({ id: 1, kind: "hero", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS), ready: 0 })], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  assert.throws(() => world.of(badMonsterKind), TypeError);

  const fiveHeroes = { seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann, ann, ann, ann, ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  assert.throws(() => world.of(fiveHeroes), TypeError);

  const twoHeroesNamedAnn = { seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann, hero.of({ name: "Ann", actor: actor.of({ id: 2, kind: "hero", pos: point.of(3, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true })], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
  assert.throws(() => world.of(twoHeroesNamedAnn), TypeError);

  const log51 = [];
  for (let i = 0; i < 51; i++) log51.push("x");
  const badLog = { seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: log51, entry };
  assert.throws(() => world.of(badLog), TypeError);

  const noGold = { seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), log: [] };
  assert.throws(() => world.of(noGold), TypeError);

  const noEntry = { seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [] };
  assert.throws(() => world.of(noEntry), TypeError);

  const w2 = w.with({ time: 9 });
  assert.strictEqual(w2.time, 9);
  assert.strictEqual(w.time, 0);

  const w3 = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry });
  assert.deepStrictEqual(w, w3);

  assert.strictEqual(Object.hasOwn(w, "with"), false);
  assert.strictEqual(Object.hasOwn(w, "data"), false);
});

test("world/data", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const ann = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0, held: 300, facing: "left", last: { kind: "attack", dx: -1, dy: 0, at: 50, reach: 1 } }), pending: intent.move(1, 0), alive: true, offer: 12 });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS), ready: 0, last: { kind: "move", dx: 0, dy: 1, at: 20, reach: 1 } });
  const gItem = item.of({ id: 2, kind: "gold", pos: point.of(3, 1), amount: 1 });
  const swordItem = item.of({ id: 12, kind: "sword", pos: point.of(3, 1), price: 30 });
  const leverItem = item.of({ id: 13, kind: "lever", pos: point.of(2, 1), pulled: true });
  const flungItem = item.of({ id: 14, kind: "gold", pos: point.of(1, 1), amount: 5, flung: { x: 1, y: 1, at: 40 } });
  const golem = actor.of({ id: 3, kind: "golem", pos: point.of(2, 1), stats: stats.of({ hp: 40, maxHp: 40, attack: 16, defense: 12, range: 1 }), ready: 0, mode: "dormant", size: 2, small: true, slow: 1, aim: { dx: -1, dy: 1 } });
  const archer = actor.of({ id: 4, kind: "archer", pos: point.of(3, 1), stats: stats.of({ hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 }), ready: 0, last: { kind: "attack", dx: 1, dy: 1, at: 30, reach: 3 } });
  const visible = mask.of(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const w = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster, golem, archer], items: [gItem, swordItem, leverItem, flungItem], visible, explored: mask.empty(5, 3), gold: 0, log: [], entry });

  const data = JSON.parse(JSON.stringify(w.data()));
  const wFromData = world.fromData(data);
  assert.deepStrictEqual(w, wFromData);

  assert.deepStrictEqual(w.data().grid, ["#####", "#...#", "#####"]);
  assert.strictEqual(w.data().visible[1], "01000");
  assert.strictEqual(w.data().items[1].price, 30);
  assert.strictEqual(w.data().heroes[0].offer, 12);
  assert.strictEqual(w.data().items[2].pulled, true);
  assert.deepStrictEqual(w.data().items[3].flung, { x: 1, y: 1, at: 40 });
  assert.strictEqual(w.data().monsters[2].last.reach, 3);
  assert.strictEqual(w.data().monsters[2].stats.range, 4);

  assert.throws(() => world.fromData({}), TypeError);

  const badData = w.data();
  badData.depth = 34;
  assert.throws(() => world.fromData(badData), TypeError);
});

test("intent/valid", () => {
  const m = intent.move(0, -1);
  assert.strictEqual(m.kind, "move");
  assert.strictEqual(m.dx, 0);
  assert.strictEqual(m.dy, -1);
  assert.ok(Object.isFrozen(m));

  // diagonal moves accepted
  assert.ok(Object.isFrozen(intent.move(1, 1)));
  assert.ok(Object.isFrozen(intent.move(-1, 1)));

  const a = intent.attack(1, 0);
  assert.strictEqual(a.kind, "attack");
  assert.strictEqual(a.dx, 1);
  assert.strictEqual(a.dy, 0);

  // attack() and attack(0,0) accepted
  assert.strictEqual(intent.attack().kind, "attack");
  assert.strictEqual(intent.attack().dx, 0);
  assert.strictEqual(intent.attack().dy, 0);
  assert.strictEqual(intent.attack(0, 0).kind, "attack");
  assert.ok(Object.isFrozen(intent.attack(-1, -1)));

  const f = intent.face(1, -1);
  assert.strictEqual(f.kind, "face");
  assert.strictEqual(f.dx, 1);
  assert.strictEqual(f.dy, -1);

  assert.strictEqual(intent.use().kind, "use");
  assert.strictEqual(intent.use().dx, 0);
  assert.strictEqual(intent.use().dy, 0);
  assert.strictEqual(intent.wait().kind, "wait");
  assert.strictEqual(intent.wait().dx, 0);
  assert.strictEqual(intent.wait().dy, 0);

  const d = intent.descend();
  assert.strictEqual(d.kind, "descend");
  assert.strictEqual(d.dx, 0);
  assert.strictEqual(d.dy, 0);

  assert.throws(() => intent.move(0, 0), TypeError);
  assert.throws(() => intent.move(2, 0), TypeError);
  assert.throws(() => intent.move("1", 0), TypeError);
  assert.throws(() => intent.face(0, 0), TypeError);
  assert.throws(() => intent.face(0, 2), TypeError);
  assert.throws(() => intent.attack(2, 0), TypeError);
  assert.throws(() => intent.attack(1), TypeError);

  assert.deepStrictEqual(intent.KINDS, ["move", "attack", "use", "wait", "descend", "face"]);
});

test("save/valid", () => {
  const s = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] });
  assert.strictEqual(s.seed, 9);
  assert.strictEqual(s.depth, 3);
  assert.strictEqual(s.players.length, 1);
  assert.strictEqual(s.players[0].name, "Cy");
  assert.deepStrictEqual(s.players[0].stats, { hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.ok(Object.isFrozen(s));
  assert.ok(Object.isFrozen(s.players));
  assert.deepStrictEqual(save.parse(s.text()), s);
  assert.strictEqual(s.data().format, "crawl-save");

  const s33 = save.of({ seed: 9, depth: 33, players: [] });
  assert.strictEqual(s33.depth, 33);

  assert.throws(() => save.of({ seed: 9, depth: 34, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 0, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: -1, depth: 3, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "A", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }, { name: "B", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }, { name: "C", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }, { name: "D", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }, { name: "E", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }, { name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "AAAAAAAAAAAAAAAAA", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: " Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "A\nB", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: {} }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: { hp: 5, maxHp: 3, attack: 0, defense: 0 } }] }), TypeError);

  assert.throws(() => save.parse("nope"), TypeError);
  assert.throws(() => save.parse("{}"), TypeError);

  const d = s.data();
  d.version = 2;
  assert.throws(() => save.parse(JSON.stringify(d)), TypeError);

  assert.strictEqual(save.isName("Ann"), true);
  assert.strictEqual(save.isName(""), false);
  assert.strictEqual(save.isName("Ann "), false);
  assert.strictEqual(save.isName(5), false);

  assert.ok(save.of({ seed: 9, depth: 3, players: [] }));
  assert.ok(save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: { hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1 } }] }));
});

test("bestiary/valid", () => {
  assert.strictEqual(bestiary.KINDS.length, 18);
  assert.strictEqual(bestiary.KINDS[0], "bat");
  assert.strictEqual(bestiary.KINDS[17], "golem");
  assert.ok(Object.isFrozen(bestiary.KINDS));

  assert.deepStrictEqual(bestiary.entry("archer"), { kind: "archer", group: "undead", hp: 7, attack: 3, defense: 1, magic: 0, magicPower: 1, range: 4, slows: false, reach: 7, step: 400, strike: 700, size: 1 });
  assert.ok(Object.isFrozen(bestiary.entry("archer")));
  assert.strictEqual(bestiary.entry("blue-snake").slows, true);
  assert.strictEqual(bestiary.entry("golem").size, 3);
  assert.strictEqual(bestiary.entry("golem").step, 1600);
  assert.strictEqual(bestiary.entry("golem").defense, 12);
  assert.strictEqual(bestiary.entry("cultist").range, 4);

  assert.strictEqual(bestiary.group("hero"), "human");
  assert.strictEqual(bestiary.group("imp"), "demon");
  assert.strictEqual(bestiary.group("golem"), "construct");

  assert.strictEqual(bestiary.hostile("hero", "bat"), true);
  assert.strictEqual(bestiary.hostile("skeleton", "hero"), true);
  assert.strictEqual(bestiary.hostile("hero", "hero"), false);
  assert.strictEqual(bestiary.hostile("bat", "skeleton"), false);
  assert.strictEqual(bestiary.hostile("imp", "skeleton"), false);
  assert.strictEqual(bestiary.hostile("demon", "worm"), true);
  assert.strictEqual(bestiary.hostile("fire-slime", "imp"), true);

  assert.strictEqual(bestiary.flees("worm", "demon"), true);
  assert.strictEqual(bestiary.flees("demon", "worm"), false);
  assert.strictEqual(bestiary.flees("worm", "hero"), false);

  assert.throws(() => bestiary.entry("hero"), TypeError);
  assert.throws(() => bestiary.entry("dragon"), TypeError);
  assert.throws(() => bestiary.group(5), TypeError);
  assert.throws(() => bestiary.hostile("bat", "dragon"), TypeError);
});

test("level/valid", () => {
  assert.strictEqual(level.MAX_DEPTH, 33);
  assert.strictEqual(level.MAX_LEVEL, 25);
  assert.deepStrictEqual(level.THEMES, ["dungeon", "frozen", "arid", "temple", "magma", "interior"]);
  assert.deepStrictEqual(level.DUNGEON_THEMES, ["dungeon", "frozen", "arid", "temple", "magma"]);
  assert.ok(Object.isFrozen(level.THEMES));
  assert.ok(Object.isFrozen(level.DUNGEON_THEMES));

  assert.strictEqual(level.kind(1), "dungeon");
  assert.strictEqual(level.kind(5), "dungeon");
  assert.strictEqual(level.kind(8), "dungeon");
  assert.strictEqual(level.kind(33), "dungeon");
  assert.strictEqual(level.kind(6), "interior");
  assert.strictEqual(level.kind(13), "interior");
  assert.strictEqual(level.kind(20), "interior");
  assert.strictEqual(level.kind(27), "interior");
  assert.strictEqual(level.kind(7), "boss");
  assert.strictEqual(level.kind(14), "boss");
  assert.strictEqual(level.kind(21), "boss");
  assert.strictEqual(level.kind(28), "boss");

  assert.strictEqual(level.theme(1), "dungeon");
  assert.strictEqual(level.theme(6), "interior");
  assert.strictEqual(level.theme(7), "dungeon");
  assert.strictEqual(level.theme(8), "frozen");
  assert.strictEqual(level.theme(15), "arid");
  assert.strictEqual(level.theme(26), "temple");
  assert.strictEqual(level.theme(28), "temple");
  assert.strictEqual(level.theme(29), "magma");
  assert.strictEqual(level.theme(33), "magma");

  assert.deepStrictEqual(level.blend(7), ["dungeon", "frozen"]);
  assert.ok(Object.isFrozen(level.blend(7)));
  assert.deepStrictEqual(level.blend(28), ["temple", "magma"]);
  assert.strictEqual(level.blend(6), null);
  assert.strictEqual(level.blend(8), null);

  assert.strictEqual(level.tier(5), 0);
  assert.strictEqual(level.tier(6), 0);
  assert.strictEqual(level.tier(7), 0);
  assert.strictEqual(level.tier(8), 1);
  assert.strictEqual(level.tier(33), 4);

  assert.strictEqual(level.stage(1), 1);
  assert.strictEqual(level.stage(12), 5);
  assert.strictEqual(level.stage(13), 6);
  assert.strictEqual(level.stage(14), 7);
  assert.strictEqual(level.stage(29), 1);

  assert.strictEqual(level.round(6), 1);
  assert.strictEqual(level.round(7), 1);
  assert.strictEqual(level.round(27), 4);
  assert.strictEqual(level.round(8), 0);

  assert.strictEqual(level.number(1), 1);
  assert.strictEqual(level.number(5), 5);
  assert.strictEqual(level.number(8), 6);
  assert.strictEqual(level.number(12), 10);
  assert.strictEqual(level.number(33), 25);
  assert.strictEqual(level.number(6), 0);
  assert.strictEqual(level.number(7), 0);

  assert.strictEqual(level.label(8), "Level 6");
  assert.strictEqual(level.label(13), "Shop");
  assert.strictEqual(level.label(14), "Lair");

  assert.throws(() => level.kind(0), TypeError);
  assert.throws(() => level.theme(34), TypeError);
  assert.throws(() => level.tier(1.5), TypeError);
  assert.throws(() => level.blend(40), TypeError);
  assert.throws(() => level.number("3"), TypeError);
  assert.throws(() => level.label(null), TypeError);
});
