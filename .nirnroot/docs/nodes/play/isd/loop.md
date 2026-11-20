# play: `loop`

`start`: find or make the canvas, `view.init(canvas)`,
`world = rules.newGame(seed)`, `view.draw(world)`, then
`view.load('/assets/').then(() => { if (!stopped) view.draw(world) },
e => console.error(e))`, and
`stop = input.listen(document, i => { world = rules.step(world, i);
view.draw(world); })`. A game that has ended (`dead` or `won`) still takes
`restart`: `rules.step` handles it. No timers and no animation: the screen
changes only when a key is pressed or the sprites arrive.

This Node's edge:

- [eed:play](../EED.md)

Children this specification reaches:

- [eed:rules](../../rules/EED.md)
- [eed:view](../../view/EED.md)
- [eed:input](../../input/EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
`keydown` events on the document; the sprites, loaded by `view`.

# Outbound Side-Effects:
A canvas appended to the body when the page has none; drawing on the
canvas; `console.error` when the sprites fail to load.
