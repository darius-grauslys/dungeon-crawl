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
  assert.ok(Object.isFrozen(fp));
  assert.ok(Object.isFrozen(fp.spots));
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
