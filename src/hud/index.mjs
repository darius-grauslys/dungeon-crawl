// hud: a status panel under the map

import * as level from "../../shapes/level/index.mjs";

function where(depth) {
  const lbl = level.label(depth);
  if (lbl.startsWith("Level ")) {
    return lbl + "/25";
  }
  return lbl;
}

/** `lines(world, me) -> array of strings`. First the status line of `me`'s hero, `<name>   HP <hp>/<maxHp>   ATK <attack>   DEF <defense>   Gold <gold>   <where>` (three spaces between the parts; ` (fallen)` after the HP part of a hero not alive; `   MP <magicPower>   MR <magicResist>` right after the DEF part when its `magicPower` is above 1 or its `magicResist` above 0, and not otherwise; `   Slowed <slow>` at the end while its actor's `slow` is above 0, then `   Cursed <curse>` while its `curse` is above 0), or `Watching   Gold <gold>   <where>` with no hero of that name; `<where>` is `Level <n>/25` on a dungeon floor (`n` `level.number(depth)`), `Shop` on a shop and `Lair` on a lair (shops and lairs have no number); then the party line, `Party: ` and each hero in order as `<name> <hp>/<maxHp>`, or `<name> fallen` for one not alive, joined by `, ` (`Party: none` with no heroes); then the last two lines of the world's log, oldest first (fewer when the log is shorter). */
export function lines(world, me) {
  const gold = world.gold;
  const depth = world.depth;
  const log = world.log;
  const whereText = where(depth);

  // status line
  const hero = world.heroes.find((h) => h.name === me);
  let statusLine;
  if (hero) {
    const stats = hero.actor.stats;
    const hp = stats.hp;
    const maxHp = stats.maxHp;
    const attack = stats.attack;
    const defense = stats.defense;
    const magicPower = stats.magicPower;
    const magicResist = stats.magicResist;
    const hpPart = hero.alive ? `HP ${hp}/${maxHp}` : `HP ${hp}/${maxHp} (fallen)`;
    let mpMrPart = "";
    if (magicPower > 1 || magicResist > 0) {
      mpMrPart = `   MP ${magicPower}   MR ${magicResist}`;
    }
    let slowPart = "";
    const slow = hero.actor.slow;
    if (slow > 0) {
      slowPart = `   Slowed ${slow}`;
    }
    let cursedPart = "";
    const curse = hero.actor.curse;
    if (curse > 0) {
      cursedPart = `   Cursed ${curse}`;
    }
    statusLine = `${hero.name}   ${hpPart}   ATK ${attack}   DEF ${defense}${mpMrPart}   Gold ${gold}   ${whereText}${slowPart}${cursedPart}`;
  } else {
    statusLine = `Watching   Gold ${gold}   ${whereText}`;
  }

  // party line
  const partyLine = world.heroes.length === 0
    ? "Party: none"
    : "Party: " + world.heroes.map((h) => {
        const stats = h.actor.stats;
        const hp = stats.hp;
        const maxHp = stats.maxHp;
        return h.alive ? `${h.name} ${hp}/${maxHp}` : `${h.name} fallen`;
      }).join(", ");

  const logLines = log.slice(-2);
  return [statusLine, partyLine, ...logLines];
}

