// bestiary: an API Shape, the monster kinds' table and groups.

const TABLE = [
  { kind: 'bat', group: 'vermin', hp: 3, attack: 2, defense: 0, magic: 0, magicPower: 1, range: 1, slows: false, reach: 9, step: 400, strike: 600, size: 1 },
  { kind: 'slime', group: 'vermin', hp: 6, attack: 2, defense: 1, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'snake', group: 'vermin', hp: 5, attack: 3, defense: 0, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'skeleton', group: 'undead', hp: 9, attack: 4, defense: 2, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'archer', group: 'undead', hp: 7, attack: 3, defense: 1, magic: 0, magicPower: 1, range: 4, slows: false, reach: 7, step: 400, strike: 700, size: 1 },
  { kind: 'blue-slime', group: 'vermin', hp: 6, attack: 2, defense: 1, magic: 0, magicPower: 1, range: 1, slows: true, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'blue-snake', group: 'vermin', hp: 5, attack: 3, defense: 0, magic: 0, magicPower: 1, range: 1, slows: true, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'beetle', group: 'vermin', hp: 8, attack: 4, defense: 3, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'mummy', group: 'undead', hp: 12, attack: 5, defense: 2, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 600, strike: 600, size: 1 },
  { kind: 'cultist', group: 'human', hp: 7, attack: 5, defense: 1, magic: 8, magicPower: 1, range: 4, slows: false, reach: 7, step: 400, strike: 700, size: 1 },
  { kind: 'spider', group: 'vermin', hp: 9, attack: 5, defense: 1, magic: 0, magicPower: 1, range: 1, slows: false, reach: 8, step: 300, strike: 600, size: 1 },
  { kind: 'ghost', group: 'undead', hp: 10, attack: 6, defense: 3, magic: 0, magicPower: 1, range: 1, slows: false, reach: 7, step: 400, strike: 600, size: 1 },
  { kind: 'reaper', group: 'undead', hp: 14, attack: 7, defense: 3, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'worm', group: 'vermin', hp: 9, attack: 5, defense: 2, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'fire-slime', group: 'vermin', hp: 10, attack: 5, defense: 3, magic: 0, magicPower: 1, range: 1, slows: false, reach: 6, step: 400, strike: 600, size: 1 },
  { kind: 'imp', group: 'demon', hp: 12, attack: 6, defense: 3, magic: 0, magicPower: 1, range: 1, slows: false, reach: 7, step: 300, strike: 600, size: 1 },
  { kind: 'demon', group: 'demon', hp: 16, attack: 7, defense: 4, magic: 0, magicPower: 1, range: 1, slows: false, reach: 7, step: 400, strike: 600, size: 1 },
  { kind: 'golem', group: 'construct', hp: 40, attack: 12, defense: 12, magic: 6, magicPower: 2, range: 1, slows: false, reach: 30, step: 1600, strike: 1000, size: 3 },
];

export const KINDS = Object.freeze(TABLE.map((row) => row.kind));

export const GROUPS = Object.freeze(['human', 'undead', 'vermin', 'demon', 'construct']);

export const SLIMES = Object.freeze(['slime', 'blue-slime', 'fire-slime']);

function validateKind(kind) {
  if (typeof kind !== 'string') {
    throw new TypeError(`invalid kind: ${String(kind)}`);
  }
}

const ENTRY_MAP = new Map();
for (const row of TABLE) {
  ENTRY_MAP.set(row.kind, Object.freeze({ ...row }));
}

export function entry(kind) {
  validateKind(kind);
  const row = ENTRY_MAP.get(kind);
  if (row === undefined) {
    throw new TypeError(`unknown kind: ${String(kind)}`);
  }
  return row;
}

export function group(kind) {
  validateKind(kind);
  if (kind === 'hero') {
    return 'human';
  }
  const row = ENTRY_MAP.get(kind);
  if (row === undefined) {
    throw new TypeError(`unknown kind: ${String(kind)}`);
  }
  return row.group;
}

export function hostile(a, b) {
  validateKind(a);
  validateKind(b);
  const isHeroA = a === 'hero';
  const isHeroB = b === 'hero';
  if (isHeroA !== isHeroB) {
    return true;
  }
  const groupA = group(a);
  const groupB = group(b);
  const isDemonA = groupA === 'demon';
  const isVminA = groupA === 'vermin';
  const isDemonB = groupB === 'demon';
  const isVminB = groupB === 'vermin';
  return (isDemonA && isVminB) || (isDemonB && isVminA);
}

export function flees(a, b) {
  validateKind(a);
  validateKind(b);
  return group(a) === 'vermin' && group(b) === 'demon';
}
