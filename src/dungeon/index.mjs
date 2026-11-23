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

function setCellTemple(grid, x, y) {
  if (x >= 1 && x <= 46 && y >= 1 && y <= 30) {
    grid[y * WIDTH + x] = "floor";
  }
}

function centre(r) {
  return { cx: r.x + Math.floor(r.w / 2), cy: r.y + Math.floor(r.h / 2) };
}

function tryCarve(gen, temple, makeSpikes) {
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
      for (let x = minX; x <= maxX; x++) {
        setCell(grid, x, y, "floor");
        if (temple) {
          setCellTemple(grid, x + 1, y);
          setCellTemple(grid, x, y + 1);
          setCellTemple(grid, x + 1, y + 1);
        }
      }
      const startY = c1.cy, endY = c2.cy;
      const minY = Math.min(startY, endY), maxY = Math.max(startY, endY);
      for (let yy = minY; yy <= maxY; yy++) {
        setCell(grid, c2.cx, yy, "floor");
        if (temple) {
          setCellTemple(grid, c2.cx + 1, yy);
          setCellTemple(grid, c2.cx, yy + 1);
          setCellTemple(grid, c2.cx + 1, yy + 1);
        }
      }
    } else {
      const startY = c1.cy, endY = c2.cy, x = c1.cx;
      const minY = Math.min(startY, endY), maxY = Math.max(startY, endY);
      for (let yy = minY; yy <= maxY; yy++) {
        setCell(grid, x, yy, "floor");
        if (temple) {
          setCellTemple(grid, x + 1, yy);
          setCellTemple(grid, x, yy + 1);
          setCellTemple(grid, x + 1, yy + 1);
        }
      }
      const startX = c1.cx, endX = c2.cx;
      const minX = Math.min(startX, endX), maxX = Math.max(startX, endX);
      for (let x = minX; x <= maxX; x++) {
        setCell(grid, x, c2.cy, "floor");
        if (temple) {
          setCellTemple(grid, x + 1, c2.cy);
          setCellTemple(grid, x, c2.cy + 1);
          setCellTemple(grid, x + 1, c2.cy + 1);
        }
      }
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

  let spikesArr = [];
  if (makeSpikes) {
    spikesArr = generateSpikes(gen, rooms, grid, roomCells, start, stairs);
  }

  return floorPlan.of({ grid: gridShape, start: startPt, stairs: stairsPt, spots: spotsArr, spikes: spikesArr });
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
  const temple = level.theme(depth) === 'temple';
  const makeSpikes = level.number(depth) >= 2;
  while (true) {
    const plan = tryCarve(gen, temple, makeSpikes);
    if (plan) return plan;
  }
}