/** `draw(ctx, x, y, width, height, world, me)`. Draws the panel for the player `me` into the rectangle (x, y, width, height) of the 2D context ctx, and nothing outside it (it clips to it). x, y integers, width and height integers of 1 or more, me a string; anything else, or a world that isn't one, throws a TypeError. */
export function draw(ctx, x, y, width, height, world, me) {
  if (typeof x !== "number" || !Number.isInteger(x) ||
      typeof y !== "number" || !Number.isInteger(y) ||
      typeof width !== "number" || !Number.isInteger(width) || width < 1 ||
      typeof height !== "number" || !Number.isInteger(height) || height < 1 ||
      typeof me !== "string" ||
      !(world && Array.isArray(world.heroes) && Array.isArray(world.monsters) && typeof world.gold === "number" && typeof world.depth === "number" && Array.isArray(world.log) && world.grid && typeof world.grid.width === "number" && typeof world.grid.height === "number" && typeof world.grid.at === "function" && typeof world.grid.open === "function" && world.explored && typeof world.explored.at === "function" && world.visible && typeof world.visible.at === "function")) {
    throw new TypeError("hud.draw: invalid arguments");
  }

  const barX = x + 8;
  const barY = y + 8;
  const barW = 200;
  const barH = 12;

  let fillW = 0;
  const hero = world.heroes.find((h) => h.name === me);
  if (hero) {
    const stats = hero.actor.stats;
    const hp = stats.hp;
    const maxHp = stats.maxHp;
    fillW = Math.round(200 * hp / maxHp);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  // background
  ctx.fillStyle = "rgb(40, 26, 34)";
  ctx.fillRect(x, y, width, height);

  // hit-point bar
  ctx.fillStyle = "rgb(200, 40, 40)";
  ctx.fillRect(barX, barY, fillW, barH);
  ctx.fillStyle = "rgb(60, 20, 20)";
  ctx.fillRect(barX + fillW, barY, barW - fillW, barH);

  // lines: rgb(230, 220, 200), 16px monospace, first baseline at top+44, each next 22 lower, from left+8, maxWidth leaves room for the minimap
  const lineTexts = lines(world, me);
  ctx.fillStyle = "rgb(230, 220, 200)";
  ctx.font = "16px monospace";
  const startBaseline = y + 44;
  const mw = 2 * world.grid.width;
  const maxWidth = width - mw - 24;
  for (let i = 0; i < lineTexts.length; i++) {
    const baseline = startBaseline + i * 22;
    if (baseline > y + height) break;
    ctx.fillText(lineTexts[i], x + 8, baseline, maxWidth);
  }

  // minimap: 2 px per cell, bottom-right corner
  const gridW = world.grid.width;
  const gridH = world.grid.height;
  const mwMap = 2 * gridW;
  const mhMap = 2 * gridH;
  const minimapX = x + width - 8 - mwMap;
  const minimapY = y + height - 8 - mhMap;

  // fill with dark
  ctx.fillStyle = "rgb(22, 13, 19)";
  ctx.fillRect(minimapX, minimapY, mwMap, mhMap);

  // theme colour
  const theme = level.theme(world.depth);
  let floorColor;
  switch (theme) {
    case "dungeon": floorColor = [95, 87, 94]; break;
    case "frozen": floorColor = [77, 102, 96]; break;
    case "arid":
    case "interior": floorColor = [144, 75, 65]; break;
    case "temple":
    case "magma": floorColor = [173, 64, 48]; break;
    default: floorColor = [95, 87, 94];
  }

  for (let cy = 0; cy < gridH; cy++) {
    for (let cx = 0; cx < gridW; cx++) {
      if (!world.explored.at(cx, cy)) continue;
      const kind = world.grid.at(cx, cy);
      const px = minimapX + 2 * cx;
      const py = minimapY + 2 * cy;
      if (kind === "stairs") {
        ctx.fillStyle = "rgb(255, 215, 80)";
        ctx.fillRect(px, py, 2, 2);
      } else if (world.grid.open(cx, cy)) {
        ctx.fillStyle = `rgb(${floorColor[0]}, ${floorColor[1]}, ${floorColor[2]})`;
        ctx.fillRect(px, py, 2, 2);
      } else if (kind === "wall") {
        let standing = false;
        for (let ny = -1; ny <= 1 && !standing; ny++) {
          for (let nx = -1; nx <= 1; nx++) {
            if (nx === 0 && ny === 0) continue;
            if (world.grid.open(cx + nx, cy + ny)) {
              standing = true;
              break;
            }
          }
        }
        if (standing) {
          ctx.fillStyle = `rgb(${Math.floor(floorColor[0] / 2)}, ${Math.floor(floorColor[1] / 2)}, ${Math.floor(floorColor[2] / 2)})`;
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }
  }

  // monsters covering visible cells
  for (const monster of world.monsters) {
    for (const cell of monster.cells()) {
      if (world.visible.at(cell.x, cell.y)) {
        const px = minimapX + 2 * cell.x;
        const py = minimapY + 2 * cell.y;
        ctx.fillStyle = "rgb(220, 50, 50)";
        ctx.fillRect(px, py, 2, 2);
      }
    }
  }

  // heroes
  for (const h of world.heroes) {
    if (!h.alive) continue;
    const hp = h.actor.pos;
    const px = minimapX + 2 * hp.x;
    const py = minimapY + 2 * hp.y;
    ctx.fillStyle = h.name === me ? "rgb(255, 255, 255)" : "rgb(60, 200, 120)";
    ctx.fillRect(px, py, 2, 2);
  }

  ctx.restore();
}
