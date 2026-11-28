"""Reproduce the b233 polynomial candidate proof checks in Linux/WSL.

All tiny-grid multisets and bounded random cases enumerate EVERY orientation.
No branch-and-bound, sample-answer table, LP assumption, or search-node cap is used.
"""
import collections,itertools,json,pathlib,random,subprocess,sys,tempfile,time,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[3]
HERE=pathlib.Path(__file__).resolve().parent
CANDIDATE=HERE/'b233-candidate.json'

def union_length(devices,mask):
    intervals=sorted((x,x+l) if mask>>i&1 else (x-l,x) for i,(x,l) in enumerate(devices))
    total=0;right=-10**30
    for left,end in intervals:
        total+=max(0,end-max(left,right));right=max(right,end)
    return total

def exhaustive(devices):
    return max(union_length(devices,mask) for mask in range(1<<len(devices)))

def encode(devices):
    return str(len(devices))+'\n'+''.join(f'{x} {l}\n' for x,l in devices)

def small_cases(source):
    cases=[];kinds=collections.Counter();orientations=0
    types=list(itertools.product(range(3),range(4)))
    for n in range(1,6):
        for devices in itertools.combinations_with_replacement(types,n):
            answer=exhaustive(devices);cases.append((devices,answer,'exhaustive_tiny_multiset'));kinds['exhaustive_tiny_multiset']+=1;orientations+=1<<n
    rng=random.Random(23320261103)
    for repeat in range(460):
        n=rng.randint(1,12) if repeat<400 else rng.randint(13,16)
        devices=[(rng.randrange(41),rng.randrange(31)) for _ in range(n)]
        if repeat%5==0:
            devices=[(rng.randrange(3),rng.randrange(31)) for _ in range(n)]
        if repeat%7==0:
            devices=[(rng.randrange(1000000001),rng.randrange(1000000001)) for _ in range(n)]
        rng.shuffle(devices);cases.append((devices,exhaustive(devices),'bounded_random_all_orientations'));kinds['bounded_random_all_orientations']+=1;orientations+=1<<n
    for sample in source['samples']:
        values=list(map(int,sample['input'].split()));n=values[0];devices=list(zip(values[1::2],values[2::2]));assert len(devices)==n
        oracle=exhaustive(devices)
        assert oracle==int(sample['output']),('public source contradicts exhaustive oracle',sample,oracle)
        cases.append((devices,oracle,'public_sample'));kinds['public_sample']+=1;orientations+=1<<n
    targeted=[[(2,8),(7,8),(0,4)],[(0,3),(0,2)],[(0,0)],[(0,1000000000),(0,1000000000),(1000000000,1000000000)],[(0,10000),(1,9999),(2,9998)],[(0,9),(1,1),(2,8),(3,1),(4,7)],[(10,1),(0,4),(10,1),(0,4)],[(0,2),(2,2),(4,2),(6,2)],[(7,0),(7,0),(7,0)]]
    for devices in targeted:cases.append((devices,exhaustive(devices),'targeted_all_orientations'));kinds['targeted_all_orientations']+=1;orientations+=1<<len(devices)
    return cases,dict(kinds),orientations

