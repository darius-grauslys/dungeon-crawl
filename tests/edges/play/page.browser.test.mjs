// play: edge test `page`. Browser tests for the play Node, reached only
// through its call site. One test per intrinsic of the EET page.

import test from "node:test";
import assert from "node:assert/strict";

import { start } from "../../../edges/edge_to_play.mjs";
import * as world from "../../../shapes/world/index.mjs";

test("starts", () => {
  const h = start(document, 7);
  const w = h.world();
  assert.equal(w.seed, 7);
  assert.equal(w.depth, 1);
  assert.equal(w.turn, 0);
  assert.equal(w.state, "playing");
  assert.equal(document.querySelectorAll("canvas").length, 1);
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(796, 596, 1, 1).data;
  assert.notDeepEqual([img[0], img[1], img[2]], [22, 13, 19]);
  h.stop();
});

test("keys-play", () => {
  const h = start(document, 7);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", cancelable: true }));
  assert.equal(h.world().turn, 1);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "r", cancelable: true }));
  const w = h.world();
  assert.equal(w.seed, 8);
  assert.equal(w.turn, 0);
  const beforeStop = { seed: w.seed, turn: w.turn, depth: w.depth, state: w.state };
  h.stop();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", cancelable: true }));
  const afterStop = h.world();
  assert.equal(afterStop.seed, beforeStop.seed);
  assert.equal(afterStop.turn, beforeStop.turn);
  assert.equal(afterStop.depth, beforeStop.depth);
  assert.equal(afterStop.state, beforeStop.state);
});

test("creates-canvas", () => {
  const doc = document.implementation.createHTMLDocument("t");
  const h = start(doc, 3);
  const canvases = doc.querySelectorAll("canvas");
  assert.equal(canvases.length, 1);
  const canvas = canvases[0];
  assert.equal(canvas.width, 960);
  assert.equal(canvas.height, 720);
  assert.equal(doc.body.contains(canvas), true);
  h.stop();
});

test("world/valid", () => {
  // Build a world with the shape's of and the shapes it names. The shapes
  // are stubs in this group; the test is held to load and run, not to pass.
  const w = world.of({
    seed: 7, rng: 1, depth: 1, turn: 0, state: "playing",
    grid: {}, hero: {}, monsters: [], items: [],
    visible: {}, explored: {}, gold: 0, log: []
  });
  assert.equal(w.seed, 7);
  assert.equal(w.depth, 1);
  assert.equal(w.turn, 0);
  assert.equal(w.state, "playing");
  assert.ok(Object.isFrozen(w));
  assert.ok(Object.isFrozen(w.monsters));
  assert.ok(Object.isFrozen(w.items));
  assert.ok(Object.isFrozen(w.log));
  const w2 = w.with({ turn: 9 });
  assert.equal(w2.turn, 9);
  assert.equal(w.turn, 0);
});
