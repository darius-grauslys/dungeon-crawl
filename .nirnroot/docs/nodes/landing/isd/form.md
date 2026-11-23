# landing: `form`

Build the elements with `document.createElement`, styled inline (a
fixed, centred panel, `#160d13` behind light text, two groups with a
heading each: `Join a game` with the lobby list, `New game` with the
file input and the create button; the name above both). The lobby list
is rebuilt whole on each `lobby` (its `<li>`s removed and made again);
one click listener per `Join` button, or one on the list reading
`event.target.dataset.session`. The file is read with `file.text()`. With `options.debug`, a third group, `Debug`, below the other two, with
its inputs (each labelled with its stat) and buttons; it builds the save
with `save`'s `of` (the stats as a plain object, `save` makes them a
`stats`). Keep the root element and
whether it is in the page; `hide` removes it and forgets it.

This Node's edge:

- [eed:landing](../EED.md)

# API Shapes:
- [shape:save](../../../shapes/save.md)
- [shape:stats](../../../shapes/stats.md)

# Inbound Side-Effects:
Clicks on its buttons; the values of its inputs; the file chosen.

# Outbound Side-Effects:
Its elements, added to and removed from the page.
