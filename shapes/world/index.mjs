// world: an API Shape, the whole state of a game at one moment. Immutable.

import * as tileGridShape from '../tile-grid/index.mjs';
import * as heroShape from '../hero/index.mjs';
import * as actorShape from '../actor/index.mjs';
import * as itemShape from '../item/index.mjs';
import * as maskShape from '../mask/index.mjs';
import * as saveShape from '../save/index.mjs';
import * as intentShape from '../intent/index.mjs';
import * as pointShape from '../point/index.mjs';
import * as statsShape from '../stats/index.mjs';

const MAX_INT = 4294967295;
const MAX_LOG_LENGTH = 50;
const VALID_STATES = ['playing', 'won'];
const MAX_HEROES = 4;

function isActor(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.id !== 'number' || !Number.isInteger(v.id) || v.id < 0) return false;
  if (typeof v.kind !== 'string' || !actorShape.KINDS.includes(v.kind)) return false;
  if (typeof v.pos !== 'object' || !Object.isFrozen(v.pos)) return false;
  if (typeof v.pos.x !== 'number' || !Number.isInteger(v.pos.x)) return false;
  if (typeof v.pos.y !== 'number' || !Number.isInteger(v.pos.y)) return false;
  if (Object.keys(v.pos).length !== 2) return false;
  if (typeof v.stats !== 'object' || !Object.isFrozen(v.stats)) return false;
  if (typeof v.stats.hp !== 'number' || !Number.isInteger(v.stats.hp)) return false;
  if (typeof v.stats.maxHp !== 'number' || !Number.isInteger(v.stats.maxHp)) return false;
  if (typeof v.stats.attack !== 'number' || !Number.isInteger(v.stats.attack)) return false;
  if (typeof v.stats.defense !== 'number' || !Number.isInteger(v.stats.defense)) return false;
  if (v.stats.maxHp < 1) return false;
  if (v.stats.hp < 0 || v.stats.hp > v.stats.maxHp) return false;
  if (v.stats.attack < 0 || v.stats.defense < 0) return false;
  if (typeof v.ready !== 'number' || !Number.isInteger(v.ready) || v.ready < 0) return false;
  return Object.keys(v).length === 5;
}

function isItem(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.id !== 'number' || !Number.isInteger(v.id) || v.id < 0) return false;
  if (typeof v.kind !== 'string' || !itemShape.KINDS.includes(v.kind)) return false;
  if (typeof v.pos !== 'object' || !Object.isFrozen(v.pos)) return false;
  if (typeof v.pos.x !== 'number' || !Number.isInteger(v.pos.x)) return false;
  if (typeof v.pos.y !== 'number' || !Number.isInteger(v.pos.y)) return false;
  if (Object.keys(v.pos).length !== 2) return false;
  if (typeof v.amount !== 'number' || !Number.isInteger(v.amount)) return false;
  return Object.keys(v).length === 4;
}

function isHero(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.name !== 'string') return false;
  if (!isActor(v.actor) || v.actor.kind !== 'hero') return false;
  if (v.pending !== null) {
    if (!(v.pending instanceof intentShape.Intent)) return false;
  }
  if (typeof v.alive !== 'boolean') return false;
  return Object.keys(v).length === 4;
}

/**
 * World: the whole state of a game at one moment. Immutable.
 */
class World {
  constructor(fields) {
    this.seed = fields.seed;
    this.rng = fields.rng;
    this.depth = fields.depth;
    this.time = fields.time;
    this.state = fields.state;
    this.grid = fields.grid;
    this.heroes = fields.heroes;
    this.monsters = fields.monsters;
    this.items = fields.items;
    this.visible = fields.visible;
    this.explored = fields.explored;
    this.gold = fields.gold;
    this.log = fields.log;
    this.entry = fields.entry;
  }

  with(changes) {
    const merged = {
      seed: this.seed,
      rng: this.rng,
      depth: this.depth,
      time: this.time,
      state: this.state,
      grid: this.grid,
      heroes: this.heroes,
      monsters: this.monsters,
      items: this.items,
      visible: this.visible,
      explored: this.explored,
      gold: this.gold,
      log: this.log,
      entry: this.entry
    };
    if (changes) {
      for (const key of Object.keys(changes)) {
        merged[key] = changes[key];
      }
    }
    return of(merged);
  }

