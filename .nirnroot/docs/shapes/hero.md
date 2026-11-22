# hero

A player in the world: their name, their body (an `actor` of kind
`hero`), the action they last asked for that hasn't fired yet, whether
they are alive, the ware they have been offered (bumped once, so a
second bump buys it), and how they look. Immutable.

**How a hero looks.** The hero sheet holds four **colour** variations of
the hero side by side, and six **groups** of animations stacked down it,
one per thing held in the hand (group 0: empty-handed). A hero's
`colour` (0 to 3) picks its variation, its `group` (0 to 5) its group
(`atlas` says where each lies). Nothing sets a `group` other than 0 yet.

The module (`shapes/hero/index.mjs`) exports `of({name, actor, pending,
alive, offer, colour, group})`: `name` a name (as `save`'s `isName` says); `actor` an `actor` of
kind `hero`; `pending` an `intent` or `null` (left out: `null`); `alive` a
boolean (left out: `true`); `offer` the `id` of a ware (an integer of 0
or more) or `null` (left out: `null`); `colour` an integer from 0 to 3
(left out: 0); `group` an integer from 0 to 5 (left out: 0). A hero that
is not alive has 0 hit points; an
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

## Field - colour:
Property `colour`: which of the four colour variations it is drawn in.

## Field - group:
Property `group`: which group of the hero sheet's animations it is drawn
from.

## Field - with:
`with(changes)` answers a new hero, this one with the properties of
`changes` (any of `actor`, `pending`, `alive`, `offer`, `colour`, `group`) put in, checked as `of`
checks them; this one is unchanged. A method every hero shares (on its
prototype), never an own property: two heroes of equal fields are deep
equal (`assert.deepStrictEqual`).

# Intrinsics:
## Intrinsic - valid:
`h = of({name: 'Ann', actor: a})` (`a` an alive `hero` actor) has `name`
`'Ann'`, that `actor`, `pending` `null`, `alive` true, `offer` `null`,
`colour` 0 and `group` 0, and is frozen; `h.with({colour: 2, group:
1})` has `colour` 2 and `group` 1. `h.with({pending: move(1, 0)}).pending.kind` is `'move'`
and `h.pending` is still `null`; `h.with({offer: 12}).offer` is 12. A name `''`, an actor of kind `bat`, `pending: {kind:
'move', dx: 1, dy: 0}` (a plain object), `alive: 'yes'`, `offer: -1`, `offer: '12'`, `colour: 4`, `colour: 1.5`,
`group: 6`, `group: -1`, `alive: false`
with an actor of 5 hit points, and `alive: true` with an actor of 0 hit
points each throw a `TypeError`. Two heroes made by `of` from the same
fields pass `assert.deepStrictEqual`; `Object.hasOwn(h, 'with')` is false.

# Callbacks:
None

# API Shapes:
- [shape:actor](actor.md)
- [shape:intent](intent.md)
- [shape:save](save.md)
