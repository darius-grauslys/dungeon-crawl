# intent

What a creature means to do with its turn. Immutable.

| kind | meaning |
|---|---|
| `move` | step one cell (`dx`, `dy`); into a creature, that is an attack |
| `wait` | do nothing this turn |
| `descend` | take the stairs (the hero only) |
| `restart` | start a new game (the hero only) |

Moves are orthogonal: for `move`, exactly one of `dx` and `dy` is 1 or -1
and the other 0. For every other kind both are 0.

The module (`shapes/intent/index.mjs`) exports `move(dx, dy)`, `wait()`,
`descend()` and `restart()`, each answering a frozen intent. `move`
refuses any other `dx`, `dy` with a `TypeError`.

# Fields:
## Field - kind:
Property `kind`.

## Field - dx:
Property `dx`.

## Field - dy:
Property `dy`.

# Intrinsics:
## Intrinsic - valid:
`move(0, -1)` has kind `move`, `dx` 0, `dy` -1 and is frozen. `wait()`,
`descend()`, `restart()` have their kinds and `dx`, `dy` both 0.
`move(1, 1)`, `move(0, 0)`, `move(2, 0)` and `move('1', 0)` throw a
`TypeError`.

# Callbacks:
None

# API Shapes:
None