  data() {
    const gridRows = [];
    const tiles = this.grid.tiles();
    for (let y = 0; y < this.grid.height; y++) {
      let row = '';
      for (let x = 0; x < this.grid.width; x++) {
        const kind = tiles[y * this.grid.width + x];
        if (kind === 'wall') row += '#';
        else if (kind === 'floor') row += '.';
        else if (kind === 'stairs') row += '>';
      }
      gridRows.push(row);
    }

    const visibleRows = [];
    const exploredRows = [];
    const visibleCells = this.visible.cells();
    const exploredCells = this.explored.cells();
    for (let y = 0; y < this.grid.height; y++) {
      let vRow = '';
      let eRow = '';
      for (let x = 0; x < this.grid.width; x++) {
        const idx = y * this.grid.width + x;
        vRow += visibleCells[idx] ? '1' : '0';
        eRow += exploredCells[idx] ? '1' : '0';
      }
      visibleRows.push(vRow);
      exploredRows.push(eRow);
    }

    const heroesData = this.heroes.map((h) => ({
      name: h.name,
      alive: h.alive,
      pending: h.pending ? { kind: h.pending.kind, dx: h.pending.dx, dy: h.pending.dy } : null,
      actor: {
        id: h.actor.id,
        kind: h.actor.kind,
        pos: { x: h.actor.pos.x, y: h.actor.pos.y },
        stats: {
          hp: h.actor.stats.hp,
          maxHp: h.actor.stats.maxHp,
          attack: h.actor.stats.attack,
          defense: h.actor.stats.defense,
        },
        ready: h.actor.ready,
      },
    }));

    const monstersData = this.monsters.map((m) => ({
      id: m.id,
      kind: m.kind,
      pos: { x: m.pos.x, y: m.pos.y },
      stats: {
        hp: m.stats.hp,
        maxHp: m.stats.maxHp,
        attack: m.stats.attack,
        defense: m.stats.defense,
      },
      ready: m.ready,
    }));

    const itemsData = this.items.map((it) => ({
      id: it.id,
      kind: it.kind,
      pos: { x: it.pos.x, y: it.pos.y },
      amount: it.amount,
    }));

    return {
      seed: this.seed,
      rng: this.rng,
      depth: this.depth,
      time: this.time,
      state: this.state,
      gold: this.gold,
      log: this.log.slice(),
      grid: gridRows,
      visible: visibleRows,
      explored: exploredRows,
      heroes: heroesData,
      monsters: monstersData,
      items: itemsData,
      entry: this.entry.data(),
    };
  }
}

/**
 * Create a frozen world.
 * @param {object} fields
 * @returns {object} a frozen world
 */
