// rules: the game itself, in real time.

import * as dungeon from "../../edges/edge_to_dungeon.mjs";
import * as fov from "../../edges/edge_to_fov.mjs";
import * as combat from "../../edges/edge_to_combat.mjs";
import * as monstersNode from "../../edges/edge_to_monsters.mjs";

import * as worldShape from "../../shapes/world/index.mjs";
import * as intentShape from "../../shapes/intent/index.mjs";
import * as floorPlanShape from "../../shapes/floor-plan/index.mjs";
import * as tileGridShape from "../../shapes/tile-grid/index.mjs";
import * as actorShape from "../../shapes/actor/index.mjs";
import * as itemShape from "../../shapes/item/index.mjs";
import * as maskShape from "../../shapes/mask/index.mjs";
import * as statsShape from "../../shapes/stats/index.mjs";
import * as strikeShape from "../../shapes/strike/index.mjs";
import * as pointShape from "../../shapes/point/index.mjs";
import * as heroShape from "../../shapes/hero/index.mjs";
import * as saveShape from "../../shapes/save/index.mjs";
import * as levelShape from "../../shapes/level/index.mjs";
import * as bestiary from "../../shapes/bestiary/index.mjs";

const HERO_START_STATS = { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 };

const HERO_LATENCY = {
  step: 200,
  attack: 350,
  use: 250,
  wait: 200,
  descend: 200,
};

function mulberryDraw(rng) {
  rng = (rng + 0x6d2b79f5) >>> 0;
  let t = rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { rng, value };
}

function pick(rng, list) {
  const { rng: nr, value } = mulberryDraw(rng);
  return { rng: nr, item: list[Math.floor(value * list.length)] };
}

function combatDraw(rng) {
  const { rng: nr1, value: v1 } = mulberryDraw(rng);
  const rollVal = Math.max(1, Math.min(20, 1 + Math.floor(v1 * 20)));
  const { rng: nr2, value: v2 } = mulberryDraw(nr1);
  const wardVal = 1 + Math.floor(v2 * 100);
  return { rng: nr2, roll: rollVal, ward: wardVal };
}

function isShopDepth(depth) {
  return levelShape.kind(depth) === "interior";
}

function isLairDepth(depth) {
  return levelShape.kind(depth) === "boss";
}

function wareLabel(kind) {
  if (kind === "potion") return "a potion";
  if (kind === "ring") return "a ring";
  if (kind === "necklace") return "a cross necklace";
  return itemGradeName(kind);
}

function wareTooHigh(stats, kind) {
  if (kind.startsWith("sword")) {
    const limit = kind === "sword" ? 8 : kind === "sword-2" ? 12 : kind === "sword-3" ? 16 : 24;
    return stats.attack >= limit;
  }
  if (kind.startsWith("armor")) {
    const limit = kind === "armor" ? 4 : kind === "armor-2" ? 8 : kind === "armor-3" ? 12 : 24;
    return stats.defense >= limit;
  }
  return false;
}

function itemGradeName(kind) {
  if (kind === "sword") return "a sword";
  if (kind === "sword-2") return "a fine sword";
  if (kind === "sword-3") return "an axe";
  if (kind === "sword-4") return "a great axe";
  if (kind === "armor") return "armor";
  if (kind === "armor-2") return "chainmail";
  if (kind === "armor-3") return "bronze mail";
  if (kind === "armor-4") return "jade mail";
  return kind;
}

function isBoss(kind) {
  return kind === "golem" || kind === "serpent" || kind === "reaper";
}

function cellsCovered(actor) {
  const cells = [];
  const size = actor.size || 1;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      cells.push(pointShape.of(actor.pos.x + i, actor.pos.y + j));
    }
  }
  return cells;
}

function distanceLe(actorA, actorB) {
  const aCells = cellsCovered(actorA);
  const bCells = cellsCovered(actorB);
  let minDist = Infinity;
  for (const ac of aCells) {
    for (const bc of bCells) {
      const d = Math.max(Math.abs(ac.x - bc.x), Math.abs(ac.y - bc.y));
      if (d < minDist) minDist = d;
    }
  }
  return minDist;
}

function distanceToSquare(monster, cell) {
  const size = monster.size || 1;
  const cx0 = monster.pos.x, cy0 = monster.pos.y;
  const cx1 = cx0 + size - 1, cy1 = cy0 + size - 1;
  const dx = Math.max(cx0 - cell.x, 0, cell.x - cx1);
  const dy = Math.max(cy0 - cell.y, 0, cell.y - cy1);
  return Math.max(dx, dy);
}

function cellsWithinSquare(monster, radius) {
  const size = monster.size || 1;
  const cx0 = monster.pos.x, cy0 = monster.pos.y;
  const cx1 = cx0 + size - 1, cy1 = cy0 + size - 1;
  const result = [];
  for (let y = cy1 - radius; y <= cy1 + radius; y++) {
    for (let x = cx0 - radius; x <= cx1 + radius; x++) {
      if (distanceToSquare(monster, pointShape.of(x, y)) <= radius) result.push(pointShape.of(x, y));
    }
  }
  return result;
}

function startCells(plan) {
  const grid = plan.grid;
  const start = plan.start;
  const spotsSet = new Set((plan.spots || []).map((p) => `${p.x},${p.y}`));
  const leversSet = new Set((plan.levers || []).map((p) => `${p.x},${p.y}`));
  const bossSet = new Set();
  if (plan.boss) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        bossSet.add(`${plan.boss.x + i},${plan.boss.y + j}`);
      }
    }
  }
  const result = [];
  const visited = new Set();
  const queue = [start];
  visited.add(`${start.x},${start.y}`);
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  while (queue.length > 0) {
    const cur = queue.shift();
    const key = `${cur.x},${cur.y}`;
    const isSpot = spotsSet.has(key) || leversSet.has(key) || bossSet.has(key);
    if (!isSpot) result.push(cur);
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nkey = `${nx},${ny}`;
      if (visited.has(nkey)) continue;
      if (grid.at(nx, ny) === "floor") {
        visited.add(nkey);
        queue.push(pointShape.of(nx, ny));
      }
    }
  }
  return result;
}

function allTrueMask(width, height) {
  const cells = [];
  for (let i = 0; i < width * height; i++) cells.push(true);
  return maskShape.of(width, height, cells);
}

function computeVisible(grid, depth, heroes) {
  if (isShopDepth(depth)) return allTrueMask(grid.width, grid.height);
  let m = maskShape.empty(grid.width, grid.height);
  for (const h of heroes) {
    if (!h.alive) continue;
    const vm = fov.compute(grid, h.actor.pos, 7);
    m = maskShape.union(m, vm);
  }
  return m;
}

function makeFloor(seed, depth, rngIn) {
  const plan = dungeon.generate(seed, depth);
  const spots = plan.spots;

  let rng = rngIn;
  let grid = plan.grid;
  const monsters = [];
  const items = [];
  let idCounter = 10;

  if (isLairDepth(depth)) {
    if (plan.boss) {
      const tiles = plan.grid.tiles();
      const round = levelShape.round(depth);
      const newTiles = tiles.map((t, idx) => {
        const x = idx % plan.grid.width;
        const y = Math.floor(idx / plan.grid.width);
        if (x === plan.stairs.x && y === plan.stairs.y) {
          if (round === 3) return "wall";
          return "floor";
        }
        return t;
      });
      grid = tileGridShape.of(plan.grid.width, plan.grid.height, newTiles);

      let bossKind, bossSize;
      if (round === 1) { bossKind = "golem"; bossSize = 3; }
      else if (round === 2) { bossKind = "serpent"; bossSize = 3; }
      else { bossKind = "reaper"; bossSize = 2; }
      const bossEntry = bestiary.entry(bossKind);
      monsters.push(
        actorShape.of({
          id: 10,
          kind: bossKind,
          pos: plan.boss,
          stats: statsShape.of({ hp: bossEntry.hp, maxHp: bossEntry.hp, attack: bossEntry.attack, defense: bossEntry.defense, range: bossEntry.range, magic: bossEntry.magic, magicPower: bossEntry.magicPower, magicResist: 0 }),
          ready: 0,
          mode: "dormant",
          size: bossSize,
          facing: "left",
          aim: { dx: -1, dy: 0 },
        })
      );
      idCounter = 11;
      for (const lp of (plan.levers || [])) {
        items.push(itemShape.of({ id: idCounter++, kind: "lever", pos: lp, amount: 0, price: 0, pulled: false }));
      }
      for (const sp of spots) {
        monsters.push(
          actorShape.of({
            id: idCounter++,
            kind: "slime",
            pos: sp,
            stats: statsShape.of({ hp: 6, maxHp: 6, attack: 2, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 }),
            ready: 0,
            mode: "guard",
            size: 1,
          })
        );
      }
    }
    return { plan, monsters, items, rng, grid };
  }

  if (isShopDepth(depth)) {
    const round = levelShape.round(depth);
    const nWares = round === 1 ? 6 : round === 2 ? 9 : round === 3 ? 12 : 18;
    const foodKinds = ["cheese", "bread", "meat"];
    const poolKinds = ["potion", "sword", "sword-2", "armor", "armor-2", "ring", "necklace"];
    const kinds = [];
    for (let i = 0; i < nWares; i++) {
      if (i < 2) {
        const { rng: nr, value } = mulberryDraw(rng);
        rng = nr;
        kinds.push(foodKinds[Math.floor(value * 3)]);
      } else {
        const { rng: nr, value } = mulberryDraw(rng);
        rng = nr;
        kinds.push(poolKinds[Math.floor(value * poolKinds.length)]);
      }
    }
    for (let i = 0; i < nWares; i++) {
      const kind = kinds[i];
      const cfg = kind === "potion" ? { base: 30, spread: 6 } : kind.startsWith("cheese") ? { base: 6, spread: 2 } : kind.startsWith("bread") ? { base: 10, spread: 3 } : kind.startsWith("meat") ? { base: 16, spread: 4 } : kind.startsWith("sword") ? { base: 30, spread: 6 } : kind.startsWith("armor") ? { base: 40, spread: 6 } : { base: 35, spread: 6 };
      const { rng: nr, value } = mulberryDraw(rng);
      rng = nr;
      const spread = cfg.spread;
      const price = Math.round(cfg.base * Math.pow(1.25, round - 1)) - spread + Math.floor(value * (2 * spread + 1));
      items.push(itemShape.of({ id: idCounter++, kind, pos: spots[i], amount: 0, price, pulled: false }));
    }
    return { plan, monsters, items, rng, grid };
  }

  const stage = levelShape.stage(depth);
  const tier = levelShape.tier(depth);
  const level = levelShape.number(depth);
  const numMonsters = 2 + 2 * stage;

  let kindsList;
  if (level === 1 || level === 2) {
    kindsList = ["bat", "slime", "snake"];
  } else if (level === 3) {
    kindsList = ["bat", "slime", "snake"];
  } else if (level === 4) {
    kindsList = ["bat", "slime", "snake", "skeleton"];
  } else if (level === 5) {
    kindsList = ["bat", "slime", "blue-spider", "skeleton"];
  } else if (level === 6) {
    kindsList = ["blue-slime", "blue-spider", "archer", "swordsman", "snowman"];
  } else if (level >= 7 && level <= 10) {
    kindsList = ["blue-slime", "blue-spider", "archer", "swordsman", "snowman"];
  } else if (level >= 11 && level <= 15) {
    kindsList = ["beetle", "mummy", "cultist"];
  } else if (level >= 16 && level <= 20) {
    kindsList = ["spider", "ghost", "scarecrow", "pumpkin"];
  } else if (level >= 21 && level <= 25) {
    kindsList = ["imp", "demon", "beholder"];
  }

  for (let i = 0; i < numMonsters; i++) {
    let kind;
    if (level === 3) {
      const { rng: nr, value } = mulberryDraw(rng);
      rng = nr;
      if (value < 0.08) kind = "swordsman";
      else { const { rng: nr2, item: k } = pick(rng, kindsList); rng = nr2; kind = k; }
    } else if (level === 4 || level === 5) {
      const { rng: nr, value } = mulberryDraw(rng);
      rng = nr;
      if (value < 0.10) kind = "archer";
      else if (value < 0.16) kind = "swordsman";
      else if (value < 0.22) kind = "mage";
      else { const { rng: nr2, item: k } = pick(rng, kindsList); rng = nr2; kind = k; }
    } else if (level === 6) {
      const { rng: nr, value } = mulberryDraw(rng);
      rng = nr;
      if (value < 0.25) kind = "mage";
      else if (value < 0.32) kind = "snow-skeleton";
      else { const { rng: nr2, item: k } = pick(rng, kindsList); rng = nr2; kind = k; }
    } else if (level >= 7 && level <= 10) {
      const { rng: nr, value } = mulberryDraw(rng);
      rng = nr;
      if (value < 0.25) kind = "mage";
      else if (value < 0.32) kind = "snow-skeleton";
      else if (value < 0.45) kind = "wolf-man";
      else { const { rng: nr2, item: k } = pick(rng, kindsList); rng = nr2; kind = k; }
    } else {
      const { rng: nr, item: k } = pick(rng, kindsList);
      rng = nr;
      kind = k;
    }
    let pos = spots[i];
    if (kind === "pumpkin") {
      const ok = grid.open(pos.x, pos.y) && grid.open(pos.x + 1, pos.y) && grid.open(pos.x, pos.y + 1) && grid.open(pos.x + 1, pos.y + 1);
      let occupied = false;
      for (const mm of monsters) { if (mm.covers(pos.x, pos.y) || mm.covers(pos.x + 1, pos.y) || mm.covers(pos.x, pos.y + 1) || mm.covers(pos.x + 1, pos.y + 1)) { occupied = true; break; } }
      if (!ok || occupied) { kind = "spider"; pos = spots[i]; }
    }
    const e = bestiary.entry(kind);
    const eAttack = e.attack === 0 ? 0 : e.attack + tier;
    monsters.push(
      actorShape.of({
        id: idCounter++,
        kind,
        pos,
        stats: statsShape.of({ hp: e.hp + Math.floor(e.hp * tier / 2), maxHp: e.hp + Math.floor(e.hp * tier / 2), attack: eAttack, defense: e.defense + Math.floor(tier / 2), range: e.range, magic: e.magic, magicPower: e.magicPower, magicResist: 0 }),
        ready: 0,
        mode: "roam",
        size: e.size,
      })
    );
  }

  const hasSword = stage === 2 || stage === 4;
  const hasArmor = stage === 3 || stage === 5;
  const band = Math.min(4, tier + 1);
  let spotIdx = numMonsters;
  const foodKinds = ["cheese", "cheese", "bread", "meat"];
  for (let i = 0; i < 2; i++) {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    const kind = foodKinds[Math.floor(value * foodKinds.length)];
    items.push(itemShape.of({ id: idCounter++, kind, pos: spots[spotIdx++], amount: 0, price: 0, pulled: false }));
  }
  {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    if (value < 0.25) {
      items.push(itemShape.of({ id: idCounter++, kind: "potion", pos: spots[spotIdx++], amount: 0, price: 0, pulled: false }));
    }
  }
  for (let i = 0; i < 2; i++) {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    const d = Math.floor(value * 8);
    items.push(itemShape.of({ id: idCounter++, kind: "gold", pos: spots[spotIdx++], amount: levelShape.number(depth) * (3 + d), price: 0, pulled: false }));
  }
  if (hasSword) {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    const grade = 1 + Math.floor(value * band);
    const kind = grade === 1 ? "sword" : `sword-${grade}`;
    items.push(itemShape.of({ id: idCounter++, kind, pos: spots[spotIdx++], amount: 0, price: 0, pulled: false }));
  }
  if (hasArmor) {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    const grade = 1 + Math.floor(value * band);
    const kind = grade === 1 ? "armor" : `armor-${grade}`;
    items.push(itemShape.of({ id: idCounter++, kind, pos: spots[spotIdx++], amount: 0, price: 0, pulled: false }));
  }

  return { plan, monsters, items, rng, grid };
}

