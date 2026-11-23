import test from "node:test";
import assert from "node:assert/strict";
import * as view from "../../../src/view/index.mjs";
import * as world from "../../../shapes/world/index.mjs";
import * as point from "../../../shapes/point/index.mjs";
import * as tileGrid from "../../../shapes/tile-grid/index.mjs";
import * as mask from "../../../shapes/mask/index.mjs";
import * as actor from "../../../shapes/actor/index.mjs";
import * as stats from "../../../shapes/stats/index.mjs";
import * as heroShape from "../../../shapes/hero/index.mjs";
import * as saveShape from "../../../shapes/save/index.mjs";

function makeCanvas(w, h) {
  return {
    width: w,
    height: h,
    getContext: () => ({
      imageSmoothingEnabled: false
    })
  };
}

function makeWorld(annX, annY, gw, gh) {
  const tiles = Array(gw * gh).fill("floor");
  const grid = tileGrid.of(gw, gh, tiles);
  const visible = mask.of(gw, gh, Array(gw * gh).fill(true));
  const explored = mask.of(gw, gh, Array(gw * gh).fill(true));
  const annActor = actor.of({ id: 0, kind: "hero", pos: point.of(annX, annY), stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) });
  const heroes = [heroShape.of({ name: "Ann", actor: annActor, alive: true })];
  const entry = saveShape.of({ seed: 1, depth: 2, players: [{ name: "Ann", stats: stats.of({ hp: 18, maxHp: 24, attack: 4, defense: 1 }) }] });
  return world.of({ seed: 1, rng: 2, depth: 2, time: 0, state: "playing", grid, heroes, monsters: [], items: [], visible, explored, gold: 5, log: [], entry });
}

test("cellAt: no canvas given to init throws", () => {
  // canvas_ is null because init hasn't been called in this file yet
  const w = makeWorld(20, 15, 48, 32);
  assert.throws(() => view.cellAt(w, "Ann", 100, 60), Error);
});

test("cellAt: 800x600, Ann at (20,15), pixel (100,60) -> (14,11)", () => {
  view.init(makeCanvas(800, 600));
  const w = makeWorld(20, 15, 48, 32);
  const p = view.cellAt(w, "Ann", 100, 60);
  assert.equal(p.x, 14);
  assert.equal(p.y, 11);
});

test("cellAt: 800x600, Ann at (20,15), pixel (0,0) -> (12,10)", () => {
  view.init(makeCanvas(800, 600));
  const w = makeWorld(20, 15, 48, 32);
  const p = view.cellAt(w, "Ann", 0, 0);
  assert.equal(p.x, 12);
  assert.equal(p.y, 10);
});

test("cellAt: 800x600, Ann at (20,15), pixel (767,479) -> (27,19)", () => {
  view.init(makeCanvas(800, 600));
  const w = makeWorld(20, 15, 48, 32);
  const p = view.cellAt(w, "Ann", 767, 479);
  assert.equal(p.x, 27);
  assert.equal(p.y, 19);
});

test("cellAt: off map returns null", () => {
  view.init(makeCanvas(800, 600));
  const w = makeWorld(20, 15, 48, 32);
  assert.equal(view.cellAt(w, "Ann", 768, 10), null);
  assert.equal(view.cellAt(w, "Ann", 10, 480), null);
  assert.equal(view.cellAt(w, "Ann", -1, 10), null);
});

test("cellAt: 10x5 grid, pixel (100,60) -> (2,1)", () => {
  view.init(makeCanvas(480, 360));
  const w = makeWorld(3, 2, 10, 5);
  const p = view.cellAt(w, "Ann", 100, 60);
  assert.equal(p.x, 2);
  assert.equal(p.y, 1);
});

test("cellAt: cell outside grid returns null", () => {
  view.init(makeCanvas(480, 360));
  const w = makeWorld(3, 2, 10, 5);
  assert.equal(view.cellAt(w, "Ann", 600, 100), null);
});
