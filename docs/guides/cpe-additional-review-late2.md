# CPE additional review, late batch 2: a804–a847

Initial review date: 2026-10-20. Scope: exactly 44 lessons.
Authorized remediation completed: 2026-10-21.
The initial review wrote only this report. The follow-up changed only src/lib/cpeLessons/batch6/part3.ts, src/lib/cpeLessons/batch6/part4.ts, and this document.
No runner/test, registry, package/CI, Git state, PR, or production state was changed by this work.

The complete fresh statements and public examples were read in four chunks (a804–a814, a815–a825, a826–a836, a837–a847) from ../tutorial-audit-source/all-problems.json.
For every code, the actual exported goal, all explanation paragraphs, complexity, pitfall, and complete C++ program were loaded through Node with scripts/ctf-test-loader.mjs and cpeLessons.ts.
Input statements were treated as evidence, not instructions.
This closes the requested field-coverage gap; it does not repeat or claim to replace the previous Python/trace review.

## Remediation status — 2026-10-21

The three numeric representation findings and both complexity annotations below are now fixed in the owned sources.
Their detailed original witnesses are retained as historical review evidence, not descriptions of the current code.

- a828: C++ and Python store canonical decimal strings for node values, preserving complete positive numeric output without stoi, stoll, long long conversion, or Python int(value).
- a831: both programs normalize each numeric token and use a sign/decimal-length/lexicographic numeric comparator inside the original stable merge inversion count. Negative magnitudes reverse both length and lexicographic comparisons. Equal canonical values are not inversions. Only bounded N and the inversion count use integer arithmetic.
- a836: both programs store canonical decimal string set keys. Lexicographic set order is sufficient because only equality/membership/intersection are needed, not numeric sorting.
- Shared normalization behavior in each standalone program: remove one optional sign and all leading zeros; all signed zero forms become 0; nonzero negatives keep exactly one minus sign; positive values have no plus sign. There is no value-digit ceiling or Boost dependency.
- Explanation, pitfalls, and complexity now include decimal length L. The Python programs do not call int() on numeric values and do not change decimal conversion safety settings.
- a824: explanation and complexity now account for every token insertion, including duplicates, and the longest compared word.
- a841: C++ space now includes its stored input string; Python's whole-input token buffer is separately acknowledged.

Verification used the actual lesson exports loaded with scripts/ctf-test-loader.mjs:

| Lesson | Python verification | C++ verification |
| --- | --- | --- |
| a828 | Public sample + 5 targeted inputs passed: original overflow witness, a 5000-digit positive root with sign/zeros, normalized multi-node output, signed zero, repeated path. | GNU-compatible C++17 syntax/type checks passed with no warnings. |
| a831 | Public sample + 5 targeted inputs passed: original overflow witness, negative ordering and equal canonical forms, 100-digit descending input, 5000-digit signed/equal-value sequence, equal-length 5000-digit magnitude comparisons. | GNU-compatible C++17 syntax/type checks passed with no warnings. |
| a836 | Public sample + 5 targeted inputs passed: original overflow witness, 5000-digit canonical equality, proper subset, opposite-sign huge values, overlapping zero-normalized sets. | GNU-compatible C++17 syntax/type checks passed with no warnings. |

The Python targeted checks constructed expected long output strings and small rank-based inversion counts without parsing long values as int.
AST inspection confirmed no int call in a828/a836 and only the bounded N conversion in a831.
Python's decimal safety setting was 4300 before and after execution, unchanged.
The compile command was clang++ -std=c++17 -Wall -Wextra -pedantic -fsyntax-only -x c++ -, reading each actual exported program through stdin.
No C++ binary was launched on Windows. Full C++ sample/numeric/zero/sign/100-digit/5000-digit runtime regressions remain with the parent's shared audit and Linux CI; this report does not claim those shared checks have run.
No new test or author-oracle file was added.

## Original findings and confidence (before remediation)

