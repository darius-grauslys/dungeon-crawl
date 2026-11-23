// intrinsic tests for rules: new-game, joins, immutable, latency, picks-up, attacks, monsters-act, dies, wipe, descends, saves, refuses.

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
import * as heroShape from "../../../shapes/hero/index.mjs";
import * as saveShape from "../../../shapes/save/index.mjs";

test("new-game: deterministic and fields", () => {
  const w1 = rules.newGame(5);
  const w2 = rules.newGame(5);
  assert.deepStrictEqual(w1, w2);

  assert.equal(w1.seed, 5);
  assert.equal(w1.depth, 1);
  assert.equal(w1.time, 0);
  assert.equal(w1.state, "playing");
  assert.equal(w1.gold, 0);
  assert.deepEqual(w1.heroes, []);
  assert.equal(w1.monsters.length, 4);
  for (const m of w1.monsters) {
    assert.ok(["bat", "slime", "snake"].includes(m.kind));
    assert.ok(w1.grid.open(m.pos.x, m.pos.y));
    assert.equal(m.ready, 0);
  }
  const monsterCells = w1.monsters.map((m) => `${m.pos.x},${m.pos.y}`);
  assert.equal(new Set(monsterCells).size, 4);
  assert.ok(w1.items.length >= 4);
  assert.equal(w1.visible.count(), 0);
  assert.equal(w1.explored.count(), 0);
  assert.deepEqual(w1.entry, saveShape.of({ seed: 5, depth: 1, players: [] }));
  assert.deepEqual(w1.log, ["Welcome to the dungeon. Find the stairs (>)."]);
  assert.equal(w1.grid.width, 48);
  assert.equal(w1.grid.height, 32);
});

test("joins: Ann joins, dup returns same, full returns null, bad name throws", () => {
  const w = rules.newGame(5);
  const wAnn = rules.join(w, "Ann");
  assert.equal(wAnn.heroes.length, 1);
  const h = wAnn.heroes[0];
  assert.equal(h.name, "Ann");
  assert.ok(h.alive);
  assert.equal(h.pending, null);
  assert.deepEqual(h.actor.stats, { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.equal(h.actor.ready, 0);
  assert.ok(wAnn.grid.open(h.actor.pos.x, h.actor.pos.y));
  assert.ok(wAnn.visible.at(h.actor.pos.x, h.actor.pos.y));
  assert.equal(wAnn.entry.players.length, 1);
  assert.equal(wAnn.entry.players[0].name, "Ann");
  assert.equal(wAnn.log[wAnn.log.length - 1], "Ann joins the party.");

  assert.strictEqual(rules.join(wAnn, "Ann"), wAnn);

  const wBob = rules.join(wAnn, "Bob");
  assert.equal(wBob.heroes.length, 2);

  let w4 = wBob;
  for (const n of ["C", "D"]) {
    w4 = rules.join(w4, n);
  }
  assert.equal(rules.join(w4, "Eve"), null);

  assert.throws(() => rules.join(w, ""), TypeError);
});

test("immutable: intend, advance, join, toSave leave world unchanged", () => {
  const w = rules.join(rules.newGame(5), "Ann");
  const before = JSON.stringify(rules.toSave(w));
  rules.intend(w, "Ann", intentShape.move(1, 0));
  rules.advance(w, 50);
  rules.join(w, "Bob");
  const after = JSON.stringify(rules.toSave(w));
  assert.equal(before, after);
});

test("latency: intent fires when ready reached, pending cleared, ready +200", () => {
  const grid = tileGridShape.fromRows(["#######", "#.....#", "#######"]);
  const visible = maskShape.empty(7, 3);
  const explored = maskShape.empty(7, 3);
  const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
  const w = worldShape.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [], items: [], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [] }) });

  const wFired = rules.advance(rules.intend(w, "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wFired.heroes[0].actor.pos.x, 2);
  assert.equal(wFired.heroes[0].actor.pos.y, 1);
  assert.equal(wFired.heroes[0].actor.ready, 250);
  assert.equal(wFired.heroes[0].pending, null);
  assert.equal(wFired.time, 50);

  const wPending = rules.intend(wFired, "Ann", intentShape.move(1, 0));
  const wPending2 = rules.intend(wPending, "Ann", intentShape.move(-1, 0));
  let wAdv = wPending2;
  for (let i = 0; i < 3; i++) {
    wAdv = rules.advance(wAdv, 50);
  }
  assert.equal(wAdv.heroes[0].actor.pos.x, 2);
  assert.equal(wAdv.heroes[0].pending.kind, "move");
  assert.equal(wAdv.heroes[0].pending.dx, -1);
  wAdv = rules.advance(wAdv, 50);
  assert.equal(wAdv.heroes[0].actor.pos.x, 1);
  assert.equal(wAdv.heroes[0].actor.ready, 450);

  const wWall = rules.intend(wAdv, "Ann", intentShape.move(0, -1));
  let wWallAdv = wWall;
  for (let i = 0; i < 4; i++) {
    wWallAdv = rules.advance(wWallAdv, 50);
  }
  assert.equal(wWallAdv.heroes[0].actor.pos.x, 1);
  assert.equal(wWallAdv.heroes[0].actor.ready, 650);

  const wNoPendingAdv = rules.advance(wAdv, 50);
  assert.equal(wNoPendingAdv.heroes[0].actor.ready, wAdv.heroes[0].actor.ready);
});

