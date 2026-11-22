import test from "node:test";
import assert from "node:assert/strict";

import { table } from "../../../src/sessions/index.mjs";

const SESSION_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function isId(s) {
  return typeof s === "string" && s.length === 6 && /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(s);
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

  assert.ok(isId(first));
  assert.ok(isId(second));
  assert.ok(isId(third));
  assert.ok(isId(fourth));

  const ids = t.ids();
  assert.equal(ids.length, 4);
  assert.deepEqual(ids, [first, second, third, fourth]);

  assert.notEqual(first, second);
  assert.notEqual(first, third);
  assert.notEqual(first, fourth);
  assert.notEqual(second, third);
  assert.notEqual(second, fourth);
  assert.notEqual(third, fourth);
});

test("creates: random: () => 0 gives AAAAAA, second differs", () => {
  const t = table({ random: () => 0 });
  const first = t.create(0);
  assert.deepEqual(first, "AAAAAA");

  const second = t.create(0);
  assert.ok(second !== null);
  assert.notEqual(second, "AAAAAA");
  assert.ok(isId(second));
});

test("joins: basic join, member, members", () => {
  const t = table({});
  const id = t.create(0);

  assert.equal(t.join(1, id, "Ann", 0), null);
  assert.deepEqual(t.member(1), { session: id, name: "Ann" });
  assert.deepEqual(t.members(id), [{ connection: 1, name: "Ann" }]);
});

test("joins: no-session, name-taken, full", () => {
  const t = table({});
  const id = t.create(0);

  assert.equal(t.join(2, "ZZZZZZ", "Bob", 0), "no-session");
  t.join(1, id, "Ann", 0);
  assert.equal(t.join(2, id, "Ann", 0), "name-taken");

  t.join(2, id, "Bob", 0);
  t.join(3, id, "Car", 0);
  t.join(4, id, "Dar", 0);
  assert.equal(t.join(5, id, "E", 0), "full");
});

test("joins: leave, then rejoin; connection joining second leaves first", () => {
  const t = table({});
  const id1 = t.create(0);
  const id2 = t.create(0);

  t.join(1, id1, "Ann", 0);
  assert.deepEqual(t.member(1), { session: id1, name: "Ann" });

  assert.equal(t.leave(1), id1);
  assert.equal(t.member(1), null);
  assert.equal(t.join(2, id1, "Ann", 0), null);

  t.join(3, id1, "Car", 10);
  assert.deepEqual(t.member(3), { session: id1, name: "Car" });
  t.join(3, id2, "Car", 20);
  assert.deepEqual(t.member(3), { session: id2, name: "Car" });
  const m1 = t.members(id1);
  assert.ok(!m1.some((m) => m.connection === 3));
  assert.deepEqual(m1, [{ connection: 2, name: "Ann" }]);
});

test("pauses: new not paused, setPaused toggles", () => {
  const t = table({});
  const id = t.create(0);

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
  const id1 = t.create(0);
  const id2 = t.create(500);

  assert.deepEqual(t.expire(999), []);
  assert.deepEqual(t.expire(1000), [id1]);
  assert.deepEqual(t.ids(), [id2]);
  assert.equal(t.member(1), null);

  t.join(1, id2, "Ann", 500);
  t.touch(id2, 1200);
  assert.deepEqual(t.expire(1600), []);
  assert.deepEqual(t.expire(2200), [id2]);
  assert.deepEqual(t.ids(), []);
});

test("expires: join counts as activity", () => {
  const t = table({ idle: 1000 });
  const id = t.create(0);

  t.join(1, id, "Ann", 0);
  assert.deepEqual(t.expire(999), []);
  t.join(2, id, "Bob", 1000);
  assert.deepEqual(t.expire(1999), []);
  assert.deepEqual(t.expire(2000), [id]);
});

test("fresh objects: changing a member array doesn't change the table", () => {
  const t = table({});
  const id = t.create(0);

  t.join(1, id, "Ann", 0);
  const m = t.members(id);
  m.push({ connection: 99, name: "Zzz" });
  m[0].name = "Changed";

  assert.deepEqual(t.members(id), [{ connection: 1, name: "Ann" }]);
});
