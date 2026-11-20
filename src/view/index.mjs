// view: draws a world onto the page's canvas: the floor around the hero,
// tile by tile, and the status panel under it.

import * as atlas from "../../edges/edge_to_atlas.mjs";
import * as hud from "../../edges/edge_to_hud.mjs";
import * as point from "../../shapes/point/index.mjs";

let canvas_ = null;
let ctx_ = null;
let loaded_ = false;

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

/** `init(canvas)`. The canvas to draw into from now on (a page's `<canvas>` element). Draws nothing. */
export function init(c) {
  canvas_ = c;
  ctx_ = c.getContext("2d");
  ctx_.imageSmoothingEnabled = false;
}

/** `load(base) -> promise`. Loads the sprites from the asset URL prefix `base`; resolves once they are in, and from the next `draw` they are used. Rejects as the sprites' loading does; the flat colours stay. */
export function load(base) {
  return atlas.load(base).then(() => { loaded_ = true; });
}

/** `camera(world, cols, rows) -> point`. The camera, as the layout says, for a view of `cols` by `rows` cells. */
export function camera(world, cols, rows) {
  const hero = world.hero.pos;
  const grid = world.grid;
  const cx = clamp(hero.x - Math.floor(cols / 2), 0, Math.max(0, grid.width - cols));
  const cy = clamp(hero.y - Math.floor(rows / 2), 0, Math.max(0, grid.height - rows));
  return typeof point.of === "function" ? point.of(cx, cy) : { x: cx, y: cy };
}

function tileColor(kind) {
  if (kind === "wall") return [90, 80, 90];
  if (kind === "floor") return [50, 36, 44];
  if (kind === "stairs") return [230, 200, 60];
  return [22, 13, 19];
}

function drawTileFlat(ctx, kind, px, py) {
  const [r, g, b] = tileColor(kind);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(px, py, 48, 48);
}

function drawCreatureFlat(ctx, kind, px, py) {
  const [r, g, b] = kind === "hero" ? [60, 120, 255] : [220, 50, 50];
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(px + 8, py + 8, 32, 32);
}

function drawItemFlat(ctx, kind, px, py) {
  ctx.fillStyle = "rgb(240,180,40)";
  ctx.fillRect(px + 16, py + 16, 16, 16);
}

function findActor(world, cx, cy) {
  for (const m of world.monsters) {
    if (m.pos.x === cx && m.pos.y === cy) return m;
  }
  const h = world.hero;
  if (h.pos.x === cx && h.pos.y === cy) return h;
  return null;
}

function findItem(world, cx, cy) {
  for (const it of world.items) {
    if (it.pos.x === cx && it.pos.y === cy) return it;
  }
  return null;
}

function drawCell(world, cx, cy, px, py) {
  const kind = world.grid.at(cx, cy);
  const inVisible = world.visible.at(cx, cy);
  const inExplored = world.explored.at(cx, cy);

  if (!inVisible && !inExplored) return;

  if (loaded_) {
    const ts = atlas.sprite(kind);
    if (ts) ctx_.drawImage(ts.image, ts.sx, ts.sy, ts.sw, ts.sh, px, py, 48, 48);

    if (inVisible) {
      const item = findItem(world, cx, cy);
      if (item) {
        const is = atlas.sprite(item.kind);
        if (is) ctx_.drawImage(is.image, is.sx, is.sy, is.sw, is.sh, px, py, 48, 48);
      }
      const actor = findActor(world, cx, cy);
      if (actor) {
        const as = atlas.sprite(actor.kind);
        if (as) ctx_.drawImage(as.image, as.sx, as.sy, as.sw, as.sh, px, py, 48, 48);
      }
    }
  } else {
    drawTileFlat(ctx_, kind, px, py);
    if (inVisible) {
      const item = findItem(world, cx, cy);
      if (item) drawItemFlat(ctx_, item.kind, px, py);
      const actor = findActor(world, cx, cy);
      if (actor) drawCreatureFlat(ctx_, actor.kind, px, py);
    }
  }
}

/** `draw(world)`. Draws the world, as above, onto the canvas given to `init` (throws an `Error` if none was given). */
export function draw(world) {
  if (!canvas_) throw new Error("no canvas given to init");
  const W = canvas_.width;
  const H = canvas_.height;
  const cols = Math.floor(W / 48);
  const rows = Math.floor((H - 120) / 48);

  ctx_.fillStyle = "rgb(22,13,19)";
  ctx_.fillRect(0, 0, W, H);

  const cam = camera(world, cols, rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = cam.x + c;
      const cy = cam.y + r;
      if (cx < 0 || cy < 0 || cx >= world.grid.width || cy >= world.grid.height) continue;
      drawCell(world, cx, cy, c * 48, r * 48);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = cam.x + c;
      const cy = cam.y + r;
      if (cx < 0 || cy < 0 || cx >= world.grid.width || cy >= world.grid.height) continue;
      if (world.explored.at(cx, cy) && !world.visible.at(cx, cy)) {
        ctx_.fillStyle = "rgba(0,0,0,0.6)";
        ctx_.fillRect(c * 48, r * 48, 48, 48);
      }
    }
  }

  hud.draw(ctx_, 0, rows * 48, W, H - rows * 48, world);
}
