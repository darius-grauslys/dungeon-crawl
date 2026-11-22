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
3. the items lying on `visible` cells;
4. the creatures standing on `visible` cells: the monsters, then the
   alive heroes (heroes on top), each where its animation puts it;
5. the price of every ware (an item whose `price` is above 0) on a
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
`wall-<m>`) are those of the theme of the world's depth (the depths'
themes: 1 to 5 `dungeon`, 6, 12, 18 and 24 `interior` (the shops), 7 to
11 `frozen`, 13 to 17 `arid`, 19 to 23 `temple`, 25 to 29 `magma`),
`atlas.tile(theme, name)`. Items and creatures are the same in every
theme.

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

**Animations.** A creature is drawn at its cell, moved by an offset
`(ox, oy)` in canvas pixels and scaled by `k` about its own centre (its
48-pixel square, or the inset square in flat colours, keeps its centre
at the cell's centre plus the offset). At rest, `(0, 0)` and `k` 1. Its
actor's `last` (`{kind, dx, dy, at}`) animates it while `t = now - at`
is from 0 up to the animation's length (the world time `now` is the
draw's, below):

- a **move** (a hop, 160 ms: the sudden step onto the new cell is the
  world's, the hop is drawn on top of it): `h = sin(π t / 160)`, the
  offset `(0, -12 h)`; for a step up (`dy` -1) also `k = 1 + 0.15 h`.
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
(rgb(240, 180, 40)). Once loaded, each is its sprite of the same name
(`atlas`; every hero is `hero`; a tile its theme's `floor`, `stairs` or,
for a standing wall, `wall-<m>`), drawn
over the whole cell; then every
hero but `me`'s gets a 3-pixel outline of rgb(60, 200, 120) inside its
cell, so the player tells their own hero apart.

**Paused**: last, a band rgb(0, 0, 0) the full width, 48 pixels high,
centred on the map's middle row of pixels (`Math.floor(rows * 48 / 2)`),
with `PAUSED` in rgb(230, 220, 200), `bold 24px monospace`, centred in it.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:point](../../shapes/point.md)

# Functions:
## Function - init:
`init(canvas)`. The canvas to draw into from now on (a page's `<canvas>` element). Draws nothing.

## Function - load:
`load(base) -> promise`. Loads the sprites from the asset URL prefix `base` (the page's is `/assets/`); resolves once they are in, and from the next `draw` they are used. Rejects as the sprites' loading does; the flat colours stay.

## Function - camera:
`camera(world, me, cols, rows) -> point`. The camera, as the layout says, for the player `me` (a string; any name) and a view of `cols` by `rows` cells.

## Function - draw:
`draw(world, me, paused, now)`. Draws the world for the player `me`, as above, onto the canvas given to `init` (throws an `Error` if none was given), with the paused band when `paused` is true. `now` is the world time to animate at, a number of 0 or more (left out: the world's `time`): the page draws every frame, with `now` running on from the last world's `time` between two worlds.

# Intrinsics:
## Intrinsic - camera:
For a world on a 48 by 32 grid with a view of 16 by 10 and `Ann`'s hero alive: Ann at (2, 2) gives (0, 0); at (40, 30), (32, 22); at (20, 15), (12, 10). With Ann not alive and `Bob` alive at (20, 15), `camera(w, 'Ann', 16, 10)` is (12, 10); with no hero alive, (0, 0). On a 10 by 5 grid, any focus gives (0, 0).

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
- `{kind: 'move', dx: 1, dy: 0, at: 0}`: at `now` 80, (72, 46) is rgb(60, 120, 255) (hopped 12 pixels); at 200, it is rgb(90, 80, 90).
- `{kind: 'attack', dx: 0, dy: -1, at: 0}`: at `now` 150, (54, 56) is rgb(60, 120, 255) (risen and grown to 40 pixels); at `now` 0, (54, 56) is the floor's rgb(50, 36, 44).

## Intrinsic - prices:
On the 800 by 600 canvas, before any `load`, a world on `['#######', '#.....#', '#.....#', '#######']` with every cell `visible` and `explored`, `Ann` alive at (1, 2), and a `sword` ware of `id` 12 and `price` 30 at (3, 2): after `draw(w, 'Ann', false)`, the band of pixels from (144, 64) to (191, 95) (the bottom two thirds of the cell (3, 1), above the ware) holds at least 5 pixels with red above 200, green from 160 to 240 and blue below 140, and none with green above 245 and red below 170; with Ann's `offer` 12, at least 5 pixels with green above 200 and red below 170. The same band over the cell (1, 1), above Ann, holds none of either.

## Intrinsic - themes:
After `load('/assets/')` resolves, the `flat-colours` world drawn at depth 1 and the same world at depth 7: the wall cell (2, 0) differs between the two in at least 10 pixels, and so does the floor cell (5, 1) (with the gold left out); at depth 6, (2, 0) differs from both. Ann's cell, at rest, holds the same `hero` sprite at every depth.

## Intrinsic - sprites:
After `load('/assets/')` resolves and a `draw(w, 'Ann', false)` of the `flat-colours` world, Ann's cell (48 by 48 pixels) holds at least 3 different colours, and its centre pixel is not rgb(60, 120, 255); the pixel 1 in from the top-left corner of Bob's cell is rgb(60, 200, 120). With the monster a `snake` facing `right`, and then the same world with it facing `left`: at least 10 pixels of the monster's cell differ between the two (the floor under it is not mirrored, so compare no more than that), and the first is pixel for pixel the drawing of the snake with `facing` left out. The wall cells (2, 0) and (4, 0) (both `wall-10`) are pixel for pixel the same, and (0, 0) (`wall-6`) differs from (2, 0) in at least 10 pixels.
