# atlas: `sheets`

Load each sheet as an `Image` (`img.src = base + path`, awaiting
`img.decode()`, or its `onload`/`onerror`), draw it onto a canvas of
its size (`document.createElement('canvas')`), read its pixels with
`getImageData`, set the alpha of every pixel exactly rgb(22, 13, 19) to 0,
put them back, and keep that canvas as the sheet. Load the fifteen together
(`Promise.all`); when one rejects, reject with `new Error('atlas: could not
load ' + path)`. Build each name's `sprite` once the sheets are in, and
answer them from a map, and each theme's eighteen tiles (keyed
`theme + '/' + name`) from another; keep the previous maps until a new
`load` resolves. The tables are the EED's: copy them exactly.

This Node's edge:

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

# Inbound Side-Effects:
The fifteen sheets, fetched over HTTP from `base`.

# Outbound Side-Effects:
Canvases it creates for the keyed sheets (never attached to the page).
