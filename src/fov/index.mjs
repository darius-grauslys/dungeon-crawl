// fov: field of view, pure.

import * as pointShapes from "../../shapes/point/index.mjs";
import * as tileGridShapes from "../../shapes/tile-grid/index.mjs";
import * as maskShapes from "../../shapes/mask/index.mjs";

const Point = pointShapes.Point;
const TileGrid = tileGridShapes.TileGrid;
const maskOf = maskShapes.of;

/** `compute(grid, origin, radius) -> mask`. `grid` a `tile-grid`, `origin` a `point` inside it, `radius` an integer from 1 to 30; anything else throws a `TypeError`. Answers a mask of the grid's size, true for exactly the cells in sight from `origin`. */
export function compute(grid, origin, radius) {
  if (!(grid instanceof TileGrid)) throw new TypeError("grid must be a tile-grid");
  if (!(origin instanceof Point)) throw new TypeError("origin must be a point");
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

  const cells = new Array(w * h).fill(false);
  const radiusSq = radius * radius;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (inSight(grid, ox, oy, x, y, radiusSq)) {
        cells[y * w + x] = true;
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
