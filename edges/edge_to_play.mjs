// The call site for play: forwards to its surface, nothing else.
// play's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/play/index.mjs";

// __nirnroot_begin__ start
// `start(document, options) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. `options` (left out: `{}`): `url`, the WebSocket's (left out: `ws://` or, on an `https:` page, `wss://`, then the page's `location.host` and `/ws`); `open`, the socket factory given to `net` (left out: the browser's `WebSocket`); `download(filename, text)` (left out: a `Blob` of `application/json` saved through a temporary `<a download>`); `audioContext`, given to `audio.create` as its `context` (left out: the page's own; `null`: no sound); `debug`, true to show the landing's debug group (left out: true when the page's address has the query parameter `debug` set to `true`, `?debug=true`, read from `document.defaultView.location.search`; a document with no window: false). Starts loading the sprites from `/assets/` (if they fail, it logs the error with `console.error` and plays on in flat colours) and the sounds (`audio.load()`) and then goes as the flow says, reading what arrived once every animation frame. Answers a handle: `screen()`, `landing` or `game`; `world()`, the latest world (`null` before one); `me()`, the name played (`null` before `joined`); `menuOpen()`; `stop()`, which stops it all (the keyboard, the frame loop, the socket; the landing and the menu are taken out of the page).
// __nirnroot_end__
export function start(...args) {
  return target.start(...args);
}
