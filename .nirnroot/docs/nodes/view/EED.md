# view

Draws a world onto the page's canvas: the part of the floor around the
hero, tile by tile, and the status panel under it. Runs in a browser.

**Layout.** A tile is 48 canvas pixels square (a 16-pixel sprite drawn
three times its size, image smoothing off). For a canvas `W` by `H`:
`cols = Math.floor(W / 48)`, `rows = Math.floor((H - 120) / 48)`; the map
fills the top `rows * 48` pixels, and the panel (`hud`) the band from
`rows * 48` to `H`, the full width. The camera is the cell drawn at the
map's top left: `x = clamp(hero.x - Math.floor(cols / 2), 0, max(0, grid.width - cols))`,
and `y` the same with `rows` and the height. The cell `(cx, cy)` is drawn
at canvas `((cx - camera.x) * 48, (cy - camera.y) * 48)`.

**What is drawn**, after the whole canvas is filled with the background
rgb(22, 13, 19):

- a cell in `visible`: its tile, then an item lying there, then a
  creature standing there (the hero on top);
- a cell in `explored` but not `visible`: its tile alone, under a black
  veil of alpha 0.6 (no items, no monsters);
- any other cell: nothing (the background).

**Before the sprites have loaded** (until `load` resolves, or for good if
it rejects) everything is drawn as flat colour: a tile fills its cell
(`wall` rgb(90, 80, 90), `floor` rgb(50, 36, 44), `stairs`
rgb(230, 200, 60)); a creature is a square inset 8 pixels within its cell
(the hero rgb(60, 120, 255), any monster rgb(220, 50, 50)); an item a
square inset 16 pixels (rgb(240, 180, 40)). Once loaded, each is its
sprite of the same name (`atlas`), drawn over the whole cell.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:point](../../shapes/point.md)

# Functions:
## Function - init:
`init(canvas)`. The canvas to draw into from now on (a page's `<canvas>` element). Draws nothing.

## Function - load:
`load(base) -> promise`. Loads the sprites from the asset URL prefix `base` (the page's is `/assets/`); resolves once they are in, and from the next `draw` they are used. Rejects as the sprites' loading does; the flat colours stay.

## Function - camera:
`camera(world, cols, rows) -> point`. The camera, as the layout says, for a view of `cols` by `rows` cells.

## Function - draw:
`draw(world)`. Draws the world, as above, onto the canvas given to `init` (throws an `Error` if none was given).

# Intrinsics:
## Intrinsic - camera:
For a world on a 48 by 32 grid with a view of 16 by 10: the hero at (2, 2) gives (0, 0); at (40, 30), (32, 22); at (20, 15), (12, 10). On a 10 by 5 grid, any hero gives (0, 0).

## Intrinsic - flat-colours:
On the page's 800 by 600 canvas, before any `load`: a world on `['#######', '#.>...#', '#######']` with every cell `visible` and `explored`, the hero at (1, 1), a monster at (4, 1) and a `gold` at (5, 1). After `draw`, the centre pixel of the cell (0, 0) is rgb(90, 80, 90); of (2, 1) rgb(230, 200, 60); of (3, 1) rgb(50, 36, 44); of (1, 1) rgb(60, 120, 255); of (4, 1) rgb(220, 50, 50); of (5, 1) rgb(240, 180, 40). The pixel (796, 596) is not the background (the panel is drawn).

## Intrinsic - fog:
In that world with only the hero's cell `visible` and every cell `explored`, the monster's and the gold's cells' centre pixels are each channel within 3 of 0.4 times the floor's colour (the veiled floor: no monster, no item); with nothing `explored` but the hero's cell, the centre pixel of the cell (5, 1) is the background rgb(22, 13, 19).

## Intrinsic - sprites:
After `load('/assets/')` resolves and a `draw` of the `flat-colours` world, the hero's cell (48 by 48 pixels) holds at least 3 different colours, and its centre pixel is not rgb(60, 120, 255).
