# tile-grid

A dungeon floor's terrain: a rectangle of cells, each one of three kinds.
Immutable.

| kind | char | meaning |
|---|---|---|
| `wall` | `#` | solid: nothing enters it, and it blocks sight |
| `floor` | `.` | open ground |
| `stairs` | `>` | open ground with the way down |

Cells are stored row by row: the cell `(x, y)` is index `y * width + x`.

The module (`shapes/tile-grid/index.mjs`) exports:

- `of(width, height, tiles)`: `width` and `height` integers from 1 to 256;
  `tiles` an array of exactly `width * height` kind names. The array is
  copied: changing it afterwards changes nothing.
- `fromRows(rows)`: `rows` a non-empty array of strings of equal length
  using the chars above, row 0 first. `fromRows(['###', '#.>', '###'])` is
  3 wide and 3 high, with `floor` at (1, 1) and `stairs` at (2, 1).

Any other input is refused with a `TypeError`.

# Fields:
## Field - width:
The number of columns. Read as the property `width`.

## Field - height:
The number of rows. Read as the property `height`.

## Field - at:
`at(x, y)` answers the kind of the cell at column `x`, row `y`, and
`wall` for any cell outside the rectangle (negative included).

## Field - tiles:
`tiles()` answers a fresh array copy of all the kinds, row by row.

## Field - open:
`open(x, y)` is true when `at(x, y)` is `floor` or `stairs`.

# Intrinsics:
## Intrinsic - valid:
`fromRows(['###', '#.>', '###'])` has width 3, height 3, `at(1, 1)`
`floor`, `at(2, 1)` `stairs`, `at(0, 0)` `wall`, `at(-1, 0)` and `at(3, 1)`
`wall`, `open(1, 1)` and `open(2, 1)` true, `open(0, 1)` false, and it
is frozen. `of(2, 1, ['floor', 'wall'])` has `at(0, 0)` `floor`.
`of(2, 2, ['floor'])`, `of(1, 1, ['lava'])`, `of(0, 1, [])`,
`fromRows([])`, `fromRows(['##', '#'])` and `fromRows(['#x'])` throw a
`TypeError`. Changing the array given to `of`, or the array `tiles()`
answered, changes no later `at`.

# Callbacks:
None

# API Shapes:
None
