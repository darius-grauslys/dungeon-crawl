// The edge test for monsters: one test per intrinsic of the EET decide.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as actor from "../../../shapes/actor/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as bestiary from "../../../shapes/bestiary/index.mjs";
import { decide } from "../../../edges/edge_to_monsters.mjs";

const monsterStats = { hp: 5, maxHp: 5, attack: 2, defense: 0 };

test("adjacent-attacks", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(3, 3), stats: stats.of(monsterStats) });

  let i = decide(skeleton, grid, [point.of(3, 2)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);

  i = decide(skeleton, grid, [point.of(2, 3)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, -1);
  assert.strictEqual(i.dy, 0);

  i = decide(skeleton, grid, [point.of(4, 4)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 1);

  i = decide(skeleton, grid, [point.of(5, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, -1);

  const g2 = tileGrid.fromRows(["#####", "#...#", "#...#", "#####"]);
  const skeleton2 = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 2), stats: stats.of(monsterStats) });
  i = decide(skeleton2, g2, [point.of(2, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, -1);

  const g3 = tileGrid.fromRows(["#####", "##..#", "#...#", "#####"]);
  i = decide(skeleton2, g3, [point.of(2, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);
});

test("chases", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#.###.#", "#.....#", "#######"]);
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(1, 3), stats: stats.of(monsterStats) });

  let i = decide(snake, grid, [point.of(5, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(snake, grid, [point.of(5, 1)], [], [point.of(2, 3)], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);
});

test("reach", () => {
  const grid = tileGrid.of(20, 3, Array(60).fill("floor"));
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(0, 1), stats: stats.of(monsterStats) });
  const bat = actor.of({ id: 2, kind: "bat", pos: point.of(0, 1), stats: stats.of(monsterStats) });

  let i = decide(snake, grid, [point.of(7, 1)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  i = decide(snake, grid, [point.of(6, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(bat, grid, [point.of(9, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(bat, grid, [point.of(10, 1)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  i = decide(snake, grid, [point.of(6, 2)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 1);
});

test("slime-slow", () => {
  const grid = tileGrid.of(5, 5, Array(25).fill("floor"));
  const slime = actor.of({ id: 1, kind: "slime", pos: point.of(2, 2), stats: stats.of(monsterStats) });

  let i = decide(slime, grid, [point.of(2, 1)], [], [], 3);
  assert.strictEqual(i.kind, "wait");

  i = decide(slime, grid, [point.of(2, 1)], [], [], 4);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);

  const blueSlime = actor.of({ id: 1, kind: "blue-slime", pos: point.of(2, 2), stats: stats.of(monsterStats) });
  i = decide(blueSlime, grid, [point.of(2, 1)], [], [], 3);
  assert.strictEqual(i.kind, "wait");

  i = decide(blueSlime, grid, [point.of(2, 1)], [], [], 4);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);
});

test("guard", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));
  const guardSlime = actor.of({ id: 1, kind: "slime", pos: point.of(2, 2), stats: stats.of(monsterStats), mode: "guard" });

  let i = decide(guardSlime, grid, [point.of(3, 3)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 1);

  i = decide(guardSlime, grid, [point.of(4, 2)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  i = decide(guardSlime, grid, [point.of(4, 2)], [], [], 2);
  assert.strictEqual(i.kind, "wait");
});

test("dormant", () => {
  const grid = tileGrid.of(10, 10, Array(100).fill("floor"));
  const dormantGolem = actor.of({ id: 1, kind: "golem", pos: point.of(1, 1), stats: stats.of(monsterStats), size: 3, mode: "dormant" });

  let i = decide(dormantGolem, grid, [point.of(4, 2)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  const roamGolem = actor.of({ id: 1, kind: "golem", pos: point.of(1, 1), stats: stats.of(monsterStats), size: 3, mode: "roam" });
  i = decide(roamGolem, grid, [point.of(4, 2)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(roamGolem, grid, [point.of(8, 2)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);
});

test("flees", () => {
  const grid = tileGrid.of(12, 12, Array(144).fill("floor"));
  const worm = actor.of({ id: 1, kind: "worm", pos: point.of(4, 4), stats: stats.of(monsterStats) });

  let i = decide(worm, grid, [], [point.of(2, 4)], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(worm, grid, [], [point.of(4, 2)], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 1);

  i = decide(worm, grid, [], [point.of(10, 4)], [], 0);
  assert.strictEqual(i.kind, "wait");

  const g2 = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const worm2 = actor.of({ id: 1, kind: "worm", pos: point.of(3, 1), stats: stats.of(monsterStats) });
  i = decide(worm2, g2, [], [point.of(1, 1)], [], 0);
  assert.strictEqual(i.kind, "wait");
});

test("shoots", () => {
  const grid = tileGrid.of(9, 9, Array(81).fill("floor"));
  const archerStats = { hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 };
  const archer = actor.of({ id: 1, kind: "archer", pos: point.of(1, 1), stats: stats.of(archerStats) });

  let i = decide(archer, grid, [point.of(5, 1)], [], [], 0);
  assert.strictEqual(i.kind, "attack");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(archer, grid, [point.of(5, 5)], [], [], 0);
  assert.strictEqual(i.kind, "attack");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 1);

  i = decide(archer, grid, [point.of(6, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(archer, grid, [point.of(3, 5)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 1);

  const g2 = tileGrid.fromRows(["#######", "#..#..#", "#######"]);
  i = decide(archer, g2, [point.of(5, 1)], [], [], 0);
  assert.strictEqual(i.kind, "wait");
});

test("kites", () => {
  const grid = tileGrid.of(12, 12, Array(144).fill("floor"));
  const archerStats = { hp: 7, maxHp: 7, attack: 3, defense: 1, range: 4 };
  const archer = actor.of({ id: 1, kind: "archer", pos: point.of(5, 5), stats: stats.of(archerStats) });

  let i = decide(archer, grid, [point.of(5, 3)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 1);

  i = decide(archer, grid, [point.of(5, 4)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 1);

  i = decide(archer, grid, [point.of(8, 5)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, -1);
  assert.strictEqual(i.dy, 0);

  i = decide(archer, grid, [point.of(5, 1)], [], [], 0);
  assert.strictEqual(i.kind, "attack");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);

  // Ranged monster whose last is a move shoots a foe in line between steps.
  const archerMoveLast = actor.of({ id: 1, kind: "archer", pos: point.of(5, 5), stats: stats.of(archerStats), last: { kind: "move", dx: 0, dy: 1, at: 0, reach: 1 } });
  i = decide(archerMoveLast, grid, [point.of(5, 3)], [], [], 0);
  assert.strictEqual(i.kind, "attack");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);

  // With last a move and the foe not in line, it backs off by stepping.
  i = decide(archerMoveLast, grid, [point.of(6, 3)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 1);

  // With last an attack, it steps.
  const archerAttackLast = actor.of({ id: 1, kind: "archer", pos: point.of(5, 5), stats: stats.of(archerStats), last: { kind: "attack", dx: 0, dy: -1, at: 0, reach: 2 } });
  i = decide(archerAttackLast, grid, [point.of(5, 3)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, 1);

  const guardArcher = actor.of({ id: 1, kind: "archer", pos: point.of(5, 5), stats: stats.of(archerStats), mode: "guard" });
  i = decide(guardArcher, grid, [point.of(5, 3)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(5, 5), stats: stats.of(monsterStats) });
  i = decide(skeleton, grid, [point.of(5, 3)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);

  const g2 = tileGrid.fromRows(["#######", "#.....#", "#######"]);
  const archer2 = actor.of({ id: 1, kind: "archer", pos: point.of(5, 1), stats: stats.of(archerStats) });
  i = decide(archer2, g2, [point.of(4, 1)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, -1);
  assert.strictEqual(i.dy, 0);

  i = decide(archer2, g2, [point.of(3, 1)], [], [], 0);
  assert.strictEqual(i.kind, "attack");
  assert.strictEqual(i.dx, -1);
  assert.strictEqual(i.dy, 0);
});

test("abilities", () => {
  const grid = tileGrid.of(9, 9, Array(81).fill("floor"));

  const scarecrow = actor.of({ id: 1, kind: "scarecrow", pos: point.of(4, 4), stats: stats.of(monsterStats) });
  let i = decide(scarecrow, grid, [point.of(4, 3)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  i = decide(scarecrow, grid, [point.of(4, 1)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  const pumpkin = actor.of({ id: 1, kind: "pumpkin", pos: point.of(2, 2), stats: stats.of(monsterStats), size: 2 });
  i = decide(pumpkin, grid, [point.of(4, 2)], [], [], 0);
  assert.strictEqual(i.kind, "wait");

  i = decide(pumpkin, grid, [point.of(7, 2)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  const swarm = actor.of({ id: 1, kind: "swarm", pos: point.of(4, 4), stats: stats.of(monsterStats) });
  i = decide(swarm, grid, [point.of(4, 3)], [], [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);
});

test("no-path", () => {
  const grid = tileGrid.fromRows(["#######", "#..#..#", "#######"]);
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 1), stats: stats.of(monsterStats) });

  const i = decide(skeleton, grid, [point.of(4, 1)], [], [], 0);
  assert.strictEqual(i.kind, "wait");
});

test("refuses", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));

  const heroActor = actor.of({ id: 0, kind: "hero", pos: point.of(3, 3), stats: stats.of(monsterStats) });
  assert.throws(() => decide(heroActor, grid, [point.of(3, 2)], [], [], 0), TypeError);

  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(1, 1), stats: stats.of(monsterStats) });
  assert.throws(() => decide(snake, grid, [{ x: 1, y: 1 }], [], [], 0), TypeError);
  assert.throws(() => decide(snake, grid, [point.of(3, 2)], [], "not-an-array", 0), TypeError);
  assert.throws(() => decide(snake, grid, [point.of(3, 2)], "not-an-array", [], 0), TypeError);
  assert.throws(() => decide(snake, grid, [point.of(3, 2)], [], [], -1), TypeError);
});

test("actor/valid", () => {
  const s = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s });
  assert.strictEqual(a.id, 0);
  assert.strictEqual(a.kind, "hero");
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);
  assert.strictEqual(a.stats.hp, 5);
  assert.strictEqual(a.ready, 0);
  assert.strictEqual(a.held, 0);
  assert.strictEqual(a.facing, "right");
  assert.strictEqual(a.last, null);
  assert.strictEqual(a.aim.dx, 1);
  assert.strictEqual(a.aim.dy, 0);
  assert.strictEqual(a.slow, 0);
  assert.strictEqual(a.mode, "roam");
  assert.strictEqual(a.size, 1);
  assert.strictEqual(a.small, false);
  assert.strictEqual(a.gesture, null);
  assert.strictEqual(a.curse, 0);
  assert.strictEqual(a.haste, 0);
  assert.strictEqual(a.chant, null);
  assert.strictEqual(a.cooldown, 0);
  assert.strictEqual(a.fuse, null);
  assert.ok(Object.isFrozen(a));

  const a2 = actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, ready: 250 });
  assert.strictEqual(a2.ready, 250);

  const golem = actor.of({ id: 0, kind: "golem", pos: point.of(0, 0), stats: s, size: 3, mode: "dormant" });
  assert.strictEqual(golem.size, 3);
  assert.strictEqual(golem.mode, "dormant");

  const archer = actor.of({ id: 0, kind: "archer", pos: point.of(0, 0), stats: s, aim: { dx: -1, dy: 1 }, slow: 2 });
  assert.strictEqual(archer.aim.dx, -1);
  assert.strictEqual(archer.aim.dy, 1);
  assert.strictEqual(archer.slow, 2);

  const b = a.with({ pos: point.of(3, 3) });
  assert.strictEqual(b.pos.x, 3);
  assert.strictEqual(b.pos.y, 3);
  assert.strictEqual(b.id, 0);
  assert.strictEqual(b.kind, "hero");
  assert.strictEqual(b.stats.hp, 5);
  assert.strictEqual(b.ready, 0);
  assert.strictEqual(b.held, 0);
  assert.strictEqual(b.facing, "right");
  assert.strictEqual(b.last, null);
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);

  assert.strictEqual(a.with({ ready: 400 }).ready, 400);

  const c = a.with({ held: 300, facing: "left", last: { kind: "attack", dx: -1, dy: 1, at: 50 } });
  assert.strictEqual(c.held, 300);
  assert.strictEqual(c.facing, "left");
  assert.ok(Object.isFrozen(c.last));
  assert.deepStrictEqual(c.last, { kind: "attack", dx: -1, dy: 1, at: 50, reach: 1 });

  const e = a.with({ gesture: { kind: "power", at: 50 } });
  assert.ok(Object.isFrozen(e.gesture));
  assert.deepStrictEqual(e.gesture, { kind: "power", at: 50 });

  const d = actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s });
  assert.deepStrictEqual(a, d);

  assert.ok(!Object.hasOwn(a, "with"));

  assert.strictEqual(actor.KINDS.length, 31);
  assert.strictEqual(actor.KINDS[0], "hero");
  assert.strictEqual(actor.KINDS[1], "bat");
  assert.strictEqual(actor.KINDS[30], "beholder");

  assert.throws(() => actor.of({ id: 0, kind: "dragon", pos: point.of(1, 2), stats: s }), TypeError);
  assert.throws(() => actor.of({ id: -1, kind: "hero", pos: point.of(1, 2), stats: s }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: { x: 1, y: 2 }, stats: s }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2) }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, ready: -1 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, ready: 1.5 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, held: -1 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, facing: "up" }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, aim: { dx: 0, dy: 0 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, aim: { dx: 2, dy: 0 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, slow: 4 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, mode: "sleep" }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, size: 4 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, size: 2 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, mode: "guard" }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, small: 1 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, last: { kind: "use", dx: 0, dy: 0, at: 0 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, last: { kind: "move", dx: 0, dy: 0, at: 0 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, last: { kind: "move", dx: 1, dy: 0, at: -5 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, last: { kind: "attack", dx: 1, dy: 0, at: 0, reach: 0 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, gesture: { kind: "wave", at: 0 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, gesture: { kind: "use", at: -1 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, gesture: { kind: "use" } }), TypeError);

  const cultist = actor.of({ id: 0, kind: "cultist", pos: point.of(0, 0), stats: s, chant: { kind: "haste", at: 100, until: 1300 }, cooldown: 500, haste: 3 });
  assert.ok(Object.isFrozen(cultist.chant));
  assert.deepStrictEqual(cultist.chant, { kind: "haste", at: 100, until: 1300 });
  assert.strictEqual(cultist.cooldown, 500);
  assert.strictEqual(cultist.haste, 3);

  const pumpkin = actor.of({ id: 0, kind: "pumpkin", pos: point.of(0, 0), stats: s, size: 2, fuse: { at: 40 } });
  assert.ok(Object.isFrozen(pumpkin.fuse));
  assert.deepStrictEqual(pumpkin.fuse, { at: 40 });

  const heroCurse = actor.of({ id: 0, kind: "hero", pos: point.of(0, 0), stats: s, curse: 3 });
  assert.strictEqual(heroCurse.curse, 3);

  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, curse: 4 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, haste: -1 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, chant: { kind: "sing", at: 0, until: 1 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, chant: { kind: "haste", at: 5, until: 1 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, cooldown: 1.5 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, fuse: { at: -1 } }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, haste: 1 }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s, fuse: { at: 0 } }), TypeError);

  const wolfMan = actor.of({ id: 0, kind: "wolf-man", pos: point.of(0, 0), stats: s });
  assert.strictEqual(wolfMan.with({ kind: "enraged-wolf-man" }).kind, "enraged-wolf-man");
  assert.throws(() => wolfMan.with({ kind: "hero" }), TypeError);
});

test("actor/facing", () => {
  assert.strictEqual(actor.facingFor(-1, 0), "left");
  assert.strictEqual(actor.facingFor(-1, -1), "left");
  assert.strictEqual(actor.facingFor(0, 1), "left");
  assert.strictEqual(actor.facingFor(1, 0), "right");
  assert.strictEqual(actor.facingFor(1, 1), "right");
  assert.strictEqual(actor.facingFor(0, -1), "right");
  assert.throws(() => actor.facingFor(0, 0), TypeError);
  assert.throws(() => actor.facingFor(2, 0), TypeError);
});

test("point/valid", () => {
  const p = point.of(3, -2);
  assert.strictEqual(p.x, 3);
  assert.strictEqual(p.y, -2);
  assert.ok(Object.isFrozen(p));

  assert.throws(() => point.of(1.5, 0), TypeError);
  assert.throws(() => point.of(0, NaN), TypeError);
  assert.throws(() => point.of("1", 2), TypeError);
  assert.throws(() => point.of(1), TypeError);

  assert.strictEqual(point.equals(point.of(1, 2), point.of(1, 2)), true);
  assert.strictEqual(point.equals(point.of(1, 2), point.of(2, 1)), false);
});

test("tile-grid/valid", () => {
  const g = tileGrid.fromRows(["###", "#.>", "###"]);
  assert.strictEqual(g.width, 3);
  assert.strictEqual(g.height, 3);
  assert.strictEqual(g.at(1, 1), "floor");
  assert.strictEqual(g.at(2, 1), "stairs");
  assert.strictEqual(g.at(0, 0), "wall");
  assert.strictEqual(g.at(-1, 0), "wall");
  assert.strictEqual(g.at(3, 1), "wall");
  assert.strictEqual(g.open(1, 1), true);
  assert.strictEqual(g.open(2, 1), true);
  assert.strictEqual(g.open(0, 1), false);
  assert.ok(Object.isFrozen(g));

  const g2 = tileGrid.of(2, 1, ["floor", "wall"]);
  assert.strictEqual(g2.at(0, 0), "floor");

  assert.throws(() => tileGrid.of(2, 2, ["floor"]), TypeError);
  assert.throws(() => tileGrid.of(1, 1, ["lava"]), TypeError);
  assert.throws(() => tileGrid.of(0, 1, []), TypeError);
  assert.throws(() => tileGrid.fromRows([]), TypeError);
  assert.throws(() => tileGrid.fromRows(["##", "#"]), TypeError);
  assert.throws(() => tileGrid.fromRows(["#x"]), TypeError);

  const tilesArr = ["floor", "wall"];
  const g3 = tileGrid.of(2, 1, tilesArr);
  tilesArr[0] = "wall";
  assert.strictEqual(g3.at(0, 0), "floor");
  const t = g3.tiles();
  t[0] = "wall";
  assert.strictEqual(g3.at(0, 0), "floor");
});

test("actor/covers", () => {
  const golem = actor.of({ id: 1, kind: "golem", pos: point.of(4, 5), stats: stats.of(monsterStats), size: 3 });
  assert.strictEqual(golem.covers(4, 5), true);
  assert.strictEqual(golem.covers(6, 7), true);
  assert.strictEqual(golem.covers(5, 6), true);
  assert.strictEqual(golem.covers(7, 5), false);
  assert.strictEqual(golem.covers(3, 5), false);

  const cells = golem.cells();
  assert.strictEqual(cells.length, 9);
  assert.strictEqual(cells[0].x, 4);
  assert.strictEqual(cells[0].y, 5);
  assert.strictEqual(cells[1].x, 5);
  assert.strictEqual(cells[1].y, 5);
  assert.strictEqual(cells[8].x, 6);
  assert.strictEqual(cells[8].y, 7);

  const s1 = actor.of({ id: 1, kind: "bat", pos: point.of(2, 2), stats: stats.of(monsterStats) });
  assert.strictEqual(s1.covers(2, 2), true);
  assert.strictEqual(s1.covers(3, 2), false);
  const cells1 = s1.cells();
  assert.strictEqual(cells1.length, 1);
  assert.strictEqual(cells1[0].x, 2);
  assert.strictEqual(cells1[0].y, 2);
});

test("bestiary/valid", () => {
  assert.strictEqual(bestiary.KINDS.length, 30);
  assert.strictEqual(bestiary.KINDS[0], "bat");
  assert.strictEqual(bestiary.KINDS[21], "serpent");
  assert.strictEqual(bestiary.KINDS[22], "snowman");
  assert.strictEqual(bestiary.KINDS[29], "beholder");
  assert.ok(Object.isFrozen(bestiary.KINDS));

  const archerEntry = bestiary.entry("archer");
  assert.deepStrictEqual(archerEntry, { kind: "archer", group: "undead", hp: 7, attack: 3, defense: 1, magic: 0, magicPower: 1, range: 4, slows: false, reach: 7, step: 400, strike: 700, size: 1, ability: "none" });
  assert.ok(Object.isFrozen(archerEntry));

  assert.strictEqual(bestiary.entry("blue-snake").slows, true);
  assert.strictEqual(bestiary.entry("blue-spider").slows, true);
  assert.strictEqual(bestiary.entry("golem").size, 3);
  assert.strictEqual(bestiary.entry("golem").step, 1600);
  assert.strictEqual(bestiary.entry("golem").defense, 12);
  assert.strictEqual(bestiary.entry("golem").attack, 12);
  assert.strictEqual(bestiary.entry("golem").magic, 6);
  assert.strictEqual(bestiary.entry("golem").magicPower, 2);
  assert.strictEqual(bestiary.entry("cultist").range, 4);
  assert.strictEqual(bestiary.entry("cultist").magic, 8);
  assert.strictEqual(bestiary.entry("bat").step, 133);
  assert.strictEqual(bestiary.entry("bat").strike, 200);
  assert.strictEqual(bestiary.entry("beetle").defense, 8);
  assert.strictEqual(bestiary.entry("beetle").strike, 1200);
  assert.strictEqual(bestiary.entry("beetle").ability, "push");
  assert.strictEqual(bestiary.entry("mummy").ability, "curse");
  assert.strictEqual(bestiary.entry("cultist").ability, "chant");
  assert.strictEqual(bestiary.entry("snowman").attack, 0);
  assert.strictEqual(bestiary.entry("snowman").magic, 1);
  assert.strictEqual(bestiary.entry("snowman").range, 4);
  assert.strictEqual(bestiary.entry("snowman").slows, true);
  assert.strictEqual(bestiary.entry("snowman").step, 133);
  assert.strictEqual(bestiary.entry("enraged-wolf-man").step, 200);
  assert.strictEqual(bestiary.entry("enraged-wolf-man").strike, 300);
  assert.strictEqual(bestiary.entry("swarm").hp, 3);
  assert.strictEqual(bestiary.entry("swarm").step, 80);
  assert.strictEqual(bestiary.entry("swarm").strike, 300);
  assert.strictEqual(bestiary.entry("swarm").ability, "split");
  assert.strictEqual(bestiary.entry("pumpkin").size, 2);
  assert.strictEqual(bestiary.entry("pumpkin").step, 800);
  assert.strictEqual(bestiary.entry("pumpkin").ability, "fuse");
  assert.strictEqual(bestiary.entry("reaper").size, 2);
  assert.strictEqual(bestiary.entry("reaper").hp, 90);

  const serpentEntry = bestiary.entry("serpent");
  assert.strictEqual(serpentEntry.group, "vermin");
  assert.strictEqual(serpentEntry.hp, 60);
  assert.strictEqual(serpentEntry.attack, 10);
  assert.strictEqual(serpentEntry.defense, 6);
  assert.strictEqual(serpentEntry.slows, true);
  assert.strictEqual(serpentEntry.size, 3);

  const mageEntry = bestiary.entry("mage");
  assert.deepStrictEqual(mageEntry, { kind: "mage", group: "undead", hp: 8, attack: 2, defense: 1, magic: 4, magicPower: 1, range: 4, slows: false, reach: 7, step: 400, strike: 700, size: 1, ability: "none" });

  const swordsmanEntry = bestiary.entry("swordsman");
  assert.strictEqual(swordsmanEntry.group, "undead");
  assert.strictEqual(swordsmanEntry.hp, 11);
  assert.strictEqual(swordsmanEntry.attack, 5);
  assert.strictEqual(swordsmanEntry.defense, 2);
  assert.strictEqual(swordsmanEntry.range, 1);

  assert.strictEqual(bestiary.group("beholder"), "demon");

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

test("intent/valid", () => {
  const m = intent.move(0, -1);
  assert.strictEqual(m.kind, "move");
  assert.strictEqual(m.dx, 0);
  assert.strictEqual(m.dy, -1);
  assert.ok(Object.isFrozen(m));

  const m2 = intent.move(1, 1);
  assert.strictEqual(m2.kind, "move");

  const m3 = intent.move(-1, 1);
  assert.strictEqual(m3.kind, "move");

  const a = intent.attack(1, 0);
  assert.strictEqual(a.kind, "attack");
  assert.strictEqual(a.dx, 1);
  assert.strictEqual(a.dy, 0);

  const a0 = intent.attack();
  assert.strictEqual(a0.kind, "attack");
  assert.strictEqual(a0.dx, 0);
  assert.strictEqual(a0.dy, 0);

  const a00 = intent.attack(0, 0);
  assert.strictEqual(a00.kind, "attack");
  assert.strictEqual(a00.dx, 0);
  assert.strictEqual(a00.dy, 0);

  const am = intent.attack(-1, -1);
  assert.strictEqual(am.kind, "attack");

  const f = intent.face(1, -1);
  assert.strictEqual(f.kind, "face");
  assert.strictEqual(f.dx, 1);
  assert.strictEqual(f.dy, -1);

  const u = intent.use();
  assert.strictEqual(u.kind, "use");
  assert.strictEqual(u.dx, 0);
  assert.strictEqual(u.dy, 0);

  const w = intent.wait();
  assert.strictEqual(w.kind, "wait");
  assert.strictEqual(w.dx, 0);
  assert.strictEqual(w.dy, 0);

  const d = intent.descend();
  assert.strictEqual(d.kind, "descend");
  assert.strictEqual(d.dx, 0);
  assert.strictEqual(d.dy, 0);

  assert.deepStrictEqual(intent.KINDS, ["move", "attack", "use", "wait", "descend", "face"]);

  assert.throws(() => intent.move(0, 0), TypeError);
  assert.throws(() => intent.move(2, 0), TypeError);
  assert.throws(() => intent.move("1", 0), TypeError);
  assert.throws(() => intent.face(0, 0), TypeError);
  assert.throws(() => intent.face(0, 2), TypeError);
  assert.throws(() => intent.attack(2, 0), TypeError);
  assert.throws(() => intent.attack(1), TypeError);
});

test("stats/valid", () => {
  const s = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  assert.strictEqual(s.hp, 5);
  assert.strictEqual(s.maxHp, 10);
  assert.strictEqual(s.attack, 3);
  assert.strictEqual(s.defense, 1);
  assert.strictEqual(s.range, 1);
  assert.strictEqual(s.magic, 0);
  assert.strictEqual(s.magicPower, 1);
  assert.strictEqual(s.magicResist, 0);
  assert.deepStrictEqual(s, { hp: 5, maxHp: 10, attack: 3, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 });
  assert.ok(Object.isFrozen(s));

  const s0 = stats.of({ hp: 0, maxHp: 10, attack: 3, defense: 1 });
  assert.strictEqual(s0.hp, 0);

  const s4 = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, range: 4 });
  assert.strictEqual(s4.range, 4);

  const sm = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magic: 6, magicPower: 2, magicResist: 3 });
  assert.strictEqual(sm.magic, 6);
  assert.strictEqual(sm.magicPower, 2);
  assert.strictEqual(sm.magicResist, 3);

  assert.throws(() => stats.of({ hp: 11, maxHp: 10, attack: 3, defense: 1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 0, attack: 3, defense: 1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: -1, defense: 1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1.5 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, range: 0 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, range: 10 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magic: -1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magicPower: 0 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magicResist: -1 }), TypeError);
  assert.throws(() => stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, magicResist: 0.5 }), TypeError);
  assert.throws(() => stats.of({ maxHp: 10, attack: 3, defense: 1 }), TypeError);
});
