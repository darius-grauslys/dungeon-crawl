# play: `page`

`start`:

1. Find or make the canvas; `view.init(canvas)`; `view.load('/assets/')`
   (on its rejection `console.error`); `conn = net.connect(url, open)`;
   `menu.mount(document, handlers)` (closed); `landing.show(document,
   {create, join})`, whose `create(save, name)` remembers `name` and
   sends `create(save)`, and whose `join(session, password, name)`
   remembers all three and sends `join(...)`.
2. The keys: `input` prevents the default of every key it maps, so it
   must not listen while the landing shows (the player types there).
   Only on `joined` call `stopKeys = input.listen(document, {intent,
   command})`; `stop` calls `stopKeys` if it was set.
3. A frame loop (`requestAnimationFrame` of the document's `defaultView`, or the global one for a document with none): each
   frame, `conn.drain()` and handle each message as the EED's flow says;
   remember the `performance.now()` at which the latest `state` came; once
there is a world, draw every frame (`view.draw(world, me, paused, now)`,
`now` as the EED says).
4. `created(session, password)`: remember the password, send the `join`.
   `joined`: `landing.hide()`, `menu.setSession(session, password)`,
   screen `game`, start listening to the keys.

The default `download`: `URL.createObjectURL(new Blob([text], {type:
'application/json'}))`, an `<a>` with `href` and `download` set, clicked,
then the URL revoked.

This Node's edge:

- [eed:play](../EED.md)

Children this specification reaches:

- [eed:net](../../net/EED.md)
- [eed:landing](../../landing/EED.md)
- [eed:menu](../../menu/EED.md)
- [eed:view](../../view/EED.md)
- [eed:input](../../input/EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:message](../../../shapes/message.md)
- [shape:save](../../../shapes/save.md)
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
`keydown` events on the document once in the game; the socket's messages;
animation frames; the page's `location` (for the default url); the
sprites, loaded by `view`.

# Outbound Side-Effects:
A canvas appended to the body when the page has none; the landing and the
menu in the page; drawing on the canvas; texts sent on the socket; a
download of the save file; `console.error` when the sprites fail to load.
