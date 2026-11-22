// play: the game in a page: the landing, the connection to the server, the
// keyboard, the menu and the screen, wired together. It keeps the latest
// world the server sent and draws it.

import * as messageShape from "../../shapes/message/index.mjs";

import * as netEdge from "../../edges/edge_to_net.mjs";
import * as landingEdge from "../../edges/edge_to_landing.mjs";
import * as menuEdge from "../../edges/edge_to_menu.mjs";
import * as viewEdge from "../../edges/edge_to_view.mjs";
import * as inputEdge from "../../edges/edge_to_input.mjs";

const REASON_TEXT = {
  "full": "The server already has 4 sessions.",
  "no-session": "No such session.",
  "bad-password": "Wrong password.",
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

  const conn = netEdge.connect(url, open);

  let screen = "landing";
  let latestWorld = null;
  let me = null;
  let paused = false;
  let menuOpenFlag = false;
  let sessionPassword = "";

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
  let rememberedPassword = "";

  const landingHandlers = {
    create: (save, name) => {
      rememberedName = name;
      conn.send(messageShape.create(save));
    },
    join: (session, password, name) => {
      rememberedPassword = password;
      rememberedName = name;
      sessionPassword = password;
      conn.send(messageShape.join(session, password, name));
    },
  };

  const landing = landingEdge.show(document, landingHandlers);

  let stopKeys = null;

  function handleIntent(intent) {
    if (screen !== "game" || menuOpenFlag) return;
    conn.send(messageShape.act(intent));
  }

  function handleCommand(command) {
    if (screen !== "game") return;
    if (command === "menu") {
      if (menuOpenFlag) {
        menu.close();
        menuOpenFlag = false;
      } else {
        menu.open();
        menuOpenFlag = true;
      }
    } else if (command === "pause") {
      conn.send(messageShape.pause(!paused));
    }
  }

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
      let now;
      if (paused) {
        now = latestWorld.time;
      } else if (stateArrivalTime !== null) {
        const elapsed = performance.now() - stateArrivalTime;
        now = Math.min(latestWorld.time + elapsed, latestWorld.time + 100);
      } else {
        now = latestWorld.time;
      }
      viewEdge.draw(latestWorld, me, paused, now);
    }
    rafId = raf(frame);
  }

  function handleMessage(msg) {
    switch (msg.kind) {
      case "created": {
        sessionPassword = msg.password;
        conn.send(messageShape.join(msg.session, msg.password, rememberedName));
        break;
      }
      case "joined": {
        landing.hide();
        me = msg.name;
        menu.setSession(msg.session, sessionPassword);
        screen = "game";
        stopKeys = inputEdge.listen(document, { intent: handleIntent, command: handleCommand });
        break;
      }
      case "refused": {
        if (screen === "landing") {
          landing.error(reasonText(msg.reason));
        }
        break;
      }
      case "state": {
        latestWorld = msg.world;
        paused = msg.paused;
        menu.setPaused(paused);
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
      if (rafId !== null) {
        caf(rafId);
        rafId = null;
      }
      if (stopKeys) {
        stopKeys();
        stopKeys = null;
      }
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
