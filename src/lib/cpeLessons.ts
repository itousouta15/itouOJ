import type { CpeLesson } from "@/lib/cpeLessonTypes";
import { lessons as batch1Part1 } from "@/lib/cpeLessons/batch1/part1";
import { lessons as batch1Part2 } from "@/lib/cpeLessons/batch1/part2";
import { lessons as batch1Part3 } from "@/lib/cpeLessons/batch1/part3";
import { lessons as batch1Part4 } from "@/lib/cpeLessons/batch1/part4";
import { lessons as batch2Part1 } from "@/lib/cpeLessons/batch2/part1";
import { lessons as batch2Part2 } from "@/lib/cpeLessons/batch2/part2";
import { lessons as batch2Part3 } from "@/lib/cpeLessons/batch2/part3";
import { lessons as batch2Part4 } from "@/lib/cpeLessons/batch2/part4";
import { lessons as batch3Part1 } from "@/lib/cpeLessons/batch3/part1";
import { lessons as batch3Part2 } from "@/lib/cpeLessons/batch3/part2";
import { lessons as batch3Part3 } from "@/lib/cpeLessons/batch3/part3";
import { lessons as batch3Part4 } from "@/lib/cpeLessons/batch3/part4";
import { lessons as batch4Part1 } from "@/lib/cpeLessons/batch4/part1";
import { lessons as batch4Part2 } from "@/lib/cpeLessons/batch4/part2";
import { lessons as batch4Part3 } from "@/lib/cpeLessons/batch4/part3";
import { lessons as batch4Part4 } from "@/lib/cpeLessons/batch4/part4";
import { lessons as batch5Part1 } from "@/lib/cpeLessons/batch5/part1";
import { lessons as batch5Part2 } from "@/lib/cpeLessons/batch5/part2";
import { lessons as batch5Part3 } from "@/lib/cpeLessons/batch5/part3";
import { lessons as batch5Part4 } from "@/lib/cpeLessons/batch5/part4";
import { lessons as batch6Part1 } from "@/lib/cpeLessons/batch6/part1";
import { lessons as batch6Part2 } from "@/lib/cpeLessons/batch6/part2";
import { lessons as batch6Part3 } from "@/lib/cpeLessons/batch6/part3";
import { lessons as batch6Part4 } from "@/lib/cpeLessons/batch6/part4";
import { lessons as finalLessons } from "@/lib/cpeLessons/final";

export const cpeLessons: Record<string, CpeLesson> = {};
for (const lesson of [
  ...batch1Part1, ...batch1Part2, ...batch1Part3, ...batch1Part4,
  ...batch2Part1, ...batch2Part2, ...batch2Part3, ...batch2Part4,
  ...batch3Part1, ...batch3Part2, ...batch3Part3, ...batch3Part4,
  ...batch4Part1, ...batch4Part2, ...batch4Part3, ...batch4Part4,
  ...batch5Part1, ...batch5Part2, ...batch5Part3, ...batch5Part4,
  ...batch6Part1, ...batch6Part2, ...batch6Part3, ...batch6Part4,
  ...finalLessons,
]) {
  if (cpeLessons[lesson.code]) throw new Error(`Duplicate CPE lesson: ${lesson.code}`);
  cpeLessons[lesson.code] = lesson;
}
