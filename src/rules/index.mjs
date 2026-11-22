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

const HERO_START_STATS = { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1 };

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

function d20(rng) {
  const { rng: nr, value } = mulberryDraw(rng);
  return { rng: nr, roll: 1 + Math.floor(value * 20) };
}

function pick(rng, list) {
  const { rng: nr, value } = mulberryDraw(rng);
  return { rng: nr, item: list[Math.floor(value * list.length)] };
}

function isShopDepth(depth) {
  return levelShape.kind(depth) === "interior";
}

function isLairDepth(depth) {
  return levelShape.kind(depth) === "boss";
}

function wareLabel(kind) {
  if (kind === "potion") return "a potion";
  if (kind === "sword") return "a sword";
  if (kind === "armor") return "armor";
  return kind;
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

function startCells(plan) {
  const grid = plan.grid;
  const start = plan.start;
  const spotsSet = new Set(plan.spots.map((p) => `${p.x},${p.y}`));
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

function makeFloor(seed, depth, rngIn) {
  const plan = dungeon.generate(seed, depth);
  const spots = plan.spots;

  let rng = rngIn;
  const monsters = [];
  const items = [];
  let idCounter = 10;

  if (isLairDepth(depth)) {
    if (plan.boss) {
      const golemEntry = bestiary.entry("golem");
      monsters.push(
        actorShape.of({
          id: idCounter++,
          kind: "golem",
          pos: plan.boss,
          stats: statsShape.of({ hp: golemEntry.hp, maxHp: golemEntry.hp, attack: golemEntry.attack, defense: golemEntry.defense, range: golemEntry.range }),
          ready: 10000,
          mode: "dormant",
          size: 3,
          facing: "left",
          aim: { dx: -1, dy: 0 },
        })
      );
      for (const lp of (plan.levers || [])) {
        items.push(itemShape.of({ id: idCounter++, kind: "lever", pos: lp, amount: 0, price: 0, pulled: false }));
      }
      for (const sp of spots) {
        monsters.push(
          actorShape.of({
            id: idCounter++,
            kind: "slime",
            pos: sp,
            stats: statsShape.of({ hp: 6, maxHp: 6, attack: 2, defense: 1, range: 1 }),
            ready: 0,
            mode: "guard",
            size: 1,
          })
        );
      }
    }
    return { plan, monsters, items, rng };
  }

  if (isShopDepth(depth)) {
    const kinds = ["potion", "sword", "armor", "potion", "sword", "armor"];
    const round = levelShape.round(depth);
    for (let i = 0; i < 6; i++) {
      const kind = kinds[i];
      const cfg = kind === "potion" ? { base: 20, spread: 12 } : kind === "sword" ? { base: 30, spread: 6 } : { base: 40, spread: 6 };
      const { rng: nr, value } = mulberryDraw(rng);
      rng = nr;
      const spread = cfg.spread;
      const price = Math.round(cfg.base * Math.pow(1.25, round - 1)) - spread + Math.floor(value * (2 * spread + 1));
      items.push(itemShape.of({ id: idCounter++, kind, pos: spots[i], amount: 0, price, pulled: false }));
    }
    return { plan, monsters, items, rng };
  }

  const stage = levelShape.stage(depth);
  const tier = levelShape.tier(depth);
  const numMonsters = 2 + 2 * stage;

  let kindsList;
  let archerRare = false;
  if (tier === 0) {
    if (stage <= 3) kindsList = ["bat", "slime", "snake"];
    else { kindsList = ["bat", "slime", "snake", "skeleton"]; archerRare = true; }
  } else if (tier === 1) kindsList = ["blue-slime", "blue-snake", "skeleton"];
  else if (tier === 2) kindsList = ["beetle", "mummy", "cultist"];
  else if (tier === 3) kindsList = ["spider", "ghost", "reaper"];
  else if (tier === 4) kindsList = ["worm", "fire-slime", "imp", "demon"];

  for (let i = 0; i < numMonsters; i++) {
    let kind;
    if (archerRare) {
      const { rng: nr, value } = mulberryDraw(rng);
      rng = nr;
      if (value < 0.1) kind = "archer";
      else { const { rng: nr2, value: v2 } = mulberryDraw(rng); rng = nr2; kind = kindsList[Math.floor(v2 * kindsList.length)]; }
    } else {
      const { rng: nr, item: k } = pick(rng, kindsList);
      rng = nr;
      kind = k;
    }
    const pos = spots[i];
    const e = bestiary.entry(kind);
    monsters.push(
      actorShape.of({
        id: idCounter++,
        kind,
        pos,
        stats: statsShape.of({ hp: e.hp + Math.floor(e.hp * tier / 2), maxHp: e.hp + Math.floor(e.hp * tier / 2), attack: e.attack + tier, defense: e.defense + Math.floor(tier / 2), range: e.range }),
        ready: 0,
        mode: "roam",
        size: e.size,
      })
    );
  }

  const hasSword = stage === 2 || stage === 4;
  const hasArmor = stage === 3 || stage === 5;
  let spotIdx = numMonsters;
  for (let i = 0; i < 2; i++) {
    items.push(itemShape.of({ id: idCounter++, kind: "potion", pos: spots[spotIdx++], amount: 0, price: 0, pulled: false }));
  }
  for (let i = 0; i < 2; i++) {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    const d = Math.floor(value * 8);
    items.push(itemShape.of({ id: idCounter++, kind: "gold", pos: spots[spotIdx++], amount: levelShape.number(depth) * (3 + d), price: 0, pulled: false }));
  }
  if (hasSword) items.push(itemShape.of({ id: idCounter++, kind: "sword", pos: spots[spotIdx++], amount: 0, price: 0, pulled: false }));
  if (hasArmor) items.push(itemShape.of({ id: idCounter++, kind: "armor", pos: spots[spotIdx++], amount: 0, price: 0, pulled: false }));

  return { plan, monsters, items, rng };
}

function allTrueMask(width, height) {
  const cells = new Array(width * height).fill(true);
  return maskShape.of(width, height, cells);
}

function computeVisible(grid, depth, heroes) {
  if (isShopDepth(depth)) {
    return allTrueMask(grid.width, grid.height);
  }
  let visible = maskShape.empty(grid.width, grid.height);
  for (const h of heroes) {
    if (!h.alive) continue;
    const mv = fov.compute(grid, h.actor.pos, 7);
    visible = maskShape.union(visible, mv);
  }
  return visible;
}

function logForDepth(depth) {
  const k = levelShape.kind(depth);
  if (k === "interior") return "A shop! Bump a ware twice to buy it.";
  if (k === "boss") return "A lair! Golem is dormant. Guards guard.";
  return "Welcome to the dungeon. Find the stairs (>).";
}

function newGame(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new TypeError("rules.newGame: seed must be an integer from 0 to 4294967295");
  }
  const depth = 1;
  const { plan, monsters, items, rng } = makeFloor(seed, depth, seed);
  const startList = startCells(plan);
  const heroes = [];
  const visible = maskShape.empty(plan.grid.width, plan.grid.height);
  const explored = maskShape.empty(plan.grid.width, plan.grid.height);
  return worldShape.of({
    seed, rng, depth, time: 0, state: "playing", grid: plan.grid,
    heroes, monsters, items, visible, explored, gold: 0,
    log: [logForDepth(depth)],
    entry: saveShape.of({ seed, depth, players: [] }),
  });
}

function fromSave(save) {
  if (!(save instanceof saveShape.Save)) {
    throw new TypeError("rules.fromSave: save must be a save");
  }
  const seed = save.seed;
  const depth = save.depth;
  const { plan, monsters, items, rng } = makeFloor(seed, depth, seed);
  const startList = startCells(plan);
  const heroes = [];
  for (let i = 0; i < save.players.length; i++) {
    const p = save.players[i];
    const hp = p.stats.hp === 0 ? 1 : p.stats.hp;
    const stats = statsShape.of({ hp, maxHp: p.stats.maxHp, attack: p.stats.attack, defense: p.stats.defense, range: p.stats.range || 1 });
    const start = startList[i];
    const actor = actorShape.of({ id: i, kind: "hero", pos: start, stats, ready: 0 });
    heroes.push(heroShape.of({ name: p.name, actor, pending: null, alive: true, offer: null }));
  }
  const visible = isShopDepth(depth) ? allTrueMask(plan.grid.width, plan.grid.height) : maskShape.empty(plan.grid.width, plan.grid.height);
  const explored = isShopDepth(depth) ? visible : maskShape.empty(plan.grid.width, plan.grid.height);
  return worldShape.of({
    seed, rng, depth, time: 0, state: "playing", grid: plan.grid,
    heroes, monsters, items, visible, explored, gold: 0,
    log: [logForDepth(depth)],
    entry: save,
  });
}

function toSave(world) {
  const players = world.heroes.map((h) => ({
    name: h.name,
    stats: { hp: h.alive ? h.actor.stats.hp : 1, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range },
  }));
  return saveShape.of({ seed: world.seed, depth: world.depth, players });
}

function join(world, name) {
  if (!saveShape.isName(name)) {
    throw new TypeError("rules.join: name must be a valid name");
  }
  if (world.heroes.some((h) => h.name === name)) return world;
  if (world.heroes.length >= 4) return null;
  const plan = dungeon.generate(world.seed, world.depth);
  const startList = startCells(plan);
  let start = null;
  const usedCells = new Set(world.heroes.filter((h) => h.alive).map((h) => `${h.actor.pos.x},${h.actor.pos.y}`));
  for (const sc of startList) {
    if (!usedCells.has(`${sc.x},${sc.y}`)) { start = sc; break; }
  }
  if (!start) start = world.heroes[0].actor.pos;
  const stats = statsShape.of(HERO_START_STATS);
  let id = 0;
  const usedIds = new Set(world.heroes.map((h) => h.actor.id));
  while (usedIds.has(id)) id++;
  const actor = actorShape.of({ id, kind: "hero", pos: start, stats, ready: world.time });
  const hero = heroShape.of({ name, actor, pending: null, alive: true, offer: null });
  const newHeroes = [...world.heroes, hero];
  const newEntry = saveShape.of({ seed: world.seed, depth: world.depth, players: [...world.entry.players, { name, stats: { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1 } }] });
  const newHeroVisible = computeVisible(world.grid, world.depth, [hero]);
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
  if (intent.kind === "descend") {
    return processDescend(world);
  }
  if (intent.kind === "face") {
    const dx = intent.dx, dy = intent.dy;
    const facing = actorShape.facingFor(dx, dy);
    const actor = hero.actor.with({ aim: { dx, dy }, facing });
    const newHeroes = world.heroes.map((h) => h.name === name ? heroShape.of({ name: h.name, actor, pending: h.pending, alive: h.alive, offer: h.offer }) : h);
    return worldShape.of({ ...world, heroes: newHeroes });
  }
  const newHeroes = world.heroes.map((h) => h.name === name ? heroShape.of({ name: h.name, actor: h.actor, pending: intent, alive: h.alive, offer: h.offer }) : h);
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
  return lat;
}

function bumpStats(actor, kind) {
  if (kind === "potion") {
    const nhp = Math.min(actor.stats.maxHp, actor.stats.hp + 8);
    return actor.with({ stats: statsShape.of({ hp: nhp, maxHp: actor.stats.maxHp, attack: actor.stats.attack, defense: actor.stats.defense, range: actor.stats.range }) });
  }
  if (kind === "sword") {
    return actor.with({ stats: statsShape.of({ hp: actor.stats.hp, maxHp: actor.stats.maxHp, attack: actor.stats.attack + 2, defense: actor.stats.defense, range: actor.stats.range }) });
  }
  if (kind === "armor") {
    return actor.with({ stats: statsShape.of({ hp: actor.stats.hp, maxHp: actor.stats.maxHp, attack: actor.stats.attack, defense: actor.stats.defense + 1, range: actor.stats.range }) });
  }
  return actor;
}

function isSlowingMonster(kind) {
  const e = bestiary.entry(kind);
  return e ? e.slows : false;
}

function heroFiredAction(world, h, newTime, heroLatencyFn) {
  const intent = h.pending;
  let log = [...world.log];
  let gold = world.gold;
  let items = world.items;
  let monstersList = world.monsters;
  let offer = h.offer;

  if (intent.kind === "move") {
    const dx = intent.dx, dy = intent.dy;
    const nx = h.actor.pos.x + dx, ny = h.actor.pos.y + dy;
    for (const it of items) {
      if (it.price > 0 && it.pos.x === nx && it.pos.y === ny) {
        let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } });
        if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
        if (offer === it.id) {
          if (gold >= it.price) {
            gold -= it.price;
            items = items.filter((x) => x.id !== it.id);
            updatedActor = bumpStats(updatedActor, it.kind);
            offer = null;
            log.push(`${h.name} buys ${wareLabel(it.kind)} for ${it.price} gold.`);
          } else {
            offer = null;
            log.push(`Not enough gold for ${wareLabel(it.kind)}: ${it.price} needed, the party has ${gold}.`);
          }
        } else {
          offer = it.id;
          log.push(`${h.name} looks at ${wareLabel(it.kind)}: ${it.price} gold. Bump it again to buy.`);
        }
        const newHero = h.with({ actor: updatedActor, pending: null, offer });
        return { hero: newHero, world: { ...world, gold, items, log: log.slice(-50) } };
      }
    }
    for (const it of items) {
      if (it.kind === "lever" && !it.pulled && it.pos.x === nx && it.pos.y === ny) {
        let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } });
        if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
        const pulledItem = itemShape.of({ id: it.id, kind: it.kind, pos: it.pos, amount: it.amount, price: it.price, pulled: true, flung: it.flung });
        items = items.map((x) => x.id === it.id ? pulledItem : x);
        let golemMsg = `${h.name} pulls a lever.`;
        const golem = monstersList.find((mm) => mm.kind === "golem");
        if (golem) {
          const newAttack = Math.floor(golem.stats.attack / 2);
          const newDefense = Math.floor(golem.stats.defense / 2);
          let newSize = golem.size;
          let newSmall = golem.small;
          if (newSize === 3) newSize = 2;
          else if (newSize === 2) newSize = 1;
          else if (newSize === 1) newSmall = true;
          const golemStats = statsShape.of({ hp: golem.stats.hp, maxHp: golem.stats.maxHp, attack: newAttack, defense: newDefense, range: golem.stats.range });
          const newGolem = golem.with({ stats: golemStats, size: newSize, small: newSmall });
          monstersList = monstersList.map((mm) => mm.id === golem.id ? newGolem : mm);
          golemMsg = `${h.name} pulls a lever. The golem weakens!`;
        }
        log.push(golemMsg);
        const newHero = h.with({ actor: updatedActor, pending: null, offer: h.offer });
        return { hero: newHero, world: { ...world, gold, items, monsters: monstersList, log: log.slice(-50) } };
      }
    }
    if (!gridOpen(world.grid, nx, ny) || stepCutCorner(world.grid, h.actor, dx, dy)) {
      let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("step"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: h.actor.last });
      if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
      const newHero = h.with({ actor: updatedActor, pending: null, offer: h.offer });
      return { hero: newHero, world };
    }
    let monsterHit = null;
    for (const m of monstersList) {
      if (m.covers(nx, ny)) { monsterHit = m; break; }
    }
    if (monsterHit) {
      const { roll } = d20(world.rng);
      const s = combat.resolve(h.actor.stats, monsterHit.stats, Math.max(1, Math.min(20, roll)));
      let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } });
      if (isSlowingMonster(monsterHit.kind)) {
        updatedActor = updatedActor.with({ slow: 3 });
        log.push(`${h.name}: you are slowed!`);
      } else if (h.actor.slow > 0) {
        updatedActor = updatedActor.with({ slow: h.actor.slow - 1 });
      }
      const newHeld = Math.max(monsterHit.held || 0, newTime + 300);
      let newMonster = monsterHit.with({ held: newHeld });
      let monstersAfter = monstersList;
      let monsterLine = "";
      if (s.hit) {
        const nhp = monsterHit.stats.hp - s.damage;
        const crit = s.critical;
        if (nhp <= 0) {
          monsterLine = crit ? `Critical! The ${monsterHit.kind} is slain.` : `The ${monsterHit.kind} is slain.`;
          monstersAfter = monstersAfter.filter((mm) => mm.id !== monsterHit.id);
        } else {
          const nstats = statsShape.of({ hp: nhp, maxHp: monsterHit.stats.maxHp, attack: monsterHit.stats.attack, defense: monsterHit.stats.defense, range: monsterHit.stats.range });
          newMonster = newMonster.with({ stats: nstats });
          monstersAfter = monstersAfter.map((mm) => mm.id === monsterHit.id ? newMonster : mm);
          monsterLine = crit ? `Critical! ${h.name} hits the ${monsterHit.kind} for ${s.damage}.` : `${h.name} hits the ${monsterHit.kind} for ${s.damage}.`;
        }
      } else {
        monstersAfter = monstersAfter.map((mm) => mm.id === monsterHit.id ? newMonster : mm);
        monsterLine = `${h.name} misses the ${monsterHit.kind}.`;
      }
      monstersList = monstersAfter;
      log.push(monsterLine);
      const newHero = h.with({ actor: updatedActor, pending: null, offer: h.offer });
      return { hero: newHero, world: { ...world, monsters: monstersList, log: log.slice(-50) } };
    }
    let picked = null;
    for (const it of items) {
      if (it.pos.x === nx && it.pos.y === ny && !it.pulled && it.price === 0) { picked = it; break; }
    }
    if (picked) {
      let updatedActor = h.actor;
      let msg = "";
      let healed = 0;
      if (picked.kind === "gold") { gold += picked.amount; items = items.filter((x) => x.id !== picked.id); msg = `${h.name} picks up ${picked.amount} gold.`; }
      else if (picked.kind === "potion") {
        healed = Math.min(8, h.actor.stats.maxHp - h.actor.stats.hp);
        updatedActor = bumpStats(updatedActor, "potion");
        items = items.filter((x) => x.id !== picked.id);
        msg = `${h.name} drinks a potion (+${healed} HP).`;
      }
      else if (picked.kind === "sword") { updatedActor = bumpStats(updatedActor, "sword"); items = items.filter((x) => x.id !== picked.id); msg = `${h.name} picks up a sword (+2 attack).`; }
      else if (picked.kind === "armor") { updatedActor = bumpStats(updatedActor, "armor"); items = items.filter((x) => x.id !== picked.id); msg = `${h.name} puts on armor (+1 defense).`; }
      updatedActor = updatedActor.with({ pos: pointShape.of(nx, ny), ready: newTime + heroLatencyFn("step"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "move", dx, dy, at: newTime, reach: 1 } });
      if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
      log.push(msg);
      const newHero = h.with({ actor: updatedActor, pending: null, offer: h.offer });
      return { hero: newHero, world: { ...world, gold, items, log: log.slice(-50) } };
    }
    let updatedActor = h.actor.with({ pos: pointShape.of(nx, ny), ready: newTime + heroLatencyFn("step"), aim: { dx, dy }, facing: actorShape.facingFor(dx, dy), last: { kind: "move", dx, dy, at: newTime, reach: 1 } });
    if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
    const newHero = h.with({ actor: updatedActor, pending: null, offer: h.offer });
    return { hero: newHero, world };
  } else if (intent.kind === "attack") {
    const dx = intent.dx, dy = intent.dy;
    const dir = (dx === 0 && dy === 0) ? h.actor.aim : { dx, dy };
    const r = h.actor.stats.range || 1;
    let reach = 1, monster = null, mk = 1;
    for (let k = 1; k <= r; k++) {
      const x = h.actor.pos.x + dir.dx * k;
      const y = h.actor.pos.y + dir.dy * k;
      if (!gridOpen(world.grid, x, y)) break;
      if (k === 1 && stepCutCorner(world.grid, h.actor, dir.dx, dir.dy)) break;
      for (const m of monstersList) {
        if (m.covers(x, y) && bestiary.hostile(h.actor.kind, m.kind)) { monster = m; mk = k; break; }
      }
      if (monster) break;
      reach = k;
    }
    let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("attack"), aim: (dx === 0 && dy === 0) ? h.actor.aim : { dx: dir.dx, dy: dir.dy }, facing: actorShape.facingFor((dx === 0 && dy === 0) ? h.actor.aim.dx : dir.dx, (dx === 0 && dy === 0) ? h.actor.aim.dy : dir.dy), last: { kind: "attack", dx: (dx === 0 && dy === 0) ? h.actor.aim.dx : dir.dx, dy: (dx === 0 && dy === 0) ? h.actor.aim.dy : dir.dy, at: newTime, reach } });
    if (h.actor.slow > 0) { updatedActor = updatedActor.with({ slow: h.actor.slow - 1 }); }
    if (monster) {
      const newHeld = Math.max(monster.held || 0, newTime + 300);
      let newMonster = monster.with({ held: newHeld });
      let monstersAfter = monstersList;
      const { roll } = d20(world.rng);
      const s = combat.resolve(h.actor.stats, monster.stats, Math.max(1, Math.min(20, roll)));
      let monsterLine = "";
      if (s.hit) {
        const nhp = monster.stats.hp - s.damage;
        const crit = s.critical;
        if (nhp <= 0) {
          monsterLine = crit ? `Critical! The ${monster.kind} is slain.` : `The ${monster.kind} is slain.`;
          monstersAfter = monstersAfter.filter((mm) => mm.id !== monster.id);
        } else {
          const nstats = statsShape.of({ hp: nhp, maxHp: monster.stats.maxHp, attack: monster.stats.attack, defense: monster.stats.defense, range: monster.stats.range });
          newMonster = newMonster.with({ stats: nstats });
          monstersAfter = monstersAfter.map((mm) => mm.id === monster.id ? newMonster : mm);
          monsterLine = crit ? `Critical! ${h.name} hits the ${monster.kind} for ${s.damage}.` : `${h.name} hits the ${monster.kind} for ${s.damage}.`;
        }
      } else {
        monstersAfter = monstersAfter.map((mm) => mm.id === monster.id ? newMonster : mm);
        monsterLine = `${h.name} misses the ${monster.kind}.`;
      }
      monstersList = monstersAfter;
      log.push(monsterLine);
    }
    const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
    return { hero: newHero, world: { ...world, monsters: monstersList, log: log.slice(-50) } };
  } else if (intent.kind === "use") {
    let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("use") });
    const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
    return { hero: newHero, world };
  } else if (intent.kind === "wait") {
    let updatedActor = h.actor.with({ ready: newTime + heroLatencyFn("wait") });
    const newHero = h.with({ actor: updatedActor, pending: null, offer: null });
    return { hero: newHero, world };
  }
  return { hero: h.with({ pending: null, offer: h.offer }), world };
}

