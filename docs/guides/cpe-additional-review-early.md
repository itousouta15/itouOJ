# Additional CPE review: a460–a619

## Outcome and exact scope

Completed a read-only second pass over **all 160 IDs a460 through a619 inclusive**. For each ID, read the complete local statement from the supplied fresh `../tutorial-audit-source/all-problems.json`, the complete exported C++ program, and the lesson's **goal, explanation, complexity, and pitfall**. Truncated read outputs were re-read in smaller groups before counting them as covered. All 160 source IDs and exact lesson IDs were present.

The original review found two concrete C++ numeric-domain counterexamples against the locally published statements, both of which omit the relevant numeric ceilings, plus two C++ complexity/prose mismatches. Neither numeric counterexample establishes a failure under an unstated smaller original-judge bound. No further concrete failure was established in the other reviewed lessons; that is a static-review result, not a claim that all possible executions are correct. The subsequently authorized follow-up fixes a522 and the a566/a618 complexity fields, as recorded below; a595 belongs to the parent.

During the original read-only review, only this report was written; no C++ compilation or executable run was requested. The follow-up changed only a522 within `batch1/part4.ts`, the a566 complexity field in `batch2/part3.ts`, the a618 complexity field in `batch3/part2.ts`, and this report. Registries, shared tests, branches, commits, PRs, CI and production were not changed. No C++ executable was launched and no App Control bypass was attempted. The running PR28 Linux CI was not modified or treated as evidence for this review.

Source SHA-256: `07A147F340B1C8A7ACB3B09409C7DF19EF646B5458F993A4A7BA2B369E5AFE43`.

## 1. a522: signed overflow before the fraction comparator — fixed in follow-up

The following counterexample and source locations document the original reviewed version; the authorized fix and validation are described in the follow-up section.

Location: `src/lib/cpeLessons/batch1/part4.ts:1467`, in the exported C++ line:

```cpp
error += jars[r].first * (jars[r].second - target);
```

The local statement limits the jar count to 3000 but specifies no maximum capacity, water volume, or temperature. Every individual number below fits signed 64-bit, and the example otherwise satisfies the stated positive-volume and capacity conditions:

```text
1
1000000000000000000 0
1
1000000000000000000 20
```

The only nonempty interval fills the pool and has temperature20, whose error from target0 is20, exceeding5. The mathematically required output is:

```text
Not possible
```

The C++ multiplication evaluates `1000000000000000000 * 20 = 20000000000000000000`, larger than `LLONG_MAX = 9223372036854775807`. This is signed-overflow undefined behavior before `lessFraction` can help. For illustration only, two's-complement wrap would produce `1553255926290448384`, an apparent error of about1.5533 degrees, and would admit `0 0`. **That wrapped output is not asserted as a portable C++ runtime result.** The independently checked fact is that the expression overflows.

The lesson's pitfall already discloses that cumulative signed heat and volume must fit64-bit. That is useful disclosure, but it is an additional assumption absent from the local statement. Treat this as a published-domain limitation requiring either a concrete source bound or wider/checked accumulation, not as a newly demonstrated failure within a documented small bound. The subtraction, addition, and `llabs(LLONG_MIN)` are other operations covered by the same missing bound; this counterexample needs only the multiplication.

## 2. a595: an unreachable sentinel becomes a valid arrival time — parent-owned

Locations: `src/lib/cpeLessons/batch3/part1.ts:701`, `:721`, `:722`, `:723`, `:727`, `:738`.

The program uses `inf = 4000000000000000000LL`, adds distances to unreachable states without a guard, accepts any resulting value less than a deadline, and recognizes failure only when the final minimum equals `inf` exactly. The fresh local statement bounds n by10000 but gives no coordinate or deadline ceiling.

Counterexample using positive deadlines, sorted distinct nonnegative coordinates, and signed-64-bit input values:

```text
4
0 8000000000000000000
1000000000000000000 1
2000000000000000000 1
3000000000000000000 8000000000000000000
```

Required output:

```text
No solution
```

The two interior treasures are `10^18` apart and both disappear at time1. No starting point can collect both strictly before that time.

Let D=`10^18`. An exact evaluation of the C++ transitions yields:

| Interval length | Relevant left-end states | Relevant right-end states |
| --- | --- | --- |
| 1 | All four are0 | All four are0 |
| 2 | `[0,1]`:D; `[1,2]`:4D; `[2,3]`:4D | `[0,1]`:4D; `[1,2]`:4D; `[2,3]`:D |
| 3 | `[0,2]`:5D; `[1,3]`:4D | `[0,2]`:4D; `[1,3]`:5D |
| 4 | `[0,3]`:5D | `[0,3]`:5D |

