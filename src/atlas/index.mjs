// atlas: loads the game's sprite sheets and answers where each picture is.

import { of } from "../../shapes/sprite/index.mjs";

const TABLE = [
  { name: "wall", sheet: "sheets/dungeon.png", sx: 48, sy: 16 },
  { name: "floor", sheet: "sheets/floor.png", sx: 0, sy: 48 },
  { name: "stairs", sheet: "sheets/dungeon.png", sx: 0, sy: 96 },
  { name: "hero", sheet: "sheets/heroes.png", sx: 0, sy: 0 },
  { name: "skeleton", sheet: "sheets/monsters.png", sx: 0, sy: 0 },
  { name: "slime", sheet: "sheets/monsters.png", sx: 64, sy: 48 },
  { name: "snake", sheet: "sheets/monsters.png", sx: 0, sy: 64 },
  { name: "bat", sheet: "sheets/monsters.png", sx: 128, sy: 0 },
  { name: "demon", sheet: "sheets/monsters.png", sx: 128, sy: 32 },
  { name: "potion", sheet: "sheets/items.png", sx: 64, sy: 0 },
  { name: "gold", sheet: "sheets/items.png", sx: 48, sy: 80 },
  { name: "sword", sheet: "sheets/items.png", sx: 64, sy: 16 },
  { name: "armor", sheet: "sheets/items.png", sx: 64, sy: 48 },
  { name: "archer", sheet: "sheets/monsters.png", sx: 64, sy: 0 },
  { name: "blue-slime", sheet: "sheets/monsters.png", sx: 0, sy: 48 },
  { name: "blue-snake", sheet: "sheets/frozen-monsters.png", sx: 0, sy: 16 },
  { name: "golem", sheet: "sheets/monsters.png", sx: 64, sy: 112 },
  { name: "beetle", sheet: "sheets/arid-monsters.png", sx: 0, sy: 0 },
  { name: "mummy", sheet: "sheets/arid-monsters.png", sx: 0, sy: 48 },
  { name: "cultist", sheet: "sheets/arid-monsters.png", sx: 0, sy: 32 },
  { name: "spider", sheet: "sheets/temple-monsters.png", sx: 128, sy: 16 },
  { name: "ghost", sheet: "sheets/temple-monsters.png", sx: 64, sy: 32 },
  { name: "reaper", sheet: "sheets/temple-monsters.png", sx: 128, sy: 32 },
  { name: "worm", sheet: "sheets/magma-monsters.png", sx: 0, sy: 48 },
  { name: "fire-slime", sheet: "sheets/magma-monsters.png", sx: 64, sy: 48 },
  { name: "imp", sheet: "sheets/magma-monsters.png", sx: 64, sy: 32 },
  { name: "lever", sheet: "sheets/generics.png", sx: 16, sy: 80 },
  { name: "lever-pulled", sheet: "sheets/generics.png", sx: 32, sy: 80 },
  { name: "ring", sheet: "sheets/items.png", sx: 0, sy: 64 },
  { name: "necklace", sheet: "sheets/items.png", sx: 128, sy: 64 },
  { name: "wall-0", sheet: "sheets/dungeon.png", sx: 48, sy: 0 },
  { name: "wall-1", sheet: "sheets/dungeon.png", sx: 0, sy: 32 },
  { name: "wall-2", sheet: "sheets/dungeon.png", sx: 48, sy: 32 },
  { name: "wall-3", sheet: "sheets/dungeon.png", sx: 32, sy: 16 },
  { name: "wall-4", sheet: "sheets/dungeon.png", sx: 16, sy: 32 },
  { name: "wall-5", sheet: "sheets/dungeon.png", sx: 64, sy: 16 },
  { name: "wall-6", sheet: "sheets/dungeon.png", sx: 32, sy: 0 },
  { name: "wall-7", sheet: "sheets/dungeon.png", sx: 0, sy: 16 },
  { name: "wall-8", sheet: "sheets/dungeon.png", sx: 64, sy: 32 },
  { name: "wall-9", sheet: "sheets/dungeon.png", sx: 48, sy: 16 },
  { name: "wall-10", sheet: "sheets/dungeon.png", sx: 48, sy: 0 },
  { name: "wall-11", sheet: "sheets/dungeon.png", sx: 16, sy: 16 },
  { name: "wall-12", sheet: "sheets/dungeon.png", sx: 64, sy: 0 },
  { name: "wall-13", sheet: "sheets/dungeon.png", sx: 16, sy: 0 },
  { name: "wall-14", sheet: "sheets/dungeon.png", sx: 0, sy: 0 },
  { name: "wall-15", sheet: "sheets/dungeon.png", sx: 80, sy: 0 },
];

const _names = TABLE.map((r) => r.name);

/** `names() -> array`. The forty-six names, in the table's order, a fresh array each call. */
export function names() {
  return [..._names];
}

