# input

The keyboard: which key means which intent or command, and a listener that
turns key presses into them. A held key repeats (the browser's key
repeat): each repeat is one more press. On most keyboards `>` is Shift and `.`:
the browser's `key` is then `'>'`, which is what counts.

**Directions.** Each direction key means a direction:

| keys | direction |
|---|---|
| `ArrowUp`, `w`, `W`, `k`, `K`, `8` | up `(0, -1)` |
| `ArrowDown`, `s`, `S`, `j`, `J`, `2` | down `(0, 1)` |
| `ArrowLeft`, `a`, `A`, `h`, `H`, `4` | left `(-1, 0)` |
| `ArrowRight`, `d`, `D`, `l`, `L`, `6` | right `(1, 0)` |
| `y`, `Y`, `Home`, `7` | up-left `(-1, -1)` |
| `u`, `U`, `PageUp`, `9` | up-right `(1, -1)` |
| `b`, `B`, `End`, `1` | down-left `(-1, 1)` |
| `n`, `N`, `PageDown`, `3` | down-right `(1, 1)` |

A direction key means `move(dx, dy)` without Shift, and `face(dx, dy)`
with Shift (aim that way without moving).

**Chords.** The four orthogonal directions can be pressed together for a
diagonal: while one orthogonal direction key is held down, a press of a
key of the other axis means the diagonal of the two (holding `ArrowUp`,
a press of `ArrowRight` is up-right `(1, -1)`; holding `s`, a press of
`a` is down-left). Only the latest-pressed held key of each axis counts.
A key is held from its `keydown` until its `keyup` (or until the
target's window loses focus: a `blur` event on the target lets go of
every key).

| keys | without Shift | with Shift |
|---|---|---|
| ` ` (space) | `attack()` (toward the aim) | `attack()` |
| `e`, `E` | `use()` | `use()` |
| `>` | `descend()` | `descend()` |

| keys | command |
|---|---|
| `Escape` | `menu` |
| `p`, `P` | `pause` |
| `m`, `M` | `mute` |
| `-`, `_` | `quieter` |
| `=`, `+` | `louder` |
| `z`, `Z` | `explore` |

# API Shapes:
- [shape:intent](../../shapes/intent.md)

# Functions:
## Function - intent-for:
`intentFor(key, shift) -> intent`. The intent of one key alone, without chords: a direction key's `move` (or, with `shift` true, `face`), or the second table's; `null` for any other key (and for anything not a string).

## Function - command-for:
`commandFor(key) -> string`. The last table's command (`menu`, `pause`, `mute`, `quieter`, `louder` or `explore`) for a key; `null` for any other.

## Function - listen:
`listen(target, {intent, command, aiming}) -> function`. Adds a `keydown`, a `keyup` and a `blur` listener to `target` (any `EventTarget`). For a `keydown` with none of `ctrlKey`, `altKey`, `metaKey` true, whose `key` has an intent (as `intentFor(key, shiftKey)`, made diagonal by a chord as above) or a command, it calls `event.preventDefault()` and then `intent(i)` or `command(c)`, once; other events are left alone. A `keyup` (and a `blur`) only lets keys go. **Aiming**: Shift held down means the player is aiming. A `keydown` with `key` `'Shift'` while Shift was not held calls `aiming(true)`; a `keyup` with `key` `'Shift'`, or a `blur`, while it was held calls `aiming(false)`; a repeat of the held Shift calls nothing. `aiming` left out: nothing is called. A Shift `keydown` is not prevented. Answers `stop`, a function that removes the listeners (calling it again does nothing).

# Intrinsics:
## Intrinsic - keys:
Every direction key answers its `move` without Shift and its `face` with Shift (`kind`, `dx`, `dy`): `intentFor('ArrowUp', false)` is `move(0, -1)`, `intentFor('u', false)` `move(1, -1)`, `intentFor('End', true)` `face(-1, 1)`, `intentFor('3', false)` `move(1, 1)`, `intentFor('ArrowLeft', true)` `face(-1, 0)`. `intentFor(' ', false)` and `intentFor(' ', true)` are `attack()` (`dx` and `dy` 0); `intentFor('e', true)` is `use()`; `intentFor('>', true)` and `intentFor('>', false)` are `descend()`; `'.'`, `'x'`, `'Escape'`, `''`, `null` and `5` answer `null`. `commandFor('Escape')` is `menu`, `commandFor('P')` `pause`, `commandFor('m')` `mute`, `commandFor('-')` `quieter`, `commandFor('+')` `louder`, `commandFor('=')` `louder`, `commandFor('z')` and `commandFor('Z')` `explore`, `commandFor('w')` `null`; `intentFor('m', false)` and `intentFor('z', false)` are `null`.

## Intrinsic - listens:
With `stop = listen(t, {intent: f, command: g})` on a fresh `EventTarget` `t`: a cancelable `keydown` with `key` `'ArrowLeft'` calls `f` once with `move(-1, 0)` and is `defaultPrevented`; with `shiftKey` true too, `face(-1, 0)`; one with `key` `' '`, `attack()`; one with `key` `'>'` and `shiftKey` true calls `f` once with `descend()`; one with `key` `'Escape'` calls `g` once with `'menu'`; one with `key` `'z'` calls `g` once with `'explore'` and is `defaultPrevented`; one with `key` `'x'` calls neither and isn't prevented; one with `key` `'w'` and `ctrlKey` true calls neither; a `keyup` with `key` `'w'` calls neither. After `stop()`, a `keydown` with `key` `'w'` calls neither; `stop()` again doesn't throw.

## Intrinsic - aiming:
With `listen(t, {intent: f, command: g, aiming: a})` on a fresh `EventTarget`: a `keydown` with `key` `'Shift'` calls `a` once with `true` (and neither `f` nor `g`, and isn't prevented); another (a repeat) calls nothing; a `keydown` of `ArrowLeft` with `shiftKey` true calls `f` with `face(-1, 0)`; a `keyup` with `key` `'Shift'` calls `a` with `false`; another `keyup` of Shift calls nothing. Shift down again (`a(true)`), then a `blur`: `a(false)`. With no `aiming` handler, a Shift `keydown` throws nothing.

## Intrinsic - chords:
On a fresh `EventTarget` with `listen`: `keydown` `ArrowUp` (calls `f` with `move(0, -1)`), then `keydown` `ArrowRight` without a `keyup` of `ArrowUp`: `f` with `move(1, -1)`; another `keydown` `ArrowRight` (a repeat): `move(1, -1)` again. After `keyup` `ArrowUp`, a `keydown` `ArrowRight` gives `move(1, 0)`. Holding `s`, a `keydown` of `a` with `shiftKey` true gives `face(-1, 1)`. Holding `ArrowUp`, a `keydown` of `ArrowDown` gives `move(0, 1)` (the same axis: the latest counts). Holding `ArrowLeft`, after a `blur` event, a `keydown` of `ArrowUp` gives `move(0, -1)`.
