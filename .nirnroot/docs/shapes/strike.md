# strike

How one attack went. Immutable.

The module (`shapes/strike/index.mjs`) exports `of({hit, critical,
damage})`: `hit` and `critical` booleans, `damage` an integer of 0 or
more; a miss (`hit` false) has `critical` false and `damage` 0; a hit has
`damage` at least 1. Any other input is refused with a `TypeError`.

# Fields:
## Field - hit:
Property `hit`.

## Field - critical:
Property `critical`.

## Field - damage:
Property `damage`.

# Intrinsics:
## Intrinsic - valid:
`of({hit: true, critical: false, damage: 3})` has those values and is
frozen; `of({hit: false, critical: false, damage: 0})` is accepted. A miss
with `damage` 2, a miss that is `critical`, a hit with `damage` 0, and
`damage` 1.5 each throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
