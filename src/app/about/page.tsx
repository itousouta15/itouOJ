import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { avatarSrc } from "@/lib/avatar";
import Avatar from "@/components/Avatar";

export const metadata: Metadata = {
  title: "關於 itouOJ",
  description:
    "認識 itouOJ：由郭家睿（伊藤蒼太、itouSouta）開發的線上程式解題與競賽平台，提供題庫、即時評測、識讀練習與競賽功能。",
  alternates: { canonical: "/about" },
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
      avatarUpdatedAt: true,
    },
    orderBy: { username: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <div className="flex items-center gap-4">
          <Image
            src="/itouOJ.png"
            alt="itouOJ 標誌"
            width={112}
            height={112}
            priority
            className="h-10 w-10 sm:h-10 sm:w-10"
          />
          <h1 className="page-title">關於 itouOJ</h1>
        </div>
        <p className="mt-4 text-lg leading-relaxed text-dim">
          itouOJ 是一個自架的線上程式解題與競賽平台。從閱讀題目、撰寫程式、送出提交到查看每筆測資的結果，都能在同一個地方完成。
        </p>
      </header>

      <section className="card space-y-4 p-6">
        <h2 className="section-title">為什麼做這個平台</h2>
        <p className="leading-relaxed text-dim">
          寫程式不該只停在看題目和對答案。itouOJ 希望把練習、回饋、交流和競賽放進同一套流程，讓每一次提交都能留下可回顧的紀錄，也讓出題者與學習者能持續累積題目與經驗。
        </p>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="section-title">平台功能</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-dim">
          <li>程式題庫支援標籤、難度排序、Markdown 題敘、數學公式、範例測資與子題配分。</li>
          <li>支援 C、C++、Python、JavaScript 與 Java，提交後可查看 AC、WA、TLE、MLE、RE、CE、IE 等結果，以及時間與記憶體用量。</li>
          <li>提供程式碼識讀練習、答題紀錄與複習進度，適合從閱讀程式碼開始建立觀念。</li>
          <li>題目可建立討論串與題解；通過題目後，才能查看其他使用者分享的題解內容。</li>
          <li>課程可組織題目與追蹤進度；競賽支援 ICPC、IOI、封榜、加入代碼與限制可用語言。</li>
        </ul>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="section-title">判題與競賽</h2>
        <p className="leading-relaxed text-dim">
          C、C++、Python 與 JavaScript 使用專案內建的 sandbox-runner 執行，透過 Linux namespace、cgroup v2 與 seccomp-bpf 限制程式執行環境；Java 則由獨立的 Piston 服務處理。判題工作由獨立 worker 依序領取，避免大量提交影響整台主機。
        </p>
        <p className="leading-relaxed text-dim">
          除了線上競賽，itouOJ 也提供 Windows 收件程式。網路不穩或暫時斷線時，選手可先在本機測試與暫存提交，恢復連線後再批次上傳到競賽伺服器。
        </p>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="section-title">作者與開源</h2>
        <p className="leading-relaxed text-dim">
          itouOJ 由郭家睿（伊藤蒼太／itouSouta）開發與維護
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://itousouta.me"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            itouSouta.me
          </a>
          <a
            href="https://github.com/itousouta15"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            GitHub 個人頁
          </a>
        </div>
        <p className="leading-relaxed text-dim">
          專案以開源方式維護，歡迎透過 GitHub 查看原始碼、提出 issue，或協助改善文件與功能。
        </p>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="section-title">感謝管理與維護團隊</h2>
        <p className="leading-relaxed text-dim">
          itouOJ 能持續運作，不只是程式碼的成果。感謝協助出題、整理測資、管理競賽、回覆使用者問題、維護討論秩序，以及處理伺服器與判題服務的每一位夥伴。
        </p>
        {admins.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-tx">管理員名單</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {admins.map((admin) => (
                <Link
                  key={admin.username}
                  href={`/users/${admin.username}`}
                  className="flex items-center gap-3 border border-bd bg-inset p-3 transition-colors hover:border-[var(--blue)]"
                >
                  <Avatar
                    name={admin.displayName || admin.username}
                    src={avatarSrc(admin)}
                    size={48}
                  />
                  <span>
                    <span className="block font-medium text-tx">
                      {admin.displayName || admin.username}
                    </span>
                    <span className="block text-xs text-dim">管理員</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <p className="leading-relaxed text-dim">
          每一場順利進行的比賽、每一題可被安心練習的題目，以及每一次穩定的提交與評測，都有管理與維護團隊投入的時間與心力。
        </p>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="section-title">開始使用</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/problems" className="btn-primary">
            瀏覽題目
          </Link>
          <a
            href="https://github.com/itousouta15/itouOJ"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            GitHub 原始碼
          </a>
        </div>
      </section>
    </div>
  );
}