const THEMES = [
  { theme: "dungeon", wallSheet: "sheets/dungeon.png", floorSheet: "sheets/floor.png", floorSx: 0, floorSy: 48, stairsSheet: "sheets/dungeon.png", stairsSx: 0, stairsSy: 96 },
  { theme: "frozen", wallSheet: "sheets/frozen.png", floorSheet: "sheets/frozen-floor.png", floorSx: 0, floorSy: 48, stairsSheet: "sheets/frozen.png", stairsSx: 16, stairsSy: 256 },
  { theme: "arid", wallSheet: "sheets/arid.png", floorSheet: "sheets/arid-floor.png", floorSx: 0, floorSy: 0, stairsSheet: "sheets/arid.png", stairsSx: 0, stairsSy: 352 },
  { theme: "temple", wallSheet: "sheets/temple.png", floorSheet: "sheets/temple-floor.png", floorSx: 0, floorSy: 0, stairsSheet: "sheets/temple.png", stairsSx: 16, stairsSy: 256 },
  { theme: "magma", wallSheet: "sheets/magma.png", floorSheet: "sheets/magma-floor.png", floorSx: 0, floorSy: 0, stairsSheet: "sheets/magma.png", stairsSx: 0, stairsSy: 112 },
  { theme: "interior", wallSheet: "sheets/interior.png", floorSheet: "sheets/interior-floor.png", floorSx: 224, floorSy: 112, stairsSheet: "sheets/dungeon.png", stairsSx: 32, stairsSy: 96 },
];

const _themeIndex = new Map(THEMES.map((t) => [t.theme, t]));

const _tileNames = ["floor", "stairs"];
for (let m = 0; m <= 15; m++) {
  _tileNames.push("wall-" + m);
}

const _SHEETS = [
  "sheets/dungeon.png",
  "sheets/floor.png",
  "sheets/heroes.png",
  "sheets/monsters.png",
  "sheets/items.png",
  "sheets/frozen.png",
  "sheets/frozen-floor.png",
  "sheets/arid.png",
  "sheets/arid-floor.png",
  "sheets/temple.png",
  "sheets/temple-floor.png",
  "sheets/magma.png",
  "sheets/magma-floor.png",
  "sheets/interior.png",
  "sheets/interior-floor.png",
  "sheets/generics.png",
  "sheets/frozen-monsters.png",
  "sheets/arid-monsters.png",
  "sheets/temple-monsters.png",
  "sheets/magma-monsters.png",
];

const MONSTERS = new Set([
  "skeleton", "slime", "snake", "bat", "demon",
  "archer", "blue-slime", "golem", "beetle", "mummy",
  "cultist", "spider", "ghost", "reaper", "worm",
  "fire-slime", "imp", "blue-snake",
]);

const HERO_ANIMS = {
  idle: { count: 3, rows: [[0, [0, 1, 2]]] },
  sleep: { count: 4, rows: [[32, [0, 1]], [48, [0, 1]]] },
  debuff: { count: 4, rows: [[80, [0, 1]], [96, [0, 1]]] },
  power_up: { count: 6, rows: [[128, [0, 1, 2]], [144, [0, 1, 2]]] },
  stun: { count: 5, rows: [[176, [0, 1]], [192, [0, 1, 2]]] },
};

function _heroFrameCoords(anim, frame) {
  const a = HERO_ANIMS[anim];
  let f = frame;
  for (const [r, cols] of a.rows) {
    for (const c of cols) {
      if (f === 0) return { r, c };
      f--;
    }
  }
  throw new TypeError(`atlas: invalid hero frame ${frame}`);
}

let _loadId = 0;
let _sprites = null;
let _tiles = null;

/** `load(base) -> promise`. `base` a URL prefix ending in `/`; each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all twenty are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves. */
export async function load(base) {
  const myId = ++_loadId;

  const promises = _SHEETS.map((sheet) => {
    return new Promise((resolve, reject) => {
      const url = base + sheet;
      const img = new Image();
      let done = false;
      img.onload = () => {
        if (done) return;
        done = true;
        resolve({ sheet, img });
      };
      img.onerror = () => {
        if (done) return;
        done = true;
        reject(new Error("atlas: could not load " + sheet));
      };
      img.src = url;
    }).then(({ sheet, img }) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] === 22 && d[i + 1] === 13 && d[i + 2] === 19) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);
      return { sheet, canvas };
    });
  });

  const results = await Promise.all(promises);

  if (myId !== _loadId) return;

  const sheets = new Map();
  const sprites = new Map();
  const tiles = new Map();
  for (const r of results) {
    sheets.set(r.sheet, r.canvas);
  }
  for (const row of TABLE) {
    const canvas = sheets.get(row.sheet);
    const s = of({ image: canvas, sx: row.sx, sy: row.sy, sw: 16, sh: 16 });
    sprites.set(row.name, s);
  }
  for (const t of THEMES) {
    const wallCanvas = sheets.get(t.wallSheet);
    const floorCanvas = sheets.get(t.floorSheet);
    const stairsCanvas = sheets.get(t.stairsSheet);
    tiles.set(t.theme + "/floor", of({ image: floorCanvas, sx: t.floorSx, sy: t.floorSy, sw: 16, sh: 16 }));
    tiles.set(t.theme + "/stairs", of({ image: stairsCanvas, sx: t.stairsSx, sy: t.stairsSy, sw: 16, sh: 16 }));
    for (let m = 0; m <= 15; m++) {
      const wname = "wall-" + m;
      const wrow = TABLE.find((r) => r.name === wname);
      tiles.set(t.theme + "/" + wname, of({ image: wallCanvas, sx: wrow.sx, sy: wrow.sy, sw: 16, sh: 16 }));
    }
  }
  _sprites = sprites;
  _tiles = tiles;
}

