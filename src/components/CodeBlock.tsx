// 識別題的程式碼區塊（練習頁、詳情頁、比賽題目頁共用）。左側固定行號欄，
// 橫向捲動時也停在左緣，題目提到「第 n 行」時不用自己數。
export default function CodeBlock({
  code,
  maxHeight = "max-h-96",
}: {
  code: string;
  maxHeight?: string;
}) {
  if (!code || code.trim() === "") return null;
  const normalized = code.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const lineNumbers = lines.map((_, i) => i + 1).join("\n");
  return (
    <div className={`${maxHeight} overflow-auto rounded-lg bg-inset`}>
      <div className="flex min-w-max font-mono text-[13px] leading-relaxed">
        <pre
          aria-hidden
          className="sticky left-0 shrink-0 select-none border-r border-bd bg-inset px-3 py-5 text-right text-mute"
        >
          {lineNumbers}
        </pre>
        <pre className="whitespace-pre px-5 py-5">{normalized}</pre>
      </div>
    </div>
  );
}