The length3 state5D arises from `inf + D`, not a reachable length2 state. Because5D is below the endpoint deadline8D, it is stored as reachable. The final result is therefore:

```text
5000000000000000000
```

This is a deterministic arithmetic/logic counterexample: all intermediates in this particular evaluation remain below `LLONG_MAX`, so it does **not** depend on signed overflow. The monotone-from-an-end shortcuts both fail because an interior treasure expires at1, and the all-unreachable-layer early exit never fires because the invented states survive.

Validation was an in-memory exact-integer evaluation of the reviewed C++ transitions, not a C++ executable run. If the intended source bounds make all deadlines smaller than the sentinel and all additions safe, those bounds would exclude this input; they are not present in the supplied local statement. Guard unreachable predecessors independently of their numeric sentinel, and separately document the intended numeric limits. No implementation was changed here.

## 3. a566: linear bound omits ordered-map costs — complexity field corrected

The finding below records the original claim. The current complexity field explicitly gives C++ `O((V+E) log(V+1))` including graph construction, Python's expected linear bound, and `O(V+E)` space. The programs were not changed.

Locations: `src/lib/cpeLessons/batch2/part3.ts:1149`, `:1198`, `:1206`.

The complexity field says `O(V+E)`, but `Graph` is `map<int, vector<pair<int,long long>>>`. Both farthest-point traversals call `g.at(u)` once for every visited vertex; graph construction also performs ordered-map indexing for edge endpoints. Under standard map operation costs, the C++ bound is `O((V+E) log V)` including construction, or `O(V log V+E)` for the two already-built traversals. Space remains `O(V+E)`.

A source-valid size witness is a10000-vertex chain with edges `(i,i+1,1)` for i=1..9999, followed by the case separator/EOF. Its answer is9999; there is no alleged wrong answer. It forces all vertices through the map-based traversal, so the promised linear container-operation accounting does not describe this implementation. This is a prose/complexity issue, not a measured timeout. Dense-index adjacency vectors would support the stated linear bound; alternatively document the current map cost.

## 4. a618: ordered BFS dictionaries — complexity field corrected

The finding below records the original claim. The current C++ complexity includes old-graph storage, graph construction, per-BFS ordered dictionary costs and identifier character costs. The programs were not changed.

Locations: `src/lib/cpeLessons/batch3/part2.ts:1298`, `:1380`, `:1381`, `:1383`.

The field claims total time `O(e(V+E))`. The C++ implementation uses a `set<string>` for visited membership/insertion, a `map<string,...>` for `b.g[u]`, and `a.g.count(v)` for old-point membership. Each traversal therefore has logarithmic dictionary costs. A safe container-operation bound is `O((V+E) log(V+|O|))` per old-edge BFS, in addition to graph construction; variable-length identifier comparisons can add their own character costs. Multiply the traversal term by the old-edge count e. The total-space description should also account for the stored old graph/edge list if those are not included in its V/E definitions.

Concrete growing input family: old map A has the single edge `u v`; new map B replaces it with `u x1`, `x1 x2`, …, `xL v`, with all xi new and distinct. Terminate each map with `* * *` and the input with `END`. Correct output is `YES: B is a more detailed version of A`. The only BFS must visit the whole chain, using the ordered dictionaries at each step. The route-validation semantics remain correct on this witness; it demonstrates the missing complexity factor, not a runtime failure.

## Coverage ledger

Every ID in each row received the complete statement/C++/goal/explanation/complexity/pitfall read. Range rows are contiguous and disjoint, totaling160. No Python lesson or animation review is claimed by this additional pass.

