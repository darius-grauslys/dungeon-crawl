// rules: the game itself, turn by turn.

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

const INTENT_KINDS = ["move", "wait", "descend", "restart"];

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

function isIntent(i) {
  return (
    i &&
    typeof i.kind === "string" &&
    INTENT_KINDS.includes(i.kind) &&
    Object.isFrozen(i)
  );
}

function isWorld(w) {
  return (
    w &&
    typeof w.state === "string" &&
    Number.isInteger(w.seed) &&
    Number.isInteger(w.rng) &&
    Number.isInteger(w.depth) &&
    Number.isInteger(w.turn) &&
    w.grid &&
    w.hero &&
    Array.isArray(w.monsters) &&
    Array.isArray(w.items) &&
    w.visible &&
    w.explored &&
    Number.isInteger(w.gold) &&
    Array.isArray(w.log)
  );
}

function buildFloor(seed, depth, heroStats) {
  const plan = dungeon.generate(seed, depth);
  const spots = plan.spots;
  const numMonsters = 2 + 2 * depth;

  let rng = seed;
  const monsters = [];
  let idCounter = 1;

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
      })
    );
  }

  const items = [];
  for (let i = 0; i < 2; i++) {
    items.push(itemShape.of({ id: idCounter++, kind: "potion", pos: spots[numMonsters + i], amount: 0 }));
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

  const hs = heroStats || { hp: 24, maxHp: 24, attack: 4, defense: 1 };
  const hero = actorShape.of({
    id: 0,
    kind: "hero",
    pos: plan.start,
    stats: statsShape.of(hs),
  });

  const visible = fov.compute(plan.grid, hero.pos, 7);
  const explored = maskShape.of(visible.width, visible.height, visible.cells());

  return { plan, monsters, items, hero, visible, explored, rng };
}

/** `newGame(seed) -> world`. `seed` an integer from 0 to 4294967295 (anything else throws a `TypeError`). Depth 1, turn 0, state `playing`, gold 0, the floor `dungeon` makes for this seed and depth 1, the hero (id 0, the starting stats) at its start, `2 + 2 * depth` monsters and the floor's items placed on its spots, `visible` what the hero sees from the start (radius 7), `explored` the same, and a log of one line: `Welcome to the dungeon. Find the stairs (>).` */
export function newGame(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    throw new TypeError("newGame: seed must be an integer from 0 to 4294967295");
  }

  const depth = 1;
  const { monsters, items, hero, visible, explored, rng, plan } = buildFloor(seed, depth);

  return worldShape.of({
    seed,
    rng,
    depth,
    turn: 0,
    state: "playing",
    grid: plan.grid,
    hero,
    monsters,
    items,
    visible,
    explored,
    gold: 0,
    log: ["Welcome to the dungeon. Find the stairs (>)."],
  });
}

