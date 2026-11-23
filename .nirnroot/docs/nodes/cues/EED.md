# cues

Which sounds a player hears when the world changes: it compares the
world before with the world now, as the player `me` sees it, and answers
the sounds to play. Pure.

**What makes a sound.** `prev` the world before, `next` the world now:

- `next.depth` other than `prev.depth`: the party changed floor, and
  the answer is `stairs` alone (gain 1), nothing else.
- Otherwise, for each **seen** creature of `next` (every hero, alive or
  not; a monster when a cell it covers is `visible` in `next`), matched
  with the one of the same `id` in `prev` (heroes by `name`):
  - its actor's `last` not `null` and different from the one in `prev`
    (or the creature new): `step` for a `move`; `swing` for an `attack`
    of `reach` 1; `shot` for an `attack` of `reach` above 1;
  - its actor's `gesture` not `null` and different from the one in
    `prev` (or the creature new): `powerup` for `power`, `use` for
    `use`;
  - its `stats.hp` lower than in `prev`: `hit`;
  - a hero alive in `prev` and not alive in `next`: `death`;
  - its actor's `fuse` not `null` and different from the one in `prev`
    (or the creature new): `hiss`.
- Each `effects` entry of `next` (a `blast`) not in `prev`'s (compared
  by its five fields): `boom`, at the centre cell of its square (`x` and
  `y` plus `Math.floor(size / 2)`), heard even out of sight.
- Each monster of `prev` seen in `prev` and missing from `next`:
  `death`, at its cell in `prev`.
- `next.gold` above `prev.gold`: `coin`, gain 1.
- `prev` `null`: no sound.

**How loud.** A sound made by a creature, at its `pos` `(x, y)`: with
`me`'s hero alive in `next`, at `(hx, hy)`, and `d = max(|x - hx|, |y -
hy|)`, the gain `Math.max(0.25, 1 - d / 12)`; with no hero of that name,
or one not alive, gain 1.

**One of each.** The answer holds at most one cue of each name: of
several sounds of one name, the loudest (its gain the largest of
theirs). The cues come in the order of `cue`'s `NAMES`.

# API Shapes:
- [shape:cue](../../shapes/cue.md)
- [shape:world](../../shapes/world.md)

# Functions:
## Function - cues:
`cues(prev, next, me) -> array of cue`. `prev` a `world` or `null`; `next` a `world`; `me` a string. A fresh array of `cue`s, as **What makes a sound** says. Anything else throws a `TypeError`. Neither world is changed.

# Intrinsics:
## Intrinsic - steps:
`prev` a world on `['#######', '#.....#', '#######']` with every cell `visible`, `Ann` at (1, 1) (`last` `null`), and `next` the same with Ann at (2, 1), `last` `{kind: 'move', dx: 1, dy: 0, at: 50}`: `cues(prev, next, 'Ann')` is one cue, `step` of gain 1. With `next` equal to `prev`: `[]`. `cues(null, next, 'Ann')` is `[]`.

## Intrinsic - attacks:
On that grid, with Ann at (1, 1) in both worlds, a `bat` (id 10) at (4, 1) in both, Ann's `last` in `next` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 3}` (`null` in `prev`), and the bat's `hp` 1 lower in `next`: `shot` (gain 1), then `hit` (at the bat, gain `1 - 3 / 12`). With `reach` 1 instead: `swing`, then `hit`. With the bat gone from `next` instead of hurt: `shot`, then `death`, gain `1 - 3 / 12`.

## Intrinsic - distance:
On `['##################', '#................#', '##################']` with every cell `visible`, Ann at (1, 1) and a `skeleton` (id 10) at (16, 1) whose `last` changes to a `move`: `step` of gain `0.25` (15 away). For `me` `'Eve'` (no such hero): gain 1. With the skeleton's cell not `visible` in `next`: `[]`.

## Intrinsic - gestures:
Ann's `gesture` going from `null` to `{kind: 'power', at: 50}`, her `last` going to a `move`: `step`, then `powerup`. To `{kind: 'use', at: 50}` with `last` unchanged: `use` alone. The same `gesture` in both: nothing.

## Intrinsic - one-of-each:
Two monsters (ids 10 and 11), at (2, 1) and (5, 1), both stepping, with Ann at (1, 1): one `step`, gain `1 - 1 / 12`. The gold going from 3 to 10 too: `step`, then `coin` (gain 1).

## Intrinsic - stairs:
`next` of depth 2 and `prev` of depth 1, whatever else changed: `[stairs]` (gain 1).

## Intrinsic - dies:
Ann alive in `prev` and not alive in `next` (0 hit points), with Bob at (3, 1) as `me`: `hit` and `death`, each gain `1 - 2 / 12`.

## Intrinsic - fuses:
On the `steps` grid with every cell `visible`, Ann at (1, 1) in both, a `pumpkin` (id 10, `size` 1 here) at (4, 1) in both, its `fuse` `null` in `prev` and `{at: 50}` in `next`: `hiss`, gain `1 - 3 / 12`; the same `fuse` in both: `[]`. With `next`'s `effects` `[{kind: 'blast', x: 4, y: 1, size: 1, at: 50}]` and `prev`'s `[]` (the pumpkin gone from `next`, its cell not `visible`): `death` (the pumpkin, seen in `prev`, is gone), then `boom`, each of gain `1 - 3 / 12`.

## Intrinsic - refuses:
`cues({}, next, 'Ann')`, `cues(prev, null, 'Ann')` and `cues(prev, next, 5)` throw a `TypeError`.