function newGame(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new TypeError("rules.newGame: seed must be an integer from 0 to 4294967295");
  }
  const { plan, monsters, items, rng, grid } = makeFloor(seed, 1, seed);
  const visible = maskShape.empty(grid.width, grid.height);
  const explored = maskShape.empty(grid.width, grid.height);
  const entry = saveShape.of({ seed, depth: 1, players: [] });
  return worldShape.of({
    seed, rng, depth: 1, time: 0, state: "playing", grid,
    heroes: [], monsters, items, visible, explored, gold: 0,
    log: ["Welcome to the dungeon. Find the stairs (>)."], entry,
  });
}

function toSave(world) {
  const players = world.heroes.map((h) => ({
    name: h.name,
    stats: { hp: h.alive ? h.actor.stats.hp : 1, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range || 1, magic: h.actor.stats.magic, magicPower: h.actor.stats.magicPower, magicResist: h.actor.stats.magicResist },
  }));
  return saveShape.of({ seed: world.seed, depth: world.depth, players });
}

function fromSave(save) {
  if (!(save instanceof saveShape.Save)) {
    throw new TypeError("rules.fromSave: save must be a save");
  }
  const { plan, monsters, items, rng, grid } = makeFloor(save.seed, save.depth, save.seed);
  const startList = startCells(plan);
  const newHeroes = [];
  for (let i = 0; i < save.players.length; i++) {
    const p = save.players[i];
    const hp = p.stats.hp === 0 ? 1 : p.stats.hp;
    const stats = statsShape.of({ hp, maxHp: p.stats.maxHp, attack: p.stats.attack, defense: p.stats.defense, range: p.stats.range || 1, magic: p.stats.magic || 0, magicPower: p.stats.magicPower || 1, magicResist: p.stats.magicResist || 0 });
    const start = startList[i] || startList[0];
    const actor = actorShape.of({ id: i, kind: "hero", pos: start, stats, ready: 0 });
    newHeroes.push(heroShape.of({ name: p.name, actor, pending: null, alive: true, colour: i, group: 0 }));
  }
  const visible = isShopDepth(save.depth) ? allTrueMask(grid.width, grid.height) : computeVisible(grid, save.depth, newHeroes);
  const explored = isShopDepth(save.depth) ? visible : maskShape.empty(grid.width, grid.height);
  let log = ["Welcome to the dungeon. Find the stairs (>)."];
  if (isShopDepth(save.depth)) log = ["A shop! Bump a ware twice to buy it."];
  else if (isLairDepth(save.depth)) log = ["Welcome to the dungeon. Find the stairs (>)."];
  else if (save.depth > 1) log = [`The party descends to level ${levelShape.number(save.depth)}.`];
  return worldShape.of({
    seed: save.seed, rng, depth: save.depth, time: 0, state: "playing", grid,
    heroes: newHeroes, monsters, items, visible, explored, gold: 0,
    log, entry: save,
  });
}

function join(world, name) {
  if (!saveShape.isName(name)) {
    throw new TypeError("rules.join: name must be a valid name");
  }
  if (world.heroes.some((h) => h.name === name)) return world;
  if (world.heroes.length >= 4) return null;
  const startList = startCells(world.entry ? dungeon.generate(world.seed, world.depth) : null);
  const plan = dungeon.generate(world.seed, world.depth);
  const startList2 = startCells(plan);
  let start = null;
  for (const sc of startList2) {
    if (!world.heroes.some((hh) => `${hh.actor.pos.x},${hh.actor.pos.y}` === `${sc.x},${sc.y}`)) { start = sc; break; }
  }
  if (!start) start = startList2[0];
  let nextId = 0;
  const existingIds = new Set(world.heroes.map((h) => h.actor.id));
  while (existingIds.has(nextId)) nextId++;
  const stats = statsShape.of(HERO_START_STATS);
  const actor = actorShape.of({ id: nextId, kind: "hero", pos: start, stats, ready: world.time });
  let usedColors = new Set(world.heroes.map((h) => h.colour));
  let colour = 0;
  while (usedColors.has(colour)) colour++;
  const newHero = heroShape.of({ name, actor, pending: null, alive: true, offer: null, colour, group: 0 });
  const newHeroes = [...world.heroes, newHero];
  const newEntry = saveShape.of({ seed: world.seed, depth: world.depth, players: [...world.entry.players, { name, stats: HERO_START_STATS }] });
  const newHeroVisible = computeVisible(world.grid, world.depth, [newHero]);
  const visible = maskShape.union(world.visible, newHeroVisible);
  return worldShape.of({
    seed: world.seed, rng: world.rng, depth: world.depth, time: world.time, state: world.state, grid: world.grid,
    heroes: newHeroes, monsters: world.monsters, items: world.items, visible, explored: world.explored,
    gold: world.gold, log: [...world.log, `${name} joins the party.`], entry: newEntry,
  });
}

function intend(world, name, intent) {
  if (world.state !== "playing") return world;
  if (!(intent instanceof intentShape.Intent)) {
    throw new TypeError("rules.intend: intent must be a valid intent");
  }
  const hero = world.heroes.find((h) => h.name === name);
  if (!hero || !hero.alive) return world;
  if (intent.kind === "face") {
    const dx = intent.dx, dy = intent.dy;
    const facing = actorShape.facingFor(dx, dy);
    const actor = hero.actor.with({ aim: { dx, dy }, facing });
    const newHeroes = world.heroes.map((h) => h.name === name ? heroShape.of({ name: h.name, actor, pending: h.pending, alive: h.alive, offer: h.offer, colour: h.colour, group: h.group }) : h);
    return worldShape.of({ ...world, heroes: newHeroes });
  }
  const newHeroes = world.heroes.map((h) => h.name === name ? heroShape.of({ name: h.name, actor: h.actor, pending: intent, alive: h.alive, offer: h.offer, colour: h.colour, group: h.group }) : h);
  return worldShape.of({ ...world, heroes: newHeroes });
}

function stepCutCorner(grid, actor, dx, dy) {
  if (dx === 0 || dy === 0) return false;
  return !grid.open(actor.pos.x + dx, actor.pos.y) || !grid.open(actor.pos.x, actor.pos.y + dy);
}

function gridOpen(grid, x, y) {
  return grid.at(x, y) === "floor";
}

function heroLatency(actor, type) {
  let lat;
  if (type === "attack") lat = HERO_LATENCY.attack;
  else if (type === "use") lat = HERO_LATENCY.use;
  else lat = HERO_LATENCY.step; // step, wait, descend
  if ((type === "step" || type === "attack") && actor.slow > 0) lat = lat * 2;
  if (actor.haste > 0) lat = Math.floor(lat / 2);
  return lat;
}

function monsterLatency(monster, type) {
  const e = bestiary.entry(monster.kind);
  let lat = type === "attack" ? e.strike : e.step;
  if (monster.slow > 0) lat = lat * 2;
  if (monster.haste > 0) lat = Math.floor(lat / 2);
  return lat;
}

