// rules: the game itself, in real time.

import * as dungeon from "../../edges/edge_to_dungeon.mjs";
import * as fov from "../../edges/edge_to_fov.mjs";
import * as combat from "../../edges/edge_to_combat.mjs";
import * as monsters from "../../edges/edge_to_monsters.mjs";

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

const MONSTER_KINDS_BY_DEPTH = {
  1: ["bat", "slime"],
  2: ["bat", "slime", "snake"],
  3: ["slime", "snake", "skeleton"],
  4: ["snake", "skeleton", "demon"],
  5: ["skeleton", "demon"],
};

const MONSTER_STATS = {
  bat: { hp: 3, maxHp: 3, attack: 2, defense: 0 },
  slime: { hp: 6, maxHp: 6, attack: 2, defense: 1 },
  snake: { hp: 5, maxHp: 5, attack: 3, defense: 0 },
  skeleton: { hp: 9, maxHp: 9, attack: 4, defense: 2 },
  demon: { hp: 16, maxHp: 16, attack: 6, defense: 3 },
};

const HERO_START_STATS = { hp: 24, maxHp: 24, attack: 4, defense: 1 };

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

function isValidIntent(i) {
  return (
    i &&
    Object.isFrozen(i) &&
    intentShape.KINDS &&
    intentShape.KINDS.includes(i.kind)
  );
}

function isWorld(w) {
  return (
    w &&
    typeof w.state === "string" &&
    Number.isInteger(w.seed) &&
    Number.isInteger(w.rng) &&
    Number.isInteger(w.depth) &&
    Number.isInteger(w.time) &&
    w.grid &&
    Array.isArray(w.heroes) &&
    Array.isArray(w.monsters) &&
    Array.isArray(w.items) &&
    w.visible &&
    w.explored &&
    Number.isInteger(w.gold) &&
    Array.isArray(w.log) &&
    w.entry
  );
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

function buildFloor(seed, depth) {
  const plan = dungeon.generate(seed, depth);
  const spots = plan.spots;
  const numMonsters = 2 + 2 * depth;

  let rng = seed;
  const monsters = [];
  let idCounter = 10;

  for (let i = 0; i < numMonsters; i++) {
    const { rng: nr, item: kind } = pick(rng, MONSTER_KINDS_BY_DEPTH[depth]);
    rng = nr;
    const pos = spots[i];
    const s = MONSTER_STATS[kind];
    monsters.push(
      actorShape.of({
        id: idCounter++,
        kind,
        pos,
        stats: statsShape.of({ hp: s.hp, maxHp: s.hp, attack: s.attack, defense: s.defense }),
        ready: 0,
      })
    );
  }

  const items = [];
  for (let i = 0; i < 2; i++) {
    items.push(
      itemShape.of({ id: idCounter++, kind: "potion", pos: spots[numMonsters + i], amount: 0 })
    );
  }
  for (let i = 0; i < 2; i++) {
    const { rng: nr, value } = mulberryDraw(rng);
    rng = nr;
    const d = Math.floor(value * 8);
    items.push(
      itemShape.of({ id: idCounter++, kind: "gold", pos: spots[numMonsters + 2 + i], amount: depth * (3 + d) })
    );
  }
  if (depth === 2 || depth === 4) {
    items.push(itemShape.of({ id: idCounter++, kind: "sword", pos: spots[numMonsters + 4], amount: 0 }));
  } else if (depth === 3 || depth === 5) {
    items.push(itemShape.of({ id: idCounter++, kind: "armor", pos: spots[numMonsters + 4], amount: 0 }));
  }

  const startCellList = startCells(plan);
  const visible = maskShape.empty(plan.grid.width, plan.grid.height);
  const explored = maskShape.empty(plan.grid.width, plan.grid.height);

  return { plan, monsters, items, visible, explored, rng, startCellList, grid: plan.grid };
}

function makeSave(seed, depth, players) {
  const entryPlayers = (players || []).map((p) => {
    const hp = p.stats.hp === 0 ? 1 : p.stats.hp;
    return {
      name: p.name,
      stats: statsShape.of({ hp, maxHp: p.stats.maxHp, attack: p.stats.attack, defense: p.stats.defense }),
    };
  });
  return saveShape.of({ seed, depth, players: entryPlayers });
}

/** `newGame(seed) -> world`. */
export function newGame(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new TypeError("newGame: seed must be an integer from 0 to 4294967295");
  }

  const depth = 1;
  const { monsters, items, visible, explored, rng, plan } = buildFloor(seed, depth);

  const entry = makeSave(seed, 1, []);

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
    entry,
  });
}

