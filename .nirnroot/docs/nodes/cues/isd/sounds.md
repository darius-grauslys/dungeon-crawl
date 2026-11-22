# cues: `sounds`

Index `prev`'s heroes by `name` and its monsters by `id`. Walk `next`'s
heroes, then its monsters, collecting `{name, gain}` pairs as the EED
says; then the deaths of `prev`'s seen monsters missing from `next`;
then the gold. Keep the largest gain per name, and answer `cue.of` for
each name present, in `NAMES` order. Compare `last` and `gesture` by
their fields (`kind`, `at`, and `last`'s `dx`, `dy`, `reach`), not by
identity: a world rebuilt from the server's data has new objects.

This Node's edge:

- [eed:cues](../EED.md)

# API Shapes:
- [shape:cue](../../../shapes/cue.md)
- [shape:world](../../../shapes/world.md)

# Inbound Side-Effects:
None.

# Outbound Side-Effects:
None.
