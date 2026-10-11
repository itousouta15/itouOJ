import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import PlaygroundWorkspace from "@/components/PlaygroundWorkspace";

export const metadata: Metadata = {
  title: "自由寫程式",
  description: "自由編寫與執行 C、C++、Python、JavaScript 及 itouLang 程式，直接在終端機查看輸出與互動輸入。",
};

export default async function PlaygroundPage() {
  const session = await getSession();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">自由寫程式</h1>
        <p className="mt-2 text-sm text-dim">從一段小程式開始，隨時編寫、執行，看看結果。</p>
      </div>
      <PlaygroundWorkspace key={session?.userId ?? "guest"} userId={session?.userId ?? null} />
    </div>
  );
}