function processDescend(world) {
  let log = [...world.log];
  let stairs = null;
  for (let y = 0; y < world.grid.height; y++) for (let x = 0; x < world.grid.width; x++) if (world.grid.at(x, y) === "stairs") stairs = pointShape.of(x, y);
  let within = true;
  for (const hh of world.heroes) {
    if (!hh.alive) continue;
    let ok = false;
    const sz = hh.actor.size || 1;
    for (let i = 0; i < sz; i++) for (let j = 0; j < sz; j++) if (Math.max(Math.abs((hh.actor.pos.x + i) - stairs.x), Math.abs((hh.actor.pos.y + j) - stairs.y)) <= 5) ok = true;
    if (!ok) within = false;
  }
  if (!within) {
    log.push("All party members must be within 5 units of the exit!");
    return worldShape.of({ ...world, log: log.slice(-50) });
  }
  if (world.depth === 33) {
    log.push(`The party escapes the dungeon with ${world.gold} gold!`);
    return worldShape.of({ ...world, state: "won", log: log.slice(-50) });
  }
  const newDepth = world.depth + 1;
  const { plan, monsters, items, rng } = makeFloor(world.seed, newDepth, world.rng);
  const startList = startCells(plan);
  const newHeroes = [];
  for (const h of world.heroes) {
    let start = null;
    for (const sc of startList) {
      if (!world.heroes.some((hh) => hh !== h && `${hh.actor.pos.x},${hh.actor.pos.y}` === `${sc.x},${sc.y}`)) { start = sc; break; }
    }
    if (!start) start = world.heroes[0].actor.pos;
    const wasAlive = h.alive;
    const hp = wasAlive ? Math.min(h.actor.stats.maxHp + 4, h.actor.stats.hp + 4) : 1;
    const maxHp = h.actor.stats.maxHp + 4;
    const stats = statsShape.of({ hp, maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range || 1 });
    const actor = actorShape.of({ id: h.actor.id, kind: "hero", pos: start, stats, ready: 0 });
    newHeroes.push(heroShape.of({ name: h.name, actor, pending: null, alive: true, offer: null }));
  }
  const visible = isShopDepth(newDepth) ? allTrueMask(plan.grid.width, plan.grid.height) : maskShape.empty(plan.grid.width, plan.grid.height);
  const explored = isShopDepth(newDepth) ? visible : maskShape.empty(plan.grid.width, plan.grid.height);
  const k = levelShape.kind(newDepth);
  if (k === "interior") {
    log.push("The party descends to a shop.");
    log.push("A shop! Bump a ware twice to buy it.");
  } else if (k === "boss") {
    log.push("The party descends into a lair.");
    const golemPlan = dungeon.generate(world.seed, newDepth);
    if (golemPlan.boss) {
      log.push("A golem guards the way down. Pull the levers to weaken it!");
    }
  } else {
    log.push(`The party descends to level ${levelShape.number(newDepth)}.`);
  }
  return worldShape.of({
    seed: world.seed, rng, depth: newDepth, time: world.time, state: "playing", grid: plan.grid,
    heroes: newHeroes, monsters, items, visible, explored, gold: world.gold,
    log: log.slice(-50), entry: saveShape.of({ seed: world.seed, depth: newDepth, players: world.entry.players }),
  });
}

