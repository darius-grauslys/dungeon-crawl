# play

The game in a page: the landing, the connection to the server, the
keyboard, the menu and the screen, wired together. It keeps the latest
world the server sent and draws it. Runs in a browser.

**The flow.** `start` shows the landing (`landing`) over the canvas and
connects to the server (`net`). On the landing:
- *Create*: sends `create(save)` (the save chosen, or `null`); on
  `created(session, password)` it sends `join(session, password, name)`
  with the name given.
- *Join*: sends `join(session, password, name)`.
- `joined(session, name)`: the landing is hidden, the player is `name`
  in `session`, and the game screen begins: the menu's session line is
  `session` and its password (the one created, or the one typed).
- `refused(reason)` while the landing shows: its error is the reason's
  text: `full` `The server already has 4 sessions.`, `no-session` `No
  such session.`, `bad-password` `Wrong password.`, `name-taken`
  `Someone is already playing that name.`, `party-full` `That party is
  full.`, anything else `Something went wrong (<reason>).`

In the game:
- Every `state(world, paused)` is kept and given to the menu
  (`setPaused`). From the first one on, the screen is drawn every
  animation frame, `view.draw(world, name, paused, now)` with the latest
  world, so the creatures' animations play smoothly between the server's
  states: `now` is the world's `time` plus the milliseconds since that
  state arrived (by `performance.now()`), at most 100 more; while paused,
  the world's `time`.
- The keys (`input`) while the menu is closed: an intent is sent as
  `act(intent)`; `menu` opens the menu; `pause` sends `pause(!paused)`.
  While the menu is open, only `menu` (Escape) does anything: it closes
  it.
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
`start(document, options) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. `options` (left out: `{}`): `url`, the WebSocket's (left out: `ws://` or, on an `https:` page, `wss://`, then the page's `location.host` and `/ws`); `open`, the socket factory given to `net` (left out: the browser's `WebSocket`); `download(filename, text)` (left out: a `Blob` of `application/json` saved through a temporary `<a download>`). Starts loading the sprites from `/assets/` (if they fail, it logs the error with `console.error` and plays on in flat colours) and then goes as the flow says, reading what arrived once every animation frame. Answers a handle: `screen()`, `landing` or `game`; `world()`, the latest world (`null` before one); `me()`, the name played (`null` before `joined`); `menuOpen()`; `stop()`, which stops it all (the keyboard, the frame loop, the socket; the landing and the menu are taken out of the page).

# Intrinsics:
## Intrinsic - starts:
On the test page, `h = start(document, {open})` (a fake socket factory): the page still has exactly one canvas and holds `#landing`; `h.screen()` is `landing`, `h.world()` and `h.me()` `null`; `open` was called once with a url ending in `/ws`. A cancelable `keydown` of `w` dispatched on `document` is not `defaultPrevented`.

## Intrinsic - creates:
With the name `Ann` in `#landing-name` and a click on `#landing-create`, once the fake socket has opened, it has been sent `create(null).text()`. The test delivers `created('ABCDEF', 'xyz234')`: the socket is sent `join('ABCDEF', 'xyz234', 'Ann').text()`. It delivers `joined('ABCDEF', 'Ann')`: within half a second `h.screen()` is `game`, `h.me()` `Ann`, and `#landing` is out of the page. It delivers `state(w, false)`: within half a second `h.world().time` is `w.time`.

## Intrinsic - refused:
On the landing, the test delivers `refused('bad-password')`: within half a second `#landing-error` reads `Wrong password.` and `h.screen()` is still `landing`.

## Intrinsic - keys:
In the game (after `joined` and a `state`): a `keydown` of `ArrowLeft` sends `act(move(-1, 0)).text()` and is `defaultPrevented`; with `shiftKey` true, `act(attack(-1, 0))`; of `e`, `act(use())`; of `>` (with `shiftKey` true), `act(descend())`; of `p`, `pause(true)`.

## Intrinsic - menu:
In the game, a `keydown` of `Escape` opens the menu (`#menu` displayed, `h.menuOpen()` true), whose `#menu-session` text holds `ABCDEF` and `xyz234`; while it is open a `keydown` of `ArrowLeft` sends nothing. A click on `#menu-save` sends `requestSave().text()`; the test delivers `saved(s)` (a save of depth 2): within half a second `download` has been called once with `'crawl-depth2.json'` and `s.text()`. A click on `#menu-pause` sends `pause(true).text()`; after the test delivers `state(w, true)`, `#menu-pause` reads `Resume`. A click on `#menu-back` closes the menu; `Escape` opens it again, and `Escape` closes it.

## Intrinsic - creates-canvas:
In a fresh document with no canvas (`document.implementation.createHTMLDocument('t')`), `start(doc, {open})` appends one canvas of 960 by 720 to its body.
