// The call site for atlas: forwards to its surface, nothing else.
// atlas's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/atlas/index.mjs";

// __nirnroot_begin__ load
// `load(base) -> promise`. `base` a URL prefix ending in `/` (the page's is `/assets/`); each sheet is fetched from `base` plus its path in the table. Resolves, with nothing, once all twenty are loaded and keyed; rejects, with an `Error` whose message contains the sheet's path, as soon as one fails to load. A later `load` replaces what an earlier one loaded once it resolves.
// __nirnroot_end__
export function load(...args) {
  return target.load(...args);
}

// __nirnroot_begin__ sprite
// `sprite(name) -> sprite`. The `sprite` for a name of the table: its `image` the keyed sheet (a canvas), its rectangle the table's, 16 by 16. Before a `load` has resolved, answers `null`. A name not in the table throws a `TypeError`, loaded or not.
// __nirnroot_end__
export function sprite(...args) {
  return target.sprite(...args);
}

// __nirnroot_begin__ tile
// `tile(theme, name) -> sprite`. The `sprite` of the terrain tile `name` (`floor`, `stairs`, or `wall-0` to `wall-15`) of the theme `theme` (one of the six of the themes' table), as that table says: its `image` the keyed sheet, 16 by 16. Before a `load` has resolved, answers `null`. A theme or a name not of those throws a `TypeError`, loaded or not.
// __nirnroot_end__
export function tile(...args) {
  return target.tile(...args);
}

// __nirnroot_begin__ pose
// `pose(name, anim, frame, look) -> sprite`. A frame of a creature's animation, as **Animations** says: `name` `hero` or a monster's; `anim` one of that creature's animations (a monster: `idle`; `hero`: `idle`, `sleep`, `debuff`, `power_up`, `stun`); `frame` an integer from 0 to the animation's count less 1; `look` (left out: `{colour: 0, group: 0}`, used only for `hero`) `{colour, group}`, integers from 0 to 3 and from 0 to 5. Its `image` the keyed sheet, 16 by 16. Before a `load` has resolved, answers `null`. Anything else throws a `TypeError`, loaded or not.
// __nirnroot_end__
export function pose(...args) {
  return target.pose(...args);
}

// __nirnroot_begin__ frames
// `frames(name, anim) -> integer`. How many frames the animation has (a monster's `idle` 3; the hero's as the table says). A name or an animation not of those throws a `TypeError`.
// __nirnroot_end__
export function frames(...args) {
  return target.frames(...args);
}

// __nirnroot_begin__ names
// `names() -> array`. The fifty-seven names, in the table's order, a fresh array each call.
// __nirnroot_end__
export function names(...args) {
  return target.names(...args);
}
