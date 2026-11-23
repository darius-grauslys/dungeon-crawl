# play

The game in a page: the landing, the connection to the server, the
keyboard, the menu, the screen and the sound, wired together. It keeps the latest
world the server sent and draws it. Runs in a browser.

**The flow.** `start` shows the landing (`landing`) over the canvas and
connects to the server (`net`). On the landing:
- *The lobby*: as soon as the socket is open, and then every 2000
  milliseconds while the landing shows, it sends `list()`; each
  `lobby(sessions)` is handed to the landing (`lobby(sessions)`, the
  entries as plain `{session, players, depth}`).
- *Create*: sends `create(save)` (the save chosen, or `null`); on
  `created(session)` it sends `join(session, name)` with the name given.
- *Join*: sends `join(session, name)`.
- `joined(session, name)`: the landing is hidden, the lobby is no longer
  asked for, the player is `name` in `session`, and the game screen
  begins: the menu's session line is `session`.
- `refused(reason)` while the landing shows: its error is the reason's
  text: `full` `The server already has 4 sessions.`, `no-session` `No
  such session.`, `name-taken`
  `Someone is already playing that name.`, `party-full` `That party is
  full.`, anything else `Something went wrong (<reason>).`

In the game:
- Every `state(world, paused)` is kept and given to the menu
  (`setPaused`). From the first one on, the screen is drawn every
  animation frame, `view.draw(world, name, paused, now, aiming)` with the latest
  world, so the creatures' animations play smoothly between the server's
  states: `now` is the world's `time` plus the milliseconds since that
  state arrived (by `performance.now()`), at most 100 more; while paused,
  the world's `time`.
- **Sound** (`audio`): each `state(world, paused)` that brings a new
  world is handed on, `audio.update(previous, world, name)` (`previous`
  the world kept before it, `null` for the first). The first key press
  or click anywhere in the page (`keydown` or `pointerdown` on the
  document, the landing's too) calls `audio.resume()`: browsers play
  no sound before one.
- The keys (`input`) while the menu is closed: an intent is sent as
  `act(intent)`; `menu` opens the menu; `pause` sends `pause(!paused)`;
  `mute` calls `audio.toggleMute()`, `quieter` `audio.quieter()`,
  `louder` `audio.louder()` (sending nothing).
- **Aiming**: while the player holds Shift in the game (`input`'s
  `aiming`), the screen is drawn with `aiming` true, so the aim dot
  shows; when Shift is let go (or the page loses focus), false.
  While the menu is open, only `menu` (Escape) does anything: it closes
  it.
- **Journeys** (`travel`): steps the page sends on its own, one after
  another, until the journey ends. Two kinds:
  - *exploring*, started by the `explore` command (`z`): each step
    `travel.explore(world, me)`;
  - *going to a cell*, started by a click (a `click` event) on the
    canvas, in the game, with the menu closed: the canvas pixel under
    it (`(clientX - rect.left) * canvas.width / rect.width`, and the
    same for `y` with the height, `rect` the canvas's
    `getBoundingClientRect()`) is given to `view.cellAt(world, me, x,
    y)`; `null` starts nothing; a cell starts a journey whose each
    step is `travel.toward(world, me, cell)`.
  At most one journey at a time: starting one ends the one before.
  **Any other input ends it**: every intent and every command `input`
  gives (an `explore` ends it and starts a new one), and the menu
  opening. A journey also ends when the world's `depth` changes, when
  me's hero is not alive, when a step answers `null` (arrived, or
  nowhere left to go), and, exploring only, when **an enemy comes into
  sight**: a world arrives in which `travel.sighted(world, me)` holds an
  id that was not in it for the world before (the world the journey
  started on sets the first list, so enemies already in sight when `z`
  is pressed don't stop it; enemies only the other heroes see never do).
  **Pacing**: each frame, with a journey on and the session not
  paused, if no step is awaited, the next step is asked from the latest
  world and sent as `act(step)`; it is then awaited until a world
  arrives in which me's hero's cell or its actor's `ready` differs from
  what they were when it was sent (the step fired), or 1500
  milliseconds (by `performance.now()`) have passed. So one step is
  sent per move, never two for one.
- The menu: `Settings` does nothing; `Save` sends `requestSave()`; the
  pause button sends `pause(paused)` as the menu says; `Back` closes it.
- `saved(save)`: the save is handed to `download` as the file
  `crawl-depth<depth>.json` with the text `save.text()`.
Keys do nothing while the landing shows, and are left to the page (so
the player can type in its fields).

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:message](../../shapes/message.md)

# Functions:
## Function - start:
`start(document, options) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. `options` (left out: `{}`): `url`, the WebSocket's (left out: `ws://` or, on an `https:` page, `wss://`, then the page's `location.host` and `/ws`); `open`, the socket factory given to `net` (left out: the browser's `WebSocket`); `download(filename, text)` (left out: a `Blob` of `application/json` saved through a temporary `<a download>`); `audioContext`, given to `audio.create` as its `context` (left out: the page's own; `null`: no sound); `debug`, true to show the landing's debug group (left out: true when the page's address has the query parameter `debug` set to `true`, `?debug=true`, read from `document.defaultView.location.search`; a document with no window: false). Starts loading the sprites from `/assets/` (if they fail, it logs the error with `console.error` and plays on in flat colours) and the sounds (`audio.load()`) and then goes as the flow says, reading what arrived once every animation frame. Answers a handle: `screen()`, `landing` or `game`; `world()`, the latest world (`null` before one); `me()`, the name played (`null` before `joined`); `menuOpen()`; `stop()`, which stops it all (the keyboard, the frame loop, the socket; the landing and the menu are taken out of the page).

