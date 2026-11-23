import test from "node:test";
import assert from "node:assert/strict";

import * as point from "../../../shapes/point/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as intent from "../../../shapes/intent/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import { decide } from "../../../src/monsters/index.mjs";

const s = stats.of({ hp: 5, maxHp: 10, attack: 3, defense: 1, range: 1 });

test("adjacent-attacks: skeleton attacks adjacent", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(3, 3), stats: s });
  assert.deepEqual(decide(skeleton, grid, [point.of(3, 2)], [], [], 0), intent.move(0, -1));
  assert.deepEqual(decide(skeleton, grid, [point.of(2, 3)], [], [], 0), intent.move(-1, 0));
  assert.deepEqual(decide(skeleton, grid, [point.of(4, 4)], [], [], 0), intent.move(1, 1));
  // foe at (5,1): not next to (distance 2), chase steps up-right.
  assert.deepEqual(decide(skeleton, grid, [point.of(5, 1)], [], [], 0), intent.move(1, -1));
});

test("adjacent-attacks: corner next-to", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#...#", "#####"]);
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 2), stats: s });
  // foe at (2,1): next to, move (1,-1).
  assert.deepEqual(decide(skeleton, grid, [point.of(2, 1)], [], [], 0), intent.move(1, -1));
});

test("adjacent-attacks: corner wall, not next-to", () => {
  const grid = tileGrid.fromRows(["#####", "##..#", "#...#", "#####"]);
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 2), stats: s });
  // foe at (2,1): not next to (wall at (1,1)), chase steps (1,0).
  assert.deepEqual(decide(skeleton, grid, [point.of(2, 1)], [], [], 0), intent.move(1, 0));
});

test("chases: snake routes around walls", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#.###.#", "#.....#", "#######"]);
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(1, 3), stats: s });
  assert.deepEqual(decide(snake, grid, [point.of(5, 1)], [], [], 0), intent.move(1, 0));
  assert.deepEqual(decide(snake, grid, [point.of(5, 1)], [], [point.of(2, 3)], 0), intent.move(0, -1));
});

test("reach: snake and bat limits", () => {
  const grid = tileGrid.of(20, 3, Array(60).fill("floor"));
  const snake = actor.of({ id: 1, kind: "snake", pos: point.of(0, 1), stats: s });
  assert.deepEqual(decide(snake, grid, [point.of(7, 1)], [], [], 0), intent.wait());
  assert.deepEqual(decide(snake, grid, [point.of(6, 1)], [], [], 0), intent.move(1, 0));
  const bat = actor.of({ id: 2, kind: "bat", pos: point.of(0, 1), stats: s });
  assert.deepEqual(decide(bat, grid, [point.of(9, 1)], [], [], 0), intent.move(1, 0));
  assert.deepEqual(decide(bat, grid, [point.of(10, 1)], [], [], 0), intent.wait());
  const snake2 = actor.of({ id: 3, kind: "snake", pos: point.of(0, 1), stats: s });
  assert.deepEqual(decide(snake2, grid, [point.of(6, 2)], [], [], 0), intent.move(1, 1));
});

test("slime-slow: slime waits on odd turns", () => {
  const grid = tileGrid.of(5, 5, Array(25).fill("floor"));
  const slime = actor.of({ id: 1, kind: "slime", pos: point.of(2, 2), stats: s });
  assert.deepEqual(decide(slime, grid, [point.of(2, 1)], [], [], 3), intent.wait());
  assert.deepEqual(decide(slime, grid, [point.of(2, 1)], [], [], 4), intent.move(0, -1));
  const blueSlime = actor.of({ id: 2, kind: "blue-slime", pos: point.of(2, 2), stats: s });
  assert.deepEqual(decide(blueSlime, grid, [point.of(2, 1)], [], [], 3), intent.wait());
});

test("guard: guard waits unless next to foe", () => {
  const grid = tileGrid.of(7, 7, Array(49).fill("floor"));
  const slime = actor.of({ id: 1, kind: "slime", pos: point.of(2, 2), stats: s, mode: "guard" });
  // foe at (3,3): next to, move (1,1).
  assert.deepEqual(decide(slime, grid, [point.of(3, 3)], [], [], 0), intent.move(1, 1));
  const slime2 = actor.of({ id: 2, kind: "slime", pos: point.of(2, 2), stats: s, mode: "guard" });
  // foe at (4,2): not next to, guard waits.
  assert.deepEqual(decide(slime2, grid, [point.of(4, 2)], [], [], 0), intent.wait());
  const slime3 = actor.of({ id: 3, kind: "slime", pos: point.of(2, 2), stats: s, mode: "guard" });
  assert.deepEqual(decide(slime3, grid, [point.of(4, 2)], [], [], 2), intent.wait());
});

