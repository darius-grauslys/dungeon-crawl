// play: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `start(document, options) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. `options` (left out: `{}`): `url`, the WebSocket's (left out: `ws://` or, on an `https:` page, `wss://`, then the page's `location.host` and `/ws`); `open`, the socket factory given to `net` (left out: the browser's `WebSocket`); `download(filename, text)` (left out: a `Blob` of `application/json` saved through a temporary `<a download>`). Starts loading the sprites from `/assets/` (if they fail, it logs the error with `console.error` and plays on in flat colours) and then goes as the flow says, reading what arrived once every animation frame. Answers a handle: `screen()`, `landing` or `game`; `world()`, the latest world (`null` before one); `me()`, the name played (`null` before `joined`); `menuOpen()`; `stop()`, which stops it all (the keyboard, the frame loop, the socket; the landing and the menu are taken out of the page). */
export function start(...args) {
  throw new Error("not implemented: play.start");
}
