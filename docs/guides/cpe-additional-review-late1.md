# CPE a760-a803: additional review and assigned fixes

Completed 2026-10-20/21. Initial scope was read-only review; subsequent explicit
authorization first limited implementation to a794 in `batch6/part1.ts`, a798's
complexity annotation in `batch6/part2.ts`, and this report. A later follow-up
authorized only a779's exact arithmetic and a770's complexity annotation in
`batch5/part4.ts`, plus this report. The batch6 files were not touched during
that follow-up. No shared test,
catalog, registry, CI, production data, or Git mutation was performed by this
reviewer. Other agents' concurrent changes were preserved.

## Actual coverage

All 44 entries a760-a803 received a fresh semantic read of the actual statement,
goal, every explanation paragraph, complexity, pitfall, and complete C++ listing
against `../tutorial-audit-source/all-problems.json`. No entry in this requested
field range is sample-only or unread. Python and trace coverage from the earlier
audit was not substituted for these reads; this additional pass did not reread
every Python listing or every trace. The changed Python listings for a794 and
a779 were fully reread.

| Entries   | Checks included in the semantic read                                                                                                                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a760-a765 | DFS root/low-link rules and edge deduplication; prime-gap bounds; full telephone mapping; signed difference GCD; cuboid face compatibility; emirp versus palindrome.                                                                                           |
| a766-a771 | Restarted edit-distance feasibility and nonempty segments; segmented factorization and smallest ties; huge-N last-digit periods; deadline heap; local chain stopping rule; stamp coverage and reverse-denomination tie-breaking.                               |
| a772-a777 | Fibonacci greedy invariant; closed price ranges and unique matches; factorial exponents and continuation indentation; floor division for signed continued fractions; CSV MST parsing; unordered Goldbach pairs including equal primes.                         |
| a778-a783 | Rotation-only canonical boards, initial empty board and fixed move consumption; radar intervals/precision; bricks sentinel and blank lines; digit-product special cases; lexicographic lotto combinations; weighted-grid Dijkstra including the starting cost. |
| a784-a789 | Nonempty maximum rectangles; polynomial signs/unit coefficients; Cantor diagonal endpoints; lower medians; directed page distances and valid-node denominator; directed adapter reachability and individual-socket matching.                                   |
| a790-a795 | Blank-line flood-fill input and four-neighbor bounds; fixed-width seven-segment output including trailing spaces; calendar day zero and month mapping; chess-rule priority; finite payment/unlimited change; unordered coin combinations and zero query.       |
| a796-a803 | Money parsing and column widths; persistent coordinate scent; directed-tree indegrees/reachability; Collatz memoization/input order; moving hour hand; maximum-gap odd-prime decomposition; minimax squared distances; proper-divisor square deduplication.    |

Snapshot SHA-256:
`07a147f340b1c8a7acb3b09409c7df19ef646b5458f993a4a7ba2b369e5afe43`.

After the first a794/a798 fixes, before the a779 follow-up and subsequent parent
changes, the SHA-256 of `JSON.stringify(entries)`, with entries
sorted by code and each object ordered as
`{code,goal,explanation,complexity,pitfall,cpp}`, is:
`72b70916f6cc7ed039915ba609fab6222f5944d83f6dfce3e8de1953d3953637`.
This fingerprints the 44 reviewed entries without including other agents'
unrelated changes elsewhere in the containing files.

## Confirmed and fixed within authorization

### a794: unbounded whole-wallet DP and count overflow

Independently confirmed the finding in `cpe-additional-review.md`: the input
specification does not cap coin quantities. The original C++ accumulated
`40*60000000` in an `int`, exceeding its signed 32-bit range. Even smaller counts
could make both languages allocate arrays proportional to a huge entire wallet.
The overflow is undefined behavior, not a claim of one deterministic old output.

