# Implementation plan: scalability and learning

## Phase 1 — durable judging

1. Extract a claim-safe `judgeSubmission` export and remove request-process
   queue ownership from `src/lib/judge.ts`.
2. Add queue helpers: atomic claim, queue snapshot, stale-claim recovery, and
   active/pending counts.
3. Add `src/worker.ts` and an npm worker command with signal-safe polling.
4. Apply per-user/IP request limits and active/global queue limits in the
   submission route; return queue metadata.
5. Add systemd worker configuration and make deployment restart and verify it.
6. Add focused Node tests for pure queue logic and run lint/build.

## Phase 2 — scalable reads

1. Add cursor parsing/link helpers and use them on problems and submissions.
2. Replace unbounded list reads with page-size-plus-one queries and minimal
   selections.
3. Replace homepage/ranking in-memory accepted-submission aggregation with
   database group-by queries; add only indexes proven necessary.
4. Verify pages with development data and production build.

## Phase 3 — next learning action

1. Add review-state schema and migration, plus interval helper functions.
2. Update recognition answers transactionally with review state.
3. Add a review page and navigation entry.
4. Add authenticated home-page next-action selection with due review, course,
   then public-problem priority.
5. Add empty/error states and verify lint/build.
