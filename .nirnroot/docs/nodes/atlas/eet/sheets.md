# atlas: edge test `sheets`

Browser tests (`*.browser.test.mjs`): the page serves the project's
asset area under `/assets/`, and the five sheets listed below are there.
Use the page's canvas, or a fresh `document.createElement('canvas')`,
for drawing, with image smoothing off.

The edge under test:

- [eed:atlas](../EED.md)

# API Shapes:
- [shape:sprite](../../../shapes/sprite.md)

# Assets:
- [asset:sheets/dungeon.png](../../../../../assets/sheets/dungeon.png)
- [asset:sheets/floor.png](../../../../../assets/sheets/floor.png)
- [asset:sheets/heroes.png](../../../../../assets/sheets/heroes.png)
- [asset:sheets/monsters.png](../../../../../assets/sheets/monsters.png)
- [asset:sheets/items.png](../../../../../assets/sheets/items.png)

# Intrinsics:
## Intrinsic - table:
As the EED states. Check `sprite('hero')` is `null` first, in a test of its own that runs before any `load` (tests run in the order written).

## Intrinsic - keyed:
As the EED states.

## Intrinsic - fails:
As the EED states: the page answers 404 for any path outside `/assets/`.

## Intrinsic - sprite/valid:
As the shape states.
