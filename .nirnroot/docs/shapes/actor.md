# actor

A creature on the floor: a hero's body or a monster. Immutable.

| kind | what |
|---|---|
| `hero` | a player's body |
| any of `bestiary`'s `KINDS` | the monsters (`bat`, `slime`, ..., `golem`) |

A creature stands on a square of `size` by `size` cells: its `pos` is
the square's top-left cell, and it **covers** every cell `(pos.x + i,
pos.y + j)` with `i` and `j` from 0 to `size - 1`. Most are 1 by 1.

A **direction** is as `intent` says: `dx`, `dy` each -1, 0 or 1, not
both 0.

The module (`shapes/actor/index.mjs`) exports:

- `of({id, kind, pos, stats, ready, held, facing, last, aim, slow,
  mode, size, small, gesture, curse, haste, chant, cooldown, fuse, air,
  flung})`:
  - `id` an integer of 0 or more; `kind` `'hero'` or one of
    `bestiary`'s `KINDS`; `pos` a `point`; `stats` a `stats`;
  - `ready` an integer of 0 or more, the world time (in milliseconds)
    from which the actor may act again (left out: 0);
  - `held` an integer of 0 or more, the world time until which it may
    not step because it is being attacked (left out: 0);
  - `facing` `'left'` or `'right'`, the way its picture looks (left out:
    `'right'`);
  - `last` the last move or attack it made, or `null` (left out:
    `null`): an object `{kind, dx, dy, at, reach}` with `kind` `'move'`,
    `'attack'` or `'lunge'` (a snake's glide: `reach` the cells it slid),
    `(dx, dy)` a direction, `at` an integer of 0 or more,
    the world time it fired, and `reach` an integer from 1 to 9 (left
    out: 1), how many cells away the attack struck (1 for a move); the
    actor keeps a frozen copy of it with those five keys alone;
  - `aim` the direction it is aiming at, an object `{dx, dy}` (left out:
    `{dx: 1, dy: 0}`); the actor keeps a frozen copy with those two keys;
  - `slow` an integer from 0 to 3 (left out: 0): how many more of its
    moves and attacks are slowed;
  - `mode` `'roam'` (it acts as `monsters` decides), `'guard'` (it never
    leaves its cell) or `'dormant'` (it does nothing until a hero comes
    near) (left out: `'roam'`); a hero's is always `'roam'`;
  - `size` 1, 2 or 3 (left out: 1); a hero's is always 1;
  - `small` a boolean (left out: `false`): drawn at half its size;
  - `gesture` the last gesture it made, or `null` (left out: `null`): an
    object `{kind, at}` with `kind` `'use'` (it used something: pulled
    a lever, bumped a ware, or used nothing) or `'power'` (it took a
    power-up: picked up or bought a potion, sword, armor, ring or
    necklace), and `at` an integer of 0 or more, the world time it
    happened; the actor keeps a frozen copy with those two keys alone.
    The screen plays its animation from `at`.
  - `curse` an integer from 0 to 3 (left out: 0): how many more of its
    actions hurt it (a mummy's curse, `rules`);
  - `haste` an integer from 0 to 3 (left out: 0): how many more of its
    actions take half their time (a cultist's chant);
  - `chant` the spell it is chanting, or `null` (left out: `null`): an
    object `{kind, at, until}`, `kind` `'haste'` or `'summon'`, `at` and
    `until` integers of 0 or more, `until` at least `at`: it began at
    `at` and ends at `until`; the actor keeps a frozen copy with those
    three keys alone;
  - `cooldown` an integer of 0 or more (left out: 0): the world time
    before which it may not chant, leap or lunge again;
  - `fuse` the time its fuse was lit, or `null` (left out: `null`): an
    object `{at}`, `at` an integer of 0 or more; a frozen copy.
  - `air` where it is in a leap, or `null` (left out: `null`; on the
    ground): an object `{phase, at}`, `phase` `'crouch'` (gathering
    itself, still on the ground), `'rise'` (springing up), `'aloft'`
    (in the air) or `'drop'` (falling back down), `at` an integer of 0
    or more, the world time the phase began; a frozen copy with those
    two keys alone. A creature whose `air` phase is `rise`, `aloft` or
    `drop` is **off the ground** (`rules` says what that means);
  - `flung` `null` or `{x, y, at}` (left out: `null`): the cell it was
    thrown onto its own from, and when (a slime split from a dying
    one), all integers of 0 or more; a frozen copy with those three keys.
    Only monsters chant, burn a fuse, leap or are flung: a hero's
    `chant`, `fuse`, `air` and `flung` are always `null`, its `haste` 0
    and `cooldown` 0.
  Any other input is refused with a `TypeError`.
- `KINDS`: `'hero'` and then `bestiary`'s `KINDS`, in order (a frozen
  array of 31).
- `facingFor(dx, dy)`: the way a creature looks after a move, attack or
  face toward a direction (anything else a `TypeError`): `'left'` when
  `dx` is -1, `'right'` when `dx` is 1; with `dx` 0, `'left'` for down
  `(0, 1)` and `'right'` for up `(0, -1)`.

# Fields:
## Field - id:
Property `id`. Unique among the actors of one world.

## Field - kind:
Property `kind`.

## Field - pos:
Property `pos`, a `point`: the top-left cell it covers.

## Field - stats:
Property `stats`, a `stats`.

## Field - ready:
Property `ready`.

## Field - held:
Property `held`.

## Field - facing:
Property `facing`.

## Field - last:
Property `last`: a frozen `{kind, dx, dy, at, reach}`, or `null`.

## Field - aim:
Property `aim`: a frozen `{dx, dy}`.

## Field - slow:
Property `slow`.

## Field - mode:
Property `mode`.

## Field - size:
Property `size`.

## Field - small:
Property `small`.

## Field - gesture:
Property `gesture`: a frozen `{kind, at}`, or `null`.

## Field - curse:
Property `curse`.

## Field - haste:
Property `haste`.

## Field - chant:
Property `chant`: a frozen `{kind, at, until}`, or `null`.

## Field - cooldown:
Property `cooldown`.

## Field - fuse:
Property `fuse`: a frozen `{at}`, or `null`.

## Field - air:
Property `air`: a frozen `{phase, at}`, or `null`.

## Field - flung:
Property `flung`: a frozen `{x, y, at}`, or `null`.

## Field - covers:
`covers(x, y)`: whether the actor covers the cell `(x, y)`. A method on
the prototype, never an own property.

## Field - cells:
`cells()`: the cells it covers, a fresh array of `point`s, row by row
(top row first, left to right). A method on the prototype.

## Field - with:
`with(changes)` answers a new actor, this one with the properties of
`changes` (any of `pos`, `stats`, `ready`, `held`, `facing`, `last`,
`aim`, `slow`, `mode`, `size`, `small`, `gesture`, `curse`, `haste`,
`chant`, `cooldown`, `fuse`, `air`, `flung`, and `kind`, for a monster becoming another
monster kind) put in, checked as
`of` checks them; this one is unchanged. `with` is a method every actor shares (on
its prototype, as a class method is), never an own property: an actor's
own properties are `id`, `kind`, `pos`, `stats`, `ready`, `held`,
`facing`, `last`, `aim`, `slow`, `mode`, `size`, `small`, `gesture`,
`curse`, `haste`, `chant`, `cooldown`, `fuse`, `air` and `flung` alone, so
two actors of equal fields are deep equal (`assert.deepStrictEqual`).

# Intrinsics:
## Intrinsic - valid:
`of({id: 0, kind: 'hero', pos: point.of(1, 2), stats: s})` has those
values, `ready` 0, `held` 0, `facing` `'right'`, `last` `null`, `aim`
`{dx: 1, dy: 0}`, `slow` 0, `mode` `'roam'`, `size` 1, `small` false,
`gesture` `null`, `curse` 0, `haste` 0, `chant` `null`, `cooldown` 0,
`fuse` `null`, `air` `null`, `flung` `null`, and is frozen; with `ready: 250` it has `ready` 250. A `golem` of `size`
3, `mode` `'dormant'`, and an `archer` of `aim` `{dx: -1, dy: 1}` and
`slow` 2, are accepted. `kind: 'dragon'`, `id: -1`, `pos: {x: 1, y: 2}`
(a plain object, not a `point`), a missing `stats`, `ready: -1` or
`ready: 1.5`, `held: -1`, `facing: 'up'`, `aim: {dx: 0, dy: 0}`, `aim:
{dx: 2, dy: 0}`, `slow: 4`, `mode: 'sleep'`, `size: 4`, a `hero` of
`size` 2 or of `mode` `'guard'`, `small: 1`, and `last` of `{kind:
'use', dx: 0, dy: 0, at: 0}`, `{kind: 'move', dx: 0, dy: 0, at: 0}`,
`{kind: 'move', dx: 1, dy: 0, at: -5}` or `{kind: 'attack', dx: 1, dy:
0, at: 0, reach: 0}` each throw a `TypeError`. `a.with({pos: point.of(3,
3)})` has `pos` (3, 3), the same other fields, and `a.pos` is still (1,
2); `a.with({ready: 400}).ready` is 400; `a.with({held: 300, facing:
'left', last: {kind: 'attack', dx: -1, dy: 1, at: 50}})` has those, its
`last` frozen and deep equal to `{kind: 'attack', dx: -1, dy: 1, at: 50,
reach: 1}`; `a.with({gesture: {kind: 'power', at: 50}}).gesture` is
frozen and deep equal to `{kind: 'power', at: 50}`, and `gesture` of
`{kind: 'wave', at: 0}`, `{kind: 'use', at: -1}` or `{kind: 'use'}`
throws a `TypeError`. Two actors made by `of` from the same fields pass
`assert.deepStrictEqual`, and `with` is not an own property
(`Object.hasOwn(a, 'with')` false). `KINDS` has 31 kinds, the first
`'hero'`, then `'bat'`, the last `'beholder'`. A `cultist` with `chant`
`{kind: 'haste', at: 100, until: 1300}`, `cooldown` 500 and `haste` 3, a
`pumpkin` of `size` 2 with `fuse` `{at: 40}`, and a hero with `curse`
3 are accepted, the `chant` and `fuse` frozen and deep equal to what
was given; `curse: 4`, `haste: -1`, `chant` of `{kind: 'sing', at: 0,
until: 1}` or `{kind: 'haste', at: 5, until: 1}`, `cooldown: 1.5`,
`fuse: {at: -1}`, and a hero with `haste` 1 or a `fuse` each throw a
`TypeError`. A `wolf-man` actor `a`: `a.with({kind: 'enraged-wolf-man'}).kind`
is `'enraged-wolf-man'`; `a.with({kind: 'hero'})` throws a `TypeError`.
A `spider` with `air` `{phase: 'aloft', at: 500}`, and a `slime` with
`flung` `{x: 2, y: 3, at: 40}`, are accepted, each frozen and deep equal
to what was given; `last` `{kind: 'lunge', dx: 1, dy: 0, at: 10, reach:
2}` is accepted. `air` of `{phase: 'fly', at: 0}`, `{phase: 'rise', at:
-1}` or `{phase: 'rise'}`, `flung` of `{x: -1, y: 0, at: 0}`, and a hero
with an `air` or a `flung` each throw a `TypeError`.

## Intrinsic - covers:
A `golem` of `size` 3 at (4, 5): `covers(4, 5)`, `covers(6, 7)` and
`covers(5, 6)` are true, `covers(7, 5)` and `covers(3, 5)` false;
`cells()` has 9 points, the first (4, 5), the second (5, 5), the last
(6, 7). An actor of `size` 1 at (2, 2) covers (2, 2) alone, and its
`cells()` is `[(2, 2)]`.

## Intrinsic - facing:
`facingFor(-1, 0)`, `facingFor(-1, -1)` and `facingFor(0, 1)` are
`'left'`; `facingFor(1, 0)`, `facingFor(1, 1)` and `facingFor(0, -1)`
are `'right'`; `facingFor(0, 0)` and `facingFor(2, 0)` throw a
`TypeError`.

# Callbacks:
None

# API Shapes:
- [shape:point](point.md)
- [shape:stats](stats.md)
- [shape:bestiary](bestiary.md)
