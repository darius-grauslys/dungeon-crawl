// The tests of the shape floor-plan.

import { test } from "node:test";
import assert from "node:assert";

import { of as floorPlanOf } from "../../../shapes/floor-plan/index.mjs";
import { of as pointOf, equals as pointEquals } from "../../../shapes/point/index.mjs";
import { fromRows as tileGridFromRows } from "../../../shapes/tile-grid/index.mjs";

const g = tileGridFromRows(['#####', '#..>#', '#####']);

test("floor-plan: valid", () => {
  const fp = floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(2, 1)] });
  assert.ok(pointEquals(fp.start, pointOf(1, 1)));
  assert.ok(pointEquals(fp.stairs, pointOf(3, 1)));
  assert.equal(fp.spots.length, 1);
  assert.ok(pointEquals(fp.spots[0], pointOf(2, 1)));
  assert.equal(fp.boss, null);
  assert.ok(Array.isArray(fp.levers));
  assert.equal(fp.levers.length, 0);
  assert.ok(Object.isFrozen(fp));
  assert.ok(Object.isFrozen(fp.spots));
  assert.ok(Object.isFrozen(fp.levers));
});

test("floor-plan: start on wall throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(0, 1), stairs: pointOf(3, 1), spots: [] });
  }, TypeError);
});

test("floor-plan: stairs on floor cell throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(2, 1), spots: [] });
  }, TypeError);
});

test("floor-plan: spot equal to start throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(1, 1)] });
  }, TypeError);
});

test("floor-plan: two equal spots throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(2, 1), pointOf(2, 1)] });
  }, TypeError);
});

test("floor-plan: spots not an array throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: pointOf(2, 1) });
  }, TypeError);
});

const h = tileGridFromRows(['#######', '#.....#', '#.....#', '#...>.#', '#.....#', '#######']);

test("floor-plan: valid with boss and levers", () => {
  const fp = floorPlanOf({ grid: h, start: pointOf(1, 1), stairs: pointOf(4, 3), spots: [pointOf(1, 4)], boss: pointOf(3, 2), levers: [pointOf(5, 1)] });
  assert.ok(pointEquals(fp.boss, pointOf(3, 2)));
  assert.equal(fp.levers.length, 1);
  assert.ok(pointEquals(fp.levers[0], pointOf(5, 1)));
  assert.ok(Object.isFrozen(fp));
  assert.ok(Object.isFrozen(fp.spots));
  assert.ok(Object.isFrozen(fp.levers));
});

test("floor-plan: boss square reaches wall throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: h, start: pointOf(1, 1), stairs: pointOf(4, 3), spots: [pointOf(1, 4)], boss: pointOf(4, 2), levers: [] });
  }, TypeError);
});

test("floor-plan: lever on spot throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: h, start: pointOf(1, 1), stairs: pointOf(4, 3), spots: [pointOf(1, 4)], boss: pointOf(3, 2), levers: [pointOf(1, 4)] });
  }, TypeError);
});

test("floor-plan: lever on boss square throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: h, start: pointOf(1, 1), stairs: pointOf(4, 3), spots: [pointOf(1, 4)], boss: pointOf(3, 2), levers: [pointOf(3, 2)] });
  }, TypeError);
});
