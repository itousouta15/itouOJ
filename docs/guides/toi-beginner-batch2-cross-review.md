# Independent TOI beginner batch 2 cross-review — 2026-10-20

Scope: initial independent read-only review of all 45 entries a180–a224 in `src/lib/toiBeginnerLessons/batch2.ts`, against `../tutorial-audit-source/beginner-problems.json`. Both reference languages, statement/input/output matching, traces, complexity, numeric limits and parsing were inspected. A subsequently authorized correction pass changed only that lesson file, `scripts/lib/check-toi-beginner-batch2.py` and this report. No registry, shared script, CI or production files were changed by this pass.

Initially reviewed lesson file SHA-256 (before the fixes below): `99b9b41a2ebdfbdabf0fd8e47008352da67f782b9df1b9d5ff7041627428fad2`.

Source snapshot SHA-256: `5bfd2626a6a6e259ce3e167db65b53aed2f43e755ea7c86523e2502dc14be2c4`.

## Findings

No reproducible wrong-answer counterexample was found within an unambiguous stated input contract during the initial review. All 45 displayed examples match current source samples. No incorrect numeric trace state or material algorithm mismatch was found. The confirmed terminology issue is now fixed, and two parsing ambiguities are handled safely without narrowing the input contract. Numeric-bound ambiguities remain unresolved and must not be presented as established failures on the intended judge domain.

### Fixed — a210: trace terminology incorrectly called the union an intersection

The two trace descriptions said `交集和` (intersection sum). The quantities shown are the **union** of the current row and column, with their crossing counted once.

For the public example, the first-row intersection values would be only `B[0][j] = 0,1,0`; the stated `2,1,1` are the row/column union sums. Both descriptions now use `同列同行去重後的總和`. The formula `row[r]+col[c]-B[r][c]`, numeric trace, flips and both programs are unchanged.

### Fixed defensively — a216: preserve the complete name after the first delimiter

The snapshot says an English name has 1–10 characters and separates the ID and name by one space, but does not explicitly restrict the name to a single token. Previously both programs tokenized all whitespace (`cin >> ID >> name` / `read().split()`).

Conditional probe:

```text
1
40000000A Mary Jane
```

Previously Python output `A: Mary`, discarding `Jane`; multiple students could also misalign subsequent records. Both programs now read one record per line and remove only the first delimiter space between ID and name. They retain internal, leading and trailing name spaces, handle LF/CRLF, and remain compatible with single-token names. This resolves the parsing risk without assuming whether the intended judge includes multi-word names. The stable sort and its faculty/degree keys are unchanged.

The linked original Ceremony PDF could not be opened with the available web reader; its contents were not assumed to resolve the local rewritten statement.

### Unresolved — a187 / a188: missing numeric limits prevent an unrestricted C++ guarantee

- a187 gives no bound on the number of orders or final total, while C++ uses `int total`. With 32-bit int, 268435456 orders of the 8-unit item yield 2147483648, outside that type. This is an analytical bound gap; no enormous input was generated or executed. Ordinary menu selection, exact names, immediate checkout and output formatting were inspected/tested and match the stated rules.
- a188 bounds sales only above by 100 and does not give an item-ID bound. C++ stores IDs in `vector<int>`. If arbitrary integer IDs are intended, a minimal conditional input is `3 / -1 1 -1 / -1 3000000000 -1` (slashes denote newlines); the single item should remain ID 3000000000, which a 32-bit int cannot read. If IDs are intended to fit int, the current code is correct. Adjacent dividers, single-item regions, untouched outside regions and mandatory trailing spaces were checked without finding a defect.

These should be resolved by documenting the intended bounds, rather than claiming that a few normal-sized tests prove arbitrary-size arithmetic safe.

### Fixed defensively — a184: preserve empty S/T lines

a184 states only maximum string lengths, not a positive lower bound. Previously Python could preserve an empty first line but C++ whitespace extraction could not. Both programs now read S and T by line, removing line terminators without skipping empty lines. Empty S yields `X` for every requested target; empty T yields exactly one newline, including when both are empty. LF and CRLF are covered. The leftmost-unused-card algorithm and public sample are unchanged. The time bound is now `O(|S|+|T|+|S||T|)` to retain input/output costs when either string is empty; space remains `O(|S|+|T|)`.

## Authorized correction verification

