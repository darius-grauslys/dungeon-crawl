// cue: a sound to play now: which one, and how loud. Immutable.

export const NAMES = Object.freeze([
  "step",
  "swing",
  "shot",
  "hit",
  "death",
  "coin",
  "powerup",
  "use",
  "stairs",
]);

/**
 * Build a cue from {name, gain}.
 * name must be one of NAMES; gain a number above 0 and at most 1.
 * Any other input is refused with a TypeError. The result is frozen.
 */
export function of({ name, gain }) {
  if (typeof name !== "string" || !NAMES.includes(name)) {
    throw new TypeError(`invalid cue name: ${String(name)}`);
  }
  if (typeof gain !== "number" || Number.isNaN(gain) || gain <= 0 || gain > 1) {
    throw new TypeError(`invalid cue gain: ${String(gain)}`);
  }
  return Object.freeze({ name, gain });
}
