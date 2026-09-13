<img width="80" height="80" alt="LOGO" src="public/brand/itouOJ.png" />

# itouOJ

<img width="1595" alt="image" src="public/brand/Hero.png" />

A self-hosted online judge (OJ) for programming contests. The frontend and backend are built together with Next.js. The judging engine splits by language into two paths: C/C++/Python/JavaScript run on the self-hosted [sandbox-runner](sandbox-runner/README.md) (a sandbox built from scratch with Linux namespaces + cgroup v2 + seccomp-bpf), while Java still runs on [Piston](https://github.com/engineer-man/piston).

Live site: [oj.itousouta.me](https://oj.itousouta.me) ・ Android App: [app-v1.2.0](https://github.com/itousouta15/itouOJ/releases/tag/app-v1.2.0) ・ Windows submission client: [v1.3.2](https://github.com/itousouta15/itouOJ/releases/tag/v1.3.2)

## Table of Contents

- [Features](#features)
- [Tech Architecture](#tech-architecture)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Android App](#android-app)
- [Deployment](#deployment)
- [Daily Updates (after changing code)](#daily-updates-after-changing-code)
- [Adding a Language](#adding-a-language)

## Features

- Account registration / login, Google / Discord login support; the first administrator is created with the trusted-server bootstrap command
- Problem list with tags, page-number navigation, number / difficulty sorting, Markdown + KaTeX math statements, sample test cases, subtask scoring
- CodeMirror code editor (C++ / C / Python / Java / JavaScript) with automatic draft autosave
- Real-time judging: AC / WA / TLE / MLE / RE / CE, with per-test-case time and memory display
- **Code Recognition practice (識讀)**: multiple-choice questions showing a C or Python snippet ("what does this program output / do?"), organized into clusters (e.g. APCS past exam papers plus the C / Python 125-question banks — 391 questions in 15 clusters already imported); practice one at a time with instant answer checking and explanations. Answers are recorded separately (`RecognitionAnswer`, not submissions), with per-cluster progress and a reviewable answer history. The C / Python 125-question banks are used with permission from Prof. Bangye Wu for non-profit educational use, with the source credited on the recognition pages
- **Contests**: ICPC / IOI scoring modes, scoreboard freeze + admin-controlled reveal, join codes, per-contest language restrictions, PDF problem statements (optionally AES-256 encrypted for pre-deployment), participant readiness tracking, and an offline mode for no-network contest rooms
- Submission history, leaderboard, user profiles, account settings (linked OAuth accounts, password, delete account)
- Courses (problem lists): a set of problems + description; members track their solving progress; public join or join-by-code
- Announcements: pinned announcements with Markdown content, admin can create / edit / delete (at `/announcements`)
- Problem discussions: comments with one level of replies, plus user-published solutions (title + explanation + optional code) that require an AC on the problem first
- Problem proposals: users can submit a problem (statement, limits, sample test cases) for admin review and approval
- Admin panel: problems (both programming and recognition types), proposal review, contests, courses, recognition clusters, tags, announcements, and **user management (grant / revoke admin role)**
- Light / dark theme toggle
- Android App (Capacitor wrapper): installable native app with a fixed dark theme and a layout distinct from the website (see "Android App")
- Windows offline client: `itouOJ-Submit.exe` (~23 KB, no install) for offline contests, with local spooling, batch upload, local test runs, and clock calibration (see `client/README.md`)

## Tech Architecture

| Layer | Technology |
|----|------|
| Frontend + Backend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| Database | SQLite + Prisma 7 (better-sqlite3 driver adapter) |
| Android App | Capacitor 8 (`android/` native project, WebView loading the live site) + browser / local-notifications / status-bar / keyboard / splash-screen plugins |
| Judging engine | [sandbox-runner](sandbox-runner/README.md) (self-hosted, C/C++/Python/JavaScript) + Piston (Docker, Java) |
| Judging queue | supervised `online-judge-worker.service` claims one submission at a time through `src/lib/judge.ts`; lease IDs prevent stale workers from writing results, and expired claims are recovered automatically. `next dev` starts an equivalent local worker |
| Compile cache | the compiled binary from the first test case is reused for the rest of the same submission |

```
                                  ┌──> sandbox-server (127.0.0.1:8090)
Browser ──> nginx ──> Next.js (:3000)─┤     C/C++/Python/JavaScript
                       │  SQLite   └──> Piston (127.0.0.1:2000, Docker)
                       │                 Java
```

`src/lib/execute.ts` routes by language; the two paths are independent (one failing does not affect the other). sandbox-runner is the sandbox built in this project (namespace isolation + cgroup resource limits + seccomp syscall whitelist) — details, motivations, and architecture diagrams in [sandbox-runner/README.md](sandbox-runner/README.md).

Supported languages (versions map to `src/lib/languages.ts`; time / memory multipliers relax the problem's original limits):

| Language | Version | Time mult. | Memory mult. | Judging engine |
|----|----|:---:|:---:|----|
| C++ | GCC 10.2.0 | 1x | 1x | sandbox-runner |
| C | GCC 10.2.0 | 1x | 1x | sandbox-runner |
| Python | 3.12.0 | 3x | 1x | sandbox-runner |
| JavaScript | Node 20.11.1 | 3x | 2x | sandbox-runner |
| Java | 15.0.2 | 2x | 2x | Piston |

## Project Structure

```
src/
├─ app/               # Next.js App Router pages and API routes
│  ├─ admin/          # admin panel (problems, proposals, contests, courses, recognition, tags, users, announcements)
│  ├─ api/            # backend API (auth, contests, submissions, run, recognition, tags...)
│  ├─ problems/       # problem list / detail, proposals
│  ├─ recognition/    # code recognition practice (cluster list, cluster practice, single question)
│  ├─ contests/       # contest list / detail
│  ├─ courses/        # course list / detail
│  ├─ announcements/  # announcement list / detail
│  ├─ submissions/    # submission history (incl. recognition answer history)
│  ├─ ranking/        # leaderboard
│  ├─ settings/       # account settings
│  ├─ users/          # user profiles
│  └─ desktop-auth/   # browser-based login for the Windows client
├─ components/        # shared React components
├─ lib/               # judging logic, language config, shared utilities (judge.ts, languages.ts, contest.ts...)
└─ generated/prisma/  # `prisma generate` output (do not edit manually)

prisma/
├─ schema.prisma      # database schema
├─ seed-data/         # bundled seed data (e.g. recognition/ — APCS past exam papers)
└─ migrations/        # migration history

scripts/               # seed & maintenance scripts (contest accounts, recognition import, tags, mock judge...)

deploy/                # deployment scripts and config (see "Deployment")

sandbox-runner/         # self-hosted judging sandbox (for C/C++/Python/JavaScript), see its README

client/                 # Windows submission client and build tooling, see `client/README.md`

android/                # Capacitor Android native project (Android App), see "Android App"
android/scripts/        # icon generation script (generate-icons.mjs, sharp converts public/brand/itouOJ.svg to per-density mipmaps)
capacitor.config.ts     # Capacitor config (App URL, plugin behavior)
```

## Local Development

```bash
npm install                 # runs prisma generate automatically
npx prisma migrate dev      # create the SQLite database
npm run dev
```

`next dev` also starts a local judging worker. It still needs a reachable sandbox-runner / Piston instance; use the SSH tunnel below when judging against the remote development services.

Optional seeds and helpers:

```bash
node scripts/import-recognition-questions.mjs  # import the bundled APCS recognition papers (idempotent, --dry-run to validate)
node scripts/parse-reading-bank.mjs --self-test # parser that turns a reading-bank PDF into prisma/seed-data/recognition/*.json
node scripts/tag-problems.mjs                 # seed the tag library and assign tags by title (idempotent)
node scripts/setup-test-contest.mjs           # build a disposable test.db with a running IOI-mode C++-only contest
node scripts/mock-judge.mjs                   # fill test.db submission results (for Windows dev without a Linux sandbox)
```

Re-generating the recognition question JSON from the original PDF (`--dump-text` first
to inspect the extracted layout, `--answers` if answers are in a separate key):

```bash
node scripts/parse-reading-bank.mjs --pdf <pdf> --category C --source "C 程式識讀 125 題"
node scripts/parse-reading-bank.mjs --pdf <pdf> --category Python --source "Python 程式識讀 125 題"
node scripts/import-recognition-questions.mjs --dry-run   # validate before importing
```

`.env` configuration (reference):

```env
DATABASE_URL="file:./prisma/data/dev.db"
AUTH_SECRET="<openssl rand -hex 32>"
PISTON_URL="http://localhost:2000"   # Piston address (Java)
SANDBOX_URL="http://localhost:8090"  # sandbox-runner address (C/C++/Python/JavaScript; this is also the default)
COOKIE_SECURE="0"                    # development only; production cookies are always Secure
JUDGE_WORKER_SECRET=""               # a long random value; required by online-judge-worker.service

# Google login (optional; the button is hidden when unset)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Discord login (optional; the button is hidden when unset)
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# APP_URL="https://oj.example.tw"    # public URL in production (used to build OAuth redirect URIs)
# DEPLOY_SERVER="root@<server-ip>"   # deployment target (read by deploy/deploy.ps1; the IP is not hardcoded)
# OFFLINE_MODE="0"                   # set to 1 to disable Google/Discord login (offline contest rooms)
```

### First administrator
New accounts are always regular users. After creating the intended account, run this command directly on the trusted server once:

```bash
node scripts/bootstrap-admin.mjs <username>
```

It refuses to run when an administrator already exists.

### Google login setup
Create an "OAuth client ID" (type: Web application) in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), and add `http://localhost:3000/api/auth/google/callback` as an authorized redirect URI. In production, add a second URI `https://<your-domain>/api/auth/google/callback` — Google rejects plain IPs and http for production, so the live site needs a domain + HTTPS before Google login can be enabled; also set `APP_URL` in `.env`. The first Google login auto-creates a regular account.

### Discord login setup
Create an Application in the [Discord Developer Portal](https://discord.com/developers/applications), take the Client ID / Client Secret from the OAuth2 tab, and add `http://localhost:3000/api/auth/discord/callback` to Redirects. In production, add `https://<your-domain>/api/auth/discord/callback` as well and set `APP_URL` in `.env`. The first Discord login also auto-creates a regular account.

If Piston is not running locally, you can tunnel to a remote one: `ssh -N -L 2000:localhost:2000 user@server`.

## Android App

The App is a Capacitor-wrapped WebView: the native shell loads the live site (`https://oj.itousouta.me`), so login, OAuth, and judging all run on the same domain as the browser. When the web side detects a native environment (`html[data-app]`, set by the themeInit in `src/app/layout.tsx` before first paint) it applies App-specific styling — **the App and the website are two distinct interfaces**:

| | Website | App |
|----|----|----|
| Theme | light / dark toggle | fixed dark |
| Navigation | top Navbar + Footer | bottom navigation only |
| Home | Hero + code window + promo section | compact layout (Hero decorations and promo section hidden) |
| Coding | inline editor | fullscreen editor on tap, collapses when the keyboard closes |

### Building

Requires JDK 17+ and the Android SDK (Android Studio is enough):

```bash
npm install
npx cap sync android     # sync plugins and config into the android/ project
npx cap open android     # open in Android Studio, run on a device or emulator
# or build an APK from the CLI:
cd android && ./gradlew assembleRelease
```

Release signing uses `android/keystore.properties` (not committed); `assembleDebug` works without it. Icons are generated by `android/scripts/generate-icons.mjs`, which uses sharp to convert `public/brand/itouOJ.svg` into per-density launcher / round / adaptive foreground icons; re-run the script after changing the LOGO.

### Development flow

The App loads the live site by default (`server.url` in `capacitor.config.ts`). To point it at a local dev server:

```bash
CAP_SERVER_URL=http://localhost:3000 npx cap sync android
adb reverse tcp:3000 tcp:3000
npx cap run android     # or run from Android Studio
```

### App-specific features

- **Login**: Google / Discord login inside the App opens the system browser (Custom Tab) to run OAuth; when it completes, the tab closes and you're logged in — the session is written only into the App's own WebView jar, never polluting the site's login state in the phone's browser (flow in `src/lib/appOAuth.ts` and `/api/auth/app/*`)
- **Keyboard symbol row**: the fullscreen editor shows two rows of code-symbol buttons above the phone keyboard (`{ } ( ) [ ] ; : ' " # | & _ * % ^` — 18 keys), inserted at the cursor; auto-hides when the keyboard closes
- **Contest start reminder**: while viewing a contest page in the App, a local notification is scheduled 10 minutes before the start (deduplicated per contest; schedule stored in the device's localStorage)
- **Judging result notification**: while staying on the judging page after submitting, a local notification fires when the verdict is ready (AC/WA/...)
- **Status bar**: follows the App's fixed dark theme; a gradient blur mask at the top
- **Admin**: an extra "管理" (Admin) entry in the bottom navigation
- The website's mobile experience (fullscreen editor, sticky bottom toolbar, card lists, safe-area handling) also works in a normal mobile browser, but the App-specific look is only applied in a native environment

> iOS requires macOS + Xcode to build; only Android is available so far. When a Mac is available, the same `capacitor.config.ts` can be used with `npx cap add ios`.

## Deployment

1. Start Piston on the server (**bind to localhost only; Piston has no authentication**):

   ```bash
   docker run --privileged -v /opt/piston-data:/piston --tmpfs /tmp:exec \
     -dit --restart=always -p 127.0.0.1:2000:2000 \
     -e PISTON_COMPILE_TIMEOUT=15000 -e PISTON_RUN_TIMEOUT=20000 \
     -e PISTON_OUTPUT_MAX_SIZE=33554432 \
     --memory=4g --memory-swap=4g --cpus=3 --pids-limit=1024 \
     --name piston_api ghcr.io/engineer-man/piston
   ```

   `--memory` / `--cpus` / `--pids-limit` cap the **container's total resource usage against the host** (separate from per-run judging limits — those come from `judge.ts` per problem settings and are enforced per run by the internal isolate/cgroup, which SIGKILLs and reports TLE/MLE). Without this layer, the Piston container can eat all CPU/RAM of the host by default, and an isolate bug or an oversized problem limit would take down nginx / Next.js on the same machine. Tune the numbers to the host specs (the example targets a 4-core 8 GB host, keeping 1 core for the system).

   If the container is already running, apply without rebuilding:

   ```bash
   docker update --memory=4g --memory-swap=4g --cpus=3 --pids-limit=1024 piston_api
   ```

   Stock Piston has three bugs that corrupt large test data (>100 KB) or even crash the whole judging service. **Re-apply the patches after every container rebuild** (`docker restart` keeps them; `docker rm` + `docker run` does not):

   ```bash
   # 1) HTTP API body limit defaults to 100KB, so large test data can't be sent → raise to 16MB

   docker exec piston_api sed -i \
     "s/body_parser.json()/body_parser.json({ limit: '16mb' })/; s/body_parser.urlencoded({ extended: true })/body_parser.urlencoded({ extended: true, limit: '16mb' })/" \
     /piston_api/src/index.js

   # 2) stdin is destroyed right after write, discarding the buffer before it finishes flushing
   #    (programs only receive the first ~200KB) → remove that line

   docker exec piston_api sed -i '/proc.stdin.destroy();/d' /piston_api/src/job.js

   # 3) If the user program exits before stdin finishes writing (early return / RE), the parent keeps
   #    writing into a closed pipe → uncaught EPIPE crashes the whole Piston process (affecting every
   #    submission at that moment) → add an empty error handler

   docker exec piston_api sed -i \
     "s/proc.stdin.write(this.stdin);/proc.stdin.on('error', () => {}); proc.stdin.write(this.stdin);/" \
     /piston_api/src/job.js
   docker restart piston_api
   ```

   > `docker cp` into this container's `/tmp` often silently fails (`/tmp` is a tmpfs); use a normal directory like `/root` when copying files in.

   Piston's own sandbox only constrains resources (CPU/memory/time) and filesystem scope — it does **not** prevent user code from spawning subprocesses. A submission that directly uses `import subprocess` / `os.system` can run arbitrary commands inside the container.

   In production only Java still goes through Piston; C/C++/Python/JavaScript have moved to [sandbox-runner](sandbox-runner/README.md)'s kernel-level protection and don't rely on these patches. Piston's bundled Python packages are still installed by the "Adding a Language" step, so this `sitecustomize.py` still needs to be in place.

   The patch file is at [deploy/piston-python-sitecustomize.py](deploy/piston-python-sitecustomize.py). Installed into the Python package's `site-packages`, it uses `sys.addaudithook` to block, at the interpreter level:

   - `subprocess`
   - `os.system` / `os.popen` / `os.fork`
   - `ctypes`
   - `socket`

   Once the audit hook is installed, user code cannot remove it — much sturdier than a string blacklist blocking `import`:

   ```bash
   scp deploy/piston-python-sitecustomize.py root@<server>:/root/sitecustomize.py
   ssh root@<server> "docker cp /root/sitecustomize.py piston_api:/piston/packages/python/3.12.0/lib/python3.12/site-packages/sitecustomize.py"
   ```

   This file lives under `/piston/packages/...`, on the same `/opt/piston-data` volume as the language packages, so a `docker rm` + `docker run` rebuild keeps it (unlike the 3 patches above); it only needs to be re-installed when switching Python versions or wiping `/opt/piston-data` to reinstall packages.

2. Install languages (per the versions in `src/lib/languages.ts`):

   ```bash
   curl -X POST http://localhost:2000/api/v2/packages -H 'Content-Type: application/json' \
     -d '{"language":"python","version":"3.12.0"}'
   # same for gcc 10.2.0 / java 15.0.2 / node 20.11.1
   ```

3. Start sandbox-runner (the judging engine for C/C++/Python/JavaScript, replacing Piston):

   ```bash
   apt install libseccomp-dev libmicrohttpd-dev libcjson-dev build-essential
   cd sandbox-runner && make
   cp deploy/sandbox-server.service /etc/systemd/system/
   systemctl daemon-reload && systemctl enable --now sandbox-server
   ```

   It must run as root (the namespace/cgroup setup can't be granted to unprivileged users) and binds only to `127.0.0.1:8090`. Architecture and security model in [sandbox-runner/README.md](sandbox-runner/README.md). Set `SANDBOX_URL="http://127.0.0.1:8090"` in the server `.env` (this is also the default).

4. Deploy the app itself: `npm ci && npm run generate && npx prisma migrate deploy && npm run build`, run `next start` under systemd (example in [deploy/online-judge.service](deploy/online-judge.service)), with nginx as reverse proxy in front ([deploy/nginx-oj.conf](deploy/nginx-oj.conf)).

5. Domain and HTTPS (live site `https://oj.itousouta.me`): add an A record pointing at the server (DNS only on Cloudflare), install `certbot python3-certbot-nginx`, then run `certbot --nginx -d oj.itousouta.me --redirect` (auto-renewal handled by certbot.timer). In the server `.env`, set `APP_URL="https://oj.itousouta.me"`, `COOKIE_SECURE="1"`, and the Google / Discord credentials.

## Daily Updates (after changing code)

```powershell
# 1. Commit your changes (the deploy script packages committed content; uncommitted changes won't ship)
git add -A
git commit -m "what you changed"

# 2. One-click deploy: package → upload → npm ci → prisma generate → migrate → build → restart services
.\deploy\deploy.ps1

# 3. Sync to GitHub
git push
```

- Preview locally: `npm run dev` at http://localhost:3000
- Judging needs the servers reachable: `ssh -N -L 2000:localhost:2000 -L 8090:localhost:8090 root@<server>` (2000 = Piston, Java; 8090 = sandbox-runner, other languages)
- If `prisma/schema.prisma` changed, run `npx prisma migrate dev --name <name>` locally to generate a migration, then commit it; the deploy script applies it on the server automatically

### App update flow

Web-side changes (App appearance, keyboard symbol row, login flow, etc.) take effect on the App immediately after the site is deployed — no reinstall needed. Only native-side changes (new Capacitor plugins, icons, version bump) require:

```powershell
npx cap sync android
cd android && .\gradlew.bat assembleRelease   # produces app/build/outputs/apk/release/app-release.apk
gh release create app-vX.Y.Z app-release.apk --title "itouOJ Android App X.Y" --notes "release notes"
```

## Adding a Language

Two paths, depending on whether it uses sandbox-runner:

- **Via Piston** (currently only Java): install the package on Piston (`POST /api/v2/packages`), then add a matching entry in `src/lib/languages.ts` (filename, version, time/memory multipliers).
- **Via sandbox-runner**: first create/extend the language's seccomp whitelist in `sandbox-runner/src/seccomp.c` (methodology in [sandbox-runner/README.md](sandbox-runner/README.md#seccomp-白名單怎麼建的)), add an entry to the `LANGS` table in `sandbox-runner/src/server.c`, then add the matching entry in `src/lib/languages.ts` and add the language to the `SANDBOX_LANGUAGES` set in `src/lib/execute.ts`.
