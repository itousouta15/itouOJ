const VERDICTS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "等待評測", className: "vbadge-gray" },
  JUDGING: { label: "評測中…", className: "vbadge-blue animate-pulse" },
  AC: { label: "Accepted", className: "vbadge-green" },
  WA: { label: "Wrong Answer", className: "vbadge-red" },
  TLE: { label: "Time Limit Exceeded", className: "vbadge-amber" },
  MLE: { label: "Memory Limit Exceeded", className: "vbadge-amber" },
  RE: { label: "Runtime Error", className: "vbadge-purple" },
  CE: { label: "Compile Error", className: "vbadge-gray" },
  IE: { label: "系統錯誤", className: "vbadge-gray" },
  CONTEST: { label: "比賽中", className: "vbadge-gray" },
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
    <span className={`vbadge ${v.className}`}>
      {short && status.length <= 3 && status !== "IE" ? status : v.label}
    </span>
  );
}
