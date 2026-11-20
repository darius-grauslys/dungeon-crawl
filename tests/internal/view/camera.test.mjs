import test from "node:test";
import assert from "node:assert/strict";
import * as view from "../../../src/view/index.mjs";

function mockWorld(gw, gh, hx, hy) {
  return {
    hero: { pos: { x: hx, y: hy } },
    grid: { width: gw, height: gh }
  };
}

test("camera clamp: 48x32 grid, view 16x10, hero (2,2) -> (0,0)", () => {
  const c = view.camera(mockWorld(48, 32, 2, 2), 16, 10);
  assert.equal(c.x, 0);
  assert.equal(c.y, 0);
});

test("camera clamp: 48x32 grid, view 16x10, hero (40,30) -> (32,22)", () => {
  const c = view.camera(mockWorld(48, 32, 40, 30), 16, 10);
  assert.equal(c.x, 32);
  assert.equal(c.y, 22);
});

test("camera clamp: 48x32 grid, view 16x10, hero (20,15) -> (12,10)", () => {
  const c = view.camera(mockWorld(48, 32, 20, 15), 16, 10);
  assert.equal(c.x, 12);
  assert.equal(c.y, 10);
});

test("camera clamp: 10x5 grid, any hero -> (0,0)", () => {
  const c = view.camera(mockWorld(10, 5, 3, 2), 10, 5);
  assert.equal(c.x, 0);
  assert.equal(c.y, 0);
});
