# bestiary

What each kind of monster is: its **group**, its base stats before the
floor's tier, how far it shoots, whether its hits slow, how far it
hunts, how fast it acts and how big it is. Pure data and two small
functions; nothing here changes.

**Groups.** Every creature belongs to one group: `human`, `undead`,
`vermin`, `demon` or `construct`. A hero (actor kind `hero`) is
`human`. Two creatures are **hostile** to each other when exactly one of
them is a hero, or when one is a `demon` and the other `vermin` (demons
hunt vermin, and vermin fight back); any other two are **friends** (a
ranged attack passes through friends). A `vermin` **flees** a `demon`.

| kind | group | hp | attack | defense | magic | magicPower | range | slows | reach | step | strike | size |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `bat` | `vermin` | 3 | 2 | 0 | 0 | 1 | 1 | no | 9 | 400 | 600 | 1 |
| `slime` | `vermin` | 6 | 2 | 1 | 0 | 1 | 1 | no | 6 | 400 | 600 | 1 |
| `snake` | `vermin` | 5 | 3 | 0 | 0 | 1 | 1 | no | 6 | 400 | 600 | 1 |
| `skeleton` | `undead` | 9 | 4 | 2 | 0 | 1 | 1 | no | 6 | 400 | 600 | 1 |
| `archer` | `undead` | 7 | 3 | 1 | 0 | 1 | 4 | no | 7 | 400 | 700 | 1 |
| `blue-slime` | `vermin` | 6 | 2 | 1 | 0 | 1 | 1 | yes | 6 | 400 | 600 | 1 |
| `blue-snake` | `vermin` | 5 | 3 | 0 | 0 | 1 | 1 | yes | 6 | 400 | 600 | 1 |
| `beetle` | `vermin` | 8 | 4 | 3 | 0 | 1 | 1 | no | 6 | 400 | 600 | 1 |
| `mummy` | `undead` | 12 | 5 | 2 | 0 | 1 | 1 | no | 6 | 600 | 600 | 1 |
| `cultist` | `human` | 7 | 5 | 1 | 0 | 1 | 4 | no | 7 | 400 | 700 | 1 |
| `spider` | `vermin` | 9 | 5 | 1 | 0 | 1 | 1 | no | 8 | 300 | 600 | 1 |
| `ghost` | `undead` | 10 | 6 | 3 | 0 | 1 | 1 | no | 7 | 400 | 600 | 1 |
| `reaper` | `undead` | 14 | 7 | 3 | 0 | 1 | 1 | no | 6 | 400 | 600 | 1 |
| `worm` | `vermin` | 9 | 5 | 2 | 0 | 1 | 1 | no | 6 | 400 | 600 | 1 |
| `fire-slime` | `vermin` | 10 | 5 | 3 | 0 | 1 | 1 | no | 6 | 400 | 600 | 1 |
| `imp` | `demon` | 12 | 6 | 3 | 0 | 1 | 1 | no | 7 | 300 | 600 | 1 |
| `demon` | `demon` | 16 | 7 | 4 | 0 | 1 | 1 | no | 7 | 400 | 600 | 1 |
| `golem` | `construct` | 40 | 12 | 12 | 6 | 2 | 1 | no | 30 | 1600 | 1000 | 3 |

- `hp`, `attack`, `defense`: the base stats (`hp` is also `maxHp`),
  before `rules` adds the floor's tier.
- `magic` and `magicPower`: the magic damage each hit adds, and how hard
  it is to resist (`stats`, `combat`); the tier never changes them. A
  monster's `magicResist` is 0.
- `range`: how many cells away it can attack, in a straight line (1:
  only the cells next to it).
- `slows`: a creature it damages is **slowed** (`rules`).
- `reach`: how far away (in steps, counting a diagonal as one) it
  notices a foe and hunts it.
- `step` and `strike`: its latency in milliseconds after a step and
  after an attack (a wait takes `step`).
- `size`: how many cells square it stands on, before anything shrinks it.

The **slimes** are `slime`, `blue-slime` and `fire-slime` (they act on
every other turn only, `monsters` says).

The module (`shapes/bestiary/index.mjs`) exports:

- `KINDS`: the eighteen kinds, in the table's order (a frozen array).
- `GROUPS`: `['human', 'undead', 'vermin', 'demon', 'construct']` (a
  frozen array).
- `SLIMES`: `['slime', 'blue-slime', 'fire-slime']` (a frozen array).
- `entry(kind)`: the table's row for a kind, a frozen `{kind, group, hp,
  attack, defense, magic, magicPower, range, slows, reach, step, strike,
  size}` (`slows` a
  boolean); a kind not in the table throws a `TypeError`.
- `group(kind)`: the kind's group, and `'human'` for `'hero'`; anything
  else throws a `TypeError`.
- `hostile(a, b)`: whether creatures of the kinds `a` and `b` (each a
  table kind or `'hero'`) are hostile, as above; anything else throws a
  `TypeError`.
- `flees(a, b)`: whether a creature of kind `a` flees one of kind `b`
  (`a` `vermin` and `b` `demon`); refuses as `hostile` does.

# Fields:
## Field - KINDS:
The export `KINDS`.

## Field - GROUPS:
The export `GROUPS`.

## Field - SLIMES:
The export `SLIMES`.

## Field - entry:
The function `entry(kind)`.

## Field - group:
The function `group(kind)`.

## Field - hostile:
The function `hostile(a, b)`.

## Field - flees:
The function `flees(a, b)`.

# Intrinsics:
## Intrinsic - valid:
`KINDS` has 18 kinds, the first `bat` and the last `golem`, and is
frozen. `entry('archer')` is `{kind: 'archer', group: 'undead', hp: 7,
attack: 3, defense: 1, magic: 0, magicPower: 1, range: 4, slows: false,
reach: 7, step: 400, strike: 700, size: 1}` and frozen;
`entry('blue-snake').slows` is true; `entry('golem')` has `size` 3,
`step` 1600, `attack` 12, `defense` 12, `magic` 6 and `magicPower` 2;
`entry('cultist').range` is 4. `group('hero')` is `'human'`,
`group('imp')` `'demon'`, `group('golem')` `'construct'`.
`hostile('hero', 'bat')` and `hostile('skeleton', 'hero')` are true;
`hostile('hero', 'hero')`, `hostile('bat', 'skeleton')` and
`hostile('imp', 'skeleton')` false; `hostile('demon', 'worm')` and
`hostile('fire-slime', 'imp')` true. `flees('worm', 'demon')` is true,
`flees('demon', 'worm')` and `flees('worm', 'hero')` false.
`entry('hero')`, `entry('dragon')`, `group(5)` and `hostile('bat',
'dragon')` throw a `TypeError`.

# Callbacks:
None

# API Shapes:
None
