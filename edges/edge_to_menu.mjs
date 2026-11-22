// The call site for menu: forwards to its surface, nothing else.
// menu's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/menu/index.mjs";

// __nirnroot_begin__ mount
// `mount(document, {settings, save, pause, back}) -> handle`. Puts the menu in `document.body`, closed. A click on a button calls its handler (`pause` with `true` when the button reads `Pause`, `false` when it reads `Resume`); `Back` also closes the menu. Answers a handle: `open()`, `close()`, `isOpen()`; `setPaused(paused)`, the pause button's text (`Resume` when true, `Pause` when false); `setSession(id)`, the session line; `remove()`, taking the menu out of the page.
// __nirnroot_end__
export function mount(...args) {
  return target.mount(...args);
}
