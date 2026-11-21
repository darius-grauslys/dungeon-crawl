// atlas: loads the game's sprite sheets and answers where each picture is.

import { of } from "../../shapes/sprite/index.mjs";

const TABLE = [
  { name: "wall", sheet: "sheets/dungeon.png", sx: 48, sy: 16 },
  { name: "floor", sheet: "sheets/floor.png", sx: 0, sy: 48 },
  { name: "stairs", sheet: "sheets/dungeon.png", sx: 0, sy: 96 },
  { name: "hero", sheet: "sheets/heroes.png", sx: 0, sy: 0 },
  { name: "skeleton", sheet: "sheets/monsters.png", sx: 0, sy: 0 },
  { name: "slime", sheet: "sheets/monsters.png", sx: 0, sy: 48 },
  { name: "snake", sheet: "sheets/monsters.png", sx: 0, sy: 64 },
  { name: "bat", sheet: "sheets/monsters.png", sx: 128, sy: 0 },
  { name: "demon", sheet: "sheets/monsters.png", sx: 128, sy: 32 },
  { name: "potion", sheet: "sheets/items.png", sx: 64, sy: 0 },
  { name: "gold", sheet: "sheets/items.png", sx: 48, sy: 80 },
  { name: "sword", sheet: "sheets/items.png", sx: 64, sy: 16 },
  { name: "armor", sheet: "sheets/items.png", sx: 64, sy: 48 },
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

/** `names() -> array`. The twenty-nine names, in the table's order, a fresh array each call. */
export function names() {
  return [..._names];
}

let _loadId = 0;
let _sprites = null;

/** `load(base) -> promise`. `base` a URL prefix ending in `/`; each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all five are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves. */
export async function load(base) {
  const myId = ++_loadId;

  const promises = TABLE.map((row) => {
    return new Promise((resolve, reject) => {
      const url = base + row.sheet;
      const img = new Image();
      let done = false;
      img.onload = () => {
        if (done) return;
        done = true;
        resolve({ row, img });
      };
      img.onerror = () => {
        if (done) return;
        done = true;
        reject(new Error("atlas: could not load " + row.sheet));
      };
      img.src = url;
    }).then(({ row, img }) => {
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
      return { row, canvas };
    });
  });

  const results = await Promise.all(promises);

  if (myId !== _loadId) return;

  const sheets = new Map();
  const sprites = new Map();
  for (const r of results) {
    sheets.set(r.row.sheet, r.canvas);
  }
  for (const row of TABLE) {
    const canvas = sheets.get(row.sheet);
    const s = of({ image: canvas, sx: row.sx, sy: row.sy, sw: 16, sh: 16 });
    sprites.set(row.name, s);
  }
  _sprites = sprites;
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
