// message: an API Shape, the WebSocket protocol between page and server.

import * as saveShape from "../save/index.mjs";
import * as worldShape from "../world/index.mjs";
import * as intentShape from "../intent/index.mjs";

const VALID_REASONS = [
  "full", "no-session", "name-taken", "party-full", "not-joined", "malformed",
];

/**
 * Message: one text that crosses the WebSocket, in either direction.
 */
class Message {
  constructor(kind, upward, fields) {
    this.kind = kind;
    this.upward = upward;
    if (fields) {
      for (const k of Object.keys(fields)) {
        this[k] = fields[k];
      }
    }
    Object.freeze(this);
  }

  text() {
    const obj = { kind: this.kind };
    switch (this.kind) {
      case "list":
        break;
      case "create":
        obj.save = this.save ? this.save.data() : null;
        break;
      case "join":
        obj.session = this.session;
        obj.name = this.name;
        break;
      case "act":
        obj.intent = { kind: this.intent.kind, dx: this.intent.dx, dy: this.intent.dy };
        break;
      case "pause":
        obj.paused = this.paused;
        break;
      case "save":
        break;
      case "lobby":
        obj.sessions = this.sessions.map((s) => ({
          session: s.session,
          players: s.players.slice(),
          depth: s.depth,
        }));
        break;
      case "created":
        obj.session = this.session;
        break;
      case "joined":
        obj.session = this.session;
        obj.name = this.name;
        break;
      case "refused":
        obj.reason = this.reason;
        break;
      case "state":
        obj.world = this.world.data();
        obj.paused = this.paused;
        break;
      case "saved":
        obj.save = this.save.data();
        break;
      default:
        throw new TypeError(`message: unknown kind ${this.kind}`);
    }
    return JSON.stringify(obj);
  }
}

/**
 * Create an upward message to ask for the lobby.
 * @returns {Message}
 */
export function list() {
  return new Message("list", true, {});
}

/**
 * Create an upward message to make a session.
 * @param {saveShape.Save|null} save
 * @returns {Message}
 */
export function create(save) {
  if (save !== null && !(save instanceof saveShape.Save)) {
    throw new TypeError("create: save must be a save or null");
  }
  return new Message("create", true, { save });
}

/**
 * Create an upward message to join a session.
 * @param {string} session
 * @param {string} name
 * @returns {Message}
 */
export function join(session, name) {
  if (typeof session !== "string" || session.length < 1 || session.length > 32) {
    throw new TypeError("join: session must be a string of 1 to 32 characters");
  }
  if (!saveShape.isName(name)) {
    throw new TypeError("join: name must be a valid name");
  }
  return new Message("join", true, { session, name });
}

/**
 * Create an upward message to act.
 * @param {intentShape.Intent} intent
 * @returns {Message}
 */
export function act(intent) {
  if (!(intent instanceof intentShape.Intent)) {
    throw new TypeError("act: intent must be an intent");
  }
  return new Message("act", true, { intent });
}

/**
 * Create an upward message to pause or resume.
 * @param {boolean} paused
 * @returns {Message}
 */
export function pause(paused) {
  if (typeof paused !== "boolean") {
    throw new TypeError("pause: paused must be a boolean");
  }
  return new Message("pause", true, { paused });
}

/**
 * Create an upward message to request the session's save.
 * @returns {Message}
 */
export function requestSave() {
  return new Message("save", true, {});
}

/**
 * Create a downward message carrying the lobby.
 * @param {Array<{session: string, players: string[], depth: number}>} sessions
 * @returns {Message}
 */
export function lobby(sessions) {
  if (!Array.isArray(sessions)) {
    throw new TypeError("lobby: sessions must be an array");
  }
  if (sessions.length < 0 || sessions.length > 4) {
    throw new TypeError("lobby: sessions must have 0 to 4 entries");
  }
  const frozenSessions = sessions.map((s) => {
    if (typeof s.session !== "string" || s.session.length < 1 || s.session.length > 32) {
      throw new TypeError("lobby: session must be a string of 1 to 32 characters");
    }
    if (!Array.isArray(s.players)) {
      throw new TypeError("lobby: players must be an array");
    }
    if (s.players.length < 0 || s.players.length > 4) {
      throw new TypeError("lobby: players must have 0 to 4 entries");
    }
    for (const p of s.players) {
      if (!saveShape.isName(p)) {
        throw new TypeError("lobby: player must be a valid name");
      }
    }
    if (typeof s.depth !== "number" || !Number.isInteger(s.depth) || s.depth < 1 || s.depth > 29) {
      throw new TypeError("lobby: depth must be an integer from 1 to 29");
    }
    return Object.freeze({
      session: s.session,
      players: Object.freeze(s.players.slice()),
      depth: s.depth,
    });
  });
  Object.freeze(frozenSessions);
  return new Message("lobby", false, { sessions: frozenSessions });
}

