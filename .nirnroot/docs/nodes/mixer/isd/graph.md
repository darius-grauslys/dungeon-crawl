# mixer: `graph`

`create`: make the master (`createGain`, value 0.7, connected to
`destination`), the effects bus (1) and the music bus (0.4), both
connected to the master. Keep a map of decoded sound buffers by path, a
map of decoded music by track, the current track number and its source
and gain node.

`load`: `Promise.all` over the fourteen paths: `fetch(base + path)`, check
`ok` (else throw an `Error` naming the path), `arrayBuffer()`,
`context.decodeAudioData(...)`, store. `play`: check the cue, pick the
buffer (`random`), wire source → new gain (`gain.value = cue.gain`) →
effects bus, `start()`. `music`: fade the old as the EED says, then load
(or reuse) the new track; on arrival, start it only if it is still the
track asked for. Volume and mute only set the master's `gain.value`.

This Node's edge:

- [eed:mixer](../EED.md)

# API Shapes:
- [shape:cue](../../../shapes/cue.md)

# Assets:
- [asset:sfx/step-1.mp3](../../../../../assets/sfx/step-1.mp3)
- [asset:sfx/step-2.mp3](../../../../../assets/sfx/step-2.mp3)
- [asset:sfx/step-3.mp3](../../../../../assets/sfx/step-3.mp3)
- [asset:sfx/step-4.mp3](../../../../../assets/sfx/step-4.mp3)
- [asset:sfx/swing.mp3](../../../../../assets/sfx/swing.mp3)
- [asset:sfx/shot.mp3](../../../../../assets/sfx/shot.mp3)
- [asset:sfx/hit.mp3](../../../../../assets/sfx/hit.mp3)
- [asset:sfx/death.mp3](../../../../../assets/sfx/death.mp3)
- [asset:sfx/coin.mp3](../../../../../assets/sfx/coin.mp3)
- [asset:sfx/powerup.mp3](../../../../../assets/sfx/powerup.mp3)
- [asset:sfx/use.mp3](../../../../../assets/sfx/use.mp3)
- [asset:sfx/stairs.mp3](../../../../../assets/sfx/stairs.mp3)
- [asset:sfx/hiss.mp3](../../../../../assets/sfx/hiss.mp3)
- [asset:sfx/boom.mp3](../../../../../assets/sfx/boom.mp3)
- [asset:music/dungeon-1.mp3](../../../../../assets/music/dungeon-1.mp3)
- [asset:music/dungeon-2.mp3](../../../../../assets/music/dungeon-2.mp3)
- [asset:music/dungeon-3.mp3](../../../../../assets/music/dungeon-3.mp3)
- [asset:music/dungeon-4.mp3](../../../../../assets/music/dungeon-4.mp3)
- [asset:music/dungeon-5.mp3](../../../../../assets/music/dungeon-5.mp3)

# Inbound Side-Effects:
The sound and music files, fetched from the asset area.

# Outbound Side-Effects:
Sound out of the given audio context; `console.error` when a music track
fails to load.