export function of(fields) {
  if (typeof fields !== 'object' || Array.isArray(fields) || fields === null) {
    throw new TypeError('world: fields must be an object');
  }

  const expectedKeys = [
    'seed', 'rng', 'depth', 'time', 'state', 'grid', 'heroes', 'monsters',
    'items', 'visible', 'explored', 'gold', 'log', 'entry'
  ];
  for (const k of expectedKeys) {
    if (!(k in fields)) {
      throw new TypeError(`world: missing field ${k}`);
    }
  }
  for (const k of Object.keys(fields)) {
    if (!expectedKeys.includes(k)) {
      throw new TypeError(`world: unknown field ${k}`);
    }
  }

  const {
    seed, rng, depth, time, state, grid, heroes, monsters, items,
    visible, explored, gold, log, entry
  } = fields;

  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > MAX_INT) {
    throw new TypeError('world: seed must be an integer from 0 to 4294967295');
  }
  if (typeof rng !== 'number' || !Number.isInteger(rng) || rng < 0 || rng > MAX_INT) {
    throw new TypeError('world: rng must be an integer from 0 to 4294967295');
  }
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > 5) {
    throw new TypeError('world: depth must be an integer from 1 to 5');
  }
  if (typeof time !== 'number' || !Number.isInteger(time) || time < 0) {
    throw new TypeError('world: time must be an integer of 0 or more');
  }
  if (!VALID_STATES.includes(state)) {
    throw new TypeError("world: state must be 'playing' or 'won'");
  }
  if (!(grid instanceof tileGridShape.TileGrid)) {
    throw new TypeError('world: grid must be a tile-grid');
  }
  if (!Array.isArray(heroes)) {
    throw new TypeError('world: heroes must be an array');
  }
  if (heroes.length < 0 || heroes.length > MAX_HEROES) {
    throw new TypeError('world: heroes must be 0 to 4 heroes');
  }
  const heroNames = new Set();
  const heroActorIds = new Set();
  for (const h of heroes) {
    if (!isHero(h)) {
      throw new TypeError('world: heroes must be an array of heroes');
    }
    if (heroNames.has(h.name)) {
      throw new TypeError('world: heroes must have unique names');
    }
    heroNames.add(h.name);
    if (heroActorIds.has(h.actor.id)) {
      throw new TypeError('world: heroes must have unique actor ids');
    }
    heroActorIds.add(h.actor.id);
  }
  if (!Array.isArray(monsters)) {
    throw new TypeError('world: monsters must be an array');
  }
  for (const m of monsters) {
    if (!isActor(m) || m.kind === 'hero') {
      throw new TypeError('world: monsters must be an array of actors, none of kind hero');
    }
  }
  if (!Array.isArray(items)) {
    throw new TypeError('world: items must be an array');
  }
  for (const it of items) {
    if (!isItem(it)) {
      throw new TypeError('world: items must be an array of items');
    }
  }
  if (!(visible instanceof maskShape.Mask)) {
    throw new TypeError('world: visible must be a mask');
  }
  if (visible.width !== grid.width || visible.height !== grid.height) {
    throw new TypeError('world: visible mask must be the grid size');
  }
  if (!(explored instanceof maskShape.Mask)) {
    throw new TypeError('world: explored must be a mask');
  }
  if (explored.width !== grid.width || explored.height !== grid.height) {
    throw new TypeError('world: explored mask must be the grid size');
  }
  if (typeof gold !== 'number' || !Number.isInteger(gold) || gold < 0) {
    throw new TypeError('world: gold must be an integer of 0 or more');
  }
  if (!Array.isArray(log)) {
    throw new TypeError('world: log must be an array');
  }
  if (log.length > MAX_LOG_LENGTH) {
    throw new TypeError('world: log must have at most 50 strings');
  }
  for (const entryStr of log) {
    if (typeof entryStr !== 'string') {
      throw new TypeError('world: log must be an array of strings');
    }
  }
  if (!(entry instanceof saveShape.Save)) {
    throw new TypeError('world: entry must be a save');
  }

  const world = new World({
    seed,
    rng,
    depth,
    time,
    state,
    grid,
    heroes: Object.freeze(heroes.slice()),
    monsters: Object.freeze(monsters.slice()),
    items: Object.freeze(items.slice()),
    visible,
    explored,
    gold,
    log: Object.freeze(log.slice()),
    entry
  });

  return Object.freeze(world);
}

/**
 * Create a world from data.
 * @param {object} data
 * @returns {object} a frozen world
 */
