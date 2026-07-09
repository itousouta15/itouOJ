const VERDICTS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "等待評測", className: "bg-zinc-100 text-zinc-600" },
  JUDGING: {
    label: "評測中…",
    className: "bg-blue-100 text-blue-700 animate-pulse",
  },
  AC: { label: "Accepted", className: "bg-green-100 text-green-700" },
  WA: { label: "Wrong Answer", className: "bg-red-100 text-red-700" },
  TLE: {
    label: "Time Limit Exceeded",
    className: "bg-amber-100 text-amber-700",
  },
  MLE: {
    label: "Memory Limit Exceeded",
    className: "bg-amber-100 text-amber-700",
  },
  RE: { label: "Runtime Error", className: "bg-purple-100 text-purple-700" },
  CE: { label: "Compile Error", className: "bg-zinc-200 text-zinc-700" },
  IE: { label: "系統錯誤", className: "bg-zinc-200 text-zinc-500" },
};

export default function VerdictBadge({
  status,
  short = false,
}: {
  status: string;
  short?: boolean;
}) {
  const v = VERDICTS[status] ?? VERDICTS.IE;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${v.className}`}
    >
      {short && status.length <= 3 && status !== "IE" ? status : v.label}
    </span>
  );
}
