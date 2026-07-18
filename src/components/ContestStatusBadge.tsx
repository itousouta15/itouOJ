import { getContestPhase, type ContestPhase } from "@/lib/contest";

const PHASES: Record<ContestPhase, { label: string; className: string }> = {
  upcoming: { label: "即將開始", className: "vbadge-blue" },
  running: { label: "進行中", className: "vbadge-green" },
  frozen: { label: "凍結中", className: "vbadge-amber" },
  ended: { label: "已結束", className: "vbadge-gray" },
};

export default function ContestStatusBadge({
  contest,
}: {
  contest: { startTime: Date; endTime: Date; freezeMinutes: number };
}) {
  const phase = getContestPhase(contest);
  const p = PHASES[phase];
  return <span className={`vbadge ${p.className}`}>{p.label}</span>;
}
