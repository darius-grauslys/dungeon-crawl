// actor: an API Shape, a creature on the floor: the hero or a monster. Immutable.

import * as pointShape from '../point/index.mjs';
import * as statsShape from '../stats/index.mjs';
import * as bestiaryShape from '../bestiary/index.mjs';

export const KINDS = Object.freeze(['hero', ...bestiaryShape.KINDS]);

// Facing constants
const FACING_LEFT = 'left';
const FACING_RIGHT = 'right';

// Mode constants
const MODE_ROAM = 'roam';
const MODE_GUARD = 'guard';
const MODE_DORMANT = 'dormant';

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
  if (typeof v.range !== 'number' || !Number.isInteger(v.range)) return false;
  if (v.maxHp < 1) return false;
  if (v.hp < 0 || v.hp > v.maxHp) return false;
  if (v.attack < 0 || v.defense < 0) return false;
  if (v.range < 1 || v.range > 9) return false;
  if (Object.keys(v).length !== 5) return false;
  const s = statsShape.of({ hp: v.hp, maxHp: v.maxHp, attack: v.attack, defense: v.defense, range: v.range });
  return s.hp === v.hp && s.maxHp === v.maxHp && s.attack === v.attack && s.defense === v.defense && s.range === v.range;
}

/**
 * Validate that a value is a direction: dx, dy each -1, 0 or 1, not both 0.
 * @param {*} dx
 * @param {*} dy
 * @returns {boolean}
 */
function isDirection(dx, dy) {
  if (typeof dx !== 'number' || !Number.isInteger(dx) || dx < -1 || dx > 1) return false;
  if (typeof dy !== 'number' || !Number.isInteger(dy) || dy < -1 || dy > 1) return false;
  if (dx === 0 && dy === 0) return false;
  return true;
}

/**
 * Validate that a value is a last-move object or null.
 * @param {*} v
 * @returns {boolean}
 */
function isLast(v) {
  if (v === null) return true;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  if (v.kind !== 'move' && v.kind !== 'attack') return false;
  const { dx, dy, at, reach } = v;
  if (!isDirection(dx, dy)) return false;
  if (typeof at !== 'number' || !Number.isInteger(at) || at < 0) return false;
  if (reach !== undefined) {
    if (typeof reach !== 'number' || !Number.isInteger(reach) || reach < 1 || reach > 9) return false;
  }
  const keys = Object.keys(v);
  if (!keys.includes('kind') || !keys.includes('dx') || !keys.includes('dy') || !keys.includes('at')) return false;
  if (keys.length > 5) return false;
  if (keys.length === 5 && !keys.includes('reach')) return false;
  return true;
}

/**
 * Validate that a value is an aim object {dx, dy} forming a direction.
 * @param {*} v
 * @returns {boolean}
 */
function isAim(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const { dx, dy } = v;
  if (!isDirection(dx, dy)) return false;
  const keys = Object.keys(v);
  if (keys.length !== 2 || !keys.includes('dx') || !keys.includes('dy')) return false;
  return true;
}

/**
 * Actor class: a creature on the floor: the hero or a monster. Immutable.
 */
class Actor {
  constructor({ id, kind, pos, stats, ready, held, facing, last, aim, slow, mode, size, small }) {
    this.id = id;
    this.kind = kind;
    this.pos = pos;
    this.stats = stats;
    this.ready = ready;
    this.held = held;
    this.facing = facing;
    this.last = last;
    this.aim = aim;
    this.slow = slow;
    this.mode = mode;
    this.size = size;
    this.small = small;
  }

  covers(x, y) {
    if (typeof x !== 'number' || !Number.isInteger(x)) return false;
    if (typeof y !== 'number' || !Number.isInteger(y)) return false;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.pos.x + i === x && this.pos.y + j === y) {
          return true;
        }
      }
    }
    return false;
  }

  cells() {
    const result = [];
    for (let j = 0; j < this.size; j++) {
      for (let i = 0; i < this.size; i++) {
        result.push(pointShape.of(this.pos.x + i, this.pos.y + j));
      }
    }
    return result;
  }

  with(changes) {
    const c = changes || {};
    return of({
      id: this.id,
      kind: this.kind,
      pos: 'pos' in c ? c.pos : this.pos,
      stats: 'stats' in c ? c.stats : this.stats,
      ready: 'ready' in c ? c.ready : this.ready,
      held: 'held' in c ? c.held : this.held,
      facing: 'facing' in c ? c.facing : this.facing,
      last: 'last' in c ? c.last : this.last,
      aim: 'aim' in c ? c.aim : this.aim,
      slow: 'slow' in c ? c.slow : this.slow,
      mode: 'mode' in c ? c.mode : this.mode,
      size: 'size' in c ? c.size : this.size,
      small: 'small' in c ? c.small : this.small,
    });
  }
}

/**
 * Create an actor.
 * @param {{id: number, kind: string, pos: point, stats: stats, ready?: number, held?: number, facing?: string, last?: object, aim?: {dx: number, dy: number}, slow?: number, mode?: string, size?: number, small?: boolean}} input
 * @returns {object} a frozen actor
 */
export function of({ id, kind, pos, stats, ready = 0, held = 0, facing = FACING_RIGHT, last = null, aim = {dx: 1, dy: 0}, slow = 0, mode = MODE_ROAM, size = 1, small = false }) {
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
  if (!isAim(aim)) {
    throw new TypeError('actor aim must be a direction {dx, dy}');
  }
  if (typeof slow !== 'number' || !Number.isInteger(slow) || slow < 0 || slow > 3) {
    throw new TypeError('actor slow must be an integer from 0 to 3');
  }
  if (mode !== MODE_ROAM && mode !== MODE_GUARD && mode !== MODE_DORMANT) {
    throw new TypeError('actor mode must be roam, guard or dormant');
  }
  if (size !== 1 && size !== 2 && size !== 3) {
    throw new TypeError('actor size must be 1, 2 or 3');
  }
  if (typeof small !== 'boolean') {
    throw new TypeError('actor small must be a boolean');
  }

  // hero-only limits
  if (kind === 'hero') {
    if (size !== 1) {
      throw new TypeError('hero size must be 1');
    }
    if (mode !== MODE_ROAM) {
      throw new TypeError('hero mode must be roam');
    }
  }

  const frozenLast = last === null ? null : Object.freeze({ kind: last.kind, dx: last.dx, dy: last.dy, at: last.at, reach: last.reach !== undefined ? last.reach : 1 });
  const frozenAim = Object.freeze({ dx: aim.dx, dy: aim.dy });
  const actor = new Actor({ id, kind, pos, stats, ready, held, facing, last: frozenLast, aim: frozenAim, slow, mode, size, small });
  return Object.freeze(actor);
}

/**
 * The way a creature looks after a move, attack or face toward a direction.
 * @param {number} dx
 * @param {number} dy
 * @returns {string} 'left' or 'right'
 */
export function facingFor(dx, dy) {
  if (!isDirection(dx, dy)) {
    throw new TypeError('facingFor dx, dy must be a direction');
  }
  if (dx === -1) return FACING_LEFT;
  if (dx === 1) return FACING_RIGHT;
  // dx === 0
  if (dy === 1) return FACING_LEFT;  // down
  if (dy === -1) return FACING_RIGHT; // up
  throw new TypeError('facingFor dx, dy must be a direction');
}
