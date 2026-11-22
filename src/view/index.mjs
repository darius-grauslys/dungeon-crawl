// view: draws a world onto the page's canvas: the floor around the hero,
// tile by tile, and the status panel under it.

import * as atlas from "../../edges/edge_to_atlas.mjs";
import * as hud from "../../edges/edge_to_hud.mjs";
import * as point from "../../shapes/point/index.mjs";
import * as level from "../../shapes/level/index.mjs";

let canvas_ = null;
let ctx_ = null;
let loaded_ = false;

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

function focus(world, me) {
  // the cell of me's hero if it is alive; else the cell of the first alive hero; else (0, 0).
  let meHero = null;
  let firstAlive = null;
  for (const h of world.heroes) {
    if (h.name === me && h.alive) {
      meHero = h;
      break;
    }
    if (h.alive && !firstAlive) {
      firstAlive = h;
    }
  }
  const hero = meHero || firstAlive;
  if (hero) {
    return hero.actor.pos;
  }
  return point.of(0, 0);
}

/** `init(canvas)`. The canvas to draw into from now on (a page's `<canvas>` element). Draws nothing. */
export function init(c) {
  canvas_ = c;
  ctx_ = c.getContext("2d");
  ctx_.imageSmoothingEnabled = false;
}

/** `load(base) -> promise`. Loads the sprites from the asset URL prefix `base` (the page's is `/assets/`); resolves once they are in, and from the next `draw` they are used. Rejects as the sprites' loading does; the flat colours stay. */
export function load(base) {
  return atlas.load(base).then(() => { loaded_ = true; });
}

/** `camera(world, me, cols, rows) -> point`. The camera, as the layout says, for the player `me` (a string; any name) and a view of `cols` by `rows` cells. */
export function camera(world, me, cols, rows) {
  const f = focus(world, me);
  const grid = world.grid;
  const cx = clamp(f.x - Math.floor(cols / 2), 0, Math.max(0, grid.width - cols));
  const cy = clamp(f.y - Math.floor(rows / 2), 0, Math.max(0, grid.height - rows));
  return typeof point.of === "function" ? point.of(cx, cy) : { x: cx, y: cy };
}

function tileColor(kind) {
  if (kind === "wall") return [90, 80, 90];
  if (kind === "floor") return [50, 36, 44];
  if (kind === "stairs") return [230, 200, 60];
  return [22, 13, 19];
}

function tileTheme(world, cx, cy) {
  const blend = level.blend(world.depth);
  if (blend) {
    return (cx + (cx * 7 + cy * 13) % 5 >= 26) ? blend[1] : blend[0];
  }
  return level.theme(world.depth);
}

function drawTileFlat(ctx, kind, px, py) {
  const [r, g, b] = tileColor(kind);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(px, py, 48, 48);
}

function drawItemFlat(px, py) {
  // px, py is the centre of the cell
  ctx_.fillStyle = "rgb(240,180,40)";
  ctx_.fillRect(px - 8, py - 8, 16, 16);
}

function drawCreatureFlat(isHero, isMe, px, py, ox, oy, k, size, small) {
  let r, g, b;
  if (isHero) {
    [r, g, b] = isMe ? [60, 120, 255] : [60, 200, 120];
  } else {
    [r, g, b] = [220, 50, 50];
  }
  ctx_.fillStyle = `rgb(${r},${g},${b})`;
  const cx = px + 24 * size + ox;
  const cy = py + 24 * size + oy;
  let hw, hh;
  if (small) {
    hw = (12 * size - 4) * k;
    hh = (12 * size - 4) * k;
  } else {
    hw = (24 * size - 8) * k;
    hh = (24 * size - 8) * k;
  }
  ctx_.fillRect(cx - hw, cy - hh, 2 * hw, 2 * hh);
}

function stands(grid, x, y) {
  if (grid.at(x, y) !== "wall") return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nk = grid.at(x + dx, y + dy);
      if (nk === "floor" || nk === "stairs") return true;
    }
  }
  return false;
}

function wallJoin(grid, x, y) {
  let m = 0;
  if (stands(grid, x, y - 1)) m += 1;
  if (stands(grid, x + 1, y)) m += 2;
  if (stands(grid, x, y + 1)) m += 4;
  if (stands(grid, x - 1, y)) m += 8;
  return m;
}

