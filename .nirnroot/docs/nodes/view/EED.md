# view

Draws a world onto the page's canvas as one player sees it: the part of
the floor around their hero, tile by tile, the status panel under it, and
a banner while the session is paused. Runs in a browser.

**The focus** of a world for a player's name `me`: the cell of `me`'s hero
if it is alive; else the cell of the first alive hero; else (0, 0).

**Layout.** A tile is 48 canvas pixels square (a 16-pixel sprite drawn
three times its size, image smoothing off). For a canvas `W` by `H`:
`cols = Math.floor(W / 48)`, `rows = Math.floor((H - 120) / 48)`; the map
fills the top `rows * 48` pixels, and the panel (`hud`) the band from
`rows * 48` to `H`, the full width. The camera is the cell drawn at the
map's top left: `x = clamp(focus.x - Math.floor(cols / 2), 0, max(0, grid.width - cols))`,
and `y` the same with `rows` and the height. The cell `(cx, cy)` is drawn
at canvas `((cx - camera.x) * 48, (cy - camera.y) * 48)`.

**What is drawn**, in this order, after the whole canvas is filled with
the background rgb(22, 13, 19):

1. the tile of every cell in `visible` or `explored` (any other cell:
   nothing, the background);
2. a black veil of alpha 0.6 over every cell in `explored` but not
   `visible`;
3. the items lying on `visible` cells (a flung item while it flies:
   below);
4. the creatures standing on `visible` cells (a creature bigger than a
   cell when any cell it covers is `visible`): the monsters, then the
   alive heroes (heroes on top), each where its animation puts it; then
   over them the **fuse** blink and the **chant** sparkles (below);
4. the **blasts** of the world's `effects` (below);
5. the projectiles of ranged attacks in flight (below);
6. the aim dot of `me`'s hero (below);
7. the price of every ware (an item whose `price` is above 0) on a
   `visible` cell, over it (below).

So an explored cell out of sight shows its tile alone, veiled (no items,
no creatures). A hero that is not alive is not drawn.

**Walls.** A `wall` cell **stands** when at least one of its eight
neighbours (orthogonal and diagonal) is open (`floor` or `stairs`); a
wall that does not stand (deep in the rock) is never drawn, not even
when visible or explored: its cell is left as the background. A
standing wall is drawn as the join that fits its neighbours: the sprite
`wall-<m>`, `m` the sum of 1 (the cell above), 2 (right), 4 (below) and
8 (left) for each of those four neighbours that is itself a standing
wall (a cell outside the grid is not). Whether a wall stands depends on
the grid alone, never on what is seen.

**Themes.** The floor's tiles (`floor`, `stairs` and the walls'
`wall-<m>`) are those of the theme of the world's depth,
`level.theme(depth)` (1 to 5 `dungeon`, the shops `interior`, ...),
`atlas.tile(theme, name)`. A lair (`level.blend(depth)` not `null`)
blends the theme before it with the one after it: the cell `(x, y)` is
drawn in `blend[1]` when `x + (x * 7 + y * 13) % 5 >= 26`, else in
`blend[0]` (the hall's west in the old theme, its east in the new, with
a ragged seam). Items and creatures are the same in every theme.

**Floors.** Once the sprites are loaded, a `floor` cell is not always
the theme's one `floor` tile: it is one of `atlas.floors(theme)` (calm
patterns first, busy last; `N` of them), calm in the middle of a room
and busier toward its walls, in blotches. For the cell `(x, y)`:

1. `d`: for an open cell, its distance (`max(|dx|, |dy|)`) to the
   nearest cell that is not open (outside the grid counts as not open),
   at most 6; 0 for a cell that is not open.
2. `b`: `d` blurred: the sum over the 3 by 3 cells around it of `d`
   times the weight (4 at the centre, 2 for the four orthogonal
   neighbours, 1 for the four corners; a cell outside the grid has `d`
   0), divided by 16.
