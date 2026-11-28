# TOI beginner batch 3 audit — a225–a268

Audited 2026-10-20 against the complete, freshly fetched statements in
`../tutorial-audit-source/beginner-problems.json`, not the old curriculum groups.
All 44 statements were read in full, including input ordering, restrictions,
termination rules and output formatting. Public samples come from
`src/lib/toiBeginnerProblemCatalog.ts` through `defineToiBeginnerLesson`; no public
input or expected output was edited. Each exported lesson has its own explanation,
pitfall, complexity, complete C++17 and Python program, and 3–4 sample-specific trace
frames. The trace helper only constructs UI frames, not shared topic solutions.

## Files and verification entry point

Owned files:

- `src/lib/toiBeginnerLessons/batch3.ts`
- `scripts/lib/check-toi-beginner-batch3.py`
- `docs/guides/toi-beginner-batch3-audit.md`

No shared registry, CI, general checker or a086 changes are part of this batch.

Run from the repository root (substitute interpreter paths on Linux):

```powershell
& 'C:/Users/Steven/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' scripts/lib/check-toi-beginner-batch3.py --python 'C:/Users/Steven/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' --source-json ../tutorial-audit-source/beginner-problems.json

& 'C:/Users/Steven/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' scripts/lib/check-toi-beginner-batch3.py --python 'C:/Users/Steven/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' --cxx 'C:/Program Files/LLVM/bin/clang++.exe' --compile-only-cxx
```

CI example:

```sh
python3 scripts/lib/check-toi-beginner-batch3.py --python python3 --cxx clang++
```

Default loading executes the real batch and catalog exports with
`node --import ./scripts/ctf-test-loader.mjs`, then `JSON.stringify`s the actual
programs. It does not parse TypeScript literals with a regex or JSON decoder and
therefore tolerates ordinary Prettier formatting. `--node PATH` selects Node.
The loader also checks catalog equality and trace/explanation completeness.

An optional `--lessons-json FILE` (or `--lessons-json -` for stdin) accepts a JSON
array of objects with fields `code`, `python`, `cpp`, and
`samples: [{"input":"...","output":"..."}]`. All 44 distinct batch IDs must be
present; extra IDs are ignored. This adapter should be supplied from actual
lesson exports. `--source-json FILE` additionally compares every sample against
the newly fetched source. `--code a248,a250` restricts execution after loading the
whole batch. `--temp-root DIR` changes the generated compiler-file location.

Each public Python sample runs as its actual standalone program in a bounded
subprocess (8-second timeout). Additional cases execute the same exported source
in an isolated worker, one subprocess per code with a 12-second overall bound.
The RNG seed is fixed at 20261020. This keeps process counts bounded even for the
1,080 minimax comparisons. C++ compilation has a 30-second per-code bound.
When enabled on Linux, C++ runtime checks use public samples and at most three
additional cases per code, each with a 4-second bound. Compile-only mode invokes
`-fsyntax-only` and never launches C++ executables.

## Results and limitations

Local verification passed 44/44 actual Python public samples, 2,234 additional
independent/edge cases, and 44/44 C++17 compile-only checks using clang++. The
builder/catalog/trace shape check passed all 44 exported lessons. C++ runtime
execution was not attempted because Windows App Control blocks it; the normal
Linux verification entry point above and the parent's program checker provide
that remaining check. These results are concrete coverage, not a proof that all
hidden inputs or performance limits pass.

The a248 oracle enumerates actual day-by-day schedules, with **all opened mines
aging every day**, including days when another mine is used. It independently
checks the heap allocation reduction rather than duplicating that algorithm.
The sample animation uses a feasible block schedule (mine 4 for three days,
mine 2 for two days, then mine 1), whose gains are 8,7,6,7,6,6 = 40.

For a228, intervals that share an endpoint are merged before the two-pointer
scan. There is no time gap at that endpoint, so a continuous meeting may span
them; the independent oracle checks unit-time coverage sets.

One source ambiguity requires attention: a229 says to output the fastest counter
but does not specify a tie rule or promise a unique fastest counter. A valid
input `1 1 1 / 1 / 1 / 1` (slashes denote newlines) gives all three counters
3 seconds. The program consistently retains the smallest counter number, and
the explanation discloses this choice; the test suite does not claim that this
unspecified policy is guaranteed by the source. The official sample's fastest
counter is unique (counter 3), so its output is unchanged. No contradictory
public sample was encountered in this batch.

## Per-code evidence

Every row below also passed its one live public sample and C++17 compile-only
check. The case count excludes the public sample. Topics are chosen from the
actual statement, not inherited curriculum grouping.