function animate(last, now) {
  if (!last || typeof last.kind !== "string") return { ox: 0, oy: 0, k: 1 };
  const t = now - (last.at || 0);
  if (t < 0) return { ox: 0, oy: 0, k: 1 };

  if (last.kind === "move") {
    if (t >= 160) return { ox: 0, oy: 0, k: 1 };
    const h = Math.sin(Math.PI * t / 160);
    let oy = -12 * h;
    let k = 1;
    if (last.dy === -1) k = 1 + 0.15 * h;
    return { ox: 0, oy, k };
  }

  if (last.kind === "attack") {
    if (t >= 300) return { ox: 0, oy: 0, k: 1 };
    let ox, oy, k = 1;
    if (t < 150) {
      const p = t / 150;
      const e = p * p * (3 - 2 * p);
      ox = 0; oy = -16 * e;
      if (last.dy === -1) k = 1 + 0.25 * e;
    } else if (t < 210) {
      const p = (t - 150) / 60;
      ox = 18 * last.dx * p;
      oy = -16 + (18 * last.dy + 16) * p;
      if (last.dy === -1) k = 1.25 - 0.25 * p;
    } else {
      const p = (t - 210) / 90;
      ox = 18 * last.dx * (1 - p);
      oy = 18 * last.dy * (1 - p);
      k = 1;
    }
    return { ox, oy, k };
  }

  return { ox: 0, oy: 0, k: 1 };
}

function drawTile(world, px, py, cx, cy) {
  const kind = world.grid.at(cx, cy);
  const theme = tileTheme(world, cx, cy);
  if (kind === "wall") {
    if (!stands(world.grid, cx, cy)) return; // background
    const m = wallJoin(world.grid, cx, cy);
    const name = `wall-${m}`;
    if (loaded_) {
      const s = atlas.tile(theme, name);
      if (s) ctx_.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, px, py, 48, 48);
    } else {
      drawTileFlat(ctx_, kind, px, py);
    }
    return;
  }
  if (loaded_) {
    const s = atlas.tile(theme, kind);
    if (s) ctx_.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, px, py, 48, 48);
  } else {
    drawTileFlat(ctx_, kind, px, py);
  }
}

function findItem(world, cx, cy) {
  for (const it of world.items) {
    if (it.pos.x === cx && it.pos.y === cy) return it;
  }
  return null;
}

function drawItemSprite(it, px, py) {
  const name = it.kind === "lever" ? (it.pulled ? "lever-pulled" : "lever") : it.kind;
  const s = atlas.sprite(name);
  if (s) ctx_.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, px, py, 48, 48);
}

function drawItem(world, px, py, cx, cy) {
  const it = findItem(world, cx, cy);
  if (!it) return;
  if (loaded_) {
    drawItemSprite(it, px, py);
  } else {
    drawItemFlat(px + 24, py + 24);
  }
}

function drawFlungItem(world, it, now, cam) {
  if (!it.flung) return null;
  const t = now - it.flung.at;
  if (t < 0 || t >= 400) return null;
  if (!world.visible.at(it.pos.x, it.pos.y)) return null;
  const p = t / 400;
  const fx = it.flung.x, fy = it.flung.y;
  const ex = it.pos.x, ey = it.pos.y;
  const cx = fx + (ex - fx) * p;
  const cy = fy + (ey - fy) * p;
  const px = (cx - cam.x) * 48 + 24;
  const py = (cy - cam.y) * 48 + 24 - 32 * Math.sin(Math.PI * p);
  return { px, py };
}

function drawFlungItemSprite(fpos, it) {
  const name = it.kind === "lever" ? (it.pulled ? "lever-pulled" : "lever") : it.kind;
  const s = atlas.sprite(name);
  if (s) ctx_.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, fpos.px - 24, fpos.py - 24, 48, 48);
}

function drawCreaturePose(pose, name, facing, px, py, ox, oy, k, size, small) {
  const s = atlas.pose(name, pose.anim, pose.frame, pose.look);
  if (!s) return;
  const scale = small ? 0.5 : 1;
  const sq = 48 * size * scale;
  const cx = px + 24 * size + ox;
  const cy = py + 24 * size + oy;
  ctx_.save();
  ctx_.translate(cx, cy);
  ctx_.scale(facing === "left" ? -k : k, k);
  ctx_.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, -sq / 2, -sq / 2, sq, sq);
  ctx_.restore();
}

function drawOutline(facing, px, py, ox, oy, k, size, small) {
  const scale = small ? 0.5 : 1;
  const sq = 48 * size * scale;
  const half = sq / 2;
  ctx_.save();
  ctx_.translate(px + 24 * size + ox, py + 24 * size + oy);
  ctx_.scale(facing === "left" ? -k : k, k);
  ctx_.fillStyle = "rgb(60,200,120)";
  ctx_.fillRect(-half, -half, sq, 3);
  ctx_.fillRect(-half, half - 3, sq, 3);
  ctx_.fillRect(-half, -half + 3, 3, sq - 6);
  ctx_.fillRect(half - 3, -half + 3, 3, sq - 6);
  ctx_.restore();
}

