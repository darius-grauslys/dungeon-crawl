# rules: `turns`

How the rules are built on the four children below. Every function here
is pure: take a world, answer a new one with `world.with` (or `of`).

## Randomness

The world's `rng` is a mulberry32 state. A draw: `rng = (rng + 0x6D2B79F5) >>> 0`,
then mix it (`t = rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); value = ((t ^ (t >>> 14)) >>> 0) / 4294967296`).
Thread the state through every draw of a turn, and store the last state in
the world answered. A d20 roll is `1 + Math.floor(value * 20)`; a pick from
a list is `list[Math.floor(value * list.length)]`. `newGame(seed)` starts
`rng` at `seed`.

## A floor

`dungeon.generate(seed, depth)` makes the terrain. Place, in order, on the
plan's `spots` taken from the first onward: `2 + 2 * depth` monsters, then
the items. Monster kinds by depth, each picked from its list:

| depth | kinds |
|---|---|
| 1 | bat, slime |
| 2 | bat, slime, snake |
| 3 | slime, snake, skeleton |
| 4 | snake, skeleton, demon |
| 5 | skeleton, demon |

Monster stats (`hp` = `maxHp`):

| kind | hp | attack | defense |
|---|---|---|---|
| bat | 3 | 2 | 0 |
| slime | 6 | 2 | 1 |
| snake | 5 | 3 | 0 |
| skeleton | 9 | 4 | 2 |
| demon | 16 | 6 | 3 |

Items: 2 `potion`s and 2 `gold` (amount `depth * (3 + d)` with `d` a
draw from 0 to 7), plus a `sword` on depths 2 and 4 and an `armor` on
depths 3 and 5. Ids: the hero 0, the rest counting up from 1 across
monsters and items, fresh on each floor.

## A turn

As the EED's `step` says, using `combat.resolve(attacker, defender, roll)`
for every attack and `monsters.decide(monster, hero.pos, grid, blocked,
turn)` for every monster, where `blocked` is the other monsters' cells
as they stand at that moment (monsters already moved this turn count
where they now are) and `turn` the world's turn before it is counted up.
Visibility is `fov.compute(grid, hero.pos, 7)`; `explored` is
`mask.union(explored, visible)`.

## The log

Exactly these lines (`<m>` the monster's kind):

- `You hit the <m> for <n>.` / `Critical! You hit the <m> for <n>.` /
  `You miss the <m>.` / `The <m> is slain.`
- `The <m> hits you for <n>.` / `Critical! The <m> hits you for <n>.` /
  `The <m> misses you.`
- `You die on depth <d>. Press R to try again.`
- `You drink a potion (+<healed> HP).` / `You pick up <n> gold.` /
  `You pick up a sword (+2 attack).` / `You put on armor (+1 defense).`
- `You descend to depth <d>.` / `There are no stairs here.`
- `You escape the dungeon with <g> gold! Press R to play again.`
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
- [shape:floor-plan](../../../shapes/floor-plan.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:item](../../../shapes/item.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:strike](../../../shapes/strike.md)
- [shape:point](../../../shapes/point.md)

# Inbound Side-Effects:
None: it reads only its arguments.

# Outbound Side-Effects:
None: every turn answers a new world.
