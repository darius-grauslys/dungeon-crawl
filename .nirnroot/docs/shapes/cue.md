# cue

A sound to play now: which one, and how loud. Immutable.

| name | what it is |
|---|---|
| `step` | a creature stepped |
| `swing` | a creature attacked a cell next to it |
| `shot` | a creature attacked at range |
| `hit` | a creature lost hit points |
| `death` | a monster was slain, or a hero fell |
| `coin` | the party's gold went up |
| `powerup` | a hero took a power-up |
| `use` | a hero used something (a lever, a ware, nothing) |
| `stairs` | the party went down to another floor |
| `hiss` | a fuse was lit |
| `boom` | something exploded |

The module (`shapes/cue/index.mjs`) exports `of({name, gain})`: `name`
one of the table's; `gain` a number above 0 and at most 1, how loud
(1: as loud as the sound is). Any other input is refused with a
`TypeError`. `NAMES` is the table's names, in its order (a frozen
array).

# Fields:
## Field - name:
Property `name`.

## Field - gain:
Property `gain`.

# Intrinsics:
## Intrinsic - valid:
`of({name: 'step', gain: 0.5})` has those values and is frozen; `of({name:
'stairs', gain: 1})` is accepted. `name: 'bang'`, `gain: 0`, `gain:
1.5`, `gain: '1'` and a missing `gain` each throw a `TypeError`. `of({name: 'hiss', gain: 0.5})` and `of({name: 'boom', gain: 1})` are
accepted. `NAMES` is `['step', 'swing', 'shot', 'hit', 'death', 'coin',
'powerup', 'use', 'stairs', 'hiss', 'boom']` and frozen.

# Callbacks:
None

# API Shapes:
None
