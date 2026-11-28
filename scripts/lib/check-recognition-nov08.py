"""Independent runtime checks. Generated C/C++ runs only in Linux temporary dirs.

WSL: python3 check-recognition-nov08.py --cxx-only --payload <exported JSON>
Export JSON via NOV08_RUNTIME_PAYLOAD when running the Node regression suite.
"""
import argparse
from fractions import Fraction
import itertools
import json
from pathlib import Path
import random
import re
import subprocess
import sys
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--python-only', action='store_true')
parser.add_argument('--cxx-only', action='store_true')
parser.add_argument('--payload', type=Path)
args = parser.parse_args()
payload = json.loads(args.payload.read_text(encoding='utf-8')) if args.payload else json.load(sys.stdin)
lessons = {x['code']: x for x in payload['lessons']}
questions = {q['auditId']: q for q in payload['questions']}
legacy = {q['auditId']: q['question'] for q in payload['legacy']}
rng = random.Random(20261108)


def run(command, text=''):
    p = subprocess.run(command, input=text, text=True, capture_output=True, timeout=60)
    assert p.returncode == 0, (command, p.stderr)
    return p.stdout


def coordinate(value):
    # Fraction.__round__ independently implements exact nearest/even rounding.
    cents = round(value * 100)
    return ('-' if cents < 0 else '') + f'{abs(cents)//100}.{abs(cents)%100:02d}'


def intersection(row):
    x1,y1,x2,y2,x3,y3,x4,y4 = row
    # Implicit line coefficients + Cramer's rule, independent of reference vectors.
    a,b,c = y1-y2,x2-x1,x1*y2-x2*y1
    d,e,f = y3-y4,x4-x3,x3*y4-x4*y3
    determinant = a*e-b*d
    if determinant == 0:
        return 'LINE' if a*f == c*d and b*f == c*e else 'NONE'
    x = Fraction(b*f-c*e,determinant)
    y = Fraction(c*d-a*f,determinant)
    return f'POINT {coordinate(x)} {coordinate(y)}'


geometry = [(0,0,1,0,0,1,1,1),(0,0,1,1,-2,-2,2,2),
            (0,-1000,0,1000,-1000,0,1000,0),
            (-1000,-999,999,998,-999,-998,1000,999)]
# Exact +/-half cents, values on either side, odd/even cents, carry to integer.
for numerator in [-199,-101,-5,-3,-1,0,1,3,5,101,199]:
    for denominator in [199,200,201]:
        geometry.append((-1,0,denominator-1,numerator,0,-10,0,10))
        geometry.append((0,-1,numerator,denominator-1,-10,0,10,0))
for _ in range(300):
    while True:
        points = [rng.randint(-1000,1000) for _ in range(8)]
        if points[:2] != points[2:4] and points[4:6] != points[6:]:
            break
    geometry.append(tuple(points))
expanded = []
for row in geometry:
    for reverse_first,reverse_second,swap in itertools.product([False,True], repeat=3):
        a,b,c,d = [row[i:i+2] for i in range(0,8,2)]
        if reverse_first: a,b = b,a
        if reverse_second: c,d = d,c
        if swap: a,b,c,d = c,d,a,b
        variant = (*a,*b,*c,*d)
        assert intersection(variant) == intersection(row)
        expanded.append(variant)
geometry = expanded