test("dormant: dormant waits, roam moves", () => {
  const grid = tileGrid.of(10, 10, Array(100).fill("floor"));
  const golem = actor.of({ id: 1, kind: "golem", pos: point.of(1, 1), stats: s, size: 3, mode: "dormant" });
  assert.deepEqual(decide(golem, grid, [point.of(4, 2)], [], [], 0), intent.wait());
  const golem2 = actor.of({ id: 2, kind: "golem", pos: point.of(1, 1), stats: s, size: 3, mode: "roam" });
  // foe at (4,2): next to cell (3,2), move (1,0).
  assert.deepEqual(decide(golem2, grid, [point.of(4, 2)], [], [], 0), intent.move(1, 0));
  const golem3 = actor.of({ id: 3, kind: "golem", pos: point.of(1, 1), stats: s, size: 3, mode: "roam" });
  // foe at (8,2): within reach (30), chase steps (1,0).
  assert.deepEqual(decide(golem3, grid, [point.of(8, 2)], [], [], 0), intent.move(1, 0));
});

test("flees: worm flees threat", () => {
  const grid = tileGrid.of(12, 12, Array(144).fill("floor"));
  const worm = actor.of({ id: 1, kind: "worm", pos: point.of(4, 4), stats: s });
  assert.deepEqual(decide(worm, grid, [], [point.of(2, 4)], [], 0), intent.move(1, 0));
  const worm2 = actor.of({ id: 2, kind: "worm", pos: point.of(4, 4), stats: s });
  assert.deepEqual(decide(worm2, grid, [], [point.of(4, 2)], [], 0), intent.move(0, 1));
  const worm3 = actor.of({ id: 3, kind: "worm", pos: point.of(4, 4), stats: s });
  // threat at (10,4): distance 6 > 5, waits.
  assert.deepEqual(decide(worm3, grid, [], [point.of(10, 4)], [], 0), intent.wait());
});

test("flees: no step farther, waits", () => {
  const grid = tileGrid.fromRows(["#####", "#...#", "#####"]);
  const worm = actor.of({ id: 1, kind: "worm", pos: point.of(3, 1), stats: s });
  assert.deepEqual(decide(worm, grid, [], [point.of(1, 1)], [], 0), intent.wait());
});

test("shoots: archer shoots in line", () => {
  const grid = tileGrid.of(9, 9, Array(81).fill("floor"));
  const archer = actor.of({ id: 1, kind: "archer", pos: point.of(1, 1), stats: stats.of({ hp: 7, maxHp: 14, attack: 3, defense: 1, range: 4 }) });
  assert.deepEqual(decide(archer, grid, [point.of(5, 1)], [], [], 0), intent.attack(1, 0));
  assert.deepEqual(decide(archer, grid, [point.of(5, 5)], [], [], 0), intent.attack(1, 1));
  // foe at (6,1): distance 5 > range 4, not in line, chase steps (1,0).
  assert.deepEqual(decide(archer, grid, [point.of(6, 1)], [], [], 0), intent.move(1, 0));
  // foe at (3,5): not in line (not same row/col/diagonal), chase steps (1,1).
  assert.deepEqual(decide(archer, grid, [point.of(3, 5)], [], [], 0), intent.move(1, 1));
});

test("shoots: wall blocks shot", () => {
  const grid = tileGrid.fromRows(["#######", "#..#..#", "#######"]);
  const archer = actor.of({ id: 1, kind: "archer", pos: point.of(1, 1), stats: stats.of({ hp: 7, maxHp: 14, attack: 3, defense: 1, range: 4 }) });
  // foe at (5,1): wall at (3,1) between, does not shoot, no path, waits.
  assert.deepEqual(decide(archer, grid, [point.of(5, 1)], [], [], 0), intent.wait());
});

test("kites: ranged monsters back off", () => {
  const grid = tileGrid.of(12, 12, Array(144).fill("floor"));
  const archer = actor.of({ id: 1, kind: "archer", pos: point.of(5, 5), stats: stats.of({ hp: 7, maxHp: 14, attack: 3, defense: 1, range: 4 }) });
  // foe at (5,3): 2 away, backs off to (0,1).
  assert.deepEqual(decide(archer, grid, [point.of(5, 3)], [], [], 0), intent.move(0, 1));
  // foe at (5,4): next to it, backs off to (0,1).
  assert.deepEqual(decide(archer, grid, [point.of(5, 4)], [], [], 0), intent.move(0, 1));
  // foe at (8,5): 3 away, backs off to (-1,0).
  assert.deepEqual(decide(archer, grid, [point.of(8, 5)], [], [], 0), intent.move(-1, 0));
  // foe at (5,1): 4 away, full range, in line, shoots.
  assert.deepEqual(decide(archer, grid, [point.of(5, 1)], [], [], 0), intent.attack(0, -1));
  // mode guard with foe at (5,3): rule 3 skipped, guard waits.
  const archerGuard = actor.of({ id: 2, kind: "archer", pos: point.of(5, 5), stats: stats.of({ hp: 7, maxHp: 14, attack: 3, defense: 1, range: 4 }), mode: "guard" });
  assert.deepEqual(decide(archerGuard, grid, [point.of(5, 3)], [], [], 0), intent.wait());
  // skeleton (range 1) with foe at (5,3): rule 3 skipped (range not > 1), chases (0,-1).
  const skel = actor.of({ id: 3, kind: "skeleton", pos: point.of(5, 5), stats: s });
  assert.deepEqual(decide(skel, grid, [point.of(5, 3)], [], [], 0), intent.move(0, -1));
});

