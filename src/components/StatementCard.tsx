import Markdown from "@/components/Markdown";

// 題敘卡片：實作題與識別題共用的題目內文區塊（Markdown，支援數學式與圖片）。
export default function StatementCard({ children }: { children: string }) {
  return (
    <div className="card p-6">
      <Markdown>{children}</Markdown>
    </div>
  );
}
