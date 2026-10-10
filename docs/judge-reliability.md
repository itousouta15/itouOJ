# Distributed judging: coordinator and remote executors

## Execution architecture

The **Next server is the coordinator** and sole database owner. Remote executors
claim jobs over authenticated HTTPS, receive code/test cases/resource limits,
execute on **their own `SANDBOX_URL`**, heartbeat the lease, and return results.
They neither connect to nor copy the database. Two hosts with two sandboxes add
real execution capacity; one serial executor process per sandbox is the default.

`src/lib/judgeCore.ts` implements output comparison, early-stop per group, subtask
scoring, compile-handle reuse and compile errors. Both remote executors and the
existing embedded judge call this same core. `judgeJob.ts` explicitly projects
only required execution data using one database snapshot for size checks and
payload reads. No user profile, problem statement or PDF is sent.
`judgeEmbeddedWorker.ts` applies the same transactional job-digest fencing to
embedded execution, including recovered recognition submissions.

The existing `POST ?action=work`, `npm run judge:worker` HTTP poller and
`deploy/online-judge-worker.service` remain compatible: they ask Next to execute
locally. Development still starts its embedded judge automatically. Embedded and
remote executors can compete safely for the same jobs. For exclusively remote
judging, stop the old production poller; keep Next running for API coordination.

## Reliability guarantees

`Submission` remains the durable queue; no migration or new dependency is needed.
`judgeClaimId` is a random per-attempt fencing token. `judgeClaimedAt` is the last
successful heartbeat, not the original start time.

- Conditional `PENDING -> JUDGING` updates atomically claim work. Losing workers
  retry selection. SQLite lock/timeouts have bounded jittered retries.
- Leases last **15 minutes** with a serialized **30-second heartbeat**. Only the
  coordinator's clock matters. Heartbeats continue while compile/execute awaits
  the sandbox and while completion is being delivered.
- Each claim/work request recovers expired or legacy unleased jobs. `recover`
  also remains available explicitly. Recovery needs an active poller/executor.
- An expired/replaced claim cannot heartbeat, release, or apply results, even
  before recovery. Lease loss aborts the remote HTTP sandbox request and stops
  additional tests/result application. Sandbox-side cancellation is best-effort:
  an already-running native process may continue until its own timeout.
- Verdict, metrics, diagnostics, score and all test results commit together.
  Results are buffered until completion; no per-test progress is persisted.
- The winning token is retained. Duplicate completion returns `duplicate` and
  never rewrites rows, even if the repeated valid payload conflicts. A new claim
  receives a new token. The executor retries lost completion acknowledgements
  three times using the **same token and payload**.
- The job digest covers the immutable-in-transit payload. Completion reloads it,
  compares the digest, validates test IDs/order/group prefixes and derives the
  expected verdict/score/max metrics **inside the result transaction**. Concurrent
  problem edits cannot race between validation and commit. Changed jobs return
  409, including edits that exceed protocol limits; the worker releases its
  still-owned claim and starts over. Embedded execution also releases changed jobs.

This is at-least-once execution with idempotent result application. A lost claim
response can leave an orphaned lease until expiry. No claim-request deduplication,
durable attempt history, dead-letter queue, worker registry or global scheduler
is included. Repeated sandbox failures release jobs and back off; remove unhealthy
workers rather than allowing them to repeatedly claim the oldest submission.

## Launch on additional hosts

