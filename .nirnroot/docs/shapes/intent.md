# intent

What a creature means to do with its next action. Immutable.

A **direction** `(dx, dy)` is one of the eight steps to a neighbouring
cell: `dx` and `dy` each -1, 0 or 1, not both 0. The four orthogonal
ones (one of them 0) and the four diagonal ones (neither 0).

| kind | meaning |
|---|---|
| `move` | step one cell (`dx`, `dy`), a direction; into a creature it fights, that is an attack on it |
| `attack` | attack toward a direction (`dx`, `dy`), as far as the attacker's `range`; both 0: toward the way the attacker is aiming |
| `use` | use something (a placeholder: it does nothing yet) |
| `wait` | do nothing |
| `descend` | take the party down the stairs: it goes only when every alive hero is within 5 of them |
| `face` | aim (and look) toward a direction (`dx`, `dy`) without moving |

For `use`, `wait` and `descend` both `dx` and `dy` are 0.

The module (`shapes/intent/index.mjs`) exports `move(dx, dy)`,
`attack(dx, dy)`, `use()`, `wait()`, `descend()` and `face(dx, dy)`,
each answering a frozen intent, and `KINDS`, the six kind names in the
table's order (a frozen array). `move` and `face` refuse anything but a
direction with a `TypeError`; `attack` takes a direction, or `(0, 0)`,
and `attack()` with no arguments is `attack(0, 0)`; anything else is a
`TypeError`.

# Fields:
## Field - kind:
Property `kind`.

## Field - dx:
Property `dx`.

## Field - dy:
Property `dy`.

# Intrinsics:
## Intrinsic - valid:
`move(0, -1)` has kind `move`, `dx` 0, `dy` -1 and is frozen;
`move(1, 1)` and `move(-1, 1)` are accepted (diagonal). `attack(1, 0)`
has kind `attack`, `dx` 1, `dy` 0; `attack()` and `attack(0, 0)` have
`dx` and `dy` 0; `attack(-1, -1)` is accepted. `face(1, -1)` has kind
`face`, `dx` 1, `dy` -1. `use()`, `wait()` and `descend()` have their
kinds and `dx`, `dy` both 0. `move(0, 0)`, `move(2, 0)`, `move('1', 0)`,
`face(0, 0)`, `face(0, 2)`, `attack(2, 0)` and `attack(1)` throw a
`TypeError`. `KINDS` is `['move', 'attack', 'use', 'wait', 'descend',
'face']`.

# Callbacks:
None

# API Shapes:
None
