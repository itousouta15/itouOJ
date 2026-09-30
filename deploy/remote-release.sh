#!/usr/bin/env bash
# Invoked by deploy.ps1 from a verified git archive unpacked outside the live app.
set -Eeuo pipefail

SOURCE=$1
APP=/opt/online-judge
SANDBOX=/opt/sandbox-runner
BACKUP=/opt/oj-deploy-backups/$(date -u +%Y%m%d-%H%M%S)
SITE_STOPPED=0
WORKER_STOPPED=0
SITE_STARTED=0
APP_SWITCHED=0
SANDBOX_SWITCHED=0
INTERACTIVE_CHANGED=0

rollback() {
  local status=$?
  trap - ERR
  if (( ! SITE_STOPPED && ! SANDBOX_SWITCHED )); then
    if (( WORKER_STOPPED )); then systemctl start online-judge-worker || true; fi
    echo "Preflight failed (exit $status); live services were not changed" >&2
    exit "$status"
  fi
  echo "Deployment failed (exit $status); restoring previous binaries and app" >&2
  systemctl stop online-judge-worker online-judge || true
  if (( APP_SWITCHED )); then
    rsync -a --exclude='.env' --exclude='oj.db*' --exclude='.next*' \
      --exclude='node_modules' "$BACKUP/app/" "$APP/" || true
    rsync -a --delete "$BACKUP/app/src/" "$APP/src/" || true
    [[ ! -d "$BACKUP/.next" ]] || { rm -rf -- "$APP/.next"; mv "$BACKUP/.next" "$APP/.next"; }
    [[ ! -d "$BACKUP/node_modules" ]] || { rm -rf -- "$APP/node_modules"; mv "$BACKUP/node_modules" "$APP/node_modules"; }
  fi
  if (( SANDBOX_SWITCHED )); then
    install -m 755 "$BACKUP/sandbox-server" "$SANDBOX/sandbox-server.next"
    mv -f "$SANDBOX/sandbox-server.next" "$SANDBOX/sandbox-server"
    install -m 755 "$BACKUP/jail" "$SANDBOX/jail.next"
    mv -f "$SANDBOX/jail.next" "$SANDBOX/jail"
    rsync -a "$BACKUP/sandbox-src/" "$SANDBOX/src/"
    install -m 644 "$BACKUP/sandbox-server.service" /etc/systemd/system/sandbox-server.service
    install -m 644 "$BACKUP/sandbox-interactive.service" /etc/systemd/system/sandbox-interactive.service
    systemctl daemon-reload
    systemctl restart sandbox-server || true
  fi
  if (( APP_SWITCHED )); then
    install -m 644 "$BACKUP/online-judge-worker.service" /etc/systemd/system/online-judge-worker.service
    systemctl daemon-reload
  fi
  if (( INTERACTIVE_CHANGED )); then systemctl restart sandbox-interactive || true; fi
  # A migration can be restored only before the new website has accepted
  # requests. Once started, keep the database to avoid losing new submissions.
  if (( ! SITE_STARTED )) && [[ -f "$BACKUP/oj.db" ]]; then
    cp "$BACKUP/oj.db" "$APP/oj.db"
    chown oj:oj "$APP/oj.db"
  fi
  systemctl start online-judge online-judge-worker || true
  exit "$status"
}
trap rollback ERR

[[ -d "$SOURCE/sandbox-runner/src" && -f "$SOURCE/.env" && -f "$APP/oj.db" ]] || {
  echo "Missing staged source or persistent app bindings" >&2; exit 1;
}
mkdir -p /opt/oj-deploy-backups
mkdir "$BACKUP"
export DATABASE_URL="file:$APP/oj.db"

echo '== Build and test sandbox on port 18090 =='
make -C "$SOURCE/sandbox-runner" all
cc -O2 -DPORT=18090 -o "$SOURCE/sandbox-runner/sandbox-server-test" \
  "$SOURCE/sandbox-runner/src/server.c" -lmicrohttpd -lcjson
cc -O2 -I"$SOURCE/sandbox-runner/src" -o "$SOURCE/sandbox-runner/test-cleanup" \
  "$SOURCE/sandbox-runner/test/test_cleanup.c" -lmicrohttpd -lcjson
"$SOURCE/sandbox-runner/test-cleanup"
python3 "$SOURCE/sandbox-runner/test/test_compile_cache.py" \
  --server "$SOURCE/sandbox-runner/sandbox-server-test" \
  --jail "$SOURCE/sandbox-runner/jail" --port 18090 --mode cache
python3 "$SOURCE/sandbox-runner/test/test_compile_cache.py" \
  --server "$SOURCE/sandbox-runner/sandbox-server-test" \
  --jail "$SOURCE/sandbox-runner/jail" --port 18090 --mode legacy

