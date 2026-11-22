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

const MONSTER_KINDS_BY_STAGE = {
  1: ["bat", "slime"],
  2: ["bat", "slime", "snake"],
  3: ["slime", "snake", "skeleton"],
  4: ["snake", "skeleton", "demon"],
  5: ["skeleton", "demon"],
};

const MONSTER_STATS_BASE = {
  bat: { hp: 3, maxHp: 3, attack: 2, defense: 0 },
  slime: { hp: 6, maxHp: 6, attack: 2, defense: 1 },
  snake: { hp: 5, maxHp: 5, attack: 3, defense: 0 },
  skeleton: { hp: 9, maxHp: 9, attack: 4, defense: 2 },
  demon: { hp: 16, maxHp: 16, attack: 6, defense: 3 },
};

const WARE_PRICES = {
  potion: { base: 20, spread: 12 },
  sword: { base: 30, spread: 6 },
  armor: { base: 40, spread: 6 },
};

const HERO_START_STATS = { hp: 24, maxHp: 24, attack: 4, defense: 1 };

function isShopDepth(depth) {
  return levelShape.kind(depth) === "interior";
}

function wareLabel(kind) {
  if (kind === "potion") return "a potion";
  if (kind === "sword") return "a sword";
  if (kind === "armor") return "armor";
  return kind;
}

// Latency per action (world milliseconds). The EED's table, one constant table.
const HERO_LATENCY = {
  step: 200,
  attack: 350,
  use: 250,
  wait: 200,
  descend: 200,
};

