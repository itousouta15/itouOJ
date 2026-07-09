const DIFFICULTIES: Record<string, { label: string; className: string }> = {
  easy: { label: "簡單", className: "vbadge-green" },
  medium: { label: "中等", className: "vbadge-amber" },
  hard: { label: "困難", className: "vbadge-red" },
};

export default function DifficultyBadge({
  difficulty,
}: {
  difficulty: string;
}) {
  const d = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  return <span className={`vbadge ${d.className}`}>{d.label}</span>;
}