/**
 * Create a downward message for a new session.
 * @param {string} session
 * @returns {Message}
 */
export function created(session) {
  if (typeof session !== "string" || session.length < 1 || session.length > 32) {
    throw new TypeError("created: session must be a string of 1 to 32 characters");
  }
  return new Message("created", false, { session });
}

/**
 * Create a downward message for a joined session.
 * @param {string} session
 * @param {string} name
 * @returns {Message}
 */
export function joined(session, name) {
  if (typeof session !== "string") {
    throw new TypeError("joined: session must be a string");
  }
  if (!saveShape.isName(name)) {
    throw new TypeError("joined: name must be a valid name");
  }
  return new Message("joined", false, { session, name });
}

/**
 * Create a downward message that a request was refused.
 * @param {string} reason
 * @returns {Message}
 */
export function refused(reason) {
  if (!VALID_REASONS.includes(reason)) {
    throw new TypeError("refused: invalid reason");
  }
  return new Message("refused", false, { reason });
}

/**
 * Create a downward message carrying the world state.
 * @param {object} world
 * @param {boolean} paused
 * @returns {Message}
 */
export function state(world, paused) {
  if (typeof paused !== "boolean") {
    throw new TypeError("state: paused must be a boolean");
  }
  if (typeof world !== "object" || typeof world.data !== "function") {
    throw new TypeError("state: world must be a world");
  }
  const w = worldShape.fromData(world.data());
  return new Message("state", false, { world: w, paused });
}

/**
 * Create a downward message carrying the session's save.
 * @param {saveShape.Save} save
 * @returns {Message}
 */
export function saved(save) {
  if (!(save instanceof saveShape.Save)) {
    throw new TypeError("saved: save must be a save");
  }
  return new Message("saved", false, { save });
}

/**
 * Parse a received message text into a message.
 * @param {string} text
 * @returns {Message}
 */
export function parse(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new TypeError("parse: text is not JSON");
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new TypeError("parse: text must be a JSON object");
  }
  if (typeof obj.kind !== "string") {
    throw new TypeError("parse: missing kind");
  }

  switch (obj.kind) {
    case "list": {
      return list();
    }
    case "create": {
      const save = obj.save === null ? null : saveShape.fromData(obj.save);
      return create(save);
    }
    case "join": {
      if (typeof obj.session !== "string" || typeof obj.name !== "string") {
        throw new TypeError("parse: join missing fields");
      }
      return join(obj.session, obj.name);
    }
    case "act": {
      if (!obj.intent || typeof obj.intent.kind !== "string" || typeof obj.intent.dx !== "number" || typeof obj.intent.dy !== "number") {
        throw new TypeError("parse: act missing intent fields");
      }
      let intent;
      if (obj.intent.kind === "move") intent = intentShape.move(obj.intent.dx, obj.intent.dy);
      else if (obj.intent.kind === "attack") intent = intentShape.attack(obj.intent.dx, obj.intent.dy);
      else if (obj.intent.kind === "use") intent = intentShape.use();
      else if (obj.intent.kind === "wait") intent = intentShape.wait();
      else if (obj.intent.kind === "descend") intent = intentShape.descend();
      else throw new TypeError("parse: act invalid intent kind");
      return act(intent);
    }
    case "pause": {
      if (typeof obj.paused !== "boolean") {
        throw new TypeError("parse: pause missing paused");
      }
      return pause(obj.paused);
    }
    case "save": {
      return requestSave();
    }
    case "lobby": {
      if (!Array.isArray(obj.sessions)) {
        throw new TypeError("parse: lobby missing sessions");
      }
      const sessions = obj.sessions.map((s) => ({
        session: s.session,
        players: s.players,
        depth: s.depth,
      }));
      return lobby(sessions);
    }
    case "created": {
      if (typeof obj.session !== "string") {
        throw new TypeError("parse: created missing session");
      }
      return created(obj.session);
    }
    case "joined": {
      if (typeof obj.session !== "string" || typeof obj.name !== "string") {
        throw new TypeError("parse: joined missing fields");
      }
      return joined(obj.session, obj.name);
    }
    case "refused": {
      if (typeof obj.reason !== "string" || !VALID_REASONS.includes(obj.reason)) {
        throw new TypeError("parse: refused invalid reason");
      }
      return refused(obj.reason);
    }
    case "state": {
      const w = worldShape.fromData(obj.world);
      if (typeof obj.paused !== "boolean") {
        throw new TypeError("parse: state missing paused");
      }
      return state(w, obj.paused);
    }
    case "saved": {
      const save = saveShape.fromData(obj.save);
      return saved(save);
    }
    default:
      throw new TypeError(`parse: unknown kind ${obj.kind}`);
  }
}
