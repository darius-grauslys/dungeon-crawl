# point

A cell of the dungeon's grid: a column `x` and a row `y`, both integers.
`x` grows to the right and `y` grows downward, as on a canvas. Immutable.

The module (`shapes/point/index.mjs`) exports `of(x, y)`, which answers a
frozen point, and `equals(a, b)`, true when two points have the same `x`
and `y`.

# Fields:
## Field - x:
The column, an integer (negative is allowed; the grid decides what is
inside it). Read as the property `x`.

## Field - y:
The row, an integer. Read as the property `y`.

# Intrinsics:
## Intrinsic - valid:
`of(3, -2)` has `x` 3 and `y` -2, and is frozen (`Object.isFrozen`).
`of(1.5, 0)`, `of(0, NaN)`, `of('1', 2)` and `of(1)` throw a `TypeError`.
`equals(of(1, 2), of(1, 2))` is true; `equals(of(1, 2), of(2, 1))` is
false.

# Callbacks:
None

# API Shapes:
None
