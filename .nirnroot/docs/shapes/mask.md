# mask

A yes or no for every cell of a grid of the same size: which cells are
seen now, or which have ever been seen. Immutable.

The module (`shapes/mask/index.mjs`) exports:

- `empty(width, height)`: every cell false.
- `of(width, height, cells)`: `cells` an array of exactly
  `width * height` booleans, row by row (cell `(x, y)` is index
  `y * width + x`), copied.
- `union(a, b)`: two masks of the same width and height; true where
  either is.

`width` and `height` are integers from 1 to 256. Any other input is
refused with a `TypeError`.

# Fields:
## Field - width:
Read as the property `width`.

## Field - height:
Read as the property `height`.

## Field - at:
`at(x, y)`: the cell's boolean; `false` outside the rectangle.

## Field - count:
`count()`: how many cells are true.

## Field - cells:
`cells()`: a fresh array copy of the booleans, row by row.

# Intrinsics:
## Intrinsic - valid:
`empty(3, 2)` has width 3, height 2 and `count()` 0. With
`a = of(2, 1, [true, false])` and `b = of(2, 1, [false, true])`:
`a.at(0, 0)` true, `a.at(1, 0)` false, `a.at(5, 5)` false,
`union(a, b).count()` 2, and `a` is frozen. `of(2, 1, [true])`,
`of(1, 1, [1])`, `union(empty(1, 1), empty(2, 1))` and `empty(0, 3)`
throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