function bumpStats(actor, kind) {
  const s = actor.stats;
  if (kind === "potion") {
    const nmaxHp = s.maxHp + 5;
    const nhp = s.hp + 5;
    return actor.with({ stats: statsShape.of({ hp: nhp, maxHp: nmaxHp, attack: s.attack, defense: s.defense, range: s.range, magic: s.magic, magicPower: s.magicPower, magicResist: s.magicResist }) });
  }
  if (kind === "cheese" || kind === "bread" || kind === "meat") {
    const f = kind === "cheese" ? 0.10 : kind === "bread" ? 0.25 : 0.50;
    const healedAmt = Math.max(1, Math.floor(s.maxHp * f));
    const nhp = Math.min(s.maxHp, s.hp + healedAmt);
    return actor.with({ stats: statsShape.of({ hp: nhp, maxHp: s.maxHp, attack: s.attack, defense: s.defense, range: s.range, magic: s.magic, magicPower: s.magicPower, magicResist: s.magicResist }) });
  }
  if (kind === "sword" || kind === "sword-2" || kind === "sword-3" || kind === "sword-4") {
    return actor.with({ stats: statsShape.of({ hp: s.hp, maxHp: s.maxHp, attack: s.attack + 1, defense: s.defense, range: s.range, magic: s.magic, magicPower: s.magicPower, magicResist: s.magicResist }) });
  }
  if (kind === "armor" || kind === "armor-2" || kind === "armor-3" || kind === "armor-4") {
    return actor.with({ stats: statsShape.of({ hp: s.hp, maxHp: s.maxHp, attack: s.attack, defense: s.defense + 1, range: s.range, magic: s.magic, magicPower: s.magicPower, magicResist: s.magicResist }) });
  }
  if (kind === "ring") {
    return actor.with({ stats: statsShape.of({ hp: s.hp, maxHp: s.maxHp, attack: s.attack, defense: s.defense, range: s.range, magic: s.magic, magicPower: s.magicPower + 1, magicResist: s.magicResist }) });
  }
  if (kind === "necklace") {
    return actor.with({ stats: statsShape.of({ hp: s.hp, maxHp: s.maxHp, attack: s.attack, defense: s.defense, range: s.range, magic: s.magic, magicPower: s.magicPower, magicResist: s.magicResist + 1 }) });
  }
  return actor;
}

function isSlowingMonster(kind) {
  const e = bestiary.entry(kind);
  return e ? e.slows : false;
}

function golemDeath(world, monstersList, boss, newTime, gold, log, rng) {
  const plan = dungeon.generate(world.seed, world.depth);
  const hasGuards = monstersList.some((mm) => mm.mode === "guard");
  log.push(`The ${boss.kind} is slain.`);
  if (hasGuards) log.push("The guardians crumble.");
  log.push("The way down opens!");
  log.push(`Gold spills from the ${boss.kind}!`);

  let newMonsters = monstersList.filter((mm) => mm.kind !== boss.kind && mm.mode !== "guard");

  let newItems = [...world.items];

  const round = levelShape.round(world.depth);
  const { rng: nr1, value: v1 } = mulberryDraw(rng);
  rng = nr1;
  const total = (25 + Math.floor(v1 * 51)) * round;
  const { rng: nr2, value: v2 } = mulberryDraw(rng);
  rng = nr2;
  let n = 1 + Math.floor(v2 * 5);

  const size = boss.size || 1;
  const small = boss.small || false;
  const sSize = small ? 1 : size;
  const sqX = boss.pos.x;
  const sqY = boss.pos.y;
  const candidates = [];
  for (let y = 0; y < world.grid.height; y++) {
    for (let x = 0; x < world.grid.width; x++) {
      const cx = Math.max(sqX, Math.min(x, sqX + sSize - 1));
      const cy = Math.max(sqY, Math.min(y, sqY + sSize - 1));
      const dist = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      if (dist >= 1 && dist <= 2) {
        if (world.grid.at(x, y) === "floor") {
          let occupied = false;
          for (const it of world.items) { if (it.pos.x === x && it.pos.y === y) occupied = true; }
          for (const mm of monstersList) { if (mm.covers(x, y)) occupied = true; }
          for (const h of world.heroes) { if (h.alive && h.actor.covers(x, y)) occupied = true; }
          if (!occupied) candidates.push(pointShape.of(x, y));
        }
      }
    }
  }
  if (n > candidates.length) n = candidates.length;

  const amounts = [];
  const base = Math.floor(total / n);
  for (let i = 0; i < n; i++) amounts.push(base);
  amounts[0] += total - n * base;

  let maxId = 0;
  for (const mm of monstersList) if (mm.id > maxId) maxId = mm.id;
  for (const it of world.items) if (it.id > maxId) maxId = it.id;

  const flungX = sqX + Math.floor(sSize / 2);
  const flungY = sqY + Math.floor(sSize / 2);

  for (let i = 0; i < n; i++) {
    const { rng: nri, value: vi } = mulberryDraw(rng);
    rng = nri;
    const idx = Math.floor(vi * candidates.length);
    const cell = candidates[idx];
    candidates.splice(idx, 1);
    newItems.push(itemShape.of({ id: ++maxId, kind: "gold", pos: cell, amount: amounts[i], price: 0, pulled: false, flung: { x: flungX, y: flungY, at: newTime } }));
  }

  const tiles = world.grid.tiles();
  const newTiles = tiles.map((t, idx) => {
    const x = idx % world.grid.width;
    const y = Math.floor(idx / world.grid.width);
    if (x === plan.stairs.x && y === plan.stairs.y) return "stairs";
    return t;
  });
  const newGrid = tileGridShape.of(world.grid.width, world.grid.height, newTiles);

  return { monsters: newMonsters, items: newItems, grid: newGrid, rng };
}

