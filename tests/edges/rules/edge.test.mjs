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

const HERO_STATS = { hp: 24, maxHp: 24, attack: 4, defense: 1 };
const MONSTER_STATS = { hp: 5, maxHp: 5, attack: 2, defense: 0 };

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
  assert.deepStrictEqual(h.actor.stats, { hp: 24, maxHp: 24, attack: 4, defense: 1 });
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
  assert.deepStrictEqual(w.entry.players[0].stats, { hp: 24, maxHp: 24, attack: 4, defense: 1 });
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
  const intents = [intent.move(1, 0), intent.attack(1, 0), intent.use(), intent.wait()];
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
});

test("picks-up", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);

  let heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  let gItem = item.of({ id: 1, kind: "gold", pos: point.of(2, 1), amount: 7 });
  let w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [gItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.items.length, 0);
  assert.strictEqual(w.gold, 7);

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 10, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  let pItem = item.of({ id: 1, kind: "potion", pos: point.of(2, 1), amount: 0 });
  w = makeWorld({ grid, heroes: [heroAnn], monsters: [], items: [pItem] });
  w = advance(intend(w, "Ann", intent.move(1, 0)), 50);
  assert.strictEqual(w.heroes[0].actor.stats.hp, 18);

  heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
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
});

test("attacks", () => {
  const grid = tileGrid.fromRows(["######", "#....#", "######"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const bat = actor.of({ id: 1, kind: "bat", pos: point.of(2, 1), stats: stats.of({ hp: 1, maxHp: 5, attack: 2, defense: 0 }), ready: 10000 });

  let goneCount = 0;
  let staysCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [bat], rng });
    const w1 = advance(intend(w, "Ann", intent.move(1, 0)), 50);
    assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
    assert.strictEqual(w1.heroes[0].actor.pos.y, 1);
    const batStill = w1.monsters.find((m) => m.kind === "bat");
    if (!batStill) goneCount++;
    else if (batStill.stats.hp === 1) staysCount++;
  }
  assert.ok(goneCount >= 1);
  assert.ok(staysCount >= 1);

  goneCount = 0;
  staysCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [bat], rng });
    const w1 = advance(intend(w, "Ann", intent.attack(1, 0)), 50);
    assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
    const batStill = w1.monsters.find((m) => m.kind === "bat");
    if (!batStill) goneCount++;
    else if (batStill.stats.hp === 1) staysCount++;
  }
  assert.ok(goneCount >= 1);
  assert.ok(staysCount >= 1);

  const w = makeWorld({ grid, heroes: [heroAnn], monsters: [bat], rng: 1 });
  const w1 = advance(intend(w, "Ann", intent.attack(-1, 0)), 50);
  assert.strictEqual(w1.heroes[0].actor.pos.x, 1);
  assert.strictEqual(w1.heroes[0].actor.pos.y, 1);
  assert.strictEqual(w1.heroes[0].actor.ready, 250);
  assert.strictEqual(w1.monsters.length, 1);
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

test("dies", () => {
  const grid = tileGrid.fromRows(["#########", "#.......#", "#########"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 1, maxHp: 24, attack: 4, defense: 0 }), ready: 0 }), pending: null, alive: true });
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(7, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: null, alive: true });
  const demon = actor.of({ id: 10, kind: "demon", pos: point.of(2, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 6, defense: 1 }), ready: 0 });

  let deadCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn, heroBob], monsters: [demon], rng });
    const w1 = advance(w, 50);
    const ann = w1.heroes.find((h) => h.name === "Ann");
    const bob = w1.heroes.find((h) => h.name === "Bob");
    if (!ann.alive && ann.actor.stats.hp === 0 && bob.alive && w1.depth === 1) deadCount++;
  }
  assert.ok(deadCount >= 1);

  const deadAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 0 }), ready: 0 }), pending: intent.move(1, 0), alive: false });
  const wDead = makeWorld({ grid, heroes: [deadAnn], monsters: [] });
  const wDeadIntended = intend(wDead, "Ann", intent.move(1, 0));
  assert.strictEqual(wDeadIntended, wDead);
});

