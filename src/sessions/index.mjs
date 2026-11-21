// sessions: a table of server sessions, without their worlds.

const SESSION_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const MAX_SESSIONS = 4;

/** `table({random, idle}) -> table`. A fresh, empty table of sessions, independent of any other. */
export function table({ random = Math.random, idle = 1800000 } = {}) {
  // Map from session id to {password, paused, activity, members}.
  const sessions = new Map();
  // Map from connection to its session id.
  const connToSession = new Map();

  function generateId() {
    let id;
    let attempts = 0;
    do {
      id = "";
      for (let i = 0; i < 6; i++) {
        id += SESSION_ALPHABET[Math.floor(random() * SESSION_ALPHABET.length)];
      }
      attempts++;
    } while (sessions.has(id) && attempts < 100000);
    if (sessions.has(id)) {
      let cand = id;
      while (sessions.has(cand)) {
        const chars = cand.split("");
        for (let i = 5; i >= 0; i--) {
          let idx = SESSION_ALPHABET.indexOf(chars[i]);
          idx = (idx + 1) % SESSION_ALPHABET.length;
          chars[i] = SESSION_ALPHABET[idx];
          if (idx !== 0) break;
        }
        cand = chars.join("");
      }
      id = cand;
    }
    return id;
  }

  function generatePassword() {
    let pw = "";
    for (let i = 0; i < 6; i++) {
      pw += PASSWORD_ALPHABET[Math.floor(random() * PASSWORD_ALPHABET.length)];
    }
    return pw;
  }

  function leave(connection) {
    const session = connToSession.get(connection);
    if (session === undefined) return null;
    connToSession.delete(connection);
    const s = sessions.get(session);
    s.members = s.members.filter((m) => m.connection !== connection);
    return session;
  }

  return {
    create(now) {
      if (sessions.size >= MAX_SESSIONS) return null;
      const id = generateId();
      const password = generatePassword();
      sessions.set(id, { password, paused: false, activity: now, members: [] });
      return { session: id, password };
    },

    join(connection, session, password, name, now) {
      if (!sessions.has(session)) return "no-session";
      const s = sessions.get(session);
      if (s.password !== password) return "bad-password";
      const taken = s.members.some((m) => m.name === name && m.connection !== connection);
      if (taken) return "name-taken";
      const othersCount = s.members.filter((m) => m.connection !== connection).length;
      if (othersCount >= MAX_SESSIONS) return "full";
      leave(connection);
      s.members.push({ connection, name });
      s.activity = now;
      connToSession.set(connection, session);
      return null;
    },

    leave(connection) {
      return leave(connection);
    },

    member(connection) {
      const session = connToSession.get(connection);
      if (session === undefined) return null;
      const s = sessions.get(session);
      const m = s.members.find((m) => m.connection === connection);
      if (!m) return null;
      return { session, name: m.name };
    },

    members(session) {
      if (!sessions.has(session)) return [];
      const s = sessions.get(session);
      return s.members.map((m) => ({ connection: m.connection, name: m.name }));
    },

    touch(session, now) {
      if (sessions.has(session)) {
        sessions.get(session).activity = now;
      }
    },

    setPaused(session, paused) {
      if (sessions.has(session)) {
        sessions.get(session).paused = paused;
      }
    },

    paused(session) {
      if (!sessions.has(session)) return false;
      return sessions.get(session).paused;
    },

    expire(now) {
      const expired = [];
      for (const [id, s] of sessions) {
        if (now - s.activity >= idle) {
          expired.push(id);
          for (const m of s.members) connToSession.delete(m.connection);
          sessions.delete(id);
        }
      }
      return expired;
    },

    ids() {
      return [...sessions.keys()];
    },
  };
}
