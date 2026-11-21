# intent

What a creature means to do with its next action. Immutable.

| kind | meaning |
|---|---|
| `move` | step one cell (`dx`, `dy`); into a monster, that is an attack on it |
| `attack` | attack the cell one step away (`dx`, `dy`), whatever stands there |
| `use` | use something (a placeholder: it does nothing yet) |
| `wait` | do nothing |

For `move` and `attack`, exactly one of `dx` and `dy` is 1 or -1 and the
other 0 (orthogonal). For `use` and `wait` both are 0.

The module (`shapes/intent/index.mjs`) exports `move(dx, dy)`,
`attack(dx, dy)`, `use()` and `wait()`, each answering a frozen intent,
and `KINDS`, the four kind names in the table's order (a frozen array).
`move` and `attack` refuse any other `dx`, `dy` with a `TypeError`.

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
`attack(1, 0)` has kind `attack`, `dx` 1, `dy` 0. `use()` and `wait()`
have their kinds and `dx`, `dy` both 0. `move(1, 1)`, `move(0, 0)`,
`move(2, 0)`, `move('1', 0)` and `attack(0, 0)` throw a `TypeError`.
`KINDS` is `['move', 'attack', 'use', 'wait']`.

# Callbacks:
None

# API Shapes:
None
