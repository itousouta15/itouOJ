import type { ApcsLesson } from "@/lib/apcsCourseLessons";
import { apcsPastExamSamples } from "@/lib/apcsPastExamSamples";

type LessonDraft = Omit<ApcsLesson, "code" | "sampleInput" | "sampleOutput">;

export function definePastExamLesson(code: string, draft: LessonDraft): ApcsLesson {
  const sample = apcsPastExamSamples[code]?.[0];
  if (!sample) throw new Error(`Missing public sample for ${code}`);
  return { ...draft, code, sampleInput: sample.input, sampleOutput: sample.output };
}
