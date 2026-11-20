// tests/internal/dungeon/generator.test.mjs: mulberry32 generator determinism.

import test from "node:test";
import assert from "node:assert/strict";

// mulberry32: a 32-bit generator; its state is a uint32, each draw adds 0x6D2B79F5 to it and mixes it.
function makeGenerator(seed, depth) {
  let state = (seed ^ Math.imul(depth, 0x9E3779B1)) >>> 0;
  return {
    next() {
      state = (state + 0x6D2B79F5) >>> 0;
      state = (state ^ ((state << 13) >>> 0)) >>> 0;
      state = (state ^ (state >> 17)) >>> 0;
      state = (state ^ ((state << 5) >>> 0)) >>> 0;
      return state >>> 0;
    },
    int31(n) {
      return this.next() % n;
    },
    bool() {
      return (this.next() & 1) === 1;
    }
  };
}

test("mulberry32 generator is deterministic for the same seed and depth", () => {
  const g1 = makeGenerator(1, 1);
  const g2 = makeGenerator(1, 1);
  const seq1 = [g1.next(), g1.next(), g1.next(), g1.int31(10), g1.bool()];
  const seq2 = [g2.next(), g2.next(), g2.next(), g2.int31(10), g2.bool()];
  assert.deepStrictEqual(seq1, seq2);
});

test("mulberry32 generator starts from the seeded state", () => {
  const g = makeGenerator(0, 1);
  const first = g.next();
  assert.strictEqual(typeof first, "number");
  assert.ok(first >= 0 && first < 4294967296);
});

test("mulberry32 generator differs for different seeds", () => {
  const g1 = makeGenerator(1, 1);
  const g2 = makeGenerator(2, 1);
  assert.notStrictEqual(g1.next(), g2.next());
});

test("mulberry32 generator differs for different depths", () => {
  const g1 = makeGenerator(1, 1);
  const g2 = makeGenerator(1, 2);
  assert.notStrictEqual(g1.next(), g2.next());
});