function _inTable(name) {
  return TABLE.some((r) => r.name === name);
}

/** `sprite(name) -> sprite`. The `sprite` for a name of the table: its `image` the keyed sheet (a canvas), its rectangle the table's, 16 by 16. Before a `load` has resolved, answers `null`. A name not in the table throws a `TypeError`, loaded or not. */
export function sprite(name) {
  if (!_inTable(name)) {
    throw new TypeError(`atlas: no sprite named ${name}`);
  }
  if (!_sprites) return null;
  return _sprites.get(name);
}

/** `tile(theme, name) -> sprite`. The `sprite` of the terrain tile `name` (`floor`, `stairs`, or `wall-0` to `wall-15`) of the theme `theme` (one of the six of the themes' table), as that table says: its `image` the keyed sheet, 16 by 16. Before a `load` has resolved, answers `null`. A theme or a name not of those throws a `TypeError`, loaded or not. */
export function tile(theme, name) {
  if (!_themeIndex.has(theme)) {
    throw new TypeError(`atlas: no theme named ${theme}`);
  }
  if (!_tileNames.includes(name)) {
    throw new TypeError(`atlas: no tile named ${name}`);
  }
  if (!_tiles) return null;
  return _tiles.get(theme + "/" + name);
}

/** `frames(name, anim) -> integer`. How many frames the animation has (a monster's `idle` 3; the hero's as the table says). A name or an animation not of those throws a `TypeError`. */
export function frames(name, anim) {
  if (name === "hero") {
    if (!HERO_ANIMS[anim]) {
      throw new TypeError(`atlas: no hero animation ${anim}`);
    }
    return HERO_ANIMS[anim].count;
  }
  if (MONSTERS.has(name)) {
    if (anim !== "idle") {
      throw new TypeError(`atlas: monster ${name} has only idle animation`);
    }
    return 3;
  }
  throw new TypeError(`atlas: no creature named ${name}`);
}

/** `pose(name, anim, frame, look) -> sprite`. A frame of a creature's animation, as **Animations** says: `name` `hero` or a monster's; `anim` one of that creature's animations (a monster: `idle`; `hero`: `idle`, `sleep`, `debuff`, `power_up`, `stun`); `frame` an integer from 0 to the animation's count less 1; `look` (left out: `{colour: 0, group: 0}`, used only for `hero`) `{colour, group}`, integers from 0 to 3 and from 0 to 5. Its `image` the keyed sheet, 16 by 16. Before a `load` has resolved, answers `null`. Anything else throws a `TypeError`, loaded or not. */
export function pose(name, anim, frame, look) {
  const isHero = name === "hero";
  const isMonster = MONSTERS.has(name);
  if (!isHero && !isMonster) {
    throw new TypeError(`atlas: no creature named ${name}`);
  }

  let count;
  if (isHero) {
    if (!HERO_ANIMS[anim]) {
      throw new TypeError(`atlas: no hero animation ${anim}`);
    }
    count = HERO_ANIMS[anim].count;
  } else {
    if (anim !== "idle") {
      throw new TypeError(`atlas: monster ${name} has only idle animation`);
    }
    count = 3;
  }

  if (!Number.isInteger(frame) || frame < 0 || frame >= count) {
    throw new TypeError(`atlas: invalid frame ${frame}`);
  }

  let colour = 0;
  let group = 0;
  if (isHero) {
    const l = look || { colour: 0, group: 0 };
    colour = l.colour;
    group = l.group;
    if (!Number.isInteger(colour) || colour < 0 || colour > 3) {
      throw new TypeError(`atlas: invalid colour ${colour}`);
    }
    if (!Number.isInteger(group) || group < 0 || group > 5) {
      throw new TypeError(`atlas: invalid group ${group}`);
    }
  }

  if (!_sprites) return null;

  if (isHero) {
    const { r, c } = _heroFrameCoords(anim, frame);
    const sx = colour * 64 + 16 * c;
    const sy = group * 240 + r;
    return of({ image: _sprites.get(name).image, sx, sy, sw: 16, sh: 16 });
  } else {
    const entry = TABLE.find((r) => r.name === name);
    const sx = entry.sx + 16 * frame;
    const sy = entry.sy;
    return of({ image: _sprites.get(name).image, sx, sy, sw: 16, sh: 16 });
  }
}
