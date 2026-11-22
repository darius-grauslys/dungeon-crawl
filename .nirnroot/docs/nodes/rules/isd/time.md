# rules: `time`

How the rules are built on the four children below. Every function here
is pure: take a world, answer a new one with `world.with` (or `of`).

## Randomness

The world's `rng` is a mulberry32 state. A draw: `rng = (rng + 0x6D2B79F5) >>> 0`,
then mix it (`t = rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); value = ((t ^ (t >>> 14)) >>> 0) / 4294967296`).
Thread the state through every draw, and store the last state in the
world answered. A d20 roll is `1 + Math.floor(value * 20)`; a pick from a
list is `list[Math.floor(value * list.length)]`. `newGame(seed)` and
`fromSave` start `rng` at the seed; a new floor keeps threading it.

## A floor

`dungeon.generate(seed, depth)` makes the terrain; `level` (the shape)
says what the depth is. On a **dungeon** depth, with `stage =
level.stage(depth)` and `tier = level.tier(depth)`, place, in order, on
the plan's `spots` taken from the first onward: `2 + 2 * stage`
monsters, then the items. Monster kinds by tier, each picked from its
list with one draw:

| tier (levels) | kinds |
|---|---|
| 0, stages 1 to 3 (levels 1 to 3) | bat, slime, snake |
| 0, stages 4 and 5 (levels 4 and 5) | bat, slime, snake, skeleton; and the archer, rarely (below) |
| 1 (levels 6 to 10) | blue-slime, blue-snake, skeleton |
| 2 (levels 11 to 15) | beetle, mummy, cultist |
| 3 (levels 16 to 20) | spider, ghost, reaper |
| 4 (levels 21 to 25) | worm, fire-slime, imp, demon |

On tier 0, stages 4 and 5, each monster takes one draw first: below
`0.1`, it is an `archer`; otherwise a second draw picks from the list.

Monster stats from `bestiary.entry(kind)` (`hp` = `maxHp`), with the
tier: `hp` and `maxHp` are `base + Math.floor(base * tier / 2)`,
`attack` `base + tier`, `defense` `base + Math.floor(tier / 2)` (a
`demon` of tier 4: 48/48/11/6), `range`, `magic` and `magicPower` the
entry's, `magicResist` 0. Every monster
`mode` `roam`, `size` the entry's (1), `ready` as the EED says.

Items: 2 `potion`s and 2 `gold` (amount `level.number(depth) * (3 + d)`
with `d` a draw from 0 to 7), plus a `sword` on stages 2 and 4 and an
`armor` on stages 3 and 5, every `price` 0. Ids: heroes 0 to 3; monsters
and items count up from 10, fresh on each floor (monsters first).

On a **shop** depth (`level.kind(depth)` is `interior`): no monsters;
the six wares on the plan's six spots in order, of the kinds `potion`,
`sword`, `armor`, `ring`, `necklace`, `potion`, each with a `price` drawn
in that order: with `round = level.round(depth)` and the kind's base `B`
and spread `S` (`potion` 20 and 12, `sword` 30 and 6, `armor` 40 and 6,
`ring` 35 and 6, `necklace` 35 and 6),
`Math.round(B * 1.25 ** (round - 1)) - S + Math.floor(value * (2 * S +
1))`, `value` one draw. So the base prices of the first shop are 20, 30
and 40 gold, and each next shop's are a quarter more than the last's.
`visible` and `explored` are every cell (`mask.of` with every cell
true), on arrival and after every `advance`.

On a **lair** depth (`boss`): when the plan has a `boss`, the golem (id
10; stats from its entry, untiered; `size` 3, `mode` `dormant`,
`facing` `left`) at `plan.boss`; the grid made again with `tile-grid`'s
`of`, the `plan.stairs` cell `floor`; the levers (ids 11 onward) on
`plan.levers` in order; a guard `slime` (`mode` `guard`, stats of tier
0) on every spot in order (ids after the levers). Without a `boss`:
nothing. No draws on a lair.

**Start cells.** The plan's `start`, then the `floor` cells a
breadth-first search from it reaches by orthogonal steps over `floor`
cells, neighbours visited in the order up, right, down, left; leave out
the plan's `spots`, its `levers` and the cells of its `boss` square. Heroes placed together (a save, a new floor) take
them in their order; a joining hero the first that no alive hero stands
on.

## The clock

`advance` as the EED says: each actor's `ready` moves on by the latency of
the action it fired (the EED's table for heroes, the kind's `step` and
`strike` for monsters; doubled while `slow`), and every attack sets the
defender's `held` (`Math.max(held, time + 300)`). Turn, aim and stamp
actors with `actor.facingFor`, `aim` and `last` as the EED says. Keep
one helper that walks an attack's line (`pos + k * d`, `k` from 1 to
`stats.range`) and answers the creature struck and `k`, used by heroes
and monsters alike, and one `hostile(a, b)` on actors (by kind, through
`bestiary.hostile`).

