# input

The keyboard: which key means which intent, and a listener that turns key
presses into intents.

| keys | intent |
|---|---|
| `ArrowUp`, `w`, `W`, `k`, `K` | `move(0, -1)` |
| `ArrowDown`, `s`, `S`, `j`, `J` | `move(0, 1)` |
| `ArrowLeft`, `a`, `A`, `h`, `H` | `move(-1, 0)` |
| `ArrowRight`, `d`, `D`, `l`, `L` | `move(1, 0)` |
| `.`, ` ` (space), `z`, `Z` | `wait()` |
| `>`, `Enter` | `descend()` |
| `r`, `R` | `restart()` |

# API Shapes:
- [shape:intent](../../shapes/intent.md)

# Functions:
## Function - intent-for:
`intentFor(key) -> intent`. The table's intent for a `KeyboardEvent.key` value; `null` for any other key (and for anything not a string).

## Function - listen:
`listen(target, onIntent) -> function`. Adds a `keydown` listener to `target` (any `EventTarget`): for an event whose `key` has an intent and with none of `ctrlKey`, `altKey`, `metaKey` true, it calls `event.preventDefault()` and then `onIntent(intent)`, once; other events are left alone. Answers `stop`, a function that removes the listener (calling it again does nothing).

# Intrinsics:
## Intrinsic - keys:
Every key of the table answers its intent (`kind`, `dx`, `dy`); `'x'`, `'Escape'`, `''`, `null` and `5` answer `null`.

## Intrinsic - listens:
With `stop = listen(t, f)` on a fresh `EventTarget` `t`: a cancelable `keydown` event with `key` `'ArrowLeft'` calls `f` once with `move(-1, 0)` and is `defaultPrevented`; one with `key` `'x'` doesn't call `f` and isn't; one with `key` `'w'` and `ctrlKey` true doesn't call `f`; a `keyup` with `key` `'w'` doesn't call `f`. After `stop()`, a `keydown` with `key` `'w'` doesn't call `f`; `stop()` again doesn't throw.
