// dungeon: makes dungeon floors: rooms joined by corridors, a start, a staircase,
// and cells to place things on. Pure: the same seed and depth always give the same floor.

import * as tileGrid from "../../shapes/tile-grid/index.mjs";
import * as point from "../../shapes/point/index.mjs";
import * as floorPlan from "../../shapes/floor-plan/index.mjs";
import * as level from "../../shapes/level/index.mjs";

const WIDTH = 48;
const HEIGHT = 32;

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

function setCell(grid, x, y, kind) {
  if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
    grid[y * WIDTH + x] = kind;
  }
}

function centre(r) {
  return { cx: r.x + Math.floor(r.w / 2), cy: r.y + Math.floor(r.h / 2) };
}

function tryCarve(gen) {
  // Step 1: start with all 48 by 32 cells wall (handled by grid init).
  // Step 2: place rooms: up to 80 tries, rectangle width 4 to 10, height 4 to 7,
  // cells from column 1 to 46 and row 1 to 30. Keep only if it overlaps no kept room
  // grown by one cell on each side. Stop at 12 rooms.
  const rooms = [];
  for (let t = 0; t < 80; t++) {
    if (rooms.length >= 12) break;
    const w = 4 + gen.int31(7); // 4..10
    const h = 4 + gen.int31(4); // 4..7
    const maxX = 46 - w + 1;
    const maxY = 30 - h + 1;
    const x = 1 + gen.int31(maxX);
    const y = 1 + gen.int31(maxY);
    let ok = true;
    for (const r of rooms) {
      const gLeft = r.x - 1, gRight = r.x + r.w;
      const gTop = r.y - 1, gBottom = r.y + r.h;
      if (!(x > gRight || x + w - 1 < gLeft || y > gBottom || y + h - 1 < gTop)) {
        ok = false;
        break;
      }
    }
    if (ok) rooms.push({ x, y, w, h });
  }

  // Step 3: if fewer than 6 rooms kept, draw again from step 1.
  if (rooms.length < 6) return null;

  // Step 4: carve every kept room to floor, then join each room to the next:
  // an L-shaped corridor, one cell wide, from first room's centre to second's,
  // going horizontally first or vertically first at random.
  const grid = new Array(WIDTH * HEIGHT).fill("wall");
  const roomCells = new Set();

  for (const r of rooms) {
    for (let dy = 0; dy < r.h; dy++) {
      for (let dx = 0; dx < r.w; dx++) {
        const gx = r.x + dx;
        const gy = r.y + dy;
        grid[gy * WIDTH + gx] = "floor";
        roomCells.add(gy * WIDTH + gx);
      }
    }
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const c1 = centre(rooms[i]);
    const c2 = centre(rooms[i + 1]);
    if (gen.bool()) {
      const startX = c1.cx, endX = c2.cx, y = c1.cy;
      const minX = Math.min(startX, endX), maxX = Math.max(startX, endX);
      for (let x = minX; x <= maxX; x++) setCell(grid, x, y, "floor");
      const startY = c1.cy, endY = c2.cy;
      const minY = Math.min(startY, endY), maxY = Math.max(startY, endY);
      for (let yy = minY; yy <= maxY; yy++) setCell(grid, c2.cx, yy, "floor");
    } else {
      const startY = c1.cy, endY = c2.cy, x = c1.cx;
      const minY = Math.min(startY, endY), maxY = Math.max(startY, endY);
      for (let yy = minY; yy <= maxY; yy++) setCell(grid, x, yy, "floor");
      const startX = c1.cx, endX = c2.cx;
      const minX = Math.min(startX, endX), maxX = Math.max(startX, endX);
      for (let x = minX; x <= maxX; x++) setCell(grid, x, c2.cy, "floor");
    }
  }

  // Step 5: start is the first room's centre. stairs is the centre of the kept room
  // whose centre is farthest from start (Manhattan; first in kept order on tie);
  // that cell becomes stairs. If closer than 10, draw again from step 1.
  const start = centre(rooms[0]);
  let stairsRoom = rooms[0];
  let maxDist = -1;
  for (const r of rooms) {
    const c = centre(r);
    const dist = Math.abs(c.cx - start.cx) + Math.abs(c.cy - start.cy);
    if (dist > maxDist) {
      maxDist = dist;
      stairsRoom = r;
    }
  }
  const stairs = centre(stairsRoom);

  if (maxDist < 10) return null;

  grid[stairs.cy * WIDTH + stairs.cx] = "stairs";

  // Step 6: spots: every floor cell inside a room (not a corridor), not start or stairs,
  // at Manhattan distance of at least 5 from start, shuffled (Fisher-Yates), first 40 kept.
  // If fewer than 12, draw again from step 1.
  const spotCells = [];
  for (const cell of roomCells) {
    const cx = cell % WIDTH;
    const cy = Math.floor(cell / WIDTH);
    if (cx === start.cx && cy === start.cy) continue;
    if (cx === stairs.cx && cy === stairs.cy) continue;
    const dist = Math.abs(cx - start.cx) + Math.abs(cy - start.cy);
    if (dist >= 5) spotCells.push({ x: cx, y: cy });
  }

  for (let i = spotCells.length - 1; i > 0; i--) {
    const j = gen.int31(i + 1);
    const tmp = spotCells[i];
    spotCells[i] = spotCells[j];
    spotCells[j] = tmp;
  }

  const spots = spotCells.slice(0, 40);
  if (spots.length < 12) return null;

  const tiles = grid.map((c) => c);
  const gridShape = tileGrid.of(WIDTH, HEIGHT, tiles);
  const startPt = point.of(start.cx, start.cy);
  const stairsPt = point.of(stairs.cx, stairs.cy);
  const spotsArr = spots.map((s) => point.of(s.x, s.y));
  return floorPlan.of({ grid: gridShape, start: startPt, stairs: stairsPt, spots: spotsArr });
}

