// The edge test for sessions: tests table's edge per intrinsic.

import { test } from "node:test";
import assert from "node:assert";
import { table } from "../../../edges/edge_to_sessions.mjs";

// Intrinsic - creates:
test("creates", () => {
  const t = table({});
  const first = t.create(0);
  const second = t.create(0);
  const third = t.create(0);
  const fourth = t.create(0);
  const fifth = t.create(0);

  assert.ok(first);
  assert.ok(second);
  assert.ok(third);
  assert.ok(fourth);
  assert.equal(fifth, null);

  const ids = [first, second, third, fourth];
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, 4, "ids distinct");

  for (const id of ids) {
    assert.match(id, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  }

  assert.deepEqual(t.ids(), ids);

  const t0 = table({ random: () => 0 });
  const c0 = t0.create(0);
  assert.equal(c0, "AAAAAA");
  const c1 = t0.create(0);
  assert.notEqual(c1, "AAAAAA");
});

// Intrinsic - joins:
test("joins", () => {
  const t = table({});
  const s = t.create(0);

  assert.equal(t.join(1, s, "Ann", 0), null);
  assert.deepEqual(t.member(1), { session: s, name: "Ann" });
  assert.deepEqual(t.members(s), [{ connection: 1, name: "Ann" }]);

  assert.equal(t.join(2, "ZZZZZZ", "Bob", 0), "no-session");
  assert.equal(t.join(2, s, "Ann", 0), "name-taken");

  t.join(2, s, "Bob", 0);
  t.join(3, s, "Carol", 0);
  t.join(4, s, "Delta", 0);
  assert.equal(t.join(5, s, "Epsilon", 0), "full");

  assert.equal(t.leave(1), s);
  assert.equal(t.member(1), null);
  assert.equal(t.join(2, s, "Ann", 0), null);

  const t2 = table({});
  const s2 = t2.create(0);
  const s3 = t2.create(0);

  t2.join(1, s2, "Ann", 0);
  assert.deepEqual(t2.member(1), { session: s2, name: "Ann" });
  t2.join(1, s3, "Ann", 0);
  assert.deepEqual(t2.member(1), { session: s3, name: "Ann" });
});

// Intrinsic - pauses:
test("pauses", () => {
  const t = table({});
  const s = t.create(0);

  assert.equal(t.paused(s), false);
  t.setPaused(s, true);
  assert.equal(t.paused(s), true);
  t.setPaused(s, false);
  assert.equal(t.paused(s), false);
});

// Intrinsic - expires:
test("expires", () => {
  const t = table({ idle: 1000 });
  const s1 = t.create(0);
  const s2 = t.create(500);

  t.join(1, s1, "Ann", 0);

  assert.deepEqual(t.expire(999), []);
  assert.deepEqual(t.expire(1000), [s1]);
  assert.deepEqual(t.ids(), [s2]);
  assert.equal(t.member(1), null);

  t.touch(s2, 1200);
  assert.deepEqual(t.expire(1600), []);
  assert.deepEqual(t.expire(2200), [s2]);

  const t3 = table({ idle: 1000 });
  const s3 = t3.create(0);
  t3.join(1, s3, "Ann", 900);
  assert.deepEqual(t3.expire(1500), []);
  assert.deepEqual(t3.expire(1901), [s3]);
});
