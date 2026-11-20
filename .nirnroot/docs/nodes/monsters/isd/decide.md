# monsters: `decide`

Breadth-first search from the monster's cell over open, unblocked cells
(the hero's cell open), visiting neighbours in the order of preference,
to a depth of 20. Record, for each cell reached, the first step taken
from the monster to reach it; the first time the hero's cell is reached,
answer that step as `intent.move`. A BFS that visits neighbours in the
preference order, recording the first step of the first path that
reaches a cell, gives exactly the EED's tie rule. Answer `intent.wait()`
otherwise.

This Node's edge:

- [eed:monsters](../EED.md)

# API Shapes:
- [shape:actor](../../../shapes/actor.md)
- [shape:point](../../../shapes/point.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
None.

# Outbound Side-Effects:
None.
