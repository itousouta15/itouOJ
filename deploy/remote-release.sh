#!/usr/bin/env bash
# Invoked by deploy.ps1 from a verified git archive unpacked outside the live app.
set -Eeuo pipefail

SOURCE=$1
APP=/opt/online-judge
SANDBOX=/opt/sandbox-runner
# Must match NODE_HOME in sandbox-runner/src/server.c (bind-mounted at /opt/runtime).
ITOULANG_DIR=/opt/piston-data/packages/node/20.11.1/itoulang
NODE_RUNTIME=/opt/piston-data/packages/node/20.11.1/bin/node
BACKUP=/opt/oj-deploy-backups/$(date -u +%Y%m%d-%H%M%S)
REVISION=${3:-}
SITE_STOPPED=0
WORKER_STOPPED=0
SITE_STARTED=0
APP_SWITCHED=0
SANDBOX_SWITCHED=0
INTERACTIVE_CHANGED=0
CONTROL_CHANGED=0

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
    if [[ -d "$BACKUP/itoulang" ]]; then
      rm -rf -- "$ITOULANG_DIR"
      mkdir -p "$(dirname "$ITOULANG_DIR")"
      cp -a "$BACKUP/itoulang" "$ITOULANG_DIR"
    else
      rm -rf -- "$ITOULANG_DIR"
    fi
  fi
  if (( APP_SWITCHED )); then
    install -m 644 "$BACKUP/online-judge-worker.service" /etc/systemd/system/online-judge-worker.service
    systemctl daemon-reload
  fi
  if (( CONTROL_CHANGED )); then
    systemctl disable --now online-judge-control || true
    if [[ -f "$BACKUP/oj-service-control" ]]; then
      install -m 755 "$BACKUP/oj-service-control" /usr/local/sbin/oj-service-control
    else
      rm -f /usr/local/sbin/oj-service-control
    fi
    if [[ -f "$BACKUP/oj-service-control-server.mjs" ]]; then
      install -m 644 "$BACKUP/oj-service-control-server.mjs" /usr/local/sbin/oj-service-control-server.mjs
    else
      rm -f /usr/local/sbin/oj-service-control-server.mjs
    fi
    if [[ -f "$BACKUP/oj-deploy-job.mjs" ]]; then
      install -m 644 "$BACKUP/oj-deploy-job.mjs" /usr/local/sbin/oj-deploy-job.mjs
    else
      rm -f /usr/local/sbin/oj-deploy-job.mjs
    fi
    if [[ -f "$BACKUP/oj-gh-release.sh" ]]; then
      install -m 755 "$BACKUP/oj-gh-release.sh" /usr/local/sbin/oj-gh-release.sh
    else
      rm -f /usr/local/sbin/oj-gh-release.sh
    fi
    if [[ -f "$BACKUP/online-judge-control.service" ]]; then
      install -m 644 "$BACKUP/online-judge-control.service" /etc/systemd/system/online-judge-control.service
    else
      rm -f /etc/systemd/system/online-judge-control.service
    fi
    if [[ -f "$BACKUP/online-judge-control.sudoers" ]]; then
      install -m 440 "$BACKUP/online-judge-control.sudoers" /etc/sudoers.d/online-judge-control
    else
      rm -f /etc/sudoers.d/online-judge-control
    fi
    systemctl daemon-reload
    if [[ -f "$BACKUP/online-judge-control.service" ]]; then
      systemctl enable --now online-judge-control || true
    fi
  fi
  if (( INTERACTIVE_CHANGED )); then systemctl restart sandbox-interactive || true; fi
  # A migration can be restored only before the new website has accepted
  # requests. Once started, keep the database to avoid losing new submissions.
  if (( ! SITE_STARTED )) && [[ -f "$BACKUP/oj.db" ]]; then
    cp "$BACKUP/oj.db" "$APP/oj.db"
    chown oj:oj "$APP/oj.db"
  fi
  chown oj:oj "$APP" || true
  systemctl start online-judge online-judge-worker || true
  exit "$status"
}
trap rollback ERR

