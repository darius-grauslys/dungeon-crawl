# atlas: `sheets`

Load each sheet as an `Image` (`img.src = base + path`, awaiting
`img.decode()`, or its `onload`/`onerror`), draw it onto a canvas of
its size (`document.createElement('canvas')`), read its pixels with
`getImageData`, set the alpha of every pixel exactly rgb(22, 13, 19) to 0,
put them back, and keep that canvas as the sheet. Load the five together
(`Promise.all`); when one rejects, reject with `new Error('atlas: could not
load ' + path)`. Build each name's `sprite` once the sheets are in, and
answer them from a map; keep the previous map until a new `load`
resolves. The table is the EED's: copy it exactly.

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

# Inbound Side-Effects:
The five sheets, fetched over HTTP from `base`.

# Outbound Side-Effects:
Canvases it creates for the keyed sheets (never attached to the page).