3. `n`: value noise, with `h(i, j)` a number in [0, 1) for the lattice
   point `(i, j)`: `v = (world.seed ^ Math.imul(world.depth,
   0x9E3779B1) ^ Math.imul(i, 0x85EBCA6B) ^ Math.imul(j, 0xC2B2AE35)) >>>
   0`, then mulberry32's mix of it (`t = (v + 0x6D2B79F5) >>> 0; t =
   Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t
   | 61); h = ((t ^ (t >>> 14)) >>> 0) / 4294967296`). With `gx = x / 4`,
   `i = Math.floor(gx)`, `fx = gx - i` (and `j`, `fy` likewise from `y`),
   `n` is `h` blended bilinearly over the four lattice points `(i, j)`,
   `(i + 1, j)`, `(i, j + 1)`, `(i + 1, j + 1)` by `fx` and `fy`.
4. `e = Math.min(0.999, Math.max(0, 1 - (b - 1) / 3 + (n - 0.5) *
   0.6))`, and the cell's tile is `atlas.floors(theme)[Math.floor(e *
   N)]` (`theme` the cell's, a lair's blend side included).

So a cell next to a wall (`b` about 1) is drawn busy, one 4 or more
from the walls calm, with a blotchy edge between. A shop's one floor
pattern is its floor everywhere. Stairs and walls are as before; in flat
colours, every floor is the floor colour.

**Fuse.** A creature whose actor's `fuse` is `{at}` blinks, with `t =
now - at` (0 or more): while `t` is below 2400 it is lit when `t % 400`
is below 100 (a quarter of the time), from 2400 on when `t % 400` is
below 300 (three quarters). Lit, its square (the `48 s` pixels of the
cells it covers, moved and scaled with it as its picture is) is covered
by rgba(255, 220, 120, 0.45).

**Chant.** A creature whose actor's `chant` is `{kind, at, until}`, while
`now` is from `at` below `until`, has a sparkle over it: the sprite
`sparkle-<f>` (`f = Math.floor((now - at) / 150) % 3`) drawn over its
square at its size; in flat colours, a square of 12 by 12 pixels of
rgb(255, 240, 180) centred on its centre.

**Blasts.** Each `effects` entry of `kind` `blast` (`{x, y, size, at}`),
while `t = now - at` is from 0 below 450, draws `sparkle-<Math.floor(t /
150)>` over every cell within 2 of its square (`x - 2` to `x + size +
1`, and `y` likewise) that is `visible`; in flat colours, a square of
12 by 12 pixels of rgb(255, 240, 180) centred on each such cell.

**Prices.** A ware's price is written over its cell: the text
`<price>g` in `bold 14px monospace`, centred on the cell's middle
column (`textAlign` `center`), its baseline 4 pixels above the cell's
top edge (so it stands in the bottom of the cell above), in rgb(255,
215, 80); in rgb(120, 255, 120) when it is the `offer` of `me`'s hero
(bumped once: one more bump buys it). Prices are written with or
without the sprites.

**Facing.** A creature whose actor's `facing` is `left` is drawn
mirrored left to right (its sprite flipped about its own vertical
middle); `right` is the sprite as it is on the sheet.

**Size.** A creature of `size` s is drawn over the `48 s` pixels square
of the cells it covers (its sprite scaled to it; in flat colours, that
square inset 8 pixels), its centre the square's centre. A `small`
one is drawn at half that, about the same centre.

**The aim dot.** Only while the player is aiming (`draw`'s `aiming`
true: they hold Shift), for `me`'s hero, alive: along its `aim` `(dx, dy)`,
the cells `pos + k * (dx, dy)` for `k` from 1 to its `stats.range`, up
to the last open one before a cell that is not open (at `k` 1, a
diagonal that cuts a corner, as `rules` says, counts as not open). On
that last cell, when there is one, a filled circle of radius 6 pixels
centred on the cell's centre, rgb(255, 140, 0), drawn only while
`Math.floor(now / 300) % 2` is 1 (it blinks: off for 300 ms, on for 300
ms). Drawn with or without the sprites, whatever the cell holds.

**Projectiles.** An attack whose actor's `last` has a `reach` above 1
also draws, while `t` is from 150 below 210 (the strike), a square of 8
by 8 pixels, rgb(255, 160, 40), its centre going in a straight line from
the attacker's centre at rest (`p` 0) to the centre of the cell `reach`
cells away toward `(dx, dy)` (`p` 1), `p = (t - 150) / 60`.

**Flung items.** An item whose `flung` is `{x, y, at}` flies while `t
= now - at` is from 0 below 400: with `p = t / 400`, it is drawn as if
its cell were the point going in a straight line from `(x, y)` (`p` 0)
to its `pos` (`p` 1), raised by `32 sin(π p)` pixels; at or past 400
ms, or before `at`, on its own cell. (It is drawn when its own cell is
`visible`.)

**Poses.** Once the sprites are loaded, every creature is drawn as
`atlas.pose(name, anim, frame, look)`: `name` `hero` for a hero (`look`
its hero's `{colour, group}`), its kind for a monster. With `t = now -
gesture.at` for an actor whose `gesture` is not `null`:

- a hero whose `gesture` is `power` and `t` from 0 below 600: `power_up`,
  frame `Math.floor(t / 100)` (all six, 100 ms each);
- a hero whose `gesture` is `use` and `t` from 0 below 450: `power_up`,
  frame `Math.floor(t / 150)` (its first three: the hand raised, 150 ms
  each);
- otherwise, every creature: `idle`, frame `(Math.floor(now / 250) +
  id) % 3` (`id` the actor's: so creatures side by side don't breathe in
  step).

The hero's `sleep`, `debuff` and `stun` animations are not drawn yet.
In flat colours there are no poses.

**Animations.** A creature is drawn at its cell, moved by an offset
`(ox, oy)` in canvas pixels and scaled by `k` about its own centre (its
48-pixel square, or the inset square in flat colours, keeps its centre
at the cell's centre plus the offset). At rest, `(0, 0)` and `k` 1. Its
actor's `last` (`{kind, dx, dy, at}`) animates it while `t = now - at`
is from 0 up to the animation's length (the world time `now` is the
draw's, below):

- a **move** (a hop, 160 ms: the sudden step onto the new cell is the
  world's, the hop is drawn on top of it): `h = sin(π t / 160)`, the
  offset `(0, -12 h)` and `k = 1 + 0.15 h`, whatever its direction (it
  grows a little as it hops).
- an **attack** (300 ms), toward `(dx, dy)`:
  - the rise, `t` below 150: `p = t / 150`, `e = p * p * (3 - 2 p)`; the
    offset `(0, -16 e)`; for an attack up (`dy` -1) also `k = 1 +
    0.25 e` (it grows as it rises: it comes toward the eye);
  - the strike, `t` from 150 below 210: `p = (t - 150) / 60`; the offset
    goes in a straight line from `(0, -16)` to `(18 dx, 18 dy)`, as `p`
    goes from 0 to 1; for an attack up, `k` goes from 1.25 to 1 (it
    shrinks back as it lunges into the cell above);
  - the return, `t` from 210 below 300: `p = (t - 210) / 90`; the offset
    from `(18 dx, 18 dy)` back to `(0, 0)`; `k` 1.

`t` below 0 or past the length: at rest. A creature's outline (below)
moves and scales with it.

**Before the sprites have loaded** (until `load` resolves, or for good if
it rejects) everything is drawn as flat colour: a tile fills its cell
(a standing `wall` rgb(90, 80, 90), `floor` rgb(50, 36, 44), `stairs`
rgb(230, 200, 60)); a creature is a square inset 8 pixels within its
cell
(`me`'s hero rgb(60, 120, 255), any other hero rgb(60, 200, 120), any
monster rgb(220, 50, 50)); an item a square inset 16 pixels
(rgb(240, 180, 40)). Once loaded, each is its sprite (`atlas`): a
creature a frame of its animation (**Poses**, below); an item the sprite
of its kind, but a `pulled` lever `lever-pulled`; a tile its theme's `floor`,
`stairs` or, for a standing wall, `wall-<m>`), drawn
over the whole cell; then every
hero but `me`'s gets a 3-pixel outline of rgb(60, 200, 120) inside its
cell, so the player tells their own hero apart.

**Paused**: last, a band rgb(0, 0, 0) the full width, 48 pixels high,
centred on the map's middle row of pixels (`Math.floor(rows * 48 / 2)`),
with `PAUSED` in rgb(230, 220, 200), `bold 24px monospace`, centred in it.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:point](../../shapes/point.md)
- [shape:level](../../shapes/level.md)

# Functions:
## Function - init:
`init(canvas)`. The canvas to draw into from now on (a page's `<canvas>` element). Draws nothing.

## Function - load:
`load(base) -> promise`. Loads the sprites from the asset URL prefix `base` (the page's is `/assets/`); resolves once they are in, and from the next `draw` they are used. Rejects as the sprites' loading does; the flat colours stay.

## Function - camera:
`camera(world, me, cols, rows) -> point`. The camera, as the layout says, for the player `me` (a string; any name) and a view of `cols` by `rows` cells.

## Function - cell-at:
`cellAt(world, me, x, y) -> point`. The cell of the grid drawn under the canvas pixel `(x, y)` (canvas pixels, as `draw` lays them out on the canvas given to `init`, for the player `me`): with `cols` and `rows` from the canvas's size and the camera as the layout says, the point `(camera.x + Math.floor(x / 48), camera.y + Math.floor(y / 48))`. `null` when the pixel is not on the map: `x` below 0 or at least `cols * 48`, `y` below 0 or at least `rows * 48` (the panel), or the cell outside the grid. Throws an `Error` if no canvas was given to `init`.

## Function - draw:
`draw(world, me, paused, now, aiming)`. Draws the world for the player `me`, as above, onto the canvas given to `init` (throws an `Error` if none was given), with the paused band when `paused` is true. `now` is the world time to animate at, a number of 0 or more (left out: the world's `time`): the page draws every frame, with `now` running on from the last world's `time` between two worlds. `aiming` (left out: `false`): whether the player is aiming, so the aim dot is drawn.

# Intrinsics:
## Intrinsic - floors:
After `load('/assets/')` resolves, a world at depth 1 on a 15 by 11 grid (`fromRows`: a border of `#` around `floor`), every cell `visible` and `explored`, `Ann` alive at (1, 1): `draw(w, 'Ann', false)`; the cell (7, 5) (four from every wall) is pixel for pixel one of `atlas.floors('dungeon')[0]` to `[6]` drawn at 48 by 48 pixels (smoothing off) over the background rgb(22, 13, 19), and the cell (1, 5) (next to a wall) one of `[16]` to `[22]`. The same world drawn twice gives the same pixels; with `seed` 2 instead of 1, the 13 by 9 floor cells are not all the same as with seed 1.

