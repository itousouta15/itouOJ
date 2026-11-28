#!/usr/bin/env python3
"""Bounded independent peer review; reads author data only, writes peer-review JSON.
Run with WSL kali-linux python3; --fresh ignores prior matching-hash results.
Executables are Linux binaries under /tmp.
No author fixtures, verifiers, or expected sample outputs are used as oracles.
"""
import collections,functools,hashlib,itertools,json,math,pathlib,random,subprocess,sys,tempfile,time
from concurrent.futures import ThreadPoolExecutor,as_completed
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[2]
DATA=ROOT/'src/lib/newProblemLessons/data/nov08-608-653.json'
P=1000000007
NOTES={
611:('XOR of window sums; initial x is not reduced modulo c. Two synchronized generators preserve the window.','Generator product <=10^18+10^9 and temporary sum <=(10^7+1)10^9 fit signed64. O(n), constant extra state; Python 1-second caveat already present.','1,2,3 with k2 has sums3,5 and XOR6.'),
612:('Forbidden consecutive-label adjacencies form path components. Each selected run has exactly two orientations; inclusion-exclusion sign is number of selected edges.','n1000 quadratic states, factorial indices <=n<P; modular intermediate products fit signed64.','n3 selected-edge weighted counts 1,4,2 give6-8+2=0.'),
613:('Squares are unlabeled selections. Same-color sorted diagonals give nested opposite-diagonal availability, so L-j+1 counts available cells; colors convolve.','k>2n-2 (n1 exception) exits before allocating by k; n500,k250000 tested.','2x2 each color has two singleton placements; two bishops gives4.'),
615:('Counts surjections of positions to symbols via missing-symbol inclusion-exclusion, not unlabeled partitions.','k<=n<=10^6<P; 0^n=0 since n>=1. Factorial inverse is legal.','n3,k2:8-2+0=6.'),
616:('Deletion choices distinguish positions even when resulting strings coincide. First original character has a unique partner; interleavings choose C(total operations,inner+1).','Odd lengths yield0; empty subinterval contributes1. Cubic n500, quadratic tables, Python performance caveat present.','aaaa has3 distinct first adjacent pairs, each leading to one final deletion.'),
617:('Counts strings containing pattern at least once via complement, discarding completed-match transitions; handles overlapping occurrences.','Alphabet is26 uppercase, not binary. m>n allowed and gives0. O(26nm+26m^2) stated bound safe.','AA at length2: avoidance states650,25 total675;26^2-675=1.'),
618:('Each input coin usable once; descending DP or immutable shifted old bitset. Output distinct sums, not subset counts.','S<=100000; Python integer-output extraction worst-case bit complexity caveat already accurate.','Two2 coins give positive sums2,4, not duplicate sum2 or sum0.'),
619:('Rectangular blocks of all positive dimensions allowed; split/join top states count tilings without treating mirrors as same.','Sorted repeated queries preserve order; rolling states use old a in b update. O(maxn+tlogt), not a height-sized Python table.','States(1,1)->(5,3)->(23,11), totals2,8,34.'),
621:('Subsequences count position sets, not distinct value strings. Independently choose no position or exactly one from each equal-value group.','Per-factor modulus prevents growth; all-distinct count2^n-1 and all-equal countn.','Two occurrences of1 and one2:3*2-1=5.'),
623:('Machine production is floor(T/k); binary search first feasible time with valid single-fastest upper bound.','hi<=10^18. C++ adds at most t-1 before one <=10^18 contribution then breaks, safe signed64.','Periods2,3 target4:time5 makes3;time6 makes5, first feasible6.'),
629:('Positive triangular numbers, repeats allowed. Test one, then monotone positive pair search; Gauss permits answer3 after one/two ruled out.','n<=10^12 gives8n+1<=8e12+1 and safe integer-corrected square root. Worst100 maximum queries ~1.4e8 steps; existing Python caveat.','n8 pair sums7,9,6 then crossing, so minimum3.'),
630:('Rotation group C4 only, not reflection/dihedral. Fixed-cell orbit counts include odd central cell.','n^2<=10^18 signed64; no exponent reduction moduloP, division4 inverse legal.','n2 fixed coloring counts16,4,2,2 average6.'),
631:('Rotation necklaces, not reflection equivalence. gcd rotation cycles regroup by divisor totients.','n<=10^6<P makes inverse n legal. n1,m1 both covered. O(nloglogn+tau(n)logn) plus linear scan.','n3,m2 fixed counts8,2,2 average4.'),
632:('Nonempty given prefix must never go negative. With r=2u+balance, reflected bad count C(r,u+balance+1)=C(r,u-1). Code handles exhausted prefix and u=0.','n<=10^6<P, invalid C indices give0; odd n rejected before factorial construction.','n4,prefix(:3 possible completions minus1 bad=2.'),
633:('Length n (not number of pairs); odd lengths0. Empty internal prefix is correct reduction to Catalan.','Factorial indices<=10^6<P. C++ s is empty initialized string, not uninitialized input.','n4: C(4,2)-C(4,1)=6-4=2.'),
634:('Distinct primes <=10^6 are coprime toP. Product exponent uses count mod(P-1), while displayed count uses modP; divide k(k+1) before reducing.','k(k+1)<=1.000000001e18; reduced exponent timesD<1.000000012e18, all safe signed64. Denominator p-1 nonzero moduloP.','2^2 then3 gives count6,sum28,product8^2*3^3=1728.'),
635:('Repeated adjacent XOR gives Pascal coefficients; Lucas parity iff index submask n-1.','Values1..10^9 fit30bits and signed32 XOR. n1 and power-of-two lengths covered.','4,6,1 ->2,7 ->5; middle cancels.'),
636:('Includes empty subset0; answer is number of distinct XOR values, not subset multiplicities and not moduloP.','Rank<=30,1LL<<30=1073741824 fits64; inputs can all be zero.','1,2 span4 XORs;3 dependent, rank unchanged.'),
637:('Triangular high-bit basis lets greedy choose each highest bit without later changes. Empty subset allowed.','30 dimensions sufficient since10^9<2^30; maximum XOR can exceed largest input but remains<2^30.','Trace additionally reports rank/count as useful side facts; final max for1,2,3 is3.'),
638:('Query previous prefix XORs before insert, initial zero supplies subarrays from start; greedy Trie chooses highest differing bit.','30bit limit correct even though XOR can exceed10^9; node bound and compact Python arrays noted.','0,2,7 prefixes yield max7 for2,5.'),
639:('Counts popcounts1..n; including0 harmless. Independent bit-period aggregation.','n<=10^15 uses at most50bits;2*h and total<5e16 fit signed64.','0..5 per-bit totals3,2,2 sum7.'),
640:('Labeled gifts with all fixed points excluded; derangement recurrence has correct D0=1,D1=0.','n1 returns0. (n-1)*(a+b)<2e15 signed64, per-step modulo.','D1=0,D2=1,D3=2.'),
641:('Distinct children, identical apples, zero shares allowed: stars-and-bars C(n+m-1,m).','n,m>=1, factorial0 valid for n1. n+m-1<=1999999<P, safe inverse.','n2,m3 gives four shares (0,3)..(3,0).'),
642:('Counts visible permutations of all characters, dividing each repeated-letter factorial once.','Length<=10^6<P means nonzero denominator; Counter only lowercase letters, total factorial loops linear.','aab:6 labeled /2 repeated =3.'),
643:('Counts unordered distinct positions; Mobius sum cancels noncoprime gcd, ones and duplicate ones retained.','Max answer C(100000,2)=4999950000 requires64; code c and ans long long. Sieve multiplication tested before indexing.','2,3,4 yields3 candidates minus pair2,4 =2.'),
644:('Zero is valid once; prev10 represents no significant digit. Leading zeros never treated as repeated digits. F(-1)=0 handles lower bound0.','Bound10^18 fits signed64. Even over unrestricted19-digit length, valid paths<=1+sum9^k<1.6e18, no DP accumulator overflow.','0..12 gives10 one-digit/zero plus10 and12 =12.'),
645:('Exact domino tilings, not arbitrary rectangles. First empty cell chooses one unique placement; zero final mask excludes protrusion.','n<=10 controls mask; recursion depth<=10. O(m3^n) bound conservative. Odd area0, one-row parity tested.','2x3:after1column masks0/3 each1, dp0 after2=2 and after3=3.'),
646:('Strictly increasing and positions distinguish: rank-1 query excludes equal values; update after query preserves index order.','n2e5, residues boundedP, modular Fenwick arithmetic and O(n) buffers stated.','1,2,2 gives ending counts1,2,2 total5.'),
648:('Unordered equal-sum partition counted once by fixing n in second set; descending updates forbid repeats.','Odd total exits. n<=500 total125250; target<=62625, stated upper bound125250 is conservative.','n3 only chosen subset{1,2} opposite{3}, count1.'),
651:('Unknown0 is a marker, not allowed final value. Adjacent difference<=1 inclusive, fixed positions retain only their own state.','Sentinels0,m+1 remain zero; n1 both fixed/unknown, m1 covered. n1e5*m100 polynomial bound.','m3, unknown/2/unknown gives states(1,1,1),(0,3,0),(3,3,3), total9.'),
}

