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
monsters, then the items. Monster kinds by stage, each picked from its
list:

| stage | kinds |
|---|---|
| 1 | bat, slime |
| 2 | bat, slime, snake |
| 3 | slime, snake, skeleton |
| 4 | snake, skeleton, demon |
| 5 | skeleton, demon |

Monster stats (`hp` = `maxHp`), before the tier:

| kind | hp | attack | defense |
|---|---|---|---|
| bat | 3 | 2 | 0 |
| slime | 6 | 2 | 1 |
| snake | 5 | 3 | 0 |
| skeleton | 9 | 4 | 2 |
| demon | 16 | 6 | 3 |

With the tier: `hp` and `maxHp` are `base + Math.floor(base * tier /
2)`, `attack` `base + tier`, `defense` `base + Math.floor(tier / 2)` (a
`demon` of tier 4: 48/48/10/5).

Items: 2 `potion`s and 2 `gold` (amount `depth * (3 + d)` with `d` a
draw from 0 to 7), plus a `sword` on stages 2 and 4 and an `armor` on
stages 3 and 5, every `price` 0. Ids: heroes 0 to 3; monsters and items
count up from 10, fresh on each floor.

On a **shop** depth (`level.kind(depth)` is `interior`): no monsters;
the six wares on the plan's six spots in order, of the kinds `potion`,
`sword`, `armor`, `potion`, `sword`, `armor`, each with a `price` drawn
in that order: with `round = level.round(depth)` and the kind's base `B`
and spread `S` (`potion` 20 and 12, `sword` 30 and 6, `armor` 40 and 6),
`Math.round(B * 1.25 ** (round - 1)) - S + Math.floor(value * (2 * S +
1))`, `value` one draw. So the base prices of the first shop are 20, 30
and 40 gold, and each next shop's are a quarter more than the last's.
`visible` and `explored` are every cell (`mask.of` with every cell
true), on arrival and after every `advance`.

**Start cells.** The plan's `start`, then the `floor` cells a
breadth-first search from it reaches by orthogonal steps over `floor`
cells, neighbours visited in the order up, right, down, left; leave out
the plan's `spots`. Heroes placed together (a save, a new floor) take
them in their order; a joining hero the first that no alive hero stands
on.

## The clock

`advance` as the EED says: each actor's `ready` moves on by the latency of
the action it fired (the EED's table: keep it as one constant table), and
every attack sets the defender's `held` (`Math.max(held, time + 300)`).
Turn and stamp actors with `actor.facingFor` and `last` as the EED says. A
monster's action: `monsters.decide(monster,
target, grid, blocked, turn)`, `target` the cell of the nearest alive hero
(by Manhattan distance; a tie, the first in `heroes`), `blocked` the other
monsters' cells and the other alive heroes' cells as they stand at that
moment (monsters already moved count where they now are), `turn`
`Math.floor(time / 400)` with `time` the new time. A monster whose `ready`
is reached but with no alive hero waits (its `ready` moves on all the
same). Every attack is `combat.resolve(attacker, defender, roll)`.
Visibility is the `mask.union` of `fov.compute(grid, pos, 7)` over the
alive heroes (all false with none), on a shop every cell; `explored` is
`mask.union(explored, visible)`. The monsters' `blocked` also holds
every ware's cell. A hero's `offer` goes back to `null` whenever it
fires anything but a bump of that ware (a bump of another ware makes
that one the offer).

## The log

Exactly these lines (`<h>` the hero's name, `<m>` the monster's kind):

- `<h> hits the <m> for <n>.` / `Critical! <h> hits the <m> for <n>.` /
  `<h> misses the <m>.` / `The <m> is slain.`
- `The <m> hits <h> for <n>.` / `Critical! The <m> hits <h> for <n>.` /
  `The <m> misses <h>.` / `<h> falls.`
- `<h> drinks a potion (+<healed> HP).` / `<h> picks up <n> gold.` /
  `<h> picks up a sword (+2 attack).` / `<h> puts on armor (+1 defense).`
- `<h> looks at <ware>: <p> gold. Bump it again to buy.` /
  `<h> buys <ware> for <p> gold.` /
  `Not enough gold for <ware>: <p> needed, the party has <g>.`
- `A shop! Bump a ware twice to buy it.`
- `<h> joins the party.`
- `All party members must be within 5 units of the exit!`
- `The party descends to depth <d>.` /
  `The party has fallen. Depth <d> begins again.` /
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

# Inbound Side-Effects:
None: it reads only its arguments.

# Outbound Side-Effects:
None: every function answers a new world.
