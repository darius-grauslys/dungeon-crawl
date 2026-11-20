# hud

The status panel under the map: the hero's hit points as a bar, the
numbers that matter, and the latest lines of the log. Runs in a browser
(it draws on a 2D context).

The panel's look:

- background rgb(40, 26, 34), filling the panel's rectangle;
- the hit-point bar at the panel's left plus 8 and top plus 8, 200 wide
  and 12 high: its left `Math.round(200 * hp / maxHp)` pixels rgb(200, 40, 40),
  the rest rgb(60, 20, 20);
- the lines (below) in rgb(230, 220, 200), `16px monospace`, the first
  with its baseline at the panel's top plus 44, each next 22 lower, from
  the panel's left plus 8. Lines that would fall below the panel are not
  drawn.

# API Shapes:
- [shape:world](../../shapes/world.md)

# Functions:
## Function - lines:
`lines(world) -> array of strings`. First the status line, `HP <hp>/<maxHp>   ATK <attack>   DEF <defense>   Gold <gold>   Depth <depth>/5` (three spaces between the parts), then the last three lines of the world's log, oldest first (fewer when the log is shorter).

## Function - draw:
`draw(ctx, x, y, width, height, world)`. Draws the panel into the rectangle (`x`, `y`, `width`, `height`) of the 2D context `ctx`, and nothing outside it (it clips to it). `x`, `y` integers, `width` and `height` integers of 1 or more; anything else, or a `world` that isn't one, throws a `TypeError`.

# Intrinsics:
## Intrinsic - lines:
For a world with the hero at 18 of 24 hit points, attack 4, defense 1, gold 7, depth 2 and the log `['a', 'b', 'c', 'd']`, `lines` is `['HP 18/24   ATK 4   DEF 1   Gold 7   Depth 2/5', 'b', 'c', 'd']`; with the log `['a']`, the status line and `'a'`.

## Intrinsic - bar:
On an 800 by 600 canvas filled with pure green, `draw(ctx, 0, 480, 800, 120, w)` with the hero at 12 of 24: the pixel (58, 494) is rgb(200, 40, 40) and (158, 494) is rgb(60, 20, 20); at 24 of 24, (206, 494) is rgb(200, 40, 40). The pixel (4, 476), outside the panel, is still pure green, and (796, 596) is rgb(40, 26, 34).

## Intrinsic - refuses:
`draw(ctx, 0, 0, 0, 10, w)`, `draw(ctx, 0.5, 0, 10, 10, w)` and `draw(ctx, 0, 0, 10, 10, {})` throw a `TypeError`.