function generateSpikes(gen, rooms, grid, roomCells, start, stairs) {
  const spikes = [];
  const spikeCells = new Set();
  const addSpike = (x, y, shift) => {
    const key = x + ',' + y;
    if (spikeCells.has(key)) return;
    if (x === start.cx && y === start.cy) return;
    if (x === stairs.cx && y === stairs.cy) return;
    if (grid[y * WIDTH + x] !== 'floor') return;
    spikes.push({ x, y, shift });
    spikeCells.add(key);
  };

  const corridorCells = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === 'floor' && !roomCells.has(i)) {
      corridorCells.push({ x: i % WIDTH, y: Math.floor(i / WIDTH) });
    }
  }

  const corridorSet = new Set();
  for (const c of corridorCells) corridorSet.add(c.x + ',' + c.y);

  const runs = [];
  // horizontal runs
  for (let y = 0; y < HEIGHT; y++) {
    let x = 0;
    while (x < WIDTH) {
      if (corridorSet.has(x + ',' + y)) {
        let xEnd = x;
        while (xEnd + 1 < WIDTH && corridorSet.has((xEnd + 1) + ',' + y)) xEnd++;
        const len = xEnd - x + 1;
        if (len >= 4) {
          const run = [];
          for (let cx = x; cx <= xEnd; cx++) run.push({ x: cx, y });
          runs.push(run);
        }
        x = xEnd + 1;
      } else {
        x++;
      }
    }
  }
  // vertical runs
  for (let x = 0; x < WIDTH; x++) {
    let y = 0;
    while (y < HEIGHT) {
      if (corridorSet.has(x + ',' + y)) {
        let yEnd = y;
        while (yEnd + 1 < HEIGHT && corridorSet.has(x + ',' + (yEnd + 1))) yEnd++;
        const len = yEnd - y + 1;
        if (len >= 4) {
          const run = [];
          for (let cy = y; cy <= yEnd; cy++) run.push({ x, y: cy });
          runs.push(run);
        }
        y = yEnd + 1;
      } else {
        y++;
      }
    }
  }

  const doFeature = () => {
    const v = gen.next() / 4294967296;
    let kind = ['hallway', 'edge', 'scatter'][Math.floor(v * 3)];
    if (kind === 'hallway') {
      if (runs.length === 0) {
        kind = 'edge';
      } else {
        const runIdx = Math.floor(v * runs.length);
        const run = runs[runIdx];
        for (let i = 0; i < run.length; i++) {
          const cell = run[i];
          const shift = Math.floor(i / 2) % 6;
          addSpike(cell.x, cell.y, shift);
        }
        return;
      }
    }
    if (kind === 'edge') {
      const roomIdx = 1 + Math.floor(v * (rooms.length - 1));
      const room = rooms[roomIdx];
      const sideIdx = Math.floor(v * 4);
      const side = ['top', 'right', 'bottom', 'left'][sideIdx];
      let cells = [];
      if (side === 'top') {
        for (let x = room.x; x < room.x + room.w; x++) cells.push({ x, y: room.y });
      } else if (side === 'bottom') {
        for (let x = room.x; x < room.x + room.w; x++) cells.push({ x, y: room.y + room.h - 1 });
      } else if (side === 'left') {
        for (let y = room.y; y < room.y + room.h; y++) cells.push({ x: room.x, y });
      } else if (side === 'right') {
        for (let y = room.y; y < room.y + room.h; y++) cells.push({ x: room.x + room.w - 1, y });
      }
      for (const cell of cells) {
        addSpike(cell.x, cell.y, 0);
      }
      return;
    }
    if (kind === 'scatter') {
      const available = [];
      for (const r of rooms) {
        for (let dy = 0; dy < r.h; dy++) {
          for (let dx = 0; dx < r.w; dx++) {
            const cx = r.x + dx;
            const cy = r.y + dy;
            const key = cx + ',' + cy;
            if (spikeCells.has(key)) continue;
            if (cx === start.cx && cy === start.cy) continue;
            if (cx === stairs.cx && cy === stairs.cy) continue;
            available.push({ x: cx, y: cy });
          }
        }
      }
      const picked = [];
      for (let i = 0; i < 6 && available.length > 0; i++) {
        const idx = Math.floor((gen.next() / 4294967296) * available.length);
        const cell = available[idx];
        const key = cell.x + ',' + cell.y;
        if (spikeCells.has(key)) continue;
        if (cell.x === start.cx && cell.y === start.cy) continue;
        if (cell.x === stairs.cx && cell.y === stairs.cy) continue;
        picked.push(cell);
        available.splice(idx, 1);
      }
      const shiftV = gen.next() / 4294967296;
      const shift = Math.floor(shiftV * 6);
      for (const cell of picked) {
        addSpike(cell.x, cell.y, shift);
      }
      return;
    }
  };

  doFeature();
  doFeature();

  return spikes;
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
  const spotsArr = [];
  for (let y of [13, 16]) {
    for (let x = 15; x <= 31; x += 2) {
      spotsArr.push(point.of(x, y));
    }
  }
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
    leversArr = [point.of(39, 7), point.of(39, 25), point.of(39, 16)];
    for (const lever of leversArr) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          spotsArr.push(point.of(lever.x + dx, lever.y + dy));
        }
      }
    }
  } else if (round === 2 || round === 3) {
    bossPt = point.of(32, 15);
  }

  return floorPlan.of({ grid: gridShape, start: startPt, stairs: stairsPt, spots: spotsArr, boss: bossPt, levers: leversArr });
}