A monster's action: `monsters.decide(monster, grid, foes, threats,
blocked, turn)`: `foes` every cell covered by each creature hostile to it
(the alive heroes in their order, then the monsters in theirs), `threats`
every cell of each monster it flees (`bestiary.flees`), `blocked` every
cell covered by every other alive creature and every ware's and lever's
cell, all as they stand at that moment (monsters already moved count
where they now are), `turn` `Math.floor(time / 400)` with `time` the new
time. Before deciding, a `dormant` monster wakes as the EED says, or
waits. Every attack is `combat.resolve(attacker.stats, defender.stats,
roll, ward)`: two draws, the d20 `roll` first, then `ward`, `1 +
Math.floor(value * 100)`. The log line follows the strike: `hit` false
is a miss line, `critical` true the `Critical!` line, `damage` the
`<n>`.

**The golem's gold.** When the golem dies, at time `t`, two draws: the
total `25 + Math.floor(value * 51)`, then the count `n = 1 +
Math.floor(value * 5)`. The candidate cells: every `floor` cell (not
`stairs`) at distance 1 or 2 (`max(|dx|, |dy|)`) from the golem's last
square, outside it, holding no item and no alive creature, row by row
(top first, left to right). `n` becomes at most the number of
candidates. Each of the `n` amounts is `Math.floor(total / n)`, the
first also takes the rest (`total - n * Math.floor(total / n)` more);
each gold in turn takes one more draw, picking `candidates[Math.floor(value
* candidates.length)]` and removing it from the candidates. Ids count on
from the largest id of the world's monsters and items, plus 1. Each
`flung` `{x, y, at: t}` from the square's centre cell.

Visibility is the `mask.union` of `fov.compute(grid, pos, 7)` over the
alive heroes (all false with none), on a shop every cell; `explored` is
`mask.union(explored, visible)`. A hero's `offer` goes back to `null`
whenever it fires anything but a bump of that ware (a bump of another
ware makes that one the offer).

## The log

Exactly these lines (`<h>` the hero's name, `<m>` the monster's kind):

- `<h> hits the <m> for <n>.` / `Critical! <h> hits the <m> for <n>.` /
  `<h> misses the <m>.` / `The <m> is slain.`
- `The <m> hits <h> for <n>.` / `Critical! The <m> hits <h> for <n>.` /
  `The <m> misses <h>.` / `<h> falls.`
- `The <m> hits the <m2> for <n>.` / `Critical! The <m> hits the <m2> for <n>.` /
  `The <m> misses the <m2>.` (a monster fighting a monster)
- `<h>: you are slowed!`
- `The <m> awakens!` / `<h> pulls a lever. The golem weakens!` /
  `<h> pulls a lever.` / `The golem is slain.` / `The guardians crumble.` /
  `The way down opens!` / `Gold spills from the golem!`
- `<h> drinks a potion (+<healed> HP).` / `<h> picks up <n> gold.` /
  `<h> picks up a sword (+2 attack).` / `<h> puts on armor (+1 defense).` /
  `<h> puts on a ring (+1 magic power).` /
  `<h> puts on a cross necklace (+1 magic resist).`
- `<h> looks at <ware>: <p> gold. Bump it again to buy.` /
  `<h> buys <ware> for <p> gold.` /
  `Not enough gold for <ware>: <p> needed, the party has <g>.`
- `A shop! Bump a ware twice to buy it.`
- `<h> joins the party.`
- `All party members must be within 5 units of the exit!`
- `The party descends to level <n>.` / `The party descends to a shop.` /
  `The party descends into a lair.` /
  `A golem guards the way down. Pull the levers to weaken it!` /
  `The party has fallen. <label> begins again.` /
  `The party escapes the dungeon with <g> gold!`
- `Welcome to the dungeon. Find the stairs (>).`

This Node's edge:

- [eed:rules](../EED.md)

Children this specification reaches:

- [eed:dungeon](../../dungeon/EED.md)
- [eed:fov](../../fov/EED.md)
- [eed:combat](../../combat/EED.md)
- [eed:monsters](../../monsters/EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:intent](../../../shapes/intent.md)
- [shape:save](../../../shapes/save.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:floor-plan](../../../shapes/floor-plan.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:strike](../../../shapes/strike.md)
- [shape:point](../../../shapes/point.md)
- [shape:level](../../../shapes/level.md)
- [shape:bestiary](../../../shapes/bestiary.md)

# Inbound Side-Effects:
None: it reads only its arguments.

# Outbound Side-Effects:
None: every function answers a new world.