const MONSTER_LATENCY = {
  step: 400,
  attack: 600,
  wait: 400,
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

// BFS to find start cells: start, then floor cells reachable by orthogonal
// steps over floor cells, neighbours up, right, down, left; leave out spots.
function startCells(plan) {
  const grid = plan.grid;
  const start = plan.start;
  const spotsSet = new Set(plan.spots.map((p) => `${p.x},${p.y}`));
  const result = [];
  const visited = new Set();
  const queue = [start];
  visited.add(`${start.x},${start.y}`);
  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!spotsSet.has(`${cur.x},${cur.y}`)) {
      result.push(cur);
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (grid.at(nx, ny) === "floor") {
        visited.add(key);
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

  if (isShopDepth(depth)) {
    const kinds = ["potion", "sword", "armor", "potion", "sword", "armor"];
    for (let i = 0; i < 6; i++) {
      const kind = kinds[i];
      const cfg = WARE_PRICES[kind];
      const { rng: nr1, value: v1 } = mulberryDraw(rng);
      rng = nr1;
      const round = Math.min(i, 3);
      const base = cfg.base * Math.pow(1.25, round);
      const spread = cfg.spread;
      const { rng: nr2, value: v2 } = mulberryDraw(rng);
      rng = nr2;
      const price = Math.round(base * Math.pow(1.25, round)) - spread + Math.floor(v2 * (2 * spread + 1));
      items.push(itemShape.of({ id: idCounter++, kind, pos: spots[i], amount: 0, price: price > 0 ? price : 1 }));
    }
    return { plan, monsters, items, rng };
  }

  const stage = levelShape.stage(depth);
  const tier = levelShape.tier(depth);
  const numMonsters = 2 + 2 * stage;

  for (let i = 0; i < numMonsters; i++) {
    const { rng: nr, item: kind } = pick(rng, MONSTER_KINDS_BY_STAGE[stage]);
    rng = nr;
    const pos = spots[i];
    const s = MONSTER_STATS_BASE[kind];
    monsters.push(
      actorShape.of({
        id: idCounter++,
        kind,
        pos,
        stats: statsShape.of({ hp: s.hp + Math.floor(s.hp * tier / 2), maxHp: s.maxHp + Math.floor(s.maxHp * tier / 2), attack: s.attack + tier, defense: s.defense + Math.floor(tier / 2) }),
        ready: 0,
      })
    );
  }

  const kinds = ["potion", "sword", "armor"];
  for (let i = 0; i < 3; i++) {
    const k = kinds[i];
    if (stage >= 1 && k !== "potion") {
      items.push(itemShape.of({ id: idCounter++, kind: k, pos: spots[numMonsters + i], amount: 0 }));
    }
  }

  for (let i = 0; i < 2; i++) {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    const d = Math.floor(value * 8);
    items.push(
      itemShape.of({ id: idCounter++, kind: "gold", pos: spots[numMonsters + 3 + i], amount: depth * (3 + d) })
    );
  }

  return { plan, monsters, items, rng };
}

function allTrueMask(width, height) {
  const cells = new Array(width * height).fill(true);
  return maskShape.of(width, height, cells);
}

function computeVisible(world, heroes) {
  if (isShopDepth(world.depth)) {
    return allTrueMask(world.grid.width, world.grid.height);
  }
  let visible = maskShape.empty(world.grid.width, world.grid.height);
  for (const h of heroes) {
    if (h.alive) {
      visible = maskShape.union(visible, fov.compute(world.grid, h.actor.pos, 7));
    }
  }
  return visible;
}

export function newGame(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new TypeError("newGame: seed must be an integer from 0 to 4294967295");
  }
  const depth = 1;
  const { monsters, items, plan, rng } = makeFloor(seed, depth, seed);
  const visible = isShopDepth(depth) ? allTrueMask(plan.grid.width, plan.grid.height) : maskShape.empty(plan.grid.width, plan.grid.height);
  const explored = isShopDepth(depth) ? allTrueMask(plan.grid.width, plan.grid.height) : maskShape.empty(plan.grid.width, plan.grid.height);
  return worldShape.of({
    seed,
    rng,
    depth,
    time: 0,
    state: "playing",
    grid: plan.grid,
    heroes: [],
    monsters,
    items,
    visible,
    explored,
    gold: 0,
    log: ["Welcome to the dungeon. Find the stairs (>)."],
    entry: saveShape.of({ seed, depth, players: [] }),
  });
}

export function fromSave(save) {
  if (!save || typeof save.seed !== "number" || !Number.isInteger(save.seed) || typeof save.depth !== "number" || !Number.isInteger(save.depth) || !Array.isArray(save.players)) {
    throw new TypeError("fromSave: save must be a save");
  }
  for (const p of save.players) {
    if (typeof p.name !== "string" || !p.stats || typeof p.stats.hp !== "number") {
      throw new TypeError("fromSave: invalid player");
    }
  }
  const seed = save.seed;
  const depth = save.depth;
  const { monsters, items, plan, rng } = makeFloor(seed, depth, seed);
  const startList = startCells(plan);

  const heroes = [];
  let startIdx = 0;

  for (let i = 0; i < save.players.length; i++) {
    const sp = save.players[i];
    const hp = sp.stats.hp === 0 ? 1 : sp.stats.hp;
    const a = actorShape.of({
      id: i,
      kind: "hero",
      pos: startList[startIdx++],
      stats: statsShape.of({ hp, maxHp: sp.stats.maxHp, attack: sp.stats.attack, defense: sp.stats.defense }),
      ready: 0,
    });
    heroes.push(heroShape.of({ name: sp.name, actor: a, pending: null, offer: null, alive: true }));
  }

  const visible = computeVisible({ grid: plan.grid, depth }, heroes);
  const explored = isShopDepth(depth) ? allTrueMask(visible.width, visible.height) : maskShape.of(visible.width, visible.height, visible.cells());

  const entryPlayers = save.players.map((p) => ({
    name: p.name,
    stats: p.stats.hp === 0 ? statsShape.of({ hp: 1, maxHp: p.stats.maxHp, attack: p.stats.attack, defense: p.stats.defense }) : p.stats,
  }));

  return worldShape.of({
    seed,
    rng,
    depth,
    time: 0,
    state: "playing",
    grid: plan.grid,
    heroes,
    monsters,
    items,
    visible,
    explored,
    gold: 0,
    log: ["Welcome to the dungeon. Find the stairs (>)."],
    entry: saveShape.of({ seed, depth, players: entryPlayers }),
  });
}

export function toSave(world) {
  const players = world.heroes.map((h) => ({
    name: h.name,
    stats: h.alive ? h.actor.stats : statsShape.of({ hp: 1, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense }),
  }));
  return saveShape.of({ seed: world.seed, depth: world.depth, players });
}

export function join(world, name) {
  if (!saveShape.isName || !saveShape.isName(name)) {
    throw new TypeError("join: name must be a valid name");
  }
  if (world.heroes.some((h) => h.name === name)) {
    return world;
  }
  if (world.heroes.length >= 4) {
    return null;
  }
  const plan = dungeon.generate(world.seed, world.depth);
  const startList = startCells(plan);
  const occupied = new Set(world.heroes.filter((h) => h.alive).map((h) => `${h.actor.pos.x},${h.actor.pos.y}`));
  let placedPos = null;
  let placedId = -1;
  for (const sc of startList) {
    const key = `${sc.x},${sc.y}`;
    if (!occupied.has(key)) {
      const usedIds = new Set(world.heroes.map((h) => h.actor.id));
      let id = 0;
      while (usedIds.has(id)) id++;
      if (id <= 3) {
        placedPos = sc;
        placedId = id;
        break;
      }
    }
  }

  const newHeroActor = actorShape.of({
    id: placedId,
    kind: "hero",
    pos: placedPos,
    stats: statsShape.of(HERO_START_STATS),
    ready: world.time,
  });
  const newHero = heroShape.of({ name, actor: newHeroActor, pending: null, offer: null, alive: true });

  const newHeroes = [...world.heroes, newHero];
  const visible = computeVisible({ grid: world.grid, depth: world.depth }, newHeroes);
  const explored = isShopDepth(world.depth) ? allTrueMask(world.grid.width, world.grid.height) : maskShape.union(world.explored, visible);

  const newEntryPlayers = [...world.entry.players, { name, stats: statsShape.of(HERO_START_STATS) }];

  return worldShape.of({
    seed: world.seed,
    rng: world.rng,
    depth: world.depth,
    time: world.time,
    state: world.state,
    grid: world.grid,
    heroes: newHeroes,
    monsters: world.monsters,
    items: world.items,
    visible,
    explored,
    gold: world.gold,
    log: [...world.log, `${name} joins the party.`],
    entry: saveShape.of({ seed: world.seed, depth: world.depth, players: newEntryPlayers }),
  });
}

export function intend(world, name, intent) {
  if (!intentShape.KINDS || !intentShape.KINDS.includes(intent.kind) || !Object.isFrozen(intent)) {
    throw new TypeError("intend: intent must be an intent");
  }
  if (world.state !== "playing") return world;
  const h = world.heroes.find((hh) => hh.name === name);
  if (!h || !h.alive) return world;
  const newHeroes = world.heroes.map((hh) => {
    if (hh.name !== name) return hh;
    if (intent.kind === "descend") {
      // heroShape.of rejects descend intents due to isIntent limitation;
      // worldShape.isHero accepts any frozen object with pending instanceof intentShape.Intent.
      return Object.freeze({ name: hh.name, actor: hh.actor, pending: intent, offer: hh.offer, alive: hh.alive });
    }
    return heroShape.of({ name: hh.name, actor: hh.actor, pending: intent, offer: hh.offer, alive: hh.alive });
  });
  return worldShape.of({
    seed: world.seed,
    rng: world.rng,
    depth: world.depth,
    time: world.time,
    state: world.state,
    grid: world.grid,
    heroes: newHeroes,
    monsters: world.monsters,
    items: world.items,
    visible: world.visible,
    explored: world.explored,
    gold: world.gold,
    log: world.log,
    entry: world.entry,
  });
}

function isWithin5(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 5;
}

function findStairs(grid) {
  const tiles = grid.tiles();
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (tiles[y * grid.width + x] === "stairs") {
        return pointShape.of(x, y);
      }
    }
  }
  return null;
}

