// The call site for hud: forwards to its surface, nothing else.
// hud's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/hud/index.mjs";

// __nirnroot_begin__ lines
// `lines(world, me) -> array of strings`. First the status line of `me`'s hero, `<name>   HP <hp>/<maxHp>   ATK <attack>   DEF <defense>   Gold <gold>   <where>` (three spaces between the parts; ` (fallen)` after the HP part of a hero not alive; `   MP <magicPower>   MR <magicResist>` right after the DEF part when its `magicPower` is above 1 or its `magicResist` above 0, and not otherwise; `   Slowed <slow>` at the end while its actor's `slow` is above 0, then `   Cursed <curse>` while its `curse` is above 0), or `Watching   Gold <gold>   <where>` with no hero of that name; `<where>` is `Level <n>/25` on a dungeon floor (`n` `level.number(depth)`), `Shop` on a shop and `Lair` on a lair (shops and lairs have no number); then the party line, `Party: ` and each hero in order as `<name> <hp>/<maxHp>`, or `<name> fallen` for one not alive, joined by `, ` (`Party: none` with no heroes); then the last two lines of the world's log, oldest first (fewer when the log is shorter).
// __nirnroot_end__
export function lines(...args) {
  return target.lines(...args);
}

// __nirnroot_begin__ draw
// `draw(ctx, x, y, width, height, world, me)`. Draws the panel for the player `me` into the rectangle (`x`, `y`, `width`, `height`) of the 2D context `ctx`, and nothing outside it (it clips to it). `x`, `y` integers, `width` and `height` integers of 1 or more, `me` a string; anything else, or a `world` that isn't one, throws a `TypeError`.
// __nirnroot_end__
export function draw(...args) {
  return target.draw(...args);
}
