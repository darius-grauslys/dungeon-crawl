# rules: `time`

How the rules are built on the four children below. Every function here
is pure: take a world, answer a new one with `world.with` (or `of`).

## Randomness

The world's `rng` is a mulberry32 state. A draw: `rng = (rng + 0x6D2B79F5) >>> 0`,
then mix it (`t = rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); value = ((t ^ (t >>> 14)) >>> 0) / 4294967296`).
Thread the state through every draw, the attacks' roll and ward draws included, and store the last state in the
world answered. A d20 roll is `1 + Math.floor(value * 20)`; a pick from a
list is `list[Math.floor(value * list.length)]`. `newGame(seed)` and
`fromSave` start `rng` at the seed; a new floor keeps threading it.

## A floor

`dungeon.generate(seed, depth)` makes the terrain; `level` (the shape)
says what the depth is. On a **dungeon** depth, with `stage =
level.stage(depth)` and `tier = level.tier(depth)`, place, in order, on
the plan's `spots` taken from the first onward: `2 + 2 * stage`
monsters, then the items. Each monster takes one draw first, which may make it a rarer kind (by
the floor's level, `level.number(depth)`); otherwise a second draw picks
from the level's list:

| levels | first draw: below ... | else a pick from |
|---|---|---|
| 1, 2 | (no first draw) | bat, slime, snake |
| 3 | 0.08: `swordsman` | bat, slime, snake |
| 4 | 0.10: `archer`; 0.16: `swordsman`; 0.22: `mage` | bat, slime, snake, skeleton |
| 5 | 0.10: `archer`; 0.16: `swordsman`; 0.22: `mage` | bat, slime, blue-spider, skeleton |
| 6 | 0.25: `mage`; 0.32: `snow-skeleton` | blue-slime, blue-spider, archer, swordsman, snowman |
| 7 to 10 | 0.25: `mage`; 0.32: `snow-skeleton`; 0.45: `wolf-man` | blue-slime, blue-spider, archer, swordsman, snowman |
| 11 to 15 | (no first draw) | beetle, mummy, cultist |
| 16 to 20 | (no first draw) | spider, ghost, scarecrow, pumpkin |
| 21 to 25 | (no first draw) | imp, demon, beholder |

(On levels 4 and 5, a first draw from 0.10 to below 0.16 is a
swordsman, from 0.16 to below 0.22 a mage. Levels 6 to 10 have no plain
skeleton, only the armed ones; from level 5 to 10 the blue spider takes
the snake's place, and no `blue-snake` is placed anywhere: it grew into
the second lair's serpent. The reaper is the third lair's boss, never
placed on a floor. A `pumpkin` is 2 by 2: it stands on its spot as its
top-left cell only when the 2 by 2 square from there is all `floor`
and holds no monster placed before it; otherwise a `spider` stands
there instead (no draw more).)

Monster stats from `bestiary.entry(kind)` (`hp` = `maxHp`), with the
tier: `hp` and `maxHp` are `base + Math.floor(base * tier / 2)`,
`attack` `base + tier` (but a kind whose base `attack` is 0 keeps 0:
the snowman, the scarecrow, the pumpkin), `defense` `base + Math.floor(tier / 2)` (a
`demon` of tier 4: 48/48/11/6), `range`, `magic` and `magicPower` the
entry's, `magicResist` 0. Every monster
`mode` `roam`, `size` the entry's (1), `ready` as the EED says.

Items, in this order, each kind by its draws: 2 food (each one draw,
a pick from `[cheese, cheese, bread, meat]`), then one draw for a
`potion` (below 0.25: one potion; else none), 2 `gold` (amount
`level.number(depth) * (3 + d)` with `d` a draw from 0 to 7), plus a
sword on stages 2 and 4 and an armor on stages 3 and 5, each of a grade
drawn from 1 up to the floor's **band** (one draw, `1 + Math.floor(value
* band)`; grade 1 is `sword` or `armor`, grade `g` above 1 `sword-<g>`
or `armor-<g>`), every `price` 0. The band: levels 1 to 5, 1; 6 to 10,
2; 11 to 15, 3; 16 to 25, 4 (`Math.min(4, tier + 1)`). Ids: heroes 0 to 3; monsters
and items count up from 10, fresh on each floor (monsters first).

On a **shop** depth (`level.kind(depth)` is `interior`): no monsters;
with `round = level.round(depth)`, `6 + [0, 3, 6, 12][round - 1]` wares
on the plan's spots in order (6, 9, 12, 18), each ware's kind drawn and
then its price, in order:
- the first two: food, one draw each from `[cheese, bread, meat]`;
- each other: one draw from `[potion, food, sword, armor, ring,
  necklace]`; a `food` takes one more draw from `[cheese, bread, meat]`;
  a `sword` or an `armor` one more for its grade, from 1 to
  `Math.min(4, round + 1)` (as on a floor).
The price, one draw: with the kind's base `B` and spread `S` below,
`Math.round(B * 1.25 ** (round - 1)) - S + Math.floor(value * (2 * S +
1))`.

| kind | `B` | `S` | | kind | `B` | `S` |
|---|---|---|---|---|---|---|
| `cheese` | 6 | 2 | | `sword` | 30 | 6 |
| `bread` | 10 | 3 | | `sword-2` | 45 | 6 |
| `meat` | 16 | 4 | | `sword-3` | 60 | 6 |
| `potion` | 30 | 6 | | `sword-4` | 80 | 6 |
| `ring` | 35 | 6 | | `armor` | 40 | 6 |
| `necklace` | 35 | 6 | | `armor-2` | 55 | 6 |
| | | | | `armor-3` | 70 | 6 |
| | | | | `armor-4` | 90 | 6 |

So each shop's prices are a quarter more than the last's.
`visible` and `explored` are every cell (`mask.of` with every cell
true), on arrival and after every `advance`.

On a **lair** depth (`boss`): when the plan has a `boss`, the boss (id
10; the `golem` on round 1, the `serpent` on round 2, the `reaper` on
round 3; stats from its
entry, untiered; `size` 3, `mode` `dormant`, `facing` `left`) at
`plan.boss`; the grid made again with `tile-grid`'s
`of`, the `plan.stairs` cell `floor`; the levers (ids 11 onward) on
`plan.levers` in order (round 1 only: the serpent's plan has none); a guard `slime` (`mode` `guard`, stats of tier
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
time, and `friends` the other alive monsters on the ground not hostile
to it (`monsters` keeps those within 6). A creature **off the ground**
(a spider's `air` phase `rise`, `aloft` or `drop`) is in no one's
`foes`, `threats` or `blocked`, and no attack's line, cleave, blast or
spike touches it. Before deciding, a `dormant` monster wakes as the EED
says, or waits; then, in this order, a chant, a fuse, a spider's leap
phases (and its flight), a snake's lunge, as **Abilities** says. Keep
the heroes' plain steps of step 1 in a list for step 2b (**Attacked
first**). New creatures and items (a split slime, a web) take ids as the
golem's gold does: on from the largest id of the world's monsters and
items, plus 1. A `guard` is decided like any other monster (never skipped):
`decide`'s own guard rule keeps it in place. Every attack is `combat.resolve(attacker.stats, defender.stats,
roll, ward)`: two draws, the d20 `roll` first, then `ward`, `1 +
Math.floor(value * 100)`. The log line follows the strike: `hit` false
is a miss line, `critical` true the `Critical!` line, `damage` the
`<n>`.

**The golem's cleave** (a boss's). When a boss's `move` reaches a hostile
creature, work out the EED's block from its `pos`, `size` (`small`: 1)
and the direction, collect every hostile creature covering a cell of
it (alive heroes in order, then monsters, each once), and run the same
melee strike helper on each in turn (two draws each, threaded). Its
`ready` and `last` are set once.

**Abilities.** Keep one helper that applies damage to a creature (from
any source: an attack, a curse, a blast), and does there what damage
does: a swarm's split, a wolf-man's enraging, the push and the curse of
the attacker's kind, and a death (a boss's too). Every action's latency
goes through one helper: the table's, doubled while `slow`, halved
(`Math.floor`) while `haste`, each taking 1 off its counter. A chant and
a fuse are checked when the monster's `ready` is reached, before
`monsters.decide` (a chanting monster does nothing else until its
`until`).

**The golem's gold** (a boss's). When a boss dies, at time `t`, two draws: the
total `(25 + Math.floor(value * 51)) * level.round(depth)`, then the count `n = 1 +
Math.floor(value * 5)`. The candidate cells: every `floor` cell (not
`stairs`) at distance 1 or 2 from the golem's last square, outside it (the
square is the dying golem actor's own: from its `pos`, `size` cells
each way, or its one cell when `small`; never `plan.boss`; a cell's
distance to it is the least `max(|dx|, |dy|)` to any cell it covers), holding no item and no alive creature, row by row
(top first, left to right). `n` becomes at most the number of
candidates. Each of the `n` amounts is `Math.floor(total / n)`, the
first also takes the rest (`total - n * Math.floor(total / n)` more);
each gold in turn takes one more draw, picking `candidates[Math.floor(value
* candidates.length)]` and removing it from the candidates. Ids count on
from the largest id of the world's monsters and items, plus 1. Each
`flung` `{x, y, at: t}` from that square's centre cell (`pos` plus
`Math.floor(size / 2)` each way; a `small` golem's own cell).

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
- `<h> drinks a potion (+5 max HP).` / `<h> eats <name> (+<n> HP).` /
  `<h> picks up <n> gold.` / `<h> picks up <name> (+1 attack).` /
  `<h> puts on <name> (+1 defense).` /
  `<h> puts on a ring (+1 magic power).` /
  `<h> puts on a cross necklace (+1 magic resist).`
- `<h>: your <stat> is too high for <name>. Use it (e) to trade it for gold.` /
  `<h> trades <name> for <g> gold.` / `<h>: your <stat> is too high for <ware>.`
- `<h> looks at <ware>: <p> gold. Bump it again to buy.` /
  `<h> buys <ware> for <p> gold.` /
  `Not enough gold for <ware>: <p> needed, the party has <g>.`
- `A shop! Bump a ware twice to buy it.`
- `<h> joins the party.`
- `<h> is cursed!` / `The wolf-man is enraged!` / `The cultist begins to chant.` /
  `The cultist's chant quickens the monsters!` / `The scarecrow begins to chant.` /
  `The scarecrow calls a swarm!` / `The pumpkin's fuse is lit!` / `The pumpkin explodes!` /
  `The blast hits <h> for 25.` / `The blast hits the <m> for 25.` /
  `A reaper guards the way down!`
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