## Intrinsic - effects:
On the 800 by 600 canvas, before any `load`, the `flat-colours` world with Bob, the monster and the gold left out, plus a monster (`slime`) at (4, 1):
- with the slime's `fuse` `{at: 0}`: at `now` 50 the centre pixel of (4, 1) is within 3 in each channel of rgb(236, 127, 82) (the lit blink over its red); at `now` 150 it is rgb(220, 50, 50); at 2650 lit again; at 2750 rgb(220, 50, 50);
- with the slime's `chant` `{kind: 'haste', at: 0, until: 1200}` instead: at `now` 100 its centre pixel is rgb(255, 240, 180); at `now` 1300 rgb(220, 50, 50);
- with no slime and the world's `effects` `[{kind: 'blast', x: 4, y: 1, size: 1, at: 0}]`: at `now` 100 the centre pixel of (5, 1) is rgb(255, 240, 180); at `now` 500 it is the floor's rgb(50, 36, 44).

## Intrinsic - camera:
For a world on a 48 by 32 grid with a view of 16 by 10 and `Ann`'s hero alive: Ann at (2, 2) gives (0, 0); at (40, 30), (32, 22); at (20, 15), (12, 10). With Ann not alive and `Bob` alive at (20, 15), `camera(w, 'Ann', 16, 10)` is (12, 10); with no hero alive, (0, 0). On a 10 by 5 grid, any focus gives (0, 0).

