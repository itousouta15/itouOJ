"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import Avatar from "@/components/Avatar";
import { LANGUAGES, LANGUAGE_KEYS, isLanguageKey } from "@/lib/languages";

interface Access {
  visible: boolean;
  canComment: boolean;
  canViewSolutions: boolean;
  canPostSolution: boolean;
  lockedByContest: boolean;
  solved: boolean;
}

interface Author {
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  authorIsAdmin: boolean;
}

interface CommentNode extends Author {
  id: number;
  content: string;
  createdAt: string;
  canDelete: boolean;
  replies?: CommentNode[];
}

interface SolutionItem extends Author {
  id: number;
  title: string;
  content: string;
  code: string | null;
  language: string | null;
  createdAt: string;
  canDelete: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false,
  });
}

// 頭像 + 名字（連到個人頁）+ 管理員標記 + 時間。留言、回覆、題解共用同一個表頭。
function AuthorLine({
  author,
  at,
  size = 32,
}: {
  author: Author;
  at: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/users/${author.authorUsername}`} className="shrink-0">
        <Avatar
          name={author.authorName}
          src={author.authorAvatarUrl}
          size={size}
        />
      </Link>
      <div className="flex flex-wrap items-center gap-x-2 text-sm leading-tight">
        <Link
          href={`/users/${author.authorUsername}`}
          className="font-semibold text-tx hover:text-blue hover:underline"
        >
          {author.authorName}
        </Link>
        {author.authorIsAdmin && (
          <span className="rounded bg-inset px-1.5 py-0.5 text-xs text-dim">
            管理員
          </span>
        )}
        <span className="mono text-xs text-mute">{formatTime(at)}</span>
      </div>
    </div>
  );
}

export default function ProblemDiscussion({
  problemId,
  loggedIn,
}: {
  problemId: number;
  loggedIn: boolean;
}) {
  const [tab, setTab] = useState<"comments" | "solutions">("comments");
  const [access, setAccess] = useState<Access | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [solutions, setSolutions] = useState<SolutionItem[]>([]);
  const [solutionTotal, setSolutionTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [sTitle, setSTitle] = useState("");
  const [sContent, setSContent] = useState("");
  const [sCode, setSCode] = useState("");
  const [sLang, setSLang] = useState<string>("cpp");

  // 發文/刪除後把這個值 +1 就會重新抓一次。用計數器而不是把抓資料的函式
  // 拉到外面：抓資料寫在 effect 裡才好在元件被卸載時用 cancelled 擋掉
  // 「回應回來時元件已經不在」的 setState。
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const [cRes, sRes] = await Promise.all([
        fetch(`/api/problems/${problemId}/comments`, { cache: "no-store" }),
        fetch(`/api/problems/${problemId}/solutions`, { cache: "no-store" }),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        if (cancelled) return;
        setAccess(data.access);
        setComments(data.comments);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        if (cancelled) return;
        setSolutions(data.solutions);
        setSolutionTotal(data.total);
      }
      if (!cancelled) setLoading(false);
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [problemId, version]);

  async function postComment(content: string, parentId: number | null) {
    if (!content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/problems/${problemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "發表失敗");
        return;
      }
      setDraft("");
      setReplyDraft("");
      setReplyTo(null);
      reload();
    } finally {
      setPosting(false);
    }
  }

  async function removeComment(id: number) {
    if (!confirm("確定要刪除這則留言嗎？底下的回覆也會一起刪除。")) return;
    await fetch(`/api/problems/${problemId}/comments/${id}`, {
      method: "DELETE",
    });
    reload();
  }

  async function postSolution() {
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/problems/${problemId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sTitle,
          content: sContent,
          code: sCode,
          language: sLang,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "發表失敗");
        return;
      }
      setSTitle("");
      setSContent("");
      setSCode("");
      setShowSolutionForm(false);
      reload();
    } finally {
      setPosting(false);
    }
  }

  async function removeSolution(id: number) {
    if (!confirm("確定要刪除這篇題解嗎？")) return;
    await fetch(`/api/problems/${problemId}/solutions/${id}`, {
      method: "DELETE",
    });
    reload();
  }

  if (loading) {
    return <p className="animate-pulse text-mute">載入討論區…</p>;
  }

  // 這題還被某場沒結束的比賽用到：整個討論區對一般使用者關閉，
  // 免得有人在賽前或賽中把提示、解法貼上去。
  if (access && !access.visible) {
    return (
      <div className="card p-6 text-center text-sm text-dim">
        這題正在比賽中使用，討論區暫時關閉，比賽結束後會自動開放。
      </div>
    );
  }

  const commentCount = comments.reduce(
    (n, c) => n + 1 + (c.replies?.length ?? 0),
    0
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`pill ${tab === "comments" ? "pill-active" : ""}`}
          onClick={() => setTab("comments")}
        >
          討論 {commentCount > 0 && `(${commentCount})`}
        </button>
        <button
          type="button"
          className={`pill ${tab === "solutions" ? "pill-active" : ""}`}
          onClick={() => setTab("solutions")}
        >
          題解 {solutionTotal > 0 && `(${solutionTotal})`}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-[#ff6b6b]">{error}</p>}

      {tab === "comments" ? (
        <div className="space-y-4">
          {loggedIn ? (
            <div className="card p-4">
              <textarea
                className="input h-24 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="有問題想問，或想分享一點想法？（支援 Markdown）"
              />
              <div className="mt-2 flex justify-end">
                <button
                  className="btn-primary"
                  disabled={posting || !draft.trim()}
                  onClick={() => postComment(draft, null)}
                >
                  {posting ? "發表中…" : "發表留言"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-4 text-center text-sm text-dim">
              請先
              <Link href="/login" className="mx-1 text-blue hover:underline">
                登入
              </Link>
              後再發表留言
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-mute">還沒有人留言，來當第一個吧。</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <AuthorLine author={c} at={c.createdAt} />
                  {c.canDelete && (
                    <button
                      type="button"
                      className="text-xs text-mute hover:text-[#ff6b6b]"
                      onClick={() => removeComment(c.id)}
                    >
                      刪除
                    </button>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <Markdown>{c.content}</Markdown>
                </div>

                {(c.replies ?? []).length > 0 && (
                  <div className="mt-3 space-y-3 border-l-2 border-bd pl-4">
                    {c.replies!.map((r) => (
                      <div key={r.id}>
                        <div className="flex items-start justify-between gap-3">
                          <AuthorLine author={r} at={r.createdAt} size={24} />
                          {r.canDelete && (
                            <button
                              type="button"
                              className="text-xs text-mute hover:text-[#ff6b6b]"
                              onClick={() => removeComment(r.id)}
                            >
                              刪除
                            </button>
                          )}
                        </div>
                        <div className="mt-1 text-sm">
                          <Markdown>{r.content}</Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {loggedIn &&
                  (replyTo === c.id ? (
                    <div className="mt-3">
                      <textarea
                        className="input h-20 text-sm"
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="回覆這則留言…"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyDraft("");
                          }}
                        >
                          取消
                        </button>
                        <button
                          className="btn-primary"
                          disabled={posting || !replyDraft.trim()}
                          onClick={() => postComment(replyDraft, c.id)}
                        >
                          {posting ? "發表中…" : "回覆"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-2 text-xs text-blue hover:underline"
                      onClick={() => {
                        setReplyTo(c.id);
                        setReplyDraft("");
                      }}
                    >
                      回覆
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!access?.canViewSolutions ? (
            <div className="card p-6 text-center text-sm text-dim">
              {loggedIn ? (
                <>
                  <p>先自己通過這一題（拿到 AC），才看得到其他人的題解。</p>
                  <p className="mt-1 text-mute">
                    {solutionTotal > 0
                      ? `目前有 ${solutionTotal} 篇題解等著你。`
                      : "目前還沒有人分享題解。"}
                  </p>
                </>
              ) : (
                <p>
                  請先
                  <Link href="/login" className="mx-1 text-blue hover:underline">
                    登入
                  </Link>
                  並通過這一題後，才看得到其他人的題解
                </p>
              )}
            </div>
          ) : (
            <>
              {access.canPostSolution &&
                (showSolutionForm ? (
                  <div className="card space-y-3 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        標題
                      </label>
                      <input
                        className="input"
                        value={sTitle}
                        onChange={(e) => setSTitle(e.target.value)}
                        placeholder="例如：用計數陣列，O(n) 一次掃完"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        解題想法（支援 Markdown）
                      </label>
                      <textarea
                        className="input h-40 text-sm"
                        value={sContent}
                        onChange={(e) => setSContent(e.target.value)}
                        placeholder="說明你的想法：這題該怎麼想、為什麼這樣做會對、有沒有踩到什麼雷。"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        程式碼（選填）
                      </label>
                      <select
                        className="input mb-2 max-w-xs"
                        value={sLang}
                        onChange={(e) => setSLang(e.target.value)}
                      >
                        {LANGUAGE_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {LANGUAGES[k].label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        className="input h-48 font-mono text-[13px]"
                        value={sCode}
                        onChange={(e) => setSCode(e.target.value)}
                        placeholder="貼上你的程式碼（可以留空只分享想法）"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => setShowSolutionForm(false)}
                      >
                        取消
                      </button>
                      <button
                        className="btn-primary"
                        disabled={posting || !sTitle.trim() || !sContent.trim()}
                        onClick={postSolution}
                      >
                        {posting ? "發表中…" : "發表題解"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => setShowSolutionForm(true)}
                  >
                    分享我的題解
                  </button>
                ))}

              {solutions.length === 0 ? (
                <p className="text-sm text-mute">
                  還沒有人分享題解，把你的想法寫下來給其他人參考吧。
                </p>
              ) : (
                solutions.map((s) => (
                  <div key={s.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-tx">{s.title}</h3>
                        <div className="mt-2">
                          <AuthorLine author={s} at={s.createdAt} />
                        </div>
                      </div>
                      {s.canDelete && (
                        <button
                          type="button"
                          className="text-xs text-mute hover:text-[#ff6b6b]"
                          onClick={() => removeSolution(s.id)}
                        >
                          刪除
                        </button>
                      )}
                    </div>
                    <div className="mt-3 text-sm">
                      <Markdown>{s.content}</Markdown>
                    </div>
                    {s.code && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs text-dim">
                          {s.language && isLanguageKey(s.language)
                            ? LANGUAGES[s.language].label
                            : "程式碼"}
                        </p>
                        <pre className="overflow-x-auto rounded-lg bg-inset p-4 font-mono text-[13px] leading-6 text-tx">
                          {s.code}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
