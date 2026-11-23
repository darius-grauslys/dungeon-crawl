# rules

The game itself, in real time: making a new game or one from a save,
players joining the party, each player's next action, and the clock that
fires them. Pure: every function answers a new `world` and changes
nothing; everything random comes from the world's `rng`, so the same
world and arguments always give the same answer.

**Latency.** Every actor has its own `ready` time (its actor's `ready`,
in world milliseconds). A hero's action fires as soon as the world's
`time` has reached its `ready` and it has a `pending` intent: the last one
asked for with `intend` (a later `intend` replaces an earlier one that
hasn't fired). Firing clears `pending` and sets `ready` to the time it
fired plus that action's latency. A monster acts whenever its `ready` has
been reached, and then its `ready` is that time plus its action's latency.
Each kind of action has its own latency; a monster's are its kind's
`step` and `strike` (`bestiary`):

| action | hero | monster |
|---|---|---|
| a step (a `move` onto an open cell, or into a wall or a blocked cell) | **200** | `step` |
| an attack (an `attack`, a `move` onto a creature it fights, a bump, a pull) | **350** | `strike` |
| `use` | **250** | |
| `wait`, `descend` | **200** | `step` (a monster that waits) |

**Slowed.** A creature damaged by an attacker whose kind `slows`
(`bestiary`: the `blue-slime` and the `blue-snake`) is slowed: its
actor's `slow` becomes 3, and for a hero the log adds `<h>: you are
slowed!`. While its `slow` is above 0, each of its moves (steps, and
moves that go nowhere) and attacks (with bumps and pulls) that fires
takes twice its latency, and takes 1 off `slow`; its other actions are
as usual.

**Held.** An attack takes **300** ms to land. A creature attacked (hit or
missed) at time `t` is **held** until `t + 300` (its actor's `held`, the
larger of the old and the new): while the world's `time` is below its
`held`, it may not step. A hero's pending `move` that would not be an
attack stays pending, unfired, until `held` has passed; its `attack`,
`use`, `wait` and `descend` fire as usual. A held monster whose action
would be a step does nothing, and its `ready` becomes its `held` (it
decides again then); its attacks go on as usual.

**Attacked first.** A hero's `move` that would be a plain step (onto an
open cell no creature, ware or lever holds, cutting no corner) does not
fire with the other heroes' actions: it waits for the monsters of the
same `advance` (step 2 below), and fires right after them. So a monster
whose turn comes in the same `advance` attacks the hero where it stands;
held by that attack, the hero can't step, and its `move` stays pending
and fires in the first `advance` whose new `time` reaches its `held`
(right after the attack has landed). A `move` that waited is resolved
against the world as it stands after the monsters: onto a cell a
monster has since stepped onto, it is a melee attack on it.

**Directions and diagonals.** A `move` or an `attack` goes toward any
of the eight directions (`intent`). A diagonal step `(dx, dy)` **cuts a
corner** when either of the cells `(x + dx, y)` and `(x, y + dy)` beside
it is not open: a move that cuts a corner is a move into a wall (nothing
happens), and nothing is attacked across a cut corner.

**Aim and facing.** Every actor aims toward a direction (its actor's
`aim`; a new one aims right, `(1, 0)`). Every `move` and every `attack`
toward a direction that fires (even one into a wall, or toward an empty
cell) aims its actor that way and turns it to `actor.facingFor(dx, dy)`.
An `attack()` (both 0) goes toward the actor's `aim`, which it keeps. A
`face(dx, dy)` is not an action and never waits: `intend` aims the hero
that way and turns it at once (its `pending` and `ready` untouched).
An actor's `last` is set to `{kind, dx, dy, at, reach}` (`at` the time
it fired, `(dx, dy)` the direction it went) when it steps onto a new cell
(`kind` `move`, `reach` 1) or attacks (`kind` `attack`: every `attack`
that fires, every `move` onto a creature it fights, every bump and pull;
`reach` how many cells away the creature it struck was, else 1); a step
that goes nowhere leaves `last` as it was. The screen animates from
these. A new actor (a new game, a join, a new floor, a wipe) has `held`
0, `facing` `right`, `aim` `(1, 0)`, `slow` 0 and `last` null.

**Attacks and range.** An attack toward `(dx, dy)` by an actor of
`stats.range` `r` looks along the cells `pos + k * (dx, dy)` for `k` from
1 to `r` (for a creature bigger than one cell: from its `pos`): it stops
at the first cell that is not open (a wall), and at `k` 1 at a cut
corner; it strikes the first creature it reaches that is hostile to the
attacker (`bestiary`'s `hostile`; for a creature covering several cells,
any cell it covers), passing through friends; with none, nothing
happens. For a hero, a ware or a lever on the cell at `k` 1 is bumped or
pulled instead (below); a `web` on that cell with no creature
struck is torn (**Webs**). **Turning to the quickest foe.** A hero's `attack()` (both 0)
first looks at the eight cells next to it (a diagonal across a cut
corner not counted): if a creature hostile to it, on the ground, covers
any of them, the hero turns to the one that strikes **fastest** (the
least `strike` of its kind, doubled while its `slow` is above 0, halved
(`Math.floor`) while its `haste` is; on a tie, the first by direction in
`monsters`' order of preference: up, right, down, left, up-right,
down-right, down-left, up-left), aims and faces that way, and attacks
that way. With none, it attacks toward its `aim`, as before. Every attack is `combat`'s, a d20 roll and then
a ward roll (1 to 100) from the world's `rng`; a hit takes its whole
`damage` (physical and magic) off the defender's hit points; a miss takes
none and is logged as a miss, never as a hit of 0. A creature brought to
0 hit points: a monster is removed, a hero is no longer alive.

**Groups.** Monsters fight whatever is hostile to them: the alive
heroes, and, for a `demon`, the `vermin` (who fight back). A `vermin`
flees from a `demon` near it (`monsters`).

A hero starts with stats `{hp: 24, maxHp: 24, attack: 4, defense: 1,
range: 1}`. Two cells are **within 5** of each other when `max(|dx|,
|dy|) <= 5`; a creature is within `n` of a cell when one of the cells it
covers is.

**Depths.** Depths run from 1 to 33 (`level`): five themes of five
dungeon floors each (the levels 1 to 25), the monsters growing stronger
from one theme to the next, and between two themes a **shop** (depths 6,
13, 20 and 27) and then a **lair** (7, 14, 21 and 28). The stairs of
depth 33 win the game. Which monsters live on which floors is the ISD's.

**Items.** What a hero gets from an item it picks up (or buys), each
with its log line (`<name>` the item's name below):

| kind | effect | line |
|---|---|---|
| `potion` | `maxHp` 5 more, and `hp` 5 more: for good | `<h> drinks a potion (+5 max HP).` |
| `cheese`, `bread`, `meat` | heals `Math.max(1, Math.floor(maxHp * f))`, `f` 0.10, 0.25 and 0.50, never above `maxHp` (`<n>` what it healed, 0 at full health) | `<h> eats <name> (+<n> HP).` |
| a sword grade | 1 more `attack` | `<h> picks up <name> (+1 attack).` |
| an armor grade | 1 more `defense` | `<h> puts on <name> (+1 defense).` |
| `ring` | 1 more `magicPower` | `<h> puts on a ring (+1 magic power).` |
| `necklace` | 1 more `magicResist` | `<h> puts on a cross necklace (+1 magic resist).` |
| `gold` | the party's gold `amount` more | `<h> picks up <amount> gold.` |

**Grades and limits.** Each grade of sword and armor helps only up to its
**limit**: a hero whose stat is already at or above it gets nothing
from it.

| grade | name | limit (`attack`) | | grade | name | limit (`defense`) |
|---|---|---|---|---|---|---|
| `sword` | `a sword` | 8 | | `armor` | `armor` | 4 |
| `sword-2` | `a fine sword` | 12 | | `armor-2` | `chainmail` | 8 |
| `sword-3` | `an axe` | 16 | | `armor-3` | `bronze mail` | 12 |
| `sword-4` | `a great axe` | 24 | | `armor-4` | `jade mail` | 24 |

A hero stepping onto a sword or armor (not a ware) at or above its limit
does not pick it up: it stays on the floor under the hero, with the
line `<h>: your <stat> is too high for <name>. Use it (e) to trade it
for gold.` (`<stat>` `attack` or `defense`). A hero's fired `use` while
it stands on such an item (one it is at or above the limit of; the
first in `items` if several) **trades** it: the item is gone, the
party's gold is `g` more, `g` from 1 to 10 (one draw, `1 +
Math.floor(value * 10)`), with the line `<h> trades <name> for <g>
gold.` (its `gesture` `use`, as any `use`). Names: `a potion`, `some
cheese`, `bread`, `meat`, the grades' names above, `a ring`, `a cross
necklace`.

**Shops.** A shop floor has no monsters, and every cell of it is
`visible` and `explored`. Its items are six **wares** (items with a
`price`), drawn at random as the ISD says: the first shop (depth 6)
holds 6, the next ones 6 more the bonus of its round, 3, 6 and 12 (9 at
depth 13, 12 at 20, 18 at 27), on the plan's first spots in order. The
first two wares are always food; the others are any kind but `gold` and
`lever`. Prices rise by a quarter from each shop to the next (the ISD). A ware is never picked up: a hero
buys it by bumping it twice. A fired `move` onto a ware's cell, or
`attack` toward it (its cell next to the hero), is a **bump**: it fires
with an attack's latency, and turns the hero (its aim and `facing`), but
it is a **use**, not an attack: the hero's `last` stays as it was, its
actor's `gesture` becomes `{kind: 'use', at}` (`at` the time it fired),
and it holds no one. On a bump of a ware that is not the
hero's `offer`, the hero's `offer` becomes that ware's `id`, with the
line `<h> looks at <ware>: <p> gold. Bump it again to buy.` On a bump of
the ware that is its `offer`: with the party's gold at least the price,
the gold goes down by the price, the ware is gone from `items`, the
hero's `gesture` becomes `{kind: 'power', at}` (not `use`), the hero
gets its effect as if picked up (**Items**; no line of its own), and the
line is `<h> buys <ware> for <p> gold.`; with less, the line `Not enough gold for
<ware>: <p> needed, the party has <g>.`, and nothing else changes;
either way the `offer` is `null` again. Every other action of a hero
that fires sets its `offer` to `null` (a `face` is not one).
A sword or armor ware the bumping hero is at or above the limit of is
never offered: the bump's line is `<h>: your <stat> is too high for
<ware>.`, and its `offer` stays `null`.
`<ware>` is the item's name (**Items**), `<p>` its price.

**Lairs.** Each lair is one great hall (`dungeon`). The first lair (depth 7) is the golem's. The `golem`
(`bestiary`; stats 40/40/12/12, `magic` 6, `magicPower` 2: each hit
deals 12 less armor, at least 1, plus 6 magic damage) stands on the
plan's `boss` square, 3 by
3 cells, `dormant`, facing left; while it lives, the cell of the plan's
`stairs` (at the centre of its square) is `floor`: there is no way down.
A `lever` item stands on each of the plan's `levers`, and on every one
of the plan's `spots` a `slime` **guard** (`mode` `guard`, the slime's
stats of tier 0: 6/6/2/1): guards never move, but attack any foe next to
them. A guard takes its turns as every monster does (step 2 of
`advance`: `monsters.decide`, whose guard rule keeps it where it
stands): it is never skipped, so a hero who comes next to a guard is
attacked, and a guard with no foe next to it waits (its `ready` moves on
by its `step`).

The second lair (depth 14) is the **serpent**'s: a `serpent`
(`bestiary`: a giant blue snake, 3 by 3 cells, its bite slows; stats
from its entry, untiered: 60/60/10/6) stands on the plan's `boss` square,
`dormant`, facing left, and, as with the golem, the plan's `stairs` cell
is `floor` while it lives. No levers, no guards: it is fought as it is.
The third lair (depth 21) is the **reaper**'s, the same way: a `reaper`
(2 by 2 cells; stats from its entry, untiered: 90/90/14/8, `magic` 4,
`magicPower` 2) on the plan's `boss` square, `dormant`, facing left, the
`stairs` cell `floor` while it lives. The last lair (28) is an empty
hall with its stairs open: no monsters, no items.

The golem, the serpent and the reaper are the **bosses**: what follows of the
golem's cleave and death holds for each (`<m>` the boss's kind in each
line: `The serpent is slain.`, `Gold spills from the serpent!`); the
levers weaken only a golem.
- **Waking.** When a `dormant` monster's `ready` is reached, if an alive
  hero is within 4 of it (`max(|dx|, |dy|) <= 4` to a cell it covers),
  its `mode` becomes `roam` and the log adds `The <m> awakens!`; it then
  acts as any monster does (very slowly). Otherwise it waits.
- **Levers.** A hero's fired `move` onto a lever's cell, or `attack`
  toward it (next to it), **pulls** it if it is not yet `pulled`: it
  fires as a bump does (a use: `gesture` `{kind: 'use', at}`, `last`
  unchanged), the lever is `pulled`, and, while
  a `golem` lives, the golem's `attack`, `defense` and `magic` are
  halved (`Math.floor`) and it shrinks: a `size` of 3 becomes 2, a `size` of 2
  becomes 1, and at `size` 1 it becomes `small` (it keeps its `pos`, the
  top-left cell). The line is `<h> pulls a lever. The golem weakens!`
  (with no golem alive, `<h> pulls a lever.`). A pulled lever bumped
  again: it fires as an attack, and nothing else happens. A lever is
  never picked up, and blocks a step like a ware.
- **The golem's cleave** (a boss's). The boss's melee attack (a `move` whose
  moved square reaches a cell a hostile creature covers) strikes not
  one creature but a block of cells **in front** of it: as wide as its
  `size` and `depth` deep, where `depth` is 2 at `size` 3 and 1 at
  `size` 2 or 1 (3 by 2 cells, then 2 by 1, then 1 by 1; a `small`
  golem: its one cell's front, 1 by 1). For an orthogonal direction
  `(dx, dy)` the block is the cells just past its square's edge on that
  side: for `(1, 0)` the columns `pos.x + size` to `pos.x + size +
  depth - 1`, rows `pos.y` to `pos.y + size - 1` (and likewise for the
  other three sides). For a diagonal, the cells its square would cover
  moved `k * (dx, dy)` for `k` from 1 to `depth` that it does not cover
  now. Every creature hostile to it covering a cell of the block is
  struck, each once (the alive heroes in their order, then the
  monsters), each its own `combat` attack (its own two draws, its own
  log line, its own `held`); friends are untouched. It fires once, with
  the golem's `strike` latency and one `last` (`{kind: 'attack', dx, dy,
  at, reach: 1}`). Every other monster's melee attack strikes the one
  creature it reaches, as before.
- **The golem's death** (a boss's). When the boss is brought to 0 hit points:
  it is removed, with the line `The <m> is slain.`; every `guard`
  monster is removed too (`The guardians crumble.`, only when there was
  one); the plan's `stairs`
  cell (of `dungeon.generate(seed, depth)`) becomes `stairs` (`The way
  down opens!`); and gold spills from it (`Gold spills from the
  <m>!`): from 25 to 75 gold in all on the first lair, from 50 to 150
  on the second (the ISD's total times the lair's `level.round`), in 1 to 5 `gold` items (the ISD
  says how many and where), around **where the golem died**: its
  square as it stood at that moment (its `pos` then and its `size`,
  however far it had walked from the plan's `boss` and however much it
  had shrunk; a `small` golem's square is its one cell), never the
  plan's `boss` square nor the stairs. Each on a `floor` cell within 2
  of that square and outside it, holding no item and no creature, each
  `flung` from the cell at the centre of that square (`pos` plus
  `Math.floor(size / 2)` each way) at the time it died.

**Abilities.** Some kinds do more than move and attack, by their
`bestiary` `ability` (and every action's latency is as the table says,
then doubled while `slow`, then **halved** (`Math.floor`) while the
actor's `haste` is above 0, which then takes 1 off `haste`):

- **Push** (`beetle`): a creature its attack damages (and that is still
  alive) is pushed one cell along the attack's direction `(dx, dy)`:
  its whole square moves by it when every cell it would cover is open,
  holds no other creature, ware or lever, and the move cuts no corner;
  otherwise it stays. A creature bigger than one cell is never pushed.
- **Curse** (`mummy`): a hero its attack damages (still alive) is
  cursed: its actor's `curse` becomes 3, with the line `<h> is
  cursed!`. Every action a cursed hero fires (a `face` is none) deals it
  1 damage, before the action, and takes 1 off `curse`; brought to 0
  hit points it falls (`<h> falls.`) and the action doesn't happen.
- **Enrage** (`wolf-man`): when an attack leaves it alive at no more
  than half its `maxHp` (`hp * 2 <= maxHp`), its actor's `kind` becomes
  `enraged-wolf-man` (same `id`, cell and stats: from then on it acts at
  that kind's speed, twice as fast), with the line `The wolf-man is
  enraged!`.
- **Chant** (`cultist`): when its `ready` is reached and it has no
  `chant`: if another monster is within 5 of it, no monster within 5 of
  it (itself included) has `haste` above 0, and no foe is next to it, it
  **begins to chant** instead of deciding: its `chant` becomes `{kind:
  'haste', at: t, until: t + 3 * step}` (`t` the time, `step` its
  kind's; three steps' worth), its `ready` `until`, with the line `The
  cultist begins to chant.` When its `ready` is reached with a `chant`
  of `haste`, it **finishes**: every monster within 5 of it (itself
  included) gets `haste` 3, its `chant` becomes `null` and its `ready`
  the time plus its `step`, with the line `The cultist's chant quickens
  the monsters!` Otherwise it acts as any monster does.
- **Summon** (`scarecrow`): it never moves nor attacks (`monsters`
  answers it a wait). When its `ready` is reached: with a `chant` of
  `summon`, it **finishes**: three `swarm`s (stats from their entry,
  untiered: 3/3/4/0, `magic` 2) appear on the first three free cells
  within 2 of it (open, holding no creature, ware or lever; by distance
  `max(|dx|, |dy|)`, then row by row), each `ready` the time plus its
  `step` (80); its `chant`
  becomes `null`, its `cooldown` the time plus 8 of its steps, its `ready`
  the time plus its `step`, with the line `The scarecrow calls a
  swarm!`. Without a `chant`, at or past its `cooldown`, with a foe
  within its `reach` and fewer than 3 `swarm`s within 5 of it, it
  **begins to chant**: `chant` `{kind: 'summon', at: t, until: t + 5 *
  step}`, `ready` `until`, the line `The scarecrow begins to chant.`
  Otherwise it waits (`ready` plus its `step`).
- **Split** (`swarm`): any damage to a swarm takes exactly 1 hit point,
  whatever its amount; a swarm left alive by it (at `hp` above 0)
  splits: a new `swarm` of `hp` 1 (`maxHp` 3) appears on the first free
  cell next to it (in `monsters`' order of preference: up, right, down,
  left, then the diagonals; open, holding no creature, ware or lever),
  `ready` the time plus 80; with no free cell, none. A swarm at 1 hit point that
  is damaged dies, and doesn't split.
- **Fuse** (`pumpkin`): it never attacks (`monsters` makes it wait next
  to a foe), but walks toward foes as any monster does, slowly. When its
  `ready` is reached with no `fuse` and a foe within 2 of its square, its
  `fuse` becomes `{at: t}` (it still acts that turn), with the line `The
  pumpkin's fuse is lit!`. When its `ready` is reached at or past
  `fuse.at + 6 * step` (three steps at a slow blink, three at a fast
  one: the screen's), it **explodes** instead of acting: it is removed,
  the world's `effects` gains `{kind: 'blast', x, y, size, at: t}` (its
  square), the line `The pumpkin explodes!`, and every creature (heroes
  and monsters alike, friend or foe, another pumpkin too) covering a
  cell within 2 of its square takes 25 damage, all of it magic (no roll,
  never warded), each with the line `The blast hits <h> for 25.` /
  `The blast hits the <m> for 25.` and, brought to 0, `<h> falls.` /
  `The <m> is slain.` (a swarm still takes 1; a boss slain this way dies
  as a boss does).

- **Leap** (`spider`, `blue-spider`). A spider **leaps** to come down
  on its foes from above. When its `ready` is reached on the ground
  (`air` `null`), with `mode` `roam`, at or past its `cooldown`, not
  fleeing (below), with a foe within its `reach` and none next to it: its
  `air` becomes `{phase: 'crouch', at: t}` and its `ready` `t + 250`
  (it flattens, gathering itself: still on the ground). At its `ready`
  with `crouch`: `{phase: 'rise', at: t}`, `ready` `t + 250` (it springs
  up). At its `ready` with `rise`: `{phase: 'aloft', at: t}`, and it acts
  aloft at once. **Aloft**, at each `ready`: it is **poised** when it is
  next to a foe and no other creature (on the ground) covers its own
  cell. Poised, it **drops** when every other `aloft` spider within 8 of
  it is poised too, and then each of those drops with it at that same
  moment (spiders come down together); a spider aloft for 4000 ms or
  more (`t >= air.at + 4000`) with no creature on its cell, or with no
  foe within its `reach`, drops on its own. Dropping: `air` `{phase:
  'drop', at: t}`, `ready` `t + 150`. Poised and waiting for the others:
  it waits, `ready` `t + 50`. Otherwise it moves as `monsters.decide`
  answers with nothing in its `blocked` (it flies over everything): a
  `move` onto open cells is a step there (even onto creatures' cells:
  they share the cell), at its `step` latency; a `move` that would
  attack, or anything else, is a wait (`t + 50`). At its `ready` with
  `drop`: it lands, `air` `null`, `cooldown` `t + 10 * step`, and acts
  at once as any monster does (next to a foe, it attacks). **Off the
  ground** (`air` phase `rise`, `aloft` or `drop`) a creature can't be
  harmed and doesn't attack: an attack's line passes over it as over a
  friend, a cleave or a blast or spikes don't touch it, no creature
  fights or flees it (it is in no one's `foes` or `threats`), and it
  blocks nothing (heroes and monsters step onto its cell).
- **Flight and webs** (`spider`, `blue-spider`). A spider on the ground
  at a third of its `maxHp` or less (`hp * 3 <= maxHp`) **flees**: it
  never leaps, is decided with no `foes` and with its foes' cells added
  to its `threats`, and its steps take a third of its `step`
  (`Math.floor(step / 3)`, then slowed and hastened as usual). Every
  step it takes leaves a `web` item (a new id, `price` 0) on the cell it
  left, if that cell holds no item.
- **Webs.** A creature on the ground whose step (or push) brings it
  onto a web's cell tears the web (the item is removed) and is caught:
  its `slow` becomes at least 1 (its next move or attack takes twice its
  time), with, for a hero, the line `<h> is caught in a web!`. A hero's
  attack (an `attack` toward a direction, `attack()` included) whose
  first cell holds a web and no creature it strikes tears it instead,
  with no slow: the web is removed and the line is `<h> tears a web.`
  (it fires as an attack). A web is never picked up, bought, nor in
  anyone's way.
- **Lunge** (`snake`, `blue-snake`). When its `ready` is reached, with
  `mode` `roam`, at or past its `cooldown`: if a foe's cell (the first
  such in its `foes`) is exactly 3 cells away along one of the eight
  directions `(dx, dy)` (`pos + 3 (dx, dy)`), and the two cells between
  are open, hold no creature on the ground, ware or lever, and no step
  of the three cuts a corner, it **lunges**: it glides to `pos + 2 (dx,
  dy)` (next to the foe), its `last` `{kind: 'lunge', dx, dy, at: t,
  reach: 2}`, aim `(dx, dy)`, facing `actor.facingFor(dx, dy)`, `ready`
  `t + 150` (the glide: it may attack as soon as it lands), `cooldown`
  `t + 5 * step` (five of its actions). A lunge is no attack: the foe is
  not held, nothing is rolled. Landing on a web catches it as a step
  does.
- **Slimes split** (`bestiary`'s `SLIMES`). A slime of `maxHp` above 1,
  not a `guard`, brought to 0 hit points (by any damage), takes one
  draw: below 0.5, it **splits**: two slimes of its kind burst out of
  the cell it died on (its `pos`), each with `hp` 1 and `maxHp` 1, its
  other stats, `mode` `roam`, `ready` `t` plus its `step`, and `flung`
  `{x, y, at: t}` (`(x, y)` its `pos`): each on a cell picked by one
  more draw from the free cells within 2 of that cell (open, holding no
  creature on the ground, ware or lever; row by row; behind another
  creature counts), the second from those left; with fewer free cells,
  fewer slimes. The line `The <m> splits!` follows its slain line. A
  slime of `maxHp` 1 never splits.

**Spikes.** A dungeon floor's world has its plan's spike traps (`spikes`,
from `dungeon.generate`, on `newGame`, `fromSave`, a wipe and a descent;
none elsewhere). A spike's cycle runs in steps of 400 ms: at world time
`t` it is in frame `[0, 1, 0, 1, 0, 2][(Math.floor(t / 400) + shift) %
6]` (0 down, 1 peeking, 2 **raised**). Each time a spike is raised (a
time `m`, a multiple of 400, with `(m / 400 + shift) % 6` equal to 5,
reached by an `advance`: the old time below `m`, the new at least `m`),
every creature on the ground covering its cell takes the floor's spike
damage less its `defense` (at least 1; no roll, no ward), by the depth's
`level.tier`: 4 on tier 0, 8 on tier 1, 16 on tier 2, 32 on tiers 3 and
4, with the line `The spikes hit <h> for <n>.` / `The spikes hit the <m>
for <n>.` (and, brought to 0, `<h> falls.` / `The <m> is slain.`). A
creature whose step brings it onto a raised spike is struck the same
way at once. Spikes never block anything.

A world's `effects` are kept for 1000 milliseconds: each `advance`
drops every effect whose `at` is more than 1000 below the new time.

# API Shapes:
- [shape:world](../../shapes/world.md)
- [shape:intent](../../shapes/intent.md)
- [shape:save](../../shapes/save.md)
- [shape:level](../../shapes/level.md)
- [shape:bestiary](../../shapes/bestiary.md)

# Functions:
## Function - new-game:
`newGame(seed) -> world`. `seed` an integer from 0 to 4294967295 (anything else throws a `TypeError`). Depth 1, time 0, state `playing`, gold 0, no heroes, the floor `dungeon` makes for this seed and depth 1, the floor's monsters and items placed on its spots as the ISD says, every monster's `ready` 0, `visible` and `explored` all false, `entry` the save of this seed, depth 1 and no players, and a log of one line: `Welcome to the dungeon. Find the stairs (>).`

## Function - from-save:
`fromSave(save) -> world`. `save` a `save` (anything else throws a `TypeError`). As `newGame(save.seed)`, but on the floor of `save.depth`, freshly placed (on a lair, as **Lairs** says), with the save's players as its heroes, in their order, each alive with the saved stats (a saved `hp` of 0 is 1), `pending` null, `ready` 0, the `i`-th player's `colour` `i` and `group` 0, on the floor's start cells (the ISD); `visible` what they see (on a shop, every cell), `explored` the same; `entry` the save (with any `hp` of 0 made 1); the log the welcome line.

## Function - to-save:
`toSave(world) -> save`. The world's seed and depth, and its heroes, in order, each `{name, stats}` with its stats as they are now, but a hero that is not alive saved at 1 hit point.

## Function - join:
`join(world, name) -> world | null`. `name` a name (`save`'s `isName`; anything else throws a `TypeError`). A hero of that name already in the world: the same world (`===`). Else, with 4 heroes: `null`. Else the world with a new hero of that name at the end of `heroes`: the starting stats, alive, `pending` null, `ready` the world's `time`, its `colour` the smallest of 0 to 3 no other hero has and its `group` 0, on the first free start cell, its actor's `id` the smallest of 0 to 3 no hero has; added to `entry`'s players too (with the starting stats); `visible` and `explored` taking in what it sees; the log line `<name> joins the party.`

## Function - intend:
`intend(world, name, intent) -> world`. `intent` an `intent` (anything else throws a `TypeError`). A name no hero has, a hero not alive, or a world whose state is not `playing`: the same world (`===`). A `face(dx, dy)`: the world with that hero's actor aiming `(dx, dy)` and facing `actor.facingFor(dx, dy)`, nothing else changed (its `pending` stays). Any other intent: the world with that hero's `pending` the intent.

## Function - advance:
`advance(world, ms) -> world`. `ms` an integer from 1 to 1000 (anything else throws a `TypeError`). The world `ms` later: `time` is `ms` more. A world whose state is not `playing` changes no more than that. Otherwise, in this order:
1. **Heroes**, in their order: each alive hero whose `ready` is at most the new `time` and that has a `pending` intent fires it:
   - `move` onto a ware's cell, or `attack` toward a ware next to it: a bump (above); onto a lever's cell, or toward a lever next to it: a pull (above).
   - `move` into a `wall`, across a cut corner, or onto another alive hero: nothing happens.
   - `move` onto a cell a monster covers: a melee attack on that monster (`reach` 1).
   - `attack` toward a direction (or `attack()`, toward its aim): an attack along its range (**Attacks and range**); striking nothing, nothing happens.
   - `move` onto an open cell no creature, ware or lever holds: it waits for step 2b (**Attacked first**); there the hero steps and picks up every item there (**Items**; a sword or armor at or above its limit stays); when one it picks up is anything but `gold`, its actor's `gesture` becomes `{kind: 'power', at}` (`at` the time it fired).
   - `use`: its actor's `gesture` becomes `{kind: 'use', at}`; standing on a sword or armor at or above its limit, it trades it (**Items**); otherwise nothing else happens.
   - `wait`: nothing happens.
   - `descend` (a grid with no `stairs` cell: nothing happens): when every alive hero is within 5 of the stairs, the party goes down (the step 4 below takes it, after the monsters); otherwise nothing but the log line `All party members must be within 5 units of the exit!`.
2. **Monsters**, in the order of `monsters` (one removed before its turn does nothing): each whose `ready` is at most the new `time` takes its action: a `dormant` one may wake (**Lairs**); then `monsters.decide`, with its foes the creatures hostile to it (the alive heroes, then the monsters), its threats the monsters it flees, its `friends` the other monsters not hostile to it (on the ground), and the cells it may not step onto: every other alive creature's cells (on the ground), the wares' and the levers'. (With no foe it roams, as `monsters` says; a spider's leap and flight, a snake's lunge, a chant and a fuse come first, **Abilities**.) A `move` whose moved square reaches a cell a hostile creature covers is a melee attack on that creature (the alive heroes before the monsters, in their order); a `move` onto cells all open, holding no creature, ware or lever, and not cutting a corner, is a step there; anything else, nothing. An `attack` is an attack along its range. A hero brought to 0 hit points is no longer alive (its actor stays where it fell, and no one else sees it there: it blocks nothing and is not drawn).
   Then **2b**: each hero's `move` that waited (**Attacked first**), in the heroes' order, fires now, as step 1 says, unless its hero is now held or no longer alive (then it stays pending, or is dropped with the dead). Then **2c**: the spikes raised in this `advance` strike (**Spikes**).
3. **A wipe**: with at least one hero and none alive, the floor starts again from `entry`: the world `fromSave(entry)` would give, but keeping `time`, `gold` and the log (every `ready` the current `time`), with the line `The party has fallen. <label> begins again.` (`<label>` `level.label(depth)`: `Level 3`, `Shop`, `Lair`).
4. **The stairs**: only when a `descend` fired in step 1 with every alive hero within 5 of the stairs, and a hero is still alive and every alive hero is still within 5 of them after step 2 (else the line `All party members must be within 5 units of the exit!`): on depth 33 the state becomes `won` (log `The party escapes the dungeon with <g> gold!`); otherwise the next depth's floor, freshly placed (monsters' `ready` the current `time`), every hero on its start cells, alive, its `colour` and `group` kept, `gesture` null, each `maxHp` 4 more, `hp` 4 more for one that was alive (never above `maxHp`) and 1 for one that wasn't, `ready` the current `time`, `pending` null, `offer` null, `slow` 0, `held` 0; `explored` reset; `entry` the save of the new floor and the heroes as they now are; the log: on a dungeon floor `The party descends to level <n>.` (`<n>` `level.number(depth)`); on a shop `The party descends to a shop.` and `A shop! Bump a ware twice to buy it.`; on the golem's lair `The party descends into a lair.` and `A golem guards the way down. Pull the levers to weaken it!`; on the serpent's `The party descends into a lair.` and `A great serpent guards the way down!`; on the reaper's `The party descends into a lair.` and `A reaper guards the way down!`; on another lair `The party descends into a lair.` alone.
5. `visible` is computed again from every alive hero's cell (radius 7) (on a shop: every cell), and `explored` takes in `visible`.
Every event adds a line to the log (the 50 most recent are kept).

# Intrinsics:
## Intrinsic - new-game:
`newGame(5)` twice gives deep-equal worlds. `newGame(5)`: depth 1, time 0, state `playing`, gold 0, seed 5, no heroes, exactly 4 monsters, each a `bat`, `slime` or `snake`, on an open cell, no two on one cell, each `ready` 0, `mode` `roam`; at least 4 items; `visible.count()` and `explored.count()` 0; `entry` deep equal to `save.of({seed: 5, depth: 1, players: []})`; the log exactly `['Welcome to the dungeon. Find the stairs (>).']`. The grid is 48 by 32.

## Intrinsic - joins:
`w = join(newGame(5), 'Ann')`: one hero `Ann`, alive, `pending` null, `colour` 0, `group` 0, stats `{hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0}`, `ready` 0, `gesture` null, on an open cell no monster holds, its actor's `id` no monster's or item's, its `aim` `{dx: 1, dy: 0}`; `visible.at` its cell true; `entry.players` one entry, `Ann` with those stats; the log's last line `Ann joins the party.` `join(w, 'Ann')` is `w`. `join(w, 'Bob')` puts `Bob` on another cell, with `colour` 1. With four heroes, `join(w4, 'Eve')` is `null`. `join(w, '')` throws a `TypeError`.

## Intrinsic - immutable:
For a world `w` with a hero, `intend(w, ...)`, `advance(w, ...)`, `join(w, ...)` and `toSave(w)` leave `w` as it was before.

## Intrinsic - latency:
In a world on `['#######', '#.....#', '#######']` with `Ann` at (1, 1), `ready` 0, time 0, no monsters: `advance(intend(w, 'Ann', move(1, 0)), 50)` has Ann at (2, 1), her `ready` 250, `pending` null, time 50. Then `intend` of `move(1, 0)` and then `move(-1, 0)`, and `advance` by 50 three times: Ann is still at (2, 1) with `pending` `move(-1, 0)`; a fourth `advance` by 50 (time 250): Ann at (1, 1), `ready` 450. A `move(0, -1)` into the wall fires (her `ready` is pushed on by 200) and leaves her where she was. With no `pending`, `advance` leaves her `ready` as it was. In that world with Ann at (2, 1) at time 0, `attack(1, 0)` (toward nothing) advanced by 50 makes her `ready` 400; `use()`, 300; `wait()` and `descend()`, 250. Two heroes keep their own clocks: with `Bob` at (4, 1), `ready` 0, Ann's `attack(1, 0)` and Bob's `move(-1, 0)` advanced by 50 give Ann `ready` 400 and Bob `ready` 250 at (3, 1).

## Intrinsic - diagonal:
In a world on `['#####', '#...#', '#...#', '#####']` with `Ann` at (1, 1): `advance(intend(w, 'Ann', move(1, 1)), 50)` has Ann at (2, 2), `ready` 250, `aim` `{dx: 1, dy: 1}`, `facing` `right`, `last` `{kind: 'move', dx: 1, dy: 1, at: 50, reach: 1}`. In a world on `['#####', '#.#.#', '#...#', '#####']` with Ann at (1, 1), her `move(1, 1)` cuts the corner (2, 1): she stays at (1, 1), `ready` 250, `aim` `{dx: 1, dy: 1}`. In the first world with a `bat` of 1 hit point (defense 0, `ready` 10000) at (2, 2): for `rng` from 0 to 39, Ann's `move(1, 1)` leaves her at (1, 1) and in at least one the bat is gone, in at least one it is there with `held` 350.

## Intrinsic - faces:
In the `latency` world with Ann at (2, 1): a fired `move(-1, 0)` turns her `left`, `move(0, 1)` (into the wall) `left`, `move(1, 0)` `right`, `move(0, -1)` `right`, each aiming her that way. After her `move(1, 0)` fires at time 50, her `last` is `{kind: 'move', dx: 1, dy: 0, at: 50, reach: 1}`; after a `move(0, -1)` into the wall, `last` is as it was. `intend(w, 'Ann', face(-1, 1))` answers at once a world with Ann's `aim` `{dx: -1, dy: 1}`, `facing` `left`, and her `pending`, `ready`, cell and the world's `time` unchanged; with a `move(1, 0)` intended first, it is still her `pending` after the `face`. A hero who joins has `held` 0, `facing` `right`, `aim` `{dx: 1, dy: 0}` and `last` null. In the `monsters-act` world, the skeleton's first step leaves it `facing` `left` with `last` `{kind: 'move', dx: -1, dy: 0, at: 50, reach: 1}`.

## Intrinsic - picks-up:
In the `latency` world, with an item at (2, 1), after Ann's `move(1, 0)` fires the item is gone from `items` and: a `gold` of amount 7 makes `gold` 7 more; a `potion`, with Ann at 10 of 24 hit points, makes her `hp` 15 and `maxHp` 29, the log's last line `Ann drinks a potion (+5 max HP).`; a `cheese`, with Ann at 10 of 24, makes her `hp` 12 (`Ann eats some cheese (+2 HP).`), a `bread` 16 (`Ann eats bread (+6 HP).`), a `meat` 22 (`Ann eats meat (+12 HP).`), and a `meat` at 20 of 24 makes it 24 (`Ann eats meat (+4 HP).`); a `sword` makes her `attack` 5 (from 4), the line `Ann picks up a sword (+1 attack).`; an `armor` makes her `defense` 2 (from 1), the line `Ann puts on armor (+1 defense).`; a `ring` makes her `magicPower` 2 (from 1), the line `Ann puts on a ring (+1 magic power).`; a `necklace` makes her `magicResist` 1, the line `Ann puts on a cross necklace (+1 magic resist).` Each of these but `gold` also leaves her `gesture` `{kind: 'power', at: 50}` and her `last` the move's `{kind: 'move', dx: 1, dy: 0, at: 50, reach: 1}`; a `gold` leaves `gesture` `null`. Her `use()` fired at time 50 with nothing around leaves her `gesture` `{kind: 'use', at: 50}`, `last` `null`, `ready` 300, and nothing else changed; a `wait()` leaves `gesture` `null`.


## Intrinsic - attacks:
In a world on `['######', '#....#', '######']` with `Ann` (attack 4) at (1, 1) and a `bat` of 1 hit point (defense 0, `ready` 10000) at (2, 1): for `rng` from 0 to 39, Ann's `move(1, 0)` (one `advance` by 50) leaves her at (1, 1) every time; in at least one the bat is gone from `monsters`, and in at least one it is still there with 1 hit point. In every one Ann's `ready` is 400 and the bat's `held`, if it is still there, 350. `attack(1, 0)` does the same, and so does `attack()` (her `aim` is `(1, 0)`); `attack(-1, 0)` (toward the wall) changes nothing but Ann's `ready` (400), `aim` (`{dx: -1, dy: 0}`), `facing` (`left`) and `last` (`{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 1}`).

## Intrinsic - ranged:
In a world on `['#######', '#.....#', '#######']` with `Ann` of stats 24/24/4/1 and `range` 3 at (1, 1), `Bob` at (2, 1), and a `bat` of 1 hit point (defense 0, `ready` 10000) at (4, 1): for `rng` from 0 to 39, Ann's `attack()` advanced by 50 leaves Ann and Bob where they were, Bob's hit points 24, Ann's `ready` 400 and `last` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 3}`; in at least one the bat is gone, in at least one it is there with `held` 350. With the bat at (5, 1) (4 away) instead, the bat is untouched (`held` 0) and Ann's `last` has `reach` 1. In a world on `['#######', '#..#..#', '#######']` with Ann (`range` 3) at (1, 1) and the bat at (4, 1), it is untouched (the wall stops the attack). In the first world with Ann alone at (1, 1) and an `archer` (stats 7/7/3/1, `range` 4, `ready` 0) at (5, 1): `advance(w, 50)` gives Ann `held` 350 and the archer `ready` 750, `facing` `left`, `last` `{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 4}`.

## Intrinsic - slowed:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24 of 24, defense 1) at (2, 1) and a `blue-snake` (attack 3, `ready` 0) at (3, 1): for `rng` from 0 to 39, in at least one `advance(w, 50)` Ann has fewer than 24 hit points, `slow` 3, and the log's last line `Ann: you are slowed!`; in every one where she has 24, her `slow` is 0. With Ann alone at (1, 1), `slow` 3, at time 0: her `move(1, 0)` advanced by 50 gives `ready` 450 and `slow` 2; then her `attack(1, 0)` advanced to time 450 gives `ready` 1150 and `slow` 1; then a `wait()` advanced to 1150 gives `ready` 1350 and `slow` still 1.

## Intrinsic - held:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24 of 24) at (2, 1) and a `skeleton` (attack 4, `ready` 0) at (3, 1): `advance(w, 50)` gives Ann `held` 350 (whether the skeleton hit or missed) and the skeleton `ready` 650, `facing` `left`, `last` `{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 1}`. Ann then intends `move(-1, 0)`: after `advance`s by 50 up to time 300 she is still at (2, 1), her `pending` `move(-1, 0)`; at time 350 she is at (1, 1). Instead, at time 100, an `attack(1, 0)` fires at once (her `ready` 450 and the skeleton's `held` 400). A held skeleton (`held` 1000, `ready` 0) at (4, 1) with Ann at (1, 1) does not step at time 50, and its `ready` is 1000.

## Intrinsic - monsters-act:
In a world on `['#########', '#.......#', '#########']` with `Ann` at (1, 1) and a `skeleton` at (4, 1) of `ready` 0: after `advance(w, 50)` the skeleton is at (3, 1) and its `ready` 450; after more `advance`s by 50 up to time 400 it is still there, and at time 450 it is at (2, 1). With `Bob` also there, at (6, 1), the skeleton's first step is to (5, 1) (Bob is the nearer).

## Intrinsic - groups:
In a world on `['#########', '#.......#', '#########']` with `Ann` at (7, 1), a `demon` (attack 6, `ready` 0) at (2, 1) and a `bat` (5 hit points, `ready` 10000) at (3, 1): `advance(w, 50)` leaves the demon at (2, 1) with `ready` 650 and `last` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 1}`, and the bat, if it is still there, with `held` 350; the log's last line names the demon and the bat (`The demon hits the bat for <n>.`, `Critical! The demon hits the bat for <n>.`, `The demon misses the bat.` or `The bat is slain.`). With an `imp` (`ready` 10000) at (2, 1), a `worm` (`ready` 0) at (4, 1) and Ann at (7, 1): the worm flees to (5, 1). A `skeleton` (`ready` 0) at (2, 1) next to a `bat` at (3, 1), with Ann at (7, 1), steps nowhere and attacks nothing (the bat is a friend): it stays at (2, 1), the bat untouched.

## Intrinsic - dies:
In a world on `['#########', '#.......#', '#########']` with `Ann` at 1 of 24 hit points, defense 0, at (1, 1), `Bob` at (7, 1), and a `demon` (attack 6, `ready` 0) at (2, 1): for `rng` from 0 to 39, after `advance(w, 50)` in at least one Ann is not alive, at 0 hit points, Bob is alive, and the depth is still 1. `intend` for a hero not alive answers the same world.

## Intrinsic - wipe:
In a world on `['#####', '#...#', '#####']` with the one hero `Ann` at 1 of 24 hit points, defense 0, at (1, 1), a `demon` (attack 6, `ready` 0) at (2, 1), gold 3, and `entry` `save.of({seed: 1, depth: 1, players: [{name: 'Ann', stats: 24/24/4/1}]})`: for `rng` from 0 to 39, in at least one `advance(w, 50)` answers a world at depth 1 on a 48 by 32 grid (`newGame(1)`'s), with `Ann` alive at 24 of 24, time 50, gold 3, and the log's last line `The party has fallen. Level 1 begins again.`

## Intrinsic - descends:
In a world on `['##########', '#.>......#', '##########']` at depth 1 with `Ann` (20 of 24) at (7, 1) and `Bob` not alive (0 of 24) at (1, 1): `advance(w, 50)` is still at depth 1 (nobody asked). `advance(intend(w, 'Ann', descend()), 50)` is at depth 2, its grid 48 by 32, Ann alive at 24 of 28, Bob alive at 1 of 28, both on open cells, `explored` holding nothing that isn't `visible`, `entry` the save of depth 2 with those two, and the log's last line `The party descends to level 2.` With Ann at (8, 1) instead (6 from the stairs): still depth 1, and the log's last line `All party members must be within 5 units of the exit!`. With Bob alive (24 of 24) at (1, 1) and Ann at (8, 1), Bob's `descend()` gives that same line and depth 1. At depth 5, within 5, after a `descend()`: depth 6, the log's last two lines `The party descends to a shop.` and `A shop! Bump a ware twice to buy it.` At depth 6: depth 7, the last two lines `The party descends into a lair.` and `A golem guards the way down. Pull the levers to weaken it!`. At depth 13: depth 14, the last two lines `The party descends into a lair.` and `A great serpent guards the way down!`. At depth 14: depth 15, the last line `The party descends to level 11.` At depth 33, within 5, after a `descend()`: the state is `won`, the log's last line `The party escapes the dungeon with <gold> gold!`, and a later `advance` changes only `time`.

## Intrinsic - shop:
`w = fromSave(save.of({seed: 4, depth: 6, players: [{name: 'Ann', stats: 24/24/4/1}]}))`: depth 6, its grid `at(31, 19)` `stairs` and `at(14, 10)` `floor`, no monsters, and six items, every one with a `price` above 0, on the plan's first six spots ((15, 13), (17, 13), (19, 13), (21, 13), (23, 13) and (25, 13)), the first two each a `cheese`, `bread` or `meat`, every one of a kind other than `gold` and `lever`, and every sword or armor of the grades `sword`, `sword-2`, `armor` or `armor-2`; each price within its kind's range at round 1 (the ISD's table: a `cheese` 4 to 8, a `bread` 7 to 13, a `meat` 12 to 20, a `potion` 24 to 36, a `sword` 24 to 36, an `armor` 34 to 46, a `ring` or `necklace` 29 to 41); `visible.count()` and `explored.count()` 1536. At depth 13, 9 wares (on the first nine spots); at depth 20, 12; at depth 27, 18 (every spot), each price within its kind's range at round 4 (a `potion` 53 to 65, a `cheese` 10 to 14). Over the seeds 0 to 19 at depth 6, the wares after the first two are of at least four different kinds (they are drawn, not fixed).


## Intrinsic - buys:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24/24/4/1) at (1, 1), gold 50, and a `sword` ware of `id` 12 and `price` 30 at (2, 1): `advance(intend(w, 'Ann', move(1, 0)), 50)` leaves Ann at (1, 1) with `offer` 12, `ready` 400, `facing` `right`, `last` `null` (as it was), `gesture` `{kind: 'use', at: 50}`, the ware still there, gold 50, and the log's last line `Ann looks at a sword: 30 gold. Bump it again to buy.` Then her `move(1, 0)` again, advanced by 350 (time 400): her `attack` is 5, `offer` null, `gesture` `{kind: 'power', at: 400}`, the ware gone, gold 20, the log's last line `Ann buys a sword for 30 gold.` With gold 10 instead, the second bump leaves the ware there, gold 10, `offer` null, and the line `Not enough gold for a sword: 30 needed, the party has 10.` With a `wait()` fired between the two bumps, the second is a first again (`offer` 12, the ware there, gold 50); a `face(1, 0)` between them changes nothing (the second still buys). An `attack(1, 0)` bumps as the `move` does. An `armor` ware bought gives `defense` 2; a `potion` ware, with Ann at 10 of 24, `hp` 15 and `maxHp` 29; a `bread` ware (price 10), with Ann at 10 of 24, `hp` 16 and the line `Ann buys bread for 10 gold.`; a `ring` ware (price 35) bought, with gold 50, gives `magicPower` 2 and the line `Ann buys a ring for 35 gold.`; a `necklace` ware, `magicResist` 1 and `Ann buys a cross necklace for 35 gold.` With Ann's `attack` 8, a bump of the `sword` ware leaves her `offer` `null`, gold 50, the ware there, and the line `Ann: your attack is too high for a sword.`; a second bump the same.

## Intrinsic - limits:
In the `latency` world with Ann (24/24/8/4) at (1, 1) and a `sword` (not a ware) at (2, 1): her `move(1, 0)` advanced by 50 leaves her at (2, 1), `attack` 8, the sword still at (2, 1), `gesture` `null`, and the log's last line `Ann: your attack is too high for a sword. Use it (e) to trade it for gold.` Then her `use()` advanced to her `ready` (time 250): the sword is gone, the party's gold is from 1 to 10 more, the line `Ann trades a sword for <g> gold.` (`<g>` that gain), her `gesture` `{kind: 'use', at: 250}`; for `rng` from 0 to 39, the gains are each from 1 to 10 and at least two differ. With a `sword-2` instead (limit 12), the move picks it up: `attack` 9, the line `Ann picks up a fine sword (+1 attack).` An `armor` with her `defense` 4: stays, the line `Ann: your defense is too high for armor. Use it (e) to trade it for gold.`; an `armor-2`: `defense` 5, `Ann puts on chainmail (+1 defense).`; an `armor-4` with `defense` 23: 24 (`Ann puts on jade mail (+1 defense).`), with `defense` 24: it stays. Her `use()` with nothing under her: no gold, nothing traded.


## Intrinsic - lair:
`w = fromSave(save.of({seed: 4, depth: 7, players: [{name: 'Ann', stats: 24/24/4/1}]}))`: depth 7, Ann at (8, 16), the grid `at(33, 16)` `floor` (no stairs anywhere); 73 monsters: the first a `golem` at (32, 15), `size` 3, `mode` `dormant`, stats deep equal to `{hp: 40, maxHp: 40, attack: 12, defense: 12, range: 1, magic: 6, magicPower: 2, magicResist: 0}`, `facing` `left`; the other 72 each a `slime` of `mode` `guard` and stats 6/6/2/1 (`range` 1, `magic` 0, `magicPower` 1, `magicResist` 0), on the plan's 72 spots; 3 items, each a `lever` not `pulled`, on (39, 7), (39, 25) and (39, 16) (behind the golem). `fromSave` at depth 14: one monster, a `serpent` at (32, 15), `size` 3, `mode` `dormant`, `facing` `left`, stats deep equal to `{hp: 60, maxHp: 60, attack: 10, defense: 6, range: 1, magic: 0, magicPower: 1, magicResist: 0}`; no items; `at(33, 16)` `floor`. `fromSave` at depth 21: one monster, a `reaper` at (32, 15), `size` 2, `mode` `dormant`, stats deep equal to `{hp: 90, maxHp: 90, attack: 14, defense: 8, range: 1, magic: 4, magicPower: 2, magicResist: 0}`; no items; `at(33, 16)` `floor`. `fromSave` at depth 28: no monsters, no items, `at(33, 16)` `stairs`.

## Intrinsic - levers:
In a world on `['##########', '#........#', '#........#', '#........#', '#........#', '##########']` with `Ann` (24/24/4/1) at (1, 1), `lever`s (ids 20, 21, 22) at (2, 1), (1, 2) and (2, 2), and a `golem` (id 10, stats 40/40/12/12 with `magic` 6 and `magicPower` 2, `size` 3, `mode` `dormant`, `ready` 10000) at (5, 2): Ann's `move(1, 0)` advanced by 50 leaves her at (1, 1), `ready` 400, `last` `null` (as it was), `gesture` `{kind: 'use', at: 50}`, the lever (2, 1) `pulled`, the golem's `attack` 6, `defense` 6, `magic` 3, `size` 2, `small` false, and the log's last line `Ann pulls a lever. The golem weakens!`. Then her `move(0, 1)` at time 400: the golem's `attack` 3, `defense` 3, `magic` 1, `size` 1; then her `move(1, 1)` at time 750: `attack` 1, `defense` 1, `magic` 0, `size` 1, `small` true, `pos` still (5, 2), `magicPower` still 2. A pulled lever bumped again changes nothing but Ann's `ready`, `aim`, `facing` and `gesture` (`{kind: 'use', at}` again). Ann never stands on a lever.

## Intrinsic - wakes:
In a world on `['##########', '#........#', '#........#', '#........#', '##########']` with `Ann` at (1, 1) and a `golem` (stats 40/40/12/12, `magic` 6, `magicPower` 2, `size` 3, `mode` `dormant`, `ready` 0) at (5, 1): `advance(w, 50)` gives the golem `mode` `roam` and `ready` 1650, the log holding `The golem awakens!`, and the golem at (4, 1). With the golem at (6, 1) (5 away): it stays `dormant` at (6, 1), `ready` 1650.

## Intrinsic - golem-dies:
`w` the `lair` world, with Ann's stats 24/24/40/1 and her at (31, 16), and the golem's `hp` 1, `defense` 0 and `ready` 10000: for `rng` from 0 to 39, Ann's `move(1, 0)` advanced by 50, in at least one: no monster left (the golem and every guard gone), `at(33, 16)` `stairs`, the log holding `The golem is slain.`, `The guardians crumble.`, `The way down opens!` and `Gold spills from the golem!`; from 1 to 5 new `gold` items, of amounts adding up to 25 to 75, each on a `floor` cell from 1 to 2 cells (`max(|dx|, |dy|)`) outside the golem's 3 by 3 square at (32, 15), no two on one cell, each `flung` `{x: 33, y: 16, at: 50}`. Ann's `descend()` then takes the party to depth 8.

## Intrinsic - serpent-dies:
`w` the depth-14 world of `lair` (`fromSave` of Ann at depth 14), with Ann's stats 24/24/60/1 and her at (31, 16), and the serpent's `hp` 1, `defense` 0 and `ready` 10000: for `rng` from 0 to 39, Ann's `move(1, 0)` advanced by 50, in at least one: no monster left, `at(33, 16)` `stairs`, the log holding `The serpent is slain.`, `The way down opens!` and `Gold spills from the serpent!` and not `The guardians crumble.`; from 1 to 5 new `gold` items, of amounts adding up to 50 to 150, each `flung` `{x: 33, y: 16, at: 50}`. Ann's `descend()` then takes the party to depth 15.

## Intrinsic - golem-gold:
`w` the `lair` world, with Ann's stats 24/24/40/1 and her at (19, 10), and the golem moved and shrunk: `pos` (20, 10), `size` 1, `small` true, `hp` 1, `defense` 0, `ready` 10000: for `rng` from 0 to 39, Ann's `move(1, 0)` advanced by 50, in at least one the golem is gone and: from 1 to 5 new `gold` items, of amounts adding up to 25 to 75, each on a `floor` cell at a distance (`max(|dx|, |dy|)`) of 1 or 2 from (20, 10), none on (19, 10) (Ann's cell), no two on one cell, each `flung` `{x: 20, y: 10, at: 50}`; none of them within 2 of the plan's `boss` square (`x` 32 to 34, `y` 15 to 17); `at(33, 16)` is `stairs`. With the golem of `size` 2 (not `small`) at (20, 10) and Ann at (19, 10): each gold within 1 or 2 of the square `x` 20 to 21, `y` 10 to 11 and outside it, `flung` from (21, 11).

## Intrinsic - cleaves:
In a world on `['##########', '#........#', '#........#', '#........#', '#........#', '##########']` with a `golem` (`mode` `roam`, `size` 3, stats 40/40/12/12, `magic` 6, `magicPower` 2, `ready` 0) at (2, 1) (covering `x` 2 to 4, `y` 1 to 3), `Ann` at (5, 2) (next to it), `Bob` at (6, 3) (in the 3 by 2 block, `x` 5 to 6, `y` 1 to 3) and `Cy` at (7, 2) (three deep: outside it), each 24/24/4/1: for `rng` from 0 to 39, `advance(w, 50)` leaves the golem at (2, 1) with `ready` 1050 and `last` `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 1}`, Ann's and Bob's `held` 350 (each struck, hit or missed), Cy's `held` 0 and hit points 24; the log's last two lines are about Ann, then Bob (each `The golem hits <h> for <n>.`, `Critical! The golem hits <h> for <n>.`, `The golem misses <h>.` or `<h> falls.`); the world's `rng` is `(rng + 4 * 0x6D2B79F5) >>> 0`. With the golem of `size` 2 at (2, 1) (covering `x` 2 to 3, `y` 1 to 2), Ann at (4, 1) and Bob at (5, 1): Ann's `held` 350 and Bob's 0 (the block is 2 by 1: `x` 4, `y` 1 to 2). With a guard `slime` (a friend of the golem: both are not heroes and neither is a demon) at (5, 1) beside Ann at (5, 2) in the first world, the slime is untouched.

## Intrinsic - guards:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24/24/4/1) at (2, 1) and a guard `slime` (`mode` `guard`, stats 6/6/2/1, `ready` 0) at (3, 1): `advance(w, 50)` (time 50, `turn` 0) leaves the slime at (3, 1) with `ready` 650, `facing` `left` and `last` `{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 1}`, Ann's `held` 350 (hit or missed), and the log's last line one of `The slime hits Ann for <n>.`, `Critical! The slime hits Ann for <n>.`, `Ann falls.` or `The slime misses Ann.`. With Ann at (1, 1) instead (2 away), the slime stays at (3, 1) with `ready` 450 and `last` `null`, and Ann's `held` is 0.

## Intrinsic - misses:
In a world on `['######', '#....#', '######']` with `Ann` (24/24/4/1) at (1, 1) and a `skeleton` of stats 30/30/4/2 (`ready` 10000) at (2, 1): for `rng` from 0 to 39, Ann's `attack(1, 0)` advanced by 50 leaves the log's last line, in every one, either `Ann misses the skeleton.` with the skeleton at 30 hit points, or `Ann hits the skeleton for <n>.` with `<n>` at least 1 and the skeleton at `30 - <n>`, or `Critical! Ann hits the skeleton for <n>.` likewise; at least one of the 40 is a miss and at least one a hit; no line ends `for 0.`. With the skeleton (`ready` 0) attacking Ann instead (Ann's `ready` 10000), every last line is `The skeleton misses Ann.`, `The skeleton hits Ann for <n>.` or `Critical! The skeleton hits Ann for <n>.` with `<n>` at least 1 and Ann at `24 - <n>`.

## Intrinsic - rolls-advance:
Every attack takes its two draws from the world's `rng` and stores the state they leave in the world answered, so the next attack rolls anew. In the `misses` world (Ann 24/24/4/1 at (1, 1), the skeleton 30/30/4/2, `ready` 10000, at (2, 1)), for `rng` from 0 to 39: after Ann's `attack(1, 0)` advanced by 50, the world's `rng` is `(rng + 2 * 0x6D2B79F5) >>> 0`. From `rng` 0, Ann attacking 20 times in a row (each `attack(1, 0)` advanced to her `ready`, the skeleton's hit points set back to 30 before each) logs at least one miss and at least one hit.

## Intrinsic - magic:
In a world on `['######', '#....#', '######']` with `Ann` (24/24/4/1) at (1, 1) and a `golem` of `size` 1, `mode` `roam`, stats 40/40/12/12 with `magic` 6 and `magicPower` 2, `ready` 0, at (2, 1): for `rng` from 0 to 39, after `advance(w, 50)` Ann has 24 hit points (a miss), 7 (a hit: 11 physical and 6 magic), or none and not alive (a critical: 28); at least one is 7. With Ann's `magicResist` 1 instead (ward chance 50%): her hit points after a hit are 7 (the magic not warded) or 12 (warded: 11 and 1); among the 40, at least one 7 and at least one 12.

## Intrinsic - themes:
`fromSave(save.of({seed: 3, depth: 8, players: [{name: 'Ann', stats: 24/24/4/1}]}))` has 4 monsters. Over the seeds 0 to 19 at depth 8 (level 6), every monster is a `blue-slime` (9/9/3/1), `blue-spider` (10/10/4/1), `archer` (10/10/4/1, `range` 4), `swordsman` (16/16/6/2), `snowman` (7/7/0/0: `attack` 0, the tier adds none; `magic` 1, `range` 4), `mage` (12/12/3/1, `magic` 4) or `snow-skeleton` (16/16/6/2); never a `wolf-man`, a plain `skeleton` or a `blue-snake`. Over the seeds 0 to 19 at depths 9 to 12 (levels 7 to 10), every monster is of those kinds or a `wolf-man` (21/21/6/2), at least one is a `wolf-man`, at least one a `snow-skeleton`, at least one a `snowman` and at least one a `mage`; the mages are from a tenth to two fifths of them all. At depth 15, 4 monsters, each a `beetle` (16/16/6/9: base defense 8), `mummy` or `cultist`, every `cultist` of `range` 4 and `magic` 8 (`magicPower` 1). Over the seeds 0 to 19 at depth 22, every monster is a `spider`, `ghost`, `scarecrow` (`attack` 0) or `pumpkin` (`size` 2, `attack` 0, its 2 by 2 square all `floor`), at least one a `scarecrow` and at least one a `pumpkin`; never a `reaper`. At depth 33, 12 monsters, each an `imp` of 36/36/10/5, a `demon` of 48/48/11/6 or a `beholder` of 60/60/10/6 (`range` 5, `magic` 6); never a `worm` or `fire-slime`. At depths 1 and 2, over the seeds 0 to 19, every monster is a `bat` of 3/3/2/0, a `slime` of 6/6/2/1 or a `snake` of 5/5/3/0. At depth 3, every monster is one of those or a `swordsman` (11/11/5/2), the swordsmen at most a fifth of them all over the seeds 0 to 19. Over the seeds 0 to 19 at depth 4, every monster is a `bat`, `slime`, `snake`, `skeleton` (9/9/4/2), `archer`, `swordsman` or `mage`; at depth 5 the same with a `blue-spider` (7/7/3/1) in place of the `snake`. Over those seeds at depths 4 and 5 together, at least one monster is an `archer` and at least one a `mage`, and each of the archers, the swordsmen and the mages is at most a fifth of them all.

## Intrinsic - pushes:
In a world on `['########', '#......#', '########']` with `Ann` (24/24/4/1) at (3, 1) and a `beetle` (stats 8/8/4/8, `ready` 0) at (2, 1): for `rng` from 0 to 39, `advance(w, 50)` leaves the beetle's `ready` 1250 (its `strike` 1200); in every one where Ann has fewer than 24 hit points and is alive she is at (4, 1) (pushed), in every one where she has 24 she is at (3, 1); at least one of each. With a `bat` (`ready` 10000) at (4, 1), Ann stays at (3, 1) in every one.

## Intrinsic - curses:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24/24/4/1) at (2, 1) and a `mummy` (12/12/5/2, `ready` 0) at (3, 1): for `rng` from 0 to 39, in every one where `advance(w, 50)` leaves Ann alive with fewer than 24 hit points, her `curse` is 3 and the log holds `Ann is cursed!`; at least one such. With Ann alone at (1, 1), 10 of 24, `curse` 3, `ready` 0: her `move(1, 0)` advanced by 50 leaves her at (2, 1) with `hp` 9 and `curse` 2; then a `wait()` advanced to her `ready` (250) `hp` 8 and `curse` 1; a `face(0, 1)` then changes neither. With Ann at 1 hit point and `curse` 1, and `Bob` (24/24/4/1) alive at (5, 1) (so the party isn't wiped), her `move(1, 0)` advanced by 50 leaves her not alive at (1, 1), the log's last line `Ann falls.`

## Intrinsic - enrages:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24/24/9/1) at (1, 1) and a `wolf-man` (14/14/5/2, `ready` 10000) at (2, 1): for `rng` from 0 to 39, after Ann's `attack(1, 0)` advanced by 50, in every one where the monster of id 10 is still there with 7 hit points (a hit of 7), its `kind` is `enraged-wolf-man` and the log holds `The wolf-man is enraged!`; at least one such; where it has 14, it is still a `wolf-man`. With Ann's attack 5 instead (hits of 3), it is a `wolf-man` in every one. An `enraged-wolf-man` (14/14/5/2, `ready` 0) at (4, 1) with Ann at (1, 1): `advance(w, 50)` steps it to (3, 1) with `ready` 250.

## Intrinsic - hastes:
In a world on `['#########', '#.......#', '#########']` with `Ann` at (1, 1) and a `skeleton` of `ready` 0 and `haste` 2 at (4, 1): `advance(w, 50)` steps it to (3, 1) with `ready` 250 (half its 400) and `haste` 1. With `haste` 0, its `ready` is 450.

## Intrinsic - chants:
In a world on `['############', '#..........#', '############']` with `Ann` at (1, 1), a `cultist` (7/7/5/1, `range` 4, `magic` 8, `ready` 0) at (8, 1) and a `skeleton` (`ready` 10000) at (10, 1): `advance(w, 50)` leaves the cultist at (8, 1) with `chant` `{kind: 'haste', at: 50, until: 1250}` and `ready` 1250, Ann at 24 hit points, and the log's last line `The cultist begins to chant.` Advanced on to time 1250 (by 600 twice), the cultist's `chant` is `null`, its `haste` 3 and the skeleton's 3, the cultist's `ready` 1650, and the log holds `The cultist's chant quickens the monsters!`. With the skeleton's `haste` 1 at the start, or with no skeleton, the cultist's `chant` stays `null` after `advance(w, 50)` and it doesn't stay at (8, 1).