export function fromData(data) {
  if (typeof data !== 'object' || Array.isArray(data) || data === null) {
    throw new TypeError('world: data must be an object');
  }

  const expectedKeys = [
    'seed', 'rng', 'depth', 'time', 'state', 'gold', 'log', 'grid',
    'visible', 'explored', 'heroes', 'monsters', 'items', 'entry'
  ];
  for (const k of expectedKeys) {
    if (!(k in data)) {
      throw new TypeError(`world: missing data key ${k}`);
    }
  }
  for (const k of Object.keys(data)) {
    if (!expectedKeys.includes(k)) {
      throw new TypeError(`world: unknown data key ${k}`);
    }
  }

  const {
    seed, rng, depth, time, state, gold, log, grid, visible, explored,
    heroes, monsters, items, entry
  } = data;

  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > MAX_INT) {
    throw new TypeError('world: seed must be an integer from 0 to 4294967295');
  }
  if (typeof rng !== 'number' || !Number.isInteger(rng) || rng < 0 || rng > MAX_INT) {
    throw new TypeError('world: rng must be an integer from 0 to 4294967295');
  }
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > 5) {
    throw new TypeError('world: depth must be an integer from 1 to 5');
  }
  if (typeof time !== 'number' || !Number.isInteger(time) || time < 0) {
    throw new TypeError('world: time must be an integer of 0 or more');
  }
  if (!VALID_STATES.includes(state)) {
    throw new TypeError("world: state must be 'playing' or 'won'");
  }
  if (typeof gold !== 'number' || !Number.isInteger(gold) || gold < 0) {
    throw new TypeError('world: gold must be an integer of 0 or more');
  }

  if (!Array.isArray(log)) {
    throw new TypeError('world: log must be an array');
  }
  if (log.length > MAX_LOG_LENGTH) {
    throw new TypeError('world: log must have at most 50 strings');
  }
  for (const entryStr of log) {
    if (typeof entryStr !== 'string') {
      throw new TypeError('world: log must be an array of strings');
    }
  }

  if (!Array.isArray(grid)) {
    throw new TypeError('world: grid must be an array of strings');
  }
  const gridObj = tileGridShape.fromRows(grid);

  if (!Array.isArray(visible)) {
    throw new TypeError('world: visible must be an array of strings');
  }
  const visibleCells = [];
  for (const row of visible) {
    if (typeof row !== 'string') {
      throw new TypeError('world: visible rows must be strings');
    }
    for (const ch of row) {
      if (ch !== '0' && ch !== '1') {
        throw new TypeError('world: visible must be strings of 0 and 1');
      }
      visibleCells.push(ch === '1');
    }
  }
  const visibleObj = maskShape.of(gridObj.width, gridObj.height, visibleCells);

  if (!Array.isArray(explored)) {
    throw new TypeError('world: explored must be an array of strings');
  }
  const exploredCells = [];
  for (const row of explored) {
    if (typeof row !== 'string') {
      throw new TypeError('world: explored rows must be strings');
    }
    for (const ch of row) {
      if (ch !== '0' && ch !== '1') {
        throw new TypeError('world: explored must be strings of 0 and 1');
      }
      exploredCells.push(ch === '1');
    }
  }
  const exploredObj = maskShape.of(gridObj.width, gridObj.height, exploredCells);

  const heroObjs = [];
  for (const h of heroes) {
    if (typeof h.name !== 'string' || !saveShape.isName(h.name)) {
      throw new TypeError('world: hero name must be a valid name');
    }
    if (typeof h.alive !== 'boolean') {
      throw new TypeError('world: hero alive must be a boolean');
    }
    let pending = null;
    if (h.pending !== null) {
      if (typeof h.pending.kind !== 'string' || !intentShape.KINDS.includes(h.pending.kind)) {
        throw new TypeError('world: hero pending kind must be a valid kind');
      }
      if (typeof h.pending.dx !== 'number' || !Number.isInteger(h.pending.dx)) {
        throw new TypeError('world: hero pending dx must be an integer');
      }
      if (typeof h.pending.dy !== 'number' || !Number.isInteger(h.pending.dy)) {
        throw new TypeError('world: hero pending dy must be an integer');
      }
      if (h.pending.kind === 'move') {
        pending = intentShape.move(h.pending.dx, h.pending.dy);
      } else if (h.pending.kind === 'attack') {
        pending = intentShape.attack(h.pending.dx, h.pending.dy);
      } else if (h.pending.kind === 'use') {
        pending = intentShape.use();
      } else if (h.pending.kind === 'wait') {
        pending = intentShape.wait();
      } else {
        throw new TypeError('world: hero pending kind must be valid');
      }
    }
    const actorData = h.actor;
    const actorObj = actorShape.of({
      id: actorData.id,
      kind: actorData.kind,
      pos: pointShape.of(actorData.pos.x, actorData.pos.y),
      stats: statsShape.of({
        hp: actorData.stats.hp,
        maxHp: actorData.stats.maxHp,
        attack: actorData.stats.attack,
        defense: actorData.stats.defense,
      }),
      ready: actorData.ready,
    });
    const heroObj = heroShape.of({ name: h.name, actor: actorObj, pending, alive: h.alive });
    heroObjs.push(heroObj);
  }

  const monsterObjs = [];
  for (const m of monsters) {
    const monsterObj = actorShape.of({
      id: m.id,
      kind: m.kind,
      pos: pointShape.of(m.pos.x, m.pos.y),
      stats: statsShape.of({
        hp: m.stats.hp,
        maxHp: m.stats.maxHp,
        attack: m.stats.attack,
        defense: m.stats.defense,
      }),
      ready: m.ready,
    });
    if (monsterObj.kind === 'hero') {
      throw new TypeError('world: monsters must not be of kind hero');
    }
    monsterObjs.push(monsterObj);
  }

  const itemObjs = [];
  for (const it of items) {
    const itemObj = itemShape.of({
      id: it.id,
      kind: it.kind,
      pos: pointShape.of(it.pos.x, it.pos.y),
      amount: it.amount,
    });
    itemObjs.push(itemObj);
  }

  const entryObj = saveShape.fromData(entry);

  return of({
    seed,
    rng,
    depth,
    time,
    state,
    grid: gridObj,
    heroes: heroObjs,
    monsters: monsterObjs,
    items: itemObjs,
    visible: visibleObj,
    explored: exploredObj,
    gold,
    log,
    entry: entryObj,
  });
}
