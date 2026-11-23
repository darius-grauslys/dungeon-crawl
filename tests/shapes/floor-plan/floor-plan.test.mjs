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
  assert.ok(Array.isArray(fp.spikes));
  assert.equal(fp.spikes.length, 0);
  assert.ok(Object.isFrozen(fp));
  assert.ok(Object.isFrozen(fp.spots));
  assert.ok(Object.isFrozen(fp.levers));
  assert.ok(Object.isFrozen(fp.spikes));
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

test("floor-plan: spikes valid", () => {
  const fp = floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(2, 1)], spikes: [{ x: 2, y: 1, shift: 4 }] });
  assert.equal(fp.spikes.length, 1);
  assert.equal(fp.spikes[0].x, 2);
  assert.equal(fp.spikes[0].y, 1);
  assert.equal(fp.spikes[0].shift, 4);
  assert.ok(Object.isFrozen(fp.spikes[0]));
  assert.ok(Object.isFrozen(fp.spikes));
});

test("floor-plan: spike on start throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(2, 1)], spikes: [{ x: 1, y: 1, shift: 0 }] });
  }, TypeError);
});

test("floor-plan: spike on wall throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(2, 1)], spikes: [{ x: 0, y: 0, shift: 0 }] });
  }, TypeError);
});

test("floor-plan: spike shift out of range throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(2, 1)], spikes: [{ x: 2, y: 1, shift: 6 }] });
  }, TypeError);
});

test("floor-plan: two spikes on same cell throws", () => {
  assert.throws(() => {
    floorPlanOf({ grid: g, start: pointOf(1, 1), stairs: pointOf(3, 1), spots: [pointOf(2, 1)], spikes: [{ x: 2, y: 1, shift: 1 }, { x: 2, y: 1, shift: 2 }] });
  }, TypeError);
});