| Code | Topic | Extra cases | Evidence beyond the public sample |
| --- | --- | ---: | --- |
| a225 | simulation | 2 | Valid type -1, whole-type clearing, relogin, no operations |
| a226 | arrays | 3 | First/last-week threshold equality, only one resource sufficient |
| a227 | grid | 26 | Singleton, synchronous swap, sorted-neighbor majority oracle on 24 small grids |
| a228 | search-optimization | 26 | Adjacent intervals, zero-length intersection, 24 unit-time-set oracles |
| a229 | read-calculate | 2 | Single customer has no overhead; two customers have exactly one gap |
| a230 | simulation | 35 | Independent live-target removal and nearest-same-type search |
| a231 | simulation | 18 | First-day failure, carry-over, exact exhaustion, cumulative-demand oracle |
| a232 | read-calculate | 108 | Enumerated nonnegative solutions across both price orderings and invalid totals |
| a233 | grid | 2 | One-cell room, clipping, zero-step direction rotation |
| a234 | text | 2 | Upper/lowercase distinction, final positions, multi-digit concatenated ranks |
| a235 | arrays | 2 | All-zero changes and ties; oscillating scores versus net change |
| a236 | conditions | 2 | Both possible empty classes, required -1 output |
| a237 | number-theory | 25 | Integer digit extraction oracle, simultaneous predicates counted only once |
| a238 | simulation | 27 | Rational threshold comparisons, exact tier boundaries, per-item flooring, sale cutoff |
| a239 | read-calculate | 2 | Exact deadline and one-minute-late boundary |
| a240 | count-frequency | 1 | Missing products contribute zero; product and shop answers both unique |
| a241 | arrays | 24 | Reachability recomputed independently from every point of random permutations |
| a242 | arrays | 2 | Single piece and interspersed empty shelves |
| a243 | simulation | 3 | Duplicate overrides apparent good victory; all wolves dead; no eliminations |
| a244 | grid | 3 | Matching crossing, conflicting crossing, out-of-bounds vertical word with X/Y orientation |
| a245 | read-calculate | 2 | Exact 20 minutes across an hour, end-of-day failure without wrapping |
| a246 | conditions | 1 | Popular-vote winner differs from electoral-vote winner |
| a247 | read-calculate | 2 | Zero-valued envelope and one-billion total boundary |
| a248 | search-optimization | 37 | 35 exhaustive real-day-aging schedule oracles; stop at zero; large gains and transport |
| a249 | count-frequency | 1 | Case-sensitive oils, repeated quantities, input-order tie against lexical order |
| a250 | grid | 31 | 30 vector-reflection state oracles; obstacle excluded from count |
| a251 | simulation | 126 | Every binary flavor sequence of length 1–6, independent per-second machine simulation |
| a252 | arrays | 16 | Independent groupby oracle, final run, singleton |
| a253 | grid | 15 | Inverse-coordinate expansion oracle with unequal horizontal/vertical scale factors |
| a254 | number-theory | 501 | Every N=2..500 against enumerated prime products, large prime and 2-billion boundary |
| a255 | conditions | 4 | 303 room IDs in four inputs, independent condition list/minimum priority and square set |
| a256 | number-theory | 1080 | Full minimax DP for every T=1..120 and R=1..9 |
| a257 | grid | 20 | Independent sets/frontiers for night and day, hunter immunity and overwrite |
| a258 | text | 5 | Singleton, forbidden center/outer letter, allowed non-palindrome, allowed palindrome |
| a259 | count-frequency | 3 | Complete deck, triplicated one card, maximum 520-card input |
| a260 | grid | 16 | Independent groupby on columns before rows, all-empty singleton |
| a261 | number-theory | 5 | Full divisor enumeration, 1, square roots, maximum-count tie retaining smaller number |
| a262 | read-calculate | 12 | Zero, plan allowances, excess, cost crossover neighborhood, maximum T |
| a263 | read-calculate | 6 | Calendar-library differences on non-leap paths, same day, month end, year end |
| a264 | text | 4 | Translation-table oracle, empty line, leading/trailing spaces, k=0/25, wrap and punctuation |
| a265 | read-calculate | 4 | Volume-divisible but dimension-invalid case, too-large cube, exact cube, billion-count product |
| a266 | simulation | 24 | Independent immutable-round reference with decreasing-sum termination bound |
| a267 | read-calculate | 2 | No purchases; repeated product purchases accumulate |
| a268 | arrays | 2 | Repeated/absent query, 1-based coordinates, shelf ID beyond query range |

## Sample trace review

All displayed numeric or grid states were checked against the actual first
public input. In particular: a227 shows totals 24→24→24 with day-two rows
`3 6 5 / 3 3 4`; a233's final rows are `***** / ...** / ...**`; a257 shows
the exact two-stage intermediate and final boards; a266 ends with A all zero
and B `4 0 9 0 7`, and includes the terminating output 0. Trace summaries use
the same visible cell values, so they do not introduce an unrelated synthetic
example or hidden alternate sample.
