# landing

The landing screen: where a player makes a session (new, or from a save
file they pick) or joins one, before the game. HTML over the page, not
the canvas. Runs in a browser.

What it puts in the page: one `<div id="landing">` over the page (fixed,
centred, its own dark panel), holding

| element | what |
|---|---|
| `<input id="landing-name">` | the player's name (`maxlength` 16) |
| `<input id="landing-save" type="file" accept=".json,application/json">` | a save file, optional: making a session from it |
| `<button id="landing-create">` | `Create session` |
| `<input id="landing-session">` | the session to join (shown in upper case) |
| `<input id="landing-password">` | its password |
| `<button id="landing-join">` | `Join session` |
| `<p id="landing-error">` | what went wrong, or empty |

The name is shared by both: who the player is, either way.

# API Shapes:
- [shape:save](../../shapes/save.md)

# Functions:
## Function - show:
`show(document, {create, join}) -> handle`. Puts the landing in `document.body` (once: a second `show` while one stands throws an `Error`), shown. A click on `landing-create`: the name (trimmed) must be a name (`save`'s `isName`), else the error `Enter a name of 1 to 16 characters.`; with a file chosen, its text is read and parsed with `save`'s `parse`, and a file that doesn't parse gives the error `That file is not a Crawl save.`; then `create(save, name)` (`save` `null` with no file). A click on `landing-join`: the name as for create; the session (trimmed, upper-cased) and the password (trimmed) must not be empty, else the error `Enter the session and its password.`; then `join(session, password, name)`. Each click empties the error first. Answers a handle: `error(text)`, showing `text` in `landing-error`; `hide()`, removing the landing from the page (`show` may then be called again); `shown()`, whether it is in the page.

# Intrinsics:
## Intrinsic - builds:
After `show(document, handlers)`, the page holds one `#landing` with each element of the table, `#landing-error` empty, and `shown()` true; a second `show` throws.

## Intrinsic - creates:
With the name `Ann` and no file, a click on `#landing-create` calls `create(null, 'Ann')` once. With the name ` Ann ` the same. With the name empty, `create` is not called and `#landing-error` reads `Enter a name of 1 to 16 characters.`

## Intrinsic - imports:
With the name `Cy` and a file holding `s.text()` (`s` a save of one player), a click calls `create` once, within a second, with a save deep equal to `s` and `'Cy'`. With a file holding `hello`, `create` is not called and the error reads `That file is not a Crawl save.`

## Intrinsic - joins:
With the name `Bob`, the session ` abcdef ` and the password `xyz234`, a click on `#landing-join` calls `join('ABCDEF', 'xyz234', 'Bob')` once. With the password empty, `join` is not called and the error reads `Enter the session and its password.`

## Intrinsic - handle:
`error('No such session.')` puts that text in `#landing-error`; `hide()` takes `#landing` out of the page and `shown()` is then false; `show` again works.
