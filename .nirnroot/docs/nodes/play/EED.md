# play

The game in a page: it wires the rules, the screen and the keyboard
together and keeps the current world. Runs in a browser.

# API Shapes:
- [shape:world](../../shapes/world.md)

# Functions:
## Function - start:
`start(document, seed) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. Starts a game of `seed` (an integer from 0 to 4294967295; left out, `Date.now() % 4294967296`), draws it at once, starts loading the sprites from `/assets/` and draws again when they are in (if they fail, it logs the error with `console.error` and plays on in flat colours), and from then on, for every key press on `document` that means an intent (the `input` Node's table), takes the turn and draws the new world. Answers a handle: `world()`, the current world; `stop()`, which stops listening to the keyboard (the game no longer changes).

# Intrinsics:
## Intrinsic - starts:
On the test page (one 800 by 600 canvas): `h = start(document, 7)`: `h.world()` is a world of seed 7, depth 1, turn 0, state `playing`; the page still has exactly one canvas; the canvas's pixel (796, 596) is not rgb(22, 13, 19) (something was drawn there: the panel).

## Intrinsic - keys-play:
After `start(document, 7)`: a `keydown` of `z` dispatched on `document` makes `h.world().turn` 1; one of `r` makes the world's seed 8 and its turn 0. After `h.stop()`, a `keydown` of `z` leaves the world as it was.

## Intrinsic - creates-canvas:
In a fresh document with no canvas (`document.implementation.createHTMLDocument('t')`), `start(doc, 3)` appends one canvas of 960 by 720 to its body.
