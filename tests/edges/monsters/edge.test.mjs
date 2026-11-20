// The edge test for monsters: one test per intrinsic of the EET decide.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as actor from "../../../shapes/actor/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import { decide } from "../../../edges/edge_to_monsters.mjs";

const monsterStats = { hp: 5, maxHp: 5, attack: 2, defense: 0 };

test("adjacent-attacks", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(3, 3), stats: stats.of(monsterStats) });

  let i = decide(skeleton, point.of(3, 2), grid, [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);

  i = decide(skeleton, point.of(2, 3), grid, [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, -1);
  assert.strictEqual(i.dy, 0);

  i = decide(skeleton, point.of(4, 4), grid, [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(skeleton, point.of(4, 2), grid, [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);
});

test("chases", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#.###.#", "#.....#", "#######"]);
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(1, 3), stats: stats.of(monsterStats) });

  let i = decide(snake, point.of(5, 1), grid, [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);

  i = decide(snake, point.of(5, 1), grid, [point.of(1, 2)], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);
});

test("reach", () => {
  const grid = tileGrid.of(20, 3, Array(60).fill("floor"));
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(0, 1), stats: stats.of(monsterStats) });
  const bat = actor.of({ id: 2, kind: "bat", pos: point.of(0, 1), stats: stats.of(monsterStats) });

  let i = decide(snake, point.of(7, 1), grid, [], 0);
  assert.strictEqual(i.kind, "wait");

  i = decide(snake, point.of(6, 1), grid, [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(bat, point.of(9, 1), grid, [], 0);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 1);
  assert.strictEqual(i.dy, 0);

  i = decide(bat, point.of(10, 1), grid, [], 0);
  assert.strictEqual(i.kind, "wait");
});

test("slime-slow", () => {
  const grid = tileGrid.of(5, 5, Array(25).fill("floor"));
  const slime = actor.of({ id: 1, kind: "slime", pos: point.of(2, 2), stats: stats.of(monsterStats) });

  let i = decide(slime, point.of(2, 1), grid, [], 3);
  assert.strictEqual(i.kind, "wait");

  i = decide(slime, point.of(2, 1), grid, [], 4);
  assert.strictEqual(i.kind, "move");
  assert.strictEqual(i.dx, 0);
  assert.strictEqual(i.dy, -1);
});

test("no-path", () => {
  const grid = tileGrid.fromRows(["#######", "#..#..#", "#######"]);
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 1), stats: stats.of(monsterStats) });

  const i = decide(skeleton, point.of(4, 1), grid, [], 0);
  assert.strictEqual(i.kind, "wait");
});

test("refuses", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));
  const heroActor = actor.of({ id: 0, kind: "hero", pos: point.of(3, 3), stats: stats.of(monsterStats) });

  assert.throws(() => decide(heroActor, point.of(3, 2), grid, [], 0), TypeError);
  assert.throws(() => decide(actor.of({ id: 1, kind: "snake", pos: point.of(1, 1), stats: stats.of(monsterStats) }), { x: 1, y: 1 }, grid, [], 0), TypeError);
  assert.throws(() => decide(actor.of({ id: 1, kind: "snake", pos: point.of(1, 1), stats: stats.of(monsterStats) }), point.of(3, 2), grid, "not-an-array", 0), TypeError);
  assert.throws(() => decide(actor.of({ id: 1, kind: "snake", pos: point.of(1, 1), stats: stats.of(monsterStats) }), point.of(3, 2), grid, [], -1), TypeError);
});

test("actor/valid", () => {
  const s = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });
  const a = actor.of({ id: 0, kind: "hero", pos: point.of(1, 2), stats: s });
  assert.strictEqual(a.id, 0);
  assert.strictEqual(a.kind, "hero");
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);
  assert.strictEqual(a.stats.hp, 5);
  assert.ok(Object.isFrozen(a));

  const b = a.with({ pos: point.of(3, 3) });
  assert.strictEqual(b.pos.x, 3);
  assert.strictEqual(b.pos.y, 3);
  assert.strictEqual(b.id, 0);
  assert.strictEqual(b.kind, "hero");
  assert.strictEqual(a.pos.x, 1);
  assert.strictEqual(a.pos.y, 2);

  assert.deepEqual(actor.KINDS, ["hero", "bat", "slime", "snake", "skeleton", "demon"]);

  assert.throws(() => actor.of({ id: 0, kind: "dragon", pos: point.of(1, 2), stats: s }), TypeError);
  assert.throws(() => actor.of({ id: -1, kind: "hero", pos: point.of(1, 2), stats: s }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: { x: 1, y: 2 }, stats: s }), TypeError);
  assert.throws(() => actor.of({ id: 0, kind: "hero", pos: point.of(1, 2) }), TypeError);
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
});

test("intent/valid", () => {
  const m = intent.move(0, -1);
  assert.strictEqual(m.kind, "move");
  assert.strictEqual(m.dx, 0);
  assert.strictEqual(m.dy, -1);
  assert.ok(Object.isFrozen(m));

  const w = intent.wait();
  assert.strictEqual(w.kind, "wait");
  assert.strictEqual(w.dx, 0);
  assert.strictEqual(w.dy, 0);

  const d = intent.descend();
  assert.strictEqual(d.kind, "descend");
  assert.strictEqual(d.dx, 0);
  assert.strictEqual(d.dy, 0);

  const r = intent.restart();
  assert.strictEqual(r.kind, "restart");
  assert.strictEqual(r.dx, 0);
  assert.strictEqual(r.dy, 0);

  assert.throws(() => intent.move(1, 1), TypeError);
  assert.throws(() => intent.move(0, 0), TypeError);
  assert.throws(() => intent.move(2, 0), TypeError);
  assert.throws(() => intent.move("1", 0), TypeError);
});
