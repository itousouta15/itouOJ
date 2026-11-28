# itouOJ scalability and learning design

## Goal

Improve itouOJ in three deployable phases on its single Ubuntu server: make
judging reliable under load, keep list and ranking reads fast as data grows,
and turn existing answer history into a clear next learning action.

The production host has six CPU cores and 10 GiB of memory. This design keeps
SQLite and does not introduce Redis or another managed service.

## Phase 1: durable judging and submission protection

### Architecture

The web process creates `Submission` rows only. A separate worker process
claims and judges work. `src/lib/judge.ts` becomes a reusable function that
judges one claimed submission; it no longer owns a process-global promise
chain.

The worker repeatedly atomically transitions the oldest `PENDING` row to
`JUDGING`. Only the worker that changes the row owns that submission. A worker
uses an environment-configured concurrency. It defaults to one and deployment
may raise it to two after sandbox load testing; values below one are rejected.

On worker startup, old `JUDGING` rows are returned to `PENDING` before normal
claiming begins. Terminal submissions are never changed. A failed individual
job records `IE` using the existing result contract; an unexpected worker exit
leaves recoverable work for the next service start.

### Submission protection

`POST /api/submissions` enforces:

- per-user submission frequency;
- per-IP submission frequency;
- a maximum number of a user's `PENDING` and `JUDGING` submissions;
- a global pending-work ceiling.

Defaults are 10 submissions per user per minute, 30 per IP per minute, three
active submissions per user, and 100 pending submissions globally. Each value
is an environment setting so the operator can tune it without code changes.

The API returns `429` with a retry hint for rate limits and a clear capacity
message when the queue is full. It returns a queue snapshot (position and work
ahead) for accepted `PENDING` submissions. The existing status page remains
the source of truth; it continues to show `PENDING`, `JUDGING`, and verdicts.

The initial limiter is explicitly single-host because production is a single
server. It is isolated behind a small interface so a Redis-backed implementation
can replace it later without changing submission routes.

### Deployment

Add an npm worker command and a systemd unit template. Deployment starts the
Next.js service and worker separately. The unit runs under the same application
user, loads the same environment file, restarts on failure, and waits for the
sandbox dependency before starting. No server-side action is performed by this
change; the configuration is versioned for the operator to deploy.

### Verification

Tests cover atomic claim behavior, startup recovery, terminal-status safety,
rate-limit responses, per-user pending limits, and queue position calculation.

## Phase 2: scalable reads

### Lists

The problem list and submission history use keyset (cursor) pagination with 30
rows per page. The cursor encodes the stable order key and only navigates
forward/back one page.
Existing query parameters (`tag`, `mine`, and `contest`) are retained and are
included in generated page links. Invalid cursors safely fall back to the first
page.

Problem rows fetch only list-view fields, tags, aggregate submission counts,
and the signed-in user's solved state. Submission rows fetch only row-view
fields. Neither page loads an unbounded list.

### Aggregates

Homepage and ranking aggregates move from application-memory processing of all
accepted submissions to database aggregation. A persisted statistics snapshot
is marked stale after a terminal judgement and rebuilt by the next reader. A
snapshot older than five minutes is rebuilt before it is served, and a missing
snapshot is computed synchronously, so cache absence never changes correctness.

Add the composite SQLite indexes required by the actual cursor and aggregation
filters. All schema changes use Prisma migrations.

### Verification

Seeded large datasets validate cursor boundary behavior, filter preservation,
stable ordering when new rows arrive, aggregate correctness, and expected index
use for the hot queries.

## Phase 3: next learning action and review

### Home experience

For authenticated users, the home page presents one `Next action` card below
the daily problem. Its selection order is:

1. a due code-recognition review;
2. an unfinished course problem;

When neither a due review nor an unfinished course exists, no Next action card
is shown: the existing daily problem remains the single general recommendation.

Unauthenticated home pages do not perform personal queries and retain the
current content. Existing visual tokens, cards, badges, and light/dark themes
are reused.

### Recognition review

Add a review-state record keyed by user and recognition problem. An incorrect
answer sets the item due immediately. A correct review advances the next due
time through 1, 3, 7, and 14-day intervals, then repeats the 14-day interval.
Answer history in `RecognitionAnswer` stays unchanged and remains the audit
record.

The review page shows due items, the next scheduled items, and an empty state.
Programming submissions are not given artificial spaced-repetition scores;
they receive a separate recent non-AC list as an honest review aid.

### Verification

Tests cover creating review state from a wrong answer, interval advancement
after a correct answer, next-action priority, empty states, and no personal
queries for signed-out visitors.

## Delivery order and non-goals

Each phase is independently deployable and verified before the next begins:
durable judging first, scalable reads second, learning experience third.

This work does not add Redis, horizontal application scaling, a new judging
sandbox, automatic explanation generation, or changes to contest scoring.