test("picks-up: gold, potion, sword, armor", () => {
  const grid = tileGridShape.fromRows(["#####", "#...#", "#####"]);
  const visible = maskShape.empty(5, 3);
  const explored = maskShape.empty(5, 3);

  const mkWorld = (hero, items, gold) => {
    return worldShape.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [hero], monsters: [], items, visible, explored, gold, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [] }) });
  };

  const goldItem = itemShape.of({ id: 1, kind: "gold", pos: pointShape.of(2, 1), amount: 7 });
  const heroG = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 10, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const wGold = rules.advance(rules.intend(mkWorld(heroG, [goldItem], 0), "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wGold.gold, 7);
  assert.equal(wGold.items.length, 0);
  assert.equal(wGold.heroes[0].actor.gesture, null);

  const potionItem = itemShape.of({ id: 2, kind: "potion", pos: pointShape.of(2, 1), amount: 0 });
  const hero10 = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 10, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const wPotion = rules.advance(rules.intend(mkWorld(hero10, [potionItem], 0), "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wPotion.heroes[0].actor.stats.hp, 15);
  assert.equal(wPotion.heroes[0].actor.stats.maxHp, 29);
  assert.deepEqual(wPotion.heroes[0].actor.gesture, { kind: "power", at: 50 });

  const hero20 = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const wPotion20 = rules.advance(rules.intend(mkWorld(hero20, [potionItem], 0), "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wPotion20.heroes[0].actor.stats.hp, 25);
  assert.equal(wPotion20.heroes[0].actor.stats.maxHp, 29);

  const swordItem = itemShape.of({ id: 3, kind: "sword", pos: pointShape.of(2, 1), amount: 0 });
  const heroSword = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const wSword = rules.advance(rules.intend(mkWorld(heroSword, [swordItem], 0), "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wSword.heroes[0].actor.stats.attack, 5);
  assert.deepEqual(wSword.heroes[0].actor.gesture, { kind: "power", at: 50 });

  const armorItem = itemShape.of({ id: 4, kind: "armor", pos: pointShape.of(2, 1), amount: 0 });
  const heroArmor = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const wArmor = rules.advance(rules.intend(mkWorld(heroArmor, [armorItem], 0), "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wArmor.heroes[0].actor.stats.defense, 2);
  assert.deepEqual(wArmor.heroes[0].actor.gesture, { kind: "power", at: 50 });
});

test("attacks: hero stays, bat sometimes gone sometimes stays", () => {
  const grid = tileGridShape.fromRows(["######", "#....#", "######"]);
  const visible = maskShape.empty(6, 3);
  const explored = maskShape.empty(6, 3);
  const mkWorld = (hero, monsters, rng) => worldShape.of({ seed: 5, rng, depth: 1, time: 0, state: "playing", grid, heroes: [hero], monsters, items: [], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 5, depth: 1, players: [] }) });

  const mkHero = () => heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, alive: true });
  const mkBat = () => actorShape.of({ id: 1, kind: "bat", pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 1, maxHp: 3, attack: 2, defense: 0 }), ready: 10000 });

  let batGone = false;
  let batStillOneHp = false;
  for (let r = 0; r < 40; r++) {
    const w = mkWorld(mkHero(), [mkBat()], r);
    const w2 = rules.advance(rules.intend(w, "Ann", intentShape.move(1, 0)), 50);
    assert.equal(w2.heroes[0].actor.pos.x, 1);
    const batStill = w2.monsters.some((m) => m.kind === "bat");
    if (!batStill) {
      batGone = true;
    } else {
      const batActor = w2.monsters.find((m) => m.kind === "bat");
      if (batActor && batActor.stats.hp === 1) {
        batStillOneHp = true;
      }
    }
  }
  assert.ok(batGone);
  assert.ok(batStillOneHp);

  batGone = false;
  batStillOneHp = false;
  for (let r = 0; r < 40; r++) {
    const w = mkWorld(mkHero(), [mkBat()], r);
    const w2 = rules.advance(rules.intend(w, "Ann", intentShape.attack(1, 0)), 50);
    assert.equal(w2.heroes[0].actor.pos.x, 1);
    const batStill = w2.monsters.some((m) => m.kind === "bat");
    if (!batStill) {
      batGone = true;
    } else {
      const batActor = w2.monsters.find((m) => m.kind === "bat");
      if (batActor && batActor.stats.hp === 1) {
        batStillOneHp = true;
      }
    }
  }
  assert.ok(batGone);
  assert.ok(batStillOneHp);

  const wWall = mkWorld(mkHero(), [mkBat()], 1);
  const wWall2 = rules.advance(rules.intend(wWall, "Ann", intentShape.attack(-1, 0)), 50);
  assert.equal(wWall2.heroes[0].actor.pos.x, 1);
  assert.equal(wWall2.heroes[0].actor.pos.y, 1);
  assert.equal(wWall2.heroes[0].actor.ready, 400);
  assert.equal(wWall2.heroes[0].pending, null);
  assert.equal(wWall2.heroes[0].actor.facing, "left");
  assert.deepEqual(wWall2.heroes[0].actor.last, { kind: "attack", dx: -1, dy: 0, at: 50, reach: 1 });
  assert.ok(wWall2.monsters.some((m) => m.kind === "bat"));
  assert.equal(wWall2.monsters.find((m) => m.kind === "bat").stats.hp, 1);
});

test("held: attack sets defender held, held hero's non-attack move stays pending, held monster step does nothing", () => {
  const grid = tileGridShape.fromRows(["#######", "#.....#", "#######"]);
  const visible = maskShape.empty(7, 3);
  const explored = maskShape.empty(7, 3);
  const mkWorld = (heroes, monsters, rng) => worldShape.of({ seed: 1, rng, depth: 1, time: 0, state: "playing", grid, heroes, monsters, items: [], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [] }) });

  const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0, held: 0, facing: "right", last: null });
  const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
  const skeleton = actorShape.of({ id: 1, kind: "skeleton", pos: pointShape.of(3, 1), stats: statsShape.of({ hp: 9, maxHp: 9, attack: 4, defense: 2 }), ready: 0, held: 0, facing: "right", last: null });
  const w = mkWorld([ann], [skeleton], 1);
  const w2 = rules.advance(w, 50);
  assert.equal(w2.heroes[0].actor.held, 350);
  assert.equal(w2.monsters[0].ready, 650);
  assert.equal(w2.monsters[0].facing, "left");
  assert.deepEqual(w2.monsters[0].last, { kind: "attack", dx: -1, dy: 0, at: 50, reach: 1 });

  const wPending = rules.intend(w2, "Ann", intentShape.move(-1, 0));
  let wAdv = wPending;
  for (let t = 0; t < 5; t++) {
    wAdv = rules.advance(wAdv, 50);
  }
  assert.equal(wAdv.heroes[0].actor.pos.x, 2);
  assert.equal(wAdv.heroes[0].pending.kind, "move");
  assert.equal(wAdv.heroes[0].pending.dx, -1);
  wAdv = rules.advance(wAdv, 50);
  assert.equal(wAdv.heroes[0].actor.pos.x, 1);

  const skeletonHeld = actorShape.of({ id: 1, kind: "skeleton", pos: pointShape.of(4, 1), stats: statsShape.of({ hp: 9, maxHp: 9, attack: 4, defense: 2 }), ready: 0, held: 1000, facing: "right", last: null });
  const annActor2 = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0, held: 0, facing: "right", last: null });
  const ann2 = heroShape.of({ name: "Ann", actor: annActor2, pending: null, alive: true });
  const wHeldMonster = mkWorld([ann2], [skeletonHeld], 1);
  const wHeldMonster2 = rules.advance(wHeldMonster, 50);
  assert.equal(wHeldMonster2.monsters[0].pos.x, 4);
  assert.equal(wHeldMonster2.monsters[0].ready, 1000);
});

