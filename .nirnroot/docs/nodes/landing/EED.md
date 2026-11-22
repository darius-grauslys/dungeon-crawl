# landing

The landing screen, a lobby: where a player names themself, sees the
sessions the server holds and joins one, or makes a session (new, or
from a save file they pick), before the game. HTML over the page, not
the canvas. Runs in a browser.

What it puts in the page: one `<div id="landing">` over the page (fixed,
centred, its own dark panel), holding

| element | what |
|---|---|
| `<input id="landing-name">` | the player's name (`maxlength` 16) |
| `<ul id="landing-lobby">` | the sessions, one `<li>` each (below) |
| `<input id="landing-save" type="file" accept=".json,application/json">` | a save file, optional: making a session from it |
| `<button id="landing-create">` | `Create session` |
| `<p id="landing-error">` | what went wrong, or empty |

**The lobby list.** For each session given to `lobby`, in order, an
`<li>` whose text starts with its id, then its players' names joined by
`, ` (or `nobody` when it has none), then ` (<n>/4)` with `n` the number
of players, then ` Depth <depth>`, and holding one `<button>` of class
`landing-join` reading `Join`, with `data-session` the id; the button is
`disabled` when the session has 4 players. With no sessions, a single
`<li>` reading `No sessions yet. Create one!` and no button. Before the
first `lobby`, the list is that single `<li>` too.

The name is shared by both: who the player is, whichever they do.

# API Shapes:
- [shape:save](../../shapes/save.md)

# Functions:
## Function - show:
`show(document, {create, join}) -> handle`. Puts the landing in `document.body` (once: a second `show` while one stands throws an `Error`), shown. A click on `landing-create`: the name (trimmed) must be a name (`save`'s `isName`), else the error `Enter a name of 1 to 16 characters.`; with a file chosen, its text is read and parsed with `save`'s `parse`, and a file that doesn't parse gives the error `That file is not a Crawl save.`; then `create(save, name)` (`save` `null` with no file). A click on a session's `Join` button: the name as for create; then `join(session, name)` with that button's session. Each click empties the error first. Answers a handle: `lobby(sessions)`, `sessions` an array of `{session, players, depth}` (`players` an array of names), redrawing the lobby list from it (the name typed, the file chosen and the error are kept); `error(text)`, showing `text` in `landing-error`; `hide()`, removing the landing from the page (`show` may then be called again); `shown()`, whether it is in the page.

# Intrinsics:
## Intrinsic - builds:
After `show(document, handlers)`, the page holds one `#landing` with each element of the table, `#landing-error` empty, `#landing-lobby` one `<li>` reading `No sessions yet. Create one!` with no button, and `shown()` true; a second `show` throws.

## Intrinsic - creates:
With the name `Ann` and no file, a click on `#landing-create` calls `create(null, 'Ann')` once. With the name ` Ann ` the same. With the name empty, `create` is not called and `#landing-error` reads `Enter a name of 1 to 16 characters.`

## Intrinsic - imports:
With the name `Cy` and a file holding `s.text()` (`s` a save of one player), a click calls `create` once, within a second, with a save deep equal to `s` and `'Cy'`. With a file holding `hello`, `create` is not called and the error reads `That file is not a Crawl save.`

## Intrinsic - lobby:
After `lobby([{session: 'ABCDEF', players: ['Ann', 'Bob'], depth: 3}, {session: 'GHJKMN', players: [], depth: 1}, {session: 'PQRSTU', players: ['A', 'B', 'C', 'D'], depth: 7}])`, `#landing-lobby` holds three `<li>`: the first's text contains `ABCDEF`, `Ann, Bob`, `(2/4)` and `Depth 3`; the second's `GHJKMN`, `nobody` and `(0/4)`; each holds one `button.landing-join` reading `Join`, with `data-session` its id; the third's is `disabled`, the others' not. With the name `Bob` typed, `lobby([{session: 'ABCDEF', players: [], depth: 1}])` leaves `#landing-name`'s value `Bob` and the list one `<li>`. `lobby([])` leaves one `<li>` reading `No sessions yet. Create one!` and no button.

## Intrinsic - joins:
With the name ` Cy ` and that first lobby, a click on the first `Join` calls `join('ABCDEF', 'Cy')` once. With the name empty, `join` is not called and the error reads `Enter a name of 1 to 16 characters.`

## Intrinsic - handle:
`error('No such session.')` puts that text in `#landing-error`; `hide()` takes `#landing` out of the page and `shown()` is then false; `show` again works.