def fib_pair(n):
    # Fast doubling, independent of the sequential reference table.
    if n == 0: return 0,1
    a,b = fib_pair(n//2)
    c,d = a*(2*b-a), a*a+b*b
    return (d,c+d) if n%2 else (c,d)


def lesson_checks(commands, language):
    samples = 0
    for code, command in commands.items():
        for sample in lessons[code]['samples']:
            assert run(command,sample['input']).strip() == sample['output'].strip(), (code,'sample')
            samples += 1
    # Legal N <= 10 per geometry process; exact textual output including wrappers.
    for start in range(0,len(geometry),10):
        group = geometry[start:start+10]
        text = str(len(group))+'\n'+''.join(' '.join(map(str,r))+'\n' for r in group)
        expected = 'INTERSECTING LINES OUTPUT\n'+'\n'.join(map(intersection,group))+'\nEND OF OUTPUT\n'
        assert run(commands['a685'],text) == expected, (language,start,group)
    indices = list(range(1,4787)) + [1]*10000 + [4786,4785,2,1,4786]
    rng.shuffle(indices)
    expected = ''.join(str(fib_pair(n)[0])+'\n' for n in indices)
    assert len(str(fib_pair(4786)[0])) == 1000
    assert len(str(fib_pair(4787)[0])) == 1001
    assert run(commands['a680'],'\n'.join(map(str,indices))+'\n') == expected
    assert run(commands['a680'],'') == ''
    # Team Queue: flat-list insertion after last teammate, independent of two queues.
    inputs, outputs = [], []
    for tc in range(1,32):
        groups = [[10,11,12],[20,21],[30]]
        owner = {x:i for i,g in enumerate(groups) for x in g}
        flat = []
        inputs += ['3', *[' '.join(map(str,[len(g),*g])) for g in groups]]
        outputs.append(f'Scenario #{tc}')
        for _ in range(200):
            if flat and rng.randrange(2):
                inputs.append('DEQUEUE'); outputs.append(str(flat.pop(0)))
            else:
                x = rng.choice(list(owner)); inputs.append(f'ENQUEUE {x}')
                end = max((i for i,y in enumerate(flat) if owner[y] == owner[x]),default=len(flat)-1)
                flat.insert(end+1,x)
        inputs.append('STOP'); outputs.append('')
    # Fixed member count and max queue length one; buffering still grows with Q.
    inputs += ['1','1 0'] + ['ENQUEUE 0','DEQUEUE']*100000 + ['STOP','0']
    outputs += ['Scenario #32'] + ['0']*100000 + ['']
    assert run(commands['a678'],'\n'.join(inputs)+'\n') == '\n'.join(outputs)+'\n'
    print(f'{language}: all {samples} public samples; {len(geometry)} Fraction geometry cases (8 endpoint/line permutations), {len(indices)} Fibonacci queries, 32 queue scenarios including 200000 operations')


if not args.cxx_only:
    lesson_checks({code:[sys.executable,'-c',q['python']] for code,q in lessons.items()},'Python')

if not args.python_only:
    if sys.platform == 'win32':
        raise RuntimeError('Run generated C/C++ only in Linux/WSL')
    with tempfile.TemporaryDirectory(prefix='nov08-legacy-') as folder:
        root = Path(folder)

        def compile_program(name, source, compiler='gcc', fails=False):
            path = root/(name+('.c' if compiler == 'gcc' else '.cpp'))
            path.write_text(source,encoding='utf-8'); executable = root/name
            command = [compiler,'-std=c11' if compiler == 'gcc' else '-std=c++17','-O1',
                       '-fsanitize=undefined','-fno-sanitize-recover=all',str(path),'-o',str(executable)]
            p = subprocess.run(command,text=True,capture_output=True,timeout=60)
            assert (p.returncode != 0) == fails, (name,p.stderr)
            return [str(executable)]

        lesson_checks({code:compile_program(code,q['cpp'],'g++') for code,q in lessons.items()},'Linux C++17/UBSan')
        # Observe returned values by replacing main with printf harness, not original output.
        original = questions[176]['code'].split('int main()')[0]
        harness = '\nint main(void){printf("%d\\n",sum(10));}'
        observed = []
        def apply_line_option(question):
            option = question['options'][question['answerIndex']]
            line, replacement = re.fullmatch(r'第 (\d+) 行要改成 (.*)',option).groups()
            lines = original.splitlines()
            lines[int(line)-1] = replacement
            return '\n'.join(lines)

        for name,source in [('original',original),('old-option',apply_line_option(legacy[176])),
                            ('fixed-option',apply_line_option(questions[176]))]:
            observed.append(int(run(compile_program(name,'#include <stdio.h>\n'+source+harness))))
        assert observed == [331,0,sum(j*(j+1) for j in range(1,10))] == [331,0,330]

        # 115: executable variable declaration, tie priority, all options checked.
        grade_cases = [[[0,0,0] for _ in range(20)], [[1,9,0],[2,8,0]]+[[0,0,0] for _ in range(18)]]
        grade_cases += [[[rng.randrange(5) for _ in range(3)] for _ in range(20)] for _ in range(300)]
        expected = [max(range(20),key=lambda i:(sum(row[i]),row[i][0],-i)) for row in grade_cases]
        text = ''.join(' '.join(map(str,g))+'\n' for case in grade_cases for g in case)
        for index,option in enumerate(questions[115]['options']):
            source = questions[115]['code'].replace('int main ()','int choose ()').replace('___________',option)
            pos = source.rfind('}'); source = source[:pos]+'return best_ID;\n'+source[pos:]
            main = '\nint main(void){for(int k=0;k<302;k++){for(int i=0;i<20;i++)scanf("%d%d%d",&std[i].math,&std[i].chinese,&std[i].english);printf("%d\\n",choose());}}'
            actual = list(map(int,run(compile_program(f'grades{index}','#include <stdio.h>\n#include <iso646.h>\n'+source+main),text).split()))
            assert (actual == expected) == (index == questions[115]['answerIndex'])
        compile_program('old115','#include <iso646.h>\n'+legacy[115]['code'].replace('___________',questions[115]['options'][1]),fails=True)

        # 129: supply the abstract deque operations; test all binary words through length 8.
        stub = '''#include <stdbool.h>
#include <stdio.h>
#include <string.h>
struct Deque {char data[100]; int l,r;};
struct Deque store, *X;
void Init(struct Deque **p){*p=&store;store.l=store.r=0;}
void Clear(struct Deque **p){(*p)->l=(*p)->r=0;}
void Add(struct Deque *p,char c){p->data[p->r++]=c;}
char getFirst(struct Deque *p){return p->data[p->l++];}
char getLast(struct Deque *p){return p->data[--p->r];}
'''
        words = [''.join(x) for n in range(9) for x in itertools.product('ab',repeat=n)]
        main = '\nint main(void){char s[100];while(fgets(s,sizeof s,stdin)){int n=strcspn(s,"\\n");s[n]=0;printf("%d\\n",isPalindrome(s,n));}}'
        assert list(map(int,run(compile_program('deque',stub+questions[129]['code']+main),'\n'.join(words)+'\n').split())) == [int(w==w[::-1]) for w in words]
        compile_program('old129',stub+legacy[129]['code']+main,fails=True)

        # 148: no undefined legacy execution; repeated calls and all legal edge indices.
        arrays = [list(x) for n in range(1,6) for x in itertools.product(range(5),repeat=n)]
        arrays += [[2,3,4],[2,3,4],[99999],[99998,99999],[0],list(range(100000)),[0,99999]]
        source = questions[148]['code']
        for i,value in enumerate(questions[148]['options'][0].splitlines(),1): source = source.replace(f'__{i}__',value)
        main = '\nint main(void){int n,a[100000];while(scanf("%d",&n)==1){for(int i=0;i<n;i++)scanf("%d",&a[i]);printf("%d\\n",f(a,n));}}'
        text = ''.join(str(len(a))+' '+' '.join(map(str,a))+'\n' for a in arrays)
        expected = [int(len(set(a))==len(a) and max(a)-min(a)==len(a)-1) for a in arrays]
        for compiler in ['gcc','g++']:
            assert list(map(int,run(compile_program('bounds-'+compiler,'#include <stdio.h>\n'+source+main,compiler),text).split())) == expected

        # 150: preserve the intended formula fix and integer return/truncation behavior.
        line, formula = re.fullmatch(r'第 (\d+) 行為 (.*)',questions[150]['options'][questions[150]['answerIndex']]).groups()
        lines = questions[150]['code'].splitlines()
        lines[int(line)-1] = f'        return {formula};'
        source = '\n'.join(lines)
        main = '\nint main(void){for(int i=0;i<=300;i++)printf("%d\\n",f(i));}'
        expected = [int(max(0,min(p,100)-40)*Fraction(1,10)+max(0,min(p,150)-100)*Fraction(1,4)+max(0,p-150)*Fraction(3,10)) for p in range(301)]
        assert list(map(int,run(compile_program('tax','#include <stdio.h>\n'+source+main)).split())) == expected
        compile_program('old150',legacy[150]['code']+'\nint main(void){return f(0);}',fails=True)
        print(f'Linux C11/UBSan: 176 return values {observed}; 115 all four options/302 grade cases; 129 {len(words)} binary strings; 148 {len(arrays)} arrays in C11 and C++17; 150 301 Fraction tax cases; three legacy syntax failures reproduced')