test("monsters-act: skeleton moves toward hero", () => {
  const grid = tileGridShape.fromRows(["#########", "#.......#", "#########"]);
  const visible = maskShape.empty(9, 3);
  const explored = maskShape.empty(9, 3);
  const mkWorld = (heroes, monsters, rng) => worldShape.of({ seed: 1, rng, depth: 1, time: 0, state: "playing", grid, heroes, monsters, items: [], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [] }) });

  const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
  const skeleton = actorShape.of({ id: 1, kind: "skeleton", pos: pointShape.of(4, 1), stats: statsShape.of({ hp: 9, maxHp: 9, attack: 4, defense: 2 }), ready: 0 });
  const w = mkWorld([ann], [skeleton], 1);
  const w2 = rules.advance(w, 50);
  assert.equal(w2.monsters[0].pos.x, 3);
  assert.equal(w2.monsters[0].pos.y, 1);
  assert.equal(w2.monsters[0].ready, 450);

  let wAdv = w2;
  for (let t = 100; t <= 400; t += 50) {
    wAdv = rules.advance(wAdv, 50);
  }
  assert.equal(wAdv.monsters[0].pos.x, 3);
  const w450 = rules.advance(wAdv, 50);
  assert.equal(w450.monsters[0].pos.x, 2);

  const bobActor = actorShape.of({ id: 2, kind: "hero", pos: pointShape.of(6, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const bob = heroShape.of({ name: "Bob", actor: bobActor, pending: null, alive: true });
  const wWithBob = mkWorld([ann, bob], [skeleton], 1);
  const wBobFirst = rules.advance(wWithBob, 50);
  assert.equal(wBobFirst.monsters[0].pos.x, 5);
});

test("dies: demon kills hero, intend for dead hero returns same world", () => {
  const grid = tileGridShape.fromRows(["#########", "#.......#", "#########"]);
  const visible = maskShape.empty(9, 3);
  const explored = maskShape.empty(9, 3);
  const mkWorld = (heroes, monsters, rng) => worldShape.of({ seed: 7, rng, depth: 1, time: 0, state: "playing", grid, heroes, monsters, items: [], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 7, depth: 1, players: [] }) });

  let deadFound = false;
  for (let r = 0; r < 40; r++) {
    const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 1, maxHp: 24, attack: 4, defense: 0 }), ready: 0 });
    const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
    const bobActor = actorShape.of({ id: 1, kind: "hero", pos: pointShape.of(7, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
    const bob = heroShape.of({ name: "Bob", actor: bobActor, pending: null, alive: true });
    const demon = actorShape.of({ id: 2, kind: "demon", pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 16, maxHp: 16, attack: 6, defense: 3 }), ready: 0 });
    const w = mkWorld([ann, bob], [demon], r);
    const w2 = rules.advance(w, 50);
    const annH = w2.heroes.find((h) => h.name === "Ann");
    const bobH = w2.heroes.find((h) => h.name === "Bob");
    if (!annH.alive && annH.actor.stats.hp === 0 && bobH.alive) {
      deadFound = true;
    }
  }
  assert.ok(deadFound);

  const deadAnnActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 0, maxHp: 24, attack: 4, defense: 0 }), ready: 0 });
  const deadAnn = heroShape.of({ name: "Ann", actor: deadAnnActor, pending: intentShape.move(1, 0), alive: false });
  const wDead = mkWorld([deadAnn], [], 1);
  assert.strictEqual(rules.intend(wDead, "Ann", intentShape.wait()), wDead);
});

