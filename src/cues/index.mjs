// cues: a Node, which sounds a player hears when the world changes.

import * as cueShape from '../../shapes/cue/index.mjs';

function isWorld(v) {
  if (!v || typeof v !== 'object' || !Object.isFrozen(v)) return false;
  if (typeof v.depth !== 'number' || !Number.isInteger(v.depth)) return false;
  if (typeof v.gold !== 'number' || !Number.isInteger(v.gold)) return false;
  if (!Array.isArray(v.heroes)) return false;
  if (!Array.isArray(v.monsters)) return false;
  if (!Array.isArray(v.items)) return false;
  if (!Array.isArray(v.log)) return false;
  if (v.visible === undefined || v.grid === undefined || v.explored === undefined || v.entry === undefined) return false;
  return true;
}

function lastEqual(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.kind === b.kind && a.dx === b.dx && a.dy === b.dy && a.at === b.at && a.reach === b.reach;
}

function gestureEqual(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.kind === b.kind && a.at === b.at;
}

function monsterSeen(actor, mask) {
  const cells = actor.cells();
  for (let i = 0; i < cells.length; i++) {
    if (mask.at(cells[i].x, cells[i].y)) return true;
  }
  return false;
}

function computeGain(x, y, next, me) {
  let hero = null;
  for (let i = 0; i < next.heroes.length; i++) {
    if (next.heroes[i].name === me) { hero = next.heroes[i]; break; }
  }
  if (!hero || !hero.alive) return 1;
  const hx = hero.actor.pos.x;
  const hy = hero.actor.pos.y;
  const d = Math.max(Math.abs(x - hx), Math.abs(y - hy));
  return Math.max(0.25, 1 - d / 12);
}

/** `cues(prev, next, me) -> array of cue`. `prev` a `world` or `null`; `next` a `world`; `me` a string. A fresh array of `cue`s, as **What makes a sound** says. Anything else throws a `TypeError`. Neither world is changed. */
export function cues(prev, next, me) {
  if (prev !== null && !isWorld(prev)) {
    throw new TypeError('cues: prev must be a world or null');
  }
  if (!isWorld(next)) {
    throw new TypeError('cues: next must be a world');
  }
  if (typeof me !== 'string') {
    throw new TypeError('cues: me must be a string');
  }

  if (prev === null) return [];

  if (next.depth !== prev.depth) {
    return [cueShape.of({ name: 'stairs', gain: 1 })];
  }

  const prevHeroes = new Map();
  for (let i = 0; i < prev.heroes.length; i++) prevHeroes.set(prev.heroes[i].name, prev.heroes[i]);
  const prevMonsters = new Map();
  for (let i = 0; i < prev.monsters.length; i++) prevMonsters.set(prev.monsters[i].id, prev.monsters[i]);

  const sounds = [];

  for (let i = 0; i < next.heroes.length; i++) {
    const h = next.heroes[i];
    const prevH = prevHeroes.get(h.name);
    const actor = h.actor;
    const gain = computeGain(actor.pos.x, actor.pos.y, next, me);

    if (actor.last !== null) {
      if (prevH === undefined || !lastEqual(actor.last, prevH.actor.last)) {
        let name;
        if (actor.last.kind === 'move') name = 'step';
        else if (actor.last.kind === 'attack') name = actor.last.reach <= 1 ? 'swing' : 'shot';
        sounds.push({ name, gain });
      }
    }

    if (actor.gesture !== null) {
      const prevGesture = prevH ? prevH.actor.gesture : null;
      if (prevH === undefined || !gestureEqual(actor.gesture, prevGesture)) {
        const name = actor.gesture.kind === 'power' ? 'powerup' : 'use';
        sounds.push({ name, gain });
      }
    }

    if (prevH !== undefined && actor.stats.hp < prevH.actor.stats.hp) {
      sounds.push({ name: 'hit', gain });
    }

    if (prevH !== undefined && prevH.alive && !h.alive) {
      sounds.push({ name: 'death', gain });
    }
  }

  for (let i = 0; i < next.monsters.length; i++) {
    const m = next.monsters[i];
    if (!monsterSeen(m, next.visible)) continue;
    const prevM = prevMonsters.get(m.id);
    const actor = m;
    const gain = computeGain(actor.pos.x, actor.pos.y, next, me);

    if (actor.last !== null) {
      if (prevM === undefined || !lastEqual(actor.last, prevM.last)) {
        let name;
        if (actor.last.kind === 'move') name = 'step';
        else if (actor.last.kind === 'attack') name = actor.last.reach <= 1 ? 'swing' : 'shot';
        sounds.push({ name, gain });
      }
    }

    if (actor.gesture !== null) {
      const prevGesture = prevM ? prevM.gesture : null;
      if (prevM === undefined || !gestureEqual(actor.gesture, prevGesture)) {
        const name = actor.gesture.kind === 'power' ? 'powerup' : 'use';
        sounds.push({ name, gain });
      }
    }

    if (prevM !== undefined && actor.stats.hp < prevM.stats.hp) {
      sounds.push({ name: 'hit', gain });
    }
  }

  for (let i = 0; i < prev.monsters.length; i++) {
    const m = prev.monsters[i];
    let missing = true;
    for (let j = 0; j < next.monsters.length; j++) {
      if (next.monsters[j].id === m.id) { missing = false; break; }
    }
    if (!missing) continue;
    if (!monsterSeen(m, prev.visible)) continue;
    sounds.push({ name: 'death', gain: computeGain(m.pos.x, m.pos.y, next, me) });
  }

  if (next.gold > prev.gold) {
    sounds.push({ name: 'coin', gain: 1 });
  }

  const best = new Map();
  for (let i = 0; i < sounds.length; i++) {
    const s = sounds[i];
    const cur = best.get(s.name);
    if (cur === undefined || s.gain > cur.gain) {
      best.set(s.name, { name: s.name, gain: s.gain });
    }
  }

  const result = [];
  for (let i = 0; i < cueShape.NAMES.length; i++) {
    const name = cueShape.NAMES[i];
    if (best.has(name)) {
      result.push(cueShape.of({ name, gain: best.get(name).gain }));
    }
  }
  return result;
}
