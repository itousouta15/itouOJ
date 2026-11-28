"""Generated maximum-shape inputs and independent answer certificates.
Timing is local evidence, not an official time-limit guarantee. No database.
"""
import pathlib,json,sys,tempfile,subprocess,time,math
if sys.platform!='linux':raise SystemExit('Linux/WSL required')
P=pathlib.Path(__file__).resolve().parent;root=P.parents[2];M=1000000007
lessons={x['code']:x for f in (root/'src/lib/newProblemLessons/data').glob('nov08-*.json') for x in json.loads(f.read_text())}
def fib(n):
 if not n:return (0,1)
 a,b=fib(n//2);c=a*(2*b-a)%M;d=(a*a+b*b)%M
 return (d,(c+d)%M) if n%2 else (c,d)
def exact(want):return lambda s:None if s.strip()==str(want) else 'wrong exact answer'
def tournament(s):
 try:v=list(map(int,s.split()));n=500
 except Exception:return 'noninteger output'
 if len(v)!=n:return 'expected500 bins'
 if sum(v)%M!=pow(2,n*(n-1)//2,M):return 'sum differs from all labeled tournaments'
 if v[-1]!=math.factorial(n)%M or v[-2]!=0 or v[-3]!=(2*math.comb(n,3)*math.factorial(n-2))%M:return 'SCC count boundary certificate failed'
def functional(s):
 try:v=list(map(int,s.split()));n=5000
 except Exception:return 'noninteger output'
 if len(v)!=n:return 'expected5000 bins'
 if sum(v)%M!=pow(n,n,M):return 'sum differs from all functions'
 if v[-1]!=1 or v[-2]!=(3*math.comb(n,2))%M or v[-3]!=(17*math.comb(n,3)+27*math.comb(n,4))%M:return 'component count boundary certificate failed'
cases=[('b568','monotone-max', '100000\n'+''.join(('U' if i%2 else 'R')+' 1000000\n' for i in range(100000)),exact(100000000000),'Monotone staircase never revisits a position; all100000 commands and maximal length.'),('b573','identical-rows-max','500 26\n'+(('ABCDEFGHIJKLMNOPQRSTUVWXYZ'*20)[:500]+'\n')*500,exact((475*476//2)*(500*501//2)),'Every row is identical cyclic alphabet; a rectangle contains all26 letters iff its column width>=26, so independent closed count.'),('b591','distribution-max','500\n',tournament,'Sum of counts2^(n(n-1)/2); k=n:n!, k=n-1:0, k=n-2:2*C(n,3)*(n-2)!.'),('b592','distribution-max','5000\n',functional,'Sum n^n; k=n:1, k=n-1:3*C(n,2), k=n-2:17*C(n,3)+27*C(n,4). These are partial certificates, not all-bin correctness proof.')]
der0,der1=1,0
for i in range(2,501):der0,der1=der1,(i-1)*(der0+der1)%M
cases.extend([
 ('b578','all-one-letter-max','500 26\n'+('A'*500+'\n')*500,exact('\n'.join([str((500*501//2)**2)]+['0']*25)),'All rectangles have A borders, including single rows/columns; other25 letters contribute0.'),
 ('b590','empty-grid-max','500\n'+('.'*500+'\n')*500,exact(math.factorial(500)%M*der1%M),'Choose A permutation500!; B is any derangement relative to A, so500!*D500.'),
 ('b590','fully-fixed-grid-max','500\n'+''.join(''.join('A' if j==i else 'B' if j==(i+1)%500 else '.' for j in range(500))+'\n' for i in range(500)),exact(1),'Every row/column already has both letters, so unique completion.')])
prime=999999937;assert all(prime%d for d in range(2,math.isqrt(prime)+1))
queries=[(1000000000-i,prime) for i in range(1000)];expected='\n'.join(str(fib(n+2)[0]) for n,k in queries)
cases.append(('b593','maximum-prime-query-batch','1000\n'+''.join(f'{n} {k}\n' for n,k in queries),exact(expected),'For primek, exponents0/1 must avoid adjacent00: exact Fibonacci(n+2), independently fast-doubled. All1000 queries with large primek.'))
if '--codes' in sys.argv:
 selected=set(sys.argv[sys.argv.index('--codes')+1].split(','));cases=[case for case in cases if case[0] in selected]
report={'timingWarning':'Local elapsed time, not formal judge timing. Distribution stress checks selected certificates only; small full differential tests live in batch fixtures.','cases':[]}
with tempfile.TemporaryDirectory(prefix='itouoj-nov08-performance-',dir='/tmp') as tmp:
 for code,name,data,validate,proof in cases:
  l=lessons[code];src=pathlib.Path(tmp)/(code+'.cpp');exe=src.with_suffix('');src.write_text(l['cpp']);z=subprocess.run(['g++','-std=c++17','-O2',str(src),'-o',str(exe)],capture_output=True,text=True,timeout=120)
  if z.returncode:report['cases'].append({'code':code,'compileError':z.stderr});continue
  for lang,command in [('C++',[str(exe)]),('Python',[sys.executable,'-c',l['python']])]:
   start=time.monotonic();row={'code':code,'case':name,'language':lang,'inputBytes':len(data),'certificate':proof}
   try:
    z=subprocess.run(command,input=data,capture_output=True,text=True,timeout=40);err=validate(z.stdout) if z.returncode==0 else 'runtime failure';row.update(seconds=time.monotonic()-start,certificatePass=err is None,error=err,stderr=z.stderr[-1000:])
   except subprocess.TimeoutExpired:row.update(seconds=time.monotonic()-start,certificatePass=False,error='timeout40')
   report['cases'].append(row);print(json.dumps(row),flush=True)
(P/('performance-results-'+sys.argv[sys.argv.index('--codes')+1].replace(',','-')+'.json' if '--codes' in sys.argv else 'performance-results.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2))