| IDs | Count | Main semantic checks and outcome |
| --- | ---: | --- |
| a460–a469 | 10 | Dice simultaneous updates, hotel first-feasible day and64-bit products, adjacent differences, scores, odd-row formula, empty bracket lines, ASCII words, cross-line quotes, bottle borrowing, ordering. No new counterexample. |
| a470–a479 | 10 | Vowel equivalence, bounded generator search, digit counts, inversions, integer square roots, f91 threshold, signed displacement,64-bit digit-DP counts, quotient blocks. No new counterexample. |
| a480–a489 | 10 | Partial fixed-point inclusion/exclusion, factor dimensions, line/block parsing, eight-direction start priority, magnitude sort, missing IDs, square sums, ties, jumps, midnight. No new counterexample. |
| a490–a499 | 10 | Multi-digit runs, quadrant orientation, gcd prefixes, digital roots,9-degree, rotation directions, honest interval bounds, happy cycles, quadtree union, light/heavy hypotheses. No new counterexample. |
| a500–a509 | 10 | Pile lower_bound, eight-neighbor bounds, hex state reset, rectangle inclusion/exclusion, maximum-displacement permutations, subset-sum multiplicity, prime-factor pair sum, functional graph cycles, lamp lower-bound formula, tree rerooting. No new counterexample. |
| a510–a519 | 10 | Checkers jump legality/modulus, weighted intervals, divisor sieve, rational food candidates, endpoint-mask digit DP, matrix operations, coin selection, line decoding, frog capacities, queen mismatch cost. No new counterexample. |
| a520–a529 | 10 | Prefix transport, ordered box DP, pool fractions, merge heap, rectangle contacts/DSU, exact rate rounding, interval greedy, letter masks, bridge capacity, reliable-only testimony. a522 numeric limitation above. |
| a530–a539 | 10 | Directed all-pairs BFS, quotation grammar,64-bit rational average, prefix bit counts, inverse permutation ranking, huge Fibonacci indices, graph glyph placement, kth walks including zero cycles, merge inversions, weighted fares. No new counterexample. |
| a540–a549 | 10 | Reverse Floyd endpoints, flood-fill marking, pigment decomposition, book tie reconstruction, key-testing formula, terminal insertion, virtual union-find nodes, distinct factorial-zero values, subsequence update order, circular patch endpoints. No new counterexample. |
| a550–a559 | 10 | Composite-modulus Pascal table, event tie priority, exchange multiplicities, exact ages, palindrome DP, full-line slogans, expression bounds, necklace ties,0/1 bars, generated sliding windows. No new counterexample. |
| a560–a569 | 10 | Tree balance/root, weighted pours, shared-endpoint intervals, full-width geometry, diagonal orientation, greeting lookup, tree diameter,60-position counts, digit-removal parity, note durations. a566 complexity issue above. |
| a570–a579 | 10 | Exact line comparison, train direction, mining prefixes, simultaneous species changes,2011 weekday, strict flooding/rational formatting, convex pairing, zero-cost existing cables, divisor ties, huge decimal remainders. No new counterexample. |
| a580–a589 | 10 | Segment-sphere clipping, homework deadlines, forced lights rows, canonical course sets, important-station eligibility, move-to-front Fenwick slots, proper-prime BFS, defined unsigned Horner arithmetic, row-prefix fractal counts, first-down wiggles. No new counterexample. |
| a590–a599 | 10 | Capped powers, saturated path counts, tournament ancestry, nested polygons, distinct cards, deadline interval DP, square frames, mid-square states, compressed-instruction lex order, barcode counts. a595 numeric/sentinel counterexample above. |
| a600–a609 | 10 | Cube interval intersections, full overlaps, two-level die/pip components, directed reachability, case-sensitive counts, common parallelogram point, suffix KMP, minute bands/widths, short satellite arcs, exact-size shifted sums. No new counterexample. |
| a610–a619 | 10 | Division/zero-step convention, mailbox layer ties, quadrangle positivity, sign tree, doublet BFS, range walking, DSU counts, closed leap-day endpoints, restricted old-point paths, balanced strict Wavio lengths. a618 complexity issue above. |

## Supplemental evidence and limits

Two bounded independent diagnostic probes were executed in memory with the trusted Python runtime, without writing scripts or running tutorial programs:

- a531: a direct recursive parser for the stated quotation grammar was compared with the reviewed peeling rule for every q/x string with quote endpoints and length2..12, for candidate depths1..3: **6141 comparisons passed**. q represented a quote and x a nonquote. This supports the small-domain derivation, not arbitrary-depth correctness or C++ runtime behavior.
- a598: a lexicographically ordered BFS over actual interval transformations was compared with the reviewed base-digit/candidate derivation on **2916 small parameter combinations**: a,m in1..3, p in1..3, p≤q≤4, 1≤r≤s≤8. All agreed. This is a check of the mathematical rule, not execution of the exported C++.

The a522 overflow calculation and the a595 state table were separately evaluated with exact integers. During the original read-only pass there were **zero** new C++ runtime checks, **zero** compiler checks, and **zero** exported Python-program or sample executions. Follow-up checks are separately recorded below. Existing CI, earlier sample passes, and earlier Python/trace review were not silently counted as this pass's work. Unspecified numeric domains and already-disclosed conventions (for example a610's zero-operation sequence) were not promoted into unsupported claims about original judge behavior.

