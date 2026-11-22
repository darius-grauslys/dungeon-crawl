# menu

The in-game menu that Escape opens, and the session's details: HTML over
the page, not the canvas. Opening it doesn't pause the game. Runs in a
browser.

What it puts in the page: one `<div id="menu">` over the canvas (fixed,
centred), hidden (`display: none`) while closed, holding

| element | what |
|---|---|
| `<p id="menu-session">` | `Session <id>`, or empty before `setSession` |
| `<button id="menu-settings">` | `Settings` (does nothing yet) |
| `<button id="menu-save">` | `Save` |
| `<button id="menu-pause">` | `Pause`, or `Resume` while the session is paused |
| `<button id="menu-back">` | `Back` |

# API Shapes:
None

# Functions:
## Function - mount:
`mount(document, {settings, save, pause, back}) -> handle`. Puts the menu in `document.body`, closed. A click on a button calls its handler (`pause` with `true` when the button reads `Pause`, `false` when it reads `Resume`); `Back` also closes the menu. Answers a handle: `open()`, `close()`, `isOpen()`; `setPaused(paused)`, the pause button's text (`Resume` when true, `Pause` when false); `setSession(id)`, the session line; `remove()`, taking the menu out of the page.

# Intrinsics:
## Intrinsic - closed:
After `mount`, `#menu` is in the page and not displayed (`getComputedStyle(...).display` is `none`), `isOpen()` false; after `open()` it is displayed and `isOpen()` true; after `close()` not.

## Intrinsic - buttons:
Open, a click on `#menu-settings` calls `settings` once, `#menu-save` calls `save` once, `#menu-pause` calls `pause(true)` once; each leaves the menu open. A click on `#menu-back` calls `back` once and closes it.

## Intrinsic - paused:
`#menu-pause` reads `Pause`; after `setPaused(true)` it reads `Resume`, and a click calls `pause(false)`; after `setPaused(false)` it reads `Pause` again.

## Intrinsic - session:
After `setSession('ABCDEF')`, `#menu-session`'s text is `Session ABCDEF`. After `remove()`, there is no `#menu` in the page.
