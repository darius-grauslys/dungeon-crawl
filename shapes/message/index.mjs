// message: an API Shape, a stub seeded by nirnroot. Its implementer replaces it.

export const _sheo_stub = true;

/** Fields: kind, upward, save, session, password, name, intent, paused, reason, world, text. */
export class Message {
  constructor(...args) {
    throw new Error("not implemented: shape message");
  }
}