## Intrinsic - cell-at:
On the page's 800 by 600 canvas (`cols` 16, `rows` 10), a world on a 48 by 32 grid with `Ann` alive at (20, 15) (the camera (12, 10)): `cellAt(w, 'Ann', 100, 60)` is (14, 11); `cellAt(w, 'Ann', 0, 0)` (12, 10); `cellAt(w, 'Ann', 767, 479)` (27, 19); `cellAt(w, 'Ann', 768, 10)`, `cellAt(w, 'Ann', 10, 480)` (the panel) and `cellAt(w, 'Ann', -1, 10)` are `null`. On a 10 by 5 grid (the camera (0, 0)): `cellAt(w, 'Ann', 100, 60)` is (2, 1) and `cellAt(w, 'Ann', 600, 100)` (the cell (12, 2), outside the grid) `null`.

## Intrinsic - flat-colours:
On the page's 800 by 600 canvas, before any `load`: a world on `['#######', '#.>...#', '#######']` with every cell `visible` and `explored`, `Ann` alive at (1, 1), `Bob` alive at (3, 1), a monster at (4, 1) and a `gold` at (5, 1). After `draw(w, 'Ann', false)`, the centre pixel of the cell (0, 0) is rgb(90, 80, 90); of (2, 1) rgb(230, 200, 60); of (1, 1) rgb(60, 120, 255); of (3, 1) rgb(60, 200, 120); of (4, 1) rgb(220, 50, 50); of (5, 1) rgb(240, 180, 40). After `draw(w, 'Bob', false)`, (1, 1) is rgb(60, 200, 120) and (3, 1) rgb(60, 120, 255). With Bob not alive, the centre of (3, 1) is the floor rgb(50, 36, 44). The pixel (796, 596) is not the background (the panel is drawn).

