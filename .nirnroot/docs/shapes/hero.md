# hero

A player in the world: their name, their body (an `actor` of kind
`hero`), the action they last asked for that hasn't fired yet, whether
they are alive, and the ware they have been offered (bumped once, so a
second bump buys it). Immutable.

The module (`shapes/hero/index.mjs`) exports `of({name, actor, pending,
alive, offer})`: `name` a name (as `save`'s `isName` says); `actor` an `actor` of
kind `hero`; `pending` an `intent` or `null` (left out: `null`); `alive` a
boolean (left out: `true`); `offer` the `id` of a ware (an integer of 0
or more) or `null` (left out: `null`). A hero that is not alive has 0 hit points; an
alive one more than 0. Any other input is refused with a `TypeError`.

# Fields:
## Field - name:
Property `name`.

## Field - actor:
Property `actor`, an `actor` of kind `hero`.

## Field - pending:
Property `pending`, an `intent` or `null`.

## Field - alive:
Property `alive`.

## Field - offer:
Property `offer`: a ware's `id`, or `null`.

## Field - with:
`with(changes)` answers a new hero, this one with the properties of
`changes` (any of `actor`, `pending`, `alive`, `offer`) put in, checked as `of`
checks them; this one is unchanged. A method every hero shares (on its
prototype), never an own property: two heroes of equal fields are deep
equal (`assert.deepStrictEqual`).

# Intrinsics:
## Intrinsic - valid:
`h = of({name: 'Ann', actor: a})` (`a` an alive `hero` actor) has `name`
`'Ann'`, that `actor`, `pending` `null`, `alive` true, `offer` `null`,
and is frozen. `h.with({pending: move(1, 0)}).pending.kind` is `'move'`
and `h.pending` is still `null`; `h.with({offer: 12}).offer` is 12. A name `''`, an actor of kind `bat`, `pending: {kind:
'move', dx: 1, dy: 0}` (a plain object), `alive: 'yes'`, `offer: -1`, `offer: '12'`, `alive: false`
with an actor of 5 hit points, and `alive: true` with an actor of 0 hit
points each throw a `TypeError`. Two heroes made by `of` from the same
fields pass `assert.deepStrictEqual`; `Object.hasOwn(h, 'with')` is false.

# Callbacks:
None

# API Shapes:
- [shape:actor](actor.md)
- [shape:intent](intent.md)
- [shape:save](save.md)