test("kites: shoot between steps while backing off", () => {
  const grid = tileGrid.of(12, 12, Array(144).fill("floor"));
  const archerMove = actor.of({ id: 1, kind: "archer", pos: point.of(5, 5), stats: stats.of({ hp: 7, maxHp: 14, attack: 3, defense: 1, range: 4 }), last: { kind: "move", dx: 0, dy: 1, at: 0 } });
  // foe at (5,3): 2 away, in line, last was move: shoot between steps attack(0,-1).
  assert.deepEqual(decide(archerMove, grid, [point.of(5, 3)], [], [], 0), intent.attack(0, -1));
  // foe at (6,3): 2 away, not in line, last was move: back off to (0,1).
  assert.deepEqual(decide(archerMove, grid, [point.of(6, 3)], [], [], 0), intent.move(0, 1));
  const archerAttack = actor.of({ id: 2, kind: "archer", pos: point.of(5, 5), stats: stats.of({ hp: 7, maxHp: 14, attack: 3, defense: 1, range: 4 }), last: { kind: "attack", dx: 0, dy: -1, at: 0, reach: 2 } });
  // foe at (5,3): last was attack, not move: back off to (0,1).
  assert.deepEqual(decide(archerAttack, grid, [point.of(5, 3)], [], [], 0), intent.move(0, 1));
});

test("kites: cornered melee and shoot", () => {
  const grid = tileGrid.fromRows(["#######", "#.....#", "#######"]);
  const archer = actor.of({ id: 1, kind: "archer", pos: point.of(5, 1), stats: stats.of({ hp: 7, maxHp: 14, attack: 3, defense: 1, range: 4 }) });
  // foe at (4,1): next to it; cornered, rule 3 falls through, melee attack move(-1,0).
  assert.deepEqual(decide(archer, grid, [point.of(4, 1)], [], [], 0), intent.move(-1, 0));
  // foe at (3,1): 2 away, cornered, rule 3 falls through, shoot attack(-1,0).
  assert.deepEqual(decide(archer, grid, [point.of(3, 1)], [], [], 0), intent.attack(-1, 0));
});

test("no-path: waits when blocked", () => {
  const grid = tileGrid.fromRows(["#######", "#..#..#", "#######"]);
  const skeleton = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 1), stats: s });
  assert.deepEqual(decide(skeleton, grid, [point.of(4, 1)], [], [], 0), intent.wait());
});

test("abilities: summmon waits, fuse never attacks", () => {
  const grid = tileGrid.of(9, 9, Array(81).fill("floor"));
  // scarecrow (ability summmon) waits with foe next to it and with foe within reach.
  const scarecrow = actor.of({ id: 1, kind: "scarecrow", pos: point.of(4, 4), stats: s });
  assert.deepEqual(decide(scarecrow, grid, [point.of(4, 3)], [], [], 0), intent.wait());
  assert.deepEqual(decide(scarecrow, grid, [point.of(4, 1)], [], [], 0), intent.wait());
  // pumpkin (ability fuse) next to a foe waits; otherwise moves toward it.
  const pumpkin = actor.of({ id: 2, kind: "pumpkin", pos: point.of(2, 2), stats: s, size: 2 });
  // foe at (4,2): next to its square (cell (3,2) is distance 1), waits.
  assert.deepEqual(decide(pumpkin, grid, [point.of(4, 2)], [], [], 0), intent.wait());
  // foe at (7,2): not next to it, steps (1,0) toward it.
  assert.deepEqual(decide(pumpkin, grid, [point.of(7, 2)], [], [], 0), intent.move(1, 0));
  // swarm (ability split) with foe next to it attacks.
  const swarm = actor.of({ id: 3, kind: "swarm", pos: point.of(4, 4), stats: s });
  assert.deepEqual(decide(swarm, grid, [point.of(4, 3)], [], [], 0), intent.move(0, -1));
});

test("refuses: bad arguments", () => {
  const grid = tileGrid.fromRows(["###", "#.>", "###"]);
  const hero = actor.of({ id: 0, kind: "hero", pos: point.of(1, 1), stats: s });
  const monster = actor.of({ id: 1, kind: "skeleton", pos: point.of(1, 1), stats: s });
  assert.throws(() => decide(hero, grid, [point.of(1, 1)], [], [], 0), TypeError);
  assert.throws(() => decide(monster, grid, [{ x: 1, y: 1 }], [], [], 0), TypeError);
  assert.throws(() => decide(monster, grid, [point.of(1, 1)], [], {}, 0), TypeError);
  assert.throws(() => decide(monster, grid, [point.of(1, 1)], {}, [], 0), TypeError);
  assert.throws(() => decide(monster, grid, [point.of(1, 1)], [], [], -1), TypeError);
});
