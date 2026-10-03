import { EditorSelection, Text, Transaction, type Text as EditorText } from "@codemirror/state";
import { isolateHistory } from "@codemirror/commands";
import type { EditorView } from "@codemirror/view";

export function applyEditorFormatting(view: EditorView, formatted: string, original: EditorText) {
  const document = Text.of(formatted.split("\n"));
  const mapPosition = (position: number) => {
    const oldLine = original.lineAt(position);
    const newLine = document.line(Math.min(oldLine.number, document.lines));
    return newLine.from + Math.min(position - oldLine.from, newLine.length);
  };
  view.dispatch({
    changes: { from: 0, to: original.length, insert: formatted },
    selection: EditorSelection.create(view.state.selection.ranges.map((range) =>
      EditorSelection.range(mapPosition(range.anchor), mapPosition(range.head))
    ), view.state.selection.mainIndex),
    annotations: [Transaction.userEvent.of("input.format"), isolateHistory.of("full")],
  });
}