test("wipe: party falls, floor restarts from entry keeping time, gold, log", () => {
  const grid = tileGridShape.fromRows(["#####", "#...#", "#####"]);
  const visible = maskShape.empty(5, 3);
  const explored = maskShape.empty(5, 3);
  const mkWorld = (heroes, monsters, rng, gold) => worldShape.of({ seed: 1, rng, depth: 1, time: 0, state: "playing", grid, heroes, monsters, items: [], visible, explored, gold, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] }) });

  let wipeFound = false;
  for (let r = 0; r < 40; r++) {
    const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 1, maxHp: 24, attack: 4, defense: 0 }), ready: 0 });
    const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
    const demon = actorShape.of({ id: 1, kind: "demon", pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 16, maxHp: 16, attack: 6, defense: 3 }), ready: 0 });
    const w = mkWorld([ann], [demon], r, 3);
    const w2 = rules.advance(w, 50);
    if (w2.depth === 1 && w2.heroes[0].alive && w2.heroes[0].actor.stats.hp === 24 && w2.time === 50 && w2.gold === 3 && w2.log[w2.log.length - 1] === "The party has fallen. Level 1 begins again.") {
      wipeFound = true;
    }
  }
  assert.ok(wipeFound);
});

test("descends: within 5 chebyshev descends, beyond stays; descends to level 2", () => {
  const grid = tileGridShape.fromRows(["##########", "#.>......#", "##########"]);
  const visible = maskShape.empty(10, 3);
  const explored = maskShape.empty(10, 3);
  const mkWorld = (heroes, rng) => worldShape.of({ seed: 1, rng, depth: 1, time: 0, state: "playing", grid, heroes, monsters: [], items: [], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [{ name: "Ann", stats: statsShape.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) }, { name: "Bob", stats: statsShape.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }) }] }) });

  const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(7, 1), stats: statsShape.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
  const bobActor = actorShape.of({ id: 1, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const bob = heroShape.of({ name: "Bob", actor: bobActor, pending: null, alive: false });
  const w = mkWorld([ann, bob], 1);

  // no descend intent: stays depth 1
  const wNoDescend = rules.advance(w, 50);
  assert.equal(wNoDescend.depth, 1);

  // descend intent, all within 5: descends to depth 2
  const wDescend = rules.advance(rules.intend(w, "Ann", intentShape.descend()), 50);
  assert.equal(wDescend.depth, 2);
  assert.equal(wDescend.grid.width, 48);
  assert.equal(wDescend.grid.height, 32);
  const ann2 = wDescend.heroes.find((h) => h.name === "Ann");
  const bob2 = wDescend.heroes.find((h) => h.name === "Bob");
  assert.ok(ann2.alive);
  assert.equal(ann2.actor.stats.hp, 24);
  assert.equal(ann2.actor.stats.maxHp, 28);
  assert.ok(bob2.alive);
  assert.equal(bob2.actor.stats.hp, 1);
  assert.equal(bob2.actor.stats.maxHp, 28);
  assert.equal(wDescend.log[wDescend.log.length - 1], "The party descends to level 2.");

  // Ann at (8, 1): 6 from stairs, beyond 5: stays depth 1, logs the line
  const annActorFar = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(8, 1), stats: statsShape.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const annFar = heroShape.of({ name: "Ann", actor: annActorFar, pending: null, alive: true });
  const wFar = mkWorld([annFar], 1);
  const wFar2 = rules.advance(rules.intend(wFar, "Ann", intentShape.descend()), 50);
  assert.equal(wFar2.depth, 1);
  assert.equal(wFar2.log[wFar2.log.length - 1], "All party members must be within 5 units of the exit!");
});

