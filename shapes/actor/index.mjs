// actor: an API Shape, a creature on the floor: the hero or a monster. Immutable.

import * as pointShape from '../point/index.mjs';
import * as statsShape from '../stats/index.mjs';

export const KINDS = Object.freeze(['hero', 'bat', 'slime', 'snake', 'skeleton', 'demon']);

/**
 * Validate that a value is a point made by point.of.
 * @param {*} v
 * @returns {boolean}
 */
function isPoint(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.x !== 'number' || !Number.isInteger(v.x)) return false;
  if (typeof v.y !== 'number' || !Number.isInteger(v.y)) return false;
  if (Object.keys(v).length !== 2 || !('x' in v) || !('y' in v)) return false;
  const p = pointShape.of(v.x, v.y);
  return pointShape.equals(p, v);
}

/**
 * Validate that a value is stats made by stats.of.
 * @param {*} v
 * @returns {boolean}
 */
function isStats(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.hp !== 'number' || !Number.isInteger(v.hp)) return false;
  if (typeof v.maxHp !== 'number' || !Number.isInteger(v.maxHp)) return false;
  if (typeof v.attack !== 'number' || !Number.isInteger(v.attack)) return false;
  if (typeof v.defense !== 'number' || !Number.isInteger(v.defense)) return false;
  if (v.maxHp < 1) return false;
  if (v.hp < 0 || v.hp > v.maxHp) return false;
  if (v.attack < 0 || v.defense < 0) return false;
  if (Object.keys(v).length !== 4) return false;
  const s = statsShape.of({ hp: v.hp, maxHp: v.maxHp, attack: v.attack, defense: v.defense });
  return s.hp === v.hp && s.maxHp === v.maxHp && s.attack === v.attack && s.defense === v.defense;
}

/**
 * Validate that a value is a last-move object or null.
 * @param {*} v
 * @returns {boolean}
 */
function isLast(v) {
  if (v === null) return true;
  if (!v || typeof v !== 'object') return false;
  if (v.kind !== 'move' && v.kind !== 'attack') return false;
  const { dx, dy, at } = v;
  if (typeof dx !== 'number' || !Number.isInteger(dx)) return false;
  if (typeof dy !== 'number' || !Number.isInteger(dy)) return false;
  if (!((dx === 1 && dy === 0) || (dx === -1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 0 && dy === -1))) return false;
  if (typeof at !== 'number' || !Number.isInteger(at) || at < 0) return false;
  if (Object.keys(v).length !== 4 || !('kind' in v) || !('dx' in v) || !('dy' in v) || !('at' in v)) return false;
  return true;
}

/**
 * Actor class: a creature on the floor: the hero or a monster. Immutable.
 */
class Actor {
  constructor({ id, kind, pos, stats, ready, held, facing, last }) {
    this.id = id;
    this.kind = kind;
    this.pos = pos;
    this.stats = stats;
    this.ready = ready;
    this.held = held;
    this.facing = facing;
    this.last = last;
  }

  with(changes) {
    const c = changes || {};
    const newPos = 'pos' in c ? c.pos : this.pos;
    const newStats = 'stats' in c ? c.stats : this.stats;
    const newReady = 'ready' in c ? c.ready : this.ready;
    const newHeld = 'held' in c ? c.held : this.held;
    const newFacing = 'facing' in c ? c.facing : this.facing;
    const newLast = 'last' in c ? c.last : this.last;
    return of({ id: this.id, kind: this.kind, pos: newPos, stats: newStats, ready: newReady, held: newHeld, facing: newFacing, last: newLast });
  }
}

// Facing constants
const FACING_LEFT = 'left';
const FACING_RIGHT = 'right';

/**
 * Create an actor.
 * @param {{id: number, kind: string, pos: point, stats: stats, ready?: number, held?: number, facing?: string, last?: object}} input
 * @returns {object} a frozen actor
 */
export function of({ id, kind, pos, stats, ready = 0, held = 0, facing = FACING_RIGHT, last = null }) {
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 0) {
    throw new TypeError('actor id must be an integer of 0 or more');
  }
  if (!KINDS.includes(kind)) {
    throw new TypeError(`actor kind must be one of: ${KINDS.join(', ')}`);
  }
  if (!isPoint(pos)) {
    throw new TypeError('actor pos must be a point');
  }
  if (!isStats(stats)) {
    throw new TypeError('actor stats must be stats');
  }
  if (typeof ready !== 'number' || !Number.isInteger(ready) || ready < 0) {
    throw new TypeError('actor ready must be an integer of 0 or more');
  }
  if (typeof held !== 'number' || !Number.isInteger(held) || held < 0) {
    throw new TypeError('actor held must be an integer of 0 or more');
  }
  if (facing !== FACING_LEFT && facing !== FACING_RIGHT) {
    throw new TypeError('actor facing must be left or right');
  }
  if (!isLast(last)) {
    throw new TypeError('actor last must be null or a frozen move/attack object');
  }

  const frozenLast = last === null ? null : Object.freeze({ kind: last.kind, dx: last.dx, dy: last.dy, at: last.at });
  const actor = new Actor({ id, kind, pos, stats, ready, held, facing, last: frozenLast });
  return Object.freeze(actor);
}

/**
 * The way a creature looks after a move or attack (dx, dy).
 * @param {number} dx
 * @param {number} dy
 * @returns {string} 'left' or 'right'
 */
export function facingFor(dx, dy) {
  if (!((dx === 1 && dy === 0) || (dx === -1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 0 && dy === -1))) {
    throw new TypeError('facingFor dx, dy must be orthogonal unit');
  }
  if ((dx === -1 && dy === 0) || (dx === 0 && dy === 1)) {
    return FACING_LEFT;
  }
  return FACING_RIGHT;
}