/** `step(world, intent) -> world`. */
export function step(world, intent) {
  if (!isWorld(world)) {
    throw new TypeError("step: world must be a world");
  }
  if (!isIntent(intent)) {
    throw new TypeError("step: intent must be an intent");
  }

  const { seed, rng: startRng, depth, turn, state, grid, hero, monsters: initialMonsters, items: initialItems, visible, explored, gold, log } = world;
  let newMonsters = initialMonsters;
  let newItems = initialItems;
  let newGold = gold;
  let newHero = hero;
  let newLog = [...log];
  let newRng = startRng;

  if (state !== "playing") {
    if (intent.kind === "restart") {
      const nextSeed = (seed + 1) % 4294967296;
      return newGame(nextSeed);
    }
    return world;
  }

  let noTurnPasses = false;
  let won = false;
  let descended = false;

  if (intent.kind === "move") {
    const dx = intent.dx;
    const dy = intent.dy;
    const newPos = pointShape.of(hero.pos.x + dx, hero.pos.y + dy);
    const cellKind = grid.at(newPos.x, newPos.y);

    if (cellKind === "wall") {
      noTurnPasses = true;
      return world;
    }

    const monsterAtPos = newMonsters.find((m) => m.pos.x === newPos.x && m.pos.y === newPos.y);

    if (monsterAtPos) {
      const { roll, rng: nr } = d20(newRng);
      newRng = nr;
      const strike = combat.resolve(newHero.stats, monsterAtPos.stats, roll);
      if (!strike.hit) {
        newLog.push(`You miss the ${monsterAtPos.kind}.`);
      } else if (strike.critical) {
        newLog.push(`Critical! You hit the ${monsterAtPos.kind} for ${strike.damage}.`);
      } else {
        newLog.push(`You hit the ${monsterAtPos.kind} for ${strike.damage}.`);
      }
      const newMonsterHp = Math.max(0, monsterAtPos.stats.hp - strike.damage);
      if (newMonsterHp === 0) {
        newLog.push(`The ${monsterAtPos.kind} is slain.`);
        newMonsters = newMonsters.filter((m) => m.id !== monsterAtPos.id);
      } else {
        newMonsters = newMonsters.map((m) =>
          m.id === monsterAtPos.id
            ? m.with({ stats: statsShape.of({ hp: newMonsterHp, maxHp: monsterAtPos.stats.maxHp, attack: monsterAtPos.stats.attack, defense: monsterAtPos.stats.defense }) })
            : m
        );
      }
    } else {
      newHero = newHero.with({ pos: newPos });
      const itemsAtPos = newItems.filter((it) => it.pos.x === newPos.x && it.pos.y === newPos.y);
      for (const it of itemsAtPos) {
        if (it.kind === "potion") {
          const healed = 8;
          const newHp = Math.min(newHero.stats.maxHp, newHero.stats.hp + healed);
          const actualHealed = newHp - newHero.stats.hp;
          newHero = newHero.with({ stats: statsShape.of({ hp: newHp, maxHp: newHero.stats.maxHp, attack: newHero.stats.attack, defense: newHero.stats.defense }) });
          newLog.push(`You drink a potion (+${actualHealed} HP).`);
        } else if (it.kind === "gold") {
          newGold += it.amount;
          newLog.push(`You pick up ${it.amount} gold.`);
        } else if (it.kind === "sword") {
          newHero = newHero.with({ stats: statsShape.of({ hp: newHero.stats.hp, maxHp: newHero.stats.maxHp, attack: newHero.stats.attack + 2, defense: newHero.stats.defense }) });
          newLog.push(`You pick up a sword (+2 attack).`);
        } else if (it.kind === "armor") {
          newHero = newHero.with({ stats: statsShape.of({ hp: newHero.stats.hp, maxHp: newHero.stats.maxHp, attack: newHero.stats.attack, defense: newHero.stats.defense + 1 }) });
          newLog.push(`You put on armor (+1 defense).`);
        }
      }
      newItems = newItems.filter((it) => !(it.pos.x === newPos.x && it.pos.y === newPos.y));
    }
  } else if (intent.kind === "wait") {
    // nothing
  } else if (intent.kind === "descend") {
    if (grid.at(hero.pos.x, hero.pos.y) !== "stairs") {
      newLog.push("There are no stairs here.");
      noTurnPasses = true;
      return world.with({ log: newLog.slice(-50) });
    }
    if (depth === 5) {
      won = true;
      newLog.push(`You escape the dungeon with ${gold} gold! Press R to play again.`);
      return world.with({ state: "won", log: newLog.slice(-50) });
    }
    descended = true;
    const nextDepth = depth + 1;
    const { plan, monsters: nm, items: ni, hero: nh, visible: nv, explored: ne, rng: nr } = buildFloor(seed, nextDepth, { hp: Math.min(newHero.stats.maxHp + 4, newHero.stats.hp + 4), maxHp: newHero.stats.maxHp + 4, attack: newHero.stats.attack, defense: newHero.stats.defense });
    newLog.push(`You descend to depth ${nextDepth}.`);
    return worldShape.of({
      seed,
      rng: nr,
      depth: nextDepth,
      turn,
      state: "playing",
      grid: plan.grid,
      hero: nh,
      monsters: nm,
      items: ni,
      visible: nv,
      explored: ne,
      gold: newGold,
      log: newLog.slice(-50),
    });
  } else if (intent.kind === "restart") {
    const nextSeed = (seed + 1) % 4294967296;
    return newGame(nextSeed);
  }

  if (noTurnPasses || won || descended) {
    return world;
  }

  let dead = false;
  let currentMonsters = newMonsters;
  for (const m of currentMonsters) {
    if (dead) break;
    const intentM = monsters.decide(m, newHero.pos, grid, currentMonsters.filter((o) => o.id !== m.id).map((o) => o.pos), turn);
    if (intentM.kind === "move") {
      const nx = m.pos.x + intentM.dx;
      const ny = m.pos.y + intentM.dy;
      if (nx === newHero.pos.x && ny === newHero.pos.y) {
        const { roll, rng: nr } = d20(newRng);
        newRng = nr;
        const strike = combat.resolve(m.stats, newHero.stats, roll);
        if (!strike.hit) {
          newLog.push(`The ${m.kind} misses you.`);
        } else if (strike.critical) {
          newLog.push(`Critical! The ${m.kind} hits you for ${strike.damage}.`);
        } else {
          newLog.push(`The ${m.kind} hits you for ${strike.damage}.`);
        }
        const newHeroHp = Math.max(0, newHero.stats.hp - strike.damage);
        if (newHeroHp === 0) {
          dead = true;
          newHero = newHero.with({ stats: statsShape.of({ hp: 0, maxHp: newHero.stats.maxHp, attack: newHero.stats.attack, defense: newHero.stats.defense }) });
          newLog.push(`You die on depth ${depth}. Press R to try again.`);
        } else {
          newHero = newHero.with({ stats: statsShape.of({ hp: newHeroHp, maxHp: newHero.stats.maxHp, attack: newHero.stats.attack, defense: newHero.stats.defense }) });
        }
      } else if (grid.open(nx, ny) && !currentMonsters.some((o) => o.pos.x === nx && o.pos.y === ny)) {
        const moved = m.with({ pos: pointShape.of(nx, ny) });
        currentMonsters = currentMonsters.map((o) => (o.id === m.id ? moved : o));
        newMonsters = currentMonsters;
      }
    }
  }

  const finalState = dead ? "dead" : state;
  const newTurn = turn + 1;
  const newVisible = fov.compute(grid, newHero.pos, 7);
  const newExplored = maskShape.union(explored, newVisible);

  return worldShape.of({
    seed,
    rng: newRng,
    depth,
    turn: newTurn,
    state: finalState,
    grid,
    hero: newHero,
    monsters: newMonsters,
    items: newItems,
    visible: newVisible,
    explored: newExplored,
    gold: newGold,
    log: newLog.slice(-50),
  });
}