function drawProjectiles(world, now, cam) {
  for (const creature of world.monsters) {
    const last = creature.last;
    if (!last || last.kind !== "attack" || last.reach <= 1) continue;
    const t = now - last.at;
    if (t < 150 || t >= 210) continue;
    const p = (t - 150) / 60;
    const mx = creature.pos.x, my = creature.pos.y;
    const size = creature.size || 1;
    const px0 = (mx - cam.x) * 48 + 24 * size;
    const py0 = (my - cam.y) * 48 + 24 * size;
    const px1 = (mx + last.reach * last.dx - cam.x) * 48 + 24;
    const py1 = (my + last.reach * last.dy - cam.y) * 48 + 24;
    const px = px0 + (px1 - px0) * p;
    const py = py0 + (py1 - py0) * p;
    ctx_.fillStyle = "rgb(255,160,40)";
    ctx_.fillRect(px - 4, py - 4, 8, 8);
  }
  for (const h of world.heroes) {
    const last = h.actor.last;
    if (!last || last.kind !== "attack" || last.reach <= 1) continue;
    const t = now - last.at;
    if (t < 150 || t >= 210) continue;
    const p = (t - 150) / 60;
    const mx = h.actor.pos.x, my = h.actor.pos.y;
    const size = h.actor.size || 1;
    const px0 = (mx - cam.x) * 48 + 24 * size;
    const py0 = (my - cam.y) * 48 + 24 * size;
    const px1 = (mx + last.reach * last.dx - cam.x) * 48 + 24;
    const py1 = (my + last.reach * last.dy - cam.y) * 48 + 24;
    const px = px0 + (px1 - px0) * p;
    const py = py0 + (py1 - py0) * p;
    ctx_.fillStyle = "rgb(255,160,40)";
    ctx_.fillRect(px - 4, py - 4, 8, 8);
  }
}

function drawAimDot(world, me, now, cam) {
  const meHero = world.heroes.find((h) => h.name === me && h.alive);
  if (!meHero) return;
  const actor = meHero.actor;
  const aim = actor.aim;
  const range = actor.stats.range;
  const { dx, dy } = aim;
  let cx = actor.pos.x;
  let cy = actor.pos.y;
  let lastOpen = null;
  for (let k = 1; k <= range; k++) {
    const nx = cx + k * dx;
    const ny = cy + k * dy;
    if (!world.grid.open(nx, ny)) {
      if (dx !== 0 && dy !== 0) {
        const c1 = world.grid.open(cx + dx, cy);
        const c2 = world.grid.open(cx, cy + dy);
        if (!c1 || !c2) break;
      } else {
        break;
      }
    }
    lastOpen = { x: nx, y: ny };
    cx = nx; cy = ny;
  }
  if (!lastOpen) return;
  if (Math.floor(now / 300) % 2 !== 1) return;
  const px = (lastOpen.x - cam.x) * 48 + 24;
  const py = (lastOpen.y - cam.y) * 48 + 24;
  ctx_.fillStyle = "rgb(255,140,0)";
  ctx_.beginPath();
  ctx_.arc(px, py, 6, 0, Math.PI * 2);
  ctx_.fill();
}

