#!/usr/bin/env bash
# Sync only the OJ upload limit; retain the live domains and TLS configuration.
set -Eeuo pipefail

REFERENCE=${1:?Usage: sync-nginx-upload-limit.sh <nginx-oj.conf>}

python3 - "$REFERENCE" <<'PY'
import pathlib
import re
import shutil
import subprocess
import sys
import time

reference = pathlib.Path(sys.argv[1])
site = pathlib.Path('/etc/nginx/sites-enabled/online-judge').resolve(strict=True)
directive = re.compile(r'^(\s*client_max_body_size\s+)([0-9]+[kKmM]?)(\s*;[^\n]*)$', re.MULTILINE)
desired = directive.findall(reference.read_text())
original = site.read_text()
current = directive.findall(original)
if len(desired) != 1 or len(current) != 1:
    raise SystemExit('Expected exactly one client_max_body_size in the reference and live OJ site')
if not re.search(r'\bserver_name\s+[^;]*\boj\.itousouta\.me(?:\s|;)', original):
    raise SystemExit('Live configuration is not the expected OJ site')

limit = desired[0][1]
if current[0][1].lower() == limit.lower():
    subprocess.run(['nginx', '-t'], check=True)
    # Reload even if the file matches: a previous manual edit may not be active.
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    print(f'OJ upload limit already {limit}; validated and reloaded', flush=True)
    sys.exit(0)

updated = directive.sub(lambda match: f'{match[1]}{limit}{match[3]}', original)
# Resolve the symlink first so this backup is outside sites-enabled's wildcard.
backup = site.with_name(f'{site.name}.upload-limit-{time.time_ns()}.bak')
shutil.copy2(site, backup)
try:
    site.write_text(updated)
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
except Exception:
    shutil.copy2(backup, site)
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    raise
print(f'OJ upload limit: {current[0][1]} -> {limit}. Backup: {backup}', flush=True)
PY