## Intrinsic - summons:
In a world on `['############', '#..........#', '#..........#', '#..........#', '############']` with `Ann` at (1, 2) and a `scarecrow` (10/10/0/2, `ready` 0) at (8, 2): `advance(w, 50)` leaves its `chant` `{kind: 'summon', at: 50, until: 2050}`, `ready` 2050, the log's last line `The scarecrow begins to chant.` Advanced on to time 2050 (by 1000 twice): three new `swarm`s of 3/3/4/0 (`magic` 2), at (7, 1), (8, 1) and (9, 1), each `ready` 2130; the scarecrow at (8, 2), `chant` `null`, `cooldown` 5250, `ready` 2450, and the log holds `The scarecrow calls a swarm!`. With three `swarm`s (`ready` 10000) at (8, 1), (9, 1) and (10, 1) from the start, it doesn't chant: `chant` `null`, `ready` 450.

## Intrinsic - splits:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24/24/40/1) at (1, 1) and a `swarm` (3/3/4/0, `magic` 2, `ready` 10000) at (2, 1): for `rng` from 0 to 39, in every one where Ann's `attack(1, 0)` advanced by 50 hits, the swarm (id 10) has 2 hit points and a new `swarm` of `hp` 1 and `maxHp` 3 stands at (3, 1); at least one such. With the swarm at 1 hit point, in every one where it is hit it is gone and no swarm is left.

