# actor

A creature on the floor: a hero's body or a monster. Immutable.

| kind | what |
|---|---|
| `hero` | a player's body |
| `bat`, `slime`, `snake`, `skeleton`, `demon` | the monsters |

The module (`shapes/actor/index.mjs`) exports:

- `of({id, kind, pos, stats, ready, held, facing, last})`: `id` an
  integer of 0 or more; `kind` one of the six above; `pos` a `point`;
  `stats` a `stats`; `ready` an integer of 0 or more, the world time (in
  milliseconds) from which the actor may act again (left out: 0); `held`
  an integer of 0 or more, the world time until which it may not step
  because it is being attacked (left out: 0); `facing` `'left'` or
  `'right'`, the way its picture looks (left out: `'right'`); `last` the
  last move or attack it made, or `null` (left out: `null`): an object
  `{kind, dx, dy, at}` with `kind` `'move'` or `'attack'`, `dx`, `dy`
  orthogonal (exactly one of them 1 or -1, the other 0) and `at` an
  integer of 0 or more, the world time it fired; the actor keeps a frozen
  copy of it with those four keys alone. Any other input is refused with
  a `TypeError`.
- `KINDS`: the six kind names, in the table's order (a frozen array).
- `facingFor(dx, dy)`: the way a creature looks after a move or attack
  `(dx, dy)` (orthogonal, as above; anything else a `TypeError`):
  `'left'` for left `(-1, 0)` and down `(0, 1)`, `'right'` for right
  `(1, 0)` and up `(0, -1)`.

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

## Field - held:
Property `held`.

## Field - facing:
Property `facing`.

## Field - last:
Property `last`: a frozen `{kind, dx, dy, at}`, or `null`.

## Field - with:
`with(changes)` answers a new actor, this one with the properties of
`changes` (any of `pos`, `stats`, `ready`, `held`, `facing`, `last`) put
in, checked as `of` checks them; this one is unchanged. `with` is a
method every actor shares (on its prototype, as a class method is), never
an own property: an actor's own properties are `id`, `kind`, `pos`,
`stats`, `ready`, `held`, `facing` and `last` alone, so two actors of
equal fields are deep equal (`assert.deepStrictEqual`).

# Intrinsics:
## Intrinsic - valid:
`of({id: 0, kind: 'hero', pos: point.of(1, 2), stats: s})` has those values,
`ready` 0, `held` 0, `facing` `'right'`, `last` `null`, and is frozen;
with `ready: 250` it has `ready` 250. `kind: 'dragon'`, `id: -1`,
`pos: {x: 1, y: 2}` (a plain object, not a `point`), a missing `stats`,
`ready: -1` or `ready: 1.5`, `held: -1`, `facing: 'up'`, and `last` of
`{kind: 'use', dx: 0, dy: 0, at: 0}`, `{kind: 'move', dx: 1, dy: 1, at: 0}`
or `{kind: 'move', dx: 1, dy: 0, at: -5}` each throw a `TypeError`.
`a.with({pos: point.of(3, 3)})` has `pos` (3, 3), the same `id`, `kind`,
`stats`, `ready`, `held`, `facing` and `last`, and `a.pos` is still (1, 2);
`a.with({ready: 400}).ready` is 400; `a.with({held: 300, facing: 'left',
last: {kind: 'attack', dx: -1, dy: 0, at: 50}})` has those, its `last`
frozen and deep equal to that object. Two actors made by `of` from the
same fields pass `assert.deepStrictEqual`, and `with` is not an own
property (`Object.hasOwn(a, 'with')` false). `KINDS` is
`['hero', 'bat', 'slime', 'snake', 'skeleton', 'demon']`.

## Intrinsic - facing:
`facingFor(-1, 0)` and `facingFor(0, 1)` are `'left'`; `facingFor(1, 0)`
and `facingFor(0, -1)` are `'right'`; `facingFor(0, 0)` and
`facingFor(1, 1)` throw a `TypeError`.

# Callbacks:
None

# API Shapes:
- [shape:point](point.md)
- [shape:stats](stats.md)
