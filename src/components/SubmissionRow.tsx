"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import VerdictBadge from "@/components/VerdictBadge";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";

export interface SubmissionRowData {
  id: number;
  status: string;
  language: string;
  timeMs: number | null;
  memoryKb: number | null;
  createdAtLabel: string;
  username: string;
  problem: { id: number; title: string };
}

export default function SubmissionRow({ s }: { s: SubmissionRowData }) {
  const router = useRouter();

  return (
    <tr
      className="cursor-pointer hover:bg-panel2"
      onClick={() => router.push(`/submissions/${s.id}`)}
    >
      <td className="table-cell mono text-dim">{s.id}</td>
      <td className="table-cell">
        <Link
          href={`/problems/${s.problem.id}`}
          className="font-medium text-blue hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {s.problem.title}
        </Link>
      </td>
      <td className="table-cell">{s.username}</td>
      <td className="table-cell text-dim">
        {isLanguageKey(s.language) ? LANGUAGES[s.language].label : s.language}
      </td>
      <td className="table-cell">
        <VerdictBadge status={s.status} />
      </td>
      <td className="table-cell text-right text-dim">
        {s.timeMs != null ? `${s.timeMs} ms` : "—"}
      </td>
      <td className="table-cell text-right text-dim">
        {s.memoryKb != null ? `${Math.round(s.memoryKb / 1024)} MB` : "—"}
      </td>
      <td className="table-cell text-dim">{s.createdAtLabel}</td>
    </tr>
  );
}
