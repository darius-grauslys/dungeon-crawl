// world: an API Shape, the whole state of a game at one moment. Immutable.

import * as tileGridShape from '../tile-grid/index.mjs';
import * as actorShape from '../actor/index.mjs';
import * as itemShape from '../item/index.mjs';
import * as maskShape from '../mask/index.mjs';

const VALID_STATES = ['playing', 'dead', 'won'];
const MAX_INT = 4294967295;
const MAX_LOG_LENGTH = 50;

function isPoint(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.x !== 'number' || !Number.isInteger(v.x)) return false;
  if (typeof v.y !== 'number' || !Number.isInteger(v.y)) return false;
  return Object.keys(v).length === 2 && 'x' in v && 'y' in v;
}

function isStats(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.hp !== 'number' || !Number.isInteger(v.hp)) return false;
  if (typeof v.maxHp !== 'number' || !Number.isInteger(v.maxHp)) return false;
  if (typeof v.attack !== 'number' || !Number.isInteger(v.attack)) return false;
  if (typeof v.defense !== 'number' || !Number.isInteger(v.defense)) return false;
  if (v.maxHp < 1) return false;
  if (v.hp < 0 || v.hp > v.maxHp) return false;
  if (v.attack < 0 || v.defense < 0) return false;
  return Object.keys(v).length === 4;
}

function isActor(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.id !== 'number' || !Number.isInteger(v.id) || v.id < 0) return false;
  if (typeof v.kind !== 'string' || !actorShape.KINDS.includes(v.kind)) return false;
  if (!isPoint(v.pos)) return false;
  if (!isStats(v.stats)) return false;
  return true;
}

function isItem(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.id !== 'number' || !Number.isInteger(v.id) || v.id < 0) return false;
  if (typeof v.kind !== 'string' || !itemShape.KINDS.includes(v.kind)) return false;
  if (!isPoint(v.pos)) return false;
  if (typeof v.amount !== 'number' || !Number.isInteger(v.amount)) return false;
  return true;
}

function isTileGrid(v) {
  return v instanceof tileGridShape.TileGrid;
}

function isMask(v) {
  return v instanceof maskShape.Mask;
}

/**
 * World: the whole state of a game at one moment. Immutable.
 */
class World {
  constructor(fields) {
    this.seed = fields.seed;
    this.rng = fields.rng;
    this.depth = fields.depth;
    this.turn = fields.turn;
    this.state = fields.state;
    this.grid = fields.grid;
    this.hero = fields.hero;
    this.monsters = fields.monsters;
    this.items = fields.items;
    this.visible = fields.visible;
    this.explored = fields.explored;
    this.gold = fields.gold;
    this.log = fields.log;
  }

  with(changes) {
    const merged = {
      seed: this.seed, rng: this.rng, depth: this.depth, turn: this.turn,
      state: this.state, grid: this.grid, hero: this.hero,
      monsters: this.monsters, items: this.items,
      visible: this.visible, explored: this.explored, gold: this.gold, log: this.log
    };
    if (changes) {
      for (const key of Object.keys(changes)) {
        merged[key] = changes[key];
      }
    }
    return of(merged);
  }
}

/**
 * Create a frozen world.
 * @param {object} fields
 * @returns {object} a frozen world
 */
export function of(fields) {
  if (typeof fields !== 'object' || Array.isArray(fields)) {
    throw new TypeError('world: fields must be an object');
  }

  const expectedKeys = ['seed', 'rng', 'depth', 'turn', 'state', 'grid', 'hero', 'monsters', 'items', 'visible', 'explored', 'gold', 'log'];
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

  const { seed, rng, depth, turn, state, grid, hero, monsters, items, visible, explored, gold, log } = fields;

  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > MAX_INT) {
    throw new TypeError('world: seed must be an integer from 0 to 4294967295');
  }
  if (typeof rng !== 'number' || !Number.isInteger(rng) || rng < 0 || rng > MAX_INT) {
    throw new TypeError('world: rng must be an integer from 0 to 4294967295');
  }
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > 5) {
    throw new TypeError('world: depth must be an integer from 1 to 5');
  }
  if (typeof turn !== 'number' || !Number.isInteger(turn) || turn < 0) {
    throw new TypeError('world: turn must be an integer of 0 or more');
  }
  if (!VALID_STATES.includes(state)) {
    throw new TypeError("world: state must be 'playing', 'dead' or 'won'");
  }
  if (!isTileGrid(grid)) {
    throw new TypeError('world: grid must be a tile-grid');
  }
  if (!isActor(hero) || hero.kind !== 'hero') {
    throw new TypeError('world: hero must be an actor of kind hero');
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
  if (!isMask(visible)) {
    throw new TypeError('world: visible must be a mask');
  }
  if (visible.width !== grid.width || visible.height !== grid.height) {
    throw new TypeError('world: visible mask must be the grid size');
  }
  if (!isMask(explored)) {
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
  for (const entry of log) {
    if (typeof entry !== 'string') {
      throw new TypeError('world: log must be an array of strings');
    }
  }

  const world = new World({
    seed,
    rng,
    depth,
    turn,
    state,
    grid,
    hero,
    monsters: Object.freeze(monsters.slice()),
    items: Object.freeze(items.slice()),
    visible,
    explored,
    gold,
    log: Object.freeze(log.slice())
  });

  return Object.freeze(world);
}
