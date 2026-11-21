// menu: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `mount(document, {settings, save, pause, back}) -> handle`. Puts the menu in `document.body`, closed. A click on a button calls its handler (`pause` with `true` when the button reads `Pause`, `false` when it reads `Resume`); `Back` also closes the menu. Answers a handle: `open()`, `close()`, `isOpen()`; `setPaused(paused)`, the pause button's text (`Resume` when true, `Pause` when false); `setSession(id, password)`, the session line; `remove()`, taking the menu out of the page. */
export function mount(...args) {
  throw new Error("not implemented: menu.mount");
}
