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

**What is drawn**, after the whole canvas is filled with the background
rgb(22, 13, 19):

- a cell in `visible`: its tile, then an item lying there, then a
  creature standing there (a monster, or an alive hero: heroes on top);
- a cell in `explored` but not `visible`: its tile alone, under a black
  veil of alpha 0.6 (no items, no creatures);
- any other cell: nothing (the background).

A hero that is not alive is not drawn.

**Before the sprites have loaded** (until `load` resolves, or for good if
it rejects) everything is drawn as flat colour: a tile fills its cell
(`wall` rgb(90, 80, 90), `floor` rgb(50, 36, 44), `stairs`
rgb(230, 200, 60)); a creature is a square inset 8 pixels within its cell
(`me`'s hero rgb(60, 120, 255), any other hero rgb(60, 200, 120), any
monster rgb(220, 50, 50)); an item a square inset 16 pixels
(rgb(240, 180, 40)). Once loaded, each is its sprite of the same name
(`atlas`; every hero is `hero`), drawn over the whole cell; then every
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
`draw(world, me, paused)`. Draws the world for the player `me`, as above, onto the canvas given to `init` (throws an `Error` if none was given), with the paused band when `paused` is true.

# Intrinsics:
## Intrinsic - camera:
For a world on a 48 by 32 grid with a view of 16 by 10 and `Ann`'s hero alive: Ann at (2, 2) gives (0, 0); at (40, 30), (32, 22); at (20, 15), (12, 10). With Ann not alive and `Bob` alive at (20, 15), `camera(w, 'Ann', 16, 10)` is (12, 10); with no hero alive, (0, 0). On a 10 by 5 grid, any focus gives (0, 0).

## Intrinsic - flat-colours:
On the page's 800 by 600 canvas, before any `load`: a world on `['#######', '#.>...#', '#######']` with every cell `visible` and `explored`, `Ann` alive at (1, 1), `Bob` alive at (3, 1), a monster at (4, 1) and a `gold` at (5, 1). After `draw(w, 'Ann', false)`, the centre pixel of the cell (0, 0) is rgb(90, 80, 90); of (2, 1) rgb(230, 200, 60); of (1, 1) rgb(60, 120, 255); of (3, 1) rgb(60, 200, 120); of (4, 1) rgb(220, 50, 50); of (5, 1) rgb(240, 180, 40). After `draw(w, 'Bob', false)`, (1, 1) is rgb(60, 200, 120) and (3, 1) rgb(60, 120, 255). With Bob not alive, the centre of (3, 1) is the floor rgb(50, 36, 44). The pixel (796, 596) is not the background (the panel is drawn).

## Intrinsic - fog:
In that world with only Ann's cell `visible` and every cell `explored`, the monster's and the gold's cells' centre pixels are each channel within 3 of 0.4 times the floor's colour (the veiled floor: no monster, no item); with nothing `explored` but Ann's cell, the centre pixel of the cell (5, 1) is the background rgb(22, 13, 19).

## Intrinsic - paused:
`draw(w, 'Ann', true)` of that world on the 800 by 600 canvas (10 rows: the map's middle is pixel row 240): the pixel (4, 240) is rgb(0, 0, 0), and so is (4, 218); `draw(w, 'Ann', false)` leaves (4, 240) not rgb(0, 0, 0) (row 240 is in the cell row 5, outside the 3-row grid: the background).

## Intrinsic - sprites:
After `load('/assets/')` resolves and a `draw(w, 'Ann', false)` of the `flat-colours` world, Ann's cell (48 by 48 pixels) holds at least 3 different colours, and its centre pixel is not rgb(60, 120, 255); the pixel 1 in from the top-left corner of Bob's cell is rgb(60, 200, 120).