/** `draw(world, me, paused, now)`. Draws the world for the player `me`, as above, onto the canvas given to `init` (throws an `Error` if none was given), with the paused band when `paused` is true. `now` is the world time to animate at, a number of 0 or more (left out: the world's `time`): the page draws every frame, with `now` running on from the last world's `time` between two worlds. */
export function draw(world, me, paused, nowIn) {
  if (!canvas_) throw new Error("no canvas given to init");
  const W = canvas_.width;
  const H = canvas_.height;
  const cols = Math.floor(W / 48);
  const rows = Math.floor((H - 120) / 48);
  const now = nowIn !== undefined ? nowIn : world.time;

  ctx_.fillStyle = "rgb(22,13,19)";
  ctx_.fillRect(0, 0, W, H);

  const cam = camera(world, me, cols, rows);

  // Pass 1: tiles of every cell in visible or explored.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = cam.x + c;
      const cy = cam.y + r;
      if (cx < 0 || cy < 0 || cx >= world.grid.width || cy >= world.grid.height) continue;
      if (!world.visible.at(cx, cy) && !world.explored.at(cx, cy)) continue;
      drawTile(world, c * 48, r * 48, cx, cy);
    }
  }

  // Pass 2: a black veil of alpha 0.6 over every cell in explored but not visible.
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

  // Pass 3: the items lying on visible cells.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = cam.x + c;
      const cy = cam.y + r;
      if (cx < 0 || cy < 0 || cx >= world.grid.width || cy >= world.grid.height) continue;
      if (!world.visible.at(cx, cy)) continue;
      for (const it of world.items) {
        if (it.pos.x === cx && it.pos.y === cy) {
          if (it.flung) {
            const t = now - it.flung.at;
            if (t < 0 || t >= 400) {
              drawItem(world, c * 48, r * 48, cx, cy);
            }
          } else {
            drawItem(world, c * 48, r * 48, cx, cy);
          }
        }
      }
    }
  }

  // Flung items flying.
  for (const it of world.items) {
    if (it.flung) {
      const fpos = drawFlungItem(world, it, now, cam);
      if (fpos) {
        if (loaded_) {
          drawFlungItemSprite(fpos, it);
        } else {
          drawItemFlat(fpos.px, fpos.py);
        }
      }
    }
  }

  // Pass 4a: the creatures standing on visible cells: the monsters.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = cam.x + c;
      const cy = cam.y + r;
      if (cx < 0 || cy < 0 || cx >= world.grid.width || cy >= world.grid.height) continue;
      if (!world.visible.at(cx, cy)) continue;
      for (const m of world.monsters) {
        if (m.pos.x === cx && m.pos.y === cy) {
          const anim = animate(m.last, now);
          if (loaded_) {
            drawCreaturePose({ anim: "idle", frame: (Math.floor(now / 250) + m.id) % 3 }, m.kind, m.facing, c * 48, r * 48, anim.ox, anim.oy, anim.k, m.size, m.small);
          } else {
            drawCreatureFlat(false, false, c * 48, r * 48, anim.ox, anim.oy, anim.k, m.size, m.small);
          }
        }
      }
    }
  }

  // Pass 4b: then the alive heroes (heroes on top).
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = cam.x + c;
      const cy = cam.y + r;
      if (cx < 0 || cy < 0 || cx >= world.grid.width || cy >= world.grid.height) continue;
      if (!world.visible.at(cx, cy)) continue;
      for (const h of world.heroes) {
        if (h.alive && h.actor.pos.x === cx && h.actor.pos.y === cy) {
          const anim = animate(h.actor.last, now);
          const isMe = h.name === me;
          if (loaded_) {
            const pose = { anim: "idle", frame: (Math.floor(now / 250) + h.actor.id) % 3, look: { colour: h.colour, group: h.group } };
            const g = h.actor.gesture;
            if (g) {
              const t = now - g.at;
              if (g.kind === "power" && t >= 0 && t < 600) {
                pose.anim = "power_up"; pose.frame = Math.floor(t / 100);
              } else if (g.kind === "use" && t >= 0 && t < 450) {
                pose.anim = "power_up"; pose.frame = Math.floor(t / 150);
              }
            }
            drawCreaturePose(pose, "hero", h.actor.facing, c * 48, r * 48, anim.ox, anim.oy, anim.k, h.actor.size, h.actor.small);
            if (!isMe) drawOutline(h.actor.facing, c * 48, r * 48, anim.ox, anim.oy, anim.k, h.actor.size, h.actor.small);
          } else {
            drawCreatureFlat(true, isMe, c * 48, r * 48, anim.ox, anim.oy, anim.k, h.actor.size, h.actor.small);
          }
        }
      }
    }
  }

  // Pass 5: the projectiles of ranged attacks in flight.
  drawProjectiles(world, now, cam);

  // Pass 6: the aim dot of me's hero.
  drawAimDot(world, me, now, cam);

  // Pass 7: the prices of wares on visible cells.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = cam.x + c;
      const cy = cam.y + r;
      if (cx < 0 || cy < 0 || cx >= world.grid.width || cy >= world.grid.height) continue;
      if (!world.visible.at(cx, cy)) continue;
      for (const it of world.items) {
        if (it.pos.x === cx && it.pos.y === cy) {
          const price = it.price !== undefined ? it.price : 0;
          if (price > 0) {
            const priceText = price + "g";
            ctx_.font = "bold 14px monospace";
            ctx_.textAlign = "center";
            let color = "rgb(255,215,80)";
            for (const h of world.heroes) {
              if (h.name === me && h.offer === it.id) {
                color = "rgb(120,255,120)";
                break;
              }
            }
            ctx_.fillStyle = color;
            ctx_.fillText(priceText, c * 48 + 24, r * 48 - 4);
          }
        }
      }
    }
  }

  hud.draw(ctx_, 0, rows * 48, W, H - rows * 48, world, me);

  if (paused) {
    const midY = Math.floor(rows * 48 / 2);
    const bandTop = midY - 24;
    ctx_.fillStyle = "rgb(0,0,0)";
    ctx_.fillRect(0, bandTop, W, 48);
    ctx_.fillStyle = "rgb(230,220,200)";
    ctx_.font = "bold 24px monospace";
    ctx_.textBaseline = "middle";
    ctx_.textAlign = "center";
    ctx_.fillText("PAUSED", W / 2, midY);
  }
}
