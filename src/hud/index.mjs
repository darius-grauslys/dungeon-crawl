// hud: a status panel under the map

/** `lines(world) -> array of strings`. First the status line, `HP <hp>/<maxHp>   ATK <attack>   DEF <defense>   Gold <gold>   Depth <depth>/5` (three spaces between the parts), then the last three lines of the world's log, oldest first (fewer when the log is shorter). */
export function lines(world) {
  const hp = world.hero.stats.hp;
  const maxHp = world.hero.stats.maxHp;
  const attack = world.hero.stats.attack;
  const defense = world.hero.stats.defense;
  const gold = world.gold;
  const depth = world.depth;
  const log = world.log;

  const statusLine = `HP ${hp}/${maxHp}   ATK ${attack}   DEF ${defense}   Gold ${gold}   Depth ${depth}/5`;
  const logLines = log.slice(-3);
  return [statusLine, ...logLines];
}

/** `draw(ctx, x, y, width, height, world)`. Draws the panel into the rectangle (x, y, width, height) of the 2D context ctx, and nothing outside it (it clips to it). x, y integers, width and height integers of 1 or more; anything else, or a world that isn't one, throws a TypeError. */
export function draw(ctx, x, y, width, height, world) {
  if (typeof x !== 'number' || !Number.isInteger(x) ||
      typeof y !== 'number' || !Number.isInteger(y) ||
      typeof width !== 'number' || !Number.isInteger(width) || width < 1 ||
      typeof height !== 'number' || !Number.isInteger(height) || height < 1 ||
      !(world && world.hero && world.hero.stats && typeof world.gold === 'number' && typeof world.depth === 'number' && Array.isArray(world.log))) {
    throw new TypeError('hud.draw: invalid arguments');
  }

  const hp = world.hero.stats.hp;
  const maxHp = world.hero.stats.maxHp;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  // background
  ctx.fillStyle = 'rgb(40, 26, 34)';
  ctx.fillRect(x, y, width, height);

  // hit-point bar: left+8, top+8, 200 wide, 12 high
  const barX = x + 8;
  const barY = y + 8;
  const barW = 200;
  const barH = 12;
  const fillW = Math.round(200 * hp / maxHp);

  ctx.fillStyle = 'rgb(200, 40, 40)';
  ctx.fillRect(barX, barY, fillW, barH);
  ctx.fillStyle = 'rgb(60, 20, 20)';
  ctx.fillRect(barX + fillW, barY, barW - fillW, barH);

  // lines: rgb(230, 220, 200), 16px monospace, first baseline at top+44, each next 22 lower, from left+8
  const lineTexts = lines(world);
  ctx.fillStyle = 'rgb(230, 220, 200)';
  ctx.font = '16px monospace';
  const startBaseline = y + 44;
  for (let i = 0; i < lineTexts.length; i++) {
    const baseline = startBaseline + i * 22;
    if (baseline > y + height) break;
    ctx.fillText(lineTexts[i], x + 8, baseline);
  }

  ctx.restore();
}
