# atlas: edge test `sheets`

Browser tests (`*.browser.test.mjs`): the page serves the project's
asset area under `/assets/`, and the twenty sheets listed below are there.
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
- [asset:sheets/frozen.png](../../../../../assets/sheets/frozen.png)
- [asset:sheets/frozen-floor.png](../../../../../assets/sheets/frozen-floor.png)
- [asset:sheets/arid.png](../../../../../assets/sheets/arid.png)
- [asset:sheets/arid-floor.png](../../../../../assets/sheets/arid-floor.png)
- [asset:sheets/temple.png](../../../../../assets/sheets/temple.png)
- [asset:sheets/temple-floor.png](../../../../../assets/sheets/temple-floor.png)
- [asset:sheets/magma.png](../../../../../assets/sheets/magma.png)
- [asset:sheets/magma-floor.png](../../../../../assets/sheets/magma-floor.png)
- [asset:sheets/interior.png](../../../../../assets/sheets/interior.png)
- [asset:sheets/interior-floor.png](../../../../../assets/sheets/interior-floor.png)
- [asset:sheets/generics.png](../../../../../assets/sheets/generics.png)
- [asset:sheets/frozen-monsters.png](../../../../../assets/sheets/frozen-monsters.png)
- [asset:sheets/arid-monsters.png](../../../../../assets/sheets/arid-monsters.png)
- [asset:sheets/temple-monsters.png](../../../../../assets/sheets/temple-monsters.png)
- [asset:sheets/magma-monsters.png](../../../../../assets/sheets/magma-monsters.png)

# Intrinsics:
## Intrinsic - table:
As the EED states. Check `sprite('hero')` is `null` first, in a test of its own that runs before any `load` (tests run in the order written).

## Intrinsic - themes:
As the EED states; check the `null` before any `load` in the test that runs first, with `sprite('hero')`'s.

## Intrinsic - keyed:
As the EED states.

## Intrinsic - fails:
As the EED states: the page answers 404 for any path outside `/assets/`.

## Intrinsic - sprite/valid:
As the shape states.
