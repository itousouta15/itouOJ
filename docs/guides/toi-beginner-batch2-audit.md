# TOI beginner batch 2 audit — a180–a224

Audit date: 2026-10-20. Scope: exactly 45 problem-specific lessons, not generic topic examples.

All 45 complete statements and all public examples were read from
../tutorial-audit-source/beginner-problems.json (the sibling live snapshot supplied by the parent).
Samples are supplied by defineToiBeginnerLesson from the live 135-problem catalog; no sample or expected output was changed.
Every lesson has its own parser, explanation, pitfalls, complexity, complete C++17/Python program, and 3–4 trace steps using its first public sample.
Topics follow the actual task; notably a211 uses arrays, a216 stable ordering, and a221/a222 simulation.
No contradictory statement/sample result was found in this assigned range.

## Verification and limits

Final Python case total: **10,233**, comprising **45 public samples + 10,188 additional cases**.
Each public sample is compared as a complete string, including punctuation, line breaks, and required trailing spaces.
Every exported C++17 program passed clang++ -std=c++17 -fsyntax-only after code formatting and include reduction.
C++ executable launches were not attempted on Windows. Linking and runtime equivalence still need the parent's Linux CI.
Sample/representative passes alone are not a claim of exhaustive correctness. Only a222's finite 0–9999 domain was exhaustively checked against the independent implementation.

The regression helper imports the actual exported lessons and live catalog with Node and the existing
scripts/ctf-test-loader.mjs. It does **not** parse TypeScript text or depend on quoted object keys,
so ordinary Prettier formatting is supported. Builder-populated samples are also checked against the catalog.

Python uses one isolated subprocess per lesson, executing the actual exported program with __name__ = "__main__".
Each subprocess has a 30-second bound; all cases for that lesson run inside that bounded process.
Random inputs use a fixed seed. a222's 10,000 cases therefore do not create 10,000 processes.
An additional bounded Node subprocess loads the exports. C++ compilation is sequential and has a 30-second bound per program.
Optional C++ runtime mode runs at most five representative cases per program (three-second bound each), not the exhaustive Python domain.

## Commands

Run from the repository root with Node on PATH:

~~~powershell
& 'C:/Users/Steven/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' scripts/lib/check-toi-beginner-batch2.py --python 'C:/Users/Steven/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' --cxx 'C:/Program Files/LLVM/bin/clang++.exe' --compile-only-cxx
~~~

Linux CI:

~~~sh
python3 scripts/lib/check-toi-beginner-batch2.py --python "$(command -v python3)" --cxx "$(command -v clang++)"
~~~

Omit --cxx for Python-only execution. --node PATH overrides the Node executable.
No JSON input file is required: a read-only Node adapter JSON.stringify's the real lessons/catalog exports.
The helper creates and cleans its own uniquely named temporary directory below scripts/lib.

A direct Node-loader import also confirmed all 45 builder-bound lessons, populated source sample fields, and mobile trace lengths.
No full build or repository-wide tsc was run by this batch.

## Per-code evidence

Every row below passed its one public sample and C++17 syntax/type compilation.
The numeric column counts additional Python input cases, not subprocesses; some cases intentionally contain multiple records.

