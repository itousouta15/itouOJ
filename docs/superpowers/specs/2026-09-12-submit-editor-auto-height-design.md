# Submit editor focused interaction design

## Goal

Replace the fixed-height CodeMirror submission editor with a focused editing
experience that grows with source code and has reliable desktop fullscreen
behavior.

## Behavior

- The inline editor starts at 380px high and grows downward with its document
  without an artificial maximum. The page, rather than the inline editor,
  scrolls for long submissions.
- Focusing the inline editor applies a subtle visual focus treatment without
  moving the page or stealing focus from the CodeMirror selection.
- The desktop fullscreen control opens a portal editor reliably, transfers
  focus to it, and supports Escape to close. Closing restores focus to the
  inline editor without losing the draft or cursor position.
- Mobile automatic fullscreen behavior remains intact.
- The control is a real button with an explicit type, accessible label, and
  stable click handler so it cannot accidentally submit an enclosing form.
- No draft, language-selection, run, or submission behavior changes.

## Implementation and verification

Configure CodeMirror content-height support and an update listener that keeps
the inline wrapper equal to document height. Separate the editor instances' DOM ownership so
the inline and portal modes never attempt to mount into the same container.
Verify short, long, and very long source code; keyboard focus; desktop open/
close; Escape; and mobile fullscreen layouts. Then run type checking and a
production build.
