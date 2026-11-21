# hud: edge test `panel`

`lines` is pure (a plain test is enough); `draw` needs a canvas: write a
browser test (`*.browser.test.mjs`) using the page's 800 by 600 canvas and
its 2D context, reading pixels back with `getImageData`. Build the
worlds with `world`'s `of` on a small grid (`fromRows(['####', '#..#',
'####'])`, Ann at (1, 1), Bob at (2, 1), `empty` masks), each hero with
`hero`'s `of` around an `actor` of kind `hero` (attack 4, defense 1; 0
hit points and `alive: false` for one not alive), `entry` the save of
seed 1, depth 1 and no players, the other keys as the intrinsic says
(seed 1, rng 1, time 0, state `playing`, no monsters or items otherwise).

The edge under test:

- [eed:hud](../EED.md)

# API Shapes:
- [shape:world](../../../shapes/world.md)
- [shape:hero](../../../shapes/hero.md)
- [shape:save](../../../shapes/save.md)
- [shape:tile-grid](../../../shapes/tile-grid.md)
- [shape:actor](../../../shapes/actor.md)
- [shape:stats](../../../shapes/stats.md)
- [shape:mask](../../../shapes/mask.md)
- [shape:point](../../../shapes/point.md)

# Intrinsics:
## Intrinsic - lines:
As the EED states.

## Intrinsic - bar:
As the EED states.

## Intrinsic - refuses:
As the EED states.

## Intrinsic - world/valid:
As the shape states.

## Intrinsic - world/data:
As the shape states.