function heroFiredAction(world, h, newTime, heroLatencyFn, state) {
  const intent = h.pending;
  let log = state.log;
  let gold = state.gold;
  let items = state.items;
  let monstersList = state.monstersList;
  let offer = h.offer;
  let rng = state.rng;

  // Curse tick: each action a cursed hero fires deals it 1 damage and takes 1 off curse
  if (h.actor.curse > 0) {
    const nhp = h.actor.stats.hp - 1;
    const newCurse = h.actor.curse - 1;
    if (nhp <= 0) {
      log.push(`${h.name} falls.`);
      const updatedActor = h.actor.with({ stats: statsShape.of({ hp: 0, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range, magic: h.actor.stats.magic, magicPower: h.actor.stats.magicPower, magicResist: h.actor.stats.magicResist }), curse: newCurse });
      const newHero = h.with({ actor: updatedActor, alive: false, pending: null, offer: null });
      return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
    }
    const updatedActor = h.actor.with({ stats: statsShape.of({ hp: nhp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range, magic: h.actor.stats.magic, magicPower: h.actor.stats.magicPower, magicResist: h.actor.stats.magicResist }), curse: newCurse });
    h = h.with({ actor: updatedActor });
  }

  if (intent.kind === "move") {
    const dx = intent.dx, dy = intent.dy;
    const nx = h.actor.pos.x + dx, ny = h.actor.pos.y + dy;
    for (const it of items) {
      if (it.price > 0 && it.pos.x === nx && it.pos.y === ny) {
        let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy) });
        if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
        const tooHigh = wareTooHigh(h.actor.stats, it.kind);
        if (tooHigh) {
          const statName = it.kind.startsWith("sword") ? "attack" : "defense";
          offer = null;
          updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
          log.push(`${h.name}: your ${statName} is too high for ${wareLabel(it.kind)}.`);
          const newHero = h.with({ actor: updatedActor, pending: null, offer });
          return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
        }
        if (offer === it.id) {
          if (gold >= it.price) {
            gold -= it.price;
            items = items.filter((x) => x.id !== it.id);
            updatedActor = bumpStats(updatedActor, it.kind);
            updatedActor = updatedActor.with({ gesture: { kind: "power", at: newTime } });
            offer = null;
            log.push(`${h.name} buys ${wareLabel(it.kind)} for ${it.price} gold.`);
          } else {
            offer = null;
            log.push(`Not enough gold for ${wareLabel(it.kind)}: ${it.price} needed, the party has ${gold}.`);
            updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
          }
        } else {
          offer = it.id;
          log.push(`${h.name} looks at ${wareLabel(it.kind)}: ${it.price} gold. Bump it again to buy.`);
          updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
        }
        const newHero = h.with({ actor: updatedActor, pending: null, offer });
        return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
      }
    }
    let leverHit = null;
    for (const it of items) {
      if (it.kind === "lever" && it.pos.x === nx && it.pos.y === ny) { leverHit = it; break; }
    }
    if (leverHit) {
      let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy) });
      if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
      let golemMsg = `${h.name} pulls a lever.`;
      let monstersAfter = monstersList;
      if (!leverHit.pulled) {
        const pulledItem = itemShape.of({ id: leverHit.id, kind: leverHit.kind, pos: leverHit.pos, amount: leverHit.amount, price: leverHit.price, pulled: true, flung: leverHit.flung });
        items = items.map((x) => x.id === leverHit.id ? pulledItem : x);
        const golem = monstersAfter.find((mm) => mm.kind === "golem");
        if (golem) {
          const newAttack = Math.floor(golem.stats.attack / 2);
          const newDefense = Math.floor(golem.stats.defense / 2);
          const newMagic = Math.floor(golem.stats.magic / 2);
          let newSize = golem.size;
          let newSmall = golem.small;
          if (newSize === 3) newSize = 2;
          else if (newSize === 2) newSize = 1;
          else if (newSize === 1) newSmall = true;
          const golemStats = statsShape.of({ hp: golem.stats.hp, maxHp: golem.stats.maxHp, attack: newAttack, defense: newDefense, range: golem.stats.range, magic: newMagic, magicPower: golem.stats.magicPower, magicResist: 0 });
          const newGolem = golem.with({ stats: golemStats, size: newSize, small: newSmall });
          monstersAfter = monstersAfter.map((mm) => mm.id === golem.id ? newGolem : mm);
          golemMsg = `${h.name} pulls a lever. The golem weakens!`;
        }
      }
      updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
      log.push(golemMsg);
      const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
      return { hero: newHero, gold, items, monstersList: monstersAfter, log: log.slice(-50), grid: undefined, rng };
    }
    if (!gridOpen(world.grid, nx, ny) || stepCutCorner(world.grid, h.actor, dx, dy)) {
      let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("step"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: h.actor.last });
      if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
      if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
      const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
      return { hero: newHero, gold, items, monstersList, log, grid: undefined, rng };
    }
    let monsterHit = null;
    for (const m of monstersList) {
      if (m.covers(nx, ny)) { monsterHit = m; break; }
    }
    if (monsterHit) {
      const { rng: nrr, roll, ward } = combatDraw(rng);
      rng = nrr;
      const s = combat.resolve(h.actor.stats, monsterHit.stats, roll, ward);
      let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } });
      if (h.actor.slow > 0) {
        updatedActor = updatedActor.with({ slow: h.actor.slow - 1 });
      }
      if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
      const newHeld = Math.max(monsterHit.held || 0, newTime + 300);
      let newMonster = monsterHit.with({ held: newHeld });
      let monstersAfter = monstersList;
      let monsterLine = "";
      const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
      if (!s.hit) {
        monsterLine = `${h.name} misses the ${monsterHit.kind}.`;
        monstersAfter = monstersList.map((mm) => mm.id === monsterHit.id ? newMonster : mm);
      } else {
        let monsterLine = "";
        let monstersAfter = monstersList;
        let newMonsterFinal = newMonster;
        let splitSwarm = null;
        if (monsterHit.kind === "swarm" || monsterHit.kind === "enraged-swarm") {
          const nhpSwarm = monsterHit.stats.hp - 1;
          if (nhpSwarm <= 0) {
            monsterLine = `The ${monsterHit.kind} is slain.`;
            monstersAfter = monstersAfter.filter((mm) => mm.id !== monsterHit.id);
          } else {
            newMonsterFinal = newMonster.with({ stats: statsShape.of({ hp: nhpSwarm, maxHp: 3, attack: 4, defense: 0, range: 1, magic: 2, magicPower: 1, magicResist: 0 }) });
            monstersAfter = monstersAfter.map((mm) => mm.id === monsterHit.id ? newMonsterFinal : mm);
            monsterLine = s.critical ? `Critical! ${h.name} hits the ${monsterHit.kind} for 1.` : `${h.name} hits the ${monsterHit.kind} for 1.`;
            const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];
            for (const [dx, dy] of dirs) {
              const nx = monsterHit.pos.x + dx, ny = monsterHit.pos.y + dy;
              if (world.grid.open(nx, ny)) {
                let occupied = false;
                for (const mm of monstersAfter) { if (mm.covers(nx, ny)) { occupied = true; break; } }
                if (!occupied) {
                  splitSwarm = actorShape.of({ id: idCounter++, kind: "swarm", pos: pointShape.of(nx, ny), stats: statsShape.of({ hp: 1, maxHp: 3, attack: 4, defense: 0, range: 1, magic: 2, magicPower: 1, magicResist: 0 }), ready: newTime + 80, mode: "roam", size: 1 });
                  monstersAfter.push(splitSwarm);
                  break;
                }
              }
            }
          }
        } else {
          const nhp = monsterHit.stats.hp - s.damage;
          if (nhp <= 0) {
            monsterLine = `The ${monsterHit.kind} is slain.`;
            monstersAfter = monstersAfter.filter((mm) => mm.id !== monsterHit.id);
            if (isBoss(monsterHit.kind)) {
              const gd = golemDeath(world, monstersAfter, monsterHit, newTime, gold, log, rng);
              monstersAfter = gd.monsters;
              items = gd.items;
              return { hero: newHero, gold, items, monstersList: monstersAfter, log: log.slice(-50), grid: gd.grid, rng: gd.rng };
            }
          } else {
            if (monsterHit.kind === "wolf-man" && nhp * 2 <= monsterHit.stats.maxHp) {
              monsterLine = s.critical ? `Critical! ${h.name} hits the ${monsterHit.kind} for ${s.damage}.` : `${h.name} hits the ${monsterHit.kind} for ${s.damage}.`;
              log.push("The wolf-man is enraged!");
              const nstats = statsShape.of({ hp: nhp, maxHp: monsterHit.stats.maxHp, attack: monsterHit.stats.attack, defense: monsterHit.stats.defense, range: monsterHit.stats.range, magic: monsterHit.stats.magic, magicPower: monsterHit.stats.magicPower, magicResist: monsterHit.stats.magicResist });
              newMonsterFinal = newMonster.with({ stats: nstats, kind: "enraged-wolf-man" });
              monstersAfter = monstersAfter.map((mm) => mm.id === monsterHit.id ? newMonsterFinal : mm);
            } else {
              const nstats = statsShape.of({ hp: nhp, maxHp: monsterHit.stats.maxHp, attack: monsterHit.stats.attack, defense: monsterHit.stats.defense, range: monsterHit.stats.range, magic: monsterHit.stats.magic, magicPower: monsterHit.stats.magicPower, magicResist: monsterHit.stats.magicResist });
              newMonsterFinal = newMonster.with({ stats: nstats });
              monstersAfter = monstersAfter.map((mm) => mm.id === monsterHit.id ? newMonsterFinal : mm);
              monsterLine = s.critical ? `Critical! ${h.name} hits the ${monsterHit.kind} for ${s.damage}.` : `${h.name} hits the ${monsterHit.kind} for ${s.damage}.`;
            }
          }
        }
      }
      log.push(monsterLine);
      return { hero: newHero, gold, items, monstersList: monstersAfter, log: log.slice(-50), grid: undefined, rng };
    }
    let picked = null;
    for (const it of items) {
      if (it.pos.x === nx && it.pos.y === ny && !it.pulled && it.price === 0) { picked = it; break; }
    }
    if (picked) {
      if ((picked.kind.startsWith("sword") || picked.kind.startsWith("armor")) && wareTooHigh(h.actor.stats, picked.kind)) {
        const statName = picked.kind.startsWith("sword") ? "attack" : "defense";
        let updatedActor = h.actor.with({ pos: pointShape.of(nx, ny), ready: newTime + heroLatencyFn("step"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "move", dx, dy, at: newTime, reach: 1 } });
        if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
        if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
        log.push(`${h.name}: your ${statName} is too high for ${itemGradeName(picked.kind)}. Use it (e) to trade it for gold.`);
        const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
        return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
      }
      let updatedActor = h.actor;
      let msg = "";
      if (picked.kind === "gold") { gold += picked.amount; items = items.filter((x) => x.id !== picked.id); msg = `${h.name} picks up ${picked.amount} gold.`; }
      else if (picked.kind === "potion") {
        updatedActor = bumpStats(updatedActor, "potion");
        items = items.filter((x) => x.id !== picked.id);
        msg = `${h.name} drinks a potion (+5 max HP).`;
      }
      else if (picked.kind === "cheese" || picked.kind === "bread" || picked.kind === "meat") {
        updatedActor = bumpStats(updatedActor, picked.kind);
        items = items.filter((x) => x.id !== picked.id);
        const label = picked.kind === "cheese" ? "some cheese" : picked.kind;
        const healedAmt = updatedActor.stats.hp - h.actor.stats.hp;
        msg = `${h.name} eats ${label} (+${healedAmt} HP).`;
      }
      else if (picked.kind.startsWith("sword")) { updatedActor = bumpStats(updatedActor, picked.kind); items = items.filter((x) => x.id !== picked.id); msg = `${h.name} picks up ${itemGradeName(picked.kind)} (+1 attack).`; }
      else if (picked.kind.startsWith("armor")) { updatedActor = bumpStats(updatedActor, picked.kind); items = items.filter((x) => x.id !== picked.id); msg = `${h.name} puts on ${itemGradeName(picked.kind)} (+1 defense).`; }
      else if (picked.kind === "ring") { updatedActor = bumpStats(updatedActor, "ring"); items = items.filter((x) => x.id !== picked.id); msg = `${h.name} puts on a ring (+1 magic power).`; }
      else if (picked.kind === "necklace") { updatedActor = bumpStats(updatedActor, "necklace"); items = items.filter((x) => x.id !== picked.id); msg = `${h.name} puts on a cross necklace (+1 magic resist).`; }
      const powerGesture = picked.kind === "gold" ? null : { kind: "power", at: newTime };
      updatedActor = updatedActor.with({ pos: pointShape.of(nx, ny), ready: newTime + heroLatencyFn("step"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "move", dx, dy, at: newTime, reach: 1 }, gesture: powerGesture });
      if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
      if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
      log.push(msg);
      const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
      return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
    }
    let updatedActor = h.actor.with({ pos: pointShape.of(nx, ny), ready: newTime + heroLatencyFn("step"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "move", dx, dy, at: newTime, reach: 1 } });
    if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
    if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
    const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
    return { hero: newHero, gold, items, monstersList, log, grid: undefined, rng };
  } else if (intent.kind === "attack") {
    const dx = intent.dx, dy = intent.dy;
    const dir = (dx === 0 && dy === 0) ? h.actor.aim : { dx, dy };
    const r = h.actor.stats.range || 1;
    let reach = 1, monster = null, mk = 1;
    let wareHit = null, leverHit = null;
    for (let k = 1; k <= r; k++) {
      const x = h.actor.pos.x + dir.dx * k;
      const y = h.actor.pos.y + dir.dy * k;
      if (!gridOpen(world.grid, x, y)) break;
      if (k === 1 && stepCutCorner(world.grid, h.actor, dir.dx, dir.dy)) break;
      let found = null;
      for (const m of monstersList) {
        if (m.covers(x, y) && bestiary.hostile(h.actor.kind, m.kind)) { found = m; break; }
      }
      if (found) { monster = found; mk = k; break; }
      if (k === 1) {
        for (const it of items) {
          if (it.price > 0 && it.pos.x === x && it.pos.y === y) { wareHit = it; break; }
        }
        if (wareHit) break;
        for (const it of items) {
          if (it.kind === "lever" && it.pos.x === x && it.pos.y === y) { leverHit = it; break; }
        }
        if (leverHit) break;
      }
      reach = k;
    }
    reach = monster ? mk : 1;
    const aimDx = (dx === 0 && dy === 0) ? h.actor.aim.dx : dir.dx;
    const aimDy = (dx === 0 && dy === 0) ? h.actor.aim.dy : dir.dy;
    let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: (dx === 0 && dy === 0) ? h.actor.aim : { dx: aimDx, dy: aimDy }, facing: actorShape.facingFor(aimDx, aimDy) });
    if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
    if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
    if (wareHit) {
      const tooHigh = wareTooHigh(h.actor.stats, wareHit.kind);
      if (tooHigh) {
        const statName = wareHit.kind.startsWith("sword") ? "attack" : "defense";
        offer = null;
        updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
        log.push(`${h.name}: your ${statName} is too high for ${wareLabel(wareHit.kind)}.`);
        const newHero = h.with({ actor: updatedActor, pending: null, offer });
        return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
      }
      if (offer === wareHit.id) {
        if (gold >= wareHit.price) {
          gold -= wareHit.price;
          items = items.filter((x) => x.id !== wareHit.id);
          updatedActor = bumpStats(updatedActor, wareHit.kind);
          updatedActor = updatedActor.with({ gesture: { kind: "power", at: newTime } });
          offer = null;
          log.push(`${h.name} buys ${wareLabel(wareHit.kind)} for ${wareHit.price} gold.`);
        } else {
          offer = null;
          log.push(`Not enough gold for ${wareLabel(wareHit.kind)}: ${wareHit.price} needed, the party has ${gold}.`);
          updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
        }
      } else {
        offer = wareHit.id;
        log.push(`${h.name} looks at ${wareLabel(wareHit.kind)}: ${wareHit.price} gold. Bump it again to buy.`);
        updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
      }
      const newHero = h.with({ actor: updatedActor, pending: null, offer });
      return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
    }
    if (leverHit) {
      let monstersAfter = monstersList;
      let golemMsg = `${h.name} pulls a lever.`;
      if (!leverHit.pulled) {
        const pulledItem = itemShape.of({ id: leverHit.id, kind: leverHit.kind, pos: leverHit.pos, amount: leverHit.amount, price: leverHit.price, pulled: true, flung: leverHit.flung });
        items = items.map((x) => x.id === leverHit.id ? pulledItem : x);
        const golem = monstersAfter.find((mm) => mm.kind === "golem");
        if (golem) {
          const newAttack = Math.floor(golem.stats.attack / 2);
          const newDefense = Math.floor(golem.stats.defense / 2);
          const newMagic = Math.floor(golem.stats.magic / 2);
          let newSize = golem.size;
          let newSmall = golem.small;
          if (newSize === 3) newSize = 2;
          else if (newSize === 2) newSize = 1;
          else if (newSize === 1) newSmall = true;
          const golemStats = statsShape.of({ hp: golem.stats.hp, maxHp: golem.stats.maxHp, attack: newAttack, defense: newDefense, range: golem.stats.range, magic: newMagic, magicPower: golem.stats.magicPower, magicResist: 0 });
          const newGolem = golem.with({ stats: golemStats, size: newSize, small: newSmall });
          monstersAfter = monstersAfter.map((mm) => mm.id === golem.id ? newGolem : mm);
          golemMsg = `${h.name} pulls a lever. The golem weakens!`;
        }
        log.push(golemMsg);
        monstersList = monstersAfter;
      } else {
        log.push(`${h.name} pulls a lever.`);
      }
      updatedActor = updatedActor.with({ gesture: { kind: "use", at: newTime } });
      const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
      return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
    }
    updatedActor = updatedActor.with({ last: { kind: "attack", dx: aimDx, dy: aimDy, at: newTime, reach } });
    if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
    if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
    if (monster) {
      const newHeld = Math.max(monster.held || 0, newTime + 300);
      let newMonster = monster.with({ held: newHeld });
      let monstersAfter = monstersList;
      const { rng: nrr, roll, ward } = combatDraw(rng);
      rng = nrr;
      const s = combat.resolve(h.actor.stats, monster.stats, roll, ward);
      let monsterLine = "";
      const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
      if (!s.hit) {
        monsterLine = `${h.name} misses the ${monster.kind}.`;
        monstersAfter = monstersList.map((mm) => mm.id === monster.id ? newMonster : mm);
      } else {
        let monsterLine = "";
        let monstersAfter = monstersList;
        let newMonsterFinal = newMonster;
        if (monster.kind === "swarm" || monster.kind === "enraged-swarm") {
          const nhpSwarm = monster.stats.hp - 1;
          if (nhpSwarm <= 0) {
            monsterLine = `The ${monster.kind} is slain.`;
            monstersAfter = monstersAfter.filter((mm) => mm.id !== monster.id);
          } else {
            newMonsterFinal = newMonster.with({ stats: statsShape.of({ hp: nhpSwarm, maxHp: 3, attack: 4, defense: 0, range: 1, magic: 2, magicPower: 1, magicResist: 0 }) });
            monstersAfter = monstersAfter.map((mm) => mm.id === monster.id ? newMonsterFinal : mm);
            monsterLine = s.critical ? `Critical! ${h.name} hits the ${monster.kind} for 1.` : `${h.name} hits the ${monster.kind} for 1.`;
            const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];
            for (const [dx, dy] of dirs) {
              const nx = monster.pos.x + dx, ny = monster.pos.y + dy;
              if (world.grid.open(nx, ny)) {
                let occupied = false;
                for (const mm of monstersAfter) { if (mm.covers(nx, ny)) { occupied = true; break; } }
                if (!occupied) {
                  const splitSwarm = actorShape.of({ id: idCounter++, kind: "swarm", pos: pointShape.of(nx, ny), stats: statsShape.of({ hp: 1, maxHp: 3, attack: 4, defense: 0, range: 1, magic: 2, magicPower: 1, magicResist: 0 }), ready: newTime + 80, mode: "roam", size: 1 });
                  monstersAfter.push(splitSwarm);
                  break;
                }
              }
            }
          }
        } else {
          const nhp = monster.stats.hp - s.damage;
          if (nhp <= 0) {
            monsterLine = `The ${monster.kind} is slain.`;
            monstersAfter = monstersAfter.filter((mm) => mm.id !== monster.id);
            if (isBoss(monster.kind)) {
              const gd = golemDeath(world, monstersAfter, monster, newTime, gold, log, rng);
              monstersAfter = gd.monsters;
              items = gd.items;
              return { hero: newHero, gold, items, monstersList: monstersAfter, log: log.slice(-50), grid: gd.grid, rng: gd.rng };
            }
          } else {
            if (monster.kind === "wolf-man" && nhp * 2 <= monster.stats.maxHp) {
              monsterLine = s.critical ? `Critical! ${h.name} hits the ${monster.kind} for ${s.damage}.` : `${h.name} hits the ${monster.kind} for ${s.damage}.`;
              log.push("The wolf-man is enraged!");
              const nstats = statsShape.of({ hp: nhp, maxHp: monster.stats.maxHp, attack: monster.stats.attack, defense: monster.stats.defense, range: monster.stats.range, magic: monster.stats.magic, magicPower: monster.stats.magicPower, magicResist: monster.stats.magicResist });
              newMonsterFinal = newMonster.with({ stats: nstats, kind: "enraged-wolf-man" });
              monstersAfter = monstersAfter.map((mm) => mm.id === monster.id ? newMonsterFinal : mm);
            } else {
              const nstats = statsShape.of({ hp: nhp, maxHp: monster.stats.maxHp, attack: monster.stats.attack, defense: monster.stats.defense, range: monster.stats.range, magic: monster.stats.magic, magicPower: monster.stats.magicPower, magicResist: monster.stats.magicResist });
              newMonsterFinal = newMonster.with({ stats: nstats });
              monstersAfter = monstersAfter.map((mm) => mm.id === monster.id ? newMonsterFinal : mm);
              monsterLine = s.critical ? `Critical! ${h.name} hits the ${monster.kind} for ${s.damage}.` : `${h.name} hits the ${monster.kind} for ${s.damage}.`;
            }
          }
        }
      }
      log.push(monsterLine);
      monstersList = monstersAfter;
    }
    const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
    return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
  } else if (intent.kind === "use") {
    let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("use"), gesture: { kind: "use", at: newTime } });
    if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
    let traded = false;
    for (const it of items) {
      if (it.pos.x === h.actor.pos.x && it.pos.y === h.actor.pos.y && !it.pulled && it.price === 0 && (it.kind.startsWith("sword") || it.kind.startsWith("armor")) && wareTooHigh(h.actor.stats, it.kind)) {
        const { rng: nri, value: vi } = mulberryDraw(rng);
        rng = nri;
        const g = 1 + Math.floor(vi * 10);
        gold += g;
        items = items.filter((x) => x.id !== it.id);
        log.push(`${h.name} trades ${itemGradeName(it.kind)} for ${g} gold.`);
        traded = true;
        break;
      }
    }
    const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
    return { hero: newHero, gold, items, monstersList, log: log.slice(-50), grid: undefined, rng };
  } else if (intent.kind === "wait" || intent.kind === "descend") {
    let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("wait") });
    if (h.actor.haste > 0) { updatedActor = updatedActor.with({ haste: h.actor.haste - 1 }); }
    const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
    return { hero: newHero, gold, items, monstersList, log, grid: undefined, rng };
  }
  return { hero: h.with({ pending: null, offer: h.offer }), gold, items, monstersList, log, grid: undefined, rng };
}