## Intrinsic - explodes:
In a world on `['#########', '#.......#', '#.......#', '#.......#', '#########']` with `Ann` at (1, 1) and a `pumpkin` (12/12/0/1, `size` 2, `ready` 0) at (3, 2): `advance(w, 50)` gives it `fuse` `{at: 50}` and the log holds `The pumpkin's fuse is lit!`; it never attacks. In the same grid at time 4790 with the pumpkin (`fuse` `{at: 0}`, `ready` 4800) at (4, 1), `Ann` (30/30/4/1) at (2, 1), `Bob` (24/24/4/1) at (7, 3), a `skeleton` (9/9/4/2, `ready` 10000) at (4, 3) and a `bat` (`ready` 10000) at (1, 3): `advance(w, 50)` removes the pumpkin, gives `effects` `[{kind: 'blast', x: 4, y: 1, size: 2, at: 4840}]`, leaves Ann at 5 hit points, Bob not alive, the skeleton gone and the bat untouched, and the log holds `The pumpkin explodes!`, `The blast hits Ann for 25.`, `Bob falls.` and `The skeleton is slain.` Advanced by 1000 more the `effects` still hold the blast; by 1 more, `effects` is `[]`.

## Intrinsic - reaper-dies:
`fromSave` of Ann at depth 21, with Ann's stats 24/24/99/1 at (31, 16) and the reaper's `hp` 1, `defense` 0, `ready` 10000: for `rng` from 0 to 39, in at least one, Ann's `move(1, 0)` advanced by 50 leaves no monster, `at(33, 16)` `stairs`, the log holding `The reaper is slain.` and `Gold spills from the reaper!`, and from 1 to 5 new `gold` items adding up to 75 to 225.

