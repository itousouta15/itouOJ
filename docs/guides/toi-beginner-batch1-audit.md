# TOI beginner batch 1 audit

Reviewed all full statements, input/output contracts, restrictions and public samples in `../tutorial-audit-source/beginner-problems.json` (the supplied 2026-10-20 live snapshot). Read the project AGENTS.md, lesson types, builder and public catalog before implementation. Scope: a087–a107 and a156–a179, 45 problems. a086 belongs to the parent.

Each exported lesson has its own algorithm, three explanatory paragraphs, pitfalls, complexity, complete standalone C++17/Python stdin/stdout programs, and three animation steps derived from that problem's actual first public sample. The builder supplies unchanged public sample strings. Topics follow the actual statements rather than the earlier curriculum grouping. All 45 lesson identities and public sample references passed the parent's exact-lesson verifier.

## Verification evidence

Final scoped ESLint checks passed for the lesson file and batch verifier. The parent's exact-lesson validator passed all 45 assigned IDs after formatting. No full repository build or type-check was run by this batch.

All 45 public samples passed the actual exported Python programs. The batch script additionally checks independent oracles and representative boundaries: **288 distinct deterministic cases passed**. Initial full run: 256 cases and all 45 C++17 object compilations. A subsequent targeted run for a156, a171, a175 and a177 passed 46 cases, including 32 newly added cases (14 repeat cases). Thus there are 288 distinct cases, rather than 302 distinct cases. TypeScript lessons did not change between these runtime runs.

All 45 C++17 programs compiled with the supplied clang++ using `-std=c++17 -O2 -c`. No C++ executable was launched on Windows, and no App Control bypass was attempted. C++ runtime equivalence remains for Linux CI; compilation and Python tests do not establish exhaustive correctness. Compilation products were written to an OS temporary directory and removed in `finally`. No generated sources, objects, executables, or test-output files were placed in the repository.

The script imports the actual exported lessons, not copied test implementations. It checks exact IDs, the bundled catalog, optional live-source sample equality, nonempty explanations/trace frames, 3–6-frame bounds, and source program presence. Each Python run has a 10-second timeout; each compiler run has a 30-second timeout. Case generation is bounded below 400 cases, sequential, and deterministic. Output comparison preserves meaningful spaces (including airport-name leading/internal/trailing spaces); only CRLF and the final newline are normalized.

Run from the repository root:

```powershell
node --import ./scripts/ctf-test-loader.mjs scripts/lib/check-toi-beginner-batch1.mjs --python 'C:/Users/Steven/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' --cxx 'C:/Program Files/LLVM/bin/clang++.exe' --compile-only-cxx --source ../tutorial-audit-source/beginner-problems.json
```

For Linux CI, use the same script with `--python python3 --cxx g++` and omit `--compile-only-cxx` to run both languages against all cases. The optional `--source PATH` compares to a supplied snapshot; offline CI may omit it. `--codes a156,a171,a175,a177` selects a bounded subset. Without `--python`, the script only validates structure and prepares oracle cases; it clearly prints `prepared`, not `PASS`.

## Per-code coverage

Every row below includes the real public sample, passed Python checks, and successful C++17 compilation. Counts are distinct cases in the final script, including the public sample. The named additional checks describe coverage, not a proof over all possible inputs.

