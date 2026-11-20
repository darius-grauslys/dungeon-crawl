# item

A thing lying on the floor that the hero picks up by stepping on it.
Immutable.

| kind | what picking it up does |
|---|---|
| `potion` | heals 8 hit points, never above `maxHp` |
| `gold` | adds `amount` to the hero's gold |
| `sword` | adds 2 to the hero's `attack` |
| `armor` | adds 1 to the hero's `defense` |

The module (`shapes/item/index.mjs`) exports `of({id, kind, pos, amount})`:
`id` an integer of 0 or more; `kind` one of the four; `pos` a `point`;
`amount` an integer, at least 1 for `gold` and exactly 0 for the others
(left out: 0). Any other input is refused with a `TypeError`. `KINDS` is
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

# Intrinsics:
## Intrinsic - valid:
`of({id: 4, kind: 'gold', pos: point.of(2, 2), amount: 10})` has those
values and is frozen; `of({id: 5, kind: 'potion', pos: point.of(1, 1)})`
has `amount` 0. `kind: 'gem'`, a `gold` of `amount` 0, a `sword` of
`amount` 3, and `pos: [1, 1]` each throw a `TypeError`.

# Callbacks:
None

# API Shapes:
- [shape:point](point.md)