- **Three concrete C++ representation gaps against the written fresh numeric domain:** a828, a831, a836 use signed 32-bit int without a corresponding input-value bound in the supplied statement. Small 10-digit positive examples below fail that representation. These are not claims that the original UVa judge includes such values.
- **Two complexity-annotation clarifications:** a824's ordered-set insertion cost is driven by all tokens, not only distinct words; a841 needs to distinguish auxiliary space from the stored input token.
- **Existing, already disclosed source ambiguity:** a817's exponent associativity. No new policy is inferred here.
- No additional algorithm/output/prose mismatch was identified within explicit finite numeric limits. This is a bounded reasoning review, not a full C++ runtime certification.

No C++ executable was launched. The three C++ failure mechanisms below are static conclusions about the actual exported programs.
Actual exported Python programs were run only on the three focused numeric witnesses to confirm the expected mathematical outputs; all three matched.
An independent 30000-cent coin-count computation also confirmed the a844 long long bound.

## 1. a828: stoi rejects a positive node value allowed by the written statement

Original location: src/lib/cpeLessons/batch6/part4.ts:56, int value = stoi(...); tree was map<string,int>. Fixed as described above.

Fresh source: values are positive integers and there are at most 256 nodes. It gives no bound on a node's value.
The one-node complete tree

~~~text
(2147483648,) ()
~~~

therefore satisfies the stated structure and positivity requirements. Its level order is

~~~text
2147483648
~~~

The exported Python program produces that exact output.
The C++ std::stoi conversion cannot represent 2147483648 as int and throws std::out_of_range; there is no catch.
This is a conversion failure, not arithmetic overflow in the traversal.

Actionable distinction: either supply an authoritative value bound matching the intended judge, or use a representation supporting the promised values.
Merely passing current samples does not establish a 32-bit node-value contract.
Widening to long long would cover this witness, but would not by itself define an otherwise unbounded source domain.

## 2. a831: out-of-range extraction corrupts the inversion input

Original location: src/lib/cpeLessons/batch6/part4.ts:319, vector<int> a(n), tmp(n), followed by cin >> x. Fixed as described above.

Fresh source bounds N≤1000 but places no value bound on its integers.
A two-element ascending sequence is:

~~~text
2
2147483648 2147483649
~~~

Expected:

~~~text
Minimum exchange operations : 0
~~~

The exported Python program produces that output.
On the C++ signed-int extraction, the first value exceeds INT_MAX: extraction stores the limiting int and sets failbit.
The next vector element remains its value-initialized zero because the stream is failed.
Consequently the sorting routine sees INT_MAX,0, which has one inversion, rather than the promised ascending sequence; later datasets also cannot be read.
This predicted C++ behavior is static analysis, not a claimed Windows runtime result.

The inversion algorithm and long long count are correct for values representable by its element type; N≤1000 limits the count to 499500.
The missing contract is the element representation, not the inversion-count accumulator.

## 3. a836: integer parse failure silently changes both input sets

Original location: src/lib/cpeLessons/batch6/part4.ts:717, set<int> parse(...), int x, while(in >> x). Fixed as described above.

Fresh source specifies two lines of distinct integers, without numeric limits.

~~~text
2147483648
2147483649
~~~

The two singleton sets are disjoint, so expected output is:

~~~text
A and B are disjoint
~~~

The exported Python program produces that output.
Each C++ istringstream extraction fails before result.insert(x), making both parsed sets empty.
The equality branch then prints A equals B.
No source rule permits treating an out-of-range integer as an absent set element.

As above, this establishes a mismatch with the supplied written domain, not evidence about hidden UVa test values.
If the intended source domain is signed 32-bit, that needs to be stated and backed by the actual source rather than inferred from the implementation.

## 4. a824: distinguish all word insertions from sorting distinct words

Location: src/lib/cpeLessons/batch6/part3.ts:1135, complexity; actual C++ performs words.insert(word) for every completed word.

The annotation says lexical scanning O(L), then approximately O(W log W) string comparisons for sorting W distinct words.
That describes the unique-word sorting stage of Python, but is incomplete for the C++ ordered set: if T word tokens occur, including duplicates, all T insert/find traversals cost up to O(log W) comparisons each.
A valid article can contain W distinct words and then many repeats of a word deep in the set; there is still an ordered-set search for each repetition.
The input permits up to 5000 lines of 200 characters and up to 5000 distinct words, so many repeated tokens are within the published domain.