| Code | Topic               | Cases | Additional coverage                                                                                                           |
| ---- | ------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------- |
| a087 | grid                |     4 | Two-cell horizontal/vertical maps; valid serpentine path with upward travel; sample's disconnected black cell                 |
| a088 | count-frequency     |     3 | Different item types cannot cancel; exact delivery with duplicate items                                                       |
| a089 | text                |    12 | Naive contiguous-slice oracle on 8 deterministic sequences; whole sequence, missing target; N=10000/M=5000 repetitive failure |
| a090 | conditions          |    10 | All A/B/C/D/E/F/G/H/X prize branches with distinct legal numbers                                                              |
| a091 | count-frequency     |     4 | Only drinks, only cakes, all items paired                                                                                     |
| a092 | conditions          |     4 | Inclusive temperature/time starts, excluded 10/16-hour endpoints, zero/two discounts                                          |
| a093 | number-theory       |    10 | Enumerate every proper divisor for 8 small prime/composite/square/perfect numbers; N=10^9                                     |
| a094 | number-theory       |     4 | N=M, exact upper power included, M=2×10^9 without overflow                                                                    |
| a095 | count-frequency     |     3 | Repeated choices count once per student, reset deduplication for next student, unchosen club                                  |
| a096 | search-optimization |     9 | 8 independent enumerations of all 55 schedules with per-night accommodation accumulation                                      |
| a097 | number-theory       |    10 | Brute prime and explicit power lists at 1/2/4/8/25/27/64/125; N=10^6                                                          |
| a098 | arrays              |     3 | Unique minimum moves right; rightmost repeated minimum moves left; indirect one-based lookup                                  |
| a099 | conditions          |     2 | All public A/B/D/E/F/X outcomes; zero override, equal thresholds, exact thresholds, grade C not separately generated          |
| a100 | read-calculate      |     3 | Same servings, scale down, exact divisibility and upward rounding                                                             |
| a101 | count-frequency     |     2 | All 13 ranks in one suit; 10 is a full rank token; all four suits in sample                                                   |
| a102 | grid                |     3 | 1×1 seam duplication, asymmetric width/height, asymmetric row reflection                                                      |
| a103 | grid                |     3 | Case mismatch/absent query; exact NA query; row-major coordinate output                                                       |
| a104 | conditions          |     6 | N=10/11/20/21/40/41; half-up rounding in public sample; monthly cap                                                           |
| a105 | read-calculate      |     3 | Smallest input; maximum masses and radius with exact integer division                                                         |
| a106 | text                |     3 | Leading/internal/trailing name spaces, last-record match, embedded spaces in sample                                           |
| a107 | grid                |    12 | Independent endpoint-pair oracle on 8 tiny boards; case folding, one-letter, absent, endpoint tie-breaking                    |
| a156 | grid                |    11 | Every-peer row/column oracle on 8 distinct-valued matrices; missing saddle, zero-based output                                 |
| a157 | read-calculate      |     3 | Dropoff at18 excludes surcharge; last22–23 period; incomplete delay pair                                                      |
| a158 | search-optimization |    11 | Enumerate all doubled-axis candidates independently on 8 point sets; single point, missing mirror, half-integer axis          |
| a159 | arrays              |     3 | Truncated average, zero transfer for all equal; **nonconstant tied extrema remain unspecified**                               |
| a160 | arrays              |    13 | Independent nearest-neighbor ordering on 8 arrays; left/right shortage, one stone, absorb all                                 |
| a161 | simulation          |    11 | Independent per-second countdown model on 8 sequences; all-down, revival at13, no lifetime rescoring                          |
| a162 | count-frequency     |    11 | Independent unit-by-unit right-to-left cyclic distribution on 8 cases; case folding, remainder direction                      |
| a163 | arrays              |    11 | Independent check of every intervening building on 8 arrays; equal blockers, endpoint home, no visible buildings              |
| a164 | search-optimization |     3 | Maximum coordinate difference; explicit Euclidean-versus-Manhattan counterexample                                             |
| a165 | simulation          |     4 | Zero workers, exactly first factory, surplus, partially staffed second factory in sample                                      |
| a166 | simulation          |     3 | Public moving-position chain, range/speed equality, fast ball at same position yields -15, outside zero radius                |
| a167 | search-optimization |    12 | Independent continuous segment-overlap oracle at half-unit offsets on 8 cases; one-cell fit, oversized tooth/block            |
| a168 | simulation          |     3 | Vegetarian consumes a turn; vegetarian-only restaurant; uneven menu lengths                                                   |
| a169 | read-calculate      |     4 | Negative and positive wrap on 36-hour day, full-day offset, zero-padded minutes/seconds                                       |
| a170 | arrays              |     2 | Separate height/weight rows; minimum product differs from minimum height                                                      |
| a171 | simulation          |    11 | Independently enumerate all downhill paths on 8 profiles; left/right endpoints and plateaus                                   |
| a172 | number-theory       |    12 | Independent reachability DP on 8 cases; gcd divisibility not sufficient; equal jumps; zero use of one jump                    |
| a173 | grid                |    11 | Independent full-grid Manhattan-neighbor scan on 8 grids; no cascade, no neighbors, exclude original zeros                    |
| a174 | count-frequency     |     3 | Alphabetical tie order, one distinct letter, multiple frequency groups                                                        |
| a175 | conditions          |    12 | Independent branch-based comparator on 8 lists; tied key preserves earliest original value; both remainder rules              |
| a176 | arrays              |     3 | Exactly100 days, no-overdue single-line output, book-ID sorting, total fine                                                   |
| a177 | text                |    12 | Independent regex segment-token oracle on 8 strings; consecutive signs, no signs, trailing empty segment                      |
| a178 | conditions          |     3 | Equal count or equal height sum both reject; two strict inequalities in sample                                                |
| a179 | count-frequency     |     3 | Leading zeros; folder boundary000/009/010; maximum folder99                                                                   |

## Source ambiguity requiring parent awareness

a159 does not define the choice among tied original maximum/minimum boxes and does not guarantee unique extrema. This is a specification gap, not a reason to alter expected outputs. For this legal-looking input:

```text
3
0 0 9
```

The truncated average is3 and the transfer is6. Selecting the first original minimum gives `6 0 3`; selecting the second gives `0 6 3`. Both follow the published rule of transferring into an originally least-full box. The lesson explicitly states its first-occurrence convention, and the tests do not label either tied result as the official answer. Unique-extreme cases and the all-equal zero-transfer case are verified. Parent should seek the intended tie rule or flag the specification gap; do not represent sample success as proof that this ambiguity is solved.

## Owned changes

- `src/lib/toiBeginnerLessons/batch1.ts`
- `scripts/lib/check-toi-beginner-batch1.mjs`
- `docs/guides/toi-beginner-batch1-audit.md`

No registry, shared curriculum, CI, general test, a086, branch, commit, PR, deployment, or production changes were made by this batch.
