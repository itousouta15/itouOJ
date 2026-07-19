const STATUSES: Record<string, { label: string; className: string }> = {
  PENDING: { label: "審核中", className: "vbadge-amber" },
  APPROVED: { label: "已通過", className: "vbadge-green" },
  REJECTED: { label: "已退回", className: "vbadge-gray" },
};

export default function ProposalStatusBadge({ status }: { status: string }) {
  const s = STATUSES[status] ?? STATUSES.PENDING;
  return <span className={`vbadge ${s.className}`}>{s.label}</span>;
}
