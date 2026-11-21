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

function isValidOrthogonal(dx, dy) {
  if (typeof dx !== "number" || typeof dy !== "number") return false;
  const dxIsCardinal = dx === 1 || dx === -1;
  const dyIsCardinal = dy === 1 || dy === -1;
  const dxIsZero = dx === 0;
  const dyIsZero = dy === 0;
  return (dxIsCardinal && dyIsZero) || (dyIsCardinal && dxIsZero);
}

export const KINDS = Object.freeze(["move", "attack", "use", "wait", "descend"]);

export function move(dx, dy) {
  if (!isValidOrthogonal(dx, dy)) {
    throw new TypeError(`invalid move: dx=${dx} dy=${dy}`);
  }
  return new Intent("move", dx, dy);
}

export function attack(dx, dy) {
  if (!isValidOrthogonal(dx, dy)) {
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