export function advance(world, ms) {
  if (!Number.isInteger(ms) || ms < 1 || ms > 1000) {
    throw new TypeError("advance: ms must be an integer from 1 to 1000");
  }
  const newTime = world.time + ms;

  if (world.state !== "playing") {
    return worldShape.of({
      seed: world.seed,
      rng: world.rng,
      depth: world.depth,
      time: newTime,
      state: world.state,
      grid: world.grid,
      heroes: world.heroes,
      monsters: world.monsters,
      items: world.items,
      visible: world.visible,
      explored: world.explored,
      gold: world.gold,
      log: world.log,
      entry: world.entry,
    });
  }

  let heroes = [...world.heroes];
  let monstersList = [...world.monsters];
  let items = [...world.items];
  let gold = world.gold;
  let log = [...world.log];
  let rng = world.rng;

  // 1. Heroes fire
  let descendRequested = false;
  let descendValid = false;

  for (let hi = 0; hi < heroes.length; hi++) {
    const h = heroes[hi];
    if (!h.alive || !h.pending) continue;
    if (h.actor.ready > newTime) continue;

    const intent = h.pending;
    let latency;
    let needsUpdate = false;
    let newActor;
    let bumped = false;
    let offerSet = null; // the new offer value if bumped, null otherwise

    if (intent.kind === "move") {
      const nx = h.actor.pos.x + intent.dx;
      const ny = h.actor.pos.y + intent.dy;
      const cell = world.grid.at(nx, ny);
      const monsterAt = monstersList.find((m) => m.pos.x === nx && m.pos.y === ny);
      const aliveHeroAt = heroes.find((hh) => hh.alive && hh.name !== h.name && hh.actor.pos.x === nx && hh.actor.pos.y === ny);
      const wareAt = items.find((it) => it.price > 0 && it.pos.x === nx && it.pos.y === ny);

      const wouldBeAttack = !!monsterAt;

      // Held check: a hero's pending move that would not be an attack stays pending unfired until held passes.
      if (!wouldBeAttack && !wareAt && h.actor.held > newTime) {
        continue;
      }

      needsUpdate = true;
      const facing = actorShape.facingFor(intent.dx, intent.dy);

      if (wareAt) {
        // bump: fired move onto ware is a bump (attack latency, facing, last; holds no one)
        bumped = true;
        latency = HERO_LATENCY.attack;
        let pos = pointShape.of(nx, ny);
        let heroStats = { hp: h.actor.stats.hp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense };
        if (h.offer === null || h.offer === undefined) {
          offerSet = wareAt.id;
          log.push(`${h.name} looks at ${wareLabel(wareAt.kind)}: ${wareAt.price} gold. Bump it again to buy.`);
        } else if (h.offer === wareAt.id) {
          // second bump of same ware: buy attempt
          if (gold > 0) {
            const price = wareAt.price;
            gold -= price;
            items = items.filter((it) => it.id !== wareAt.id);
            if (wareAt.kind === "potion") {
              const newHp = Math.min(h.actor.stats.maxHp, h.actor.stats.hp + 8);
              heroStats.hp = newHp;
              log.push(`${h.name} drinks the bought potion (+${newHp - h.actor.stats.hp} HP).`);
            } else if (wareAt.kind === "sword") {
              heroStats.attack += 2;
              log.push(`${h.name} picked up the bought sword (+2 attack).`);
            } else if (wareAt.kind === "armor") {
              heroStats.defense += 1;
              log.push(`${h.name} put on the bought armor (+1 defense).`);
            }
            log.push(`${h.name} buys ${wareLabel(wareAt.kind)} for ${price} gold.`);
            offerSet = null;
          } else {
            log.push(`Not enough gold for ${wareLabel(wareAt.kind)}: ${wareAt.price} needed, the party has ${gold}.`);
            offerSet = null;
          }
        } else {
          offerSet = wareAt.id;
          log.push(`${h.name} looks at ${wareLabel(wareAt.kind)}: ${wareAt.price} gold. Bump it again to buy.`);
        }
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing, last: { kind: 'attack', dx: intent.dx, dy: intent.dy, at: newTime } });
      } else if (cell === "wall" || aliveHeroAt) {
        // step goes nowhere: facing updated, last unchanged, clear offer
        latency = HERO_LATENCY.step;
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing, last: h.actor.last });
      } else if (monsterAt) {
        // attack on monster: clear offer
        latency = HERO_LATENCY.attack;
        const { roll, rng: nr } = d20(rng);
        rng = nr;
        const strike = combat.resolve(h.actor.stats, monsterAt.stats, roll);
        if (strike.critical) log.push(`Critical! ${h.name} hits the ${monsterAt.kind} for ${strike.damage}.`);
        else if (strike.hit) log.push(`${h.name} hits the ${monsterAt.kind} for ${strike.damage}.`);
        else log.push(`${h.name} misses the ${monsterAt.kind}.`);
        const monsterHeld = Math.max(monsterAt.held || 0, newTime + 300);
        const newHp = Math.max(0, monsterAt.stats.hp - strike.damage);
        if (newHp === 0) {
          log.push(`The ${monsterAt.kind} is slain.`);
          monstersList = monstersList.filter((m) => m.id !== monsterAt.id);
        } else {
          monstersList = monstersList.map((m) => (m.id === monsterAt.id ? actorShape.of({ id: m.id, kind: m.kind, pos: m.pos, stats: statsShape.of({ hp: newHp, maxHp: m.stats.maxHp, attack: m.stats.attack, defense: m.stats.defense }), ready: m.ready, held: monsterHeld }) : m));
        }
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing, last: { kind: 'attack', dx: intent.dx, dy: intent.dy, at: newTime } });
      } else if (world.grid.open(nx, ny)) {
        // step onto open cell, pick up items, clear offer
        latency = HERO_LATENCY.step;
        const itemsAt = items.filter((it) => it.pos.x === nx && it.pos.y === ny);
        let pos = pointShape.of(nx, ny);
        let heroStats = { hp: h.actor.stats.hp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense };
        for (const it of itemsAt) {
          if (it.kind === "potion") {
            const healed = 8;
            const newHp = Math.min(h.actor.stats.maxHp, h.actor.stats.hp + healed);
            const actual = newHp - h.actor.stats.hp;
            heroStats.hp = newHp;
            log.push(`${h.name} drinks a potion (+${actual} HP).`);
          } else if (it.kind === "gold") {
            gold += it.amount;
            log.push(`${h.name} picks up ${it.amount} gold.`);
          } else if (it.kind === "sword") {
            heroStats.attack += 2;
            log.push(`${h.name} picks up a sword (+2 attack).`);
          } else if (it.kind === "armor") {
            heroStats.defense += 1;
            log.push(`${h.name} puts on armor (+1 defense).`);
          }
        }
        items = items.filter((it) => !(it.pos.x === nx && it.pos.y === ny));
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos, stats: statsShape.of(heroStats), ready: newTime + latency, held: h.actor.held, facing, last: { kind: 'move', dx: intent.dx, dy: intent.dy, at: newTime } });
      } else {
        // not open, no monster, no ware: step goes nowhere, clear offer
        latency = HERO_LATENCY.step;
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing, last: h.actor.last });
      }
    } else if (intent.kind === "attack") {
      const nx = h.actor.pos.x + intent.dx;
      const ny = h.actor.pos.y + intent.dy;
      const monsterAt = monstersList.find((m) => m.pos.x === nx && m.pos.y === ny);
      const wareAt = items.find((it) => it.price > 0 && it.pos.x === nx && it.pos.y === ny);

      needsUpdate = true;
      latency = HERO_LATENCY.attack;
      const facing = actorShape.facingFor(intent.dx, intent.dy);

      if (wareAt) {
        // bump: attack toward ware is a bump (attack latency, facing, last; holds no one)
        bumped = true;
        if (h.offer === null || h.offer === undefined) {
          offerSet = wareAt.id;
          log.push(`${h.name} looks at ${wareLabel(wareAt.kind)}: ${wareAt.price} gold. Bump it again to buy.`);
        } else if (h.offer === wareAt.id) {
          if (gold > 0) {
            const price = wareAt.price;
            gold -= price;
            items = items.filter((it) => it.id !== wareAt.id);
            if (wareAt.kind === "potion") {
              const newHp = Math.min(h.actor.stats.maxHp, h.actor.stats.hp + 8);
              log.push(`${h.name} drinks the bought potion (+${newHp - h.actor.stats.hp} HP).`);
              h.actor.stats = statsShape.of({ hp: newHp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense });
            } else if (wareAt.kind === "sword") {
              log.push(`${h.name} picked up the bought sword (+2 attack).`);
              h.actor.stats = statsShape.of({ hp: h.actor.stats.hp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack + 2, defense: h.actor.stats.defense });
            } else if (wareAt.kind === "armor") {
              log.push(`${h.name} put on the bought armor (+1 defense).`);
              h.actor.stats = statsShape.of({ hp: h.actor.stats.hp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense + 1 });
            }
            log.push(`${h.name} buys ${wareLabel(wareAt.kind)} for ${price} gold.`);
            offerSet = null;
          } else {
            log.push(`Not enough gold for ${wareLabel(wareAt.kind)}: ${wareAt.price} needed, the party has ${gold}.`);
            offerSet = null;
          }
        } else {
          offerSet = wareAt.id;
          log.push(`${h.name} looks at ${wareLabel(wareAt.kind)}: ${wareAt.price} gold. Bump it again to buy.`);
        }
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing, last: { kind: 'attack', dx: intent.dx, dy: intent.dy, at: newTime } });
      } else if (monsterAt) {
        const { roll, rng: nr } = d20(rng);
        rng = nr;
        const strike = combat.resolve(h.actor.stats, monsterAt.stats, roll);
        if (strike.critical) log.push(`Critical! ${h.name} hits the ${monsterAt.kind} for ${strike.damage}.`);
        else if (strike.hit) log.push(`${h.name} hits the ${monsterAt.kind} for ${strike.damage}.`);
        else log.push(`${h.name} misses the ${monsterAt.kind}.`);
        const monsterHeld = Math.max(monsterAt.held || 0, newTime + 300);
        const newHp = Math.max(0, monsterAt.stats.hp - strike.damage);
        if (newHp === 0) {
          log.push(`The ${monsterAt.kind} is slain.`);
          monstersList = monstersList.filter((m) => m.id !== monsterAt.id);
        } else {
          monstersList = monstersList.map((m) => (m.id === monsterAt.id ? actorShape.of({ id: m.id, kind: m.kind, pos: m.pos, stats: statsShape.of({ hp: newHp, maxHp: m.stats.maxHp, attack: m.stats.attack, defense: m.stats.defense }), ready: m.ready, held: monsterHeld }) : m));
        }
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing, last: { kind: 'attack', dx: intent.dx, dy: intent.dy, at: newTime } });
      } else {
        newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing, last: { kind: 'attack', dx: intent.dx, dy: intent.dy, at: newTime } });
      }
    } else if (intent.kind === "use") {
      needsUpdate = true;
      latency = HERO_LATENCY.use;
      newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing: h.actor.facing, last: h.actor.last });
    } else if (intent.kind === "wait") {
      needsUpdate = true;
      latency = HERO_LATENCY.wait;
      newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing: h.actor.facing, last: h.actor.last });
    } else if (intent.kind === "descend") {
      needsUpdate = true;
      latency = HERO_LATENCY.descend;
      descendRequested = true;
      const stairs = findStairs(world.grid);
      if (stairs) {
        const allWithin = heroes.filter((hh) => hh.alive).every((hh) => isWithin5(hh.actor.pos, stairs));
        if (allWithin) {
          descendValid = true;
        } else {
          log.push("All party members must be within 5 units of the exit!");
        }
      }
      newActor = actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime + latency, held: h.actor.held, facing: h.actor.facing, last: h.actor.last });
    }

    if (needsUpdate) {
      // offer is cleared for use/wait/descend and non-bump move/attack; bumps set/clear it via offerSet
      let newOffer = h.offer;
      if (bumped) {
        newOffer = offerSet;
      } else if (intent.kind === "use" || intent.kind === "wait" || intent.kind === "descend") {
        newOffer = null;
      } else if (intent.kind === "move" || intent.kind === "attack") {
        // non-bump move/attack: clear offer
        newOffer = null;
      }
      heroes[hi] = heroShape.of({ name: h.name, actor: newActor, pending: null, offer: newOffer, alive: h.alive });
    }
  }

  // 2. Monsters act
  let currentMonsters = monstersList.map((m) => ({ id: m.id, kind: m.kind, pos: m.pos, stats: m.stats, ready: m.ready, held: m.held, facing: m.facing, last: m.last }));

  for (let mi = 0; mi < currentMonsters.length; mi++) {
    const m = currentMonsters[mi];
    if (m.ready <= newTime) {
      let target = null;
      let bestDist = Infinity;
      let targetHeroIndex = -1;
      for (let j = 0; j < heroes.length; j++) {
        const h = heroes[j];
        if (h.alive) {
          const d = Math.abs(m.pos.x - h.actor.pos.x) + Math.abs(m.pos.y - h.actor.pos.y);
          if (d < bestDist) {
            bestDist = d;
            target = h.actor.pos;
            targetHeroIndex = j;
          }
        }
      }

      const blocked = [];
      for (let j = 0; j < currentMonsters.length; j++) {
        if (j !== mi) blocked.push(currentMonsters[j].pos);
      }
      for (let j = 0; j < heroes.length; j++) {
        if (heroes[j].alive && j !== targetHeroIndex) blocked.push(heroes[j].actor.pos);
      }
      for (const it of items) {
        if (it.price > 0) blocked.push(it.pos);
      }

      const monsterActor = actorShape.of({ id: m.id, kind: m.kind, pos: m.pos, stats: m.stats, ready: m.ready, held: m.held, facing: m.facing, last: m.last });
      const intentM = monstersNode.decide(monsterActor, target, world.grid, blocked, Math.floor(newTime / 400));

      if (intentM.kind === "wait") {
        const newReady = newTime + MONSTER_LATENCY.wait;
        currentMonsters[mi] = { id: m.id, kind: m.kind, pos: m.pos, stats: m.stats, ready: newReady, held: m.held, facing: m.facing, last: m.last };
      } else if (intentM.kind === "attack" || intentM.kind === "move") {
        const nx = m.pos.x + intentM.dx;
        const ny = m.pos.y + intentM.dy;
        const isAttack = !!(target && nx === target.x && ny === target.y);
        if (isAttack) {
          const hero = heroes.find((hh) => hh.alive && hh.actor.pos.x === nx && hh.actor.pos.y === ny);
          if (hero) {
            const { roll, rng: nr } = d20(rng);
            rng = nr;
            const strike = combat.resolve(m.stats, hero.actor.stats, roll);
            if (strike.critical) log.push(`Critical! The ${m.kind} hits ${hero.name} for ${strike.damage}.`);
            else if (strike.hit) log.push(`The ${m.kind} hits ${hero.name} for ${strike.damage}.`);
            else log.push(`The ${m.kind} misses ${hero.name}.`);
            const newHeroHp = Math.max(0, hero.actor.stats.hp - strike.damage);
            const heroHeld = Math.max(hero.actor.held || 0, newTime + 300);
            const hi = heroes.findIndex((hh) => hh.name === hero.name);
            if (newHeroHp === 0) {
              heroes[hi] = heroShape.of({ name: hero.name, actor: actorShape.of({ id: hero.actor.id, kind: "hero", pos: hero.actor.pos, stats: statsShape.of({ hp: 0, maxHp: hero.actor.stats.maxHp, attack: hero.actor.stats.attack, defense: hero.actor.stats.defense }), ready: hero.actor.ready, held: heroHeld, facing: hero.actor.facing, last: hero.actor.last }), pending: hero.pending, alive: false });
              log.push(`${hero.name} falls.`);
            } else {
              heroes[hi] = heroShape.of({ name: hero.name, actor: actorShape.of({ id: hero.actor.id, kind: "hero", pos: hero.actor.pos, stats: statsShape.of({ hp: newHeroHp, maxHp: hero.actor.stats.maxHp, attack: hero.actor.stats.attack, defense: hero.actor.stats.defense }), ready: hero.actor.ready, held: heroHeld, facing: hero.actor.facing, last: hero.actor.last }), pending: hero.pending, alive: true });
            }
          }
          const facing = actorShape.facingFor(intentM.dx, intentM.dy);
          currentMonsters[mi] = { id: m.id, kind: m.kind, pos: m.pos, stats: m.stats, ready: newTime + MONSTER_LATENCY.attack, held: m.held, facing, last: { kind: 'attack', dx: intentM.dx, dy: intentM.dy, at: newTime } };
        } else {
          // step onto open cell
          if (m.held > newTime) {
            // held monster whose action would be a step: does nothing, ready becomes held
            currentMonsters[mi] = { id: m.id, kind: m.kind, pos: m.pos, stats: m.stats, ready: m.held, held: m.held, facing: m.facing, last: m.last };
          } else {
            const facing = actorShape.facingFor(intentM.dx, intentM.dy);
            currentMonsters[mi] = { id: m.id, kind: m.kind, pos: pointShape.of(nx, ny), stats: m.stats, ready: newTime + MONSTER_LATENCY.step, held: m.held, facing, last: { kind: 'move', dx: intentM.dx, dy: intentM.dy, at: newTime } };
          }
        }
      }
    }
  }
  monstersList = currentMonsters.map((m) => actorShape.of({ id: m.id, kind: m.kind, pos: m.pos, stats: m.stats, ready: m.ready, held: m.held, facing: m.facing, last: m.last }));

  // 3. Wipe
  const anyAlive = heroes.some((h) => h.alive);
  if (heroes.length > 0 && !anyAlive) {
    const rewound = fromSave(world.entry);
    const rewoundHeroes = rewound.heroes.map((h) => heroShape.of({ name: h.name, actor: actorShape.of({ id: h.actor.id, kind: "hero", pos: h.actor.pos, stats: h.actor.stats, ready: newTime }), pending: null, offer: null, alive: true }));
    const v = computeVisible(rewound, rewoundHeroes);
    const newLog = [...world.log, `The party has fallen. Depth ${world.depth} begins again.`].slice(-50);
    return worldShape.of({
      seed: world.seed,
      rng: rewound.rng,
      depth: world.depth,
      time: newTime,
      state: "playing",
      grid: rewound.grid,
      heroes: rewoundHeroes,
      monsters: rewound.monsters.map((m) => actorShape.of({ id: m.id, kind: m.kind, pos: m.pos, stats: m.stats, ready: newTime })),
      items: rewound.items,
      visible: v,
      explored: rewound.explored,
      gold,
      log: newLog,
      entry: world.entry,
    });
  }

  // 4. Stairs (descend): only when a descend fired in step 1 with every alive hero within 5 of the stairs,
  // and a hero is still alive and every alive hero is still within 5 of them after step 2.
  const stairs = findStairs(world.grid);
  if (descendValid && stairs && anyAlive) {
    const allWithinAfter = heroes.filter((h) => h.alive).every((h) => isWithin5(h.actor.pos, stairs));
    if (allWithinAfter) {
      if (world.depth === 29) {
        return worldShape.of({
          seed: world.seed,
          rng: world.rng,
          depth: world.depth,
          time: newTime,
          state: "won",
          grid: world.grid,
          heroes,
          monsters: monstersList,
          items,
          visible: world.visible,
          explored: world.explored,
          gold,
          log: [...world.log, `The party escapes the dungeon with ${gold} gold!`].slice(-50),
          entry: world.entry,
        });
      }
      const nextDepth = world.depth + 1;
      const { monsters: nm, items: ni, plan, rng: nr } = makeFloor(world.seed, nextDepth, rng);
      const startList = startCells(plan);
      const newHeroes = [];
      let si = 0;
      for (const h of heroes) {
        const wasAlive = h.alive;
        const maxHp = h.actor.stats.maxHp + 4;
        const hp = wasAlive ? Math.min(maxHp, h.actor.stats.hp + 4) : 1;
        const a = actorShape.of({ id: h.actor.id, kind: "hero", pos: startList[si++], stats: statsShape.of({ hp, maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense }), ready: newTime });
        newHeroes.push(heroShape.of({ name: h.name, actor: a, pending: null, offer: null, alive: true }));
      }
      if (isShopDepth(nextDepth)) {
        log.push("A shop! Bump a ware twice to buy it.");
      }
      const nv = computeVisible({ grid: plan.grid, depth: nextDepth }, newHeroes);
      const ne = isShopDepth(nextDepth) ? allTrueMask(plan.grid.width, plan.grid.height) : maskShape.empty(plan.grid.width, plan.grid.height);
      const saveNew = saveShape.of({ seed: world.seed, depth: nextDepth, players: newHeroes.map((h) => ({ name: h.name, stats: h.actor.stats })) });
      return worldShape.of({
        seed: world.seed,
        rng: nr,
        depth: nextDepth,
        time: newTime,
        state: "playing",
        grid: plan.grid,
        heroes: newHeroes,
        monsters: nm,
        items: ni,
        visible: nv,
        explored: ne,
        gold,
        log: [...world.log, `The party descends to depth ${nextDepth}.`].slice(-50),
        entry: saveNew,
      });
    } else {
      log.push("All party members must be within 5 units of the exit!");
    }
  }

  // 5. Recompute visible/explored
  const visible = computeVisible(world, heroes);
  const explored = maskShape.union(world.explored, visible);

  return worldShape.of({
    seed: world.seed,
    rng,
    depth: world.depth,
    time: newTime,
    state: world.state,
    grid: world.grid,
    heroes,
    monsters: monstersList,
    items,
    visible,
    explored,
    gold,
    log: log.slice(-50),
    entry: world.entry,
  });
}
