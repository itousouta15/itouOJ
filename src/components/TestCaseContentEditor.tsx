"use client";

import { memo } from "react";

const PREVIEW_CHARACTERS = 320;

export interface TestCaseContentPatch {
  input?: string;
  output?: string;
}

function preview(value: string) {
  if (!value) return "（空白）";
  const excerpt = value.slice(0, PREVIEW_CHARACTERS);
  return value.length > PREVIEW_CHARACTERS ? `${excerpt}\n…` : excerpt;
}

const TestCaseContentEditor = memo(function TestCaseContentEditor({
  index,
  input,
  output,
  expanded,
  onToggle,
  onChange,
}: {
  index: number;
  input: string;
  output: string;
  expanded: boolean;
  onToggle: (index: number) => void;
  onChange: (index: number, patch: TestCaseContentPatch) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-mute">
          輸入 {input.length.toLocaleString()} 字元 · 期望輸出{" "}
          {output.length.toLocaleString()} 字元
        </p>
        <button
          type="button"
          className="btn-secondary shrink-0"
          aria-expanded={expanded}
          onClick={() => onToggle(index)}
        >
          {expanded ? "收合編輯器" : "編輯完整測資"}
        </button>
      </div>

      {expanded ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-dim">輸入</label>
            <textarea
              className="input h-28 font-mono text-[13px]"
              value={input}
              onChange={(event) =>
                onChange(index, { input: event.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-dim">期望輸出</label>
            <textarea
              className="input h-28 font-mono text-[13px]"
              value={output}
              onChange={(event) =>
                onChange(index, { output: event.target.value })
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["輸入預覽", input],
              ["期望輸出預覽", output],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <p className="mb-1 text-xs text-dim">{label}</p>
              <pre className="max-h-20 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-line bg-[#111315] p-2 font-mono text-xs text-dim">
                {preview(value)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default TestCaseContentEditor;
