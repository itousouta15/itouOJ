import type { ToiBeginnerLesson } from "@/lib/toiBeginnerLessonTypes";
import { toiBeginnerProblemCatalog } from "@/lib/toiBeginnerProblemCatalog";

export function defineToiBeginnerLesson(
  code: string,
  draft: Omit<ToiBeginnerLesson, "code" | "sampleInput" | "sampleOutput">,
): ToiBeginnerLesson {
  const sample = toiBeginnerProblemCatalog.find(
    (problem) => problem.code === code,
  )?.samples[0];
  if (!sample) throw new Error(`Missing live beginner public sample: ${code}`);
  return {
    ...draft,
    code,
    sampleInput: sample.input,
    sampleOutput: sample.output,
  };
}
