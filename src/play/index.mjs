// play: the game in a page: the landing, the connection to the server, the
// keyboard, the menu and the screen, wired together. It keeps the latest
// world the server sent and draws it.

import * as messageShape from "../../shapes/message/index.mjs";

import * as netEdge from "../../edges/edge_to_net.mjs";
import * as landingEdge from "../../edges/edge_to_landing.mjs";
import * as menuEdge from "../../edges/edge_to_menu.mjs";
import * as viewEdge from "../../edges/edge_to_view.mjs";
import * as inputEdge from "../../edges/edge_to_input.mjs";
import * as audioEdge from "../../edges/edge_to_audio.mjs";
import * as travelEdge from "../../edges/edge_to_travel.mjs";

const REASON_TEXT = {
  "full": "The server already has 4 sessions.",
  "no-session": "No such session.",
  "name-taken": "Someone is already playing that name.",
  "party-full": "That party is full.",
};

function reasonText(reason) {
  return REASON_TEXT[reason] ?? `Something went wrong (${reason}).`;
}

function defaultDownload(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** `start(document, options) -> handle`. Uses the first `<canvas>` of `document`, or, if it has none, creates one 960 by 720 and appends it to `document.body`. `options` (left out: `{}`): `url`, the WebSocket's (left out: `ws://` or, on an `https:` page, `wss://`, then the page's `location.host` and `/ws`); `open`, the socket factory given to `net` (left out: the browser's `WebSocket`); `download(filename, text)` (left out: a `Blob` of `application/json` saved through a temporary `<a download>`). Starts loading the sprites from `/assets/` (if they fail, it logs the error with `console.error` and plays on in flat colours) and then goes as the flow says, reading what arrived once every animation frame. Answers a handle: `screen()`, `landing` or `game`; `world()`, the latest world (`null` before one); `me()`, the name played (`null` before `joined`); `menuOpen()`; `stop()`, which stops it all (the keyboard, the frame loop, the socket; the landing and the menu are taken out of the page). */
export function start(document, options = {}) {
  let url = options.url;
  if (url === undefined) {
    const location = document.location;
    if (location) {
      const protocol = location.protocol;
      const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
      url = `${wsProtocol}//${location.host}/ws`;
    } else {
      url = "ws://localhost/ws";
    }
  }
  const open = options.open ?? ((u) => new WebSocket(u));
  const download = options.download ?? defaultDownload;

  let debug = options.debug;
  if (debug === undefined) {
    const win = document.defaultView;
    if (win && win.location) {
      const params = new URLSearchParams(win.location.search);
      debug = params.get('debug') === 'true';
    } else {
      debug = false;
    }
  }

  // Find or make the canvas
  let canvas = document.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 720;
    document.body.appendChild(canvas);
  }

  viewEdge.init(canvas);

  viewEdge.load("/assets/").catch((err) => {
    console.error(err);
  });

  const audioOptions = options.audioContext === undefined ? {} : { context: options.audioContext };
  const sound = audioEdge.create(audioOptions);
  sound.load();

  function resumeOnInteraction() {
    sound.resume();
  }
  document.addEventListener("keydown", resumeOnInteraction);
  document.addEventListener("pointerdown", resumeOnInteraction);

  const conn = netEdge.connect(url, open);

  let screen = "landing";
  let latestWorld = null;
  let me = null;
  let paused = false;
  let menuOpenFlag = false;
  let aiming = false;

  const menuHandlers = {
    settings: () => {},
    save: () => {
      conn.send(messageShape.requestSave());
    },
    pause: (p) => {
      conn.send(messageShape.pause(p));
    },
    back: () => {
      menuOpenFlag = false;
    },
  };

  const menu = menuEdge.mount(document, menuHandlers);
  let menuRemoved = false;

  let rememberedName = "";

  const landingHandlers = {
    create: (save, name) => {
      rememberedName = name;
      conn.send(messageShape.create(save));
    },
    join: (session, name) => {
      conn.send(messageShape.join(session, name));
    },
  };

  const landing = landingEdge.show(document, landingHandlers, { debug });

  let lobbyInterval = setInterval(() => {
    if (screen === "landing") {
      conn.send(messageShape.list());
    }
  }, 2000);
  conn.send(messageShape.list());

  let stopKeys = null;

  let journey = null; // null, or {kind: 'explore' | 'cell', cell, depth, seen, awaited}

  function meAlive(world) {
    const hero = world.heroes.find((h) => h.name === me);
    return hero && hero.alive;
  }

  function startExploreJourney(world) {
    journey = {
      kind: 'explore',
      cell: null,
      depth: world.depth,
      seen: travelEdge.sighted(world, me),
      awaited: null,
    };
  }

  function startCellJourney(world, cell) {
    journey = {
      kind: 'cell',
      cell: cell,
      depth: world.depth,
      seen: travelEdge.sighted(world, me),
      awaited: null,
    };
  }

  function endJourney() {
    journey = null;
  }

  function handleIntent(intent) {
    endJourney();
    if (screen !== "game" || menuOpenFlag) return;
    conn.send(messageShape.act(intent));
  }

  function handleCommand(command) {
    endJourney();
    if (screen !== "game") return;
    if (command === "menu") {
      if (menuOpenFlag) {
        menu.close();
        menuOpenFlag = false;
      } else {
        menu.open();
        menuOpenFlag = true;
      }
      return;
    }
    if (menuOpenFlag) return;
    if (command === "explore") {
      startExploreJourney(latestWorld);
      return;
    }
    if (command === "pause") {
      conn.send(messageShape.pause(!paused));
    } else if (command === "mute") {
      sound.toggleMute();
    } else if (command === "quieter") {
      sound.quieter();
    } else if (command === "louder") {
      sound.louder();
    }
  }

  function handleCanvasClick(event) {
    if (screen !== "game" || menuOpenFlag) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const cell = viewEdge.cellAt(latestWorld, me, x, y);
    if (cell) {
      startCellJourney(latestWorld, cell);
    }
  }
  canvas.addEventListener("click", handleCanvasClick);

  const win = document.defaultView || (typeof window !== "undefined" ? window : globalThis);
  const raf = win.requestAnimationFrame.bind(win);
  const caf = win.cancelAnimationFrame.bind(win);
  let rafId = raf(frame);
  let stateArrivalTime = null;

  function frame() {
    const messages = conn.drain();
    for (const msg of messages) {
      handleMessage(msg);
    }
    if (latestWorld && screen === "game") {
      if (journey && !paused) {
        if (journey.awaited) {
          const elapsed = performance.now() - journey.awaited.at;
          if (elapsed >= 1500) {
            journey.awaited = null;
          }
        }
        if (!journey.awaited) {
          let step = null;
          if (journey.kind === 'explore') {
            step = travelEdge.explore(latestWorld, me);
          } else {
            step = travelEdge.toward(latestWorld, me, journey.cell);
          }
          if (step === null) {
            journey = null;
          } else {
            conn.send(messageShape.act(step));
            const hero = latestWorld.heroes.find((h) => h.name === me);
            if (hero) {
              const pos = hero.actor.pos;
              journey.awaited = {
                x: pos.x,
                y: pos.y,
                ready: hero.actor.ready,
                at: performance.now(),
              };
            } else {
              journey = null;
            }
          }
        }
      }

      let now;
      if (paused) {
        now = latestWorld.time;
      } else if (stateArrivalTime !== null) {
        const elapsed = performance.now() - stateArrivalTime;
        now = Math.min(latestWorld.time + elapsed, latestWorld.time + 100);
      } else {
        now = latestWorld.time;
      }
      viewEdge.draw(latestWorld, me, paused, now, aiming);
    }
    rafId = raf(frame);
  }

  function handleMessage(msg) {
    switch (msg.kind) {
      case "created": {
        conn.send(messageShape.join(msg.session, rememberedName));
        break;
      }
      case "joined": {
        landing.hide();
        clearInterval(lobbyInterval);
        me = msg.name;
        menu.setSession(msg.session);
        screen = "game";
        stopKeys = inputEdge.listen(document, { intent: handleIntent, command: handleCommand, aiming: (held) => { aiming = held; } });
        break;
      }
      case "lobby": {
        landing.lobby(msg.sessions);
        break;
      }
      case "refused": {
        if (screen === "landing") {
          landing.error(reasonText(msg.reason));
        }
        break;
      }
      case "state": {
        const previousWorld = latestWorld;
        latestWorld = msg.world;
        paused = msg.paused;
        menu.setPaused(paused);

        if (journey) {
          if (latestWorld.depth !== journey.depth) {
            journey = null;
          } else if (!meAlive(latestWorld)) {
            journey = null;
          } else if (journey.kind === 'explore') {
            const newSighted = travelEdge.sighted(latestWorld, me);
            const ended = newSighted.some((id) => !journey.seen.includes(id));
            if (ended) {
              journey = null;
            } else {
              journey.seen = newSighted;
            }
          }
        }

        if (journey && journey.awaited) {
          const hero = latestWorld.heroes.find((h) => h.name === me);
          if (hero) {
            const pos = hero.actor.pos;
            if (pos.x !== journey.awaited.x || pos.y !== journey.awaited.y || hero.actor.ready !== journey.awaited.ready) {
              journey.awaited = null;
            }
          }
        }

        sound.update(previousWorld, latestWorld, me);
        stateArrivalTime = performance.now();
        break;
      }
      case "saved": {
        const depth = msg.save.depth;
        const filename = `crawl-depth${depth}.json`;
        download(filename, msg.save.text());
        break;
      }
    }
  }

  return {
    screen: () => screen,
    world: () => latestWorld,
    me: () => me,
    menuOpen: () => menuOpenFlag,
    stop: () => {
      if (lobbyInterval !== null) {
        clearInterval(lobbyInterval);
        lobbyInterval = null;
      }
      if (rafId !== null) {
        caf(rafId);
        rafId = null;
      }
      if (stopKeys) {
        stopKeys();
        stopKeys = null;
      }
      document.removeEventListener("keydown", resumeOnInteraction);
      document.removeEventListener("pointerdown", resumeOnInteraction);
      canvas.removeEventListener("click", handleCanvasClick);
      conn.close();
      if (landing.shown()) {
        landing.hide();
      }
      if (!menuRemoved) {
        menu.remove();
        menuRemoved = true;
      }
    },
  };
}
