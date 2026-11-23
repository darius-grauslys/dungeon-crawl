# item

A thing lying on the floor that a hero picks up by stepping on it; in a
shop, a **ware**: a thing for sale, with a price; or, in a lair, a
**lever**. Immutable.

| kind | what it is |
|---|---|
| `potion` | a potion: drinking it raises `maxHp` for good |
| `gold` | the party's money (`amount`) |
| `sword`, `sword-2`, `sword-3`, `sword-4` | a weapon, in four grades: a sword, a fine sword, an axe, a great axe |
| `armor`, `armor-2`, `armor-3`, `armor-4` | armor, in four grades: armor, chainmail, bronze mail, jade mail |
| `ring` | a ring (magic power) |
| `necklace` | a cross necklace (magic resist) |
| `lever` | never picked up: a hero pulls it (`rules` says how) |
| `bread`, `meat`, `cheese` | food: eating it heals |

What picking each up does is `rules`'s.

An item with a `price` above 0 is a ware: it is never picked up by
stepping on it, but bought (`rules` says how), and its effect is then what picking it
up does. A `gold` is never a ware, nor is a `lever`. A lever is `pulled`
or not; no other item is ever `pulled`.

An item can have been **flung**: thrown onto its cell from another, at a
moment (gold spilling from a slain boss). `flung` says from where and
when, so the screen can draw it flying.

The module (`shapes/item/index.mjs`) exports `of({id, kind, pos, amount,
price, pulled, flung})`: `id` an integer of 0 or more; `kind` one of the
sixteen; `pos` a `point`; `amount` an integer, at least 1 for `gold` and
exactly 0 for the others (left out: 0); `price` an integer of 0 or more,
0 for a `gold` and a `lever` (left out: 0); `pulled` a boolean, `false`
for any kind but `lever` (left out: `false`); `flung` `null` or `{x, y,
at}`, the cell it was thrown from and the world time it was thrown, all
integers of 0 or more (left out: `null`; the item keeps a frozen copy
with those three keys). Any other input is refused with a `TypeError`.
`KINDS` is the sixteen kind names (a frozen array), in this order:
`potion`, `gold`, `sword`, `armor`, `ring`, `necklace`, `lever`,
`bread`, `meat`, `cheese`, `sword-2`, `sword-3`, `sword-4`, `armor-2`,
`armor-3`, `armor-4`.

# Fields:
## Field - id:
Property `id`.

## Field - kind:
Property `kind`.

## Field - pos:
Property `pos`, a `point`.

## Field - amount:
Property `amount`.

## Field - price:
Property `price`: 0 for a thing to pick up, the gold it costs for a ware.

## Field - pulled:
Property `pulled`: whether a lever has been pulled.

## Field - flung:
Property `flung`: a frozen `{x, y, at}`, or `null`.

# Intrinsics:
## Intrinsic - valid:
`of({id: 4, kind: 'gold', pos: point.of(2, 2), amount: 10})` has those
values, `pulled` false and `flung` null, and is frozen; `of({id: 5,
kind: 'potion', pos: point.of(1, 1)})` has `amount` 0 and `price` 0;
`of({id: 6, kind: 'sword', pos: point.of(1, 1), price: 30})` has `price`
30; `of({id: 7, kind: 'lever', pos: point.of(3, 3), pulled: true})` has
`pulled` true; `of({id: 8, kind: 'gold', pos: point.of(2, 2), amount: 5,
flung: {x: 4, y: 4, at: 100}})` has `flung` frozen and deep equal to
`{x: 4, y: 4, at: 100}`. `kind: 'gem'`, a `gold` of `amount` 0, a
`sword` of `amount` 3, `pos: [1, 1]`, a `price` of -1 or 2.5, a `gold`
of `price` 5, a `lever` of `price` 5, a `potion` that is `pulled`,
`pulled: 'yes'`, and `flung` of `{x: 1, y: 1}` or `{x: -1, y: 1, at: 0}`
each throw a `TypeError`. `of({id: 9, kind: 'ring', pos: point.of(1, 1),
price: 35})` and `of({id: 10, kind: 'necklace', pos: point.of(1, 1)})`
are accepted. `of({id: 11, kind: 'cheese', pos: point.of(1, 1)})`, `of({id: 12, kind:
'armor-3', pos: point.of(1, 1), price: 70})` and `of({id: 13, kind:
'sword-4', pos: point.of(1, 1)})` are accepted; a `meat` of `amount` 2
and an `armor-5` throw a `TypeError`. `KINDS` is `['potion', 'gold',
'sword', 'armor', 'ring', 'necklace', 'lever', 'bread', 'meat',
'cheese', 'sword-2', 'sword-3', 'sword-4', 'armor-2', 'armor-3',
'armor-4']`.

# Callbacks:
None

# API Shapes:
- [shape:point](point.md)