/** `generate(seed, depth) -> floor-plan`. `seed` an integer from 0 to 4294967295, `depth` an integer from 1 to 33 (`level`'s `MAX_DEPTH`); anything else throws a `TypeError`. On a shop depth (`level.kind(depth)` is `interior`), the shop above, whatever the seed; on a lair depth (`boss`), the lair above, whatever the seed. On any other depth, a floor 48 cells wide and 32 high: every cell of its outer border is `wall`; rooms and corridors are `floor`; exactly one cell is `stairs`. `start` is where the hero arrives. `spots` holds from 12 to 40 points, each at a Manhattan distance of at least 5 from `start`. No `boss`, no `levers`. Every `floor` and `stairs` cell can be reached from `start` by orthogonal steps over `floor` and `stairs` cells. */
export function generate(seed, depth) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new TypeError("seed must be an integer from 0 to 4294967295");
  }
  if (!Number.isInteger(depth) || depth < 1 || depth > level.MAX_DEPTH) {
    throw new TypeError("depth must be an integer from 1 to 33");
  }

  const kind = level.kind(depth);
  if (kind === 'interior') {
    return buildShopPlan();
  }
  if (kind === 'boss') {
    return buildLairPlan(level.round(depth));
  }

  let gen = makeGenerator(seed, depth);
  while (true) {
    const plan = tryCarve(gen);
    if (plan) return plan;
  }
}

function buildShopPlan() {
  const tiles = new Array(WIDTH * HEIGHT).fill("wall");
  for (let y = 10; y <= 21; y++) {
    for (let x = 14; x <= 33; x++) {
      tiles[y * WIDTH + x] = (x === 31 && y === 19) ? "stairs" : "floor";
    }
  }
  const gridShape = tileGrid.of(WIDTH, HEIGHT, tiles);
  const startPt = point.of(16, 19);
  const stairsPt = point.of(31, 19);
  const spotsArr = [
    point.of(16, 13),
    point.of(19, 13),
    point.of(22, 13),
    point.of(25, 13),
    point.of(28, 13),
    point.of(31, 13)
  ];
  return floorPlan.of({ grid: gridShape, start: startPt, stairs: stairsPt, spots: spotsArr });
}

function buildLairPlan(round) {
  const tiles = new Array(WIDTH * HEIGHT).fill("wall");
  for (let y = 4; y <= 27; y++) {
    for (let x = 6; x <= 41; x++) {
      tiles[y * WIDTH + x] = (x === 33 && y === 16) ? "stairs" : "floor";
    }
  }
  const gridShape = tileGrid.of(WIDTH, HEIGHT, tiles);
  const startPt = point.of(8, 16);
  const stairsPt = point.of(33, 16);

  let bossPt = null;
  let leversArr = [];
  let spotsArr = [];

  if (round === 1) {
    bossPt = point.of(32, 15);
    leversArr = [point.of(12, 8), point.of(12, 24), point.of(22, 16)];
    for (const lever of leversArr) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          spotsArr.push(point.of(lever.x + dx, lever.y + dy));
        }
      }
    }
  }

  return floorPlan.of({ grid: gridShape, start: startPt, stairs: stairsPt, spots: spotsArr, boss: bossPt, levers: leversArr });
}
