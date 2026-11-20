# view: `screen`

Keep the canvas from `init` and its 2D context (`imageSmoothingEnabled =
false`). `load` is `atlas.load(base)`; set a flag when it resolves. `draw`
works out the layout from the canvas's size each time, fills the
background, walks the `cols` by `rows` cells from the camera (cells
outside the grid are left as background), draws each as the EED says
(with sprites: `ctx.drawImage(s.image, s.sx, s.sy, s.sw, s.sh, px, py, 48, 48)`
for `s = atlas.sprite(name)`, the name being the tile's kind, the item's
kind or the creature's kind), then the veil for explored cells not
visible (`rgba(0, 0, 0, 0.6)` over the cell), then
`hud.draw(ctx, 0, rows * 48, W, H - rows * 48, world)`.

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
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)

# Inbound Side-Effects:
The canvas given to `init`, and its size at each `draw`.

# Outbound Side-Effects:
Pixels drawn on that canvas.
