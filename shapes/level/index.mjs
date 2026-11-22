// level: an API Shape, the game's 29 depths as themes and shops.

export const MAX_DEPTH = 29;

export const THEMES = Object.freeze(['dungeon', 'frozen', 'arid', 'temple', 'magma', 'interior']);

export const DUNGEON_THEMES = Object.freeze(THEMES.slice(0, 5));

function validateDepth(depth) {
  if (typeof depth !== 'number' || !Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) {
    throw new TypeError(`depth must be an integer from 1 to ${MAX_DEPTH}`);
  }
}

export function kind(depth) {
  validateDepth(depth);
  return depth % 6 === 0 ? 'interior' : 'dungeon';
}

export function theme(depth) {
  validateDepth(depth);
  if (depth % 6 === 0) return 'interior';
  return DUNGEON_THEMES[Math.floor((depth - 1) / 6)];
}

export function tier(depth) {
  validateDepth(depth);
  return Math.floor((depth - 1) / 6);
}

export function stage(depth) {
  validateDepth(depth);
  return (depth - 1) % 6 + 1;
}

export function round(depth) {
  validateDepth(depth);
  return depth % 6 === 0 ? depth / 6 : 0;
}
