# play: `page`

`start`:

1. Find or make the canvas; `view.init(canvas)`; `view.load('/assets/')`
   (on its rejection `console.error`); `sound = audio.create({context:
   options.audioContext})` (pass `context` only when the option is
   given), `sound.load()`; a `keydown` and a `pointerdown` listener on
   the document calling `sound.resume()` (removed by `stop`); `conn = net.connect(url, open)`;
   `menu.mount(document, handlers)` (closed); `landing.show(document,
   {create, join})`, whose `create(save, name)` remembers `name` and
   sends `create(save)`, and whose `join(session, name)` remembers both
   and sends `join(...)`. The lobby: a `setInterval` of 2000 ms sending
   `list()` while the landing shows, plus one `list()` sent at once (`net` keeps it
   until the socket opens); `lobby` messages go to the landing handle's `lobby`. `stop` and
   `joined` clear the interval.
2. The keys: `input` prevents the default of every key it maps, so it
   must not listen while the landing shows (the player types there).
   Only on `joined` call `stopKeys = input.listen(document, {intent,
   command, aiming})`, `aiming(held)` keeping whether Shift is held, for `view.draw`'s `aiming`; `stop` calls `stopKeys` if it was set.
3. A frame loop (`requestAnimationFrame` of the document's `defaultView`, or the global one for a document with none): each
   frame, `conn.drain()` and handle each message as the EED's flow says;
   remember the `performance.now()` at which the latest `state` came; once
there is a world, draw every frame (`view.draw(world, me, paused, now, aiming)`,
`now` as the EED says).
4. `created(session)`: send the `join`.
   `joined`: `landing.hide()`, clear the lobby interval, `menu.setSession(session)`,
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
- [eed:audio](../../audio/EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:message](../../../shapes/message.md)
- [shape:save](../../../shapes/save.md)
- [shape:intent](../../../shapes/intent.md)

# Inbound Side-Effects:
`keydown` events on the document once in the game; the socket's messages;
animation frames; the page's `location` (for the default url); the
sprites, loaded by `view`; the sounds, loaded by `audio`; `pointerdown`
events (to let sound play).

# Outbound Side-Effects:
A canvas appended to the body when the page has none; the landing and the
menu in the page; drawing on the canvas; texts sent on the socket; a
download of the save file; `console.error` when the sprites fail to load;
sound, through `audio`.
