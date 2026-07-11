"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import VerdictBadge from "@/components/VerdictBadge";

export interface HomeSubmissionRowData {
  id: number;
  status: string;
  createdAtLabel: string;
  username: string;
  problem: { id: number; title: string };
}

export default function HomeSubmissionRow({ s }: { s: HomeSubmissionRowData }) {
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
      <td className="table-cell">
        <VerdictBadge status={s.status} short />
      </td>
      <td className="table-cell text-right text-dim">{s.createdAtLabel}</td>
    </tr>
  );
}
