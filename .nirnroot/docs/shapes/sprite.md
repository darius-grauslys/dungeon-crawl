# sprite

Where one picture is: a source image and the rectangle of it to draw.
Immutable.

The module (`shapes/sprite/index.mjs`) exports `of({image, sx, sy, sw,
sh})`: `image` any object (a canvas or an image: whatever a 2D context's
`drawImage` takes; not `null`); `sx`, `sy` integers of 0 or more; `sw`,
`sh` integers of 1 or more. Any other input is refused with a
`TypeError`.

# Fields:
## Field - image:
Property `image`.

## Field - sx:
Property `sx`: the rectangle's left, in source pixels.

## Field - sy:
Property `sy`: its top.

## Field - sw:
Property `sw`: its width.

## Field - sh:
Property `sh`: its height.

# Intrinsics:
## Intrinsic - valid:
`of({image: {}, sx: 16, sy: 0, sw: 16, sh: 16})` has those values and is
frozen. `image: null`, `sx: -1`, `sw: 0` and `sy: 2.5` each throw a
`TypeError`.

# Callbacks:
None

# API Shapes:
None