test("wipe", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 1, maxHp: 24, attack: 4, defense: 0 }), ready: 0 }), pending: null, alive: true });
  const demon = actor.of({ id: 10, kind: "demon", pos: point.of(2, 1), stats: stats.of({ hp: 5, maxHp: 5, attack: 6, defense: 1 }), ready: 0 });
  const entry = save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of(HERO_STATS) }] });

  let wipeCount = 0;
  for (let rng = 0; rng <= 39; rng++) {
    const w = makeWorld({ grid, heroes: [heroAnn], monsters: [demon], rng, gold: 3, entry });
    const w1 = advance(w, 50);
    if (w1.depth === 1 && w1.grid.width === 48 && w1.grid.height === 32 && w1.heroes[0].alive && w1.heroes[0].actor.stats.hp === 24 && w1.heroes[0].actor.stats.maxHp === 24 && w1.time === 50 && w1.gold === 3 && w1.log[w1.log.length - 1] === "The party has fallen. Depth 1 begins again.") {
      wipeCount++;
    }
  }
  assert.ok(wipeCount >= 1);
});

test("descends", () => {
  const grid = tileGrid.fromRows(["##########", "#.>......#", "##########"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(7, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: false });

  let w = makeWorld({
    grid,
    heroes: [heroAnn, heroBob],
    monsters: [],
    items: [],
    entry: save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) }, { name: "Bob", stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }) }] }),
  });

  w = advance(w, 50);
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
  assert.strictEqual(w.log[w.log.length - 1], "The party descends to depth 2.");

  const heroAnn8 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(8, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBob8 = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: false });
  const w8 = makeWorld({
    grid,
    heroes: [heroAnn8, heroBob8],
    monsters: [],
    items: [],
    entry: save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) }, { name: "Bob", stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }) }] }),
  });
  const w8after = advance(w8, 50);
  assert.strictEqual(w8after.depth, 1);

  const heroAnn5 = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(2, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const w5 = makeWorld({
    grid,
    heroes: [heroAnn5],
    monsters: [],
    items: [],
    depth: 5,
    gold: 5,
    entry: save.of({ seed: 1, depth: 5, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) }] }),
  });
  const w5after = advance(w5, 50);
  assert.strictEqual(w5after.state, "won");
  assert.ok(w5after.log[w5after.log.length - 1].startsWith("The party escapes the dungeon with"));
  assert.ok(w5after.log[w5after.log.length - 1].endsWith("gold!"));
  const w5later = advance(w5after, 50);
  assert.strictEqual(w5later.state, "won");
  assert.strictEqual(w5later.time, 100);
});

