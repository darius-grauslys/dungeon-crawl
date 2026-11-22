# fov: `sight`

For every cell within the radius's bounding square (clipped to the grid),
test the distance, then walk the Bresenham line from `origin` to it,
stopping at the first `wall` strictly between them. Use the integer form:
`dx = |cx - ox|`, `dy = |cy - oy|`, step signs `sx`, `sy`,
`err = dx - dy`; each step doubles `err` into `e2`, moves x when
`e2 > -dy` and y when `e2 < dx`. Then the walls around the open cells in sight: for every `wall` cell
with an open (`floor` or `stairs`) neighbour among its eight that is in
sight, set it seen, reading the sight pass's result (not the growing
answer), so it doesn't chain. Build the answer with `mask`'s `of`.
Grids are at most 256 by 256 and radii at most 30: the plain walk is
fast enough; nothing is cached.

This Node's edge:

- [eed:fov](../EED.md)

# API Shapes:
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:point](../../../shapes/point.md)
- [shape:mask](../../../shapes/mask.md)

# Inbound Side-Effects:
None.

# Outbound Side-Effects:
None.
