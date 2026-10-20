# Independent cross-review: TOI beginner batch 3, a225–a268

Date: 2026-10-20. This sidecar changed only this Markdown document.
All 44 batch3 lessons received reasoning review against the complete fresh statement and public sample in ../tutorial-audit-source/beginner-problems.json.
The review covered both exported programs, parser/output contracts, explanation, stated complexity, and every sample-animation frame.
The author's regression/oracle script was not read or rerun. No source, registry, package, CI, or completed batch2 file was edited.

Final outcome: **one confirmed source ambiguity, a229 ties, now explicitly disclosed in the lesson; no concrete algorithm or animation mismatch found in the other 43 lessons.**
The cross-review is complete. The intended judge policy for tied minima remains unspecified; disclosure does not establish a smallest-index requirement.
This is bounded review evidence, not an exhaustive correctness or judge-performance certification.

## Snapshot and concurrent edits

The initial batch3 SHA-256 throughout the main review was:
1413688EED500794D8F8B58C55BA646CE4FBA90BF808C5BF0B780E7B2EAB5FF1.

Before writing this report, another collaborator updated a229's explanation to explicitly mark the tie contract unresolved.
That reread batch3 SHA-256 was:
766276D624438E299E816F177EDC6EC28B6829F17B79BE34FC07E34156874967.
The a229 programs and public sample remained the same in that reread.

At final document creation another collaborator had changed the source bytes again
(SHA-256 C37985C088D5162D201A90A3A5EC2054A2BE652C9A2445E7052E6E87B1075889).
Parent subsequently confirmed that this byte change was Prettier formatting and that the a229 change was prose-only. This attribution comes from the parent's follow-up, not an independent semantic diff by this reviewer.
The detailed ledger refers to the reviewed snapshots above.

Fresh source JSON SHA-256:
5BFD2626A6A6E259CE3E167DB65B53AED2F43E755EA7C86523E2502DC14BE2C4.

Reasoning was divided into four complete statement chunks: a225–a235, a236–a246, a247–a257, and a258–a268.
Program exports were read in smaller groups, with a227 reread separately to ensure its complete code was inspected.
The Node loader was used to inspect actual exported strings; escaped diagnostic representations were not treated as program defects.
Parent a086 was also reviewed, as recorded below.

## Finding: a229 tie handling remains unresolved

Location at the reviewed snapshot: src/lib/toiBeginnerLessons/batch3.ts, a229 declaration at line 177.

The fresh statement specifies the fastest counter and its duration, but contains neither a guarantee that the minimum is unique nor a rule choosing among tied minima.
The program retains the smallest index: C++ updates only on t < best, and Python min(range(3), key=...) selects the first index.
The formula itself is correct: a p-person queue with s items takes 3s + 2(p-1) seconds.

Concrete legal ambiguity witness:

~~~text
1 1 1
1
1
1
~~~

All three counters take 3 seconds. The actual exported Python program prints:

~~~text
1 3
~~~

The existing statement does not establish that 1 3 is required, nor that 2 3 or 3 3 is rejected.
This witness demonstrates an incomplete output contract, **not** a proven wrong answer by the implementation.
Do not count passing a smallest-index tie oracle as independent verification of the problem's intended policy.

The latest a229 explanation now explicitly labels this unresolved and says that smallest index is an implementation convention.
That is an appropriate disclosure; it does not settle what the judge accepts.
If a precise tie policy is later established for the judge, align the statement, tests, and tutorial with that policy. The current lesson appropriately leaves it unresolved rather than presenting the smallest-index convention as a verified requirement.
No source change is proposed or applied by this reviewer.