test("saves", () => {
  const grid = tileGrid.fromRows(["##########", "#.>......#", "##########"]);
  const heroAnn = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(7, 1), stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const heroBob = hero.of({ name: "Bob", actor: actor.of({ id: 1, kind: "hero", pos: point.of(1, 1), stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: false });
  const w = makeWorld({
    grid,
    heroes: [heroAnn, heroBob],
    monsters: [],
    items: [],
    entry: save.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: stats.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) }, { name: "Bob", stats: stats.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }) }] }),
  });
  const s = toSave(w);
  assert.strictEqual(s.seed, 1);
  assert.strictEqual(s.depth, 1);
  assert.strictEqual(s.players.length, 2);
  assert.strictEqual(s.players[0].name, "Ann");
  assert.deepStrictEqual(s.players[0].stats, { hp: 20, maxHp: 24, attack: 4, defense: 1 });
  assert.strictEqual(s.players[1].name, "Bob");
  assert.deepStrictEqual(s.players[1].stats, { hp: 1, maxHp: 24, attack: 4, defense: 1 });

  const s2 = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });
  const wFromSave = fromSave(s2);
  assert.strictEqual(wFromSave.depth, 3);
  assert.strictEqual(wFromSave.time, 0);
  assert.strictEqual(wFromSave.state, "playing");
  assert.strictEqual(wFromSave.grid.width, 48);
  assert.strictEqual(wFromSave.grid.height, 32);
  assert.strictEqual(wFromSave.heroes.length, 1);
  assert.strictEqual(wFromSave.heroes[0].name, "Cy");
  assert.strictEqual(wFromSave.heroes[0].alive, true);
  assert.deepStrictEqual(wFromSave.heroes[0].actor.stats, { hp: 10, maxHp: 30, attack: 6, defense: 2 });
  assert.ok(wFromSave.grid.open(wFromSave.heroes[0].actor.pos.x, wFromSave.heroes[0].actor.pos.y));
  assert.deepStrictEqual(wFromSave.entry, s2);

  const wFromSave2 = fromSave(s2);
  assert.deepStrictEqual(wFromSave, wFromSave2);

  const s3 = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 0, maxHp: 30, attack: 6, defense: 2 }) }] });
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

  const badDepth = { seed: 1, rng: 1, depth: 6, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible: mask.empty(5, 3), explored: mask.empty(5, 3), gold: 0, log: [], entry };
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
  const ann = hero.of({ name: "Ann", actor: actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: stats.of(HERO_STATS), ready: 0 }), pending: intent.move(1, 0), alive: true });
  const monster = actor.of({ id: 1, kind: "slime", pos: point.of(2, 1), stats: stats.of(MONSTER_STATS), ready: 0 });
  const gItem = item.of({ id: 2, kind: "gold", pos: point.of(3, 1), amount: 1 });
  const visible = mask.of(5, 3, [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false]);
  const entry = save.of({ seed: 1, depth: 1, players: [] });
  const w = world.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [monster], items: [gItem], visible, explored: mask.empty(5, 3), gold: 0, log: [], entry });

  const data = JSON.parse(JSON.stringify(w.data()));
  const wFromData = world.fromData(data);
  assert.deepStrictEqual(w, wFromData);

  assert.deepStrictEqual(w.data().grid, ["#####", "#...#", "#####"]);
  assert.strictEqual(w.data().visible[1], "01000");

  assert.throws(() => world.fromData({}), TypeError);

  const badData = w.data();
  badData.depth = 9;
  assert.throws(() => world.fromData(badData), TypeError);
});

test("intent/valid", () => {
  const m = intent.move(0, -1);
  assert.strictEqual(m.kind, "move");
  assert.strictEqual(m.dx, 0);
  assert.strictEqual(m.dy, -1);
  assert.ok(Object.isFrozen(m));

  const a = intent.attack(1, 0);
  assert.strictEqual(a.kind, "attack");
  assert.strictEqual(a.dx, 1);
  assert.strictEqual(a.dy, 0);

  assert.strictEqual(intent.use().kind, "use");
  assert.strictEqual(intent.use().dx, 0);
  assert.strictEqual(intent.use().dy, 0);
  assert.strictEqual(intent.wait().kind, "wait");
  assert.strictEqual(intent.wait().dx, 0);
  assert.strictEqual(intent.wait().dy, 0);

  assert.throws(() => intent.move(1, 1), TypeError);
  assert.throws(() => intent.move(0, 0), TypeError);
  assert.throws(() => intent.move(2, 0), TypeError);
  assert.throws(() => intent.move("1", 0), TypeError);
  assert.throws(() => intent.attack(0, 0), TypeError);

  assert.deepStrictEqual(intent.KINDS, ["move", "attack", "use", "wait"]);
});

test("save/valid", () => {
  const s = save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });
  assert.strictEqual(s.seed, 9);
  assert.strictEqual(s.depth, 3);
  assert.strictEqual(s.players.length, 1);
  assert.strictEqual(s.players[0].name, "Cy");
  assert.deepStrictEqual(s.players[0].stats, { hp: 10, maxHp: 30, attack: 6, defense: 2 });
  assert.ok(Object.isFrozen(s));
  assert.ok(Object.isFrozen(s.players));
  assert.deepStrictEqual(save.parse(s.text()), s);
  assert.strictEqual(s.data().format, "crawl-save");

  assert.throws(() => save.of({ seed: 9, depth: 6, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: -1, depth: 3, players: [] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "A", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }, { name: "B", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }, { name: "C", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }, { name: "D", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }, { name: "E", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }, { name: "Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "AAAAAAAAAAAAAAAAA", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: " Cy", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "A\nB", stats: stats.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] }), TypeError);
  assert.throws(() => save.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: {} }] }), TypeError);

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
});
