# TOI beginner batch 1 independent cross-review

Reviewed on 2026-10-20. This review did not modify lesson code, the catalog,
registries, tests, CI, or Git state. This report is the only new file from this
cross-review.

## Scope and version

All 45 entries in `src/lib/toiBeginnerLessons/batch1.ts` received a semantic
read against `../tutorial-audit-source/beginner-problems.json`:

- a087, a088, a089, a090, a091, a092, a093, a094, a095, a096, a097, a098,
  a099, a100, a101, a102, a103, a104, a105, a106, a107.
- a156, a157, a158, a159, a160, a161, a162, a163, a164, a165, a166, a167,
  a168, a169, a170, a171, a172, a173, a174, a175, a176, a177, a178, a179.

The read covered the statement, constraints, samples, explanation, pitfalls,
complexity, all trace frames, and both C++ and Python listings. There are no
sample-only or unread entries within this batch. This does not cover other
batches, component rendering, or hidden judge data.

SHA-256 of the reviewed lesson file, unchanged at the end of the checks:

`2011114389E749079BCEFEE99EE4FAF4CE68C3F5B637B6F6FCEF07AFFBCC1820`

SHA-256 of the supplied beginner snapshot:

`5BFD2626A6A6E259CE3E167DB65B53AED2F43E755EA7C86523E2502DC14BE2C4`

## Findings

No confirmed algorithmic, parsing, output-formatting, numeric-range, or trace
defect was found under the stated, unambiguous input rules. Two qualifications
remain below; sample success is not the basis for an exhaustive-correctness
claim.

### a159: unresolved source ambiguity, already disclosed in the lesson

The statement does not guarantee unique minimum/maximum boxes or define which
box to choose when an extreme is tied. The lesson explicitly discloses that its
programs select the first occurrence (`batch1.ts:1277`). That is a reasonable
documented convention, but it cannot be verified against an unspecified rule.

For input:

```text
3
0 0 9
```

the average is 3 and the transfer is 6. The Python listing produces `6 0 3`.
Choosing the other equally small box would instead produce `0 6 3`; both choices
satisfy the written transfer instruction. Similarly, `3 / 9 9 0` produces
`6 9 3`, while choosing the second maximum gives `9 6 3`. These are ambiguity
witnesses, not counterexamples with a uniquely specified expected answer.