/** `fromSave(save) -> world`. */
export function fromSave(save) {
  if (!save || typeof save.seed !== "number" || typeof save.depth !== "number" || !Array.isArray(save.players)) {
    throw new TypeError("fromSave: save must be a save");
  }

  const seed = save.seed;
  const depth = save.depth;
  const { monsters, items, visible, explored, rng, plan, startCellList } = buildFloor(seed, depth);

  const players = save.players || [];
  const heroes = [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const hp = p.stats.hp === 0 ? 1 : p.stats.hp;
    const stats = statsShape.of({ hp, maxHp: p.stats.maxHp, attack: p.stats.attack, defense: p.stats.defense });
    const actor = actorShape.of({
      id: i,
      kind: "hero",
      pos: startCellList[i],
      stats,
      ready: 0,
    });
    heroes.push(heroShape.of({ name: p.name, actor, pending: null, alive: true }));
  }

  const entry = makeSave(seed, depth, players);

  let visibleFinal = maskShape.empty(plan.grid.width, plan.grid.height);
  for (const h of heroes) {
    const v = fov.compute(plan.grid, h.actor.pos, 7);
    visibleFinal = maskShape.union(visibleFinal, v);
  }
  const exploredFinal = maskShape.union(explored, visibleFinal);

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
    visible: visibleFinal,
    explored: exploredFinal,
    gold: 0,
    log: ["Welcome to the dungeon. Find the stairs (>)."],
    entry,
  });
}

/** `toSave(world) -> save`. */
export function toSave(world) {
  const players = world.heroes.map((h) => {
    const hp = h.alive ? h.actor.stats.hp : 1;
    return {
      name: h.name,
      stats: statsShape.of({ hp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense }),
    };
  });
  return saveShape.of({ seed: world.seed, depth: world.depth, players });
}

/** `join(world, name) -> world | null`. */
export function join(world, name) {
  if (!saveShape.isName(name)) {
    throw new TypeError("join: name must be a name");
  }
  for (const h of world.heroes) {
    if (h.name === name) return world;
  }
  if (world.heroes.length >= 4) return null;

  const plan = dungeon.generate(world.seed, world.depth);
  const startCellList = startCells(plan);
  let placedCell = null;
  for (const cell of startCellList) {
    const occupied = world.heroes.some((h) => h.alive && h.actor.pos.x === cell.x && h.actor.pos.y === cell.y);
    if (!occupied) {
      placedCell = cell;
      break;
    }
  }

  let nextId = 0;
  const usedIds = new Set(world.heroes.map((h) => h.actor.id));
  while (usedIds.has(nextId) && nextId < 4) {
    nextId++;
  }

  const stats = statsShape.of(HERO_START_STATS);
  const actor = actorShape.of({ id: nextId, kind: "hero", pos: placedCell, stats, ready: world.time });
  const newHero = heroShape.of({ name, actor, pending: null, alive: true });

  const newHeroes = [...world.heroes, newHero];
  const newEntry = makeSave(world.seed, world.depth, [...world.entry.players, { name, stats: statsShape.of(HERO_START_STATS) }]);

  let visibleFinal = maskShape.empty(world.grid.width, world.grid.height);
  for (const h of newHeroes) {
    const v = fov.compute(world.grid, h.actor.pos, 7);
    visibleFinal = maskShape.union(visibleFinal, v);
  }
  const exploredFinal = maskShape.union(world.explored, visibleFinal);

  const newLog = [...world.log, `${name} joins the party.`];

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
    visible: visibleFinal,
    explored: exploredFinal,
    gold: world.gold,
    log: newLog.slice(-50),
    entry: newEntry,
  });
}

