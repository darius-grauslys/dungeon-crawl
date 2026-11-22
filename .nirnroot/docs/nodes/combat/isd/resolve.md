# combat: `resolve`

A few lines: check the arguments (a `stats` is an object the stats
shape's `of` made: it is frozen and has the eight integer fields; check
those), apply the EED's rule (the hit and physical damage, then the
magic damage and the ward), answer `strike`'s `of`. No randomness here:
the roll and the ward are the caller's.

This Node's edge:

- [eed:combat](../EED.md)

# API Shapes:
- [shape:stats](../../../shapes/stats.md)
- [shape:strike](../../../shapes/strike.md)

# Inbound Side-Effects:
None.

# Outbound Side-Effects:
None.
