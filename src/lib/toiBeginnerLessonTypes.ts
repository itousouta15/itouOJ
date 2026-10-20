import type { ApcsLesson } from "@/lib/apcsCourseLessons";

export type ToiBeginnerTopic =
  | "read-calculate"
  | "conditions"
  | "count-frequency"
  | "text"
  | "arrays"
  | "grid"
  | "simulation"
  | "number-theory"
  | "search-optimization";
export type ToiBeginnerLesson = ApcsLesson & { topic: ToiBeginnerTopic };
