import type { CpeLesson } from "@/lib/cpeLessonTypes";
import { cpeProblemCatalog } from "@/lib/cpeProblemCatalog";

type CpeLessonDraft = Omit<CpeLesson, "code" | "sampleInput" | "sampleOutput">;

export function defineCpeLesson(
  code: string,
  draft: CpeLessonDraft,
): CpeLesson {
  const problem = cpeProblemCatalog.find((entry) => entry.code === code);
  const sample = problem?.samples[0];
  if (!sample) throw new Error(`Missing CPE public sample: ${code}`);
  return {
    ...draft,
    code,
    sampleInput: sample.input,
    sampleOutput: sample.output,
  };
}
