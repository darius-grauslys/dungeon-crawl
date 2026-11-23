# travel: `path`

One breadth-first search helper, `search(world, heroActor, isGoal)`:
a queue from me's cell, a visited set of `y * width + x`, the eight
directions in the EED's order, each step checked as the EED says (the
passable test and the corner test), each queued cell remembering the
first step taken from me's cell to reach it; it stops at the first cell
popped for which `isGoal` holds (answering that first step, or `null`
if it is me's own cell) and answers `null` when the queue runs dry.
Build the passable test once per call: a set of the cells blocked by
visible monsters (`actor`'s `covers`), other alive heroes, wares and
levers. `explore` and `toward` are that search with their goals;
`sighted` walks the world's `monsters` with the EED's line test (a
Bresenham helper of its own) and `bestiary.hostile('hero', kind)`.
Answer intents with `intent.move(dx, dy)`.

This Node's edge:

- [eed:travel](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:point](../../../shapes/point.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:bestiary](../../../shapes/bestiary.md)

# Inbound Side-Effects:
None: it reads only its arguments.

# Outbound Side-Effects:
None: it answers intents and arrays, and changes nothing.