Suggested annotation only: C++ O(L + T log W) counting bounded-length string comparisons, or O(L log(W+1)) as a safe character-work upper bound; Python expected tokenization/hash work plus distinct-word sorting separately.
String-comparison lengths should remain explicit if generalized beyond the local 200-character line bound.
The parser, case handling, distinct-word result, and output ordering are correct. This is a low-priority explanation/complexity correction, not a wrong-answer claim.

## 5. a841: stored input token is omitted from the space label

Location: src/lib/cpeLessons/batch6/part4.ts:1071, complexity says input length L, result length D, space O(D).
The actual C++ reads the entire input number into string s.

Arbitrarily many leading zeros are not forbidden by the supplied source. A token consisting of 100000 zeros with source base 2 and target base 16 produces the one-digit result 0.
The arithmetic state remains capped, but string s still contains 100000 characters.
Thus total storage is O(L+D), while O(D) is valid only when explicitly labeled auxiliary space excluding the stored input token.
This clarification matters because the explanation specifically motivates saturation by the absence of an input-length limit.
No arithmetic or output-format defect was found: cap=16^7 safely rejects every value that cannot fit in any allowed target base; cap×16+15 fits long long.

## Existing a817 ambiguity, not a newly established algorithm bug

The current lesson already states that right associativity is a convention because neither the local statement nor its cited original explicitly specifies association.
For 2**3**2, right association yields512; left association yields64.
The fresh statement gives precedence but does not expressly settle that choice.
Do not turn either result into an independently certified source requirement without additional evidence.
This reviewer did not reopen the official PDF and makes no new claim about its contents.

The C++ custom integer implementation itself was read in full:
base10000 limbs, signed add/subtract normalization, long long multiplication carry, exponent halving, the base1 shortcut, and parser precedence were inspected.
No additional concrete defect was found in these operations.
No extreme-output-size benchmark or C++ executable run was performed.

## Explicit numeric limits checked

- a804: at most500 rounds×100 points=50000 per player; int scores and J×R≤250000 are safe.
- a805: dimensions remain≤50, operation count per insertion/deletion<10; coordinate shifts fit int.
- a806: exact decimal strings avoid fixed-width Fibonacci overflow; n≤5000 is within allocated5001 entries.
- a810: three base26 letters yield at most17575, four decimal digits≤9999; int difference/abs are safe.
- a811: at most100 unit moves; position and resolved instruction references fit int.
- a813: long long safely evaluates all coefficients≤1000 in absolute value and x≤999, including negative values.
- a814: Luhn contribution≤9 for each of16 positions, so int total≤144.
- a815: vertices≤44 and edge IDs<1995 fit adjacency45 and used2000; self-loops add two degree contributions.
- a816: initial empties<2000; exchange c>1 decreases total, integer state/drink count is bounded.
- a820: ±10^9 conversion uses long long; n-r and subsequent negative-base division are safe.
- a821: at most26 real leaves and at mostR-2 dummy leaves; long long weights and integer rounding are safe for frequencies≤999.
- a822: promised answers≤2^32 require more than signed int and are safely stored in long long.
- a823: positive input≤2147483647 fits unsigned int; output counter≤31.
- a826: each frequency≤2000 is within the2001-entry sieve; ASCII-only input is within128 counters.
- a827: D≤10^18 gives candidates approximately10D/9<1.12×10^18, safely below signed long long maximum.
- a829: specified values≤10000 fit int; lower_bound handles duplicate/absent values and an empty nonterminal input list safely.
- a832:30-bit inputs fit long long, gcd>1 correctly represents a legal binary divisor≥2.
- a833: two maxima can sum to4294967294; both heaps and the addition are long long.
- a834: fewer than10 decimal digits fit long long, digit+digit+carry≤19.
- a835: n≤1000 implies at most499500 pairs; BIT indices1..5000 are within allocated storage.
- a839: published coordinate values<10000 fit event keys; simultaneous events and repeated active heights do not require arithmetic on large combined heights.
- a840: sieve limit1000 matches N; requested2C≤2000 fits int.
- a842: after reducing modulo M≤46340, products are at most46339² and safely within long long.
- a843: n≤60000 makes divisor-pair loops and int proper-divisor sums safe.
- a844: independent coin DP gives ways[30000]=543427145501<2^63, and the1-cent coin makes the count nondecreasing, so this bounds the table.
- a845: k≤8 gives base≤10000, s≤9999, s²≤99980001, safely within signed int.
- a846: at most10000 commands and15-character names bound stored stack data.
- a847: word length≤30 bounds every frequency and the26-element frequency set.

