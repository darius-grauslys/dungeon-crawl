# actor

A creature on the floor: a hero's body or a monster. Immutable.

| kind | what |
|---|---|
| `hero` | a player's body |
| `bat`, `slime`, `snake`, `skeleton`, `demon` | the monsters |

The module (`shapes/actor/index.mjs`) exports:

- `of({id, kind, pos, stats, ready})`: `id` an integer of 0 or more; `kind`
  one of the six above; `pos` a `point`; `stats` a `stats`; `ready` an
  integer of 0 or more, the world time (in milliseconds) from which the
  actor may act again (left out: 0). Any other input is refused with a
  `TypeError`.
- `KINDS`: the six kind names, in the table's order (a frozen array).

# Fields:
## Field - id:
Property `id`. Unique among the actors of one world.

## Field - kind:
Property `kind`.

## Field - pos:
Property `pos`, a `point`.

## Field - stats:
Property `stats`, a `stats`.

## Field - ready:
Property `ready`.

## Field - with:
`with(changes)` answers a new actor, this one with the properties of
`changes` (any of `pos`, `stats`, `ready`) put in, checked as `of` checks
them; this one is unchanged. `with` is a method every actor shares (on its
prototype, as a class method is), never an own property: an actor's own
properties are `id`, `kind`, `pos`, `stats` and `ready` alone, so two
actors of equal fields are deep equal (`assert.deepStrictEqual`).

# Intrinsics:
## Intrinsic - valid:
`of({id: 0, kind: 'hero', pos: point.of(1, 2), stats: s})` has those values,
`ready` 0, and is frozen; with `ready: 250` it has `ready` 250.
`kind: 'dragon'`, `id: -1`, `pos: {x: 1, y: 2}` (a plain object, not a
`point`), a missing `stats`, and `ready: -1` or `ready: 1.5` each throw a
`TypeError`. `a.with({pos: point.of(3, 3)})` has `pos` (3, 3), the same
`id`, `kind`, `stats` and `ready`, and `a.pos` is still (1, 2);
`a.with({ready: 400}).ready` is 400. Two actors made by `of` from the
same fields pass `assert.deepStrictEqual`, and `with` is not an own
property (`Object.hasOwn(a, 'with')` false). `KINDS` is
`['hero', 'bat', 'slime', 'snake', 'skeleton', 'demon']`.

# Callbacks:
None

# API Shapes:
- [shape:point](point.md)
- [shape:stats](stats.md)
