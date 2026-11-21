// message: an API Shape, the WebSocket protocol between page and server.

import * as saveShape from "../save/index.mjs";
import * as worldShape from "../world/index.mjs";
import * as intentShape from "../intent/index.mjs";

const VALID_REASONS = [
  "full", "no-session", "bad-password", "name-taken", "party-full", "not-joined", "malformed",
];

const UPWARD_KINDS = new Set(["create", "join", "act", "pause", "save"]);

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
      case "create":
        obj.save = this.save ? this.save.data() : null;
        break;
      case "join":
        obj.session = this.session;
        obj.password = this.password;
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
      case "created":
        obj.session = this.session;
        obj.password = this.password;
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
 * @param {string} password
 * @param {string} name
 * @returns {Message}
 */
export function join(session, password, name) {
  if (typeof session !== "string" || session.length < 1 || session.length > 32) {
    throw new TypeError("join: session must be a string of 1 to 32 characters");
  }
  if (typeof password !== "string" || password.length < 1 || password.length > 32) {
    throw new TypeError("join: password must be a string of 1 to 32 characters");
  }
  if (!saveShape.isName(name)) {
    throw new TypeError("join: name must be a valid name");
  }
  return new Message("join", true, { session, password, name });
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
 * Create a downward message for a new session.
 * @param {string} session
 * @param {string} password
 * @returns {Message}
 */
export function created(session, password) {
  if (typeof session !== "string" || typeof password !== "string") {
    throw new TypeError("created: session and password must be strings");
  }
  return new Message("created", false, { session, password });
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
    case "create": {
      const save = obj.save === null ? null : saveShape.fromData(obj.save);
      return create(save);
    }
    case "join": {
      if (typeof obj.session !== "string" || typeof obj.password !== "string" || typeof obj.name !== "string") {
        throw new TypeError("parse: join missing fields");
      }
      return join(obj.session, obj.password, obj.name);
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
    case "created": {
      if (typeof obj.session !== "string" || typeof obj.password !== "string") {
        throw new TypeError("parse: created missing fields");
      }
      return created(obj.session, obj.password);
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
