// hero: an API Shape, a player in the world: their name, body, pending action and alive state. Immutable.

import * as saveShape from '../save/index.mjs';
import * as intentShape from '../intent/index.mjs';

/**
 * Validate that a value is an intent made by the intent module.
 * @param {*} v
 * @returns {boolean}
 */
function isIntent(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.kind !== 'string' || !intentShape.KINDS.includes(v.kind)) return false;
  if (typeof v.dx !== 'number' || !Number.isInteger(v.dx)) return false;
  if (typeof v.dy !== 'number' || !Number.isInteger(v.dy)) return false;

  if (v.kind === 'move' || v.kind === 'attack') {
    const f = v.kind === 'move' ? intentShape.move : intentShape.attack;
    try {
      const e = f(v.dx, v.dy);
      return e.kind === v.kind && e.dx === v.dx && e.dy === v.dy;
    } catch {
      return false;
    }
  }
  // use or wait: dx and dy must be 0
  if (v.dx !== 0 || v.dy !== 0) return false;
  const e = v.kind === 'use' ? intentShape.use() : intentShape.wait();
  return e.kind === v.kind && e.dx === 0 && e.dy === 0;
}

/**
 * Hero class: a player in the world. Immutable.
 */
class Hero {
  constructor({ name, actor, pending, alive }) {
    this.name = name;
    this.actor = actor;
    this.pending = pending;
    this.alive = alive;
  }

  with(changes) {
    const c = changes || {};
    const newActor = 'actor' in c ? c.actor : this.actor;
    const newPending = 'pending' in c ? c.pending : this.pending;
    const newAlive = 'alive' in c ? c.alive : this.alive;
    return of({ name: this.name, actor: newActor, pending: newPending, alive: newAlive });
  }
}

/**
 * Create a hero.
 * @param {{name: string, actor: object, pending?: object|null, alive?: boolean}} input
 * @returns {object} a frozen hero
 */
export function of({ name, actor, pending = null, alive = true }) {
  if (typeof name !== 'string' || !saveShape.isName(name)) {
    throw new TypeError('hero name must be a valid name');
  }

  if (!actor || typeof actor !== 'object' || !Object.isFrozen(actor)) {
    throw new TypeError('hero actor must be an actor');
  }
  if (actor.kind !== 'hero') {
    throw new TypeError('hero actor must be of kind hero');
  }

  if (pending !== null && !isIntent(pending)) {
    throw new TypeError('hero pending must be an intent or null');
  }

  if (typeof alive !== 'boolean') {
    throw new TypeError('hero alive must be a boolean');
  }

  // A hero that is not alive has 0 hit points; an alive one more than 0.
  const hp = actor.stats.hp;
  if (alive === false && hp !== 0) {
    throw new TypeError('hero not alive must have 0 hit points');
  }
  if (alive === true && hp <= 0) {
    throw new TypeError('hero alive must have more than 0 hit points');
  }

  const hero = new Hero({ name, actor, pending, alive });
  return Object.freeze(hero);
}
