"""Assert the exact published a344 contradiction; never count it as a sample pass.

Strict public-example mode remains the verifier default. CI explicitly opts into
this diagnostic mode, which must fail if the published contradiction changes.
"""
import argparse
from contextlib import nullcontext
import json
from pathlib import Path
import subprocess
import sys
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--cxx')
parser.add_argument('--temp-root')
parser.add_argument('--compile-only-cxx', action='store_true')
args = parser.parse_args()
cases = json.load(sys.stdin)


def execute(command, text=None, timeout=30):
    result = subprocess.run(command, input=text, text=True, encoding='utf-8',
                            capture_output=True, timeout=timeout, check=True)
    return result.stdout.replace('\r\n', '\n').rstrip('\n')


workspace = tempfile.TemporaryDirectory(prefix='itouoj-toi-source-', dir=args.temp_root) if args.cxx else nullcontext(None)
with workspace as folder:
    for case in cases:
        lesson, samples, issue = case['lesson'], case['samples'], case['issue']
        assert lesson['code'] == 'a344', 'Unexpected conflict exemption'
        assert issue['input'] == '1\n' and issue['publishedOutput'] == '1\n'
        assert issue['formulaOutput'] == '2\n', 'F0=F1=1 gives T1=F1+F1=2'
        assert sum(sample['input'] == issue['input'] and sample['output'] == issue['publishedOutput']
                   for sample in samples) == 1, 'Published contradiction changed; review/remove quarantine'
        commands = [('Python', [sys.executable, '-c', lesson['python']])]
        if args.cxx:
            source = Path(folder) / 'a344.cpp'
            target = Path(folder) / ('a344.exe' if sys.platform == 'win32' else 'a344')
            source.write_text(lesson['cpp'], encoding='utf-8')
            execute([args.cxx, '-std=c++17', '-O2', str(source), '-o', str(target)], timeout=180)
            if not args.compile_only_cxx:
                commands.append(('C++', [str(target)]))
        for language, command in commands:
            matches = conflicts = 0
            for sample in samples:
                actual = execute(command, sample['input'])
                if sample['input'] == issue['input']:
                    assert actual == issue['formulaOutput'].rstrip('\n')
                    assert actual != sample['output'].rstrip('\n')
                    conflicts += 1
                else:
                    assert actual == sample['output'].rstrip('\n'), (language, sample, actual)
                    matches += 1
            assert conflicts == 1
            print(f'a344 {language}: {matches} public samples match; 1 exact source conflict '
                  '(formula 2 / published 1) diagnosed, NOT a sample pass.', flush=True)
        if args.cxx and args.compile_only_cxx:
            print('a344 C++ compiled only; conflict execution not requested.', flush=True)
