// level: an API Shape, the game's 33 depths as themes, shops and lairs.

export const MAX_DEPTH = 33;

export const MAX_LEVEL = 25;

export const THEMES = Object.freeze(['dungeon', 'frozen', 'arid', 'temple', 'magma', 'interior']);

export const DUNGEON_THEMES = Object.freeze(THEMES.slice(0, 5));

function validateDepth(depth) {
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) {
    throw new TypeError(`depth must be an integer from 1 to ${MAX_DEPTH}`);
  }
}

function computeTier(depth) {
  return Math.floor((depth - 1) / 7);
}

function computeStage(depth) {
  return (depth - 1) % 7 + 1;
}

export function tier(depth) {
  validateDepth(depth);
  return computeTier(depth);
}

export function stage(depth) {
  validateDepth(depth);
  return computeStage(depth);
}

export function kind(depth) {
  validateDepth(depth);
  const s = computeStage(depth);
  if (s === 6) return 'interior';
  if (s === 7) return 'boss';
  return 'dungeon';
}

export function theme(depth) {
  validateDepth(depth);
  const s = computeStage(depth);
  if (s === 6) return 'interior';
  return DUNGEON_THEMES[computeTier(depth)];
}

export function blend(depth) {
  validateDepth(depth);
  if (computeStage(depth) !== 7) return null;
  const t = computeTier(depth);
  return Object.freeze([DUNGEON_THEMES[t], DUNGEON_THEMES[t + 1]]);
}

export function round(depth) {
  validateDepth(depth);
  const s = computeStage(depth);
  if (s === 6 || s === 7) return computeTier(depth) + 1;
  return 0;
}

export function number(depth) {
  validateDepth(depth);
  const s = computeStage(depth);
  if (s === 6 || s === 7) return 0;
  return computeTier(depth) * 5 + s;
}

export function label(depth) {
  validateDepth(depth);
  const s = computeStage(depth);
  if (s === 6) return 'Shop';
  if (s === 7) return 'Lair';
  return `Level ${number(depth)}`;
}
