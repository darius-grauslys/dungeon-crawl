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
  if (typeof v.magic !== 'number' || !Number.isInteger(v.magic)) return false;
  if (typeof v.magicPower !== 'number' || !Number.isInteger(v.magicPower)) return false;
  if (typeof v.magicResist !== 'number' || !Number.isInteger(v.magicResist)) return false;
  if (v.maxHp < 1) return false;
  if (v.hp < 0 || v.hp > v.maxHp) return false;
  if (v.attack < 0 || v.defense < 0) return false;
  if (v.range < 1 || v.range > 9) return false;
  if (v.magic < 0) return false;
  if (v.magicPower < 1) return false;
  if (v.magicResist < 0) return false;
  if (Object.keys(v).length !== 8) return false;
  const s = statsShape.of({ hp: v.hp, maxHp: v.maxHp, attack: v.attack, defense: v.defense, range: v.range, magic: v.magic, magicPower: v.magicPower, magicResist: v.magicResist });
  return s.hp === v.hp && s.maxHp === v.maxHp && s.attack === v.attack && s.defense === v.defense && s.range === v.range && s.magic === v.magic && s.magicPower === v.magicPower && s.magicResist === v.magicResist;
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
  if (v.kind !== 'move' && v.kind !== 'attack' && v.kind !== 'lunge') return false;
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
 * Validate that a value is a gesture object or null.
 * @param {*} v
 * @returns {boolean}
 */
function isGesture(v) {
  if (v === null) return true;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  if (v.kind !== 'use' && v.kind !== 'power') return false;
  const { at } = v;
  if (typeof at !== 'number' || !Number.isInteger(at) || at < 0) return false;
  const keys = Object.keys(v);
  if (keys.length !== 2 || !keys.includes('kind') || !keys.includes('at')) return false;
  return true;
}

/**
 * Validate that a value is a chant object or null.
 * @param {*} v
 * @returns {boolean}
 */
function isChant(v) {
  if (v === null) return true;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  if (v.kind !== 'haste' && v.kind !== 'summon') return false;
  const { at, until } = v;
  if (typeof at !== 'number' || !Number.isInteger(at) || at < 0) return false;
  if (typeof until !== 'number' || !Number.isInteger(until) || until < 0) return false;
  if (until < at) return false;
  const keys = Object.keys(v);
  if (keys.length !== 3 || !keys.includes('kind') || !keys.includes('at') || !keys.includes('until')) return false;
  return true;
}

/**
 * Validate that a value is a fuse object or null.
 * @param {*} v
 * @returns {boolean}
 */
function isFuse(v) {
  if (v === null) return true;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const { at } = v;
  if (typeof at !== 'number' || !Number.isInteger(at) || at < 0) return false;
  const keys = Object.keys(v);
  if (keys.length !== 1 || !keys.includes('at')) return false;
  return true;
}

/**
 * Validate that a value is an air object or null.
 * @param {*} v
 * @returns {boolean}
 */
function isAir(v) {
  if (v === null) return true;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  if (v.phase !== 'crouch' && v.phase !== 'rise' && v.phase !== 'aloft' && v.phase !== 'drop') return false;
  const { at } = v;
  if (typeof at !== 'number' || !Number.isInteger(at) || at < 0) return false;
  const keys = Object.keys(v);
  if (keys.length !== 2 || !keys.includes('phase') || !keys.includes('at')) return false;
  return true;
}

/**
 * Validate that a value is a flung object or null.
 * @param {*} v
 * @returns {boolean}
 */
function isFlung(v) {
  if (v === null) return true;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const { x, y, at } = v;
  if (typeof x !== 'number' || !Number.isInteger(x) || x < 0) return false;
  if (typeof y !== 'number' || !Number.isInteger(y) || y < 0) return false;
  if (typeof at !== 'number' || !Number.isInteger(at) || at < 0) return false;
  const keys = Object.keys(v);
  if (keys.length !== 3 || !keys.includes('x') || !keys.includes('y') || !keys.includes('at')) return false;
  return true;
}

/**
 * Actor class: a creature on the floor: the hero or a monster. Immutable.
 */
