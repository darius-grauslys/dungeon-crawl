// The tests of the shape save.

import { test } from "node:test";
import assert from "node:assert";

import { of, fromData, parse, isName, Save } from "../../../shapes/save/index.mjs";
import { of as statsOf } from "../../../shapes/stats/index.mjs";

const CY_STATS = statsOf({ hp: 10, maxHp: 30, attack: 6, defense: 2 });

test("save: valid creation has values and is frozen", () => {
  const s = of({
    seed: 9,
    depth: 3,
    players: [{ name: "Cy", stats: CY_STATS }],
  });

  assert.strictEqual(s.seed, 9);
  assert.strictEqual(s.depth, 3);
  assert.strictEqual(s.players.length, 1);
  assert.strictEqual(s.players[0].name, "Cy");
  assert.strictEqual(s.players[0].stats.hp, 10);
  assert.strictEqual(s.players[0].stats.maxHp, 30);
  assert.strictEqual(s.players[0].stats.attack, 6);
  assert.strictEqual(s.players[0].stats.defense, 2);

  assert.ok(Object.isFrozen(s));
  assert.ok(Object.isFrozen(s.players));
  assert.ok(Object.isFrozen(s.players[0]));
  assert.ok(Object.isFrozen(s.players[0].stats));

  assert.strictEqual(s.data().format, "crawl-save");

  const parsed = parse(s.text());
  assert.deepStrictEqual(parsed, s);
});

test("save: empty players accepted", () => {
  const s = of({ seed: 0, depth: 1, players: [] });
  assert.strictEqual(s.seed, 0);
  assert.strictEqual(s.depth, 1);
  assert.strictEqual(s.players.length, 0);
  assert.ok(Object.isFrozen(s));
});

test("save: fromData round-trips", () => {
  const s = of({ seed: 9, depth: 3, players: [{ name: "Cy", stats: CY_STATS }] });
  const from = fromData(s.data());
  assert.deepStrictEqual(from, s);
});

test("save: depth out of range throws", () => {
  assert.throws(() => of({ seed: 9, depth: 34, players: [] }), TypeError);
  assert.throws(() => of({ seed: 9, depth: 0, players: [] }), TypeError);
});

test("save: depth 33 accepted", () => {
  const s = of({ seed: 0, depth: 33, players: [] });
  assert.strictEqual(s.depth, 33);
  assert.ok(Object.isFrozen(s));
});

test("save: seed out of range throws", () => {
  assert.throws(() => of({ seed: -1, depth: 3, players: [] }), TypeError);
});

test("save: five players throws", () => {
  assert.throws(
    () =>
      of({
        seed: 9,
        depth: 3,
        players: [
          { name: "A", stats: CY_STATS },
          { name: "B", stats: CY_STATS },
          { name: "C", stats: CY_STATS },
          { name: "D", stats: CY_STATS },
          { name: "E", stats: CY_STATS },
        ],
      }),
    TypeError
  );
});

test("save: duplicate names throws", () => {
  assert.throws(
    () =>
      of({
        seed: 9,
        depth: 3,
        players: [
          { name: "Cy", stats: CY_STATS },
          { name: "Cy", stats: CY_STATS },
        ],
      }),
    TypeError
  );
});

test("save: empty name throws", () => {
  assert.throws(
    () => of({ seed: 9, depth: 3, players: [{ name: "", stats: CY_STATS }] }),
    TypeError
  );
});

test("save: 17-char name throws", () => {
  assert.throws(
    () =>
      of({
        seed: 9,
        depth: 3,
        players: [{ name: "12345678901234567", stats: CY_STATS }],
      }),
    TypeError
  );
});

test("save: leading space name throws", () => {
  assert.throws(
    () => of({ seed: 9, depth: 3, players: [{ name: " Cy", stats: CY_STATS }] }),
    TypeError
  );
});

test("save: name with newline throws", () => {
  assert.throws(
    () => of({ seed: 9, depth: 3, players: [{ name: "Cy\n", stats: CY_STATS }] }),
    TypeError
  );
});

test("save: invalid stats throws", () => {
  assert.throws(
    () =>
      of({
        seed: 9,
        depth: 3,
        players: [{ name: "Cy", stats: { hp: 11, maxHp: 10, attack: 1, defense: 1 } }],
      }),
    TypeError
  );
});

test("save: parse non-JSON throws", () => {
  assert.throws(() => parse("nope"), TypeError);
});

test("save: parse empty object throws", () => {
  assert.throws(() => parse("{}"), TypeError);
});

test("save: parse version 2 throws", () => {
  const s = of({
    seed: 9,
    depth: 3,
    players: [{ name: "Cy", stats: CY_STATS }],
  });
  const text = s.text().replace('"version": 1', '"version": 2');
  assert.throws(() => parse(text), TypeError);
});

test("save: isName cases", () => {
  assert.strictEqual(isName("Ann"), true);
  assert.strictEqual(isName(""), false);
  assert.strictEqual(isName("Ann "), false);
  assert.strictEqual(isName(5), false);
});

test("save: data() writes range", () => {
  const s = of({
    seed: 9,
    depth: 3,
    players: [{ name: "Cy", stats: statsOf({ hp: 10, maxHp: 30, attack: 6, defense: 2, range: 4 }) }],
  });
  assert.strictEqual(s.data().players[0].stats.range, 4);
});

test("save: stats without range defaults to 1", () => {
  const s = of({
    seed: 9,
    depth: 3,
    players: [{ name: "Cy", stats: { hp: 10, maxHp: 30, attack: 6, defense: 2 } }],
  });
  assert.strictEqual(s.players[0].stats.range, 1);
  assert.strictEqual(s.data().players[0].stats.range, 1);
});

test("save: range round-trips through parse", () => {
  const s = of({
    seed: 9,
    depth: 3,
    players: [{ name: "Cy", stats: { hp: 10, maxHp: 30, attack: 6, defense: 2, range: 4 } }],
  });
  const parsed = parse(s.text());
  assert.strictEqual(parsed.players[0].stats.range, 4);
});
