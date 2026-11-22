# monsters: `decide`

Read `reach` from `bestiary.entry(monster.kind)` and `range` from the
monster's `stats`. Keep small helpers: the eight directions in the order
of preference; `free(x, y, dx, dy)` for a step of the monster's square
(the EED's rule, the corner check on walls alone); `nextTo(cell)`
answering the direction or `null`; `inLine(cell)`. Go through the EED's
rules in order.

For the chase, run one breadth-first search **from the goal**: start
from every square position (top-left cell) whose square is next to the
foe's cell and whose cells are open and not blocked, and spread backwards
over free steps (a step from A to B is free as the EED says; walk it in
reverse) to a depth of 20, recording each position's number of steps.
Then, at the monster's position, take its free steps whose new
position has a recorded number, keep those with the least, and break ties
by the squared distance and then the order of preference. Answer
`intent.move(dx, dy)` for a step or an attack, `intent.attack(dx, dy)`
for a shot, `intent.wait()` otherwise.

This Node's edge:

- [eed:monsters](../EED.md)

# API Shapes:
- [shape:actor](../../../shapes/actor.md)
- [shape:point](../../../shapes/point.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:bestiary](../../../shapes/bestiary.md)
- [shape:stats](../../../shapes/stats.md)

# Inbound Side-Effects:
None.

# Outbound Side-Effects:
None.