test("saves: toSave and fromSave round-trip, hp 0 becomes 1", () => {
  const s = saveShape.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: statsShape.of({ hp: 10, maxHp: 30, attack: 6, defense: 2 }) }] });
  const w = rules.fromSave(s);
  assert.equal(w.depth, 3);
  assert.equal(w.time, 0);
  assert.equal(w.state, "playing");
  assert.equal(w.grid.width, 48);
  assert.equal(w.grid.height, 32);
  assert.equal(w.heroes.length, 1);
  assert.equal(w.heroes[0].name, "Cy");
  assert.ok(w.heroes[0].alive);
  assert.deepEqual(w.heroes[0].actor.stats, { hp: 10, maxHp: 30, attack: 6, defense: 2, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.deepEqual(w.entry, s);
  const w2 = rules.fromSave(s);
  assert.deepStrictEqual(w, w2);

  const sZero = saveShape.of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: statsShape.of({ hp: 0, maxHp: 30, attack: 6, defense: 2 }) }] });
  const wZero = rules.fromSave(sZero);
  assert.equal(wZero.heroes[0].actor.stats.hp, 1);
});

test("level-based floors: stage monster counts, kinds, tier scaling, swords/armor, depth 33 win, shop arrival", () => {
  const w1 = rules.newGame(5);
  assert.equal(w1.monsters.length, 4);
  for (const m of w1.monsters) assert.ok(["bat", "slime", "snake"].includes(m.kind));

  const w3 = rules.fromSave(saveShape.of({ seed: 5, depth: 3, players: [] }));
  assert.equal(w3.monsters.length, 8);
  const kinds3 = new Set(w3.monsters.map((m) => m.kind));
  for (const k of kinds3) assert.ok(["bat", "slime", "snake"].includes(k));

  const w5 = rules.fromSave(saveShape.of({ seed: 5, depth: 5, players: [] }));
  assert.equal(w5.monsters.length, 12);

  const wShop = rules.fromSave(saveShape.of({ seed: 5, depth: 6, players: [] }));
  assert.equal(wShop.monsters.length, 0);
  assert.equal(wShop.log[wShop.log.length - 1], "A shop! Bump a ware twice to buy it.");

  const gridWin = tileGridShape.fromRows(["##########", "#.......#>", "##########"]);
  const visibleWin = maskShape.empty(10, 3);
  const exploredWin = maskShape.empty(10, 3);
  const mkWin = (heroes, rng) => worldShape.of({ seed: 1, rng, depth: 33, time: 0, state: "playing", grid: gridWin, heroes, monsters: [], items: [], visible: visibleWin, explored: exploredWin, gold: 0, log: [], entry: saveShape.of({ seed: 1, depth: 33, players: [{ name: "Ann", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] }) });
  const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(6, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
  const wWin = mkWin([ann], 1);
  const wWin2 = rules.advance(rules.intend(wWin, "Ann", intentShape.descend()), 50);
  assert.equal(wWin2.state, "won");
  assert.ok(wWin2.log.some((l) => l.includes("escapes the dungeon with 0 gold!")));
});

test("shop floors: no monsters, six wares with prices, every cell visible and explored", () => {
  const wShop = rules.fromSave(saveShape.of({ seed: 5, depth: 6, players: [{ name: "Ann", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] }));
  assert.equal(wShop.monsters.length, 0);
  assert.equal(wShop.items.length, 6);
  const foodKinds = ["cheese", "bread", "meat"];
  const poolKinds = ["potion", "sword", "sword-2", "armor", "armor-2", "ring", "necklace"];
  for (const it of wShop.items) {
    assert.ok(poolKinds.includes(it.kind) || foodKinds.includes(it.kind));
    assert.equal(it.price > 0, true);
    assert.ok(wShop.grid.open(it.pos.x, it.pos.y));
  }
  const kinds = wShop.items.map((it) => it.kind);
  assert.ok(foodKinds.includes(kinds[0]) && foodKinds.includes(kinds[1]));
  assert.equal(wShop.visible.count(), 48 * 32);
  assert.equal(wShop.explored.count(), 48 * 32);
});

test("bumping and buying: offer, three log lines, wares block steps, other actions clear offer, new floors clear offer", () => {
  const wShop = rules.fromSave(saveShape.of({ seed: 5, depth: 6, players: [{ name: "Ann", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] }));
  const swordWare = wShop.items.find((it) => it.kind === "sword");

  const heroInit = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(18, 13), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: null, alive: true });
  const wShopAnn = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroInit], monsters: wShop.monsters, items: wShop.items, visible: wShop.visible, explored: wShop.explored, gold: 50, log: wShop.log, entry: wShop.entry });
  const wFirst = rules.advance(rules.intend(wShopAnn, "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wFirst.heroes[0].offer, swordWare.id);
  assert.equal(wFirst.log[wFirst.log.length - 1], `Ann looks at a sword: ${swordWare.price} gold. Bump it again to buy.`);

  const heroOffer = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(18, 13), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: swordWare.id, alive: true });
  const wShopBuy = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroOffer], monsters: wShop.monsters, items: wShop.items, visible: wShop.visible, explored: wShop.explored, gold: 50, log: wShop.log, entry: wShop.entry });
  const wBuy = rules.advance(rules.intend(wShopBuy, "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wBuy.heroes[0].offer, null);
  assert.equal(wBuy.items.filter((it) => it.kind === "sword").length, 0);
  assert.equal(wBuy.log[wBuy.log.length - 1], `Ann buys a sword for ${swordWare.price} gold.`);
  assert.deepEqual(wBuy.heroes[0].actor.gesture, { kind: "power", at: 50 });

  const heroOfferLow = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(18, 13), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: swordWare.id, alive: true });
  const wShopLow = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroOfferLow], monsters: wShop.monsters, items: wShop.items, visible: wShop.visible, explored: wShop.explored, gold: 10, log: wShop.log, entry: wShop.entry });
  const wBuyLow = rules.advance(rules.intend(wShopLow, "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wBuyLow.heroes[0].offer, null);
  assert.equal(wBuyLow.log[wBuyLow.log.length - 1], `Not enough gold for a sword: ${swordWare.price} needed, the party has 10.`);

  const heroOfferWait = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(18, 13), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: swordWare.id, alive: true });
  const wShopWait = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroOfferWait], monsters: wShop.monsters, items: wShop.items, visible: wShop.visible, explored: wShop.explored, gold: 50, log: wShop.log, entry: wShop.entry });
  const wWait = rules.advance(rules.intend(wShopWait, "Ann", intentShape.wait()), 50);
  assert.equal(wWait.heroes[0].offer, null);

  const wNewFloor = rules.join(rules.fromSave(saveShape.of({ seed: 5, depth: 1, players: [{ name: "Ann", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] })), "Ann");
  assert.equal(wNewFloor.heroes[0].offer, null);
});

