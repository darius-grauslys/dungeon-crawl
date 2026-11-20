// play: a Node, wires the rules, the screen and the keyboard together.

import * as rules from "../../edges/edge_to_rules.mjs";
import * as view from "../../edges/edge_to_view.mjs";
import * as input from "../../edges/edge_to_input.mjs";

/** `start(document, seed) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. Starts a game of `seed` (an integer from 0 to 4294967295; left out, `Date.now() % 4294967296`), draws it at once, starts loading the sprites from `/assets/` and draws again when they are in (if they fail, it logs the error with `console.error` and plays on in flat colours), and from then on, for every key press on `document` that means an intent (the `input` Node's table), takes the turn and draws the new world. Answers a handle: `world()`, the current world; `stop()`, which stops listening to the keyboard (the game no longer changes). */
export function start(document, seed) {
  let canvas = document.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 720;
    document.body.appendChild(canvas);
  }
  view.init(canvas);

  const s = seed === undefined ? Date.now() % 4294967296 : seed;
  let world = rules.newGame(s);
  view.draw(world);

  let stopped = false;
  view.load("/assets/").then(
    () => { if (!stopped) view.draw(world); },
    (e) => console.error(e)
  );

  const stop = input.listen(document, (i) => {
    world = rules.step(world, i);
    view.draw(world);
  });

  return {
    world() { return world; },
    stop() {
      stopped = true;
      stop();
    }
  };
}