[[ -d "$SOURCE/sandbox-runner/src" && -f "$SOURCE/.env" && -f "$APP/oj.db" ]] || {
  echo "Missing staged source or persistent app bindings" >&2; exit 1;
}
[[ -z "$REVISION" || "$REVISION" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid release revision' >&2; exit 1; }
mkdir -p /opt/oj-deploy-backups
mkdir "$BACKUP"
export DATABASE_URL="file:$APP/oj.db"

echo '== Verify staged itouLang Wasm with the judge Node runtime =='
[[ -f "$SOURCE/vendor/itoulang/src/wasm-transport.js" &&
   -f "$SOURCE/vendor/itoulang/web/native/itou.js" &&
   -f "$SOURCE/vendor/itoulang/web/native/itou.wasm" ]] || {
  echo 'Missing itouLang 0.3 Wasm release artifacts' >&2; exit 1;
}
"$NODE_RUNTIME" "$SOURCE/scripts/verify-itoulang-runtime.mjs" \
  "$SOURCE/vendor/itoulang/src/wasm-transport.js"

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
sh -n "$SOURCE/deploy/oj-service-control"
node --check "$SOURCE/deploy/oj-service-control-server.mjs"
node --check "$SOURCE/deploy/oj-deploy-job.mjs"
bash -n "$SOURCE/deploy/oj-gh-release.sh"
node --check "$SOURCE/scripts/host-agent.mjs"
npm --prefix "$SOURCE" ci --include=dev --silent
npm --prefix "$SOURCE" run generate --silent
npm --prefix "$SOURCE" run build
npm --prefix "$SOURCE" run test:services
npm --prefix "$SOURCE" run test:deployment
( cd "$SOURCE" && TMPDIR="$SOURCE" npm run test:hosts )
echo '== Verify playground execution and saved-template migration =='
npm --prefix "$SOURCE" run test:playground
echo '== Verify CTF against disposable databases and the staged production build =='
( cd "$SOURCE" && CTF_TEST_PRODUCTION=1 npm run test:ctf && npm run test:ctf-beginner && npm run test:ctf-web-labs )
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
[[ ! -d "$ITOULANG_DIR" ]] || cp -a "$ITOULANG_DIR" "$BACKUP/itoulang"
cp /etc/systemd/system/sandbox-server.service "$BACKUP/sandbox-server.service"
cp /etc/systemd/system/sandbox-interactive.service "$BACKUP/sandbox-interactive.service"
cp /etc/systemd/system/online-judge-worker.service "$BACKUP/online-judge-worker.service"
[[ ! -f /usr/local/sbin/oj-service-control ]] || cp -a /usr/local/sbin/oj-service-control "$BACKUP/oj-service-control"
[[ ! -f /usr/local/sbin/oj-service-control-server.mjs ]] || cp -a /usr/local/sbin/oj-service-control-server.mjs "$BACKUP/oj-service-control-server.mjs"
[[ ! -f /usr/local/sbin/oj-deploy-job.mjs ]] || cp -a /usr/local/sbin/oj-deploy-job.mjs "$BACKUP/oj-deploy-job.mjs"
[[ ! -f /usr/local/sbin/oj-gh-release.sh ]] || cp -a /usr/local/sbin/oj-gh-release.sh "$BACKUP/oj-gh-release.sh"
[[ ! -f /etc/systemd/system/online-judge-control.service ]] || cp -a /etc/systemd/system/online-judge-control.service "$BACKUP/online-judge-control.service"
[[ ! -f /etc/sudoers.d/online-judge-control ]] || cp -a /etc/sudoers.d/online-judge-control "$BACKUP/online-judge-control.sudoers"
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
echo '== Install itouLang runtime =='
mkdir -p "$ITOULANG_DIR"
rsync -a --delete "$SOURCE/vendor/itoulang/" "$ITOULANG_DIR/"
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
rm -f "$APP/deploy/online-judge-control.sudoers"
rsync -a --delete "$SOURCE/src/" "$APP/src/"
mv "$SOURCE/.next" "$APP/.next"
mv "$SOURCE/node_modules" "$APP/node_modules"
# rsync -a copies the staged directory's root:root metadata onto APP itself.
# SQLite's DELETE journal must be created beside oj.db by the oj user.
chown oj:oj "$APP"
runuser -u oj -- sqlite3 "$APP/oj.db" \
  'BEGIN IMMEDIATE; CREATE TABLE __oj_deploy_write_probe (id INTEGER); ROLLBACK;'
install -m 644 "$SOURCE/deploy/online-judge-worker.service" /etc/systemd/system/online-judge-worker.service
CONTROL_CHANGED=1
install -m 755 "$SOURCE/deploy/oj-service-control" /usr/local/sbin/oj-service-control
install -m 644 "$SOURCE/deploy/oj-service-control-server.mjs" /usr/local/sbin/oj-service-control-server.mjs
install -m 644 "$SOURCE/deploy/oj-deploy-job.mjs" /usr/local/sbin/oj-deploy-job.mjs
install -m 755 "$SOURCE/deploy/oj-gh-release.sh" /usr/local/sbin/oj-gh-release.sh
install -m 644 "$SOURCE/deploy/online-judge-control.service" /etc/systemd/system/online-judge-control.service
install -d -m 700 /var/lib/oj-git-deploy
rm -f /etc/sudoers.d/online-judge-control
systemctl daemon-reload
systemctl enable --now online-judge-control
systemctl restart online-judge-control
systemctl is-active --quiet online-judge-control
control_status=''
for ((attempt=0; attempt<30; attempt++)); do
  # systemctl reports active before Node has bound the socket. A failed probe
  # here must not fire the ERR rollback trap inside command substitution.
  if control_status=$(runuser -u oj -- setpriv --no-new-privs curl --silent --max-time 2 \
    --unix-socket /run/oj-service-control/control.sock -o /dev/null -w '%{http_code}' http://localhost/control); then
    if [[ "$control_status" == 405 ]]; then break; fi
  fi
  sleep 1
done
[[ "$control_status" == 405 ]]
SITE_STARTED=1
systemctl start online-judge online-judge-worker
sleep 3
systemctl is-active --quiet sandbox-server online-judge online-judge-worker online-judge-control
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
echo '== Sync and validate OJ nginx upload limit =='
# Normalize the staged script too: git archive on Windows can produce CRLF.
tr -d '\r' < "$SOURCE/deploy/sync-nginx-upload-limit.sh" | bash -s -- "$SOURCE/deploy/nginx-oj.conf"
touch "$BACKUP/deploy-success"
# Retain the newest three successful rollback points. Old failed attempts can be
# removed once they are older than the third successful backup.
mapfile -t successful < <(find /opt/oj-deploy-backups -mindepth 2 -maxdepth 2 -name deploy-success \
  -printf '%h\n' | sort -r)
if (( ${#successful[@]} > 3 )); then
  cutoff=${successful[2]}
  for old in /opt/oj-deploy-backups/[0-9]*; do
    [[ -d "$old" && ! -L "$old" && "${old##*/}" =~ ^[0-9]{8}-[0-9]{6}$ ]] || continue
    if [[ "$old" < "$cutoff" ]]; then rm -rf -- "$old" || echo "Could not prune $old" >&2; fi
  done
fi
if [[ -n "$REVISION" ]]; then
  install -d -m 700 /var/lib/oj-git-deploy
  printf '%s\n' "$REVISION" > /var/lib/oj-git-deploy/revision.next
  mv -f /var/lib/oj-git-deploy/revision.next /var/lib/oj-git-deploy/revision
fi
echo "Deployment verified. Backup: $BACKUP"