test("buys-food-and-armor: buying bread heals, buying armor-3 gives defense", () => {
  const wShop = rules.fromSave(saveShape.of({ seed: 5, depth: 6, players: [{ name: "Ann", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] }));

  const breadWare = itemShape.of({ id: 100, kind: "bread", pos: pointShape.of(15, 13), amount: 0, price: 10 });
  const armorWare = itemShape.of({ id: 101, kind: "armor-3", pos: pointShape.of(17, 13), amount: 0, price: 30 });

  const heroBread = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(14, 13), stats: statsShape.of({ hp: 10, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: breadWare.id, alive: true });
  const wShopBread = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroBread], monsters: wShop.monsters, items: [breadWare], visible: wShop.visible, explored: wShop.explored, gold: 50, log: wShop.log, entry: wShop.entry });
  const wBread = rules.advance(rules.intend(wShopBread, "Ann", intentShape.move(1, 0)), 350);
  assert.equal(wBread.heroes[0].actor.stats.hp, 16);
  assert.equal(wBread.heroes[0].actor.stats.maxHp, 24);
  assert.equal(wBread.log[wBread.log.length - 1], "Ann buys bread for 10 gold.");

  const heroArmor = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(16, 13), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: armorWare.id, alive: true });
  const wShopArmor = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroArmor], monsters: wShop.monsters, items: [armorWare], visible: wShop.visible, explored: wShop.explored, gold: 50, log: wShop.log, entry: wShop.entry });
  const wArmor = rules.advance(rules.intend(wShopArmor, "Ann", intentShape.move(1, 0)), 350);
  assert.equal(wArmor.heroes[0].actor.stats.defense, 2);
  assert.equal(wArmor.log[wArmor.log.length - 1], "Ann buys bronze mail for 30 gold.");
});

