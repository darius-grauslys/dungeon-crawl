# hud: `panel`

`draw`: `ctx.save()`, clip to the rectangle, fill the background, the
bar, then `fillText` each of `lines(world)` as the EED places them,
`ctx.restore()`. Integer coordinates only, so the bar's pixels are exact.

This Node's edge:

- [eed:hud](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)

# Inbound Side-Effects:
None.

# Outbound Side-Effects:
Pixels drawn into the given context, inside the given rectangle only.
