// 程式碼區塊：識別題的程式片段（練習頁、詳情頁、比賽題目頁共用）。
export default function CodeBlock({
  code,
  maxHeight = "max-h-96",
}: {
  code: string;
  maxHeight?: string;
}) {
  if (!code || code.trim() === "") return null;
  return (
    <pre
      className={`${maxHeight} overflow-auto rounded-lg bg-inset p-5 font-mono text-[13px] leading-relaxed whitespace-pre`}
    >
      {code}
    </pre>
  );
}