## Intrinsic - fog:
In that world with only Ann's cell `visible` and every cell `explored`, the monster's and the gold's cells' centre pixels are each channel within 3 of 0.4 times the floor's colour (the veiled floor: no monster, no item); with nothing `explored` but Ann's cell, the centre pixel of the cell (5, 1) is the background rgb(22, 13, 19).

## Intrinsic - paused:
`draw(w, 'Ann', true)` of that world on the 800 by 600 canvas (10 rows: the map's middle is pixel row 240): the pixel (4, 240) is rgb(0, 0, 0), and so is (4, 218); `draw(w, 'Ann', false)` leaves (4, 240) not rgb(0, 0, 0) (row 240 is in the cell row 5, outside the 3-row grid: the background).

## Intrinsic - walls:
On the 800 by 600 canvas, before any `load`, a world on `['#######', '#.>...#', '#######', '#######']` with every cell `visible` and `explored`: the centre pixel of (3, 2) is the wall's rgb(90, 80, 90) (it stands: (2, 1), (3, 1) and (4, 1) are open), and of (3, 3) the background rgb(22, 13, 19) (it does not stand).

## Intrinsic - animates:
On the 800 by 600 canvas, before any `load`, the `flat-colours` world with Bob, the monster and the gold left out, at time 0, and Ann's `last` as said:
- `{kind: 'attack', dx: 1, dy: 0, at: 0}`: `draw(w, 'Ann', false, 150)` makes the pixel (72, 44) rgb(60, 120, 255) (Ann risen 16 pixels, into the cell above); `draw(w, 'Ann', false, 210)` makes (100, 72) rgb(60, 120, 255) (lunged 18 pixels right, into the stairs' cell); `draw(w, 'Ann', false, 400)` leaves (72, 44) the wall's rgb(90, 80, 90) and (100, 72) the stairs' rgb(230, 200, 60); so does `draw(w, 'Ann', false)` (`now` the world's time 0, at rest).
- `{kind: 'move', dx: 1, dy: 0, at: 0}`: at `now` 80, (72, 46) is rgb(60, 120, 255) (hopped 12 pixels), and so is (72, 42) (grown by 15%: its top edge at 41.6, where an ungrown square's would be at 44); at 200, (72, 46) is rgb(90, 80, 90). The same for `{kind: 'move', dx: 0, dy: 1, at: 0}` and `{kind: 'move', dx: -1, dy: 1, at: 0}`.
- `{kind: 'attack', dx: 0, dy: -1, at: 0}`: at `now` 150, (54, 56) is rgb(60, 120, 255) (risen and grown to 40 pixels); at `now` 0, (54, 56) is the floor's rgb(50, 36, 44).

## Intrinsic - prices:
On the 800 by 600 canvas, before any `load`, a world on `['#######', '#.....#', '#.....#', '#######']` with every cell `visible` and `explored`, `Ann` alive at (1, 2), and a `sword` ware of `id` 12 and `price` 30 at (3, 2): after `draw(w, 'Ann', false)`, the band of pixels from (144, 64) to (191, 95) (the bottom two thirds of the cell (3, 1), above the ware) holds at least 5 pixels with red above 200, green from 160 to 240 and blue below 140, and none with green above 245 and red below 170; with Ann's `offer` 12, at least 5 pixels with green above 200 and red below 170. The same band over the cell (1, 1), above Ann, holds none of either.

## Intrinsic - themes:
After `load('/assets/')` resolves, the `flat-colours` world drawn at depth 1 and the same world at depth 8: the wall cell (2, 0) differs between the two in at least 10 pixels, and so does the floor cell (5, 1) (with the gold left out); at depth 6, (2, 0) differs from both. (Only the terrain changes with the theme: compare tiles' cells, never a creature's cell, whose floor is the theme's too.) A world on a 32 by 3 grid (a row of 32 `#`, then `#`, 30 `.` and `#`, then 32 `#`), every cell `visible` and `explored`, with `Ann` alone: with Ann at (1, 1), the cell (3, 1) drawn at depth 7 (the first lair) is pixel for pixel the same as at depth 1; with Ann at (30, 1), the cell (28, 1) at depth 7 is pixel for pixel the same as at depth 8, and differs from depth 1's in at least 10 pixels.

## Intrinsic - aim:
On the 800 by 600 canvas, before any `load`, the `flat-colours` world with Bob, the monster and the gold left out (Ann at (1, 1), aiming `(1, 0)`, `range` 1): `draw(w, 'Ann', false, 300, true)` makes the centre pixel of (2, 1) rgb(255, 140, 0); at `now` 0 and 600 it is the stairs' rgb(230, 200, 60); `draw(w, 'Ann', false, 300)` and `draw(w, 'Ann', false, 300, false)` (not aiming) leave it the stairs' colour, and no pixel of the map rgb(255, 140, 0). With Ann's `range` 3, `draw(w, 'Ann', false, 300, true)` makes the centre of (4, 1) rgb(255, 140, 0) and of (2, 1) the stairs' colour. With Ann aiming `(-1, 0)` (a wall next to her), no pixel of the map is rgb(255, 140, 0). `draw(w, 'Eve', false, 300, true)` draws no dot.

## Intrinsic - sizes:
On the 800 by 600 canvas, before any `load`, the `flat-colours` world with Bob, the monster and the gold left out, plus a `golem` of `size` 3 at (3, 0): `draw(w, 'Ann', false)` makes the centre pixels of (3, 0), (4, 1) and (5, 2) rgb(220, 50, 50). The golem `small` at `size` 1 at (4, 1): the pixel (216, 72) (the cell's centre) is rgb(220, 50, 50) and (204, 60) (12 pixels up and left of it) the floor's rgb(50, 36, 44).

## Intrinsic - flies:
On the 800 by 600 canvas, before any `load`, the `flat-colours` world with Bob, the monster and the gold left out, plus a `gold` at (5, 1) `flung` from (3, 1) at 0: `draw(w, 'Ann', false, 200)` makes the pixel (216, 40) rgb(240, 180, 40) (halfway, at (4, 1), raised 32) and the centre of (5, 1) the floor's rgb(50, 36, 44); at `now` 400 the centre of (5, 1) is rgb(240, 180, 40). With Ann's `last` `{kind: 'attack', dx: 1, dy: 0, at: 0, reach: 3}` (and no gold), at `now` 180 the pixel (144, 72) is rgb(255, 160, 40).

## Intrinsic - poses:
After `load('/assets/')` resolves, the `flat-colours` world with Bob, the monster and the gold left out (Ann, `id` 0, `colour` 0, at (1, 1), `gesture` `null`): `draw(w, 'Ann', false, 0)` and `draw(w, 'Ann', false, 250)` differ in at least 5 pixels of Ann's cell (idle frames 0 and 1), and `draw(w, 'Ann', false, 750)` is the same as at 0 in every pixel of her cell (frame 0 again). With Ann's `colour` 1: at `now` 0 her cell differs from colour 0's in at least 5 pixels. With Ann's `gesture` `{kind: 'power', at: 0}` (and her `last` `null`): her cell at `now` 350 differs from her idle cell at 0 in at least 20 pixels, and at `now` 600 (past the gesture) is the same as the idle frame `Math.floor(600 / 250) % 3` = 2, drawn without a gesture at 600. With `gesture` `{kind: 'use', at: 0}`: at `now` 300 her cell is the same, in every pixel, as with `{kind: 'power', at: 0}` at `now` 200 (both `power_up` frame 2); at 450 it is idle again.

## Intrinsic - sprites:
After `load('/assets/')` resolves and a `draw(w, 'Ann', false)` of the `flat-colours` world, Ann's cell (48 by 48 pixels) holds at least 3 different colours, and its centre pixel is not rgb(60, 120, 255); the pixel 1 in from the top-left corner of Bob's cell is rgb(60, 200, 120). With the monster a `snake` facing `right`, and then the same world with it facing `left`: at least 10 pixels of the monster's cell differ between the two (the floor under it is not mirrored, so compare no more than that), and the first is pixel for pixel the drawing of the snake with `facing` left out. The wall cells (2, 0) and (4, 0) (both `wall-10`) are pixel for pixel the same, and (0, 0) (`wall-6`) differs from (2, 0) in at least 10 pixels.
