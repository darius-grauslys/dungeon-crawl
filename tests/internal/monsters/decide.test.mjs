import test from "node:test";
import assert from "node:assert/strict";

import * as point from "../../../shapes/point/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import { decide } from "../../../src/monsters/index.mjs";

const s = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1 });

test("adjacent-attacks: skeleton attacks adjacent hero", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(3, 3), stats: s });
  assert.deepEqual(decide(skeleton, point.of(3, 2), grid, [], 0), intent.move(0, -1));
  assert.deepEqual(decide(skeleton, point.of(2, 3), grid, [], 0), intent.move(-1, 0));
  assert.deepEqual(decide(skeleton, point.of(4, 4), grid, [], 0), intent.move(1, 0));
  assert.deepEqual(decide(skeleton, point.of(4, 2), grid, [], 0), intent.move(0, -1));
});

test("chases: snake routes around walls", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#.###.#", "#.....#", "#######"]);
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(1, 3), stats: s });
  assert.deepEqual(decide(snake, point.of(5, 1), grid, [], 0), intent.move(0, -1));
  assert.deepEqual(decide(snake, point.of(5, 1), grid, [point.of(1, 2)], 0), intent.move(1, 0));
});

test("reach: snake and bat limits", () => {
  const grid = tileGrid.of(20, 3, Array(60).fill("floor"));
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(0, 1), stats: s });
  assert.deepEqual(decide(snake, point.of(7, 1), grid, [], 0), intent.wait());
  assert.deepEqual(decide(snake, point.of(6, 1), grid, [], 0), intent.move(1, 0));
  const bat = actor.of({ id: 2, kind: "bat", pos: point.of(0, 1), stats: s });
  assert.deepEqual(decide(bat, point.of(9, 1), grid, [], 0), intent.move(1, 0));
  assert.deepEqual(decide(bat, point.of(10, 1), grid, [], 0), intent.wait());
});

test("slime-slow: slime waits on odd turns", () => {
  const grid = tileGrid.of(5, 5, Array(25).fill("floor"));
  const slime = actor.of({ id: 1, kind: "slime", pos: point.of(2, 2), stats: s });
  assert.deepEqual(decide(slime, point.of(2, 1), grid, [], 3), intent.wait());
  assert.deepEqual(decide(slime, point.of(2, 1), grid, [], 4), intent.move(0, -1));
});

test("no-path: waits when blocked", () => {
  const grid = tileGrid.fromRows(["#######", "#..#..#", "#######"]);
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 1), stats: s });
  assert.deepEqual(decide(skeleton, point.of(4, 1), grid, [], 0), intent.wait());
});

test("refuses: bad arguments", () => {
  const grid = tileGrid.fromRows(["###", "#.>", "###"]);
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: s });
  assert.throws(() => decide(hero, point.of(1, 1), grid, [], 0), TypeError);
  const monster = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 1), stats: s });
  assert.throws(() => decide(monster, { x: 1, y: 1 }, grid, [], 0), TypeError);
  assert.throws(() => decide(monster, point.of(1, 1), grid, {}, 0), TypeError);
  assert.throws(() => decide(monster, point.of(1, 1), grid, [], -1), TypeError);
});
