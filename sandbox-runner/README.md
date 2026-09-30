# sandbox-runner

> 從零實作的 Linux 判題沙箱：namespace 隔離 + cgroup v2 資源限制 + seccomp-bpf syscall 白名單。跑在正式站 [oj.itousouta.me](https://oj.itousouta.me) 上，取代原本的 [Piston](https://github.com/engineer-man/piston)。

C / C++ / Python / JavaScript 的提交與測試執行都走這裡；Java 已停止接受新提交，舊提交紀錄仍保留。

## 為什麼要自己刻

Piston 的沙箱只管 CPU / 記憶體 / 時間跟檔案系統範圍，**不管使用者程式碼能不能呼叫子程序**——`import subprocess` 或 `os.system` 在容器裡就能跑任意指令。itouOJ 原本只靠一份 [`sitecustomize.py`](../deploy/piston-python-sitecustomize.py) 在 Python 直譯器層級擋這件事，C/C++/Java/JavaScript 完全沒有保護。

這個專案要的是語言無關、核心層級的防護，而不是每種語言在應用層各自擋一次。`sitecustomize.py` 這類稽核鉤子仍然有價值（比字串黑名單擋 `import` 紮實），但它是應用層的第二道防線；真正的邊界是下面這三層——就算鉤子有漏洞或整個拿掉，`fork`/`execve /bin/sh` 這類逃逸手法一樣會在 seccomp/namespace 被攔下（見〈驗證方式〉）。

## 架構

```
Browser ──HTTPS──> nginx ──:3000──> Next.js (judge.ts)
                                          │
                                 src/lib/execute.ts
                                   （呼叫沙箱）
                           │
                     C/C++/Python/JS
                           │
               sandbox-server :8090
              ┌─────────────────────┐
              │ jail（每個請求一次）   │
              │  namespaces          │
              │  cgroup v2           │
              │  seccomp-bpf         │
              └─────────────────────┘
```

桌機 Terminal 另外使用 `sandbox-interactive :8091`，也會呼叫同一個 `jail`。

## 三層防護

| 層 | 管什麼 | 機制 |
|---|---|---|
| namespace | 看不看得到 | PID / mount / UTS / IPC / user namespace |
| cgroup v2 | 用不用得了太多 | `memory.max`、`pids.max`、`cgroup.kill` 逾時 |
| seccomp-bpf | 做不做得到 | per-language syscall 白名單，預設整個 kill |

三層互相補強，沒有誰能取代誰：

- **seccomp 只看得到 syscall 參數，看不到指向的路徑內容**。`execve` 一定要放行（jail 自己靠它 bootstrap），要擋的是「跑 `/bin/sh`」這件事——靠 rootfs 裡根本不放 shell 來擋，不是靠 seccomp。
- **namespace 管看得到什麼，不管用多少**。PID namespace 裡的 fork bomb 一樣能塞爆 cgroup。
- **`pids.max` 才是真正的 fork-bomb 防線**。C/C++/Python 這種簡單直譯器不需要 `fork`/`clone`，直接不放行；但 Node.js 的 V8/libuv 需要開執行緒（`clone3`），seccomp 沒辦法用參數可靠分辨「開執行緒」跟「開新程序」，只能兩者都放行，改靠 `pids.max` 兜底。

## 專案結構

```
sandbox-runner/
├─ src/
│  ├─ jail.c        # 核心：namespace / pivot_root / cgroup / 逾時監控 / 降權 / seccomp / execve
│  ├─ cgroup.c/.h    # cgroup v2 操作
│  ├─ caps.c/.h      # Linux capabilities 清空
│  ├─ seccomp.c/.h   # 各語言的 syscall 白名單
│  └─ server.c       # HTTP 層：跟 Piston /api/v2/execute 相容的 API
├─ test/             # 隔離、資源限制、權限丟棄、逃逸攻擊的驗證程式
├─ deploy/           # 正式環境 systemd unit
├─ shadow_replay.py  # 重放歷史提交，比對 Piston vs 這個沙箱
└─ Makefile
```

## `jail`：核心機制

```
jail <rootfs-dir> <mem-limit-mb> <pids-max> <timeout-ms> <seccomp-profile> <program-path-in-rootfs> [args...]
```

單一一支 C 程式，依序做完以下所有事才 `execve` 執行受評測的程式：

1. `clone3()` 一次建立 6 種 namespace，不依序 `unshare()`，避免「部分建好」的競爭狀態。
2. 父行程寫好子行程的 `uid_map`/`gid_map`。
3. `pivot_root` 換根目錄、掛新的 `/proc`——所有需要寫入的設定都在唯讀化**之前**做完（太早唯讀化會讓 `pivot_root` 自己的暫存目錄建立/清除失敗）。
4. cgroup v2 設好 `memory.max`、`memory.swap.max=0`、`pids.max`。
5. **順序嚴格**：rootfs 唯讀化 → 降權（`setgid`/`setuid`）→ 清空 capabilities（`capset` 全零 + bounding set 全丟）→ `PR_SET_NO_NEW_PRIVS` → 套用 seccomp → 才 `execve`。任何一步搬後面，受評測程式都可能在某個瞬間握有不該有的權限。
6. 5ms 輪詢監控子行程；逾時就寫 `cgroup.kill`，一次殺光整個 cgroup，不用列舉/逐一殺。
7. 結果透過獨立的 fd 3 回報，讓 stderr 完全乾淨地留給受評測程式自己的輸出（沒開 fd 3 時退回印到 stderr，CLI 手動測試用）。

## seccomp 白名單怎麼建的

不是憑經驗猜的：從正式站資料庫撈出真實歷史提交，`strace -f` 實際觀察會用到哪些 syscall，缺什麼補什麼。

- 小樣本全部正常，換成真正的測資（Python 讀 100,000 筆數字、約 590KB stdin）才炸——CPython 緩衝區長大後改用 `mremap()`，hello-world 等級的樣本測不出來。
- `ioctl` 沒有整支放行，只開 `TCGETS`（判斷終端機）、`FIOCLEX`（Python close-on-exec）、`FIONBIO`（Node 非阻塞 I/O）幾個明確子命令，用參數過濾擋掉 `TIOCSTI`（可模擬終端機輸入）之類的危險用法。
- `setuid`/`setgid` 家族刻意不放行：受評測程式早就沒有 capabilities 了，呼叫這些頂多是無意義的 no-op，沒有正當理由就整支擋掉。

三個 profile 的差異：

| | native (C/C++) | python | node (JavaScript) |
|---|---|---|---|
| 依據 | 18 筆正式站 AC C++ 提交 | 8 筆正式站真實 Python 提交 | 合成測試（當時還沒有真實 JS 提交） |
| `fork`/`clone`/`clone3` | ❌ | ❌ | ✅（V8/libuv 需要），改靠 `pids.max` |
| 額外允許 | — | `stat`、`newfstatat` | `clone3`、`epoll_*`、`eventfd2`、`pipe2`、`pkey_alloc`、`capget`、`sched_getaffinity`、`statx` |

## sandbox-server

`jail` 只是單次呼叫的 CLI 工具；`sandbox-server` 包成跟 Piston `/api/v2/execute` 欄位相容的 HTTP 服務（只綁 `127.0.0.1:8090`），讓 itouOJ 只需要換一個 client 模組。

- C/C++ 編譯階段也使用獨立的 `compile` 沙箱與 seccomp profile，不會直接讀取主機上的網站檔案。
- Python / JavaScript 沒有編譯階段，bind mount `/opt/piston-data` 裡的直譯器進沙箱 rootfs，執行完就 `umount`。
- 每個請求獨立暫存目錄 + `poll()` 多工處理 stdin/stdout/stderr，避免管線緩衝區塞滿死結。
- 單執行緒，同一時間只判一筆——簡單但有效的併發保護。
- C/C++ 的第一筆測資完成編譯後，回傳 `compiled_handle`；同一份原始碼的後續測資用代碼重用沙箱端執行檔，不需反覆傳送 base64。每筆測資仍建立新的 jail。快取限 16 筆／64 MiB、單檔 16 MiB，閒置 15 分鐘過期；淘汰或服務重啟後會從原始碼重新編譯。舊版 `precompiled_binary` 暫保留，以支援分階段部署。

在可執行 `jail` 的 Linux 主機上，以不同的本機埠執行傳輸量／延遲比較及快取失效回歸測試，避免占用正式站的 8090：

```sh
cc -O2 -DPORT=18090 -o /tmp/oj-sandbox-test src/server.c -lmicrohttpd -lcjson
python3 test/test_compile_cache.py --server /tmp/oj-sandbox-test --jail ./jail --port 18090 --mode cache
python3 test/test_compile_cache.py --server /tmp/oj-sandbox-test --jail ./jail --port 18090 --mode legacy
```

正式站更新後可執行 `python3 test/smoke_live_cache.py`，只向本機沙箱送兩筆範例執行請求，不會新增或修改提交紀錄。
沙箱回應的 `metrics` 包含 setup、compile、run、cleanup 與 total 時間（毫秒）及請求位元組數；Next.js 會以 `[sandbox-metrics]` 記錄請求來源、排隊及傳輸時間，不包含使用者程式或測資內容。

## 語言支援現況

| 語言 | 狀態 | 備註 |
|---|---|---|
| C / C++ | ✅ 正式站使用中 | 靜態編譯，seccomp 白名單最窄 |
| Python 3.12 | ✅ 正式站使用中 | |
| JavaScript (Node 20) | ✅ 正式站使用中 | fork-bomb 防線靠 `pids.max` |

Java 已停止接受新提交；歷史判題資料仍保留。

`judge.ts` 透過 [`src/lib/execute.ts`](../src/lib/execute.ts) 使用沙箱；Python 與 Node 執行檔仍從 `/opt/piston-data` 的既有套件目錄掛入，關掉 Piston 容器後請保留此目錄。

## 驗證方式

**逃逸測試矩陣**——`test/escape.c`、`test/checkpriv.c`，在 `native`/`python`/`node` 三個 profile 下都測過：

| 嘗試的動作 | 結果 | 擋在哪一層 |
|---|---|---|
| `unshare(CLONE_NEWNS)` | `SIGSYS` | seccomp |
| `ptrace(PTRACE_TRACEME)` | `SIGSYS` | seccomp |
| `socket(AF_INET, ...)` | `SIGSYS` | seccomp |
| `mount(...)` | `SIGSYS` | seccomp |
| `setuid(0)` | `SIGSYS` | seccomp（整支不放行） |
| `execl("/bin/sh", ...)` | `ENOENT` | mount namespace / rootfs（execve 被允許，但沒有 shell） |
| Python `os.system("id")` | 失敗 | `sitecustomize.py` + seccomp 雙重擋下 |
| JS fork bomb（`child_process.spawn`） | host process 數只多 2 個 | cgroup `pids.max` |
| 寫入唯讀 rootfs | `Read-only file system` | mount namespace |

**`shadow_replay.py`**——獨立、唯讀的重放工具，用複製自 `judge.ts` 的 `normalizeOutput`/`runVerdict` 邏輯，把歷史提交分別丟給 Piston 跟這個沙箱跑，比對判決。不改 `judge.ts`、不需重啟正式站，log 寫 flat file 不進 SQLite。38 筆歷史提交（30 C++ + 8 Python）0 mismatch。

**正式站真實驗證**——M8 切換上線時，用真實帳號透過正式提交流程測過五種語言，並故意關掉 `sandbox-server` 確認對應語言變成 `IE`、Java 不受影響。

## 建置與部署

```bash
apt install libseccomp-dev libmicrohttpd-dev libcjson-dev build-essential
cd sandbox-runner && make        # 產出 jail、sandbox-server
```

正式環境用 [`deploy/sandbox-server.service`](deploy/sandbox-server.service) 跑成 systemd 服務，跟 `jail` 一樣必須用 root 執行（建立 namespace/cgroup 需要的權限沒辦法給非特權使用者）。真正的安全邊界不是「這支程式不是 root」，而是〈`jail`〉第 5 點那串嚴格順序——root 權限只存在於短暫的 bootstrap 期間，受評測程式從來沒機會拿到它。

## Terminal（互動執行）

桌機編輯器的 **Terminal** 會啟動一個真正持續運作的程式，可逐行輸入及接收輸出。
它不會重跑先前的 stdin，也不建立提交／判分紀錄。

- C／C++：編譯與執行都使用原本的 `jail`；Python／JavaScript 使用同一組語言隔離設定。
- Terminal 中 Enter 送出一行、Shift+Enter 換行、EOF（Ctrl+D）結束 stdin、停止（Ctrl+C）終止程式。
- `fs.readFileSync(0)`、`sys.stdin.read()`、`while (cin >> x)` 等讀到檔尾的程式，需要按 EOF 才會繼續／結束。
- C/C++ 若關閉 `cin.tie`，無換行的提示請自行 `std::flush`／`fflush(stdout)`；Python 以 `-u` 啟動。
- 每次執行最長 120 秒（另有 15 秒編譯限制），CPU 時間仍依題目限制（最多 30 秒）；等待輸入不耗 CPU 額度。
- 每人最多一個互動工作階段、全站最多四個；輸入 64 KiB、輸出 256 KiB。關閉頁面會停止，斷線超過 30 秒自動清理。

`interactive.py` 是 Python 3 標準函式庫服務，僅監聽 `127.0.0.1:8091`。
Next.js `/api/terminal` 驗證登入、題目可見性、比賽權限與限定語言；後續的輸入／輸出／停止操作
都以登入者 ID 驗證工作階段擁有者。請勿把 8091 直接開放到網際網路。
前端以 long polling 接收增量輸出，輸入另用 POST，所以不需要額外的 WebSocket 反向代理設定。

### Linux 正式環境

更新 `jail`（本版加入可清理 cgroup 的 SIGTERM 停止與獨立 CPU 時間限制），再啟用服務：

```sh
cd /opt/sandbox-runner
make jail
sudo cp deploy/sandbox-interactive.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sandbox-interactive
```

Next.js 預設連線 `http://127.0.0.1:8091`，不同位置可設定 `INTERACTIVE_SANDBOX_URL`。
沙箱端可設定 `PYTHON_HOME`、`NODE_HOME`、`INTERACTIVE_WORK_ROOT`；正式環境預設沿用 `/opt/piston-data` 的 runtime。

### Windows 本機開發（WSL2 Ubuntu 24.04）

沙箱需要 Linux namespace／cgroup，不能直接在 Windows Node.js 中跑使用者程式。
在專案的 `sandbox-runner` 目錄，另開 PowerShell 執行：

```powershell
wsl -u root -- apt-get install -y gcc g++ libseccomp-dev python3 nodejs
wsl -u root -- gcc -O2 -Wall -Wextra -o jail src/jail.c src/cgroup.c src/caps.c src/seccomp.c -lseccomp
wsl -u root -- python3 dev-wsl.py
```

保持這個視窗運作，原本 Windows 上的 `npm run dev` 透過 localhost:8091 連線。
`dev-wsl.py` 僅在私有 mount namespace 裡處理 WSL 的掛載差異，工作目錄使用暫存 tmpfs，
不會修改宿主機的 WSL 驅動掛載。此開發環境使用 Ubuntu 的 GCC／Python／Node 版本，可能與正式站標籤不同。

### 整合測試

```sh
sudo PYTHON_HOME=/usr python3 -m unittest discover -s test -p test_interactive.py -v
```

需要已建置的 jail 與可用的 cgroup v2；測試涵蓋多輪輸入、UTF-8、EOF、停止、斷線清理、
跨使用者存取、編譯錯誤、CPU 與輸出限制。

## 其他已知限制

- Java 已下線，既有歷史提交仍可查閱
- rootfs 直接 bind mount 整個 host `/usr`，還沒收斂成只含實際用到的 `.so`
- 逾時偵測是 5ms 輪詢，不是 `timerfd`，精度夠用但不是最優