Use matching itouOJ revisions on the coordinator and executor hosts. Install the
existing dependencies with `npm ci` (including TypeScript: this first version
uses the repository's existing TS loader). The remote import path does not load
Next, Prisma's runtime, `db.ts`, dotenv, or a database. No `DATABASE_URL` is needed
on executor hosts. Start/configure each sandbox separately using its existing
deployment procedure.

On the coordinator, provision `JUDGE_WORKER_SECRET`, build, and run `npm start`.
On **each remote host**, provision the same secret in the process environment:

```powershell
$env:JUDGE_WORKER_URL = 'https://oj.example.org'
$env:JUDGE_WORKER_ID = 'judge-host-a' # optional; defaults to hostname:PID
$env:SANDBOX_URL = 'http://127.0.0.1:8090'
# JUDGE_WORKER_SECRET must already be provisioned securely.
npm run judge:remote
```

Run another host with ID `judge-host-b` and its own local sandbox. For local
multi-process testing, use distinct sandbox ports such as 8090 and 8092. Do not
use `JUDGE_WORKER_CONCURRENCY` for remote executors: each process handles one job
at a time, with a process-local sandbox admission queue. Multiple processes
pointed at the same sandbox do not add capacity and can overload it.
Both worker launchers reject non-HTTPS coordinator URLs except for loopback
HTTP (`localhost`, `127.0.0.0/8`, or `::1`). URLs containing credentials are rejected.

An optional `deploy/online-judge-remote@.service` template launches a remote
instance. Its environment file `/etc/online-judge/remote-<instance>.env` supplies
the three connection variables above. It is separate from the unchanged local
systemd worker. SIGINT/SIGTERM stops new claims and drains the current job; the
example service force-stops after 120 seconds, after which the lease expires
normally. Application-managed retries use a 1–30 second backoff; idle polls are
500 ms. Each protocol request has a 20-second transport timeout.

Stop/drain old execution processes before rollout: older versions do not enforce
the new completion rules. Configure proxies to allow 16 MiB completion bodies
and at least the protocol timeouts. The coordinator must remain a long-running
Node deployment with its SQLite database on local persistent storage.

## Protocol v1

All operations are **POST** to `/api/internal/judge?action=<action>`, authorized
by `x-judge-worker-secret`. Remote operations require `Content-Type:
application/json`. Every response is `Cache-Control: no-store, private`.
Unauthenticated requests receive 404; there are no public job/test-data routes.

| Action | Request | Successful response |
| --- | --- | --- |
| `claim` | `{ "workerId": "host-a:1" }` | `{ protocolVersion: 1, claim: { submissionId, claimId }, job, jobDigest, leaseMs, heartbeatMs }`, or `{ protocolVersion: 1, claim: null }` |
| `heartbeat` | `{ submissionId, claimId }` | `{ renewed: true, leaseMs, heartbeatMs }` |
| `complete` | `{ submissionId, claimId, jobDigest, outcome: { result, tests } }` | `{ outcome: "applied" \| "duplicate" }` |
| `fail` | `{ submissionId, claimId, retryable, reason }` | `{ outcome: "released" }` when retryable; otherwise idempotent IE completion |
| `status` | empty/object | queue counts, timing and capped active lease list |
| `recover` | empty/object | `{ recovered }` |
| `work` | empty/object | legacy `{ submissionId, processed }` |

`reason` is one of `sandbox_unavailable`, `worker_error`, `shutdown`. Workers send
only a reason code, not arbitrary error text. Retryable failures release only a
live owned claim; repeating release after it is gone returns 409. Terminal fail
stores a fixed IE message and supports duplicate acknowledgement. Native sandbox
transport failures use retryable fail; compilation failures use CE completion.

`job` contains protocol version, submission ID, language/source, base resource
limits, recognition grading data if relevant, and ordered groups with points,
comparison mode, subtask order and `{ id, input, output }` tests. The worker
applies the shared language multipliers. Compiled handles stay inside one job
and one sandbox; they are never sent to the coordinator.

`result` has status (`AC|WA|TLE|MLE|RE|CE|IE`), nullable/optional score, timeMs,
memoryKb and compileError. `tests` contain order, subtaskOrder, verdict, timeMs,
memoryKb, testCaseId, actualOutput. Test time/memory values are also nullable when
measurements are unavailable. Unknown fields, invalid numbers, invalid UUIDs,
foreign/duplicate/misordered test cases, missing required tests or inconsistent
summary fields are rejected. The first failure terminates each group; other
groups must still be represented. CE/IE outcomes contain no test rows.

HTTP 400 = invalid JSON/schema; 413 = body limit; 415 = content type; 422 = invalid
result/job limits; 409 = stale lease or changed payload; 503 = coordinator/storage
failure. Invalid completion leaves the verdict and existing test rows unchanged.
An oversized/unsupported job representation is marked IE when claimed so it does
not poison the queue indefinitely.

### Native execution reports and legacy fallback

`sandboxProtocol.ts` accepts the sibling itouSandbox `execution_report` schema 1.
It validates stage status/cause pairs, compile/start/run relationships, wait/OOM
evidence, and agreement with the Piston-shaped code, signal and measurement
fields. Unknown report versions or contradictory reports are infrastructure
errors; they never silently fall back to legacy grading. The validated run
evidence travels on the normalized `run` phase, so the existing
`runVerdict(result.run, ...)` API and its `judge.ts` re-export remain compatible.

| Schema-1 evidence | OJ handling |
| --- | --- |
| Successful exit | Normal output comparison |
| Ordinary nonzero exit, including 124/139; SIGSEGV/SIGSYS and other attributed signals | RE |
| `wall_timeout` after an exec attempt | TLE, including when OOM evidence also exists |
| `oom_kill`, SIGKILL and a positive OOM-kill counter | MLE, without inferring the cause from elapsed time |
| SIGKILL without timeout/OOM attribution | Infrastructure error |
| Bootstrap/exec failure, missing metadata, launcher/supervisor failure | Infrastructure error |
| Reported compilation failure | CE, even if the compiler exited zero before a descendant triggered the supervisor timeout |
| Compiler launcher failure or compiler exit 127 | Infrastructure error; schema 1 cannot distinguish compiler exec failure from exit 127 |

Remote workers release/retry infrastructure errors; embedded execution records
IE and `/api/run` returns an execution-service error. Startup timeouts are also
infrastructure errors, rather than student TLE, when the report marks startup
failed. The sandbox's `exec_attempted` stage is not proof of a separately observed
successful exec; OJ retains the report's available attribution.

Unavailable CPU/memory/wall measurements remain `null`, not measured zeros.
The existing `timeMs` duration prefers measured CPU, then wall time; it is null
if neither is available. Raw CPU remains null when wall time is used. Missing
memory stays null in test rows and summary; a maximum is unknown if any executed
test lacks that measurement. A genuinely measured CPU zero remains zero.

With **no report**, the bundled older `sandbox-runner` protocol remains supported:
normal output/nonzero-exit/compile-error behavior is preserved, including compile
failure responses without a run phase. The historical SIGKILL heuristic remains
TLE when CPU or wall time reaches the limit, otherwise MLE. This is explicitly a
legacy compatibility heuristic: those replies cannot disambiguate overloaded
exit/signal mappings or prove OOM, and older CPU fields may alias wall time. A
legacy `run.code = -1` without a signal is an infrastructure failure. These
heuristics are never used for schema-1 replies.

### Bounds and trust

- Claim/heartbeat/fail bodies: 2 KiB. Completion body: 16 MiB, enforced while
  streaming even without Content-Length. Body-read timeout: 15 seconds.
- Job JSON: 16 MiB, source up to 100,000 characters, at most 1,000 tests/100 groups.
  Database test/source byte totals are checked before loading full strings.
- Base time limit: 1–60,000 ms; memory: 1–4,096 MiB. Normal configured problem
  limits are narrower; language multipliers still apply.
- Test stdout stored: 4,000 characters plus truncation notice; protocol maximum
  4,096 characters. Each stored output is also capped at 12,000 serialized JSON
  bytes so escaped control characters cannot overflow a 1,000-test completion.
  Compile diagnostics: 16,000 characters. Numeric result fields
  are nonnegative 32-bit integers. Serialized UTF-8/JSON byte limits still apply.
- Sandbox responses: 32 MiB; redirects are rejected. Sandbox HTTP errors do not
  echo response bodies into diagnostics. No worker secret is sent to the sandbox.
  Execution phases and metrics are validated before grading; malformed exit codes
  cannot become false CE/RE verdicts. Legacy compile-error responses may omit the
  run phase, and legacy compiled binaries are retained when not echoed on reuse.
- Worker ID: 1–128 letters/digits/underscore/dot/colon/hyphen. Status lists at
  most 100 active leases and exposes no source, hidden tests or claim tokens.

Executors are **trusted grading infrastructure**. Possession of the shared
secret grants access to hidden test cases and coordination operations. Use HTTPS
across hosts; do not expose the sandbox API publicly. Validation proves payload
shape/consistency and ownership, not that a compromised worker actually ran the
code. Per-worker credentials/revocation, attestation and redundant judging are
not implemented. Multiple coordinator processes must use the same local SQLite
file; remote executors need only HTTPS. Do not share SQLite over NFS/SMB.

## Status and logs

### Admin monitoring page

Sign in as an administrator and open **管理 → 評測監控** (`/admin/judge`), also
linked from the problem-management navigation. The page shows pending/judging
counts, expired or unleased work, oldest pending age, lease/heartbeat timing, and
at most 100 active submission leases with heartbeat age and expiry status.

The page and `GET /api/admin/judge` use the existing application session and
current database role. Every refresh rechecks administrator authorization.
Worker credentials and client-supplied role headers do not authorize this route.
An explicit response allowlist excludes claim tokens, code, tests and secrets;
the browser does not receive or send `JUDGE_WORKER_SECRET`. Responses are private,
non-cacheable and vary by cookie. Reading the monitor does not recover or mutate
jobs.

The client provides immediate refresh, optional serialized five-second polling,
a ten-second request timeout, initial loading/empty states and retryable errors.
Network failures retain the last successful snapshot with an explicit stale-data
message. Losing admin access clears that snapshot and stops automatic polling.
Expiry is calculated against the coordinator's sample time, not the browser's
clock. Counts remain a best-effort concurrent snapshot; this is a job-lease view,
not an online worker-host registry.

`scripts/test-judge-monitor.mjs` checks anonymous/non-admin and forged-header
denial before queue access, current-role demotion, real queue expiry/unleased
states, read-only behavior, capped/allowlisted output, navigation visibility and
sanitized storage/auth errors.

### Internal worker status

```powershell
Invoke-RestMethod -Method Post `
  -Uri "$env:JUDGE_WORKER_URL/api/internal/judge?action=status" `
  -Headers @{ 'x-judge-worker-secret' = $env:JUDGE_WORKER_SECRET }
```

Status reports pending, judging, expired, oldestPendingAgeMs, sampledAt, leaseMs,
heartbeatMs and up to 100 submission IDs with heartbeat/expiry timestamps.
Counts are a best-effort concurrent snapshot. Watch growing oldest pending age,
unrecovered expired jobs, repeated releases and failed completion delivery.

JSON logs include `judge.claimed`, `judge.recovered`,
`judge.completion.applied|duplicate|stale`, `judge.heartbeat_lost`,
`judge.remote.assigned|started|completed|released|failed`, and
`judge.protocol.failed`. Assignment logs correlate worker IDs to fencing tokens.
No code, input, expected output or secret is logged by the protocol/executor.
Forward stdout/stderr to the existing log collector.

## Opt-in native remote-judging staging

Run from **Windows Node in itouOJ**, with installed repository dependencies and
the sibling itouSandbox checkout present:

```powershell
# Without --run, the command only prints usage.
npm run test:judge:staging -- --run
```

The default distro is `Ubuntu-24.04`. WSL must permit root execution, have
`cc`/`gcc`/`g++`, static libc, libseccomp headers/library, `unshare`, `mount` and
`umount`, and already have `cpu memory pids` delegated at the cgroup v2 root.
The harness checks this delegation rather than changing host-root controllers.
The existing `<Windows OS temp>/opencode` parent must exist. cJSON/microhttpd
headers and libraries default to its `itou-observe-deps/usr` directory.

Optional path arguments are Windows paths; the launcher translates them with
`wslpath` using the selected distro:

```powershell
npm run test:judge:staging -- --run --distro Ubuntu-24.04 `
  --sandbox-source C:\Users\kuora\repo\itouSeries\itouSandbox `
  --deps C:\Users\kuora\AppData\Local\Temp\opencode\itou-observe-deps\usr

# Optional: retain a JSON summary at a NEW file in an existing directory.
npm run test:judge:staging -- --run --report artifacts\judge-staging-run.json
```

`scripts/stage-judge-native.mjs` runs the **real coordinator protocol handler**
over a new Windows loopback HTTP port with an isolated on-disk SQLite database.
It spawns the actual `judge-remote-worker.mjs` entry point four times across the
scenarios, giving workers an unusable database URL and a fresh synthetic secret.
No fixture execution responses or mocked execution functions are used.

`scripts/lib/judge-native-staging.py` builds two copies of the sibling's C server
and jail from read-only source paths, with distinct reserved loopback `PORT`
overrides and private `CGROUP_PARENT` overrides. Port 8090 is refused. A private
cgroup subtree contains the servers, compilers and jail descendants, capped at
1 GiB, no swap, and 256 processes. Native scratch and compiler `TMPDIR` live on a
256 MiB tmpfs mounted under the owned temporary directory in a private mount
namespace. This avoids DrvFS compilation delays without modifying shared mounts.
The launcher waits for WSL loopback forwarding before sending any execution POST.

The fixed C/C++ corpus proves:

- Two actual jailed programs active simultaneously on different native servers.
- Heartbeats preserving four-second executions beyond a three-second staging
  lease (the production 15-minute lease is unchanged).
- AC for C stdin and C++, plus WA, CE, TLE, ordinary exit 124/139 as RE, genuine
  SIGSEGV as RE, and native cgroup OOM as MLE.
- Killing a remote Node process **during a native jailed run**, waiting for real
  lease expiry, then automatic recovery by a new worker on the other sandbox.
- A new fencing token, rejection of the killed worker's old completion, exactly
  one persisted test result, and an empty queue after completion.

Normal completion, failures, controller EOF and handled termination run owned
resource cleanup. The helper kills its exclusive cgroup subtree (including
orphaned subprocesses), waits for it to drain, reaps servers, removes cgroups,
unmounts tmpfs and removes scratch. Node reaps its workers and removes its fresh
database after closing the coordinator. Incomplete cleanup fails the command.
The final `staging.passed` JSON includes verdicts, timing, recovery assertions and
cleanup evidence; `--report` uses exclusive creation and never overwrites a file.

### Native staging evidence

The final run passed **12/12 submission scenarios in 61.447 seconds**, using two
native WSL sandboxes and four actual remote-worker processes. Both simultaneous
native runs were observed, both long jobs outlived their initial leases, and the
killed job was recovered with stale completion returning HTTP 409. AC/WA/CE/TLE/
RE/MLE all matched expected outcomes. Final cleanup reported all of:
`privateCgroupRemoved`, `privateMountRemoved`, `scratchRemoved`, `serversReaped`,
`databaseRemoved`, and `remoteWorkersReaped` as true, with no cleanup errors.
The opt-in guard was also exercised without `--run` and printed usage only.

Scope: this exercises the coordinator protocol with the real Prisma adapter and
native execution on one Windows/WSL machine. It does not start a full Next HTTP
server, exercise browser sessions end-to-end, deploy services, validate
network-separated HTTPS hosts, or cover Python/JavaScript native runtimes. The
normal unit/integration suite and isolated Next build cover the application
authorization wiring and page compilation separately.

## Verification

When the sibling itouSandbox checkout is available, verify its actual captured
HTTP responses against the OJ parser and verdict logic:

```text
node --import ./scripts/ctf-test-loader.mjs scripts/check-sandbox-fixtures.mjs ../itouSandbox/test/fixtures/http
```

This offline cross-repository check uses twelve responses from real C/C++ jail
executions, including compilation errors, exit-code collisions, SIGSEGV, seccomp,
timeout and OOM. It preserves actual nullable/measured fields; it does not start
a server or replace the native live tests documented in itouSandbox.

The cross-repository check passed all **12/12** captured responses on 2026-10-10;
the checker also passed ESLint. Both compiler CPU and memory remained null, and
AC/CE/RE/TLE/MLE outcomes matched the independently specified corpus expectations.

```text
npm run test:judge
npx tsc --noEmit --incremental false
npx eslint src/lib/judge.ts src/lib/judgeQueue.ts src/lib/judgeCore.ts src/lib/judgeJob.ts src/lib/judgeWire.ts src/lib/judgeProtocol.ts src/lib/judgeRemoteWorker.ts src/lib/judgeEmbeddedWorker.ts src/lib/judgeCoordinatorUrl.mjs src/lib/sandbox.ts src/lib/sandboxProtocol.ts src/app/api/internal/judge/route.ts src/app/api/run/route.ts scripts/judge-worker.mjs scripts/judge-remote-worker.mjs scripts/test-judge-queue.mjs scripts/test-judge-remote.mjs scripts/lib/judge-claim-worker.mjs scripts/lib/judge-test-fixture.mjs scripts/lib/judge-native-fixtures.mjs scripts/verify-judge-build.mjs
npx eslint src/components/SubmitPanel.tsx
npx eslint src/lib/judgeMonitor.ts src/lib/navLinks.ts src/app/api/admin/judge/route.ts src/app/admin/judge/page.tsx src/app/admin/problems/page.tsx src/components/AdminJudgeMonitor.tsx scripts/test-judge-monitor.mjs scripts/stage-judge-native.mjs
node scripts/verify-judge-build.mjs
```

Queue tests use isolated on-disk SQLite and the installed Prisma adapter. Remote
integration tests run the real protocol handler over HTTP and spawn two actual
Node executor processes with different mock sandbox servers and an unusable
DATABASE_URL. They prove independent concurrent execution, heartbeat extension,
kill/reclaim, stale rejection, heartbeat-loss cancellation, lost-ack duplicate
completion, protocol auth/limits, changed-job fencing and failure release.
Shared-core tests cover scoring, early-stop, first-line mode, compile caching and
CE. Review regressions additionally cover embedded edit fencing, null recognition
answers, edits beyond job limits, legacy binary reuse without echoes, escaped
output bounds, malformed sandbox responses and HTTPS enforcement. Test databases
live under `<OS temp>/opencode`; worker threads close before fixture cleanup.
`scripts/lib/judge-native-fixtures.mjs` independently spells out representative
wire replies from the C server's response-building functions; these are not live
captures. Tests cover nullable counters, measured zero, schema/evidence conflicts,
exit 124/139 versus real signals, timeout/OOM attribution, startup/unknown failures,
compile stage failures and legacy fallback. Two real remote-worker processes in
separate tests consume these native-shaped responses over loopback HTTP, proving
successful completion with null metrics and release on bootstrap failure.
These fixture-based checks are complemented by the opt-in native staging command
above, which performs real C/C++ compilation and jailed execution.

The isolated build script copies an allowlist of source/config files into
`<OS temp>/opencode/itouoj-build-*`, links installed dependencies, constructs a
fresh empty database from schema SQL, and runs `next build --webpack` with an
allowlisted OS environment and synthetic test configuration. It never copies
`.env`, real databases, uploads or `.next`; it cleans its workspace on completion.
The temp parent must already exist. If externally interrupted, the printed owned
directory can be passed as an argument to resume using its build cache.

### Verified results after the monitoring/staging milestone

- `npm run test:judge`: **51 passed, 0 failed, 0 skipped**, 42.777 seconds.
- `npm run test:judge:staging -- --run`: **12/12 real native submission scenarios
  passed**, including concurrent execution, heartbeat extension, kill/recovery,
  stale fencing and verified cleanup; 61.447 seconds.
- `npx tsc --noEmit --incremental false`: passed with no diagnostics.
- The targeted ESLint commands above: passed with no diagnostics.
- Isolated `next build --webpack`: passed compilation, TypeScript, page data,
  **50/50** static pages and build tracing on a fresh isolated snapshot containing
  `/admin/judge` and `/api/admin/judge`. Next emitted a workspace-root/multiple-lockfile warning
  caused by the temporary parent directory's lockfile.
- Judge-file `git diff --check`: passed; only LF/CRLF notices.
- Network-separated hosts, deployment and commits: not performed. Native staging
  used private local WSL sandboxes; no production data or configuration was read.