class Actor {
  constructor({ id, kind, pos, stats, ready, held, facing, last, aim, slow, mode, size, small, gesture, curse, haste, chant, cooldown, fuse, air, flung }) {
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
    this.gesture = gesture;
    this.curse = curse;
    this.haste = haste;
    this.chant = chant;
    this.cooldown = cooldown;
    this.fuse = fuse;
    this.air = air;
    this.flung = flung;
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
    // kind: never to or from hero
    if ('kind' in c) {
      const newKind = c.kind;
      if (this.kind === 'hero' || newKind === 'hero') {
        throw new TypeError('with kind cannot be or be to hero');
      }
      if (!bestiaryShape.KINDS.includes(newKind)) {
        throw new TypeError('with kind must be a monster kind');
      }
    }
    return of({
      id: this.id,
      kind: 'kind' in c ? c.kind : this.kind,
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
      gesture: 'gesture' in c ? c.gesture : this.gesture,
      curse: 'curse' in c ? c.curse : this.curse,
      haste: 'haste' in c ? c.haste : this.haste,
      chant: 'chant' in c ? c.chant : this.chant,
      cooldown: 'cooldown' in c ? c.cooldown : this.cooldown,
      fuse: 'fuse' in c ? c.fuse : this.fuse,
      air: 'air' in c ? c.air : this.air,
      flung: 'flung' in c ? c.flung : this.flung,
    });
  }
}

/**
 * Create an actor.
 * @param {{id: number, kind: string, pos: point, stats: stats, ready?: number, held?: number, facing?: string, last?: object, aim?: {dx: number, dy: number}, slow?: number, mode?: string, size?: number, small?: boolean, curse?: number, haste?: number, chant?: object|null, cooldown?: number, fuse?: object|null}} input
 * @returns {object} a frozen actor
 */
export function of({ id, kind, pos, stats, ready = 0, held = 0, facing = FACING_RIGHT, last = null, aim = {dx: 1, dy: 0}, slow = 0, mode = MODE_ROAM, size = 1, small = false, gesture = null, curse = 0, haste = 0, chant = null, cooldown = 0, fuse = null, air = null, flung = null }) {
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
  if (!isGesture(gesture)) {
    throw new TypeError('actor gesture must be null or a {kind, at} with kind use or power and at an integer of 0 or more');
  }
  if (typeof curse !== 'number' || !Number.isInteger(curse) || curse < 0 || curse > 3) {
    throw new TypeError('actor curse must be an integer from 0 to 3');
  }
  if (typeof haste !== 'number' || !Number.isInteger(haste) || haste < 0 || haste > 3) {
    throw new TypeError('actor haste must be an integer from 0 to 3');
  }
  if (!isChant(chant)) {
    throw new TypeError('actor chant must be null or a frozen {kind, at, until} with kind haste or summmon and until at least at');
  }
  if (typeof cooldown !== 'number' || !Number.isInteger(cooldown) || cooldown < 0) {
    throw new TypeError('actor cooldown must be an integer of 0 or more');
  }
  if (!isFuse(fuse)) {
    throw new TypeError('actor fuse must be null or a frozen {at} with at an integer of 0 or more');
  }
  if (!isAir(air)) {
    throw new TypeError('actor air must be null or a frozen {phase, at} with phase crouch, rise, aloft or drop and at an integer of 0 or more');
  }
  if (!isFlung(flung)) {
    throw new TypeError('actor flung must be null or a frozen {x, y, at} with x, y, at integers of 0 or more');
  }

  // hero-only limits
  if (kind === 'hero') {
    if (size !== 1) {
      throw new TypeError('hero size must be 1');
    }
    if (mode !== MODE_ROAM) {
      throw new TypeError('hero mode must be roam');
    }
    if (haste !== 0) {
      throw new TypeError('hero haste must be 0');
    }
    if (cooldown !== 0) {
      throw new TypeError('hero cooldown must be 0');
    }
    if (chant !== null) {
      throw new TypeError('hero chant must be null');
    }
    if (fuse !== null) {
      throw new TypeError('hero fuse must be null');
    }
    if (air !== null) {
      throw new TypeError('hero air must be null');
    }
    if (flung !== null) {
      throw new TypeError('hero flung must be null');
    }
  }

  const frozenLast = last === null ? null : Object.freeze({ kind: last.kind, dx: last.dx, dy: last.dy, at: last.at, reach: last.reach !== undefined ? last.reach : 1 });
  const frozenAim = Object.freeze({ dx: aim.dx, dy: aim.dy });
  const frozenGesture = gesture === null ? null : Object.freeze({ kind: gesture.kind, at: gesture.at });
  const frozenChant = chant === null ? null : Object.freeze({ kind: chant.kind, at: chant.at, until: chant.until });
  const frozenFuse = fuse === null ? null : Object.freeze({ at: fuse.at });
  const frozenAir = air === null ? null : Object.freeze({ phase: air.phase, at: air.at });
  const frozenFlung = flung === null ? null : Object.freeze({ x: flung.x, y: flung.y, at: flung.at });
  const actor = new Actor({ id, kind, pos, stats, ready, held, facing, last: frozenLast, aim: frozenAim, slow, mode, size, small, gesture: frozenGesture, curse, haste, chant: frozenChant, cooldown, fuse: frozenFuse, air: frozenAir, flung: frozenFlung });
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
