// more intrinsic tests: attacks, monsters-act, dies, descends, restarts.

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

function makeWorld(grid, hero, monsters, items, opts = {}) {
  const visible = maskShape.empty(grid.width, grid.height);
  const explored = maskShape.empty(grid.width, grid.height);
  return worldShape.of({
    seed: opts.seed ?? 1, rng: opts.rng ?? 1, depth: opts.depth ?? 1, turn: opts.turn ?? 0,
    state: opts.state ?? 'playing', grid, hero, monsters, items, visible, explored,
    gold: opts.gold ?? 0, log: opts.log ?? ["Welcome to the dungeon. Find the stairs (>)."],
  });
}

test("attacks: hero stays, bat sometimes gone sometimes stays", () => {
  const grid = tileGridShape.fromRows(['######', '#....#', '######']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const bat = actorShape.of({ id: 1, kind: 'bat', pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 1, maxHp: 3, attack: 2, defense: 0 }) });

  let goneCount = 0, staysCount = 0;
  for (let r = 0; r < 40; r++) {
    const w = makeWorld(grid, hero, [bat], [], { seed: 5, rng: r, turn: 0 });
    const w2 = rules.step(w, intentShape.move(1, 0));
    assert.equal(w2.hero.pos.x, 1, "hero stays at (1,1)");
    const batStill = w2.monsters.some(m => m.kind === 'bat');
    if (!batStill) goneCount++;
    else staysCount++;
  }
  assert.ok(goneCount >= 1, "bat gone in at least one");
  assert.ok(staysCount >= 1, "bat stays with 1 hp in at least one");
});

test("monsters-act: skeleton moves toward hero", () => {
  const grid = tileGridShape.fromRows(['#######', '#.....#', '#######']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const skeleton = actorShape.of({ id: 1, kind: 'skeleton', pos: pointShape.of(4, 1), stats: statsShape.of({ hp: 9, maxHp: 9, attack: 4, defense: 2 }) });
  const w = makeWorld(grid, hero, [skeleton], [], { seed: 1, rng: 1, turn: 0 });
  const w2 = rules.step(w, intentShape.wait());
  assert.equal(w2.monsters[0].pos.x, 3);
  assert.equal(w2.monsters[0].pos.y, 1);
  assert.equal(w2.turn, 1);
});

test("descends: on stairs depth 1 -> 2", () => {
  const grid = tileGridShape.fromRows(['#####', '#.>.#', '#####']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 20, maxHp: 24, attack: 4, defense: 1 }) });
  const w = makeWorld(grid, hero, [], [], { seed: 1, rng: 1, depth: 1, turn: 0 });
  const w2 = rules.step(w, intentShape.descend());
  assert.equal(w2.depth, 2);
  assert.equal(w2.hero.stats.hp, 24);
  assert.equal(w2.hero.stats.maxHp, 28);
  assert.equal(w2.log[w2.log.length - 1], "You descend to depth 2.");
});

test("descends: off stairs, no turn passes", () => {
  const grid = tileGridShape.fromRows(['#####', '#...#', '#####']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const w = makeWorld(grid, hero, [], [], { seed: 1, rng: 1, depth: 1, turn: 0 });
  const w2 = rules.step(w, intentShape.descend());
  assert.equal(w2.turn, 0);
  assert.equal(w2.depth, 1);
  assert.equal(w2.log[w2.log.length - 1], "There are no stairs here.");
});

test("restarts: newGame(nextSeed)", () => {
  const w = rules.newGame(9);
  const w2 = rules.step(w, intentShape.restart());
  const w3 = rules.newGame(10);
  assert.equal(w2.seed, w3.seed);
  assert.equal(w2.depth, w3.depth);
  assert.equal(w2.turn, w3.turn);
  assert.equal(w2.state, w3.state);
});

test("restarts: seed wrap", () => {
  const grid = tileGridShape.fromRows(['#####', '#...#', '#####']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 24, maxHp: 24, attack: 4, defense: 1 }) });
  const w = makeWorld(grid, hero, [], [], { seed: 4294967295, rng: 4294967295, depth: 1, turn: 0, state: 'dead' });
  const w2 = rules.step(w, intentShape.restart());
  const w3 = rules.newGame(0);
  assert.equal(w2.seed, w3.seed);
});

test("dies: hero brought to 0 hp makes state dead", () => {
  const grid = tileGridShape.fromRows(['#####', '#...#', '#####']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 1, maxHp: 24, attack: 4, defense: 0 }) });
  const demon = actorShape.of({ id: 1, kind: 'demon', pos: pointShape.of(2, 1), stats: statsShape.of({ hp: 16, maxHp: 16, attack: 6, defense: 3 }) });
  let deadFound = false;
  for (let r = 0; r < 40; r++) {
    const w = makeWorld(grid, hero, [demon], [], { seed: 7, rng: r, turn: 0 });
    const w2 = rules.step(w, intentShape.wait());
    if (w2.state === 'dead' && w2.hero.stats.hp === 0) deadFound = true;
  }
  assert.ok(deadFound, "state dead and hp 0 in at least one");
});

test("stepping dead world is no-op", () => {
  const grid = tileGridShape.fromRows(['#####', '#...#', '#####']);
  const hero = actorShape.of({ id: 0, kind: 'hero', pos: pointShape.of(1, 1), stats: statsShape.of({ hp: 0, maxHp: 24, attack: 4, defense: 1 }) });
  const w = makeWorld(grid, hero, [], [], { seed: 1, rng: 1, depth: 1, turn: 5, state: 'dead' });
  const wMove = rules.step(w, intentShape.move(1, 0));
  const wWait = rules.step(w, intentShape.wait());
  assert.equal(wMove.state, 'dead');
  assert.equal(wWait.state, 'dead');
  assert.equal(wMove.turn, 5);
  assert.equal(wWait.turn, 5);
});