The export-based batch runner passed all 45 lessons and 10243 Python cases after these corrections, and all 45 exported C++17 programs passed Clang syntax checking with `--compile-only-cxx`. ESLint on the owned lesson file and scoped `git diff --check` also passed. The runner independently checks public samples against `toiBeginnerProblemCatalog`, not against each lesson's own example. New regressions include all three empty-S/T combinations under LF and CRLF, a single `Mary Jane`, multiple records with stable equal-key ordering and names of at most 10 characters, repeated internal spaces, CRLF records, and preservation of spaces after the one ID/name delimiter. Every a184 and a216 regression is also selected for C++ runtime when `--cxx` is supplied; unrelated exhaustive domains retain bounded representative C++ execution.

Runner interface: `python scripts/lib/check-toi-beginner-batch2.py --python PATH [--node PATH] [--cxx PATH [--compile-only-cxx]]`. Compile-only still runs the complete Python suite, then syntax-checks each exported C++17 program; it does not claim C++ runtime verification. The parent integration runs C++ runtime tests in CI because local executable launch is blocked by Windows application policy.

The unchanged shared command `node --import ./scripts/ctf-test-loader.mjs scripts/audit-tutorial-coverage.mjs --source-snapshot ../tutorial-audit-source/all-problems.json` also passed: 771/771 source examples matched and all five course inventories had exact lesson IDs. This is a coverage/contract check, not an independent semantic review of the other batches or a correctness proof; a344 remains a known contradictory source.

## Independent executable evidence

The author's regression cases were not used as the oracle. Read-only, in-memory test adapters loaded the real exported Python programs and ran independently computed expected outputs. No helper scripts or generated programs were saved. Output was compared exactly after normalizing newline encoding, preserving the required trailing spaces for a188/a210 and exact English text elsewhere.

There were 67239 successful comparisons across all 45 lessons: 45 public samples and 67194 independently calculated cases. A handwritten negative-BMR expected value was corrected during review and checked against separate Decimal formulas; the lesson's `-935.30` was correct. This was an oracle correction, not a lesson defect.

| Area | Additional cases and independent method |
| --- | --- |
| a194 | 41860 cases: all legal S=10..100, E=S..100, A=1..10; precomputed overnight event table, first eligible day vs cancellation day |
| a192 | 3279 cases: all 0/1/9 arrays of lengths 1..7; per-cell existence of fences on both sides and direct pest exclusion |
| a193 | 512 cases: every binary 3×3 flag field; build same-color adjacency by Chebyshev distance |
| a196 | 729 cases: every 0/1/5 field of size 2×3; detector-isolation graph, then ask each bomb whether any usable detector covers it |
| a189 | 6561 cases: all a,b,c in 1..3 and all five-card values in 1..3; independent weighted value buckets, including overlapping lucky numbers |
| a221 | 117 cases: N=0..8, E=0..12; optimal-control DP permits every feasible occupied-warehouse count, rather than assuming the greedy choice |
| a222 | 10000 cases: entire declared input domain 0..9999; independent literal string/group transitions, explicit cycle detection and final-digit comparison |
| a204 | 2500 cases: R,C=1..5 and weeks 1..100; physically rotate rows/columns every week rather than using the closed formula |
| a214 | 600 cases: all four rates, values near the affordability threshold; Fraction arithmetic and Decimal ROUND_HALF_UP oracle with the separate <0.05 rule |
| a219 | 1002 cases: all starting balances 0..500 and both starting foods, interval 60; independent event list, including zero/one-dollar wording and first-purchase failure |
| Other boundaries | 34 targeted vectors across the remaining entries: maximum movement, ceiling, two-card repeated shuffle, one shop, repeated/case-sensitive letters, mission failure, zero checkout, adjacent dividers, CRT minimum, group ties, leading zeroes, unchanged IV, 64-bit polynomial coefficient sum, odd-length palindrome, original-map union, stable names, multi-day time wrap, negative BMR, closest reusable cards and immediate combat failure |

All 45 entries were read semantically; most of the larger counts above intentionally concentrate on the riskier finite domains. Unlisted full domains were not exhaustively enumerated. Both C++ and Python were statically inspected, but this pass executed Python only; it does not add a new C++ runtime claim. Browser rendering/animation playback, hidden judge data and production state were not tested or modified.
