import test from "node:test";
import assert from "node:assert/strict";
import * as view from "../../../src/view/index.mjs";

function mockWorld(heroes, gw, gh) {
  return {
    heroes,
    grid: { width: gw, height: gh }
  };
}

function makeHero(name, x, y, alive) {
  return { name, actor: { pos: { x, y } }, alive };
}

test("camera: Ann alive at (2,2) -> (0,0)", () => {
  const w = mockWorld([makeHero("Ann", 2, 2, true)], 48, 32);
  const c = view.camera(w, "Ann", 16, 10);
  assert.equal(c.x, 0);
  assert.equal(c.y, 0);
});

test("camera: Ann alive at (40,30) -> (32,22)", () => {
  const w = mockWorld([makeHero("Ann", 40, 30, true)], 48, 32);
  const c = view.camera(w, "Ann", 16, 10);
  assert.equal(c.x, 32);
  assert.equal(c.y, 22);
});

test("camera: Ann alive at (20,15) -> (12,10)", () => {
  const w = mockWorld([makeHero("Ann", 20, 15, true)], 48, 32);
  const c = view.camera(w, "Ann", 16, 10);
  assert.equal(c.x, 12);
  assert.equal(c.y, 10);
});

test("camera: Ann not alive, Bob alive at (20,15) -> (12,10)", () => {
  const w = mockWorld([makeHero("Ann", 2, 2, false), makeHero("Bob", 20, 15, true)], 48, 32);
  const c = view.camera(w, "Ann", 16, 10);
  assert.equal(c.x, 12);
  assert.equal(c.y, 10);
});

test("camera: no hero alive -> (0,0)", () => {
  const w = mockWorld([makeHero("Ann", 20, 15, false)], 48, 32);
  const c = view.camera(w, "Ann", 16, 10);
  assert.equal(c.x, 0);
  assert.equal(c.y, 0);
});

test("camera: 10x5 grid, any focus -> (0,0)", () => {
  const w = mockWorld([makeHero("Ann", 3, 2, true)], 10, 5);
  const c = view.camera(w, "Ann", 10, 5);
  assert.equal(c.x, 0);
  assert.equal(c.y, 0);
});
