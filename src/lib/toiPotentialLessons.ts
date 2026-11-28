import type { ToiPotentialLesson } from "@/lib/toiPotentialLessonTypes";
import { lessons as batch1part1 } from "@/lib/toiPotentialLessons/batch1/part1";
import { lessons as batch1part2 } from "@/lib/toiPotentialLessons/batch1/part2";
import { lessons as batch2part1 } from "@/lib/toiPotentialLessons/batch2/part1";
import { lessons as batch2part2 } from "@/lib/toiPotentialLessons/batch2/part2";
import { lessons as batch3part1 } from "@/lib/toiPotentialLessons/batch3/part1";
import { lessons as batch3part2 } from "@/lib/toiPotentialLessons/batch3/part2";
import { lessons as batch4part1 } from "@/lib/toiPotentialLessons/batch4/part1";
import { lessons as batch4part2 } from "@/lib/toiPotentialLessons/batch4/part2";
import { lessons as batch5part1 } from "@/lib/toiPotentialLessons/batch5/part1";
import { lessons as batch5part2 } from "@/lib/toiPotentialLessons/batch5/part2";
import { lessons as batch6part1 } from "@/lib/toiPotentialLessons/batch6/part1";
import { lessons as batch6part2 } from "@/lib/toiPotentialLessons/batch6/part2";
import { lessons as finalLessons } from "@/lib/toiPotentialLessons/final";

const allLessons = [
  ...batch1part1,
  ...batch1part2,
  ...batch2part1,
  ...batch2part2,
  ...batch3part1,
  ...batch3part2,
  ...batch4part1,
  ...batch4part2,
  ...batch5part1,
  ...batch5part2,
  ...batch6part1,
  ...batch6part2,
  ...finalLessons,
];
export const toiPotentialLessons: Record<string, ToiPotentialLesson> = {};
for (const lesson of allLessons) {
  if (toiPotentialLessons[lesson.code])
    throw new Error(`Duplicate TOI potential lesson: ${lesson.code}`);
  toiPotentialLessons[lesson.code] = lesson;
}
