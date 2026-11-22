// fov: field of view, pure.

import * as pointShapes from "../../shapes/point/index.mjs";
import * as tileGridShapes from "../../shapes/tile-grid/index.mjs";
import * as maskShapes from "../../shapes/mask/index.mjs";

const maskOf = maskShapes.of;

/** `compute(grid, origin, radius) -> mask`. `grid` a `tile-grid`, `origin` a `point` inside it, `radius` an integer from 1 to 30; anything else throws a `TypeError`. Answers a mask of the grid's size, true for exactly the cells in sight from `origin`. */
export function compute(grid, origin, radius) {
  if (
    typeof grid !== "object" || grid === null ||
    typeof grid.width !== "number" || !Number.isInteger(grid.width) || grid.width < 1 || grid.width > 256 ||
    typeof grid.height !== "number" || !Number.isInteger(grid.height) || grid.height < 1 || grid.height > 256 ||
    typeof grid.at !== "function"
  ) {
    throw new TypeError("grid must be a tile-grid");
  }
  if (
    typeof origin !== "object" || origin === null ||
    !Object.isFrozen(origin) ||
    typeof origin.x !== "number" || !Number.isInteger(origin.x) ||
    typeof origin.y !== "number" || !Number.isInteger(origin.y)
  ) {
    throw new TypeError("origin must be a point");
  }
  if (typeof radius !== "number" || !Number.isInteger(radius) || radius < 1 || radius > 30) {
    throw new TypeError("radius must be an integer from 1 to 30");
  }
  const w = grid.width;
  const h = grid.height;
  const ox = origin.x;
  const oy = origin.y;
  if (ox < 0 || ox >= w || oy < 0 || oy >= h) {
    throw new TypeError("origin must be inside the grid");
  }

  const radiusSq = radius * radius;
  const sightCells = new Array(w * h).fill(false);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (inSight(grid, ox, oy, x, y, radiusSq)) {
        sightCells[y * w + x] = true;
      }
    }
  }

  const cells = new Array(w * h).fill(false);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (sightCells[idx]) {
        cells[idx] = true;
        continue;
      }
      if (grid.at(x, y) === "wall") {
        let seen = false;
        for (let dy = -1; dy <= 1 && !seen; dy++) {
          for (let dx = -1; dx <= 1 && !seen; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nIdx = ny * w + nx;
            if (sightCells[nIdx] && grid.at(nx, ny) !== "wall") {
              seen = true;
            }
          }
        }
        if (seen) cells[idx] = true;
      }
    }
  }

  return maskOf(w, h, cells);
}

function inSight(grid, ox, oy, cx, cy, radiusSq) {
  const dx2 = cx - ox, dy2 = cy - oy;
  if (dx2 * dx2 + dy2 * dy2 > radiusSq) return false;
  if (ox === cx && oy === cy) return true;

  const dx = Math.abs(cx - ox);
  const dy = Math.abs(cy - oy);
  const sx = cx > ox ? 1 : -1;
  const sy = cy > oy ? 1 : -1;
  let err = dx - dy;
  let x = ox, y = oy;
  while (true) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      x += sx;
      err -= dy;
    }
    if (e2 < dx) {
      y += sy;
      err += dx;
    }
    if (x === cx && y === cy) break;
    if (grid.at(x, y) === "wall") return false;
  }
  return true;
}
