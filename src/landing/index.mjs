// landing: a stub, seeded by nirnroot. Its implementation replaces it.

export const _sheo_stub = true;

/** `show(document, {create, join}) -> handle`. Puts the landing in `document.body` (once: a second `show` while one stands throws an `Error`), shown. A click on `landing-create`: the name (trimmed) must be a name (`save`'s `isName`), else the error `Enter a name of 1 to 16 characters.`; with a file chosen, its text is read and parsed with `save`'s `parse`, and a file that doesn't parse gives the error `That file is not a Crawl save.`; then `create(save, name)` (`save` `null` with no file). A click on `landing-join`: the name as for create; the session (trimmed, upper-cased) and the password (trimmed) must not be empty, else the error `Enter the session and its password.`; then `join(session, password, name)`. Each click empties the error first. Answers a handle: `error(text)`, showing `text` in `landing-error`; `hide()`, removing the landing from the page (`show` may then be called again); `shown()`, whether it is in the page. */
export function show(...args) {
  throw new Error("not implemented: landing.show");
}
