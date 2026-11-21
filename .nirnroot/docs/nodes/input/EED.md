# input

The keyboard: which key means which intent or command, and a listener that
turns key presses into them. A held key repeats (the browser's key
repeat): each repeat is one more press. On most keyboards `>` is Shift and `.`:
the browser's `key` is then `'>'`, which is what counts.

| keys | without Shift | with Shift |
|---|---|---|
| `ArrowUp`, `w`, `W`, `k`, `K` | `move(0, -1)` | `attack(0, -1)` |
| `ArrowDown`, `s`, `S`, `j`, `J` | `move(0, 1)` | `attack(0, 1)` |
| `ArrowLeft`, `a`, `A`, `h`, `H` | `move(-1, 0)` | `attack(-1, 0)` |
| `ArrowRight`, `d`, `D`, `l`, `L` | `move(1, 0)` | `attack(1, 0)` |
| `e`, `E`, ` ` (space) | `use()` | `use()` |
| `>` | `descend()` | `descend()` |

| keys | command |
|---|---|
| `Escape` | `menu` |
| `p`, `P` | `pause` |

# API Shapes:
- [shape:intent](../../shapes/intent.md)

# Functions:
## Function - intent-for:
`intentFor(key, shift) -> intent`. The first table's intent for a `KeyboardEvent.key` value, with Shift held when `shift` is true; `null` for any other key (and for anything not a string).

## Function - command-for:
`commandFor(key) -> string`. The second table's command (`menu` or `pause`) for a key; `null` for any other.

## Function - listen:
`listen(target, {intent, command}) -> function`. Adds a `keydown` listener to `target` (any `EventTarget`): for an event with none of `ctrlKey`, `altKey`, `metaKey` true, whose `key` has an intent (by `intentFor(key, shiftKey)`) or a command, it calls `event.preventDefault()` and then `intent(i)` or `command(c)`, once; other events are left alone. Answers `stop`, a function that removes the listener (calling it again does nothing).

# Intrinsics:
## Intrinsic - keys:
Every key of the first table answers its intent (`kind`, `dx`, `dy`) without and with Shift; `intentFor('>', true)` and `intentFor('>', false)` are `descend()`; `'.'`, `'x'`, `'Escape'`, `''`, `null` and `5` answer `null`. `commandFor('Escape')` is `menu`, `commandFor('P')` `pause`, `commandFor('w')` `null`.

## Intrinsic - listens:
With `stop = listen(t, {intent: f, command: g})` on a fresh `EventTarget` `t`: a cancelable `keydown` with `key` `'ArrowLeft'` calls `f` once with `move(-1, 0)` and is `defaultPrevented`; with `shiftKey` true too, `attack(-1, 0)`; one with `key` `'>'` and `shiftKey` true calls `f` once with `descend()`; one with `key` `'Escape'` calls `g` once with `'menu'`; one with `key` `'x'` calls neither and isn't prevented; one with `key` `'w'` and `ctrlKey` true calls neither; a `keyup` with `key` `'w'` calls neither. After `stop()`, a `keydown` with `key` `'w'` calls neither; `stop()` again doesn't throw.
