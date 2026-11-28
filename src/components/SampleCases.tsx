// 範例測資區塊：實作題題目頁與比賽題目頁共用。
export default function SampleCases({
  samples,
}: {
  samples: { id: number; input: string; output: string }[];
}) {
  if (samples.length === 0) return null;
  return (
    <div className="space-y-4">
      <h2 className="section-title">範例測資</h2>
      {samples.map((tc, i) => (
        <div key={tc.id} className="grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <p className="mb-2 text-xs font-semibold text-dim">
              範例輸入 {i + 1}
            </p>
            <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
              {tc.input}
            </pre>
          </div>
          <div className="card p-4">
            <p className="mb-2 text-xs font-semibold text-dim">
              範例輸出 {i + 1}
            </p>
            <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-sm whitespace-pre-wrap">
              {tc.output}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
