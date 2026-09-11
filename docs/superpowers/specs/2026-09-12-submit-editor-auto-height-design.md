# Submit editor auto-height design

## Goal

Let the CodeMirror submission editor grow with the source code instead of
always occupying a fixed 380px area.

## Behavior

- The inline editor starts at 380px high.
- Its height grows as content grows, up to 70vh.
- Once content exceeds 70vh, the editor itself scrolls.
- The existing mobile fullscreen editor behavior is unchanged.
- No draft, language-selection, or submission behavior changes.

## Implementation and verification

Configure CodeMirror's content-height support and replace the fixed wrapper
height with the matching minimum/maximum bounds. Verify short, long, and very
long source code in desktop and mobile layouts, then run type checking and a
production build.
