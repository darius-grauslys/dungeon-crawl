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
  if (typeof v.stats.range !== 'number' || !Number.isInteger(v.stats.range)) return false;
  if (typeof v.stats.magic !== 'number' || !Number.isInteger(v.stats.magic)) return false;
  if (typeof v.stats.magicPower !== 'number' || !Number.isInteger(v.stats.magicPower)) return false;
  if (typeof v.stats.magicResist !== 'number' || !Number.isInteger(v.stats.magicResist)) return false;
  if (v.stats.maxHp < 1) return false;
  if (v.stats.hp < 0 || v.stats.hp > v.stats.maxHp) return false;
  if (v.stats.attack < 0 || v.stats.defense < 0) return false;
  if (v.stats.range < 1 || v.stats.range > 9) return false;
  if (v.stats.magic < 0) return false;
  if (v.stats.magicPower < 1) return false;
  if (v.stats.magicResist < 0) return false;
  if (Object.keys(v.stats).length !== 8) return false;
  if (typeof v.ready !== 'number' || !Number.isInteger(v.ready) || v.ready < 0) return false;
  if (typeof v.held !== 'number' || !Number.isInteger(v.held) || v.held < 0) return false;
  if (v.facing !== 'left' && v.facing !== 'right') return false;
  if (v.last !== null) {
    if (!v.last || typeof v.last !== 'object' || !Object.isFrozen(v.last)) return false;
    if (v.last.kind !== 'move' && v.last.kind !== 'attack') return false;
    if (typeof v.last.dx !== 'number' || !Number.isInteger(v.last.dx)) return false;
    if (typeof v.last.dy !== 'number' || !Number.isInteger(v.last.dy)) return false;
    if (!((v.last.dx === 1 && (v.last.dy === -1 || v.last.dy === 0 || v.last.dy === 1)) ||
          (v.last.dx === -1 && (v.last.dy === -1 || v.last.dy === 0 || v.last.dy === 1)) ||
          (v.last.dx === 0 && (v.last.dy === 1 || v.last.dy === -1)))) return false;
    if (typeof v.last.at !== 'number' || !Number.isInteger(v.last.at) || v.last.at < 0) return false;
    if (typeof v.last.reach !== 'number' || !Number.isInteger(v.last.reach) || v.last.reach < 1 || v.last.reach > 9) return false;
    if (Object.keys(v.last).length !== 5) return false;
  }
  if (typeof v.aim !== 'object' || !Object.isFrozen(v.aim)) return false;
  if (typeof v.aim.dx !== 'number' || !Number.isInteger(v.aim.dx)) return false;
  if (typeof v.aim.dy !== 'number' || !Number.isInteger(v.aim.dy)) return false;
  if (!((v.aim.dx === 1 && (v.aim.dy === -1 || v.aim.dy === 0 || v.aim.dy === 1)) ||
        (v.aim.dx === -1 && (v.aim.dy === -1 || v.aim.dy === 0 || v.aim.dy === 1)) ||
        (v.aim.dx === 0 && (v.aim.dy === 1 || v.aim.dy === -1)))) return false;
  if (Object.keys(v.aim).length !== 2) return false;
  if (typeof v.slow !== 'number' || !Number.isInteger(v.slow) || v.slow < 0 || v.slow > 3) return false;
  if (v.mode !== 'roam' && v.mode !== 'guard' && v.mode !== 'dormant') return false;
  if (v.kind === 'hero' && v.mode !== 'roam') return false;
  if (![1, 2, 3].includes(v.size)) return false;
  if (v.kind === 'hero' && v.size !== 1) return false;
  if (typeof v.small !== 'boolean') return false;
  if (v.gesture !== null) {
    if (!v.gesture || typeof v.gesture !== 'object' || !Object.isFrozen(v.gesture)) return false;
    if (v.gesture.kind !== 'use' && v.gesture.kind !== 'power') return false;
    if (typeof v.gesture.at !== 'number' || !Number.isInteger(v.gesture.at) || v.gesture.at < 0) return false;
    if (Object.keys(v.gesture).length !== 2) return false;
  }
  if (typeof v.curse !== 'number' || !Number.isInteger(v.curse) || v.curse < 0 || v.curse > 3) return false;
  if (typeof v.haste !== 'number' || !Number.isInteger(v.haste) || v.haste < 0 || v.haste > 3) return false;
  if (v.chant !== null) {
    if (!v.chant || typeof v.chant !== 'object' || !Object.isFrozen(v.chant)) return false;
    if (v.chant.kind !== 'haste' && v.chant.kind !== 'summon') return false;
    if (typeof v.chant.at !== 'number' || !Number.isInteger(v.chant.at) || v.chant.at < 0) return false;
    if (typeof v.chant.until !== 'number' || !Number.isInteger(v.chant.until) || v.chant.until < 0) return false;
    if (v.chant.until < v.chant.at) return false;
    if (Object.keys(v.chant).length !== 3) return false;
  }
  if (typeof v.cooldown !== 'number' || !Number.isInteger(v.cooldown) || v.cooldown < 0) return false;
  if (v.fuse !== null) {
    if (!v.fuse || typeof v.fuse !== 'object' || !Object.isFrozen(v.fuse)) return false;
    if (typeof v.fuse.at !== 'number' || !Number.isInteger(v.fuse.at) || v.fuse.at < 0) return false;
    if (Object.keys(v.fuse).length !== 1) return false;
  }
  if (v.kind === 'hero') {
    if (v.haste !== 0) return false;
    if (v.cooldown !== 0) return false;
    if (v.chant !== null) return false;
    if (v.fuse !== null) return false;
  }
  return Object.keys(v).length === 19;
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
  if (typeof v.price !== 'number' || !Number.isInteger(v.price) || v.price < 0) return false;
  if (typeof v.pulled !== 'boolean') return false;
  if (v.flung !== null) {
    if (!v.flung || typeof v.flung !== 'object' || !Object.isFrozen(v.flung)) return false;
    if (typeof v.flung.x !== 'number' || !Number.isInteger(v.flung.x) || v.flung.x < 0) return false;
    if (typeof v.flung.y !== 'number' || !Number.isInteger(v.flung.y) || v.flung.y < 0) return false;
    if (typeof v.flung.at !== 'number' || !Number.isInteger(v.flung.at) || v.flung.at < 0) return false;
    if (Object.keys(v.flung).length !== 3) return false;
  }
  return Object.keys(v).length === 7;
}

