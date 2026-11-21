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

  const ids = [first.session, second.session, third.session, fourth.session];
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, 4, "ids distinct");

  for (const id of ids) {
    assert.match(id, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  }

  for (const s of [first, second, third, fourth]) {
    assert.match(s.password, /^[abcdefghjkmnpqrstuvwxyz23456789]{6}$/);
  }

  assert.deepEqual(t.ids(), ids);

  const t0 = table({ random: () => 0 });
  const c0 = t0.create(0);
  assert.deepEqual(c0, { session: "AAAAAA", password: "aaaaaa" });
  const c1 = t0.create(0);
  assert.notEqual(c1.session, "AAAAAA");
});

// Intrinsic - joins:
test("joins", () => {
  const t = table({});
  const s = t.create(0);
  const session = s.session;
  const password = s.password;

  assert.equal(t.join(1, session, password, "Ann", 0), null);
  assert.deepEqual(t.member(1), { session, name: "Ann" });
  assert.deepEqual(t.members(session), [{ connection: 1, name: "Ann" }]);

  assert.equal(t.join(2, session, "x", "Bob", 0), "bad-password");
  assert.equal(t.join(2, "ZZZZZZ", password, "Bob", 0), "no-session");
  assert.equal(t.join(2, session, password, "Ann", 0), "name-taken");

  t.join(2, session, password, "Bob", 0);
  t.join(3, session, password, "Carol", 0);
  t.join(4, session, password, "Delta", 0);
  assert.equal(t.join(5, session, password, "Epsilon", 0), "full");

  assert.equal(t.leave(1), session);
  assert.equal(t.member(1), null);
  assert.equal(t.join(2, session, password, "Ann", 0), null);

  const t2 = table({});
  const s2 = t2.create(0);
  const session2 = s2.session;
  const password2 = s2.password;
  const s3 = t2.create(0);
  const session3 = s3.session;
  const password3 = s3.password;

  t2.join(1, session2, password2, "Ann", 0);
  assert.deepEqual(t2.member(1), { session: session2, name: "Ann" });
  t2.join(1, session3, password3, "Ann", 0);
  assert.deepEqual(t2.member(1), { session: session3, name: "Ann" });
});

// Intrinsic - pauses:
test("pauses", () => {
  const t = table({});
  const s = t.create(0);
  const session = s.session;

  assert.equal(t.paused(session), false);
  t.setPaused(session, true);
  assert.equal(t.paused(session), true);
  t.setPaused(session, false);
  assert.equal(t.paused(session), false);
});

// Intrinsic - expires:
test("expires", () => {
  const t = table({ idle: 1000 });
  const s1 = t.create(0);
  const session1 = s1.session;
  const p1 = s1.password;
  const s2 = t.create(500);
  const session2 = s2.session;
  const p2 = s2.password;

  t.join(1, session1, p1, "Ann", 0);

  assert.deepEqual(t.expire(999), []);
  assert.deepEqual(t.expire(1000), [session1]);
  assert.deepEqual(t.ids(), [session2]);
  assert.equal(t.member(1), null);

  t.touch(session2, 1200);
  assert.deepEqual(t.expire(1600), []);
  assert.deepEqual(t.expire(2200), [session2]);

  const t3 = table({ idle: 1000 });
  const s3 = t3.create(0);
  const session3 = s3.session;
  const p3 = s3.password;
  t3.join(1, session3, p3, "Ann", 900);
  assert.deepEqual(t3.expire(1500), []);
  assert.deepEqual(t3.expire(1901), [session3]);
});