## Intrinsic - floor-items:
Over the seeds 0 to 19 at depths 1 to 5: each floor has exactly 2 `gold` and exactly 2 food items (`cheese`, `bread` or `meat`); at most 1 `potion`, and the floors with one are at most half; a sword of some grade on stages 2 and 4 alone and an armor on stages 3 and 5 alone, each of grade 1 (`sword`, `armor`). At depths 8 to 12, the swords and armors are each of grade 1 or 2, and over those seeds at least one of each grade 2 (`sword-2`, `armor-2`); at depths 29 to 33, of grades 1 to 4. Every item's `price` is 0.


## Intrinsic - saves:
`toSave` of the `descends` world is `{seed, depth: 1, players: [Ann at 20 of 24, Bob at 1 of 24]}`. For `s = save.of({seed: 9, depth: 3, players: [{name: 'Cy', stats: 10/30/6/2}]})`, `fromSave(s)` is at depth 3, time 0, state `playing`, on a 48 by 32 grid, with the one hero `Cy` alive at those stats on an open cell, its `entry` deep equal to `s`; `fromSave(s)` twice gives deep-equal worlds; a player saved at 0 hit points comes back at 1.

## Intrinsic - attacked-first:
In a world on `['#######', '#.....#', '#######']` with `Ann` (24/24/4/1) at (2, 1), `ready` 0, and a `skeleton` (9/9/4/2, `ready` 0) at (3, 1): `advance(intend(w, 'Ann', move(-1, 0)), 50)` leaves Ann at (2, 1), her `held` 350, her `pending` `move(-1, 0)`, and the skeleton's `last` `{kind: 'attack', dx: -1, dy: 0, at: 50, reach: 1}`; advanced by 50 at a time, she is still at (2, 1) at time 300 and at (1, 1) at time 350 (her `ready` 550). With no skeleton, the same `advance` puts her at (1, 1) at once (time 50, `ready` 250).

