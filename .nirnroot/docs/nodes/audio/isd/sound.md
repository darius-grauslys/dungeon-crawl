# audio: `sound`

`create`: pick the context (the option, else the page's `AudioContext`
or `webkitAudioContext`, else none); with one, `mixer.create({context,
fetch, base})` and set its volume; without, keep the volume and the mute
here alone. `update`: check the arguments, `cues.cues(prev, next, me)`,
`mixer.play` each, then `mixer.music(track)` for `next` (as the EED
says). `louder` / `quieter` / `toggleMute` update the mixer's volume and
mute.

This Node's edge:

- [eed:audio](../EED.md)

Children this specification reaches:

- [eed:cues](../../cues/EED.md)
- [eed:mixer](../../mixer/EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:level](../../../shapes/level.md)
- [shape:cue](../../../shapes/cue.md)

# Inbound Side-Effects:
The page's Web Audio (`AudioContext`), through the mixer.

# Outbound Side-Effects:
Sound, through the mixer; `console.error` when the sounds fail to load.