function isHero(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.name !== 'string') return false;
  if (!isActor(v.actor) || v.actor.kind !== 'hero') return false;
  if (v.pending !== null) {
    if (!(v.pending instanceof intentShape.Intent)) return false;
  }
  if (typeof v.alive !== 'boolean') return false;
  if (v.offer !== null && (typeof v.offer !== 'number' || !Number.isInteger(v.offer) || v.offer < 0)) return false;
  if (typeof v.colour !== 'number' || !Number.isInteger(v.colour) || v.colour < 0 || v.colour > 3) return false;
  if (typeof v.group !== 'number' || !Number.isInteger(v.group) || v.group < 0 || v.group > 5) return false;
  return Object.keys(v).length === 7;
}

function isEffect(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  if (v.kind !== 'blast') return false;
  if (typeof v.x !== 'number' || !Number.isInteger(v.x) || v.x < 0) return false;
  if (typeof v.y !== 'number' || !Number.isInteger(v.y) || v.y < 0) return false;
  if (typeof v.size !== 'number' || !Number.isInteger(v.size) || v.size < 1 || v.size > 3) return false;
  if (typeof v.at !== 'number' || !Number.isInteger(v.at) || v.at < 0) return false;
  return Object.keys(v).length === 5;
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
    this.effects = fields.effects;
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
      entry: this.entry,
      effects: this.effects
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

    const heroesData = this.heroes.map((h) => {
      const actorData = {
        id: h.actor.id,
        kind: h.actor.kind,
        pos: { x: h.actor.pos.x, y: h.actor.pos.y },
        stats: {
          hp: h.actor.stats.hp,
          maxHp: h.actor.stats.maxHp,
          attack: h.actor.stats.attack,
          defense: h.actor.stats.defense,
          range: h.actor.stats.range,
          magic: h.actor.stats.magic,
          magicPower: h.actor.stats.magicPower,
          magicResist: h.actor.stats.magicResist,
        },
        ready: h.actor.ready,
        held: h.actor.held,
        facing: h.actor.facing,
        last: h.actor.last ? { kind: h.actor.last.kind, dx: h.actor.last.dx, dy: h.actor.last.dy, at: h.actor.last.at, reach: h.actor.last.reach } : null,
        aim: { dx: h.actor.aim.dx, dy: h.actor.aim.dy },
        slow: h.actor.slow,
        mode: h.actor.mode,
        size: h.actor.size,
        small: h.actor.small,
        gesture: h.actor.gesture ? { kind: h.actor.gesture.kind, at: h.actor.gesture.at } : null,
        curse: h.actor.curse,
        haste: h.actor.haste,
        chant: h.actor.chant ? { kind: h.actor.chant.kind, at: h.actor.chant.at, until: h.actor.chant.until } : null,
        cooldown: h.actor.cooldown,
        fuse: h.actor.fuse ? { at: h.actor.fuse.at } : null,
      };
      const heroData = {
        name: h.name,
        alive: h.alive,
        pending: h.pending ? { kind: h.pending.kind, dx: h.pending.dx, dy: h.pending.dy } : null,
        offer: h.offer,
        colour: h.colour ?? 0,
        group: h.group ?? 0,
        actor: actorData,
      };
      return heroData;
    });

    const monstersData = this.monsters.map((m) => {
      const monsterData = {
        id: m.id,
        kind: m.kind,
        pos: { x: m.pos.x, y: m.pos.y },
        stats: {
          hp: m.stats.hp,
          maxHp: m.stats.maxHp,
          attack: m.stats.attack,
          defense: m.stats.defense,
          range: m.stats.range,
          magic: m.stats.magic,
          magicPower: m.stats.magicPower,
          magicResist: m.stats.magicResist,
        },
        ready: m.ready,
        held: m.held,
        facing: m.facing,
        last: m.last ? { kind: m.last.kind, dx: m.last.dx, dy: m.last.dy, at: m.last.at, reach: m.last.reach } : null,
        aim: { dx: m.aim.dx, dy: m.aim.dy },
        slow: m.slow,
        mode: m.mode,
        size: m.size,
        small: m.small,
        gesture: m.gesture ? { kind: m.gesture.kind, at: m.gesture.at } : null,
        curse: m.curse,
        haste: m.haste,
        chant: m.chant ? { kind: m.chant.kind, at: m.chant.at, until: m.chant.until } : null,
        cooldown: m.cooldown,
        fuse: m.fuse ? { at: m.fuse.at } : null,
      };
      return monsterData;
    });

    const itemsData = this.items.map((it) => ({
      id: it.id,
      kind: it.kind,
      pos: { x: it.pos.x, y: it.pos.y },
      amount: it.amount,
      price: it.price,
      pulled: it.pulled,
      flung: it.flung,
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
      effects: this.effects ? this.effects.map((e) => ({ kind: e.kind, x: e.x, y: e.y, size: e.size, at: e.at })) : [],
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

  const requiredKeys = [
    'seed', 'rng', 'depth', 'time', 'state', 'grid', 'heroes', 'monsters',
    'items', 'visible', 'explored', 'gold', 'log', 'entry'
  ];
  const expectedKeys = [...requiredKeys, 'effects'];
  for (const k of requiredKeys) {
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
    visible, explored, gold, log, entry, effects = []
  } = fields;

  if (!Array.isArray(effects)) {
    throw new TypeError('world: effects must be an array');
  }
  const effectsObjs = effects.map((e) => {
    if (!isEffect(e)) {
      throw new TypeError('world: effects must be an array of frozen blast effects');
    }
    return Object.freeze({ kind: e.kind, x: e.x, y: e.y, size: e.size, at: e.at });
  });

  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > MAX_INT) {
    throw new TypeError('world: seed must be an integer from 0 to 4294967295');
  }
  if (typeof rng !== 'number' || !Number.isInteger(rng) || rng < 0 || rng > MAX_INT) {
    throw new TypeError('world: rng must be an integer from 0 to 4294967295');
  }
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > 33) {
    throw new TypeError('world: depth must be an integer from 1 to 33');
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
    entry,
    effects: Object.freeze(effectsObjs)
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

  const requiredKeys = [
    'seed', 'rng', 'depth', 'time', 'state', 'gold', 'log', 'grid',
    'visible', 'explored', 'heroes', 'monsters', 'items', 'entry'
  ];
  const expectedKeys = [...requiredKeys, 'effects'];
  for (const k of requiredKeys) {
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
    heroes, monsters, items, entry, effects = []
  } = data;

  const effectsObjs = effects.map((e) => {
    if (!isEffect(e)) {
      throw new TypeError('world: effects must be an array of frozen blast effects');
    }
    return { kind: e.kind, x: e.x, y: e.y, size: e.size, at: e.at };
  });

  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > MAX_INT) {
    throw new TypeError('world: seed must be an integer from 0 to 4294967295');
  }
  if (typeof rng !== 'number' || !Number.isInteger(rng) || rng < 0 || rng > MAX_INT) {
    throw new TypeError('world: rng must be an integer from 0 to 4294967295');
  }
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > 33) {
    throw new TypeError('world: depth must be an integer from 1 to 33');
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
      } else if (h.pending.kind === 'descend') {
        pending = intentShape.descend();
      } else if (h.pending.kind === 'face') {
        pending = intentShape.face(h.pending.dx, h.pending.dy);
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
        range: actorData.stats.range,
        magic: actorData.stats.magic,
        magicPower: actorData.stats.magicPower,
        magicResist: actorData.stats.magicResist,
      }),
      ready: actorData.ready,
      held: actorData.held,
      facing: actorData.facing,
      last: actorData.last ? { kind: actorData.last.kind, dx: actorData.last.dx, dy: actorData.last.dy, at: actorData.last.at, reach: actorData.last.reach } : null,
      aim: { dx: actorData.aim.dx, dy: actorData.aim.dy },
      slow: actorData.slow,
      mode: actorData.mode,
      size: actorData.size,
      small: actorData.small,
      gesture: actorData.gesture ? { kind: actorData.gesture.kind, at: actorData.gesture.at } : null,
      curse: actorData.curse,
      haste: actorData.haste,
      chant: actorData.chant ? { kind: actorData.chant.kind, at: actorData.chant.at, until: actorData.chant.until } : null,
      cooldown: actorData.cooldown,
      fuse: actorData.fuse ? { at: actorData.fuse.at } : null,
    });
    const heroObj = heroShape.of({ name: h.name, actor: actorObj, pending, alive: h.alive, offer: h.offer, colour: h.colour ?? 0, group: h.group ?? 0 });
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
        range: m.stats.range,
        magic: m.stats.magic,
        magicPower: m.stats.magicPower,
        magicResist: m.stats.magicResist,
      }),
      ready: m.ready,
      held: m.held,
      facing: m.facing,
      last: m.last ? { kind: m.last.kind, dx: m.last.dx, dy: m.last.dy, at: m.last.at, reach: m.last.reach } : null,
      aim: { dx: m.aim.dx, dy: m.aim.dy },
      slow: m.slow,
      mode: m.mode,
      size: m.size,
      small: m.small,
      gesture: m.gesture ? { kind: m.gesture.kind, at: m.gesture.at } : null,
      curse: m.curse,
      haste: m.haste,
      chant: m.chant ? { kind: m.chant.kind, at: m.chant.at, until: m.chant.until } : null,
      cooldown: m.cooldown,
      fuse: m.fuse ? { at: m.fuse.at } : null,
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
      price: it.price,
      pulled: it.pulled,
      flung: it.flung,
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
    effects: effectsObjs,
  });
}