# Intrinsics:
## Intrinsic - starts:
On the test page, `h = start(document, {open})` (a fake socket factory): the page still has exactly one canvas and holds `#landing`; `h.screen()` is `landing`, `h.world()` and `h.me()` `null`; `open` was called once with a url ending in `/ws`. A cancelable `keydown` of `w` dispatched on `document` is not `defaultPrevented`.

## Intrinsic - lobby:
Once the fake socket has opened, within half a second it has been sent `list().text()`; within 2500 milliseconds of that, `list().text()` again. The test delivers `lobby([{session: 'ABCDEF', players: ['Bob'], depth: 2}])`: within half a second `#landing-lobby` holds a `button.landing-join` with `data-session` `ABCDEF`; with the name `Ann` typed, a click on it sends `join('ABCDEF', 'Ann').text()`.

## Intrinsic - creates:
With the name `Ann` in `#landing-name` and a click on `#landing-create`, once the fake socket has opened, it has been sent `create(null).text()`. The test delivers `created('ABCDEF')`: the socket is sent `join('ABCDEF', 'Ann').text()`. It delivers `joined('ABCDEF', 'Ann')`: within half a second `h.screen()` is `game`, `h.me()` `Ann`, and `#landing` is out of the page. It delivers `state(w, false)`: within half a second `h.world().time` is `w.time`.

## Intrinsic - refused:
On the landing, the test delivers `refused('no-session')`: within half a second `#landing-error` reads `No such session.` and `h.screen()` is still `landing`. After `joined` no more `list()` is sent (none in the 2500 milliseconds after).

## Intrinsic - keys:
In the game (after `joined` and a `state`): a `keydown` of `ArrowLeft` sends `act(move(-1, 0)).text()` and is `defaultPrevented`; with `shiftKey` true, `act(face(-1, 0))`; of `u`, `act(move(1, -1))`; of ` ` (space), `act(attack())`; of `e`, `act(use())`; of `>` (with `shiftKey` true), `act(descend())`; of `p`, `pause(true)`. A `keydown` of `Shift` sends nothing and is not `defaultPrevented`. A `keydown` of `m`, of `-` and of `=` each sends nothing and is `defaultPrevented` (they are the sound's).

## Intrinsic - menu:
In the game, a `keydown` of `Escape` opens the menu (`#menu` displayed, `h.menuOpen()` true), whose `#menu-session` text is `Session ABCDEF`; while it is open a `keydown` of `ArrowLeft` sends nothing. A click on `#menu-save` sends `requestSave().text()`; the test delivers `saved(s)` (a save of depth 2): within half a second `download` has been called once with `'crawl-depth2.json'` and `s.text()`. A click on `#menu-pause` sends `pause(true).text()`; after the test delivers `state(w, true)`, `#menu-pause` reads `Resume`. A click on `#menu-back` closes the menu; `Escape` opens it again, and `Escape` closes it.

## Intrinsic - explores:
In the game (after `joined` and a `state` of a world `w` on `['#######', '#.....#', '#######']` with `Ann` alive at (1, 1), `ready` 0, every cell of the columns 0 to 3 `explored`, the same cells `visible`): a `keydown` of `z` sends, within half a second, `act(move(1, 0)).text()`, and only once while no new world comes (none more in the next 500 ms). The test delivers `state` of `w` with Ann at (2, 1), `ready` 250 and time 50: within half a second the page sends `act(move(1, 0)).text()` again. A `keydown` of `ArrowUp` then sends `act(move(0, -1)).text()`; after it the test delivers a world with Ann at (3, 1), `ready` 500: no other `act` is sent in the next 500 ms (the journey ended).

## Intrinsic - enemy:
In the game on a world `v` on `['#######', '#.....#', '#.....#', '#######']` with `Ann` alive at (1, 1), `ready` 0, the cells of the columns 0 to 3 `explored` and `visible`: a `keydown` of `z` sends `act(move(1, 0)).text()` (toward (3, 1)). The test delivers `v` with Ann at (2, 1), `ready` 250, and a `bat` (id 10) at (3, 2): no `act` is sent in the next 500 ms (an enemy came into sight: the journey ended). A `keydown` of `z` again, the bat still there, sends `act(move(1, 0)).text()` within half a second (it was in sight when this journey began).

## Intrinsic - clicks:
In that game, on the page's canvas (800 by 600 at its own size), a `click` (`new MouseEvent('click', {clientX, clientY, bubbles: true})` dispatched on the canvas, with `clientX` the canvas's `getBoundingClientRect().left` plus 3 * 48 + 24 and `clientY` its `top` plus 48 + 24: the cell (3, 1)) sends, within half a second, `act(move(1, 0)).text()`. A click below the map (`clientY` `top` plus 500, the panel) sends nothing.

## Intrinsic - debug:
`start(document, {open, debug: true})` shows `#landing-debug`; `start(document, {open})` on the test page (no `debug` in its address) does not. With the debug group, the name `Ann` and a click on the `data-depth` `7` button, once the socket has opened it is sent a `create` whose save has `depth` 7 and one player `Ann` (parse the sent text with `message`'s `parse`).

## Intrinsic - creates-canvas:
In a fresh document with no canvas (`document.implementation.createHTMLDocument('t')`), `start(doc, {open})` appends one canvas of 960 by 720 to its body.
