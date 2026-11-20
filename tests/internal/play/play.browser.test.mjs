// play: browser tests for the play Node's intrinsics.

import test from "node:test";
import assert from "node:assert/strict";
import * as play from "../../../src/play/index.mjs";

test("starts: a game of seed 7 is drawn and the panel shows", () => {
  assert.ok(document.querySelector("canvas"), "the page has a canvas");
  const h = play.start(document, 7);
  const w = h.world();
  assert.equal(w.seed, 7);
  assert.equal(w.depth, 1);
  assert.equal(w.turn, 0);
  assert.equal(w.state, "playing");
  assert.equal(document.querySelectorAll("canvas").length, 1, "exactly one canvas");
  const ctx = document.querySelector("canvas").getContext("2d");
  const img = ctx.getImageData(796, 596, 1, 1).data;
  const isBackground = img[0] === 22 && img[1] === 13 && img[2] === 19;
  assert.ok(!isBackground, "pixel (796, 596) is not the background rgb(22, 13, 19)");
  h.stop();
});

test("keys-play: z advances a turn, r restarts, stop halts", () => {
  const h = play.start(document, 7);
  assert.equal(h.world().turn, 0);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "z" }));
  assert.equal(h.world().turn, 1);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
  assert.equal(h.world().seed, 8);
  assert.equal(h.world().turn, 0);
  h.stop();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "z" }));
  assert.equal(h.world().turn, 0);
});

test("creates-canvas: a fresh document gets a 960 by 720 canvas", () => {
  const doc = document.implementation.createHTMLDocument("t");
  const h = play.start(doc, 3);
  const canvases = doc.querySelectorAll("canvas");
  assert.equal(canvases.length, 1, "one canvas appended");
  const c = canvases[0];
  assert.equal(c.width, 960);
  assert.equal(c.height, 720);
  assert.equal(doc.body.contains(c), true);
  h.stop();
});