def hanoi_distance(n,label_rule):
    # Explicit ordered piles are essential when same-size disks may reorder.
    start=(tuple(range(n-1,-1,-1)),(),())
    goal=tuple(tuple(range(n-3+c,c-1,-3)) for c in range(3))
    q=collections.deque([start]);distance={start:0}
    while q:
        state=q.popleft()
        if state==goal:return distance[state]
        for a in range(3):
            if not state[a]:continue
            ring=state[a][-1]
            for b in range(3):
                if a==b:continue
                legal=not state[b] or (ring<state[b][-1] if label_rule else ring//3<=state[b][-1]//3)
                if legal:
                    nxt=list(state);nxt[a]=nxt[a][:-1];nxt[b]=nxt[b]+(ring,);nxt=tuple(nxt)
                    if nxt not in distance:distance[nxt]=distance[state]+1;q.append(nxt)
    raise AssertionError('unreachable Hanoi goal')

METRIC_WRAPPER="""import subprocess,sys,resource,time,json
payload=sys.stdin.buffer.read();started=time.perf_counter()
p=subprocess.run(sys.argv[1:],input=payload,stdout=sys.stdout.buffer,stderr=sys.stderr.buffer,timeout=120)
print('B233_METRICS '+json.dumps(dict(seconds=round(time.perf_counter()-started,4),peakRssKiB=resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss)),file=sys.stderr)
sys.exit(p.returncode)
"""
def run_program(command,payload,timeout=150):
    # This function may launch a compiled C++ candidate. Always reject Windows.
    if sys.platform=='win32':raise SystemExit('Run in WSL/Linux; Windows C++ execution is prohibited.')
    result=subprocess.run([sys.executable,'-c',METRIC_WRAPPER,*command],input=payload,text=True,capture_output=True,timeout=timeout)
    if result.returncode:raise AssertionError((command,result.returncode,result.stderr[-3000:]))
    lines=result.stderr.splitlines();metric=json.loads(next(line[len('B233_METRICS '):] for line in lines if line.startswith('B233_METRICS ')))
    return result.stdout.split(),metric

def main():
    if sys.platform=='win32':raise SystemExit('Run this investigation in WSL/Linux. It compiles Linux C++ binaries only, in /tmp.')
    started=time.perf_counter();proposal=json.loads(CANDIDATE.read_text(encoding='utf-8'))
    source=next(x for x in json.loads((HERE/'source.json').read_text(encoding='utf-8'))['problems'] if x['code']=='b233')
    cases,kinds,orientations=small_cases(source)
    print(f'Independent exhaustive oracles: {len(cases)} inputs, {orientations} orientations.',flush=True)
    payload=''.join(encode(devices) for devices,value,kind in cases)
    expected=[str(value) for devices,value,kind in cases]
    metrics={};stress=[]
    with tempfile.TemporaryDirectory(prefix='b233-polynomial-',dir='/tmp') as tmp:
        folder=pathlib.Path(tmp);cpp=folder/'candidate.cpp';exe=folder/'candidate';py=folder/'candidate.py'
        cpp.write_text(proposal['cpp'],encoding='utf-8');py.write_text(proposal['python'],encoding='utf-8')
        compile_result=subprocess.run(['g++','-std=c++17','-O2',str(cpp),'-o',str(exe)],capture_output=True,text=True,timeout=120)
        if compile_result.returncode:raise AssertionError(compile_result.stderr)
        commands={'C++17':[str(exe)],'Python3':[sys.executable,str(py)]}
        for language,command in commands.items():
            actual,metric=run_program(command,payload)
            if actual!=expected:
                mismatch=next((i for i,(a,b) in enumerate(itertools.zip_longest(actual,expected)) if a!=b),None)
                raise AssertionError(dict(language=language,index=mismatch,case=encode(cases[mismatch][0]),expected=expected[mismatch],actual=actual[mismatch] if mismatch<len(actual) else None))
            metrics[language]=metric;print(language,'passed all small/oracle cases',metric,flush=True)
        N=5000
        families=[
            ('duplicate_anchor_variable_lengths',[(1000000000,i) for i in range(1,N+1)],2*N-1,'At a common anchor, only the maximum left and right arm matter; use the two largest lengths on opposite sides.'),
            ('separated_positive_arms',[(200000*i,i+1) for i in range(N)],N*(N+1)//2,'All full envelopes are pairwise disjoint, so every orientation has union equal to the sum of lengths.'),
            ('max_three_billion_union',[(0,1000000000)]*(N//2)+[(1000000000,1000000000)]*(N//2),3000000000,'The global envelope is [-10^9,2*10^9]; two opposite arms at0 and a right arm at10^9 cover it completely.'),
            ('nested_unique_anchor_frontier',[(i,1000000+2*i) for i in range(N)],2000000+4*N-5,'If the last device points right, the smallest other possible left is -(1000000+N-2), giving this upper bound. Pointing it left gives a bound two smaller. The penultimate left arm and right arms of the antepenultimate and last devices attain the larger bound; all three devices are distinct.'),
            ('equal_length_distinct_anchors',[(i,1000000000) for i in range(N)],2000000000+N-1,'The full envelope is [-10^9,10^9+N-1]. Left arms at0 and N-2 plus right arms at1 and N-1 connect and cover it.')]
        for name,devices,value,reason in families:
            record=dict(name=name,N=N,expected=value,independentReason=reason,languages={})
            for language,command in commands.items():
                actual,metric=run_program(command,encode(devices))
                if actual!=[str(value)]:raise AssertionError((name,language,value,actual))
                record['languages'][language]=metric;print(name,language,'passed',metric,flush=True)
            stress.append(record)
    label=hanoi_distance(6,True);physical=hanoi_distance(6,False)
    assert (label,physical)==(42,20)
    proposal['a853Evidence']['independentBfsN6']={'originalLabelRule':label,'physicalSizeOnlyRule':physical}
    seed=(ROOT/'prisma/seed-data/competition-exams-112-114.mjs').read_text(encoding='utf-8')
    fixed='即使同大小也必須遵守編號順序' in seed and '編號較大的環不得放在編號較小的環上' in seed
    proposal['a853Evidence']['originalSnapshotNeedsAmendment']=True
    proposal['a853Evidence']['currentSeedNeedsAmendment']=not fixed
    proposal['a853Evidence']['seedNeedsAmendment']=not fixed
    proposal['a853Evidence']['currentSeedPath']='prisma/seed-data/competition-exams-112-114.mjs'
    proposal['a853Evidence']['currentSeedAlreadyContainsMissingRule']=fixed
    proposal['a853Evidence']['why']='The former physical-size-only summary admits anN=6 ordered-stack solution in20moves; the original label ordering requires42. The current seed was read without modification and '+('already contains the required label rule.' if fixed else 'still needs that rule added.')
    proposal['counterexamples'][0]['reason']='The fourth public example uses right,left,right on devices2,3,4; exhaustive single-cut enumeration gives only7.'
    public_inputs={s['input'].strip() for s in source['samples']};seen=set();checks=[]
    selected=[case for case in cases if case[2]=='targeted_all_orientations']+[case for case in cases if case[2]=='bounded_random_all_orientations'][-24:]
    for devices,value,kind in selected:
        inp=encode(devices)
        if inp.strip() in public_inputs or inp in seen:continue
        seen.add(inp);checks.append(dict(input=inp,output=str(value),reason=f'Enumerated every one of {1<<len(devices)} orientations; computed interval union directly.'))
    proposal['checks']=checks
    proposal['status']='proven_exact_polynomial_and_verified'
    proposal['validation']={
        'status':'pass','platform':sys.platform,'pythonVersion':sys.version,'pythonExecutable':sys.executable,'compiler':'g++ -std=c++17 -O2','smallCaseCountPerLanguage':len(cases),'smallCaseKinds':kinds,'orientationsIndependentlyEnumerated':orientations,
        'stressCaseCountPerLanguage':len(stress),'totalProgramCasesPerLanguage':len(cases)+len(stress),'smallProgramMetrics':metrics,'stress':stress,
        'failures':[],'sourceSha256':{key:hashlib.sha256(proposal[key].encode()).hexdigest() for key in ('cpp','python')},'seconds':round(time.perf_counter()-started,3),
        'rssMeaning':'resource.getrusage(RUSAGE_CHILDREN).ru_maxrss from a fresh metrics wrapper for each actual program run, in KiB on Linux.'}
    CANDIDATE.write_text(json.dumps(proposal,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(proposal['validation'],ensure_ascii=False,indent=2),flush=True)
if __name__=='__main__':main()