Official-source verification boundary:
The source links [official Supermarket PDF](https://tpmso.k12ea.gov.tw/toi/wp-content/uploads/question/202310/Supermarket.pdf).
Both that URL and the tpmso.org mirror-path attempt were inaccessible through this review's web reader.
Therefore this review independently confirms the omission in the supplied fresh statement, but does **not** claim to have read the official PDF.
Parent subsequently reported a read-only pypdf extraction and full reading of both official PDF pages, confirming that neither a tie rule nor a uniqueness guarantee appears. This is separately attributed parent evidence, not a claim that this reviewer read the PDF.
Together, the independent fresh-statement review and the parent's official-source check establish a source ambiguity; they do not establish what the judge accepts for tied minima.

## Independent bounded checks

Executed actual exported Python programs through the repository Node loader, using the trusted Python runtime.
One Python process received the export JSON and ran these finite in-memory checks; no new runner/test file was created.
Public sample passes from the author's suite were not used as the basis for the following claims.

There were **1,748 independent oracle comparisons** across nine selected algorithms, all matching,
plus **one observational a229 tie witness** whose output contract is unresolved.
The fixed finite input sweep terminated successfully; no maximum-input performance benchmark was performed.
These checks did not execute C++ binaries.

| Code | Comparisons | Independent model and domain |
| --- | ---: | --- |
| a225 | 1 | Legal type -1 and 100, clear type -1, log in again, distinguish terminal pair. |
| a227 | 243 | All 81 two-by-two grids with values 1..3, for 1/2/3 days. Use the sorted-neighbor median interval, not higher/lower vote counters. |
| a230 | 642 | Every binary-type sequence of length 1..6 and every target occurrence. Physically remove the leftmost survivor, then find/remove the nearest surviving same-type target. |
| a248 | 336 | N=1..3, all initial yields 1..4, M=1..4. Memoized search chooses actual day-by-day mining, records first-activation dates, and decays started mines on idle days. No heap/prefix assumption. |
| a250 | 32 | Seeded 3×4 maps with empty cells, both mirrors, obstacles. Reflect coordinate direction vectors (/ maps (dr,dc) to (-dc,-dr); backslash to (dc,dr)), rather than reusing the direction tables. |
| a254 | 199 | N=2..200, prime pairs obtained from an independently built sieve; compare against first-factor/quotient primality algorithm. |
| a256 | 270 | T=1..30, R=1..9, backward minimax using only legal moves that do not exceed T. No modulo theorem in the oracle. |
| a264 | 2 | Preserve leading/trailing spaces while wrapping Z/z, and handle an empty text line with k=0. |
| a266 | 23 | Immutable tuple transitions for three fixed and twenty seeded initial pairs. Verify all equal values change, selection follows prior parity, and sample state checkpoints after rounds 1/3/12 match the animation. |
| a229 | 1 observation | Three identical three-second queues print 1 3. This is an observation, excluded from the 1,748 verified oracle comparisons. |

The a264/a266 public outputs were also checked directly while resolving the representation of escaped source strings;
both matched exactly. One representative C++ a225 source was read through clang++ -Wall -Wextra -fsyntax-only from stdin;
this produced no warning. That diagnostic is not a claim of full-batch C++ execution or compilation coverage.

## Per-code reasoning ledger

"Reviewed" in this table means complete source-statement/program/explanation/complexity/animation reasoning review, not merely title or sample inspection.
Each animation was checked against its actual first public sample.
Unless stated otherwise, no mismatch was identified within this scope.

| Code | Reasoning review and sample-animation evidence | Status |
| --- | --- | --- |
| a225 | Map types -1..100 to table indices 0..101; test the whole -1 -1 terminal pair before processing. Whole-type logout resets a count, not subtracts one. Sample states 7:2/8:1 → 7:0/8:1 → total 2. O(Q), fixed table plus Python input buffer are described. | Reviewed |
| a226 | Rain and light arrive as separate arrays. Both nonnegative prefix sums must reach thresholds; return k+1 even when k=N. Sample prefixes (2,1),(2,6),(6,6) imply week 4. O(N) time/storage. | Reviewed |
| a227 | Strict majority denominator includes tied-valued neighbors but excludes missing ones. Zero neighbors stays unchanged; all daily writes use old state. Independently recomputed sample day 1 (3 7 4 / 3 2 5) and day 2 (3 6 5 / 3 3 4), each sum 24. O(KHW), O(HW). Maximum-bound runtime was not benchmarked against judge limits. | Reviewed + independent checks |
| a228 | Sorted same-person touching intervals can be merged because no time gap exists. Two-pointer intersection advances the earlier end without skipping a possible earlier start. Length is e-s, exact D is accepted. Sample intersections [5,9], empty, [19,30] give 19 27. O(N+M) with merged lists. | Reviewed |
| a229 | Queue duration formula and sample 14/14/9 are correct. Legal tied minima lack an established output policy; smallest index is a convention. Latest lesson explicitly warns of this. | Unresolved source contract |
| a230 | Since the player always shoots the leftmost survivor, no live same-type target lies to its left. Occurrences of each type pair consecutively; the stored immediate next occurrence is alive whenever an unpaired occurrence is shot. Boss assistance does not recurse. Sample shots remove (1,4),(2,5),(3,7),(6); target falls on shot 4. O(N+V) arrays/C++ bound is valid. | Reviewed + independent checks |
| a231 | Store water, add W before demand, equality at zero succeeds, retain previous surplus. Sample day-end amounts 3,5,0,7 imply -1. Maximum storage N×W≤5,000,000 fits int. Python reads each specified daily record line; O(N+ΣM), O(max M) buffer. | Reviewed |
| a232 | A=(N-MY)/(X-Y); exact divisibility and 0≤A≤M establish both equations and nonnegative B. Negative numerator/denominator are allowed and handled in both languages. Sample (-4)/(-2)=2, B=5. Constant complexity. | Reviewed |
| a233 | Mark start and every unit step; clamp each step to room bounds and advance direction even for zero steps. Sample right 4/down 2/left 1/up 3 yields top ***** and lower ...** rows. O(RC+9|S|), O(RC). | Reviewed |
| a234 | Keep final position per case-sensitive letter; rank retained positions chronologically; output those ranks in ASCII A..Z,a..z order without separators. Sample A,b,C,a ranks map to A,C,a,b → 1342. U≤52, stated time/storage include input. | Reviewed |
| a235 | Sum positive and negative adjacent differences separately; net first-to-last change is insufficient. Strict improvement of best record retains smallest seat. Sample up/down totals 65/5,30/100,0/0 match trace. O(NM), O(M) is a valid upper bound for both implementations. | Reviewed |
| a236 | Pair matching indices from the two input score rows, not adjacent input tokens as student pairs. Unequal scores are guaranteed. Append ascending IDs; empty class prints -1. Sample 1 3 / 2 4. O(N). | Reviewed |
| a237 | Count the union of divisibility and containing digit B, once per x, inclusive endpoints. Sample events 8,12,14,16,20,24 produce sixth=24. O(interval length × digits), digits≤3. | Reviewed |
| a238 | Price uses pre-sale stock and descending inclusive 80/60/40/20% thresholds; exactly 20% still permits a sale. Each item is floored separately. Sample five 8s, four 10s, four 13s, two 15s =162. O(S), constant state. | Reviewed |
| a239 | Four disjoint travel/wait/eat/return times all contribute; <=T accepts equality. Sample 7+11+16+8=42≤45. Constant complexity. | Reviewed |
| a240 | Read all Mi before store lists; count respondent product frequencies, then sum those per unique product in a store. No multiplication by store inventory quantity. Sample product counts 4:2,8:3,6:1 and store scores 2,3,1. Python line generator can retain a whole split line; the stated L term acknowledges this. | Reviewed |
| a241 | Distinct destinations give a permutation, so every component is a cycle with no incoming tree. Walk each previously unseen vertex once. Sample cycles 1-2-3,4-5,6 have maximum 3. Self loops work. O(K) time/storage. | Reviewed |
| a242 | Inverse map fragment label to one-based shelf; zeros are empty shelves and ignored. Guaranteed one occurrence of each fragment 1..M makes the inverse complete. Sample positions 3,6,1,4. O(N+M), stated Python input cost acknowledged. | Reviewed |
| a243 | Process through terminal zero, flag duplicate eliminations, then prioritize Wrong before counting surviving wolves. No early victory return can hide later bad records. Sample wolf 1 survives after 2/4 eliminated. O(N+Q), Python input storage included. | Reviewed |
| a244 | X is column, Y row; H changes column and V row. Starting coordinates are nonnegative, so only upper-bound escape can occur. Same-letter overlap allowed, conflict permanently fails. Sample T shared at (0,1), final TOI./O.../P... at rows 1..3. O(N²+total word lengths). | Reviewed |
| a245 | Convert complete times to minutes, require show>=now+20, choose first sorted feasible show, do not wrap to tomorrow. Sample 08:39 fails and 08:40 succeeds, both fields padded. N stored times explain O(N) space. | Reviewed |
| a246 | Award an entire region's X electoral votes according to the region's N vs M; do not sum popular votes as final result. Guaranteed no ties removes tie ambiguity here. Sample A gains 6+5=11 vs B9. O(K), constant state/Python buffer acknowledged. | Reviewed |
| a247 | Weighted sums in 100/500/1000 denomination order; zero counts legal. Sample envelope sums 2300 and 4000 give 6300. long long safely covers the supplied total≤10^9. O(N), streaming fixed state. | Reviewed |
| a248 | The t chosen uses of a mine are bounded by b,b-1,...; a contiguous activation block attains this independently of block order, since unstarted mines do not decay. Largest positive marginal allocation respects each sequence prefix. Trace is an actual block schedule, not a falsely interleaved heap order: mine4 8+7+6, mine2 7+6, mine1 6 =40. Heapify supports O(N+M log N), O(N). | Reviewed + physical-time search |
| a249 | Map each unique case-sensitive oil to its category index, sum repeated recipe entries, retain first category on equal totals. Sample Fresh16/Sweet13/Warm8. Average hash complexity and bounded name length are explicit. | Reviewed |
| a250 | Direction tables match the supplied / and backslash reflections in all four incoming directions. Count entered non-obstacle cells once, but stop only on repeated cell+direction, not repeated cell. Sample 4 top +2 right +2 bottom=8. At most 4NM states. | Reviewed + vector reflection checks |
| a251 | Greedily assign the next queued order to the first available identical machine; selected start times cannot decrease, so input start order is preserved. Equal availability can choose either machine. Sample completions (7,4)→(7,8)→(14,8)→(14,12), maximum14. O(M), two completion times. | Reviewed |
| a252 | Count maximal contiguous equal runs, not global frequency, and flush final run even at N=1. Sample 99 / 2 / 555 / 22 gives 2 1 3 2. Stored output can have N runs, matching O(N) space. | Reviewed |
| a253 | Replicate each pixel Q times then each expanded row P times; output lower bound gives O(NMPQ). The current expanded row uses O(MQ), not full expanded image. Sample two rows become four, widths2→6, all trace rows match. | Reviewed |
| a254 | First divisor must be prime. If remaining quotient is composite, N has at least three prime factors with multiplicity and no other pair of primes can solve it. Handle prime N as 0 0 and prime squares as valid. Sample143=11×13. long long squares safe; O(√N), constant auxiliary state. | Reviewed + independent sieve |
| a255 | Ordered conditions enforce minimum building: 6 multiple, odd/non3, then square or even/non7. Last digit odd iff number odd. C++ square-root corrections and Python isqrt avoid a false square test. Sample 18→1,25/49→2,14→0,81/22→3. Fixed bounded-word sqrt underlies stated O(N). | Reviewed |
| a256 | Losing remaining distances are multiples of R+1; nonzero remainder first move and complementary replies never require exceeding T. Sample T23/R4 leaves 20 after first3, then totals8,13,18,23 after each pair. O(1). | Reviewed + minimax |
| a257 | Night reads day-start vampires and protects hunters; day reads the completed night grid and spreads only from pre-day hunters. Preserve old occupants except hunter overwrite; copies prevent same-phase cascades. Recomputed both sample stages and final hunter Manhattan-radius2 region; all displayed rows agree. O(KHW), O(HW). | Reviewed |
| a258 | Both palindrome and membership in AHIMOTUVWXY are required, including center character. Sample TAMAT meets both. C++ scans original string with constant extra state; Python reversal adds O(N), as disclosed. | Reviewed |
| a259 | Existing full decks=min of all 52 frequencies including zero. Using every card requires max frequency decks, missing count52×max-N. Sample seven cards with max2 gives0/97. O(N+52), fixed table/input storage accounted. | Reviewed |
| a260 | Count maximal filled runs, flush line ending in1, use0 for empty line; columns must precede rows. Sample columns 1 1 /2/1 1/1, then rows2/2/0/1 2 exactly match trace. O(N²) time/matrix. | Reviewed |
| a261 | Trial divisors pair d with n/d, count sqrt once, and count n=1 correctly. Inclusive range and strict best update retain smallest tied n. Sample24 and30 both have8 divisors, choose24. d² within int bounds. O((y-x+1)√y), constant state. | Reviewed |
| a262 | Evaluate all three complete standalone plan costs with nonnegative overages; do not combine/rebuy plans. Sample751 costs2253/1652/702. Maximum cost under provided T fits int; O(1). | Reviewed |
| a263 | Convert dates with fixed365-day months and take cyclic day difference; same day gives0 without inclusive-day off-by-one. Sample ordinals58 and61 differ3. Month table and traversal fixed12. | Reviewed |
| a264 | Read a complete text line, remove only line ending, apply modulo26 separately within ASCII uppercase/lowercase, preserve all other characters and edge spaces. Sample Zebra/go→Bgdtc/iq with punctuation preserved. O(length) time/storage. Actual exports were checked to disambiguate escaped diagnostic rendering. | Reviewed + format checks |
| a265 | Each axis individually divisible by K is necessary and sufficient for axis-aligned K cubes; volume divisibility alone insufficient. Sample4×5×3=60. All1000/K1 yields10^9, long long safe. Constant complexity. | Reviewed |
| a266 | Mode depends on selected array's current first element, including zero as a multiple of3. Choose old output before changing every equal extremum, then select by that output parity. Positive total decreases each nonterminal round; a non-divisible-by3 first entry is positive, so positive minimum exists. Sample rounds1/3/12 and final0 are consistent. O(initial element sum), fixed five-cell work per round; output buffering disclosed. | Reviewed + immutable transitions |
| a267 | Index item by X-1/one-based table; multiply unit price by grams and accumulate duplicate purchases. Terminal0 0 is checked before indexing. Sample30+30+20=80. Q-dependent input buffer and long long accumulation are appropriate. | Reviewed |
| a268 | Preserve query list before reading shelf, map each unique shelf ID to one-based (layer,position), emit repeated queries separately and only -1 for missing. Queries have a range bound, so map rather than assuming all shelf IDs fit a20000-sized array is appropriate. Sample42 repeats 1 2,99 gives-1. Expected O(RC+N), matching stored input and map. | Reviewed |

## Quick parent a086 review

Read the complete fresh Tangyuan statement and the individuallyAuthored.a086 object in src/lib/toiBeginnerLessons.ts.
The solution pools each flavor across all participants, then uses (total+9)/10 and boxes×10-total.
Zero demand yields0 boxes/0 leftovers; exact multiples of10 yield0 leftovers.
The supplied upper bound is2500 per flavor, so int safely holds each sum and multiplication.

All six trace steps match the public input:
sesame/peanut cumulative demands (3,7),(3,9),(11,9),(13,14), then boxes(2,2), leftovers(7,6).
Output order is sesame first, peanut second, with two integers per line.
Both programs stream one participant at a time, supporting O(N) time and O(1) auxiliary storage.
No mismatch identified. This was a quick reasoning review, not another execution of the parent's a086 suite.

## Handoff

Cross-review complete. Parent has confirmed the official-source omission and the lesson now discloses it. No further source edit is requested by this report; the judge's intended tie policy remains an external specification question.
The other 43 batch3 lessons and a086 had no concrete mismatch under this bounded review.
No source fixes were applied, and no branches, commits, package/CI files, registry entries, or production state were changed.

