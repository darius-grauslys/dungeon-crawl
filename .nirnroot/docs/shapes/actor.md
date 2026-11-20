# actor

A creature on the floor: the hero or a monster. Immutable.

| kind | what |
|---|---|
| `hero` | the player |
| `bat`, `slime`, `snake`, `skeleton`, `demon` | the monsters |

The module (`shapes/actor/index.mjs`) exports:

- `of({id, kind, pos, stats})`: `id` an integer of 0 or more; `kind` one of
  the six above; `pos` a `point`; `stats` a `stats`. Any other input is
  refused with a `TypeError`.
- `KINDS`: the six kind names, in the table's order (a frozen array).

# Fields:
## Field - id:
Property `id`. Unique among the actors of one world (the hero's is 0).

## Field - kind:
Property `kind`.

## Field - pos:
Property `pos`, a `point`.

## Field - stats:
Property `stats`, a `stats`.

## Field - with:
`with(changes)` answers a new actor, this one with the properties of
`changes` (any of `pos`, `stats`) put in, checked as `of` checks them;
this one is unchanged.

# Intrinsics:
## Intrinsic - valid:
`of({id: 0, kind: 'hero', pos: point.of(1, 2), stats: s})` has those values
and is frozen. `kind: 'dragon'`, `id: -1`, `pos: {x: 1, y: 2}` (a plain
object, not a `point`), and a missing `stats` each throw a `TypeError`.
`a.with({pos: point.of(3, 3)})` has `pos` (3, 3), the same `id`, `kind`
and `stats`, and `a.pos` is still (1, 2). `KINDS` is
`['hero', 'bat', 'slime', 'snake', 'skeleton', 'demon']`.

# Callbacks:
None

# API Shapes:
- [shape:point](point.md)
- [shape:stats](stats.md)