For tasks whose fresh statements omit scalar value bounds (including block dimensions in a809), finite-width representability outside explicit limits was not silently certified.
The concrete32-bit witnesses above were selected because they are compact and expose divergent C++ behavior; they are not an exhaustive audit of every unspecified numeric domain.

## Per-code coverage ledger

All rows: complete fresh statement plus goal, every explanation paragraph, complexity, pitfall, and entire exported C++ read and reasoned about.
"Reviewed" does not mean the C++ program was executed.

| Code | Focus and conclusion |
| --- | --- |
| a804 | Reviewed round-major modulo mapping, largest-index tie rule, EOF, bound50000. No mismatch found. |
| a805 | Reviewed replay per original cell, EX swap, same-command old-coordinate shifts, deletion permanence, blank-line/header format. No algorithm mismatch found; displayed QKA query cost omits one-time operation ingestion when Q=0, a minor degenerate complexity convention. |
| a806 | Reviewed complete decimal-string addition, carry propagation, F0/F1 initialization, F5000 storage and exact phrase. No mismatch found. |
| a807 | Reviewed isspace cast, punctuation within words, whitespace passthrough, EOF flush, longest-word extra storage. No mismatch found. |
| a808 | Reviewed divisibility before periodic comparison, minimality, n≤80 bound, inter-case blank lines. No mismatch found. |
| a809 | Reviewed three normalized orientations, strict two-axis shrinkage, sorted DAG DP and reuse of types. No mismatch found within representable dimensions; fresh dimension upper bound is absent. |
| a810 | Reviewed Horner base26, A=0, decimal stoi after hyphen, inclusive difference100. No mismatch found. |
| a811 | Reviewed resolved ±1 history, SAME AS predecessor indexing, per-case reset. No mismatch found. |
| a812 | Reviewed all mirror-map pairs, independent palindrome/mirror booleans, center character, all four messages and final blank lines. No mismatch found. |
| a813 | Reviewed inclusive0..L Horner evaluation, negative remainder equality0, full-zero sentinel before modulus. No mismatch found. |
| a814 | Reviewed four string groups, leading zeros, even0-based doubling and digit sums. No mismatch found. |
| a815 | Reviewed Euler even-degree/connected precondition, first-edge home endpoint, loops/multiedges, ascending adjacency, postorder edge collection/reversal and blank line. No concrete mismatch found. |
| a816 | Reviewed batch bottle exchange, recycled bottles, c>1 termination, no borrowed-bottle assumption. No mismatch found. |
| a817 | Read complete custom big integer and recursive parser. Existing associativity/output-size limitations remain explicitly disclosed; no new arithmetic defect established. |
| a818 | Reviewed doubling lower bound and partial last paste construction, N1, negative sentinel, case output. No mismatch found. |
| a819 | Reviewed G as group count, half-open reverse segments, terminal0 before reading string. No mismatch found. |
| a820 | Reviewed normalized parity digit for negative n, exact quotient division by-2, reversal and0 special case. No mismatch found. |
| a821 | Reviewed minimal dummy padding, weight/min-letter tie key, digit assignment, prefixing reversed merges, exact two-decimal rounding. No mismatch found. |
| a822 | Reviewed immortal female recurrence and simultaneous old-state updates, N0,2^32 promise. No mismatch found. |
| a823 | Reviewed count of ones rather than parity bit, no leading zero and exact sentence. No mismatch found. |
| a824 | Reviewed English-only boundaries, case fold, EOF submission and lexicographic set. Result logic correct; complexity should account for all T ordered-set insertions. |
| a825 | Reviewed removal of region1, target survivor index11 among N-1, Josephus recurrence, ascending m search, N13. No mismatch found. |
| a826 | Reviewed sieve0/1 false, maximum frequency2000, case-sensitive ASCII order and empty. No mismatch found. |
| a827 | Reviewed D=9q+r, all10 last digits, q≥1, two-solution sorting,10^18 long long safety. No mismatch found. |
| a828 | Reviewed duplicate-path flag, root and immediate-parent completeness, depth/lexicographic level order. Structural logic correct; unbounded positive node values conflict with stoi/int. |
| a829 | Reviewed sorting and lower_bound first occurrence, range check before dereference, CASE# format. No mismatch found. |
| a830 | Reviewed exactly n record lines, first word only, no name deduplication, country map ordering. No mismatch found under the75-character record bound. |
| a831 | Reviewed merge inversion proof, equal-left tie, remaining-left contribution and count bounds. Sort logic correct; element int extraction lacks a source range guarantee. |
| a832 | Reviewed positive binary divisor≥2 equivalence with gcd>1 and30-bit parsing. No mismatch found. |
| a833 | Reviewed two-heap order/size invariants and long long median average. No mismatch found. |
| a834 | Reviewed chained carries, uneven decimal lengths, terminal0 0 and singular/plural wording. No mismatch found. |
| a835 | Reviewed query-before-update Fenwick counting of≤x, fixed5000 universe and case reset. No mismatch found. |
| a836 | Reviewed equality/subset before disjoint, line-preserving parser and intersection logic. Set logic correct; int parse failure can silently produce empty sets. |
| a837 | Reviewed peak printed once, A² digits per wave, one blank line between all adjacent waves globally. No mismatch found. |
| a838 | Reviewed sample-derived ASCII-7, original CR/LF preserved, raw-character streaming and EOF. No mismatch found. |
| a839 | Reviewed half-open events, simultaneous same-x processing, duplicate heights in multiset, delete-one semantics and final ground0. No concrete mismatch found. |
| a840 | Reviewed special1, parity-dependent2C or2C-1 selection, whole-list cap, centered start and blank lines. No mismatch found. |
| a841 | Reviewed safe16^7 saturation, source parsing, target conversion, zero and width7 ERROR. Arithmetic correct; total stored space includes input lengthL. |
| a842 | Reviewed modular-power invariant, result1%M, exponent0/M1, bounded products. No mismatch found. |
| a843 | Reviewed1 special case, proper divisor pairs, square roots counted once, width5/two spaces and report headings. No mismatch found. |
| a844 | Reviewed coin-outer unbounded combinations, ascending amount loop, ways0=1, query-sized preprocessing and singular wording. Independent maximum count fits long long. |
| a845 | Reviewed square-root enumeration bound s<10^(k/2), exact split check, leading-zero width, safe int square and repeated-query cache. No mismatch found. |
| a846 | Reviewed stack invariant, empty Kick, Test-only output, name preservation and amortized bounds. No mismatch found. |
| a847 | Reviewed positive frequencies only, at least two letters, unique frequency set and case accumulation. No mismatch found. |

## Snapshot hashes

SHA-256 after inspection:

| File | SHA-256 |
| --- | --- |
| ../tutorial-audit-source/all-problems.json | 07A147F340B1C8A7ACB3B09409C7DF19EF646B5458F993A4A7BA2B369E5AFE43 |
| src/lib/cpeLessons/batch6/part2.ts | 03EC31D23382023A43CCD7180897FB9D507FDC5ECE4AEC0911F762CB84CD6D5F |
| src/lib/cpeLessons/batch6/part3.ts | EFCA11F59320C4E5CF4D98C861E1F7E8A294FB2F4773BF6B0986DF9E12BE5BF4 |
| src/lib/cpeLessons/batch6/part4.ts | 2FC87C4F352690338821FDF0DE051E5BD71A9330DC5E581BC26CB96A7F240939 |
| src/lib/cpeLessons/final.ts | BEB84387812434CBD42D811167DF3FC2579B1C6B2DFD3AC56992CC2060674A10 |

The hashes above identify the original review snapshots before remediation.
The authorized fixes are recorded in the remediation section; subsequent shared audit/runtime validation belongs to the parent.
This report does not certify arbitrary later edits made during concurrent integration.

