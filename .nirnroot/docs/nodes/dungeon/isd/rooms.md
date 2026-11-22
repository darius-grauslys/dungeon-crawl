# dungeon: `rooms`

A shop depth (`level.kind(depth)` is `interior`) answers the EED's shop,
and a lair depth (`boss`) the EED's lair (its boss, levers and guards'
spots on `level.round(depth)` 1 alone), each built cell by cell, without
drawing from any generator. Every other depth is carved as below.

How a floor is carved. Everything random comes from one generator seeded
by `seed` and `depth` together: mulberry32 (a 32-bit generator; its state
is a uint32, each draw adds 0x6D2B79F5 to it and mixes it) started at
`(seed ^ Math.imul(depth, 0x9E3779B1)) >>> 0`. Never `Math.random`.

1. Start with all 48 by 32 cells `wall`.
2. Place rooms: up to 80 tries, each a rectangle of width 4 to 10 and
   height 4 to 7, at a random place whose cells all lie from column 1 to
   46 and row 1 to 30. Keep it only if it overlaps no kept room grown by
   one cell on each side (so rooms never touch). Stop at 12 rooms.
3. If fewer than 6 rooms were kept, draw again from step 1 with the same
   generator (it has moved on, so the next floor differs), until at least
   6 are kept.
4. Carve every kept room to `floor`, then join each room, in the order
   kept, to the next one: an L-shaped corridor, one cell wide, from the
   first room's centre (its left plus half its width, rounded down; the
   same for its top) to the second's, going horizontally first or
   vertically first at random.
5. `start` is the first room's centre. `stairs` is the centre of the kept
   room whose centre is farthest from `start` (Manhattan; the first such
   in kept order on a tie); that cell becomes `stairs`. If it is closer
   than 10, draw again from step 1.
6. `spots`: every `floor` cell inside a room (not a corridor), not
   `start` or `stairs`, at a Manhattan distance of at least 5 from
   `start`, shuffled (Fisher-Yates with the generator), the first 40 kept.
   If fewer than 12, draw again from step 1.

Answer the `floor-plan` built with its shape's `of`.

This Node's edge:

- [eed:dungeon](../EED.md)

# API Shapes:
- [shape:floor-plan](../../../shapes/floor-plan.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:point](../../../shapes/point.md)
- [shape:level](../../../shapes/level.md)

# Inbound Side-Effects:
None: it reads only its arguments.

# Outbound Side-Effects:
None: it answers a new plan and changes nothing.