Reviewed lesson files: `src/lib/cpeLessons/batch1/part1.ts` through `part4.ts`, `batch2/part1.ts` through `part4.ts`, and `batch3/part1.ts` through `part2.ts`. Representative finding-file SHA-256 hashes of the original reviewed versions, before this follow-up or parent changes:

| File | SHA-256 |
| --- | --- |
| batch1/part4.ts | C7342DDC5D77732CA9EE2A81080202BDED9F0BA4D069E45573AF38EEB71C0EDB |
| batch2/part3.ts | B7B317B16DEEA2CADFF420D1CF28BF9714AC9AC195095250E0B79B54B69681AF |
| batch3/part1.ts | D65DB2C268E84C40A2670192E2A032DA94045C5082EA0061C87BE70A204D56E7 |
| batch3/part2.ts | B0346BC6E4E91668BA0CC8155E9EAAC166C01480C292CC2FFF1A11F255DAD01C |

## Authorized follow-up implementation and verification

a522's C++ input contract is now explicit: positive capacity at most `2^63−1`, nonnegative individual jar volumes at most `2^63−1`, and target/jar temperatures from `−2^63` through `2^63−1`. These are limits on individual inputs, not an assumption that accumulated heat fits64-bit. Inputs beyond that contract remain outside this fixed-width C++ version; Python retains arbitrary-precision integers.

Before adding a jar, C++ tests `jar.volume > capacity-volume` and stops that start position if true. With nonnegative volumes this both preserves the enumeration semantics and maintains `0≤volume≤capacity≤LLONG_MAX`, so neither the addition nor the guard subtraction overflows. Only an accepted jar contributes heat. Each temperature is cast to signed `__int128` **before subtraction**, and the volume is promoted before multiplication. For every accumulated prefix:

```text
|heat| ≤ sum(volume_i) × max |temperature_i-target|
       ≤ (2^63−1)(2^64−1)
       < 2^127.
```

Thus the signed128-bit sum, products, temperature differences, and negation for absolute value remain representable even with3000 jars. Error magnitude, fraction denominators and stored best fraction use `unsigned __int128`. The comparator keeps the existing Euclidean quotient/remainder-and-reciprocal algorithm, with no cross multiplication. `__int128` is a **GNU compiler extension with fixed128-bit width**, not arbitrary precision and not portable ISO C++17; this requirement is explained in the lesson. No Boost dependency was introduced. Python, trace and public sample data were not changed.

a566's complexity field now distinguishes C++ ordered-map construction/traversal from Python's expected hash-map traversal. a618 defines old graph U/e and new graph V/E and gives the conservative C++ bound, excluding identifier character work, as:

```text
O((U+V+e+E+e(V+E)) log(U+V+1)) time
O(U+V+e+E) space.
```

The field separately states that maximum identifier length L multiplies the character-processing/string-storage upper bounds. These were complexity-only changes.

Follow-up verification completed:

- The **actual exported a522 C++ source** passed clang++ `-std=c++17 -Wall -Wextra -x c++ -fsyntax-only -`, supplied over stdin. No source or build output was written to disk and no C++ executable was run.
- A separate compile-only diagnostic reused that source's comparator body with only a `constexpr` qualifier added in memory. Ten `static_assert` fraction comparisons passed, covering zero, equality, reciprocal-order reversal, and near-maximum unsigned128-bit numerators/denominators. Compile-time assertions also confirmed the positive/negative signed128-bit heat bound at both signed64 temperature extremes. This is compiler constant evaluation, not a runtime test of the exported executable.
- The unchanged exported Python program passed **eight independent BigInt-oracle boundary cases**: the original overflow input; positive and negative extreme temperature differences; large cancelling heats; rejecting a second `LLONG_MAX` volume before addition; an oversized first jar; zero-volume/tie ordering; and ordinary rational errors. Expected outputs respectively were `Not possible`, `Not possible`, `Not possible`, `0 1`, `0 0`, `Not possible`, `0 1`, `0 1`.
- Its **one catalog public sample block** also passed, with CRLF normalized to LF. That block contains two problem instances. The initial raw line-ending comparison was corrected in the in-memory diagnostic; no lesson change was needed for Windows newlines.
- Source assertions confirmed the capacity guard precedes volume addition and both temperature operands are promoted before subtraction.
- Scoped ESLint passed for the three edited lesson files. No full build or repository-wide test run was requested by this follow-up.

C++ runtime confirmation of the fixed a522 counterexamples remains with the parent's Linux CI and shared oracle. The parent also owns the a595 fix and regression. No shared test was edited, and no claim is made here about the parent's current a595 implementation or CI outcome.
