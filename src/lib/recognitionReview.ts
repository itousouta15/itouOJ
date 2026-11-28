const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14] as const;

export function nextRecognitionReview(isCorrect: boolean, currentStep: number | null, now = new Date()) {
  if (!isCorrect) return { intervalStep: 0, dueAt: now };
  const intervalStep = Math.min((currentStep ?? -1) + 1, REVIEW_INTERVAL_DAYS.length - 1);
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + REVIEW_INTERVAL_DAYS[intervalStep]);
  return { intervalStep, dueAt };
}