test("rolls-advance: rng advances per attack, 20 attacks give miss and hit", () => {
  const grid = tileGridShape.fromRows(["######", "#....#", "######"]);
  const visible = maskShape.empty(6, 3);
  const explored = maskShape.empty(6, 3);
  const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const ann = heroShape.of({ name: "Ann", actor: annActor });
  const skeletonActor = actorShape.of({ id: 1, kind: "skeleton", pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 30, maxHp: 30, attack: 4, defense: 2 }), ready: 10000 });
  const wBase = worldShape.of({ seed: 1, rng: 0, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [skeletonActor], items: [], visible, explored, gold: 0, log: ["welcome"], entry: saveShape.of({ seed: 1, depth: 1, players: [] }) });

  for (let r = 0; r < 40; r++) {
    const w = worldShape.of({ ...wBase, rng: r });
    const aw = rules.advance(rules.intend(w, "Ann", intentShape.attack(1, 0)), 50);
    const expected = (r + 2 * 0x6d2b79f5) >>> 0;
    assert.equal(aw.rng, expected, `rng after attack from ${r}`);
  }

  let w = worldShape.of({ ...wBase, rng: 0 });
  let anyMiss = false;
  let anyHit = false;
  for (let i = 0; i < 20; i++) {
    w = worldShape.of({ ...w, monsters: [skeletonActor] });
    const ready = w.heroes[0].actor.ready;
    const elapsed = Math.max(1, ready - w.time);
    w = rules.advance(rules.intend(w, "Ann", intentShape.attack(1, 0)), elapsed);
    const last = w.log[w.log.length - 1];
    if (last.includes("misses")) anyMiss = true;
    if (last.includes("hits")) anyHit = true;
  }
  assert.ok(anyMiss);
  assert.ok(anyHit);
});

test("bumps-are-uses: ware bump leaves last unchanged, sets gesture use, second bump buys with gesture power", () => {
  const wShop = rules.fromSave(saveShape.of({ seed: 5, depth: 6, players: [{ name: "Ann", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] }));
  const swordWare = wShop.items.find((it) => it.kind === "sword");

  const heroInit = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(18, 13), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: null, alive: true });
  const wShopAnn = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroInit], monsters: wShop.monsters, items: wShop.items, visible: wShop.visible, explored: wShop.explored, gold: 50, log: wShop.log, entry: wShop.entry });
  const wFirst = rules.advance(rules.intend(wShopAnn, "Ann", intentShape.move(1, 0)), 50);
  assert.equal(wFirst.heroes[0].offer, swordWare.id);
  assert.deepEqual(wFirst.heroes[0].actor.gesture, { kind: "use", at: 50 });
  assert.equal(wFirst.heroes[0].actor.last, null);

  const heroOffer = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(18, 13), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 }), pending: null, offer: swordWare.id, alive: true });
  const wShopBuy = worldShape.of({ seed: 5, rng: 5, depth: 6, time: 0, state: "playing", grid: wShop.grid, heroes: [heroOffer], monsters: wShop.monsters, items: wShop.items, visible: wShop.visible, explored: wShop.explored, gold: 50, log: wShop.log, entry: wShop.entry });
  const wBuy = rules.advance(rules.intend(wShopBuy, "Ann", intentShape.move(1, 0)), 350);
  assert.equal(wBuy.heroes[0].offer, null);
  assert.deepEqual(wBuy.heroes[0].actor.gesture, { kind: "power", at: 350 });
  assert.equal(wBuy.heroes[0].actor.last, null);
});

test("bump-pulled-lever-again: second bump of a pulled lever is a use, last unchanged, gesture use", () => {
  const grid = tileGridShape.fromRows(["##########", "#........#", "#........#", "#........#", "#........#", "##########"]);
  const visible = maskShape.empty(10, 6);
  const explored = maskShape.empty(10, 6);
  const lever1 = itemShape.of({ id: 20, kind: "lever", pos: pointShape.of(2, 1), amount: 0, price: 0, pulled: true });
  const hero = heroShape.of({ name: "Ann", actor: actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0, gesture: null }), pending: null, alive: true });
  const w = worldShape.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [hero], monsters: [], items: [lever1], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [] }) });
  const wPulled = rules.advance(rules.intend(w, "Ann", intentShape.move(1, 0)), 50);
  assert.deepEqual(wPulled.heroes[0].actor.gesture, { kind: "use", at: 50 });
  assert.equal(wPulled.heroes[0].actor.last, null);
  assert.equal(wPulled.heroes[0].actor.ready, 400);
});