## Intrinsic - turns-to-quickest:
In a world on `['#####', '#...#', '#...#', '#...#', '#####']` with `Ann` (24/24/4/1) at (2, 2), `aim` `{dx: 1, dy: 0}`, a `skeleton` (`ready` 10000) at (2, 1) and a `bat` (`ready` 10000) at (1, 3): Ann's `attack()` advanced by 50 leaves her `aim` `{dx: -1, dy: 1}`, `facing` `left` and `last` `{kind: 'attack', dx: -1, dy: 1, at: 50, reach: 1}` (the bat strikes in 200, the skeleton in 600). With the bat left out: `aim` `{dx: 0, dy: -1}`. With the bat's `slow` 3 (400) and the skeleton's `haste` 1 (300): toward the skeleton, `(0, -1)`. With two skeletons, at (3, 2) and (2, 3): `(1, 0)` (right before down). With no monster: `aim` stays `{dx: 1, dy: 0}` and `last` is `{kind: 'attack', dx: 1, dy: 0, at: 50, reach: 1}`. A spider `aloft` at (2, 1) is never turned to.

## Intrinsic - leaps:
In a world on `['##########', '#........#', '#........#', '##########']` with `Ann` (24/24/4/1) at (1, 1) and a `spider` (9/9/5/1, `ready` 0, `id` 10) at (6, 1), advanced by 50 at a time: at time 50 the spider's `air` is `{phase: 'crouch', at: 50}` and its `ready` 300; at 300 `{phase: 'rise', at: 300}`; at 550 its phase is `aloft` (`at` 550); by time 4000 its `air` has been `{phase: 'drop', at: T}` at some time `T`, on a cell next to (1, 1) that isn't Ann's, and then `null` from `T + 150` on, with `cooldown` `T + 150 + 3000`; Ann's hit points stay 24 at every time before `T + 150` (no attack from the air). A `spider` with `air` `{phase: 'aloft', at: 0}` (`ready` 10000) at (2, 1): Ann's `attack(1, 0)` advanced by 50 leaves its hit points as they were, and Ann's `move(1, 0)` puts her on (2, 1) (it blocks nothing). Two spiders aloft, `id` 10 at (2, 1) (`ready` 0, next to Ann: poised) and `id` 11 at (7, 2) (`ready` 10000, not poised, 5 away): at time 50 spider 10 is still `aloft`, its `ready` 100; with spider 11's `air` `null` instead (on the ground), spider 10's `air` at time 50 is `{phase: 'drop', at: 50}`, its `ready` 200.

