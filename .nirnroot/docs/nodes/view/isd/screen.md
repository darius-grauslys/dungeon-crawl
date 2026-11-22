# view: `screen`

Keep the canvas from `init` and its 2D context (`imageSmoothingEnabled =
false`). `load` is `atlas.load(base)`; set a flag when it resolves. `draw`
works out the layout from the canvas's size each time, fills the
background, and walks the `cols` by `rows` cells from the camera (cells
outside the grid are left as background) in passes, as the EED's order
says: the tiles, the veils (`rgba(0, 0, 0, 0.6)` over the cell), the
items, the creatures. With sprites, a tile, an item or a creature at rest
facing right is `ctx.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, px, py,
48, 48)` for `s = atlas.sprite(name)` (a tile: `atlas.tile(level.theme(world.depth), name)`, the name
`wall-<m>` for a standing wall, else the tile's kind; an item or a
creature: `atlas.sprite(kind)`). The prices pass comes last on the map
(before the panel): `ctx.font`, `textAlign`, `fillStyle`, then
`fillText(price + 'g', px + 24, py - 4)`. A
creature in general: `ctx.save()`, `ctx.translate(px + 24 + ox, py + 24
+ oy)`, `ctx.scale(facing === 'left' ? -k : k, k)`, draw it centred on the
origin (`drawImage(..., -24, -24, 48, 48)`, or the flat square from -16 to
16), the outline likewise, `ctx.restore()`. Work out a cell's join mask
with a small helper (`stands(grid, x, y)`, then the four orthogonal
bits). Then `hud.draw(ctx, 0, rows * 48, W, H - rows * 48, world, me)`,
then the paused band.

This Node's edge:

- [eed:view](../EED.md)

Children this specification reaches:

- [eed:atlas](../../atlas/EED.md)
- [eed:hud](../../hud/EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:point](../../../shapes/point.md)
- [shape:sprite](../../../shapes/sprite.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:level](../../../shapes/level.md)

# Inbound Side-Effects:
The canvas given to `init`, and its size at each `draw`.

# Outbound Side-Effects:
Pixels drawn on that canvas.
