"""Investigate b133 AP relaxation. Pure-Python checks are safe on Windows.
C++ verification is implemented only in --verify, which requires WSL/Linux.
Owned output: b133-candidate.json; no original lesson is changed.
"""
import argparse, collections, hashlib, itertools, json, math, pathlib, subprocess, sys, tempfile, time
ROOT=pathlib.Path(__file__).resolve().parents[3]
OUTPUT=pathlib.Path(__file__).with_name('b133-candidate.json')

def prepare_ap(a,b,h):
    assert 0<a<b and h>0 and (b-a)%h==0
    g=math.gcd(a,h)
    a,b,h=a//g,b//g,h//g
    return a,b,h,g,(pow(a,-1,h) if h>1 else 0)

def ceil_div(a,b): return -((-a)//b)

def feasible_ap(ctx,x,K):
    if K<0: return False
    a,b,h,g,inv=ctx
    x=abs(x)
    if x%g: return False
    x//=g
    lo=max(-K,ceil_div(2*x-(b-a)*K,a+b))
    hi=min(K,(2*x+(b-a)*K)//(a+b))
    if lo>hi: return False
    residue=(x%h)*inv%h
    if h&1:
        if (residue-K)&1: residue+=h
        step=2*h
    else:
        if (residue-K)&1: return False
        step=h
    return residue+ceil_div(lo-residue,step)*step<=hi

def minimum_ap(ctx,x,upper):
    answer=upper+1
    for parity in (0,1):
        if upper<parity: continue
        last=upper-((upper-parity)&1)
        if not feasible_ap(ctx,x,last): continue
        lo,hi=0,(last-parity)//2
        while lo<hi:
            mid=(lo+hi)//2
            if feasible_ap(ctx,x,parity+2*mid): hi=mid
            else: lo=mid+1
        answer=min(answer,parity+2*lo)
    return answer

def formula_checks(collect=False):
    exact_tests=min_tests=systems=0
    probes=[]; fixtures=[]
    for a,h,length in itertools.product(range(1,10),range(1,6),range(2,7)):
        coins=tuple(a+h*j for j in range(length)); b=coins[-1]; ctx=prepare_ap(a,b,h)
        current={0}; first={0:0}; layers=[]
        for K in range(9):
            if K:
                current={s+sign*d for s in current for d in coins for sign in (-1,1)}
                for s in current: first.setdefault(s,K)
            layers.append(current)
            for x in range(-K*b-1,K*b+2):
                expected=x in current; actual=feasible_ap(ctx,x,K)
                assert actual==expected,(coins,K,x,actual,expected)
                exact_tests+=1
                if collect: probes.append((0,a,b,h,x,K,int(expected)))
        for x in range(-30,31):
            for upper in range(9):
                expected=first.get(x,upper+1)
                if expected>upper: expected=upper+1
                assert minimum_ap(ctx,x,upper)==expected,(coins,x,upper,expected)
                min_tests+=1
                if collect: probes.append((1,a,b,h,x,upper,expected))
        if collect:
            for x in (1,7,19):
                if x in first: fixtures.append(dict(code='b133',input=str(x)+'\n'+' '.join(map(str,coins)),output=str(first[x]),reason='完整 signed-sum BFS 逐層擴展、不裁切金額，首次到達即最少總枚數。'))
        systems+=1
    return dict(systems=systems,exactKChecks=exact_tests,boundedMinimumChecks=min_tests,maxDepth=8),probes,fixtures


CPP_AP=r'''
// All monetary products and interval endpoints are calculated in signed 128 bits.
struct APContext { long long a=0,b=0,h=0,scale=1,inverse=0; };
APContext prepareAP(long long a,long long b,long long h){
    long long scale=std::gcd(a,h);
    a/=scale; b/=scale; h/=scale;
    long long inverse=0;
    if(h>1){long long y;eg(a,h,inverse,y);inverse%=h;if(inverse<0)inverse+=h;}
    return {a,b,h,scale,inverse};
}
bool feasibleAP(const APContext &p,I x,long long K){
    if(K<0)return false;
    x=ab(x);
    if(x%p.scale)return false;
    x/=p.scale;
    I width=(I)p.b-p.a, sum=(I)p.a+p.b;
    I lo=max(-(I)K,ceilDiv(2*x-width*K,sum));
    I hi=min((I)K,floorDiv(2*x+width*K,sum));
    if(lo>hi)return false;
    I residue=(x%p.h)*p.inverse%p.h,step=p.h;
    if(p.h&1){if((residue-K)%2!=0)residue+=p.h;step*=2;}
    else if((residue-K)%2!=0)return false;
    return residue+ceilDiv(lo-residue,step)*step<=hi;
}
// Returns the exact minimum <= upper, or upper+1 if no such representation exists.
long long minimumAP(const APContext &p,I x,long long upper){
    long long answer=upper+1;
    for(long long parity=0;parity<2;parity++){
        if(upper<parity)continue;
        long long last=upper-((upper-parity)&1);
        if(!feasibleAP(p,x,last))continue;
        long long lo=0,hi=(last-parity)/2;
        while(lo<hi){long long mid=lo+(hi-lo)/2;
            if(feasibleAP(p,x,parity+2*mid))hi=mid;else lo=mid+1;
        }
        answer=min(answer,parity+2*lo);
    }
    return answer;
}
vector<APContext> apContexts;
vector<char> fullAP;
'''
CPP_INIT=r'''
apContexts.resize(d.size());fullAP.assign(d.size(),false);
long long apStep=0,apMin=d.back();
for(int i=(int)d.size()-1;i>=0;i--){
    apStep=std::gcd(apStep,d[i]-apMin);
    if(apStep>0){
        apContexts[i]=prepareAP(apMin,d[i],apStep);
        fullAP[i]=(d[i]-apMin)/apStep+1==(long long)d.size()-i;
    }
}
'''
CPP_PRUNE=r'''
long long lower=minimumAP(apContexts[i],r,best-used);
if(lower>=best-used)return;
if(fullAP[i]){best=used+lower;return;}
'''

PROOF=[
 '令完整等差幣系為a+jh（j=0至m），b=a+mh。恰用K枚時，正付款P枚、負找零Q枚，故t=P−Q、P=(K+t)/2、Q=(K−t)/2；因此|t|≤K且t≡K (mod 2)。',
 '每個正幣的索引可任選0至m，P個索引和恰可取得0至mP的每個整數（歸納或逐次填滿m）。負幣索引和同理為0至mQ，因此兩者之差可取得−mQ至mP的每個整數。這一步證明區間條件的充分性，不只是必要性。',
 '故x=a t+h z可行當且僅當a t≡x (mod h)，且a t−(b−a)Q≤x≤a t+(b−a)P。代入P,Q並整理，即L=ceil((2x−(b−a)K)/(a+b))≤t≤U=floor((2x+(b−a)K)/(a+b))，再與[−K,K]相交。負x可將所有正負號翻轉，故只需處理abs(x)。',
 '先取g=gcd(a,h)。若g不整除x則不可能；否則a,b,h,x同除g後gcd(a,h)=1，可以求a的模h反元素，得t≡r=x a^(-1) (mod h)。h=1時此餘數為0。',
 '若h為奇數，r與r+h奇偶相反，選與K同奇偶者並用週期2h；若h為偶數，必須r與K同奇偶，否則無解，通過時週期為h。將得到的單一剩餘類與[L,U]相交，用ceil除法找第一個候選即可常數次算術判定。',
 '恰用K枚可行時，加上一枚任意面額的正幣及一枚同額負幣，即得到K+2枚可行。所以只能分別在偶數K、奇數K上二分；不能直接把全部K視為單調。每個奇偶類先測上界內最大的該奇偶K，若仍不可行就整類略過，否則二分其第一個可行值。',
 '一般不同面額集合S的a=min(S)、b=max(S)、h=gcd(d−a:d∈S)使S包含於完整AP {a,a+h,…,b}。原集合的每個恰K枚方案都是此AP的方案，所以AP的最小枚數不大於原集合最優值，是安全下界；只有集合大小等於(b−a)/h+1時，才可把AP的值當成原集合精確解。',
 'DFS以剩餘面額後綴建立這個AP；若上界best−used以內不存在更小AP方案，原後綴也不可能改善best，直接剪枝。若後綴是完整AP，直接精確收尾。單幣整除與兩幣Euclid收尾保留，其他情況仍執行原本完整係數搜尋，不把放寬問題誤當一般集合答案。',
 '原有限上界仍有效：除總gcd後，最大面額D的餘數圖連通，至x mod D的最短簡單非負路徑≤D−1枚，其總額≤D(D−1)；再以正負D元補足x，總枚數≤2D+floor(x/D)+1。單幣／兩幣Euclid得到的實際可行方案可進一步縮小上界。AP函數若在給定上限內無解，僅回傳upper+1哨兵，不宣稱這是超界的真正最小值。'
]

def make_candidate():
    import inspect, re, ast
    source=json.loads((ROOT/'src/lib/newProblemLessons/data/practice2.json').read_text(encoding='utf-8'))
    lesson=next(x for x in source if x['code']=='b133')
    cpp=lesson['cpp']; py=lesson['python']
    original_cpp,original_python=cpp,py
    assert cpp.count('void dfs(')==1
    cpp=cpp.replace('void dfs(',CPP_AP+'\nvoid dfs(',1)
    cpp,count=re.subn(r'long long\s+B\s*=\s*best\s*-\s*used\s*-\s*1\s*;',CPP_PRUNE+'\nlong long B=best-used-1;',cpp,count=1)
    assert count==1
    cpp,count=re.subn(r'dfs\(0,\s*x,\s*0\);',CPP_INIT+'\ndfs(0,x,0);',cpp,count=1)
    assert count==1
    py=ast.unparse(ast.parse(py))+'\n'
    assert py.count('def dfs(')==1
    py_functions='\n\n'.join(inspect.getsource(f) for f in [prepare_ap,ceil_div,feasible_ap,minimum_ap])
    py_init='''ap_contexts=[None]*len(d)
full_ap=[False]*len(d)
ap_step=0
for index in range(len(d)-1,-1,-1):
 ap_step=math.gcd(ap_step,d[index]-d[-1])
 if ap_step:
  ap_contexts[index]=prepare_ap(d[-1],d[index],ap_step)
  full_ap[index]=(d[index]-d[-1])//ap_step+1==len(d)-index
'''
    py=py.replace('def dfs(',py_functions+'\n\n'+py_init+'\ndef dfs(',1)
    assert py.count('    B = best - used - 1\n')==1
    py=py.replace('    B = best - used - 1\n', '''    lower=minimum_ap(ap_contexts[i],r,best-used)
    if lower>=best-used:return
    if full_ap[i]:best=used+lower;return
    B = best - used - 1
''',1)
    return dict(code='b133',title=lesson['title'],cpp=cpp,python=py,
        explanation=[
            '每種面額淨枚數可正可負，目標是Σcᵢdᵢ=x並最小化Σabs(cᵢ)。保留原本單幣整除、兩幣Euclid精確解與一般完整係數搜尋。',
            *PROOF[:8],
            '每個後綴的最小面額固定為最後一項，最大面額為該後綴第一項；向後累積gcd(d−a)，可用O(k)次gcd預處理全部AP與完整性標記。C++所有殘額、區間分子與K(b−a)都用有號128位元，面額輸入必須能容納2147483648。',
            PROOF[8]
        ],
        complexity='k≤50、有限枚數上界B。完整AP以O(log B)次可行性判定求精確最小值，單次判定為常數次128位算術／Python大整數操作，另有O(log D)反元素預處理。所有後綴預處理O(k log D)、空間O(k)。一般情形若走訪V個DFS節點，AP額外開銷O(V log B)，原係數枚舉最壞仍可保守寫O((2B+1)^(k−2)·k)，不宣稱一般幣系多項式或全域20秒保證。Python一次split輸入O(k)儲存，整數位數成本另計。',
        pitfall='只在固定奇偶的K序列二分；先除gcd(a,h)，並正確合併mod h與mod 2。一般面額集合的AP是超集合，只能提供下界，不能直接當成實際答案。C++的負數整除須向下／向上取整，且K(b−a)、2x必須先轉128位元。',
        proof=PROOF,
        baseCppSha256=hashlib.sha256(original_cpp.encode()).hexdigest(),
        basePythonSha256=hashlib.sha256(original_python.encode()).hexdigest())

def bfs_answers(coins,targets):
    """Unclipped infinite signed-sum graph BFS until all requested targets are found."""
    targets=set(targets); first={0:0}; q=collections.deque([0]); remaining=targets-{0}
    while remaining:
        s=q.popleft(); nxt=first[s]+1
        for d in coins:
            for v in (s-d,s+d):
                if v in first: continue
                first[v]=nxt; q.append(v); remaining.discard(v)
    return {x:first[x] for x in targets}

def general_checks():
    cases=[]; subset_relaxations=0
    for size in range(1,6):
        for coins in itertools.combinations(range(1,9),size):
            g=math.gcd(*coins); targets=list(range(0,21,g)); answers=bfs_answers(coins,targets)
            if len(coins)>1:
                a,b=coins[0],coins[-1]; h=math.gcd(*(d-a for d in coins));ctx=prepare_ap(a,b,h)
                for x,cost in answers.items():
                    assert minimum_ap(ctx,x,cost)<=cost
                    subset_relaxations+=1
            for x,cost in answers.items():cases.append(dict(code='b133',input=str(x)+'\n'+' '.join(map(str,coins)),output=str(cost),reason='任意小面額子集合的無金額裁切 signed-sum BFS 最短距離；含非完整AP，驗證放寬下界沒有被誤當答案。'))
    return cases,subset_relaxations

def extra_cases():
    D=2147483648; K=1073741823; x=1073741824
    assert 536870912*(D-2)-536870911*D==x
    # Independent interval necessity for all smaller K: t<=0 or t>=1.
    assert min(2*x,(2*D-2)-2*x)==2*K
    cases=[dict(code='b133',input=f'{x}\n{D} {D-1} {D-2}',output=str(K),reason='實際方案536870912*(D−2)−536870911*D=x。對任意整數t，abs((a+b)t−2x)≥2147483646；必要條件2K≥2147483646證明至少1073741823枚。')]
    for width,complete in [(3,False),(49,True)]:
        P=D//(2*width); target=D-width*P; minimum=2*P-1; a=D-width
        assert P*a-(P-1)*D==target
        assert min(2*target,(a+D)-2*target)==width*minimum
        coins=list(range(a,D+1)) if complete else [D,D-1,a]
        cases.append(dict(code='b133',input=str(target)+'\n'+' '.join(map(str,coins)),output=str(minimum),
            reason=('完整50面額AP' if complete else '缺少D−2的非完整AP，只能使用放寬下界')+
            f'；D=2147483648，P={P}，以P*(D−{width})−(P−1)*D還款，枚數{minimum}。任意整數t的最近端點距離為{width}*{minimum}，區間必要條件證明不能更少。'))
    for coins,target in [([4,10,16,25],7),([1,7,10],4),([6,10,15],1),([6,10,14],2),([3,7,11],2)]:
        cost=bfs_answers(coins,[target])[target]
        cases.append(dict(code='b133',input=str(target)+'\n'+' '.join(map(str,coins)),output=str(cost),reason='無金額裁切的獨立signed-sum BFS；特別包含缺項AP、共同因數、偶h CRT與沒有任何單一兩幣可解的組合。'))
    cases.extend([
      dict(code='b133',input='2147483648\n2',output='1073741824',reason='單幣除法精確邊界，不能進AP反元素分支。'),
      dict(code='b133',input='1\n2147483648 2147483647',output='2',reason='兩幣相差1，付大收小；一枚不可能。'),
      dict(code='b133',input='0\n4 10 16',output='0',reason='零金額空方案，不能以奇偶binary search漏掉K=0。'),
      dict(code='b133',input='37\n'+' '.join(map(str,range(1000,1050))),output='2',reason='完整50面額AP，1037−1000=37，且沒有37面額，一枚不可能。')
    ])
    return cases

def build():
    stats,_,ap_fixtures=formula_checks(collect=True)
    generic,relaxations=general_checks()
    candidate=make_candidate()
    # Preserve a deterministic compact cross-section; the helper regenerates all exhaustive cases.
    sample_ap=ap_fixtures[::11]
    sample_general=generic[::41]
    old=json.loads((ROOT/'scripts/fixtures/new-problem-lessons/practice2-checks.json').read_text(encoding='utf-8'))
    existing=[x for x in old if x['code']=='b133']
    merged=extra_cases()+sample_ap+sample_general+existing
    unique={}
    for c in merged:
        normalized=c['input'].strip()
        if normalized in unique: assert unique[normalized]['output'].strip()==c['output'].strip()
        else: unique[normalized]=c
    candidate['independentcases']=list(unique.values())
    candidate['validation']={'formulaBfs':stats,'arbitrarySubsetBfsCases':len(generic),'subsetLowerBoundChecks':relaxations,
        'method':'Exact-K sets and first-arrival BFS use all integer sums, no amount clipping. Runtime verification is recorded only after --verify succeeds.',
        'runtimeVerified':False}
    OUTPUT.write_text(json.dumps(candidate,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'candidate':str(OUTPUT),'independentcases':len(candidate['independentcases']),**candidate['validation']},ensure_ascii=False,indent=2))

HARNESS=r'''
int main(int argc,char**argv){
    if(argc>1&&string(argv[1])=="--formula"){
        int queries;cin>>queries;
        while(queries--){int mode;long long a,b,h,x,K;cin>>mode>>a>>b>>h>>x>>K;
            auto ctx=prepareAP(a,b,h);
            if(mode==0)cout<<feasibleAP(ctx,(I)x,K)<<char(10);
            else cout<<minimumAP(ctx,(I)x,K)<<char(10);
        }
        return 0;
    }
    int queries;cin>>queries;vector<pair<long long,vector<long long>>> cases;
    while(queries--){long long x;int n;cin>>x>>n;vector<long long>a(n);for(auto &v:a)cin>>v;cases.push_back({x,a});}
    auto originalIn=cin.rdbuf();auto originalOut=cout.rdbuf();
    for(auto [x,a]:cases){
        ostringstream text;text<<x<<char(10);for(auto v:a)text<<v<<' ';
        istringstream input(text.str());ostringstream output;
        d.clear();g.clear();apContexts.clear();fullAP.clear();
        cin.clear();cin.rdbuf(input.rdbuf());cout.rdbuf(output.rdbuf());
        lesson_main();
        cin.rdbuf(originalIn);cin.clear();cout.rdbuf(originalOut);
        string s=output.str();while(!s.empty()&&isspace((unsigned char)s.back()))s.pop_back();
        cout<<s<<char(10);
    }
    return 0;
}
'''
PY_WORKER=r'''import contextlib,io,json,pathlib,sys
payload=json.load(sys.stdin)
program=compile(pathlib.Path(sys.argv[1]).read_text(),sys.argv[1],'exec')
result=[]
original=sys.stdin
for text in payload:
    output=io.StringIO();sys.stdin=io.StringIO(text)
    with contextlib.redirect_stdout(output): exec(program,{'__name__':'__main__'})
    result.append(output.getvalue().strip())
sys.stdin=original
print(json.dumps(result))
'''

def verify():
    if sys.platform=='win32':
        raise SystemExit('Use WSL/Linux for --verify; compiling or executing generated Windows C++ programs is prohibited.')
    import re
    candidate=json.loads(OUTPUT.read_text(encoding='utf-8'))
    stats,probes,_=formula_checks(collect=True)
    general,relaxations=general_checks()
    sources=json.loads((ROOT/'scripts/fixtures/new-problem-lessons/source.json').read_text(encoding='utf-8'))['problems']
    samples=next(x['samples'] for x in sources if x['code']=='b133')
    unique={}
    for c in general+candidate['independentcases']+samples:
        key=' '.join(c['input'].split())
        if key in unique: assert unique[key]['output'].strip()==c['output'].strip()
        else: unique[key]=c
    cases=list(unique.values())
    expected=[c['output'].strip() for c in cases]
    timings={}
    with tempfile.TemporaryDirectory(prefix='b133-ap-',dir='/tmp') as folder:
        folder=pathlib.Path(folder)
        cpp=folder/'candidate.cpp';cpp.write_text(candidate['cpp'],encoding='utf-8')
        py=folder/'candidate.py';py.write_text(candidate['python'],encoding='utf-8')
        executable=folder/'candidate'
        result=subprocess.run(['g++','-std=c++17','-O2',str(cpp),'-o',str(executable)],capture_output=True,text=True,timeout=120)
        assert result.returncode==0,result.stderr
        harness_source=candidate['cpp'];last=harness_source.rfind('}')
        harness_source=harness_source[:last]+'return 0;\n'+harness_source[last:]
        harness_source=re.sub(r'int\s+main\s*\(\s*\)', 'int lesson_main()',harness_source,count=1)+HARNESS
        harness_cpp=folder/'harness.cpp';harness_cpp.write_text(harness_source,encoding='utf-8')
        harness=folder/'harness'
        result=subprocess.run(['g++','-std=c++17','-O2',str(harness_cpp),'-o',str(harness)],capture_output=True,text=True,timeout=120)
        assert result.returncode==0,result.stderr
        text=str(len(probes))+'\n'+'\n'.join(' '.join(map(str,p[:-1])) for p in probes)
        start=time.monotonic()
        result=subprocess.run([str(harness),'--formula'],input=text,capture_output=True,text=True,timeout=120)
        assert result.returncode==0,result.stderr
        actual=list(map(int,result.stdout.split()))
        assert len(actual)==len(probes),(len(actual),len(probes))
        for got,p in zip(actual,probes):assert got==p[-1],('C++ AP oracle mismatch',p,got)
        timings['cppFormulaSeconds']=round(time.monotonic()-start,6)
        inputs=[]
        for c in cases:
            values=list(map(int,c['input'].split()));inputs.append(str(values[0])+' '+str(len(values)-1)+' '+' '.join(map(str,values[1:])))
        start=time.monotonic()
        result=subprocess.run([str(harness)],input=str(len(inputs))+'\n'+'\n'.join(inputs),capture_output=True,text=True,timeout=120)
        assert result.returncode==0,result.stderr
        actual=result.stdout.splitlines()
        assert len(actual)==len(cases),(len(actual),len(cases),result.stderr)
        for got,want,c in zip(actual,expected,cases): assert got.strip()==want,('C++ solver mismatch',c,got)
        timings['cppBatchSeconds']=round(time.monotonic()-start,6)
        start=time.monotonic()
        result=subprocess.run([sys.executable,'-c',PY_WORKER,str(py)],input=json.dumps([c['input'] for c in cases]),capture_output=True,text=True,timeout=120)
        assert result.returncode==0,result.stderr
        actual=json.loads(result.stdout)
        assert len(actual)==len(cases)
        for got,want,c in zip(actual,expected,cases): assert got==want,('Python solver mismatch',c,got)
        timings['pythonBatchSeconds']=round(time.monotonic()-start,6)
        hard=extra_cases()[0]
        for language,command in [('cpp',[str(executable)]),('python',[sys.executable,str(py)])]:
            start=time.monotonic()
            result=subprocess.run(command,input=hard['input'],capture_output=True,text=True,timeout=10)
            assert result.returncode==0 and result.stdout.strip()==hard['output'],(language,result.stdout,result.stderr)
            timings[language+'HardCaseSeconds']=round(time.monotonic()-start,6)
    candidate['validation']={
        'runtimeVerified':True,'platform':sys.platform,'compiler':'g++ -std=c++17 -O2',
        'formulaBfs':stats,'cppFormulaChecks':len(probes),'arbitrarySubsetBfsCases':len(general),
        'subsetLowerBoundChecks':relaxations,'solverCasesPerLanguage':len(cases),
        'retainedIndependentCases':len(candidate['independentcases']),'publicSamples':len(samples),
        'validatedCppSha256':hashlib.sha256(candidate['cpp'].encode()).hexdigest(),
        'validatedPythonSha256':hashlib.sha256(candidate['python'].encode()).hexdigest(),
        'hardCaseAnswer':int(extra_cases()[0]['output']), 'timings':timings,'failures':[]
    }
    OUTPUT.write_text(json.dumps(candidate,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(candidate['validation'],ensure_ascii=False,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--formula',action='store_true');parser.add_argument('--build',action='store_true');parser.add_argument('--verify',action='store_true')
    args=parser.parse_args()
    if args.verify:verify()
    elif args.build:build()
    else:
        stats,_,_=formula_checks();print(json.dumps(stats,indent=2))