/** `intend(world, name, intent) -> world`. */
export function intend(world, name, intent) {
  if (!isValidIntent(intent)) {
    throw new TypeError("intend: intent must be an intent");
  }
  const hero = world.heroes.find((h) => h.name === name);
  if (!hero || !hero.alive || world.state !== "playing") {
    return world;
  }
  const newHeroes = world.heroes.map((h) => (h.name === name ? h.with({ pending: intent }) : h));
  return world.with({ heroes: newHeroes });
}

function setHeroPendingAndReady(heroes, name, pending, ready) {
  return heroes.map((h) => (h.name === name ? h.with({ pending, actor: h.actor.with({ ready }) }) : h));
}

function setHeroPosPendingAndReady(heroes, name, pos, pending, ready) {
  return heroes.map((h) => (h.name === name ? h.with({ pending, actor: h.actor.with({ pos, ready }) }) : h));
}

function setHeroStatsPendingAndReady(heroes, name, stats, pending, ready) {
  return heroes.map((h) => (h.name === name ? h.with({ pending, actor: h.actor.with({ stats, ready }) }) : h));
}

function chebyshev(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function nearestAliveHero(heroes, monsterPos, grid) {
  let best = null;
  let bestDist = Infinity;
  for (const h of heroes) {
    if (!h.alive) continue;
    const d = Math.abs(monsterPos.x - h.actor.pos.x) + Math.abs(monsterPos.y - h.actor.pos.y);
    if (d < bestDist) {
      bestDist = d;
      best = h.actor.pos;
    }
  }
  return best;
}

/** `advance(world, ms) -> world`. */
export function advance(world, ms) {
  if (!Number.isInteger(ms) || ms < 1 || ms > 1000) {
    throw new TypeError("advance: ms must be an integer from 1 to 1000");
  }
  if (!isWorld(world)) {
    throw new TypeError("advance: world must be a world");
  }

  let newState = world.state;
  if (world.state !== "playing") {
    return world.with({ time: world.time + ms });
  }

  const newTime = world.time + ms;
  let newMonsters = world.monsters;
  let newItems = world.items;
  let newGold = world.gold;
  let newHeroes = world.heroes;
  let newRng = world.rng;
  let log = [...world.log];

  // 1. Heroes, in order.
  for (const h of newHeroes) {
    if (!h.alive) continue;
    if (h.actor.ready > newTime) continue;
    if (!h.pending) continue;

    const intent = h.pending;
    const kind = intent.kind;

    let fired = true;

    if (kind === "move") {
      const dx = intent.dx;
      const dy = intent.dy;
      const newPos = pointShape.of(h.actor.pos.x + dx, h.actor.pos.y + dy);
      const cellKind = world.grid.at(newPos.x, newPos.y);

      if (cellKind === "wall") {
        // nothing happens, fires anyway
      } else {
        const otherHero = newHeroes.find((oh) => oh.name !== h.name && oh.alive && oh.actor.pos.x === newPos.x && oh.actor.pos.y === newPos.y);
        if (otherHero) {
          // nothing happens, fires anyway
        } else {
          const monsterAtPos = newMonsters.find((m) => m.pos.x === newPos.x && m.pos.y === newPos.y);
          if (monsterAtPos) {
            const { roll, rng: nr } = d20(newRng);
            newRng = nr;
            const strike = combat.resolve(h.actor.stats, monsterAtPos.stats, roll);
            if (strike.hit) {
              if (strike.critical) {
                log.push(`Critical! ${h.name} hits the ${monsterAtPos.kind} for ${strike.damage}.`);
              } else {
                log.push(`${h.name} hits the ${monsterAtPos.kind} for ${strike.damage}.`);
              }
            } else {
              log.push(`${h.name} misses the ${monsterAtPos.kind}.`);
            }
            const newMonsterHp = Math.max(0, monsterAtPos.stats.hp - strike.damage);
            if (newMonsterHp === 0) {
              log.push(`The ${monsterAtPos.kind} is slain.`);
              newMonsters = newMonsters.filter((m) => m.id !== monsterAtPos.id);
            } else {
              newMonsters = newMonsters.map((m) =>
                m.id === monsterAtPos.id
                  ? m.with({ stats: statsShape.of({ hp: newMonsterHp, maxHp: monsterAtPos.stats.maxHp, attack: monsterAtPos.stats.attack, defense: monsterAtPos.stats.defense }) })
                  : m
              );
            }
          } else {
            const creatureAtPos =
              newMonsters.some((m) => m.pos.x === newPos.x && m.pos.y === newPos.y) ||
              newHeroes.some((oh) => oh.alive && oh.actor.pos.x === newPos.x && oh.actor.pos.y === newPos.y);
            if (!creatureAtPos && world.grid.open(newPos.x, newPos.y)) {
              newHeroes = setHeroPosPendingAndReady(newHeroes, h.name, newPos, null, newTime + 200);
              const itemsAtPos = newItems.filter((it) => it.pos.x === newPos.x && it.pos.y === newPos.y);
              for (const it of itemsAtPos) {
                if (it.kind === "potion") {
                  const healed = 8;
                  const newHp = Math.min(h.actor.stats.maxHp, h.actor.stats.hp + healed);
                  const actualHealed = newHp - h.actor.stats.hp;
                  newHeroes = setHeroStatsPendingAndReady(newHeroes, h.name, statsShape.of({ hp: newHp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense }), null, newTime + 200);
                  log.push(`${h.name} drinks a potion (+${actualHealed} HP).`);
                } else if (it.kind === "gold") {
                  newGold += it.amount;
                  log.push(`${h.name} picks up ${it.amount} gold.`);
                } else if (it.kind === "sword") {
                  newHeroes = setHeroStatsPendingAndReady(newHeroes, h.name, statsShape.of({ hp: h.actor.stats.hp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack + 2, defense: h.actor.stats.defense }), null, newTime + 200);
                  log.push(`${h.name} picks up a sword (+2 attack).`);
                } else if (it.kind === "armor") {
                  newHeroes = setHeroStatsPendingAndReady(newHeroes, h.name, statsShape.of({ hp: h.actor.stats.hp, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense + 1 }), null, newTime + 200);
                  log.push(`${h.name} puts on armor (+1 defense).`);
                }
              }
              newItems = newItems.filter((it) => !(it.pos.x === newPos.x && it.pos.y === newPos.y));
              continue;
            } else {
              // nothing happens, fires anyway
            }
          }
        }
      }
    } else if (kind === "attack") {
      const dx = intent.dx;
      const dy = intent.dy;
      const attackPos = pointShape.of(h.actor.pos.x + dx, h.actor.pos.y + dy);
      const monsterAtPos = newMonsters.find((m) => m.pos.x === attackPos.x && m.pos.y === attackPos.y);
      if (monsterAtPos) {
        const { roll, rng: nr } = d20(newRng);
        newRng = nr;
        const strike = combat.resolve(h.actor.stats, monsterAtPos.stats, roll);
        if (strike.hit) {
          if (strike.critical) {
            log.push(`Critical! ${h.name} hits the ${monsterAtPos.kind} for ${strike.damage}.`);
          } else {
            log.push(`${h.name} hits the ${monsterAtPos.kind} for ${strike.damage}.`);
          }
        } else {
          log.push(`${h.name} misses the ${monsterAtPos.kind}.`);
        }
        const newMonsterHp = Math.max(0, monsterAtPos.stats.hp - strike.damage);
        if (newMonsterHp === 0) {
          log.push(`The ${monsterAtPos.kind} is slain.`);
          newMonsters = newMonsters.filter((m) => m.id !== monsterAtPos.id);
        } else {
          newMonsters = newMonsters.map((m) =>
            m.id === monsterAtPos.id
              ? m.with({ stats: statsShape.of({ hp: newMonsterHp, maxHp: monsterAtPos.stats.maxHp, attack: monsterAtPos.stats.attack, defense: monsterAtPos.stats.defense }) })
              : m
          );
        }
      }
      // attack toward a cell no monster holds: nothing happens
    } else if (kind === "use" || kind === "wait") {
      // nothing happens (yet)
    }

    newHeroes = setHeroPendingAndReady(newHeroes, h.name, null, newTime + 200);
  }

  // 2. Monsters, in order.
  const turn = Math.floor(newTime / 400);
  for (const m of newMonsters) {
    if (m.ready > newTime) continue;
    const target = nearestAliveHero(newHeroes, m.pos, world.grid);
    const blocked = newMonsters
      .filter((o) => o.id !== m.id)
      .map((o) => o.pos)
      .concat(newHeroes.filter((h) => h.alive).map((h) => h.actor.pos));
    const intentM = monsters.decide(m, target, world.grid, blocked, turn);
    if (intentM.kind === "move") {
      const nx = m.pos.x + intentM.dx;
      const ny = m.pos.y + intentM.dy;
      const targetHero = newHeroes.find((h) => h.alive && h.actor.pos.x === nx && h.actor.pos.y === ny);
      if (targetHero) {
        const { roll, rng: nr } = d20(newRng);
        newRng = nr;
        const strike = combat.resolve(m.stats, targetHero.actor.stats, roll);
        if (strike.hit) {
          if (strike.critical) {
            log.push(`Critical! The ${m.kind} hits ${targetHero.name} for ${strike.damage}.`);
          } else {
            log.push(`The ${m.kind} hits ${targetHero.name} for ${strike.damage}.`);
          }
        } else {
          log.push(`The ${m.kind} misses ${targetHero.name}.`);
        }
        const newHeroHp = Math.max(0, targetHero.actor.stats.hp - strike.damage);
        if (newHeroHp === 0) {
          newHeroes = newHeroes.map((h) => (h.name === targetHero.name ? h.with({ alive: false, actor: h.actor.with({ stats: statsShape.of({ hp: 0, maxHp: h.actor.stats.maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense }) }) }) : h));
          log.push(`${targetHero.name} falls.`);
        } else {
          newHeroes = setHeroStatsPendingAndReady(newHeroes, targetHero.name, statsShape.of({ hp: newHeroHp, maxHp: targetHero.actor.stats.maxHp, attack: targetHero.actor.stats.attack, defense: targetHero.actor.stats.defense }), null, targetHero.actor.ready);
        }
      } else if (world.grid.open(nx, ny) && !newMonsters.some((o) => o.pos.x === nx && o.pos.y === ny) && !newHeroes.some((h) => h.alive && h.actor.pos.x === nx && h.actor.pos.y === ny)) {
        newMonsters = newMonsters.map((o) => (o.id === m.id ? o.with({ pos: pointShape.of(nx, ny) }) : o));
      }
    }
    newMonsters = newMonsters.map((o) => (o.id === m.id ? o.with({ ready: newTime + 400 }) : o));
  }

  // 3. A wipe.
  const aliveCount = newHeroes.filter((h) => h.alive).length;
  if (newHeroes.length >= 1 && aliveCount === 0) {
    const savedWorld = fromSave(world.entry);
    const wipedMonsters = savedWorld.monsters.map((m) => m.with({ ready: newTime }));
    const wipedHeroes = savedWorld.heroes.map((h) => h.with({ actor: h.actor.with({ ready: newTime }) }));
    const newLog = [...world.log, `The party has fallen. Depth ${world.depth} begins again.`];
    return worldShape.of({
      seed: world.seed,
      rng: newRng,
      depth: world.depth,
      time: newTime,
      state: "playing",
      grid: savedWorld.grid,
      heroes: wipedHeroes,
      monsters: wipedMonsters,
      items: savedWorld.items,
      visible: savedWorld.visible,
      explored: savedWorld.explored,
      gold: newGold,
      log: newLog.slice(-50),
      entry: world.entry,
    });
  }

  // 4. The stairs.
  const stairsCell = findStairs(world.grid);
  if (stairsCell && aliveCount >= 1) {
    const allAliveWithin5 = newHeroes.filter((h) => h.alive).every((h) => chebyshev(h.actor.pos, stairsCell) <= 5);
    if (allAliveWithin5) {
      if (world.depth === 5) {
        newState = "won";
        log.push(`The party escapes the dungeon with ${newGold} gold!`);
      } else {
        const nextDepth = world.depth + 1;
        const { monsters: nm, items: ni, visible: nv, explored: ne, rng: nr, startCellList: scl, grid: ng } = buildFloor(world.seed, nextDepth);
        const nmReady = nm.map((m) => m.with({ ready: newTime }));
        const newHeroesDesc = [];
        for (let i = 0; i < newHeroes.length; i++) {
          const h = newHeroes[i];
          const maxHp = h.actor.stats.maxHp + 4;
          const hp = h.alive ? Math.min(maxHp, h.actor.stats.hp + 4) : 1;
          const actor = actorShape.of({ id: h.actor.id, kind: "hero", pos: scl[i], stats: statsShape.of({ hp, maxHp, attack: h.actor.stats.attack, defense: h.actor.stats.defense }), ready: newTime });
          newHeroesDesc.push(heroShape.of({ name: h.name, actor, pending: null, alive: true }));
        }
        const entryDesc = makeSave(world.seed, nextDepth, newHeroesDesc.map((h) => ({ name: h.name, stats: h.actor.stats })));
        log.push(`The party descends to depth ${nextDepth}.`);
        let visibleFinal = maskShape.empty(ng.width, ng.height);
        for (const h of newHeroesDesc) {
          const v = fov.compute(ng, h.actor.pos, 7);
          visibleFinal = maskShape.union(visibleFinal, v);
        }
        const exploredFinal = maskShape.union(maskShape.empty(ng.width, ng.height), visibleFinal);
        return worldShape.of({
          seed: world.seed,
          rng: nr,
          depth: nextDepth,
          time: newTime,
          state: "playing",
          grid: ng,
          heroes: newHeroesDesc,
          monsters: nmReady,
          items: ni,
          visible: visibleFinal,
          explored: exploredFinal,
          gold: newGold,
          log: log.slice(-50),
          entry: entryDesc,
        });
      }
    }
  }

  // 5. visible recomputed, explored takes in visible.
  let visibleFinal = maskShape.empty(world.grid.width, world.grid.height);
  for (const h of newHeroes) {
    if (h.alive) {
      const v = fov.compute(world.grid, h.actor.pos, 7);
      visibleFinal = maskShape.union(visibleFinal, v);
    }
  }
  const exploredFinal = maskShape.union(world.explored, visibleFinal);

  return worldShape.of({
    seed: world.seed,
    rng: newRng,
    depth: world.depth,
    time: newTime,
    state: newState,
    grid: world.grid,
    heroes: newHeroes,
    monsters: newMonsters,
    items: newItems,
    visible: visibleFinal,
    explored: exploredFinal,
    gold: newGold,
    log: log.slice(-50),
    entry: world.entry,
  });
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
