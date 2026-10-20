"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  REPORT_CATEGORIES,
  REPORT_SECTIONS,
  type ReportCreateInput,
} from "@/lib/reportSchema";

export default function ReportForm({
  initial,
}: {
  initial: ReportCreateInput;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function setField<K extends keyof ReportCreateInput>(
    key: K,
    value: ReportCreateInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "回報失敗，請稍後再試");
        setSaving(false);
        return;
      }
      router.push(`/reports/${data.id}?submitted=1`);
      router.refresh();
    } catch {
      setError("無法送出回報，請檢查連線後再試。填寫內容已保留。");
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="card p-4 sm:p-6">
      <fieldset disabled={saving} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            回報類別
            <select
              className="input mt-2 w-full"
              value={form.category}
              onChange={(e) =>
                setField(
                  "category",
                  e.target.value as ReportCreateInput["category"],
                )
              }
            >
              {Object.entries(REPORT_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            問題位置（教學可指定語言／動畫）
            <select
              className="input mt-2 w-full"
              value={form.section}
              onChange={(e) =>
                setField(
                  "section",
                  e.target.value as ReportCreateInput["section"],
                )
              }
            >
              {Object.entries(REPORT_SECTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          標題（必填）
          <input
            className="input mt-2 w-full"
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="例如：a029 Python 程式在容量為 0 時輸出錯誤"
          />
        </label>
        <label className="block text-sm">
          發生問題的站內路徑
          <input
            className="input mt-2 w-full"
            maxLength={2000}
            value={form.sourcePath}
            onChange={(e) => setField("sourcePath", e.target.value)}
            placeholder="/courses/cpe/lessons/a460"
            aria-describedby="report-path-help"
          />
          <span id="report-path-help" className="mt-1 block text-xs text-mute">
            自動帶入所在頁面，只保留路徑，不儲存網址查詢參數或錨點。
          </span>
        </label>
        <label className="block text-sm">
          來源補充（選填）
          <input
            className="input mt-2 w-full"
            maxLength={300}
            value={form.context}
            onChange={(e) => setField("context", e.target.value)}
            placeholder="題號、動畫第幾步、瀏覽器或裝置"
          />
        </label>
        <label className="block text-sm">
          問題說明與重現步驟（必填，10–5000 字）
          <textarea
            className="input mt-2 min-h-44 w-full"
            required
            minLength={10}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder={
              "1. 開啟哪一題／哪一課\n2. 使用哪個語言、輸入或動畫步驟\n3. 目前出現什麼錯誤（可貼上小型重現範例）"
            }
          />
        </label>
        <label className="block text-sm">
          預期結果（選填）
          <textarea
            className="input mt-2 min-h-24 w-full"
            maxLength={2000}
            value={form.expected}
            onChange={(e) => setField("expected", e.target.value)}
            placeholder="你認為正確的說明、輸出或操作結果"
          />
        </label>
        <p className="text-xs leading-6 text-mute">
          回報僅本人與管理員可查看。請勿填入密碼、登入憑證、私人測資或個人敏感資料。目前支援文字回報，尚不提供附件上傳。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary">
            {saving ? "送出中…" : "送出回報"}
          </button>
          <Link href="/reports" className="text-sm text-blue hover:underline">
            查看我的回報
          </Link>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="mt-4 text-sm text-[#ff6b6b]">
          {error}
        </p>
      )}
    </form>
  );
}
