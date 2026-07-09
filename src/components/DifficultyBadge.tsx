const DIFFICULTIES: Record<string, { label: string; className: string }> = {
  easy: { label: "簡單", className: "bg-green-100 text-green-700" },
  medium: { label: "中等", className: "bg-amber-100 text-amber-700" },
  hard: { label: "困難", className: "bg-red-100 text-red-700" },
};

export default function DifficultyBadge({
  difficulty,
}: {
  difficulty: string;
}) {
  const d = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.className}`}
    >
      {d.label}
    </span>
  );
}
