// The call site for landing: forwards to its surface, nothing else.
// landing's EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.

import * as target from "../src/landing/index.mjs";

// __nirnroot_begin__ show
// `show(document, {create, join}) -> handle`. Puts the landing in `document.body` (once: a second `show` while one stands throws an `Error`), shown. A click on `landing-create`: the name (trimmed) must be a name (`save`'s `isName`), else the error `Enter a name of 1 to 16 characters.`; with a file chosen, its text is read and parsed with `save`'s `parse`, and a file that doesn't parse gives the error `That file is not a Crawl save.`; then `create(save, name)` (`save` `null` with no file). A click on `landing-join`: the name as for create; the session (trimmed, upper-cased) and the password (trimmed) must not be empty, else the error `Enter the session and its password.`; then `join(session, password, name)`. Each click empties the error first. Answers a handle: `error(text)`, showing `text` in `landing-error`; `hide()`, removing the landing from the page (`show` may then be called again); `shown()`, whether it is in the page.
// __nirnroot_end__
export function show(...args) {
  return target.show(...args);
}
