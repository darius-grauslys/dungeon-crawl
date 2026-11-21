import test from "node:test";
import assert from "node:assert/strict";

import { table } from "../../../src/sessions/index.mjs";

const SESSION_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function isId(s) {
  return typeof s === "string" && s.length === 6 && /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(s);
}

function isPassword(s) {
  return typeof s === "string" && s.length === 6 && /^[abcdefghjkmnpqrstuvwxyz23456789]{6}$/.test(s);
}

test("creates: four distinct sessions, then null", () => {
  const t = table({});
  const first = t.create(0);
  const second = t.create(0);
  const third = t.create(0);
  const fourth = t.create(0);
  const fifth = t.create(0);

  assert.ok(first && second && third && fourth);
  assert.ok(fifth === null);

  assert.ok(isId(first.session) && isPassword(first.password));
  assert.ok(isId(second.session) && isPassword(second.password));
  assert.ok(isId(third.session) && isPassword(third.password));
  assert.ok(isId(fourth.session) && isPassword(fourth.password));

  const ids = t.ids();
  assert.equal(ids.length, 4);
  assert.deepEqual(ids, [first.session, second.session, third.session, fourth.session]);

  assert.notEqual(first.session, second.session);
  assert.notEqual(first.session, third.session);
  assert.notEqual(first.session, fourth.session);
  assert.notEqual(second.session, third.session);
  assert.notEqual(second.session, fourth.session);
  assert.notEqual(third.session, fourth.session);
});

test("creates: random: () => 0 gives AAAAAA/aaaaaa, second differs", () => {
  const t = table({ random: () => 0 });
  const first = t.create(0);
  assert.deepEqual(first, { session: "AAAAAA", password: "aaaaaa" });

  const second = t.create(0);
  assert.ok(second !== null);
  assert.notEqual(second.session, "AAAAAA");
  assert.ok(isId(second.session) && isPassword(second.password));
});

test("joins: basic join, member, members", () => {
  const t = table({});
  const s = t.create(0);
  const id = s.session;
  const p = s.password;

  assert.equal(t.join(1, id, p, "Ann", 0), null);
  assert.deepEqual(t.member(1), { session: id, name: "Ann" });
  assert.deepEqual(t.members(id), [{ connection: 1, name: "Ann" }]);
});

test("joins: bad-password, no-session, name-taken, full", () => {
  const t = table({});
  const s = t.create(0);
  const id = s.session;
  const p = s.password;

  assert.equal(t.join(2, id, "x", "Bob", 0), "bad-password");
  assert.equal(t.join(2, "ZZZZZZ", p, "Bob", 0), "no-session");
  t.join(1, id, p, "Ann", 0);
  assert.equal(t.join(2, id, p, "Ann", 0), "name-taken");

  t.join(2, id, p, "Bob", 0);
  t.join(3, id, p, "Car", 0);
  t.join(4, id, p, "Dar", 0);
  assert.equal(t.join(5, id, p, "E", 0), "full");
});

test("joins: leave, then rejoin; connection joining second leaves first", () => {
  const t = table({});
  const s1 = t.create(0);
  const s2 = t.create(0);
  const id1 = s1.session;
  const id2 = s2.session;
  const p1 = s1.password;
  const p2 = s2.password;

  t.join(1, id1, p1, "Ann", 0);
  assert.deepEqual(t.member(1), { session: id1, name: "Ann" });

  assert.equal(t.leave(1), id1);
  assert.equal(t.member(1), null);
  assert.equal(t.join(2, id1, p1, "Ann", 0), null);

  t.join(3, id1, p1, "Car", 10);
  assert.deepEqual(t.member(3), { session: id1, name: "Car" });
  t.join(3, id2, p2, "Car", 20);
  assert.deepEqual(t.member(3), { session: id2, name: "Car" });
  const m1 = t.members(id1);
  assert.ok(!m1.some((m) => m.connection === 3));
  assert.deepEqual(m1, [{ connection: 2, name: "Ann" }]);
});

test("pauses: new not paused, setPaused toggles", () => {
  const t = table({});
  const s = t.create(0);
  const id = s.session;

  assert.equal(t.paused(id), false);
  t.setPaused(id, true);
  assert.equal(t.paused(id), true);
  t.setPaused(id, false);
  assert.equal(t.paused(id), false);
});

test("pauses: unknown session returns false", () => {
  const t = table({});
  assert.equal(t.paused("ZZZZZZ"), false);
});

test("expires: idle threshold removes sessions and clears members", () => {
  const t = table({ idle: 1000 });
  const s1 = t.create(0);
  const s2 = t.create(500);
  const id1 = s1.session;
  const id2 = s2.session;

  assert.deepEqual(t.expire(999), []);
  assert.deepEqual(t.expire(1000), [id1]);
  assert.deepEqual(t.ids(), [id2]);
  assert.equal(t.member(1), null);

  t.join(1, id2, s2.password, "Ann", 500);
  t.touch(id2, 1200);
  assert.deepEqual(t.expire(1600), []);
  assert.deepEqual(t.expire(2200), [id2]);
  assert.deepEqual(t.ids(), []);
});

test("expires: join counts as activity", () => {
  const t = table({ idle: 1000 });
  const s = t.create(0);
  const id = s.session;
  const p = s.password;

  t.join(1, id, p, "Ann", 0);
  assert.deepEqual(t.expire(999), []);
  t.join(2, id, p, "Bob", 1000);
  assert.deepEqual(t.expire(1999), []);
  assert.deepEqual(t.expire(2000), [id]);
});

test("fresh objects: changing a member array doesn't change the table", () => {
  const t = table({});
  const s = t.create(0);
  const id = s.session;
  const p = s.password;

  t.join(1, id, p, "Ann", 0);
  const m = t.members(id);
  m.push({ connection: 99, name: "Zzz" });
  m[0].name = "Changed";

  assert.deepEqual(t.members(id), [{ connection: 1, name: "Ann" }]);
});
