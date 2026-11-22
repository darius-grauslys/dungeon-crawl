// save: an API Shape.

import { of as statsOf } from "../stats/index.mjs";

const FORMAT = "crawl-save";
const VERSION = 1;
const MAX_SEED = 4294967295;
const MIN_DEPTH = 1;
const MAX_DEPTH = 33;
const MAX_PLAYERS = 4;

/**
 * Check if a value is a valid name.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isName(value) {
  if (typeof value !== "string") return false;
  if (value.length < 1 || value.length > 16) return false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return false;
  }
  if (value[0] === " " || value[value.length - 1] === " ") return false;
  return true;
}

/**
 * Normalize and validate a players array.
 * @param {any[]} players
 * @returns {{name: string, stats: any}[]}
 */
function normalizePlayers(players) {
  if (!Array.isArray(players)) {
    throw new TypeError("save: players must be an array");
  }
  if (players.length > MAX_PLAYERS) {
    throw new TypeError("save: players must have 0 to 4 entries");
  }

  const normalizedPlayers = [];
  const names = new Set();

  for (const entry of players) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.name !== "string" ||
      entry.stats === undefined
    ) {
      throw new TypeError("save: each player must be {name, stats}");
    }

    if (!isName(entry.name)) {
      throw new TypeError("save: invalid name");
    }

    const s = statsOf(entry.stats);

    if (names.has(entry.name)) {
      throw new TypeError("save: duplicate player name");
    }
    names.add(entry.name);

    normalizedPlayers.push({ name: entry.name, stats: s });
  }

  return normalizedPlayers;
}

/**
 * Create a save.
 * @param {{seed: number, depth: number, players: any[]}} input
 * @returns {Save}
 */
export function of({ seed, depth, players }) {
  if (seed === undefined || depth === undefined || players === undefined) {
    throw new TypeError("save: missing required field");
  }

  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new TypeError("save: seed must be an integer from 0 to 4294967295");
  }

  if (!Number.isInteger(depth) || depth < MIN_DEPTH || depth > MAX_DEPTH) {
    throw new TypeError("save: depth must be an integer from 1 to 33");
  }

  const normalizedPlayers = normalizePlayers(players);

  const frozenPlayers = normalizedPlayers.map((p) =>
    Object.freeze({ name: p.name, stats: p.stats })
  );
  Object.freeze(frozenPlayers);

  const save = new Save(seed, depth, frozenPlayers);
  Object.freeze(save);
  return save;
}

/**
 * Create a save from data.
 * @param {any} data
 * @returns {Save}
 */
export function fromData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new TypeError("save: data must be an object");
  }

  if (data.format !== FORMAT) {
    throw new TypeError("save: invalid format");
  }

  if (data.version !== VERSION) {
    throw new TypeError("save: invalid version");
  }

  return of({ seed: data.seed, depth: data.depth, players: data.players });
}

/**
 * Parse a save from text.
 * @param {string} text
 * @returns {Save}
 */
export function parse(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new TypeError("save: text is not JSON");
  }
  return fromData(data);
}

/**
 * Save class.
 */
export class Save {
  constructor(seed, depth, players) {
    this.seed = seed;
    this.depth = depth;
    this.players = players;
  }

  data() {
    return {
      format: FORMAT,
      version: VERSION,
      seed: this.seed,
      depth: this.depth,
      players: this.players.map((p) => ({
        name: p.name,
        stats: {
          hp: p.stats.hp,
          maxHp: p.stats.maxHp,
          attack: p.stats.attack,
          defense: p.stats.defense,
          range: p.stats.range,
          magic: p.stats.magic,
          magicPower: p.stats.magicPower,
          magicResist: p.stats.magicResist,
        },
      })),
    };
  }

  text() {
    return JSON.stringify(this.data(), null, 2);
  }
}