The [original UVa 166 specification](https://onlinejudge.org/external/1/166.pdf)
limits the price but supplies no coin-count ceiling. The new bound is proved
without assuming such a ceiling:

1. Scale money to five-cent units, so denominations are 1,2,4,10,20,40 and
   positive price p is at most 99.
2. Take available coins in any order until first reaching p. At most p coins
   are used, because each is worth at least one unit. Before the final coin the
   sum is at most p-1; therefore overpayment is at most 39 units.
3. The shop can return at most 39 one-unit coins. Consequently a feasible
   transaction exchanges at most B=p+39 coins altogether.
4. An optimal transaction pays at most B coins, since payment count is no
   greater than total exchanged count. Its paid amount is at most W=40B, at
   most 5520. Each denomination can safely be capped at B, at most 138 coins.

Both languages now read quantities as decimal strings, remove an optional
leading `+`, and saturate each parsed count at B before denomination
multiplication. Neither converts a huge count with `stoi`/`stoll`/Python `int`,
nor computes the original whole-wallet value. This count cap is stronger than
5520 and preserves at least one optimal solution. Binary-group finite-payment DP
and unlimited-change DP are restricted to W. Price zero returns zero directly;
the six-zero sentinel is recognized before reading any price, including leading
zeros and optional plus signs.

The explanation, bound proof, complexity, and pitfall were updated. The existing
trace remains valid. The complexity annotation distinguishes bounded DP working
storage from input characters/buffers, which can still be large.

### a794: short decimal price parsing

The old parsers read the digits after the decimal point as cents, irrespective
of their position. For the input below, fifty cents was misread as five cents:

```text
0 0 0 1 0 0 0.5
0 0 0 0 0 0
```

The actual old Python listing printed `  4`; the uniquely correct answer is
`  1`, paying the single fifty-cent coin. The C++ expression had the same
mis-scaling by inspection. Live public statements a794/a796 were rechecked
(HTTP 200), and the original specifications describe amounts without imposing
exactly two fractional input digits. The corrected a794 parser right-pads the
fraction and handles `0.5`, `0.50`, `0.500`, integer prices, and zero consistently.
This fix was confined to a794; a796 remains a separate handoff below.

### a798: ordered-container complexity

Confirmed that C++ `map` construction/lookups and `set` visitation invalidate
the old general linear-time annotation. Updated to
`O((V+E) log(V+1))` for C++, average `O(V+E)` for Python hash containers,
`O(V+E)` graph/traversal storage, and an explicit Python input-buffer caveat.
The tree algorithm and its programs were not changed.

### a770: ordered chain-history cost

Updated the annotation to include C++ `set<int>` insertion work:
`O(L*d*log(d+1)+L*log(L+1))`. Python retains average hash-container time
`O(L*d*log(d+1))`; the input-buffer caveat is explicit. The chain algorithm,
programs, and trace were not changed. The public sample passed both languages.

### a779: exact integer-radical intervals, fixed in follow-up

The fresh statement was reread before implementation: x, y, and d are all
integers, not arbitrary real input. The supported C++ contract is signed-64-bit
coordinates and a nonnegative signed-64-bit radius, using a compiler supporting
GNU `__int128`; negative radii return -1 after consuming all points. Python uses
arbitrary-precision integers. No Boost, floating-point endpoints, or epsilon is
used. Zero radius produces point intervals and correctly counts distinct x
coordinates when all y are zero.

The prior failure was:

```text
2 1000000000
0 1
2000000000 1
0 0
```

The old Python listing returned one, but two radars are necessary: a single
radar must be horizontally at least d from one island and also vertically one
unit away. Binary64 rounded `d*d-1` to `d*d`, incorrectly merging the intervals.
The fresh source and
[original UVa 1193 specification](https://onlinejudge.org/external/11/1193.pdf)
do not give smaller numeric bounds that exclude this witness. It now returns
two in both executed implementations.

The greedy proof is unchanged: sort by increasing right endpoint, place a radar
at the first uncovered interval's right endpoint, and keep it until an interval
starts strictly later. The implementation now stores an endpoint symbolically
as `(x,q)` with `q=d*d-y*y`, representing `x+sqrt(q)` without evaluating sqrt.
Helpers isolate right-endpoint ordering and the strict left/right separation
predicate. Equality means the same radar can cover both closed intervals.

For right ordering when x1<x2, put g=x2-x1. Obvious q orderings and nonpositive
`t=q1-q2-g*g` are handled before squaring. In the remaining positive branch,
ordering reduces to `t*t` versus `4*g*g*q2`. For strict separation of a new left
endpoint and the chosen right endpoint, first require positive g and
`t=g*g-q_chosen-q_new`, then compare `t*t` with `4*q_chosen*q_new`. Zero-q and
zero-t cases are handled separately where necessary.

The C++ helpers never form these potentially 256-bit products. They compare
`t/(2*g*g)` with `(2*q2)/t`, or `t/(2*q_chosen)` with `(2*q_new)/t`, using an
Euclidean continued-fraction comparator based only on quotient and remainder.
Every denominator is positive in its guarded branch. Differences are widened
to signed 128 bits before subtraction; their unsigned squares fit because
the largest gap is `2^64-1`. Valid q is below `2^126`, so sums and doubled q fit.
In the right-order positive branch, `g*g<q1`, so doubling g squared also fits.
The absolute value of LLONG_MIN is taken only after widening. These checks
avoid signed overflow, unsigned wraparound of guarded terms, and division by
zero. Python instead compares the large cross-products directly.

The explanation, complexity, and pitfall now state the exact predicates,
fixed-word-width contract, division-comparator cost, and closed-boundary rule.
The existing trace is unchanged and remains mathematically correct.

Follow-up verification, all generated in memory without shared-test edits:

- 261 complete problem cases passed both Python and the actual compiled C++
  listing. Expected answers came from enumerating all interval-cover subsets,
  using independently certified dyadic sqrt bounds via integer `isqrt`, not
  the lesson's greedy algorithm or radical formulas. Cases include the original
  witness, LLONG_MIN/LLONG_MAX gaps, touching versus near-touching, zero radius,
  invalid y including LLONG_MIN, and negative radii followed by further data.
- 3308 Python endpoint-order/separation helper checks passed against the same
  independently refined integer-root bounds. These include arbitrary valid
  q magnitudes, equal right endpoints, exact touching, and one-unit separation.
- The actual `constexpr compare_fraction` body passed 5003 compiler-time
  assertions against arbitrary-precision cross-multiplication answers, including
  full unsigned-128-bit numerator/denominator ranges and zero numerators.
- The public sample passed Python and executed C++; both a770/a779 structure
  checks passed. Random seed was 77920261021. These are finite tests plus the
  documented algebraic argument, not hidden-judge or exhaustive-domain claims.

Windows Clang's default link lacks `__udivti3`/`__umodti3`; local native runs
explicitly linked the installed compiler runtime
`C:/Program Files/LLVM/lib/clang/22/lib/windows/clang_rt.builtins-x86_64.lib`
through a test-only pragma. The lesson source does not contain that host path;
its contract requires GNU-compatible 128-bit arithmetic support. A helper-only
native executable was later blocked by Windows application control, so no claim
is made that those helper batches executed natively. The 261 full-program C++
cases had already passed; helper arithmetic was checked as described above,
without bypassing the executable block or changing safety settings.

## Other findings handed to the parent

The items below preserve review-time evidence, not a claim that parent-owned
fixes are still outstanding. The parent explicitly owns a796, a789's annotation,
and a790/a797 CRLF handling. They were not edited in the a779 follow-up.

### a796: the same short-decimal money parser defect

`batch6/part2.ts`, C++ `cents = ... + stoi(token.substr(p+1))`, and the Python
`int(b)` have the same decimal-position error. This was not part of the
authorized a798-only change in that file.

```text
0.5
0.00
```

The reviewed pre-fix Python program printed `  0.05                1`; it should print
`  0.50               13`. Independently enumerating all coin multisets worth
50 cents gives 13. A `0.50` control produces that correct line already.
The [original UVa 147 specification](https://onlinejudge.org/external/1/147.pdf)
describes real-valued inputs; its two-decimal-place requirement is for output.
No C++ execution of this specific counterexample was performed; its parser
failure follows from the actual expression, not a claimed native run.

### Minor complexity annotations

- a789: the reviewed abstract reachability bound `O(m(V+K))` omitted the C++ ordered
  `map<string,...>`/`set<string>` lookup factors and socket membership checks.
  With bounded name length, a conservative combined bound is
  `O((K+m(V+K+n))*log(V+1)+m*m*n)`. The Python dictionary/set version has average
  constant-time container operations. No matching counterexample was found.

### Conditional portability findings, not demonstrated LF judge failures

In the reviewed pre-fix listings, on a platform where `getline` retains CR from
CRLF input, a790's `line.empty()`
checks do not recognize a CR-only blank line; the coordinate extraction can
then fail before uninitialized coordinates are used. a797 likewise leaves CR
in `commands` and treats every non-L/non-R character as F. For example,
`1 1 / 0 0 E / R` with CRLF line endings should end `0 0 S`, but the retained
CR would trigger an extra forward move and LOST. These follow from C++ stream
and branch semantics, but were not executed on a POSIX host. Windows text-mode
CRLF normalization can hide them. They are conditional parser-portability
risks, not assertions that the normal LF samples fail.

## Execution evidence and limitations

- Before implementation, all 44 fresh public samples passed the actual Python
  listings, preserving internal/trailing spaces and blank-line structure apart
  from CRLF/final-newline normalization. All 44 actual C++ listings passed
  Clang C++17 syntax checks. Those syntax checks were not native executions.
- Seven selected algorithms passed 2545 independent problem cases in 2034
  Python program invocations: a760 771 connected graphs checked by vertex
  deletion; a764 462 six-face multisets compared with enumerated cuboids;
  a769 250 subset-scheduled job sets; a771 150 reachable-sum stamp-set suites;
  a789 200 adapter-closure/exhaustive-assignment instances; a798 all 512 directed
  simple edge subsets on three labels (one batched invocation, including self
  loops and the empty graph); a802 200 edge-threshold-connectivity instances.
  Random seed was 760803. These were Python executions, not C++ cross-language
  comparisons presented as independent oracles.
- After implementation, the parent's targeted a794 oracle passed **106 cases
  in both Python and compiled/executed C++**. This includes physical-subset
  enumeration for 100 tiny wallets and huge/plus-token cases. Shared test
  sources were only read/run, not edited by this reviewer.
- A separate in-memory a794 generator passed **2538 cases in both languages**:
  all 63 nonempty binary wallets at every price from zero through their value
  (2527 cases), five 10000-digit quantity cases, four decimal variants, and
  two leading-plus quantity cases. Expected tiny-wallet answers came from
  physical payment-subset enumeration and a BFS change oracle. The five input
  chunks also end with plus-prefixed/zero-padded six-zero sentinels.
- Both changed lessons passed structure validation and their public samples
  in Python and compiled/executed C++ after the final code changes.
- ESLint and Prettier checks passed for the two changed lesson files. Targeted
  diff whitespace checks passed. No full application build, maximum-size
  benchmark, browser animation rendering, complete native run of all 44, or
  hidden judge/AC claim is made.
- One extra test attempt failed before compilation because the system temporary
  directory denied file creation. Rerunning the existing harness with
  `--temp-root .` completed; workspace temporary outputs were automatically
  removed. The failed attempt is not counted as a passed run.
- The numeric domains of a763/a775 still lack explicit magnitude bounds in the
  snapshot/original text. Their signed-64-bit arithmetic cannot be certified for
  arbitrary mathematical integers; no unbounded-integer correctness claim is
  made. Formula extraction artifacts were not interpreted as new constraints.

## Reproduce the assigned-fix checks

From the repository root, using the existing parent-maintained harness:

```powershell
node --import ./scripts/ctf-test-loader.mjs scripts/lib/check-cpe-tutorial-audit.mjs --codes a794 --python C:/Users/Steven/AppData/Local/Programs/Python/Python312/python.exe --cxx 'C:/Program Files/LLVM/bin/clang++.exe'
node --import ./scripts/ctf-test-loader.mjs scripts/verify-cpe-lessons.mjs --code a794,a798 --python C:/Users/Steven/AppData/Local/Programs/Python/Python312/python.exe --cxx 'C:/Program Files/LLVM/bin/clang++.exe' --temp-root . --no-pch
```

The separate 2538-case generator was executed in memory, not added as a shared
test file. The parent owns persistent targeted regression and final integration.

## Paths changed by this assignment

- `src/lib/cpeLessons/batch5/part4.ts`: follow-up a779 implementation/prose and
  a770 complexity only.
- `src/lib/cpeLessons/batch6/part1.ts`: a794 only.
- `src/lib/cpeLessons/batch6/part2.ts`: a798 complexity only.
- `docs/guides/cpe-additional-review-late1.md`: this report.

The last a779 follow-up changed only `batch5/part4.ts` and this report; a794/a798
above belong to the prior completed handoff. No other lesson was changed by
this reviewer during this assignment. This does
not include earlier completed CPE/beginner work or claim ownership of concurrent
changes by the parent and other reviewers.