function findMeleeTarget(monster, movedCells, heroes, monstersList) {
  for (const h of heroes) {
    if (!h.alive) continue;
    for (const c of movedCells) {
      if (h.actor.covers(c.x, c.y) && bestiary.hostile(monster.kind, 'hero')) {
        return { type: 'hero', hero: h };
      }
    }
  }
  for (const mm of monstersList) {
    if (mm.id === monster.id) continue;
    for (const c of movedCells) {
      if (mm.covers(c.x, c.y) && bestiary.hostile(monster.kind, mm.kind)) {
        return { type: 'monster', monster: mm };
      }
    }
  }
  return null;
}

function advance(world, ms) {
  if (!Number.isInteger(ms) || ms < 1 || ms > 1000) {
    throw new TypeError("rules.advance: ms must be an integer from 1 to 1000");
  }
  const newTime = world.time + ms;

  if (world.state !== "playing") {
    return worldShape.of({ ...world, time: newTime });
  }

  let log = [...world.log];
  let gold = world.gold;
  let items = world.items;
  let monstersList = world.monsters;
  let heroes = world.heroes;

  // 1. Heroes fire
  let updatedHeroes = [...heroes];
  for (let hi = 0; hi < updatedHeroes.length; hi++) {
    const h = updatedHeroes[hi];
    if (!h.alive) continue;
    if (h.actor.ready > newTime) continue;
    if (h.actor.held > newTime) continue;
    if (!h.pending) continue;
    const latFn = (type) => heroLatency(h.actor, type);
    const res = heroFiredAction(world, h, newTime, latFn);
    updatedHeroes[hi] = res.hero;
    if (res.world.gold !== undefined) gold = res.world.gold;
    if (res.world.items) items = res.world.items;
    if (res.world.monsters) monstersList = res.world.monsters;
    if (res.world.log) log = res.world.log;
  }
  heroes = updatedHeroes;

  // 2. Monsters act
  let newMonsters = [];
  for (let mi = 0; mi < monstersList.length; mi++) {
    const m = monstersList[mi];
    if (m.ready > newTime) { newMonsters.push(m); continue; }
    if (m.held > newTime) { newMonsters.push(m.with({ ready: m.held })); continue; }
    const turn = Math.floor(newTime / 400);

    const foesCells = [];
    const threatsCells = [];
    const blockedCells = [];
    const blockedSet = new Set();
    for (const h of heroes) { if (h.alive) cellsCovered(h.actor).forEach((c) => foesCells.push(c)); }
    for (const mm of monstersList) { if (mm.id !== m.id) cellsCovered(mm).forEach((c) => { blockedCells.push(c); blockedSet.add(`${c.x},${c.y}`); }); }
    for (const it of items) { if (it.price > 0 || it.kind === "lever") { const p = pointShape.of(it.pos.x, it.pos.y); blockedCells.push(p); blockedSet.add(`${p.x},${p.y}`); } }

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
        newMonsters.push(m.with({ ready: newTime + bestiary.entry(m.kind).step, mode }));
        continue;
      }
    }

    if (mode === "guard") { newMonsters.push(m); continue; }

    const decideIntent = monstersNode.decide(m, world.grid, foesCells, threatsCells, blockedCells, turn);

    if (decideIntent && decideIntent.kind === "move") {
      const dx = decideIntent.dx, dy = decideIntent.dy;
      const size = m.size || 1;
      let free = true;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const nx = m.pos.x + dx + i, ny = m.pos.y + dy + j;
          if (!gridOpen(world.grid, nx, ny) || blockedSet.has(`${nx},${ny}`)) { free = false; break; }
        }
        if (!free) break;
      }
      if (dx !== 0 && dy !== 0) { if (!gridOpen(world.grid, m.pos.x + dx, m.pos.y) || !gridOpen(world.grid, m.pos.x, m.pos.y + dy)) free = false; }

      let meleeTarget = null;
      if (free) {
        const movedCells = [];
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            movedCells.push(pointShape.of(m.pos.x + dx + i, m.pos.y + dy + j));
          }
        }
        meleeTarget = findMeleeTarget(m, movedCells, heroes, monstersList);
      }

      if (meleeTarget) {
        const { roll } = d20(world.rng);
        const defenderStats = meleeTarget.type === 'hero' ? meleeTarget.hero.actor.stats : meleeTarget.monster.stats;
        const s = combat.resolve(m.stats, defenderStats, Math.max(1, Math.min(20, roll)));
        const newM = m.with({ ready: newTime + bestiary.entry(m.kind).strike, facing: actorShape.facingFor(dx, dy), last: { kind: "attack", dx, dy, at: newTime, reach: 1 } });
        if (meleeTarget.type === 'hero') {
          const h = meleeTarget.hero;
          const newHeld = Math.max(h.actor.held || 0, newTime + 300);
          let updatedHeroActor = h.actor.with({ held: newHeld });
          let monstersAfter = monstersList;
          let line = "";
          if (s.hit) {
            const nhp = h.actor.stats.hp - s.damage;
            const crit = s.critical;
            if (nhp <= 0) {
              line = crit ? `Critical! The ${m.kind} hits ${h.name} for ${s.damage}.` : `The ${m.kind} hits ${h.name} for ${s.damage}.`;
              updatedHeroActor = updatedHeroActor.with({ stats: statsShape.of({ hp: 0, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range }) });
              const newHeroesAfter = heroes.map((hh) => hh.name === h.name ? heroShape.of({ name: hh.name, actor: updatedHeroActor, pending: hh.pending, alive: false, offer: hh.offer }) : hh);
              heroes = newHeroesAfter;
              line += ` ${h.name} falls.`;
            } else {
              line = crit ? `Critical! The ${m.kind} hits ${h.name} for ${s.damage}.` : `The ${m.kind} hits ${h.name} for ${s.damage}.`;
              updatedHeroActor = updatedHeroActor.with({ stats: statsShape.of({ hp: nhp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range }) });
              const newHeroesAfter = heroes.map((hh) => hh.name === h.name ? heroShape.of({ name: hh.name, actor: updatedHeroActor, pending: hh.pending, alive: true, offer: hh.offer }) : hh);
              heroes = newHeroesAfter;
            }
          } else {
            line = `The ${m.kind} misses ${h.name}.`;
            const newHeroesAfter = heroes.map((hh) => hh.name === h.name ? heroShape.of({ name: hh.name, actor: updatedHeroActor, pending: hh.pending, alive: hh.alive, offer: hh.offer }) : hh);
            heroes = newHeroesAfter;
          }
          log.push(line);
        } else {
          const mm = meleeTarget.monster;
          const { roll2 } = { roll: Math.max(1, Math.min(20, roll)) };
          let monstersAfter = monstersList;
          let line = "";
          if (s.hit) {
            const nhp = mm.stats.hp - s.damage;
            const crit = s.critical;
            if (nhp <= 0) {
              line = crit ? `Critical! The ${m.kind} hits the ${mm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${mm.kind} for ${s.damage}.`;
              monstersAfter = monstersList.filter((x) => x.id !== mm.id);
            } else {
              line = crit ? `Critical! The ${m.kind} hits the ${mm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${mm.kind} for ${s.damage}.`;
              const nstats = statsShape.of({ hp: nhp, maxHp: mm.stats.maxHp, attack: mm.stats.attack, defense: mm.stats.defense, range: mm.stats.range });
              const newMm = mm.with({ stats: nstats });
              monstersAfter = monstersList.map((x) => x.id === mm.id ? newMm : x);
            }
          } else {
            line = `The ${m.kind} misses the ${mm.kind}.`;
          }
          monstersList = monstersAfter;
          log.push(line);
        }
        newMonsters.push(newM);
        continue;
      }

      if (free) {
        const newM = m.with({
          pos: pointShape.of(m.pos.x + dx, m.pos.y + dy),
          ready: newTime + (m.slow > 0 ? bestiary.entry(m.kind).step * 2 : bestiary.entry(m.kind).step),
          facing: actorShape.facingFor(dx, dy),
          last: { kind: "move", dx, dy, at: newTime, reach: 1 },
          slow: m.slow > 0 ? m.slow - 1 : m.slow,
          aim: { dx, dy }
        });
        newMonsters.push(newM);
      } else {
        const newM = m.with({ ready: newTime + bestiary.entry(m.kind).step });
        newMonsters.push(newM);
      }
    } else if (decideIntent && decideIntent.kind === "attack") {
      const dx = decideIntent.dx, dy = decideIntent.dy;
      const dir = (dx === 0 && dy === 0) ? m.aim : { dx, dy };
      const r = m.stats.range || 1;
      let reach = 1, target = null, tType = null, tRef = null;
      for (let k = 1; k <= r; k++) {
        const x = m.pos.x + dir.dx * k;
        const y = m.pos.y + dir.dy * k;
        if (!gridOpen(world.grid, x, y)) break;
        if (k === 1) {
          const sz = m.size || 1;
          const cut = (dir.dx !== 0 && dir.dy !== 0) && (!gridOpen(world.grid, m.pos.x + dir.dx, m.pos.y) || !gridOpen(world.grid, m.pos.x, m.pos.y + dir.dy));
          if (cut) break;
        }
        let found = null;
        for (const h of heroes) {
          if (!h.alive) continue;
          if (h.actor.covers(x, y) && bestiary.hostile(m.kind, 'hero')) { found = { type: 'hero', ref: h }; break; }
        }
        if (!found) {
          for (const mm of monstersList) {
            if (mm.id === m.id) continue;
            if (mm.covers(x, y) && bestiary.hostile(m.kind, mm.kind)) { found = { type: 'monster', ref: mm }; break; }
          }
        }
        if (found) { target = found; tType = found.type; tRef = found.ref; break; }
        reach = k;
      }
      const newM = m.with({ ready: newTime + bestiary.entry(m.kind).strike, facing: actorShape.facingFor((dx === 0 && dy === 0) ? m.aim.dx : dir.dx, (dx === 0 && dy === 0) ? m.aim.dy : dir.dy), last: { kind: "attack", dx: (dx === 0 && dy === 0) ? m.aim.dx : dir.dx, dy: (dx === 0 && dy === 0) ? m.aim.dy : dir.dy, at: newTime, reach }, aim: (dx === 0 && dy === 0) ? m.aim : { dx: dir.dx, dy: dir.dy } });
      newMonsters.push(newM);
      if (target) {
        const { roll } = d20(world.rng);
        const defenderStats = tType === 'hero' ? tRef.actor.stats : tRef.stats;
        const s = combat.resolve(m.stats, defenderStats, Math.max(1, Math.min(20, roll)));
        if (tType === 'hero') {
          const h = tRef;
          const newHeld = Math.max(h.actor.held || 0, newTime + 300);
          let updatedHeroActor = h.actor.with({ held: newHeld });
          let line = "";
          if (s.hit) {
            const nhp = h.actor.stats.hp - s.damage;
            const crit = s.critical;
            if (nhp <= 0) {
              line = crit ? `Critical! The ${m.kind} hits ${h.name} for ${s.damage}.` : `The ${m.kind} hits ${h.name} for ${s.damage}.`;
              updatedHeroActor = updatedHeroActor.with({ stats: statsShape.of({ hp: 0, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range }) });
              const newHeroesAfter = heroes.map((hh) => hh.name === h.name ? heroShape.of({ name: hh.name, actor: updatedHeroActor, pending: hh.pending, alive: false, offer: hh.offer }) : hh);
              heroes = newHeroesAfter;
              line += ` ${h.name} falls.`;
            } else {
              line = crit ? `Critical! The ${m.kind} hits ${h.name} for ${s.damage}.` : `The ${m.kind} hits ${h.name} for ${s.damage}.`;
              updatedHeroActor = updatedHeroActor.with({ stats: statsShape.of({ hp: nhp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense, range: h.actor.stats.range }) });
              const newHeroesAfter = heroes.map((hh) => hh.name === h.name ? heroShape.of({ name: hh.name, actor: updatedHeroActor, pending: hh.pending, alive: true, offer: hh.offer }) : hh);
              heroes = newHeroesAfter;
            }
          } else {
            line = `The ${m.kind} misses ${h.name}.`;
            const newHeroesAfter = heroes.map((hh) => hh.name === h.name ? heroShape.of({ name: hh.name, actor: updatedHeroActor, pending: hh.pending, alive: hh.alive, offer: hh.offer }) : hh);
            heroes = newHeroesAfter;
          }
          log.push(line);
        } else {
          const mm = tRef;
          let line = "";
          if (s.hit) {
            const nhp = mm.stats.hp - s.damage;
            const crit = s.critical;
            if (nhp <= 0) {
              line = crit ? `Critical! The ${m.kind} hits the ${mm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${mm.kind} for ${s.damage}.`;
              monstersList = monstersList.filter((x) => x.id !== mm.id);
            } else {
              line = crit ? `Critical! The ${m.kind} hits the ${mm.kind} for ${s.damage}.` : `The ${m.kind} hits the ${mm.kind} for ${s.damage}.`;
              const nstats = statsShape.of({ hp: nhp, maxHp: mm.stats.maxHp, attack: mm.stats.attack, defense: mm.stats.defense, range: mm.stats.range });
              const newMm = mm.with({ stats: nstats });
              monstersList = monstersList.map((x) => x.id === mm.id ? newMm : x);
            }
          } else {
            line = `The ${m.kind} misses the ${mm.kind}.`;
          }
          log.push(line);
        }
      }
    } else {
      const newM = m.with({ ready: newTime + bestiary.entry(m.kind).step });
      newMonsters.push(newM);
    }
  }
  monstersList = newMonsters;

  // 3. Wipe
  const aliveHeroes = heroes.filter((h) => h.alive);
  if (aliveHeroes.length === 0 && heroes.length > 0) {
    const saved = fromSave(world.entry);
    const newLog = [...saved.log, `The party has fallen. ${levelShape.label(world.depth)} begins again.`].slice(-50);
    const finalVisible = computeVisible(saved.grid, saved.depth, []);
    const finalExplored = maskShape.union(saved.explored, finalVisible);
    return worldShape.of({ ...saved, time: newTime, gold, log: newLog, visible: finalVisible, explored: finalExplored });
  }

  // 4. Compute visible/explored
  const finalVisible = computeVisible(world.grid, world.depth, aliveHeroes);
  const finalExplored = maskShape.union(world.explored, finalVisible);

  return worldShape.of({ ...world, time: newTime, heroes, monsters: monstersList, items, visible: finalVisible, explored: finalExplored, state: "playing", log: log.slice(-50), gold });
}

export { newGame, fromSave, toSave, join, intend, advance };
