#!/usr/bin/env bash
# Called only after the scheduled GitHub Action has claimed a pinned SHA.
set -Eeuo pipefail
SHA=${1:-}
RUN_ID=${2:-}
[[ "$SHA" =~ ^[a-f0-9]{40}$ && "$RUN_ID" =~ ^[0-9]+-[0-9]+$ ]] || exit 2
LOG=/var/lib/oj-git-deploy/build.log
exec > >(tee -a "$LOG") 2>&1
STAGE="/tmp/oj-gh-$SHA-$RUN_ID"
[[ -d "$STAGE" && ! -L "$STAGE" && -f "$STAGE/oj.tar.gz" && -f "$STAGE/itoulang.tar.gz" ]] || exit 2
/usr/bin/node /usr/local/sbin/oj-deploy-job.mjs verify "$SHA"
RELEASE="$STAGE/release"
test ! -e "$RELEASE"
mkdir "$RELEASE"
tar tzf "$STAGE/oj.tar.gz" >/dev/null
tar tzf "$STAGE/itoulang.tar.gz" >/dev/null
gzip -dc "$STAGE/oj.tar.gz" > "$STAGE/oj.tar"
[[ "$(git get-tar-commit-id < "$STAGE/oj.tar")" == "$SHA" ]] || { echo 'Uploaded source does not match the claimed commit' >&2; exit 2; }
tar xf "$STAGE/oj.tar" -C "$RELEASE"
tar xzf "$STAGE/itoulang.tar.gz" -C "$RELEASE"
ln -s /opt/online-judge/.env "$RELEASE/.env"
sed -i 's/\r$//' "$RELEASE/deploy/remote-release.sh" "$RELEASE/deploy/oj-service-control" "$RELEASE/deploy/oj-gh-release.sh"
bash -n "$RELEASE/deploy/remote-release.sh"
/usr/bin/node /usr/local/sbin/oj-deploy-job.mjs phase "$SHA" verifying
flock -n /run/oj-git-deploy.lock bash -c '
  set -Eeuo pipefail
  CURRENT=$(cat /var/lib/oj-git-deploy/revision)
  /usr/bin/node /usr/local/sbin/oj-compare-commit.mjs "$CURRENT" "$3"
  bash "$1" "$2" live "$3"
' deploy-release "$RELEASE/deploy/remote-release.sh" "$RELEASE" "$SHA"
curl --fail --silent --show-error --max-time 30 -o /dev/null https://oj.itousouta.me/
/usr/bin/node /usr/local/sbin/oj-deploy-job.mjs finish "$SHA"
rm -rf -- "$STAGE"