The [live public a159 statement](https://oj.itousouta.me/problems/a159) was
rechecked successfully (HTTP 200) and still omits the rule. The linked original
TOI Stones PDF could not be read: the web reader failed, and an independent
in-memory HTTP request encountered a repeated-302 redirect loop. The PDF-reading
workflow therefore did not resolve the missing guarantee. No guess was made
about hidden judge behavior, and no production statement/data change was made.

### a095: minor complexity annotation precision

The annotation at `batch1.ts:483` says `O(M + N log M)`. The C++ listing also
inserts all M club names into a `std::map`, costing `O(M log M)` in general.
A precise common bound for that listing is `O((M+N) log(M+1))` with name length
bounded by 20; the Python dictionary version is expected `O(M+N)`.

This is annotation bookkeeping, not an answer defect or practical constraint
failure (M is at most 50). The listing was left untouched as requested.

## Concrete execution evidence

- All 45 current public sample cases passed the actual Python listings, using
  CPython 3.12 with UTF-8. Comparisons normalized Windows CRLF and final line
  endings, not internal spaces or line structure.
- All 45 actual C++ listings passed Clang C++17 syntax checks from standard
  input (`-Wall -Wextra -Wpedantic -fsyntax-only`). This created no compiled
  artifacts and is **not** C++ runtime verification.
- 56,643 additional Python cases passed, executed from the actual extracted
  listings in isolated namespaces with in-memory input/output. Every lesson
  received at least one non-public fixture. No persistent test script or shared
  harness change was made.

The additional-case totals by lesson are:

| Codes | Cases per code |
| --- | --- |
| a087, a090, a091, a094, a097, a103, a156, a157, a159, a165, a169, a176 | 2 |
| a088, a095, a096, a098, a099, a100, a101, a102, a104, a106, a163, a164, a168, a170, a174, a178, a179 | 1 |
| a092, a093, a105 | 3 |
| a089 | 10,669 |
| a107 | 482 |
| a158 | 513 |
| a160 | 3,152 |
| a161 | 502 |
| a162, a166 | 501 |
| a167, a173 | 301 |
| a171 | 3,177 |
| a172 | 14,401 |
| a175 | 502 |
| a177 | 21,591 |

Two separate a159 tie demonstrations described above are not included in the
56,643 total because the source supplies no unique expected result for them.

### Independent oracle coverage

- a089: exhaustive integer-token sequences over `{1,12}`, lengths 1 through 6,
  with every target of length 1 through N, compared with literal slice matching.
  This covers repeated prefixes, overlaps, first-match indexing, and no match.
- a107: all 16 binary-letter 2-by-2 grids and all binary words of lengths 1
  through 4. The oracle enumerated start/end coordinate pairs, rather than the
  listing's direction-loop order, and selected the minimum valid tuple.
- a158: all 511 nonempty subsets of a 3-by-3 coordinate grid, testing every
  candidate half-integer horizontal axis directly. Also checked a singleton
  and a set lacking symmetry.
- a160: every center for lengths 1 through 20 and every even absorption count
  2 through 30. The oracle selected individual other stones by distance, rather
  than reproducing the listing's interval-extension calculation. Includes both
  boundaries and requests exceeding all remaining stones.
- a161: 500 seeded random event streams, compared against explicit standing
  sets and scheduled recovery events. Additional fixtures cover a full clear
  and a re-hit exactly at the 12-second recovery boundary.
- a162: 500 seeded mixed-case product strings. The oracle redistributed items
  one at a time right-to-left, independently of the quotient/remainder listing.
- a166: 500 seeded practice sequences, compared with an interval-based simulator;
  a separate equal-position fast-ball fixture checks movement to negative X.
- a167: 300 seeded random segment-width instances, checked using positive-length
  intersections between tooth intervals. The oracle considered half-unit as
  well as integer placements, independently of unit-height array expansion.
- a171: exhaustive heights in `{0,1,2}` for lengths 2 through 7, restricted to
  valid strict peaks and unequal interior-side drops. Includes endpoint peaks,
  plateaus, and adjacent uphill stops.
- a172: all N,M in 1 through 12 and D in 1 through 100, compared with forward
  reachability dynamic programming, not a gcd or coefficient-enumeration test.
- a173: 300 seeded grids, compared with a full pairwise Manhattan-adjacency
  oracle using only original nonzero values. A `4 0 0` row specifically checks
  that estimates do not propagate.
- a175: 500 seeded input sequences, checked with a plain branching comparator
  instead of tuple keys. Extra fixtures check equal remainders and preservation
  of the earliest tied value.
- a177: all strings of lengths 1 through 7 over `{a,1,+,-}` containing at least
  one nonsign. The oracle identified maximal alphanumeric runs and their
  preceding signs independently. Covers repeated and trailing signs.

Random batches used deterministic seeds 20261020 and 161622. Other fixtures
cover missing/excess item separation; lottery ordinary/special-number separation;
tea discount endpoints; square-factor deduplication; exact power bounds;
club per-student deduplication; same-day travel; strict next prime/powers;
rightmost repeated treasure minima; tied examination thresholds; integer ceiling;
ten-valued cards; minimal mirror grids; case-sensitive/NA lunch queries; airport
leading, internal, and trailing spaces; saddle points; taxi interval endpoints;
one-time transfers; zero workers/partial factories; vegetarian turn consumption;
negative time-zone wrap; paired lion measurements; no-overdue output; strict
insect comparisons; and leading-zero file classifications.

## Remaining limits

- No C++ executables were built or run in this read-only cross-review. Static
  correspondence between both listings was reviewed; runtime evidence is Python.
- No exhaustive full-constraint state-space exploration, hidden-judge run,
  maximum-size timing benchmark, or browser animation rendering was performed.
  Complexity and numeric ranges were checked by inspection.
- a159 remains conditional on clarification of the source's tie behavior. Its
  existing disclosure should not be described as full verification of that rule.
- The report applies to the recorded file hash. Later author/integration changes
  require a new comparison; this review did not edit the finishing author's file.