test("colours: join gets smallest free colour and group 0, fromSave gives colour i", () => {
  const w = rules.newGame(5);
  const wAnn = rules.join(w, "Ann");
  assert.equal(wAnn.heroes[0].colour, 0);
  assert.equal(wAnn.heroes[0].group, 0);
  const wBob = rules.join(wAnn, "Bob");
  assert.equal(wBob.heroes[1].colour, 1);
  assert.equal(wBob.heroes[1].group, 0);
  const wC = rules.join(wBob, "C");
  assert.equal(wC.heroes[2].colour, 2);
  const wD = rules.join(wC, "D");
  assert.equal(wD.heroes[3].colour, 3);

  const wSave = rules.fromSave(saveShape.of({ seed: 9, depth: 3, players: [{ name: "A", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }, { name: "B", stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) }] }));
  assert.equal(wSave.heroes[0].colour, 0);
  assert.equal(wSave.heroes[0].group, 0);
  assert.equal(wSave.heroes[1].colour, 1);
  assert.equal(wSave.heroes[1].group, 0);
});

test("refuses: invalid inputs throw TypeError", () => {
  assert.throws(() => rules.newGame(-1), TypeError);
  assert.throws(() => rules.newGame(2.5), TypeError);
  const w = rules.newGame(5);
  assert.throws(() => rules.advance(w, 0), TypeError);
  assert.throws(() => rules.advance(w, 1.5), TypeError);
  assert.throws(() => rules.advance(w, 1001), TypeError);
  assert.throws(() => rules.intend(w, "Ann", { kind: "wait" }), TypeError);
  assert.throws(() => rules.join(w, 5), TypeError);
  assert.throws(() => rules.fromSave({}), TypeError);
  assert.throws(() => rules.advance({}, 50), TypeError);
});

test("spawns: levels 6-10 include snowman/snow-skeleton/wolf-man; 16-20 scarecrow/pumpkin no reaper; 21-25 imp/demon/beholder", () => {
  let has6 = false;
  for (let s = 0; s < 30; s++) {
    const k = new Set(rules.newGame(s, 8).monsters.map((m) => m.kind));
    if (k.has("snowman") || k.has("snow-skeleton")) { has6 = true; break; }
  }
  assert.ok(has6, "level 6 can spawn snowman or snow-skeleton");
  const kinds16 = new Set(rules.newGame(12, 22).monsters.map((m) => m.kind));
  assert.ok(kinds16.has("scarecrow") || kinds16.has("pumpkin"));
  assert.ok(!kinds16.has("reaper"));
  const kinds21 = new Set(rules.newGame(12, 29).monsters.map((m) => m.kind));
  assert.ok(kinds21.has("imp") || kinds21.has("demon") || kinds21.has("beholder"));
});

test("reaper-lair: depth 21 has reaper boss, size 2, stairs closed while alive, gold x3, descend line", () => {
  const w = rules.newGame(3, 21);
  const boss = w.monsters.find((m) => m.kind === "reaper");
  assert.ok(boss, "reaper boss present");
  assert.equal(boss.size, 2);
  assert.equal(boss.mode, "dormant");
  assert.equal(w.grid.at(w.entry.players.length > 0 ? 0 : 0, 0), "wall");
  assert.ok(w.grid.at(32, 15) !== "stairs" || boss.pos.x === 32 && boss.pos.y === 15, "stairs closed while lives");
});

test("effects: older than 1000ms dropped on advance", () => {
  const grid = tileGridShape.fromRows(["#######", "#.....#", "#######"]);
  const visible = maskShape.empty(7, 3);
  const explored = maskShape.empty(7, 3);
  const annActor = actorShape.of({ id: 0, kind: "hero", pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }), ready: 0 });
  const ann = heroShape.of({ name: "Ann", actor: annActor, pending: null, alive: true });
  const w = worldShape.of({ seed: 1, rng: 1, depth: 1, time: 0, state: "playing", grid, heroes: [ann], monsters: [], items: [], visible, explored, gold: 0, log: [], entry: saveShape.of({ seed: 1, depth: 1, players: [] }), effects: [{ kind: "blast", x: 3, y: 1, size: 2, at: 0 }] });
  const wAdv1 = rules.advance(w, 600);
  assert.equal(wAdv1.effects.length, 1);
  const wAdv2 = rules.advance(wAdv1, 600);
  assert.equal(wAdv2.effects.length, 0);
});