## Intrinsic - webs:
In a world on `['#########', '#.......#', '#########']` with `Ann` (24/24/4/1) at (1, 1) and a `spider` (3/9/5/1, `ready` 0) at (3, 1) (a third of its hit points: it flees): `advance(w, 50)` has the spider at (4, 1), a `web` item at (3, 1) and the spider's `ready` 150 (a third of 300), its `air` `null`. With Ann at (1, 1), a `web` at (2, 1) and no monster: her `move(1, 0)` advanced by 50 puts her at (2, 1), no item left, her `slow` 1, the log's last line `Ann is caught in a web!`; her next `move(1, 0)`, advanced to 250, gives `ready` 650 and `slow` 0. Instead, her `attack(1, 0)` (or `attack()` with her `aim` `(1, 0)`) advanced by 50 removes the web, leaves her at (1, 1) with `slow` 0 and `ready` 400, and the log's last line `Ann tears a web.`

## Intrinsic - lunges:
In a world on `['#########', '#.......#', '#########']` with `Ann` (24/24/4/1) at (1, 1) and a `snake` (5/5/3/0, `ready` 0, `id` 10) at (4, 1): `advance(w, 50)` has the snake at (2, 1), its `last` `{kind: 'lunge', dx: -1, dy: 0, at: 50, reach: 2}`, `facing` `left`, `ready` 200 and `cooldown` 2050, and Ann's `held` 0 and hit points 24; at time 200 the snake's `last` is an `attack` at 200 (it strikes on landing). With a `bat` (`ready` 10000) at (3, 1), or the snake's `cooldown` 5000, or the snake at (5, 1) (4 away), its `last` after `advance(w, 50)` is not a `lunge`.

