// hud: a status panel under the map

import * as level from "../../shapes/level/index.mjs";

function where(depth) {
  const lbl = level.label(depth);
  if (lbl.startsWith("Level ")) {
    return lbl + "/25";
  }
  return lbl;
}

/** `lines(world, me) -> array of strings`. First the status line of `me`'s hero, `<name>   HP <hp>/<maxHp>   ATK <attack>   DEF <defense>   Gold <gold>   <where>` (three spaces between the parts; ` (fallen)` after the HP part of a hero not alive; `   Slowed <slow>` at the end while its actor's `slow` is above 0), or `Watching   Gold <gold>   <where>` with no hero of that name; `<where>` is `Level <n>/25` on a dungeon floor (`n` `level.number(depth)`), `Shop` on a shop and `Lair` on a lair (shops and lairs have no number); then the party line, `Party: ` and each hero in order as `<name> <hp>/<maxHp>`, or `<name> fallen` for one not alive, joined by `, ` (`Party: none` with no heroes); then the last two lines of the world's log, oldest first (fewer when the log is shorter). */
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
    const hpPart = hero.alive ? `HP ${hp}/${maxHp}` : `HP ${hp}/${maxHp} (fallen)`;
    let slowPart = "";
    const slow = hero.actor.slow;
    if (slow > 0) {
      slowPart = `   Slowed ${slow}`;
    }
    statusLine = `${hero.name}   ${hpPart}   ATK ${attack}   DEF ${defense}   Gold ${gold}   ${whereText}${slowPart}`;
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
      !(world && Array.isArray(world.heroes) && typeof world.gold === "number" && typeof world.depth === "number" && Array.isArray(world.log))) {
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

  // lines: rgb(230, 220, 200), 16px monospace, first baseline at top+44, each next 22 lower, from left+8
  const lineTexts = lines(world, me);
  ctx.fillStyle = "rgb(230, 220, 200)";
  ctx.font = "16px monospace";
  const startBaseline = y + 44;
  for (let i = 0; i < lineTexts.length; i++) {
    const baseline = startBaseline + i * 22;
    if (baseline > y + height) break;
    ctx.fillText(lineTexts[i], x + 8, baseline);
  }

  ctx.restore();
}