echo '== Build staged Next.js app =='
npm --prefix "$SOURCE" ci --include=dev --silent
npm --prefix "$SOURCE" run generate --silent
npm --prefix "$SOURCE" run build
chown -R oj:oj "$SOURCE/.next" "$SOURCE/node_modules" "$SOURCE/src"
if [[ "${2:-}" == '--preflight-only' ]]; then
  echo 'Release preflight passed; live services unchanged'
  exit 0
fi

echo '== Wait for active judging to finish before cutover =='
systemctl stop online-judge-worker
WORKER_STOPPED=1
for ((attempt=0; attempt<120; attempt++)); do
  judging=$(sqlite3 "$APP/oj.db" "SELECT COUNT(*) FROM Submission WHERE status='JUDGING';")
  if [[ "$judging" == 0 ]]; then break; fi
  sleep 1
done
if [[ "$judging" != 0 ]]; then
  systemctl start online-judge-worker
  echo 'Timed out waiting for active submissions; left site running' >&2
  exit 1
fi
SITE_STOPPED=1
systemctl stop online-judge

echo '== Back up app, sandbox and SQLite consistently =='
rsync -a --exclude='.env' --exclude='oj.db*' --exclude='.next*' \
  --exclude='node_modules' --exclude='*.bak*' "$APP/" "$BACKUP/app/"
cp "$SANDBOX/sandbox-server" "$BACKUP/sandbox-server"
cp "$SANDBOX/jail" "$BACKUP/jail"
rsync -a "$SANDBOX/src/" "$BACKUP/sandbox-src/"
cp /etc/systemd/system/sandbox-server.service "$BACKUP/sandbox-server.service"
cp /etc/systemd/system/sandbox-interactive.service "$BACKUP/sandbox-interactive.service"
cp /etc/systemd/system/online-judge-worker.service "$BACKUP/online-judge-worker.service"
sqlite3 "$APP/oj.db" ".backup '$BACKUP/oj.db'"

echo '== Migrate, promote sandbox and smoke-test it =='
( cd "$SOURCE" && ./node_modules/.bin/prisma migrate deploy )
if ! cmp -s "$SANDBOX/jail" "$SOURCE/sandbox-runner/jail"; then
  if systemctl is-active --quiet sandbox-interactive; then
    INTERACTIVE_CHANGED=1
    systemctl stop sandbox-interactive
  fi
fi
SANDBOX_SWITCHED=1
install -m 644 "$SOURCE/sandbox-runner/deploy/sandbox-server.service" /etc/systemd/system/sandbox-server.service
install -m 644 "$SOURCE/sandbox-runner/deploy/sandbox-interactive.service" /etc/systemd/system/sandbox-interactive.service
systemctl daemon-reload
install -m 755 "$SOURCE/sandbox-runner/jail" "$SANDBOX/jail.next"
mv -f "$SANDBOX/jail.next" "$SANDBOX/jail"
install -m 755 "$SOURCE/sandbox-runner/sandbox-server" "$SANDBOX/sandbox-server.next"
mv -f "$SANDBOX/sandbox-server.next" "$SANDBOX/sandbox-server"
rsync -a "$SOURCE/sandbox-runner/src/" "$SANDBOX/src/"
systemctl restart sandbox-server
python3 "$SOURCE/sandbox-runner/test/smoke_live_cache.py"
if (( INTERACTIVE_CHANGED )); then systemctl start sandbox-interactive; fi
systemctl is-active --quiet sandbox-server

echo '== Promote app and restart services =='
APP_SWITCHED=1
mv "$APP/.next" "$BACKUP/.next"
mv "$APP/node_modules" "$BACKUP/node_modules"
rsync -a --exclude='.env' --exclude='oj.db*' --exclude='.next*' \
  --exclude='node_modules' --exclude='*.bak*' "$SOURCE/" "$APP/"
rsync -a --delete "$SOURCE/src/" "$APP/src/"
mv "$SOURCE/.next" "$APP/.next"
mv "$SOURCE/node_modules" "$APP/node_modules"
install -m 644 "$SOURCE/deploy/online-judge-worker.service" /etc/systemd/system/online-judge-worker.service
systemctl daemon-reload
SITE_STARTED=1
systemctl start online-judge online-judge-worker
sleep 3
systemctl is-active --quiet sandbox-server online-judge online-judge-worker
curl --fail --silent --show-error --max-time 30 -o /dev/null http://127.0.0.1:3000/
curl --fail --silent --show-error --max-time 30 -o /dev/null https://oj.itousouta.me/
set -a
. "$APP/.env"
set +a
[[ -n "${JUDGE_WORKER_SECRET:-}" ]]
judge_status=$(curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}' \
  -X POST -H "x-judge-worker-secret: $JUDGE_WORKER_SECRET" \
  'http://127.0.0.1:3000/api/internal/judge?action=probe')
[[ "$judge_status" == 400 ]]
echo "Deployment verified. Backup: $BACKUP"