function advance(world, ms) {
  if (!Number.isInteger(ms) || ms < 1 || ms > 1000) {
    throw new TypeError("rules.advance: ms must be an integer from 1 to 1000");
  }
  const newTime = world.time + ms;
  const eff = (world.effects || []).filter((e) => newTime - e.at <= 1000);

  if (world.state !== "playing") {
    return worldShape.of({ ...world, time: newTime, rng: world.rng, effects: eff });
  }

  let log = [...world.log];
  let gold = world.gold;
  let items = world.items;
  let monstersList = world.monsters;
  let heroes = world.heroes;
  let currentGrid = world.grid;
  let rng = world.rng;

  // 1. Heroes fire
  let updatedHeroes = [...heroes];
  let descendFired = false;
  for (let hi = 0; hi < updatedHeroes.length; hi++) {
    const h = updatedHeroes[hi];
    if (!h.alive) continue;
    if (h.actor.ready > newTime) continue;
    if (!h.pending) continue;
    const intent = h.pending;
    if (intent.kind === "descend") descendFired = true;
    if (h.actor.held > newTime) {
      if (intent.kind === "move") {
        const dx = intent.dx, dy = intent.dy;
        const nx = h.actor.pos.x + dx, ny = h.actor.pos.y + dy;
        let hitsMonster = false;
        for (const m of monstersList) { if (m.covers(nx, ny)) { hitsMonster = true; break; } }
        if (!hitsMonster) continue;
      }
    }
    const latFn = (type) => heroLatency(h.actor, type);
    const res = heroFiredAction(world, h, newTime, latFn, { gold, items, monstersList, log: log.slice(-50), rng });
    updatedHeroes[hi] = res.hero;
    gold = res.gold; items = res.items; monstersList = res.monstersList; log = res.log;
    if (res.rng !== undefined) rng = res.rng;
    if (res.grid) currentGrid = res.grid;
  }
  heroes = updatedHeroes;

  // 2. Monsters act
  const turn = Math.floor(newTime / 400);
  const monsterMap = new Map();
  for (const m of monstersList) monsterMap.set(m.id, m);

  for (const entry of monstersList) {
    // skip if removed before its turn
    if (!monsterMap.has(entry.id)) continue;
    const m = monsterMap.get(entry.id);
    if (m.ready > newTime) { monsterMap.set(entry.id, m); continue; }
    if (m.held > newTime) { monsterMap.set(entry.id, m.with({ ready: m.held })); continue; }
    let mode = m.mode;
    if (mode === "dormant") {
      let wake = false;
      for (const h of heroes) {
        if (!h.alive) continue;
        if (distanceLe(m, h.actor) <= 4) { wake = true; break; }
      }
      if (wake) {
        mode = "roam";
        log.push(`The ${m.kind} awakens!`);
      } else {
        monsterMap.set(entry.id, m.with({ ready: newTime + monsterLatency(m, "step"), mode }));
        continue;
      }
    }

    // Monster abilities: chant, summon, fuse
    if (m.kind === "cultist") {
      const step = bestiary.entry(m.kind).step;
      if (m.chant && m.chant.kind === "haste") {
        const allMonsters = [...monsterMap.values()];
        for (const mm of allMonsters) {
          if (distanceLe(m, mm) <= 5) { monsterMap.set(mm.id, mm.with({ haste: 3 })); }
        }
        const updatedM = m.with({ chant: null, ready: newTime + step, haste: 3 });
        monsterMap.set(m.id, updatedM);
        log.push("The cultist's chant quickens the monsters!");
        monsterMap.set(entry.id, monsterMap.get(m.id));
        monsterMap.get(entry.id).mode = mode;
        monsterMap.get(entry.id).pos = m.pos;
        monsterMap.get(entry.id).facing = m.facing;
        monsterMap.get(entry.id).last = m.last;
        monsterMap.get(entry.id).held = m.held;
        monsterMap.get(entry.id).small = m.small;
        acted = true; continue;
      }
      if (!m.chant) {
        const allMonsters = [...monsterMap.values()];
        let anotherMonsterWithin5 = false;
        let anyHastedWithin5 = false;
        for (const mm of allMonsters) {
          if (mm.id === m.id) continue;
          if (distanceLe(m, mm) <= 5) {
            anotherMonsterWithin5 = true;
            if ((mm.haste || 0) > 0) anyHastedWithin5 = true;
          }
        }
        let foeNextTo = false;
        for (const h of heroes) {
          if (h.alive && bestiary.hostile(m.kind, 'hero')) {
            if (distanceLe(m, h.actor) <= 1) { foeNextTo = true; break; }
          }
        }
        if (anotherMonsterWithin5 && !anyHastedWithin5 && !foeNextTo) {
          const until = newTime + 3 * step;
          const updatedM = m.with({ chant: { kind: 'haste', at: newTime, until }, ready: until });
          monsterMap.set(m.id, updatedM);
          log.push("The cultist begins to chant.");
          monsterMap.set(entry.id, monsterMap.get(m.id));
          monsterMap.get(entry.id).mode = mode;
          monsterMap.get(entry.id).pos = m.pos;
          monsterMap.get(entry.id).facing = m.facing;
          monsterMap.get(entry.id).last = m.last;
          monsterMap.get(entry.id).held = m.held;
          monsterMap.get(entry.id).small = m.small;
          acted = true; continue;
        }
      }
    } else if (m.kind === "scarecrow") {
      const step = bestiary.entry(m.kind).step;
      if (m.chant && m.chant.kind === "summon") {
        const swarmsWithin5 = [...monsterMap.values()].filter((mm) => mm.kind === "swarm" && distanceLe(m, mm) <= 5).length;
        if (swarmsWithin5 >= 3) {
          monsterMap.set(entry.id, m.with({ ready: newTime + step, mode }));
          acted = true; continue;
        }
        const swarmsPlaced = [...monsterMap.values()].filter((mm) => mm.kind === "swarm").length;
        const freeCells = [];
        for (let d = 0; d <= 2; d++) {
          for (let y = 0; y < currentGrid.height; y++) {
            for (let x = 0; x < currentGrid.width; x++) {
              const c = pointShape.of(x, y);
              if (distanceToSquare(m, c) === d) {
                if (currentGrid.open(x, y)) {
                  let occupied = false;
                  for (const mm of monsterMap.values()) { if (mm.covers(x, y)) { occupied = true; break; } }
                  for (const it of items) { if (it.pos.x === x && it.pos.y === y) { occupied = true; break; } }
                  if (!occupied) freeCells.push(c);
                }
              }
            }
          }
        }
        const toPlace = Math.min(3 - swarmsPlaced, freeCells.length);
        for (let i = 0; i < toPlace; i++) {
          const c = freeCells[i];
          const swarmId = idCounter++;
          const swarm = actorShape.of({ id: swarmId, kind: "swarm", pos: c, stats: statsShape.of({ hp: 3, maxHp: 3, attack: 4, defense: 0, range: 1, magic: 2, magicPower: 1, magicResist: 0 }), ready: newTime + 80, mode: "roam", size: 1 });
          monsterMap.set(swarmId, swarm);
          monstersList.push(swarm);
        }
        const updatedM = m.with({ chant: null, cooldown: newTime + 8 * step, ready: newTime + step });
        monsterMap.set(m.id, updatedM);
        log.push("The scarecrow calls a swarm!");
        monsterMap.set(entry.id, monsterMap.get(m.id));
        monsterMap.get(entry.id).mode = mode;
        monsterMap.get(entry.id).pos = m.pos;
        monsterMap.get(entry.id).facing = m.facing;
        monsterMap.get(entry.id).last = m.last;
        monsterMap.get(entry.id).held = m.held;
        monsterMap.get(entry.id).small = m.small;
        acted = true; continue;
      }
      if (!m.chant) {
        const cooldown = m.cooldown || 0;
        const swarmsWithin5 = [...monsterMap.values()].filter((mm) => mm.kind === "swarm" && distanceLe(m, mm) <= 5).length;
        let foeWithinReach = false;
        for (const h of heroes) {
          if (h.alive && bestiary.hostile(m.kind, 'hero')) {
            if (distanceLe(m, h.actor) <= bestiary.entry(m.kind).reach) { foeWithinReach = true; break; }
          }
        }
        if (newTime >= cooldown && foeWithinReach && swarmsWithin5 < 3) {
          const until = newTime + 5 * step;
          const updatedM = m.with({ chant: { kind: 'summon', at: newTime, until }, ready: until });
          monsterMap.set(m.id, updatedM);
          log.push("The scarecrow begins to chant.");
          monsterMap.set(entry.id, monsterMap.get(m.id));
          monsterMap.get(entry.id).mode = mode;
          monsterMap.get(entry.id).pos = m.pos;
          monsterMap.get(entry.id).facing = m.facing;
          monsterMap.get(entry.id).last = m.last;
          monsterMap.get(entry.id).held = m.held;
          monsterMap.get(entry.id).small = m.small;
          acted = true; continue;
        }
      }
      monsterMap.set(entry.id, m.with({ ready: newTime + step, mode }));
      acted = true; continue;
    } else if (m.kind === "pumpkin") {
      const step = bestiary.entry(m.kind).step;
      if (m.fuse) {
        if (newTime >= m.fuse.at + 6 * step) {
          // explode
          monsterMap.delete(m.id);
          monstersList = monstersList.filter((mm) => mm.id !== m.id);
          const blast = { kind: 'blast', x: m.pos.x, y: m.pos.y, size: m.size || 2, at: newTime };
          eff.push(blast);
          log.push("The pumpkin explodes!");
          const blastCells = cellsWithinSquare(m, 2);
          for (const h of heroes) {
            if (!h.alive) continue;
            let hit = false;
            for (const c of cellsCovered(h.actor)) { if (blastCells.some((bc) => bc.x === c.x && bc.y === c.y)) { hit = true; break; } }
            if (hit) {
              log.push(`The blast hits ${h.name} for 25.`);
              const nhp = h.actor.stats.hp - 25;
              if (nhp <= 0) { log.push(`${h.name} falls.`); heroes = heroes.map((hh) => hh.actor.id === h.actor.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: statsShape.of({ hp: 0, maxHp: hh.actor.stats.maxHp, attack: hh.actor.stats.attack, defense: hh.actor.stats.defense, range: hh.actor.stats.range, magic: hh.actor.stats.magic, magicPower: hh.actor.stats.magicPower, magicResist: hh.actor.stats.magicResist }), curse: hh.actor.curse }), pending: hh.pending, alive: false, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh); }
              else { heroes = heroes.map((hh) => hh.actor.id === h.actor.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: statsShape.of({ hp: nhp, maxHp: hh.actor.stats.maxHp, attack: hh.actor.stats.attack, defense: hh.actor.stats.defense, range: hh.actor.stats.range, magic: hh.actor.stats.magic, magicPower: hh.actor.stats.magicPower, magicResist: hh.actor.stats.magicResist }), curse: hh.actor.curse }), pending: hh.pending, alive: true, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh); }
            }
          }
          for (const mm of [...monsterMap.values()]) {
            let hit = false;
            for (const c of cellsCovered(mm)) { if (blastCells.some((bc) => bc.x === c.x && bc.y === c.y)) { hit = true; break; } }
            if (hit) {
              if (isBoss(mm.kind)) { log.push(`The blast hits the ${mm.kind} for 25.`); monsterMap.delete(mm.id); monstersList = monstersList.filter((x) => x.id !== mm.id); if (isBoss(mm.kind)) { const gd = golemDeath(world, monstersList, mm, newTime, gold, log, rng); monstersList = gd.monsters; items = gd.items; } }
              else if (mm.kind === "swarm") {
                const nhp = mm.stats.hp - 1;
                if (nhp <= 0) { log.push(`The ${mm.kind} is slain.`); monsterMap.delete(mm.id); monstersList = monstersList.filter((x) => x.id !== mm.id); }
                else { monsterMap.set(mm.id, mm.with({ stats: statsShape.of({ hp: nhp, maxHp: 3, attack: 4, defense: 0, range: 1, magic: 2, magicPower: 1, magicResist: 0 }) })); }
              } else {
                log.push(`The blast hits the ${mm.kind} for 25.`);
                const nhp = mm.stats.hp - 25;
                if (nhp <= 0) { monsterMap.delete(mm.id); monstersList = monstersList.filter((x) => x.id !== mm.id); }
                else { monsterMap.set(mm.id, mm.with({ stats: statsShape.of({ hp: nhp, maxHp: mm.stats.maxHp, attack: mm.stats.attack, defense: mm.stats.defense, range: mm.stats.range, magic: mm.stats.magic, magicPower: mm.stats.magicPower, magicResist: mm.stats.magicResist }) })); }
              }
            }
          }
          monsterMap.set(entry.id, m.with({ ready: newTime + step }));
          monsterMap.delete(entry.id);
          acted = true; continue;
        }
      } else {
        let foeWithin2 = false;
        for (const h of heroes) {
          if (h.alive) {
            for (const c of cellsCovered(h.actor)) { if (distanceToSquare(m, c) <= 2) { foeWithin2 = true; break; } }
            if (foeWithin2) break;
          }
        }
        if (!foeWithin2) {
          for (const mm of monsterMap.values()) {
            if (mm.id === m.id) continue;
            if (bestiary.hostile(m.kind, mm.kind)) {
              for (const c of cellsCovered(mm)) { if (distanceToSquare(m, c) <= 2) { foeWithin2 = true; break; } }
            }
            if (foeWithin2) break;
          }
        }
        if (foeWithin2) {
          const updatedM = m.with({ fuse: { at: newTime } });
          monsterMap.set(m.id, updatedM);
          log.push("The pumpkin's fuse is lit!");
          monsterMap.set(entry.id, monsterMap.get(m.id));
          monsterMap.get(entry.id).mode = mode;
          monsterMap.get(entry.id).pos = m.pos;
          monsterMap.get(entry.id).facing = m.facing;
          monsterMap.get(entry.id).last = m.last;
          monsterMap.get(entry.id).held = m.held;
          monsterMap.get(entry.id).small = m.small;
        }
      }
    }

    const foesCells = [];
    const threatsCells = [];
    const blockedCells = [];
    const blockedSet = new Set();
    for (const h of heroes) {
      if (h.alive && bestiary.hostile(m.kind, 'hero')) cellsCovered(h.actor).forEach((c) => foesCells.push(c));
    }
    for (const mm of monsterMap.values()) {
      if (mm.id === m.id) continue;
      cellsCovered(mm).forEach((c) => { blockedCells.push(c); blockedSet.add(`${c.x},${c.y}`); });
      if (bestiary.hostile(m.kind, mm.kind)) cellsCovered(mm).forEach((c) => foesCells.push(c));
    }
    for (const mm of monsterMap.values()) {
      if (mm.id === m.id) continue;
      if (bestiary.flees(m.kind, mm.kind)) cellsCovered(mm).forEach((c) => threatsCells.push(c));
    }
    for (const it of items) { if (it.price > 0 || it.kind === "lever") { const p = pointShape.of(it.pos.x, it.pos.y); blockedCells.push(p); blockedSet.add(`${p.x},${p.y}`); } }

    let decideMonster = m;
    if (m.mode === "dormant") decideMonster = m.with({ mode: "roam" });
    const decideIntent = monstersNode.decide(decideMonster, currentGrid, foesCells, threatsCells, blockedCells, turn);

    let acted = false;
    if (decideIntent.kind === "move") {
      const dx = decideIntent.dx, dy = decideIntent.dy;
      const movedCells = [];
      const size = m.size || 1;
      let free = true;
      for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) { const c = pointShape.of(m.pos.x + dx + i, m.pos.y + dy + j); movedCells.push(c); if (blockedSet.has(`${c.x},${c.y}`) || !currentGrid.open(c.x, c.y)) free = false; }
      const isDiag = dx !== 0 && dy !== 0;
      if (isDiag && (!currentGrid.open(m.pos.x + dx, m.pos.y) || !currentGrid.open(m.pos.x, m.pos.y + dy))) free = false;
      let meleeTarget = null;
      for (const h of heroes) {
        if (!h.alive) continue;
        for (const c of movedCells) if (h.actor.covers(c.x, c.y) && bestiary.hostile(m.kind, 'hero')) { meleeTarget = { type: 'hero', hero: h }; break; }
        if (meleeTarget) break;
      }
      if (!meleeTarget) {
        for (const mm of monsterMap.values()) {
          if (mm.id === m.id) continue;
          for (const c of movedCells) if (mm.covers(c.x, c.y) && bestiary.hostile(m.kind, mm.kind)) { meleeTarget = { type: 'monster', monster: mm }; break; }
          if (meleeTarget) break;
        }
      }
      if (meleeTarget) {
        if (isBoss(m.kind)) {
          const size = m.size || 1;
          const small = m.small || false;
          const sSize = small ? 1 : size;
          const depth = sSize === 3 ? 2 : 1;
          const blockCells = [];
          const isDiag = dx !== 0 && dy !== 0;
          if (isDiag) {
            for (let k = 1; k <= depth; k++) {
              for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                  const cx = m.pos.x + i + k * dx;
                  const cy = m.pos.y + j + k * dy;
                  if (cx >= m.pos.x && cx <= m.pos.x + size - 1 && cy >= m.pos.y && cy <= m.pos.y + size - 1) continue;
                  blockCells.push(pointShape.of(cx, cy));
                }
              }
            }
          } else {
            if (dx === 1) {
              for (let c = m.pos.x + size; c <= m.pos.x + size + depth - 1; c++) {
                for (let r = m.pos.y; r <= m.pos.y + size - 1; r++) blockCells.push(pointShape.of(c, r));
              }
            } else if (dx === -1) {
              for (let c = m.pos.x - depth; c <= m.pos.x - 1; c++) {
                for (let r = m.pos.y; r <= m.pos.y + size - 1; r++) blockCells.push(pointShape.of(c, r));
              }
            } else if (dy === 1) {
              for (let r = m.pos.y + size; r <= m.pos.y + size + depth - 1; r++) {
                for (let c = m.pos.x; c <= m.pos.x + size - 1; c++) blockCells.push(pointShape.of(c, r));
              }
            } else if (dy === -1) {
              for (let r = m.pos.y - depth; r <= m.pos.y - 1; r++) {
                for (let c = m.pos.x; c <= m.pos.x + size - 1; c++) blockCells.push(pointShape.of(c, r));
              }
            }
          }
          const struckHeroes = [];
          for (const h of heroes) {
            if (!h.alive) continue;
            let strikes = false;
            for (const bc of blockCells) { if (h.actor.covers(bc.x, bc.y)) { strikes = true; break; } }
            if (strikes) struckHeroes.push(h);
          }
          const struckMonsters = [];
          const struckMonsterIds = new Set();
          for (const mm of monsterMap.values()) {
            if (mm.id === m.id) continue;
            if (struckMonsterIds.has(mm.id)) continue;
            let strikes = false;
            for (const bc of blockCells) { if (mm.covers(bc.x, bc.y)) { strikes = true; break; } }
            if (strikes && bestiary.hostile(m.kind, mm.kind)) { struckMonsters.push(mm); struckMonsterIds.add(mm.id); }
          }
          for (const h of struckHeroes) {
            const target = h.actor;
            const { rng: nrr, roll, ward } = combatDraw(rng);
            rng = nrr;
            const s = combat.resolve(m.stats, target.stats, roll, ward);
            let monsterLine = "";
            const newHeld = Math.max(target.held || 0, newTime + 300);
            const isSlowed = s.hit && s.damage > 0 && isSlowingMonster(m.kind);
            if (!s.hit) {
              monsterLine = `The ${m.kind} misses ${h.name}.`;
              heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ held: newHeld }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
            } else {
              const nhp = target.stats.hp - s.damage;
              if (nhp <= 0) {
                monsterLine = `${h.name} falls.`;
                heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: statsShape.of({ hp: 0, maxHp: hh.actor.stats.maxHp, attack: hh.actor.stats.attack, defense: hh.actor.stats.defense, range: hh.actor.stats.range, magic: hh.actor.stats.magic, magicPower: hh.actor.stats.magicPower, magicResist: hh.actor.stats.magicResist }), held: newHeld }), pending: hh.pending, alive: false, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
              } else {
                monsterLine = s.critical ? `Critical! The ${m.kind} hits ${h.name} for ${s.damage}.` : `The ${m.kind} hits ${h.name} for ${s.damage}.`;
                const nstats = statsShape.of({ hp: nhp, maxHp: target.stats.maxHp, attack: target.stats.attack, defense: target.stats.defense, range: target.stats.range, magic: target.stats.magic, magicPower: target.stats.magicPower, magicResist: target.stats.magicResist });
                let curse = h.actor.curse;
                let newPos = target.pos;
                if (m.kind === "mummy") { curse = 3; log.push(`${h.name} is cursed!`); }
                let pushed = false;
                if (m.kind === "beetle") {
                  const size = target.size || 1;
                  const nx = target.pos.x + dx, ny = target.pos.y + dy;
                  let free = true;
                  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) { const c = pointShape.of(nx + i, ny + j); if (!currentGrid.open(c.x, c.y)) free = false; }
                  if (size > 1) pushed = false;
                  else { for (const mm of monsterMap.values()) { if (mm.id !== m.id && mm.covers(nx, ny)) { free = false; break; } } pushed = free; newPos = pushed ? pointShape.of(nx, ny) : target.pos; }
                }
                if (isSlowed) {
                  heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: nstats, held: newHeld, slow: 3, curse, pos: newPos }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
                } else {
                  heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: nstats, held: newHeld, curse, pos: newPos }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
                }
              }
            }
            log.push(monsterLine);
            if (isSlowed) log.push(`${h.name}: you are slowed!`);
          }
          for (const tm of struckMonsters) {
            const { rng: nrr, roll, ward } = combatDraw(rng);
            rng = nrr;
            const s = combat.resolve(m.stats, tm.stats, roll, ward);
            let monsterLine = "";
            const newHeld = Math.max(tm.held || 0, newTime + 300);
            if (!s.hit) {
              monsterLine = `The ${m.kind} misses the ${tm.kind}.`;
              const updatedTm = tm.with({ held: newHeld });
              monsterMap.set(tm.id, updatedTm);
            } else {
              const nhp = tm.stats.hp - s.damage;
              if (nhp <= 0) {
                monsterLine = s.critical ? `Critical! The ${m.kind} hits the ${tm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${tm.kind} for ${s.damage}.`;
                monsterMap.delete(tm.id);
              } else {
                monsterLine = s.critical ? `Critical! The ${m.kind} hits the ${tm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${tm.kind} for ${s.damage}.`;
                const nstats = statsShape.of({ hp: nhp, maxHp: tm.stats.maxHp, attack: tm.stats.attack, defense: tm.stats.defense, range: tm.stats.range, magic: tm.stats.magic, magicPower: tm.stats.magicPower, magicResist: tm.stats.magicResist });
                const updatedTm = tm.with({ stats: nstats, held: newHeld });
                monsterMap.set(tm.id, updatedTm);
              }
            }
            log.push(monsterLine);
          }
          let updatedM = m.with({ mode, ready: newTime + monsterLatency(m, "attack"), facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } });
          if (m.slow > 0) updatedM = updatedM.with({ slow: m.slow - 1 });
          if (m.haste > 0) updatedM = updatedM.with({ haste: m.haste - 1 });
          monsterMap.set(m.id, updatedM);
          acted = true; continue;
        } else {
          const target = meleeTarget.type === 'hero' ? meleeTarget.hero.actor : meleeTarget.monster;
          const { rng: nrr, roll, ward } = combatDraw(rng);
          rng = nrr;
          const s = combat.resolve(m.stats, target.stats, roll, ward);
          let monsterLine = "";
          let isSlowed = false;
          if (meleeTarget.type === 'hero') {
            isSlowed = s.hit && s.damage > 0 && isSlowingMonster(m.kind);
            const newHeld = Math.max(target.held || 0, newTime + 300);
            if (!s.hit) {
              monsterLine = `The ${m.kind} misses ${meleeTarget.hero.name}.`;
              heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ held: newHeld }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
            } else {
              const nhp = target.stats.hp - s.damage;
              if (nhp <= 0) {
                monsterLine = `${meleeTarget.hero.name} falls.`;
                heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: statsShape.of({ hp: 0, maxHp: hh.actor.stats.maxHp, attack: hh.actor.stats.attack, defense: hh.actor.stats.defense, range: hh.actor.stats.range, magic: hh.actor.stats.magic, magicPower: hh.actor.stats.magicPower, magicResist: hh.actor.stats.magicResist }), held: newHeld }), pending: hh.pending, alive: false, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
              } else {
                monsterLine = s.critical ? `Critical! The ${m.kind} hits ${meleeTarget.hero.name} for ${s.damage}.` : `The ${m.kind} hits ${meleeTarget.hero.name} for ${s.damage}.`;
                const nstats = statsShape.of({ hp: nhp, maxHp: target.stats.maxHp, attack: target.stats.attack, defense: target.stats.defense, range: target.stats.range, magic: target.stats.magic, magicPower: target.stats.magicPower, magicResist: target.stats.magicResist });
                if (isSlowed) {
                  heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: nstats, held: newHeld, slow: 3 }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
                } else {
                  heroes = heroes.map((hh) => hh.actor.id === target.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: nstats, held: newHeld }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
                }
              }
            }
          } else {
            const newHeld = Math.max(target.held || 0, newTime + 300);
            if (!s.hit) {
              monsterLine = `The ${m.kind} misses the ${target.kind}.`;
              const updatedTarget = target.with({ held: newHeld });
              monsterMap.set(target.id, updatedTarget);
            } else {
              const nhp = target.stats.hp - s.damage;
              if (nhp <= 0) {
                monsterLine = s.critical ? `Critical! The ${m.kind} hits the ${target.kind} for ${s.damage}.` : `The ${m.kind} hits the ${target.kind} for ${s.damage}.`;
                monsterMap.delete(target.id);
              } else {
                monsterLine = s.critical ? `Critical! The ${m.kind} hits the ${target.kind} for ${s.damage}.` : `The ${m.kind} hits the ${target.kind} for ${s.damage}.`;
                const nstats = statsShape.of({ hp: nhp, maxHp: target.stats.maxHp, attack: target.stats.attack, defense: target.stats.defense, range: target.stats.range, magic: target.stats.magic, magicPower: target.stats.magicPower, magicResist: target.stats.magicResist });
                const updatedTarget = target.with({ stats: nstats, held: newHeld });
                monsterMap.set(target.id, updatedTarget);
              }
            }
          }
          log.push(monsterLine);
          if (meleeTarget.type === 'hero' && isSlowed) log.push(`${meleeTarget.hero.name}: you are slowed!`);
          let updatedM = m.with({ mode, ready: newTime + monsterLatency(m, "attack"), facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } });
          if (m.slow > 0) updatedM = updatedM.with({ slow: m.slow - 1 });
          if (m.haste > 0) updatedM = updatedM.with({ haste: m.haste - 1 });
          monsterMap.set(m.id, updatedM);
          acted = true; continue;
        }
      }
      if (!free) { monsterMap.set(m.id, m); acted = true; continue; }
      const updatedM = m.with({ mode, pos: pointShape.of(m.pos.x + dx, m.pos.y + dy), ready: newTime + monsterLatency(m, "step"), facing: actorShape.facingFor(dx, dy), last: { kind: "move", dx, dy, at: newTime, reach: 1 } });
      if (m.haste > 0) updatedM = updatedM.with({ haste: m.haste - 1 });
      monsterMap.set(m.id, updatedM);
      acted = true; continue;
    } else if (decideIntent.kind === "attack") {
      const dx = decideIntent.dx, dy = decideIntent.dy;
      const r = m.stats.range || 1;
      let reach = 1, target = null, mk = 1;
      for (let k = 1; k <= r; k++) {
        const x = m.pos.x + dx * k, y = m.pos.y + dy * k;
        if (!currentGrid.open(x, y)) break;
        if (k === 1 && (dx !== 0 && dy !== 0 && (!currentGrid.open(m.pos.x + dx, m.pos.y) || !currentGrid.open(m.pos.x, m.pos.y + dy)))) break;
        let found = null;
        for (const h of heroes) {
          if (!h.alive) continue;
          if (h.actor.covers(x, y) && bestiary.hostile(m.kind, 'hero')) { found = { type: 'hero', hero: h }; break; }
        }
        if (found) { target = found; mk = k; break; }
        for (const mm of monsterMap.values()) {
          if (mm.id === m.id) continue;
          if (mm.covers(x, y) && bestiary.hostile(m.kind, mm.kind)) { found = { type: 'monster', monster: mm }; break; }
        }
        if (found) { target = found; mk = k; break; }
        reach = k;
      }
      reach = target ? mk : 1;
      if (!target) { monsterMap.set(m.id, m.with({ ready: newTime + monsterLatency(m, "step"), facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } })); if (m.haste > 0) monsterMap.get(m.id) = monsterMap.get(m.id).with({ haste: m.haste - 1 }); acted = true; continue; }
      const tStats = target.type === 'hero' ? target.hero.actor.stats : target.monster.stats;
      const { rng: nrr, roll, ward } = combatDraw(rng);
      rng = nrr;
      const s = combat.resolve(m.stats, tStats, roll, ward);
      let monsterLine = "";
      let isSlowed = false;
      if (target.type === 'hero') {
        const th = target.hero;
        const newHeld = Math.max(th.actor.held || 0, newTime + 300);
        isSlowed = s.hit && s.damage > 0 && isSlowingMonster(m.kind);
        if (!s.hit) {
          monsterLine = `The ${m.kind} misses ${th.name}.`;
          heroes = heroes.map((hh) => hh.actor.id === th.actor.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ held: newHeld }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
        } else {
          const nhp = th.actor.stats.hp - s.damage;
          if (nhp <= 0) {
            monsterLine = `${th.name} falls.`;
            heroes = heroes.map((hh) => hh.actor.id === th.actor.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: statsShape.of({ hp: 0, maxHp: hh.actor.stats.maxHp, attack: hh.actor.stats.attack, defense: hh.actor.stats.defense, range: hh.actor.stats.range, magic: hh.actor.stats.magic, magicPower: hh.actor.stats.magicPower, magicResist: hh.actor.stats.magicResist }), held: newHeld }), pending: hh.pending, alive: false, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
          } else {
            monsterLine = s.critical ? `Critical! The ${m.kind} hits ${th.name} for ${s.damage}.` : `The ${m.kind} hits ${th.name} for ${s.damage}.`;
            const nstats = statsShape.of({ hp: nhp, maxHp: th.actor.stats.maxHp, attack: th.actor.stats.attack, defense: th.actor.stats.defense, range: th.actor.stats.range, magic: th.actor.stats.magic, magicPower: th.actor.stats.magicPower, magicResist: th.actor.stats.magicResist });
            if (isSlowed) {
              heroes = heroes.map((hh) => hh.actor.id === th.actor.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: nstats, held: newHeld, slow: 3 }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
            } else {
              heroes = heroes.map((hh) => hh.actor.id === th.actor.id ? heroShape.of({ name: hh.name, actor: hh.actor.with({ stats: nstats, held: newHeld }), pending: hh.pending, alive: hh.alive, offer: hh.offer, colour: hh.colour, group: hh.group }) : hh);
            }
          }
        }
      } else {
        const tm = target.monster;
        const newHeld = Math.max(tm.held || 0, newTime + 300);
        if (!s.hit) {
          monsterLine = `The ${m.kind} misses the ${tm.kind}.`;
          const updatedTm = tm.with({ held: newHeld });
          monsterMap.set(tm.id, updatedTm);
        } else {
          const nhp = tm.stats.hp - s.damage;
          if (nhp <= 0) {
            monsterLine = s.critical ? `Critical! The ${m.kind} hits the ${tm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${tm.kind} for ${s.damage}.`;
            monsterMap.delete(tm.id);
          } else {
            monsterLine = s.critical ? `Critical! The ${m.kind} hits the ${tm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${tm.kind} for ${s.damage}.`;
            const nstats = statsShape.of({ hp: nhp, maxHp: tm.stats.maxHp, attack: tm.stats.attack, defense: tm.stats.defense, range: tm.stats.range, magic: tm.stats.magic, magicPower: tm.stats.magicPower, magicResist: tm.stats.magicResist });
            const updatedTm = tm.with({ stats: nstats, held: newHeld });
            monsterMap.set(tm.id, updatedTm);
          }
        }
      }
      log.push(monsterLine);
      if (target.type === 'hero' && isSlowed) log.push(`${target.hero.name}: you are slowed!`);
      let updatedM = m.with({ mode, ready: newTime + monsterLatency(m, "attack"), facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach } });
      if (m.slow > 0) updatedM = updatedM.with({ slow: m.slow - 1 });
      if (m.haste > 0) updatedM = updatedM.with({ haste: m.haste - 1 });
      monsterMap.set(m.id, updatedM);
      acted = true; continue;
    } else {
      monsterMap.set(m.id, m.with({ ready: newTime + monsterLatency(m, "step"), mode }));
      if (m.haste > 0) monsterMap.set(m.id, monsterMap.get(m.id).with({ haste: m.haste - 1 }));
      acted = true;
    }
    if (!acted) monsterMap.set(m.id, m);
  }
  monstersList = [...monsterMap.values()];

  // 3. Wipe
  const aliveHeroes = heroes.filter((h) => h.alive);
  if (aliveHeroes.length === 0 && heroes.length > 0) {
    const saved = fromSave(world.entry);
    const newLog = [...saved.log, `The party has fallen. ${levelShape.label(world.depth)} begins again.`].slice(-50);
    const finalVisible = computeVisible(saved.grid, saved.depth, []);
    const finalExplored = maskShape.union(saved.explored, finalVisible);
    return worldShape.of({ ...saved, time: newTime, gold, log: newLog, visible: finalVisible, explored: finalExplored, rng, effects: eff });
  }

  // 4. Stairs / descend
  let stairs = null;
  for (let y = 0; y < currentGrid.height; y++) for (let x = 0; x < currentGrid.width; x++) if (currentGrid.at(x, y) === "stairs") stairs = pointShape.of(x, y);
  let withinAfter = false;
  if (stairs && aliveHeroes.length > 0) {
    withinAfter = true;
    for (const hh of aliveHeroes) {
      let ok = false;
      const sz = hh.actor.size || 1;
      for (let i = 0; i < sz; i++) for (let j = 0; j < sz; j++) if (Math.max(Math.abs((hh.actor.pos.x + i) - stairs.x), Math.abs((hh.actor.pos.y + j) - stairs.y)) <= 5) ok = true;
      if (!ok) withinAfter = false;
    }
  }
  if (descendFired && withinAfter) {
    if (world.depth === 33) {
      log.push(`The party escapes the dungeon with ${gold} gold!`);
      const fv = computeVisible(currentGrid, world.depth, heroes.filter((h) => h.alive));
      const fe = maskShape.union(world.explored, fv);
      return worldShape.of({ ...world, time: newTime, heroes, monsters: monstersList, items, visible: fv, explored: fe, state: "won", log: log.slice(-50), gold, grid: currentGrid, rng, effects: eff });
    }
    const newDepth = world.depth + 1;
    const { plan, monsters: newMonsters, items: newItems, rng: newRng, grid: newGrid } = makeFloor(world.seed, newDepth, rng);
    const startList = startCells(plan);
    const newHeroes = [];
    for (const h of heroes) {
      let start = null;
      for (const sc of startList) {
        if (!newHeroes.some((nh) => `${nh.actor.pos.x},${nh.actor.pos.y}` === `${sc.x},${sc.y}`)) { start = sc; break; }
      }
      if (!start) start = startList[0];
      const wasAlive = h.alive;
      const hp = wasAlive ? Math.min(h.actor.stats.maxHp + 4, h.actor.stats.hp + 4) : 1;
      const maxHp = h.actor.stats.maxHp + 4;
      const stats = statsShape.of({ hp, maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range || 1, magic: h.actor.stats.magic, magicPower: h.actor.stats.magicPower, magicResist: h.actor.stats.magicResist });
      const actor = actorShape.of({ id: h.actor.id, kind: "hero", pos: start, stats, ready: newTime, slow: 0, held: 0, gesture: null });
      newHeroes.push(heroShape.of({ name: h.name, actor, pending: null, alive: true, offer: null, colour: h.colour, group: h.group }));
    }
    const visible = isShopDepth(newDepth) ? allTrueMask(newGrid.width, newGrid.height) : maskShape.empty(newGrid.width, newGrid.height);
    const explored = isShopDepth(newDepth) ? visible : maskShape.empty(newGrid.width, newGrid.height);
    const k = levelShape.kind(newDepth);
    if (k === "interior") { log.push("The party descends to a shop."); log.push("A shop! Bump a ware twice to buy it."); }
    else if (k === "boss") {
      log.push("The party descends into a lair.");
      const round = levelShape.round(newDepth);
      if (round === 2) log.push("A great serpent guards the way down!");
      else if (round === 3) log.push("A reaper guards the way down!");
      else log.push("A golem guards the way down. Pull the levers to weaken it!");
    }
    else { log.push(`The party descends to level ${levelShape.number(newDepth)}.`); }
    const finalVisible = computeVisible(newGrid, newDepth, newHeroes);
    const finalExplored = isShopDepth(newDepth) ? finalVisible : maskShape.union(explored, finalVisible);
    return worldShape.of({
      seed: world.seed, rng: newRng, depth: newDepth, time: newTime, state: "playing", grid: newGrid,
      heroes: newHeroes, monsters: newMonsters, items: newItems, visible: finalVisible, explored: finalExplored, gold,
      log: log.slice(-50), entry: saveShape.of({ seed: world.seed, depth: newDepth, players: newHeroes.map((nh) => ({ name: nh.name, stats: { hp: nh.actor.stats.hp, maxHp: nh.actor.stats.maxHp, attack: nh.actor.stats.attack, defense: nh.actor.stats.defense, range: nh.actor.stats.range, magic: nh.actor.stats.magic, magicPower: nh.actor.stats.magicPower, magicResist: nh.actor.stats.magicResist } })) }),
      effects: eff,
    });
  } else if (descendFired) {
    log.push("All party members must be within 5 units of the exit!");
  }

  // 5. Compute visible/explored
  const finalVisible = computeVisible(currentGrid, world.depth, aliveHeroes);
  const finalExplored = maskShape.union(world.explored, finalVisible);

  return worldShape.of({ ...world, time: newTime, heroes, monsters: monstersList, items, visible: finalVisible, explored: finalExplored, state: "playing", log: log.slice(-50), gold, grid: currentGrid, rng, effects: eff });
}

export { newGame, fromSave, toSave, join, intend, advance };
