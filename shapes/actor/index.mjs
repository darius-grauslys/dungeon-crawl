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
 * Create an actor.
 * @param {{id: number, kind: string, pos: point, stats: stats}} input
 * @returns {object} a frozen actor
 */
export function of({ id, kind, pos, stats }) {
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

  const actor = { id, kind, pos, stats };
  actor.with = function (changes) {
    const c = changes || {};
    const newPos = 'pos' in c ? c.pos : pos;
    const newStats = 'stats' in c ? c.stats : stats;
    return of({ id, kind, pos: newPos, stats: newStats });
  };
  return Object.freeze(actor);
}
