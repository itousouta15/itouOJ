import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { toiPotentialProblemCatalog } from "@/lib/toiPotentialProblemCatalog";

type LessonDraft = Omit<
  ToiPotentialLesson,
  "code" | "sampleInput" | "sampleOutput"
>;

export function defineToiPotentialLesson(
  code: string,
  draft: LessonDraft,
): ToiPotentialLesson {
  const sample = toiPotentialProblemCatalog.find(
    (problem) => problem.code === code,
  )?.samples[0];
  if (!sample) throw new Error(`Missing TOI potential public sample: ${code}`);
  return {
    ...draft,
    code,
    sampleInput: sample.input,
    sampleOutput: sample.output,
  };
}
