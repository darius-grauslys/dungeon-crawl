# landing: edge test `screen`

Browser tests (`*.browser.test.mjs`) on the test page. Fill the inputs by
setting `value`, click with `element.click()`, and give `#landing-save` a
file with a `DataTransfer` (`const dt = new DataTransfer();
dt.items.add(new File([text], 'save.json')); input.files = dt.files;`).
Reading a file takes a moment: wait (up to a second) for `create` to be
called. `hide()` every handle a test made before it ends. Record the
handlers' calls with plain functions that push their arguments.

The edge under test:

- [eed:landing](../EED.md)

# API Shapes:
- [shape:save](../../../shapes/save.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:level](../../../shapes/level.md)

# Intrinsics:
## Intrinsic - builds:
As the EED states.

## Intrinsic - creates:
As the EED states.

## Intrinsic - imports:
As the EED states.

## Intrinsic - lobby:
As the EED states.

## Intrinsic - joins:
As the EED states.

## Intrinsic - debug:
As the EED states: fill the number inputs by setting `value`; compare the save's `depth`, `players[0].name` and `players[0].stats` (deep equal to the plain object), and check `seed` with `Number.isInteger`.

## Intrinsic - handle:
As the EED states.

## Intrinsic - save/valid:
As the shape states.
