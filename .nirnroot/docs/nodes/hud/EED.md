# hud

The status panel under the map: the player's hit points as a bar, the
numbers that matter, the party, and the latest lines of the log. Runs in
a browser (it draws on a 2D context).

The panel's look:

- background rgb(40, 26, 34), filling the panel's rectangle;
- the hit-point bar of `me`'s hero at the panel's left plus 8 and top
  plus 8, 200 wide and 12 high: its left `Math.round(200 * hp / maxHp)`
  pixels rgb(200, 40, 40), the rest rgb(60, 20, 20) (all of it with no
  hero of that name);
- the lines (below) in rgb(230, 220, 200), `16px monospace`, the first
  with its baseline at the panel's top plus 44, each next 22 lower, from
  the panel's left plus 8. Lines that would fall below the panel are not
  drawn.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:level](../../shapes/level.md)

# Functions:
## Function - lines:
`lines(world, me) -> array of strings`. First the status line of `me`'s hero, `<name>   HP <hp>/<maxHp>   ATK <attack>   DEF <defense>   Gold <gold>   <where>` (three spaces between the parts; ` (fallen)` after the HP part of a hero not alive; `   MP <magicPower>   MR <magicResist>` right after the DEF part when its `magicPower` is above 1 or its `magicResist` above 0, and not otherwise; `   Slowed <slow>` at the end while its actor's `slow` is above 0), or `Watching   Gold <gold>   <where>` with no hero of that name; `<where>` is `Level <n>/25` on a dungeon floor (`n` `level.number(depth)`), `Shop` on a shop and `Lair` on a lair (shops and lairs have no number); then the party line, `Party: ` and each hero in order as `<name> <hp>/<maxHp>`, or `<name> fallen` for one not alive, joined by `, ` (`Party: none` with no heroes); then the last two lines of the world's log, oldest first (fewer when the log is shorter).

## Function - draw:
`draw(ctx, x, y, width, height, world, me)`. Draws the panel for the player `me` into the rectangle (`x`, `y`, `width`, `height`) of the 2D context `ctx`, and nothing outside it (it clips to it). `x`, `y` integers, `width` and `height` integers of 1 or more, `me` a string; anything else, or a `world` that isn't one, throws a `TypeError`.

# Intrinsics:
## Intrinsic - lines:
For a world with `Ann` at 18 of 24 hit points, attack 4, defense 1, and `Bob` not alive (0 of 28), gold 7, depth 2 and the log `['a', 'b', 'c', 'd']`: `lines(w, 'Ann')` is `['Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25', 'Party: Ann 18/24, Bob fallen', 'c', 'd']`; `lines(w, 'Bob')[0]` is `'Bob   HP 0/28 (fallen)   ATK 4   DEF 1   Gold 7   Level 2/25'`; `lines(w, 'Eve')[0]` is `'Watching   Gold 7   Level 2/25'`; with the log `['a']`, three lines, the last `'a'`. At depth 9, `lines(w, 'Ann')[0]` ends `Level 7/25`; at depth 13, `Gold 7   Shop`; at depth 14, `Gold 7   Lair`. With Ann's `slow` 2, `lines(w, 'Ann')[0]` is `'Ann   HP 18/24   ATK 4   DEF 1   Gold 7   Level 2/25   Slowed 2'`. With Ann's `magicPower` 2 (and `magicResist` 0), it is `'Ann   HP 18/24   ATK 4   DEF 1   MP 2   MR 0   Gold 7   Level 2/25'`; with `magicPower` 1 and `magicResist` 1, `'Ann   HP 18/24   ATK 4   DEF 1   MP 1   MR 1   Gold 7   Level 2/25'`.

## Intrinsic - bar:
On an 800 by 600 canvas filled with pure green, `draw(ctx, 0, 480, 800, 120, w, 'Ann')` with Ann at 12 of 24: the pixel (58, 494) is rgb(200, 40, 40) and (158, 494) is rgb(60, 20, 20); at 24 of 24, (206, 494) is rgb(200, 40, 40). The pixel (4, 476), outside the panel, is still pure green, and (796, 596) is rgb(40, 26, 34). For `'Eve'` (no such hero), (58, 494) is rgb(60, 20, 20).

## Intrinsic - refuses:
`draw(ctx, 0, 0, 0, 10, w, 'Ann')`, `draw(ctx, 0.5, 0, 10, 10, w, 'Ann')`, `draw(ctx, 0, 0, 10, 10, {}, 'Ann')` and `draw(ctx, 0, 0, 10, 10, w, 5)` throw a `TypeError`.