def cases():
    records=collections.defaultdict(list); rng=random.Random(60865320261108)
    def add(code,inp,expected,reason):
        key=f'b{code}'; text=str(expected) if not isinstance(expected,(list,tuple)) else '\n'.join(map(str,expected))
        if any(c['input']==inp for c in records[key]): return
        records[key].append(dict(input=inp,expected=text,oracle=reason))
    def arr(a): return str(len(a))+'\n'+' '.join(map(str,a))+'\n'
    # 611: materialized independently generated windows, including unreduced seed.
    for _ in range(35):
        n=rng.randint(1,18); k=rng.randint(1,n); x=rng.randint(0,10**9); a,b,c=rng.randint(0,10**9),rng.randint(0,10**9),rng.randint(1,20); xs=[x]
        for i in range(n-1): xs.append((a*xs[-1]+b)%c)
        answer=0
        for i in range(n-k+1): answer^=sum(xs[i:i+k])
        add(611,f'{n} {k}\n{x} {a} {b} {c}\n',answer,'Direct materialized window sums, then XOR; first x unreduced.')
    # 612: exhaustive actual permutations; no inclusion-exclusion recurrence.
    for n in range(1,10):
        z=sum(all(abs(a-b)!=1 for a,b in zip(p,p[1:])) for p in itertools.permutations(range(1,n+1)))
        add(612,f'{n}\n',z,'Enumerate all n! permutations and adjacent absolute differences.')
    n=14
    @functools.lru_cache(None)
    def hamilton(mask,last):
        if mask==(1<<n)-1: return 1
        return sum(hamilton(mask|1<<j,j) for j in range(n) if not(mask>>j&1) and abs(last-j)!=1)
    z=sum(hamilton(1<<j,j) for j in range(n)); add(612,'14\n',z%P,'Independent exact subset/last Hamilton-path DP on allowed-adjacency graph; count exceeds modulus.')
    # 613: explicit independent subsets of chess squares.
    for n in range(1,5):
        for k in range(1,min(n*n,2*n)+1):
            z=0
            for ps in itertools.combinations(itertools.product(range(n),repeat=2),k):
                z+=len({x+y for x,y in ps})==k and len({x-y for x,y in ps})==k
            add(613,f'{n} {k}\n',z,'Exhaustive square subsets; both diagonal keys must be distinct.')
    add(613,'500 250000\n',0,'Exact pigeonhole certificate: >998 mutually nonattacking bishops.')
    for n in range(1,9):
        for k in range(1,min(4,n)+1):
            z=sum(len(set(s))==k for s in itertools.product(range(k),repeat=n))
            add(615,f'{n} {k}\n',z,'Enumerate every length-n word over k symbols; test set cardinality.')
    add(615,'1000000 1\n',1,'Only the constant word exists.')
    st=[1]+[0]*20
    for i in range(1,1001): st=[0]+[j*st[j]+st[j-1] for j in range(1,21)]
    add(615,'1000 20\n',st[20]*math.factorial(20)%P,'Exact Stirling-number partition recurrence times20!, independent of missing-symbol inclusion-exclusion; modular wrap.')
    @functools.lru_cache(None)
    def erase(s):
        if not s: return 1
        return sum(erase(s[:i]+s[i+2:]) for i in range(len(s)-1) if s[i]==s[i+1])
    words=['a','aa','aaa','aaaaaa','aabbaabb','abababab','abbaabba','aaaaaaaaaa']+[''.join(rng.choices('abc',k=rng.randint(1,10))) for _ in range(35)]
    for s in words: add(616,s+'\n',erase(s),'Enumerate every possible current adjacent equal-pair index; memoize resultant string but preserve branch multiplicity.')
    add(616,'a'*100+'\n',math.prod(range(1,100,2))%P,'All letters equal: each current even length L has L-1 adjacent choices, exact99!!; tests count modulus and interleaving.')
    for n in range(1,7):
        for pattern in ('A','AA','ABA','ABAB','AZA','AAAAAAA'):
            alphabet=sorted(set(pattern)); options=alphabet+['#']; z=0
            for word in itertools.product(options,repeat=n):
                s=''.join(word)
                if pattern in s: z+=(26-len(alphabet))**s.count('#')
            add(617,f'{n}\n{pattern}\n',z%P,'Enumerate pattern letters plus one weighted OTHER symbol, multiplicity26-distinct pattern letters. No KMP states.')
    add(617,'1000\nA\n',(pow(26,1000,P)-pow(25,1000,P))%P,'Exact single-letter avoidance certificate at n limit, modulo wrap.')
    for _ in range(30):
        a=[rng.randint(1,1000) for _ in range(rng.randint(1,12))]; sums=sorted({sum(xs) for k in range(1,len(a)+1) for xs in itertools.combinations(a,k)})
        add(618,arr(a),str(len(sums))+'\n'+' '.join(map(str,sums)),'Enumerate all nonempty coin position subsets, deduplicate actual sums.')
    def rectangles(n):
        full=(1<<(2*n))-1
        @functools.lru_cache(None)
        def f(mask):
            if mask==full: return 1
            i=next(i for i in range(2*n) if not(mask>>i&1)); y,x=divmod(i,2); ans=0
            for w in range(1,3-x):
                for h in range(1,n-y+1):
                    bits=sum(1<<(2*yy+xx) for yy in range(y,y+h) for xx in range(x,x+w))
                    if not mask&bits: ans+=f(mask|bits)
            return ans
        return f(0)
    heights=[5,1,3,5,2,4,1]; add(619,'7\n'+'\n'.join(map(str,heights))+'\n',[rectangles(n) for n in heights],'Enumerate arbitrary axis-aligned rectangles at the first unfilled square of a2xn bitmap; repeated unsorted queries.')
    for _ in range(30):
        a=[rng.randint(1,5) for _ in range(rng.randint(1,12))]; z=sum(len(set(xs))==len(xs) for k in range(1,len(a)+1) for xs in itertools.combinations(a,k))
        add(621,arr(a),z,'Enumerate every nonempty position subset and test uniqueness of selected values.')
    add(621,arr(list(range(1,101))),(pow(2,100,P)-1)%P,'All distinct: every nonempty position subset; explicit modular-wrap certificate.')
    for _ in range(30):
        a=[rng.randint(1,10) for _ in range(rng.randint(1,7))]; t=rng.randint(1,25); time0=next(x for x in range(min(a)*t+1) if sum(x//v for v in a)>=t)
        add(623,f'{len(a)} {t}\n'+' '.join(map(str,a))+'\n',time0,'Direct scan through each integer second to find first sufficient production.')
    add(623,'1 1000000000\n1000000000\n',10**18,'Single machine exact multiplication certificate for signed64 upper bound.')
    # 629: unbounded integer coin DP, not one/two test or Gauss theorem.
    tri=[i*(i+1)//2 for i in range(1,50) if i*(i+1)//2<=600]; dp=[0]+[999]*600
    for v in range(1,601): dp[v]=min(dp[v-x]+1 for x in tri if x<=v)
    for start in range(1,601,100):
        ns=list(range(start,min(601,start+100))); add(629,str(len(ns))+'\n'+'\n'.join(map(str,ns))+'\n',[dp[x] for x in ns],'Independent minimum positive-triangular coin DP for every integer1..600.')
    # Orbit enumeration, explicitly no reflection equivalence.
    for n in range(1,4):
        classes=set()
        for mask in range(1<<(n*n)):
            p={(r,c) for r in range(n) for c in range(n) if mask>>(r*n+c)&1}; images=[]
            for turn in range(4):
                images.append(tuple(sorted(p))); p={(c,n-1-r) for r,c in p}
            classes.add(min(images))
        add(630,f'{n}\n',len(classes),'Enumerate all binary grids and canonicalize four geometric rotations only.')
    # For large n use geometrically derived coordinate-cycle counts (no formula n*n/4).
    for n in (5,6,17,18):
        cells={(r,c) for r in range(n) for c in range(n)}; counts=[]
        for turns in range(4):
            left=set(cells); cyc=0
            while left:
                cyc+=1; r,c=next(iter(left))
                while (r,c) in left:
                    left.remove((r,c))
                    for _ in range(turns): r,c=c,n-1-r
            counts.append(cyc)
        add(630,f'{n}\n',sum(pow(2,x,P) for x in counts)*pow(4,P-2,P)%P,'Explicit permutation-cycle enumeration on coordinates, Burnside after exact cycle counts.')
    for n in range(1,8):
        for m in (1,2,3):
            classes={min(s[i:]+s[:i] for i in range(n)) for s in itertools.product(range(m),repeat=n)}
            add(631,f'{n} {m}\n',len(classes),'Enumerate color words and canonicalize cyclic rotations, never reversals.')
    def balanced(s):
        b=0
        for c in s:
            b+=1 if c=='(' else -1
            if b<0: return False
        return b==0
    for n in range(1,13):
        for _ in range(6):
            k=rng.randint(1,n); s=''.join(rng.choices('()',k=k)); z=sum(balanced(s+''.join(t)) for t in itertools.product('()',repeat=n-k))
            add(632,f'{n}\n{s}\n',z,'Enumerate every suffix and directly test all prefix balances; includes exhausted/invalid prefixes.')
        z=sum(balanced(''.join(s)) for s in itertools.product('()',repeat=n)); add(633,f'{n}\n',z,'Enumerate all binary bracket words and test prefix balances.')
    # Product of divisors from global exponent formula, not incremental recurrence.
    def geom(p,n):
        if n==0: return 1,0
        x,s=geom(p,n//2); xx=x*x%P; ss=s*(1+x)%P
        return (xx*p%P,(ss+xx)%P) if n%2 else (xx,ss)
    def divisor_expected(factors):
        D=math.prod(k+1 for p,k in factors); summ=prod=1
        for p,k in factors:
            summ=summ*geom(p,k+1)[1]%P; prod=prod*pow(p,k*D//2,P)%P
        return f'{D%P} {summ} {prod}'
    factor_cases=[[(2,1)],[(2,2)],[(999983,10**9)],[(2,10**9),(3,10**9-1),(5,500000002)],[(2,500000002),(3,1)],[(2,1000000000),(3,1000000000)]]
    factor_cases += [[(p,rng.randint(1,5)) for p in rng.sample([2,3,5,7,11],rng.randint(1,4))] for _ in range(30)]
    for fs in factor_cases:
        add(634,str(len(fs))+'\n'+''.join(f'{p} {k}\n' for p,k in fs),divisor_expected(fs),'Exact unreduced divisor count; global per-prime exponent k*D/2; geometric sum from recursive doubling, not modular inverse.')
    for _ in range(35):
        a=[rng.randint(1,10**9) for _ in range(rng.randint(1,35))]; xs=a[:]
        while len(xs)>1: xs=[x^y for x,y in zip(xs,xs[1:])]
        add(635,arr(a),xs[0],'Build the entire adjacent-XOR pyramid directly; no binomial/submask formula.')
    for _ in range(35):
        a=[rng.choice([0,1,2,2**29,10**9,rng.randint(0,10**9)]) for _ in range(rng.randint(1,13))]; reachable={0}
        for x in a: reachable|={x^y for y in reachable}
        add(636,arr(a),len(reachable),'Enumerate exact reachable XOR set, not Gaussian basis.')
        add(637,arr(a),max(reachable),'Enumerate exact reachable XOR set and maximize.')
        vals=[]
        for i in range(len(a)):
            v=0
            for x in a[i:]: v^=x; vals.append(v)
        add(638,arr(a),max(vals),'Enumerate every nonempty contiguous interval XOR directly, no prefix Trie.')
    basis=[1<<i for i in range(30)]; add(636,arr(basis),2**30,'Exact independent powers-of-two span certificate; tests answer >P without modulus.')
    add(637,arr(basis),2**30-1,'All thirty independent bits can be selected simultaneously.')
    add(638,arr(basis),2**30-1,'Entire interval of powers of two sets all thirty bits, global bitwise upper bound.')
    def bits_recursive(n):
        if n<=0: return 0
        k=n.bit_length()-1; h=1<<k
        return (k*(h//2) if k else 0)+(n-h+1)+bits_recursive(n-h)
    for n in list(range(1,35))+[2**49-1,2**49,2**49+1,10**15]: add(639,f'{n}\n',bits_recursive(n),'Independent highest-power decomposition: popcount complete block plus high-bit remainder, recursively.')
    for n in range(1,10):
        z=sum(all(i!=x for i,x in enumerate(p)) for p in itertools.permutations(range(n))); add(640,f'{n}\n',z,'Enumerate all gift permutations, reject fixed points.')
    for n in (10,100,1000):
        z=sum((-1)**i*(math.factorial(n)//math.factorial(i)) for i in range(n+1))%P; add(640,f'{n}\n',z,'Exact integer inclusion-exclusion derangement formula, no rolling recurrence.')
    for n in range(1,7):
        for m in range(1,9):
            # independent bounded compositions DP instead of modular factorials
            dp=[1]+[0]*m
            for _ in range(n): dp=[sum(dp[:j+1]) for j in range(m+1)]
            add(641,f'{n} {m}\n',dp[m],'Integer composition DP over all allowed0..m shares per distinct child.')
    for n,m in [(1,1000000),(1000000,1)]: add(641,f'{n} {m}\n',1 if n==1 else n,'Exact one-child / one-apple certificate at maximum input.')
    add(641,'100 100\n',math.comb(199,100)%P,'Exact integer binomial before reduction, checks modular factorial inverses.')
    for _ in range(30):
        s=''.join(rng.choices('abc',k=rng.randint(1,8))); z=len(set(itertools.permutations(s))); add(642,s+'\n',z,'Enumerate character permutations and deduplicate visible strings.')
    add(642,'a'*50+'b'*50+'\n',math.comb(100,50)%P,'Choose positions of the50 identical a letters in exact integers, then reduce moduloP.')
    for _ in range(35):
        a=[rng.randint(1,100) for _ in range(rng.randint(1,20))]; z=sum(math.gcd(x,y)==1 for x,y in itertools.combinations(a,2)); add(643,arr(a),z,'Direct gcd of every unordered position pair.')
    add(643,arr([1]*100000),4999950000,'All distinct position pairs gcd1; exact C(100000,2), above signed32.')
    # 644: combinatorial lexicographic rank, not digit DP.
    def no_equal_upto(n):
        if n<0: return 0
        s=str(n); z=1+sum(9**k for k in range(1,len(s)))
        previous=None
        for i,ch in enumerate(s):
            digit=int(ch); choices=range(1 if i==0 else 0,digit)
            z+=sum(c!=previous for c in choices)*9**(len(s)-i-1)
            if digit==previous: return z
            previous=digit
        return z+int(n!=0)
    for a,b in [(0,0),(0,9),(0,10),(10,11),(99,101),(100,100),(101,101),(0,10**18),(10**18,10**18),(10**18-1000,10**18)]+[(a:=rng.randint(0,20000),a+rng.randint(0,500)) for _ in range(35)]:
        if b<30000: z=sum(all(x!=y for x,y in zip(str(v),str(v)[1:])) for v in range(a,b+1)); why='Direct decimal validation of every integer, including zero.'
        else: z=no_equal_upto(b)-no_equal_upto(a-1); why='Exact count by shorter digit lengths and lexicographic first-difference ranking, not digit-DP states.'
        add(644,f'{a} {b}\n',z,why)
    def dominoes(n,m):
        full=(1<<(n*m))-1
        @functools.lru_cache(None)
        def f(mask):
            if mask==full: return 1
            i=next(i for i in range(n*m) if not(mask>>i&1)); r,c=divmod(i,m); ans=0
            for j in ([i+1] if c+1<m else [])+([i+m] if r+1<n else []):
                if not(mask>>j&1): ans+=f(mask|(1<<i)|(1<<j))
            return ans
        return f(0)
    for n in range(1,5):
        for m in range(1,7): add(645,f'{n} {m}\n',dominoes(n,m),'Whole-board occupancy-mask exhaustive domino placements, not column-mask transitions.')
    f,g=0,1
    for _ in range(1001): f,g=g,f+g
    add(645,'2 1000\n',f%P,'Width2 domino strip has Fibonacci1001 tilings by first vertical vs two horizontal pieces; exact integers then moduloP.')
    for _ in range(35):
        a=[rng.randint(1,6) for _ in range(rng.randint(1,12))]; z=sum(all(x<y for x,y in zip(s,s[1:])) for k in range(1,len(a)+1) for s in itertools.combinations(a,k)); add(646,arr(a),z,'Enumerate all nonempty index subsets and directly test strict increase.')
    add(646,arr(list(range(1,101))), (pow(2,100,P)-1)%P,'Every nonempty subset of a strictly increasing array is increasing; tests modulus.')
    for n in range(1,19):
        total=n*(n+1)//2; z=sum(sum(s)*2==total for k in range(n) for s in itertools.combinations(range(1,n),k)); add(648,f'{n}\n',z,'Exhaustive subsets excluding n, directly test twice subset sum equals full sum.')
    for _ in range(40):
        n=rng.randint(1,8); m=rng.randint(1,4); a=[rng.randint(0,m) for _ in range(n)]; z=sum(all(a[i] in (0,s[i]) for i in range(n)) and all(abs(x-y)<=1 for x,y in zip(s,s[1:])) for s in itertools.product(range(1,m+1),repeat=n)); add(651,f'{n} {m}\n'+' '.join(map(str,a))+'\n',z,'Enumerate complete arrays over1..m; filter fixed positions and neighbor differences.')
    add(651,'100000 2\n'+' '.join(['0']*100000)+'\n',pow(2,100000,P),'Any array over1,2 automatically has neighboring difference<=1: exact2^100000, maximum n and modular wrap.')
    return records

def main():
    raw=DATA.read_bytes(); lessons={l['code']:l for l in json.loads(raw)}; sources={s['code']:s for s in json.loads((HERE/'source.json').read_text())}; allcases=cases(); started=time.time(); reviews=[]; findings=[]
    previous_path=HERE/'peer-review-608-653.json'
    previous={r['code']:r for r in json.loads(previous_path.read_text()).get('reviews',[])} if previous_path.exists() and '--fresh' not in sys.argv else {}
    fixture_path=HERE/'checks-608-653.json'
    # These inputs are read solely to disclose overlap, never as expected values.
    fixture_inputs=collections.defaultdict(set)
    if fixture_path.exists():
        for case in json.loads(fixture_path.read_text()): fixture_inputs[case['code']].add(' '.join(case['input'].split()))
    for code,tests in allcases.items():
        public={' '.join(c['input'].split()) for c in sources[code]['samples']}
        for test in tests:
            inp=' '.join(test['input'].split()); test['overlapsPublicSampleInput']=inp in public; test['overlapsAuthorFixtureInput']=inp in fixture_inputs[code]
    def review(num):
        code=f'b{num}'; lesson=lessons[code]; tests=allcases[code]; failures=[]; runtime=[]
        hashes={k:hashlib.sha256(lesson[k].encode()).hexdigest() for k in ('cpp','python')}; old=previous.get(code,{})
        cache={}
        if old.get('implementationSha256')==hashes:
            cache={(e['language'],e['input'],e['expected']):e for e in old.get('executions',[]) if e['passed']}
        todo=[case for case in tests if any((lang,case['input'],case['expected']) not in cache for lang in ('cpp','python'))]
        for case in tests:
            for lang in ('cpp','python'):
                key=(lang,case['input'],case['expected'])
                if key in cache: runtime.append(dict(cache[key],**case))
        reused=len(runtime)
        if not todo:
            return dict(old,independentCaseCount=len(tests),executions=runtime,failures=[],reusedExecutions=reused)
        with tempfile.TemporaryDirectory(prefix='peer-'+code+'-',dir='/tmp') as td:
            td=pathlib.Path(td); cpp=td/'main.cpp'; py=td/'main.py'; exe=td/'main'; cpp.write_text(lesson['cpp']); py.write_text(lesson['python']); p=subprocess.run(['g++','-std=c++17','-O2','-pipe',str(cpp),'-o',str(exe)],capture_output=True,text=True)
            if p.returncode: failures.append(dict(code=code,kind='compile',stderr=p.stderr))
            for language,cmd in [('cpp',[str(exe)]),('python',[sys.executable,str(py)])]:
                if language=='cpp' and p.returncode: continue
                for case in tests:
                    if (language,case['input'],case['expected']) in cache: continue
                    before=time.perf_counter()
                    try:
                        run=subprocess.run(cmd,input=case['input'],capture_output=True,text=True,timeout=30); ok=run.returncode==0 and run.stdout.split()==case['expected'].split(); record=dict(case,language=language,actual=run.stdout,returncode=run.returncode,seconds=round(time.perf_counter()-before,5),passed=ok)
                        if not ok:
                            f=dict(code=code,kind='oracle-mismatch',**record,stderr=run.stderr); failures.append(f); print('ACTIONABLE FINDING '+json.dumps(f,ensure_ascii=False),flush=True)
                    except subprocess.TimeoutExpired:
                        record=dict(case,language=language,passed=False,timeoutSeconds=30); failures.append(dict(code=code,kind='timeout',**record)); print('ACTIONABLE TIMEOUT '+code+' '+language,flush=True)
                    runtime.append(record)
        proof,limits,trace=NOTES[num]
        return dict(code=code,degree='Manual statement/both implementations/proof/trace/limits review plus independent executable oracles; not a hidden-case proof.',statementSha256=hashlib.sha256(sources[code]['statement'].encode()).hexdigest(),implementationSha256=hashes,proofReview=proof,limitsAndComplexityReview=limits,traceReview=trace,independentCaseCount=len(tests),executions=runtime,failures=failures,reusedExecutions=reused)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for f in as_completed([pool.submit(review,num) for num in NOTES]):
            r=f.result(); reviews.append(r); findings+=r['failures']; print(r['code'],r['independentCaseCount'],'independent cases; failures',len(r['failures']),flush=True)
    changed=hashlib.sha256(DATA.read_bytes()).hexdigest()!=hashlib.sha256(raw).hexdigest()
    current={l['code']:l for l in json.loads(DATA.read_bytes())}
    changed_programs=[r['code'] for r in reviews if any(hashlib.sha256(current[r['code']][k].encode()).hexdigest()!=r['implementationSha256'][k] for k in ('cpp','python'))]
    result=dict(task='Independent bounded peer review of b608-b653',reviewedCodes=sorted(r['code'] for r in reviews),notReviewedCodes=[f'b{i}' for i in range(608,654) if i not in NOTES],datasetSha256AtRead=hashlib.sha256(raw).hexdigest(),datasetChangedDuringRun=changed,reviewedAtUtc=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),durationSeconds=round(time.time()-started,2),independentCases=sum(len(x) for x in allcases.values()),executions=sum(len(r['executions']) for r in reviews),findings=findings,reviews=sorted(reviews,key=lambda r:r['code']),limitations=['Only listed codes were reviewed; no correctness assertion for notReviewedCodes.','Independent finite cases and manual invariant review do not prove all hidden inputs.','Timing is observed per test only; no full-size benchmark or judge time guarantee. Existing Python performance cautions remain applicable.','No author data, check files, verification scripts, integration files, commits or PRs were modified.'],reproduce='wsl -d kali-linux --exec python3 '+str(pathlib.Path(__file__).resolve()),environment='Linux g++ -std=c++17 -O2 and Linux Python '+sys.version)
    result['implementationsChangedDuringRun']=changed_programs
    result['newInputsBeyondPublicAndAuthorFixtures']=sum(not c['overlapsPublicSampleInput'] and not c['overlapsAuthorFixtureInput'] for tests in allcases.values() for c in tests)
    result['cachedExecutionsReusedWithIdenticalImplementationHash']=sum(r.get('reusedExecutions',0) for r in reviews)
    (HERE/'peer-review-608-653.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print('REPORT',len(reviews),'codes',result['independentCases'],'cases',result['executions'],'executions',len(findings),'findings',flush=True)
    return bool(findings)
if __name__=='__main__': sys.exit(main())