## Intrinsic - slime-splits:
In a world on `['#######', '#.....#', '#.....#', '#######']` with `Ann` (24/24/40/1) at (1, 1) and a `slime` (1/6/2/1, `ready` 10000, `id` 10) at (2, 1): for `rng` from 0 to 39, in every one where Ann's `attack(1, 0)` advanced by 50 slays it, either no monster is left, or exactly two `slime`s, each of `hp` 1, `maxHp` 1, `attack` 2, `mode` `roam`, `ready` 450, `flung` `{x: 2, y: 1, at: 50}`, on two different open cells within 2 of (2, 1), neither Ann's, with `The slime splits!` in the log; over those `rng`, each happens at least once. A `slime` of 1/1/2/1 slain never splits; nor a `slime` of `mode` `guard`.

## Intrinsic - spikes:
In a world on `['#######', '#.....#', '#######']` at depth 1 with `spikes` `[{x: 2, y: 1, shift: 0}]` and `Ann` (24/24/4/1) at (2, 1): advanced by 50 at a time, Ann has 24 hit points at time 1950 and 21 at 2000, the log's last line `The spikes hit Ann for 3.`, and 21 still at 4350, 18 at 4400. With `shift` 1, she has 21 at 1600. At depth 8 (tier 1), 17 at 2000. With Ann at (1, 1) instead, at time 2000, her `move(1, 0)` advanced by 50 puts her on (2, 1) with 21 (stepping onto a raised spike). A `skeleton` (9/9/4/2, `ready` 10000) on (2, 1) at depth 1 has 7 at 2000; a `spider` there `aloft` keeps its hit points. `fromSave` of depth 2 for the seeds 0 to 4 has at least 4 `spikes`, each on a `floor` cell; of depth 1, 6 or 7, none.

## Intrinsic - roams:
In a world on `['######################', '#....................#', '######################']` with `Ann` (24/24/4/1) at (1, 1) and a `bat` (3/3/2/0, `ready` 0, `id` 10) at (15, 1) (14 away: out of its reach of 9): `advance(w, 50)` has the bat at (16, 1) (it roams: heading down, not free; right first of the free steps) and its `ready` 183, not waiting.

## Intrinsic - refuses:
`newGame(-1)`, `newGame(2.5)`, `advance(w, 0)`, `advance(w, 1.5)`, `advance(w, 1001)`, `intend(w, 'Ann', {kind: 'wait'})` (a plain object, not an `intent`), `join(w, 5)`, `fromSave({})` and `advance({}, 50)` throw a `TypeError`.
