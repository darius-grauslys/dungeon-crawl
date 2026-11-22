// intent: an API Shape.

/** Fields: kind, dx, dy. */
export class Intent {
  constructor(kind, dx, dy) {
    this._kind = kind;
    this._dx = dx;
    this._dy = dy;
    Object.freeze(this);
  }

  get kind() {
    return this._kind;
  }

  get dx() {
    return this._dx;
  }

  get dy() {
    return this._dy;
  }
}

function isValidDirection(dx, dy) {
  if (typeof dx !== "number" || typeof dy !== "number") return false;
  const validX = dx === -1 || dx === 0 || dx === 1;
  const validY = dy === -1 || dy === 0 || dy === 1;
  return validX && validY && !(dx === 0 && dy === 0);
}

export const KINDS = Object.freeze(["move", "attack", "use", "wait", "descend", "face"]);

export function move(dx, dy) {
  if (!isValidDirection(dx, dy)) {
    throw new TypeError(`invalid move: dx=${dx} dy=${dy}`);
  }
  return new Intent("move", dx, dy);
}

export function attack(dx, dy) {
  if (dx === undefined && dy === undefined) {
    dx = 0;
    dy = 0;
  }
  if (!isValidDirection(dx, dy) && !(dx === 0 && dy === 0)) {
    throw new TypeError(`invalid attack: dx=${dx} dy=${dy}`);
  }
  return new Intent("attack", dx, dy);
}

export function use() {
  return new Intent("use", 0, 0);
}

export function wait() {
  return new Intent("wait", 0, 0);
}

export function descend() {
  return new Intent("descend", 0, 0);
}

export function face(dx, dy) {
  if (!isValidDirection(dx, dy)) {
    throw new TypeError(`invalid face: dx=${dx} dy=${dy}`);
  }
  return new Intent("face", dx, dy);
}
