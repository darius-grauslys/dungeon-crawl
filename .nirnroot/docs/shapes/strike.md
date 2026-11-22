# strike

How one attack went. Immutable.

The module (`shapes/strike/index.mjs`) exports `of({hit, critical,
damage, magic})`: `hit` and `critical` booleans, `damage` an integer of 0
or more, the whole damage dealt; `magic` an integer from 0 to `damage`
(left out: 0), the part of `damage` that is magic; a miss (`hit` false)
has `critical` false, `damage` 0 and `magic` 0; a hit has `damage` at
least 1. Any other input is refused with a `TypeError`.

# Fields:
## Field - hit:
Property `hit`.

## Field - critical:
Property `critical`.

## Field - damage:
Property `damage`.

## Field - magic:
Property `magic`.

# Intrinsics:
## Intrinsic - valid:
`of({hit: true, critical: false, damage: 3})` has those values, `magic`
0, and is frozen; `of({hit: true, critical: false, damage: 9, magic: 6})`
has `magic` 6; `of({hit: false, critical: false, damage: 0})` is
accepted. A miss with `damage` 2, a miss that is `critical`, a miss with
`magic` 1, a hit with `damage` 0, `damage` 1.5, and a `magic` above
`damage` or of -1 each throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
