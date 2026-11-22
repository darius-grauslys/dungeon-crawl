# item

A thing lying on the floor that a hero picks up by stepping on it, or,
in a shop, a **ware**: a thing for sale, with a price. Immutable.

| kind | what picking it up does |
|---|---|
| `potion` | heals 8 hit points, never above `maxHp` |
| `gold` | adds `amount` to the party's gold |
| `sword` | adds 2 to that hero's `attack` |
| `armor` | adds 1 to that hero's `defense` |

An item with a `price` above 0 is a ware: it is never picked up by
stepping on it, but bought (`rules` says how), and its effect is then the
table's. A `gold` is never a ware.

The module (`shapes/item/index.mjs`) exports `of({id, kind, pos, amount, price})`:
`id` an integer of 0 or more; `kind` one of the four; `pos` a `point`;
`amount` an integer, at least 1 for `gold` and exactly 0 for the others
(left out: 0); `price` an integer of 0 or more, 0 for a `gold` (left out:
0). Any other input is refused with a `TypeError`. `KINDS` is
the four kind names, in the table's order (a frozen array).

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

# Intrinsics:
## Intrinsic - valid:
`of({id: 4, kind: 'gold', pos: point.of(2, 2), amount: 10})` has those
values and is frozen; `of({id: 5, kind: 'potion', pos: point.of(1, 1)})`
has `amount` 0 and `price` 0; `of({id: 6, kind: 'sword', pos: point.of(1,
1), price: 30})` has `price` 30. `kind: 'gem'`, a `gold` of `amount` 0, a
`sword` of `amount` 3, `pos: [1, 1]`, a `price` of -1 or 2.5, and a
`gold` of `price` 5 each throw a `TypeError`.

# Callbacks:
None

# API Shapes:
- [shape:point](point.md)