| Code | Additional cases | Independent/edge evidence |
| --- | ---: | --- |
| a180 | 3 | Unit-step elevator oracle; stationary stops, alternating maximum floors. |
| a181 | 5 | Quotient/remainder oracle; exact division, just-over boundary, S < A, upper magnitudes. |
| a182 | 4 | Follow each original card's destination permutation, rather than rebuilding interleaved halves; N=2/300, repeated shuffles. |
| a183 | 5 | Recipient-based contributions versus donor-based program; one shop, endpoints, equal counts, integer truncation, 30 shops/100 days. |
| a184 | 3 | Independent per-letter queues of original positions; case distinctions, repeated letters, exhaustion. |
| a185 | 2 | One-question and multi-question tests with full/zero/partial scores; multiple students per case. |
| a186 | 3 | Missing/nonconsecutive letters, insufficient targets, singleton map; failure must produce no partial coordinates. |
| a187 | 2 | Empty checkout and all nine exact menu names/prices, including internal spaces. |
| a188 | 3 | Rank positions within each pair of fences; adjacent fences, singleton interval, multiple enclosed regions, outside goods. Required trailing spaces compared exactly. |
| a189 | 4 | Separate reward/loss sums; repeated reward numbers, absent c doubling, negative clamp, coinciding lucky values. |
| a190 | 3 | Exhaustive positive-integer search up to the product of the three moduli, independent of incremental CRT. |
| a191 | 4 | Reverse-string grouping and tuple maximization; equal sums choose largest group, incomplete left group, zero digits. |
| a192 | 5 | Direct existence of left/right fences and distance checks against every pest; no fence, outside pests, blocked adjacency. |
| a193 | 10 | Pairwise Chebyshev-distance comparison, not the program's offset traversal; uniform flags, isolated center, eight seeded grids. |
| a194 | 6 | Previous-day event calendar versus current-day update loop; immediate success, cancellation, success on first holiday (15→40), just-above threshold, long patience. |
| a195 | 3 | Direct-list role swapping versus position map; previously used eagle IDs re-enter queue, N=2000/Q=200. |
| a196 | 12 | Bomb-centric pair-distance oracle versus detector-centric marking; mutual failure, duplicate detection, singleton bomb, eight seeded grids. |
| a197 | 4 | Enumerate all distinct position pairs for maximum square sum; all-zero code, repeated maximum digits, trailing digits included, failure. |
| a198 | 4 | Ratios generated from known 2^d populations, including day zero, unnormalized ratio, and maximum 40950 small-slime ratio count. |
| a199 | 4 | Equality adjustment, zero addend, operand order, R=2147483647; exact formula punctuation. |
| a200 | 6 | Count complete discount thresholds explicitly; 0, 999, 1000, 1999, 2000, 10000 and tie rule. |
| a201 | 2 | All four special words in mixed case plus ordinary initials; one-word input. |
| a202 | 4 | Counter-based frequency keys; zero digit, ten-way tie, 63-bit maximum, different frequency tiers. |
| a203 | 2 | Explicit descending present list; minimum class size and boundary missing seats. |
| a204 | 6 | Physical week-by-week row/column rotations versus closed-form inverse mapping; N=1/100, one row/column, full wraps. |
| a205 | 3 | Unique nonzero tenths-millimeter measurement in morning/night/early morning; first/last day and two-word slot name. |
| a206 | 14 | Materialized complete giveaway schedule; first/last item boundaries in several rounds, N=10000. |
| a207 | 3 | Sum over the full term list for each distinct power; NULL!, repeated powers in one polynomial, coefficient sum beyond 32 bits, maximum power. |
| a208 | 6 | Direct mirrored-pair oracle plus even-length requirement; odd palindrome rejection, case mismatch, valid alphanumeric strings. |
| a209 | 3 | Repeated individual level increments versus multiplication; S<1000, IV=29/30/39/40/45, maximum star dust. |
| a210 | 5 | Explicit set union of row/column coordinates versus row/column sums; intersection deduplication, one cell/row, rectangular grids. Exact trailing spaces included. |
| a211 | 4 | Filter every numbered comment by remainder, rather than striding; base > N and zero remainder mapped to N. |
| a212 | 4 | Inverse-generated Caesar ciphertext; shifts 0/1/7/25, case preservation, punctuation, embedded Love without word boundaries. |
| a213 | 1 | Three days in one input: empty open interval, C=1, and excluded endpoints with valid interior. Exact empty-result sentence. |
| a214 | 8 | Fraction-based rational currency oracle, independent of integer-scaled formula; insufficient/exact funds, tiny positive remainder suppressed, just above 0.05, J/T/E/U output. |
| a215 | 1 | Four rows in one case; each output cell checked against original endpoint pairs, no black cells, lone/unpaired black, all-black row. |
| a216 | 1 | Explicit faculty/degree bucket traversal versus stable sort; identical keys with reversed numeric IDs must keep registration order. |
| a217 | 3 | Sum queried prefixes independently; midnight, multiple days, maximum 20 segments, two-digit zero padding. |
| a218 | 1 | Four people checked with Decimal coefficients, including negative BMR at valid input extremes; exact two decimals. |
| a219 | 8 | Zero/one/plural dollars, exact food price, first purchase failure, alternating stop, time zero and maximum budget. |
| a220 | 4 | Search by increasing distance versus scanning every matching card; missing/repeated numbers and N=200. |
| a221 | 1 | One multi-record input containing 31 warehouse configurations: 24 small N=1..4/E=1..6 verified by DP enumerating every feasible occupied-warehouse count, plus zero/capacity limits and N=E=500. |
| a222 | 10000 | Entire finite input domain N=0..9999; arithmetic concatenation oracle versus string concatenation, cycle detection, grouped leading zeros. |
| a223 | 5 | Independent mirrored-pair checks after replace; preserved leading zeros, odd/even palindrome, singleton, failure. |
| a224 | 4 | Equal power failure, immediate failure, successful chain, 300-monster full clear; later weaker monsters cannot be resumed after failure. |

## Trace review

All traces were checked against their actual first public sample. They retain original coordinates/card positions, and explicitly use the correct rounding, grouping direction, or day boundary.
a194 records day-start heights (15,16,17,22,24,26,34,37,40,40,40,44,58), not hypothetical inputs.
a212's sample shifts from "Px ehox vhwbgz!" to "We love coding!" at k=7; the k=6 trace is "Vd knud bnchmf!".
a221 shows both supplied input records, while maintaining the correct remaining-food sequence for each.
a188 and a210 preserve required final spaces through exact output comparison.

## Owned changes and handoff

- src/lib/toiBeginnerLessons/batch2.ts
- scripts/lib/check-toi-beginner-batch2.py
- docs/guides/toi-beginner-batch2-audit.md

The parent owns registry aggregation, shared coverage/CI, and generic fallback removal.
This batch did not change branches, reset, commit, push, create a PR, deploy, or modify production.

