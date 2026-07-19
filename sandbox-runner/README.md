# sandbox-runner

> 從零實作、跑在正式站上的 Linux 沙箱：namespace 隔離 + cgroup v2 資源限制 + seccomp-bpf syscall 白名單，取代 itouOJ 原本完全依賴的 [Piston](https://github.com/engineer-man/piston)。

不是「Piston 壞了所以換一個現成的」，是自己刻了一個核心層級的評測沙箱。正式站（[oj.itousouta.me](https://oj.itousouta.me)）的 **C / C++ / Python / JavaScript 判題現在都走這裡**；Java 還沒做，暫時繼續用 Piston（見〈語言支援現況〉）。

## 為什麼要自己刻

Piston 本身的沙箱只管 CPU / 記憶體 / 時間跟檔案系統範圍，**不管使用者程式碼能不能呼叫子程序**——`import subprocess` 或 `os.system` 在容器裡就能跑任意指令。itouOJ 原本靠一份 [`piston-python-sitecustomize.py`](../deploy/piston-python-sitecustomize.py) 在直譯器層級擋掉常見的逃逸手法，但這**只保護 Python**，C/C++/Java/JavaScript 完全沒有這層防護。

> 這個缺口現在只剩 **Java** 還沒補上。C/C++/Python/JavaScript 已經換成這個專案的核心層級沙箱（見下方〈架構〉），語言無關、不用像 `sitecustomize.py` 那樣每種語言各自在應用層擋一次。Java 因為 JVM 的 syscall 面最複雜，還沒做，暫時繼續走 Piston，也就是繼續只有 Piston 原本的資源限制、沒有子程序防護。

這個專案的目標：用作業系統本身的機制（namespace 隔離、cgroup 資源上限、seccomp syscall 白名單）做出語言無關、核心層級的防護，而不是每種語言各自在應用層擋一次。`sitecustomize.py` 這類直譯器層級的稽核鉤子（`sys.addaudithook`）比字串黑名單擋 `import` 紮實，但它終究是**應用層的第二道防線**，能被繞過的理論空間比核心層大；真正的安全邊界是下面這三層——就算稽核鉤子有漏洞或整個拿掉，`fork`/`clone`/`execve /bin/sh` 這類逃逸手法還是會在 seccomp/namespace 這層被攔下來（見〈驗證方式〉的 `os.system` 測試）。

## 整體架構

```
┌──────────┐   HTTPS   ┌────────┐   :3000   ┌─────────────────┐
│ Browser  │ ────────> │ nginx  │ ────────> │  Next.js (judge.ts) │
└──────────┘           └────────┘           └────────┬─────────┘
                                                       │ src/lib/execute.ts
                                                       │ （依語言分流）
                                    ┌──────────────────┴──────────────────┐
                                    │                                     │
                          C/C++/Python/JavaScript                      Java
                                    │                                     │
                        ┌───────────▼────────────┐          ┌────────────▼───────────┐
                        │   sandbox-server :8090   │          │   Piston :2000 (Docker) │
                        │   (this project)         │          │                         │
                        │   ┌───────────────────┐  │          └─────────────────────────┘
                        │   │ jail (per request) │  │
                        │   │  namespaces        │  │
                        │   │  cgroup v2         │  │
                        │   │  seccomp-bpf       │  │
                        │   └───────────────────┘  │
                        └───────────────────────────┘
```

兩條評測路徑完全獨立，其中一邊掛掉不影響另一邊（見〈驗證方式〉的實測）。

## 核心防護：三層，缺一不可

```
┌─────────────────────────────────────────────┐
│ 1. Linux namespaces  （隔離：讓程式「看不到」東西）  │
│    PID / mount / UTS / IPC / user namespace   │
├─────────────────────────────────────────────┤
│ 2. cgroup v2          （限制：讓程式「用不了太多」） │
│    memory.max / pids.max / cgroup.kill 逾時     │
├─────────────────────────────────────────────┤
│ 3. seccomp-bpf        （守門：讓程式「做不到」某些事）│
│    per-language syscall 白名單，預設整個 kill      │
└─────────────────────────────────────────────┘
```

三層職責不同、互相補強，不是其中一層做得更嚴就能取代另一層：

- **seccomp 管「能不能呼叫某個 syscall」，但看不到參數指向的路徑內容**——所以 `execve` 這個 syscall 本身一定要放行（jail 自己 bootstrap 執行受評測程式就是靠它），要擋的是「執行 `/bin/sh`」這件事，而這是靠 rootfs 裡根本不放 shell 來擋（見 `test/escape.c` 的 `shell` case：execve 被允許，但因為 rootfs 沒有 `/bin/sh`，最後死在 `ENOENT`）。
- **namespace 管「看得到什麼」，但不管資源用多少**——一個在自己 PID namespace 裡的 fork bomb 還是能把 cgroup 塞爆，這是 cgroup 的責任。
- **cgroup 的 `pids.max` 是真正的 fork-bomb 防線**，不是 seccomp。像 C/C++/Python 這種簡單直譯器/編譯器完全不需要 `fork`/`clone`，所以直接不放行，一呼叫就被 seccomp 秒殺；但 Node.js 的 V8/libuv 需要開執行緒（也要用 `clone3`），這時 seccomp 沒辦法用參數可靠分辨「開執行緒」跟「開新程序」，只能兩者都放行，改靠 `pids.max` 兜底。

## 專案結構

```
sandbox-runner/
├─ src/
│  ├─ jail.c        # 核心：namespace 建立、pivot_root、cgroup 加入、逾時監控、
│  │                 #       降權、seccomp 套用、execve 執行受測程式
│  ├─ cgroup.c/.h    # cgroup v2 操作（建立、寫入限制、cgroup.kill、讀 memory.peak）
│  ├─ caps.c/.h      # Linux capabilities 清空（capset + bounding set drop）
│  ├─ seccomp.c/.h   # 各語言的 seccomp-bpf 白名單（見下方〈seccomp 白名單怎麼建的〉）
│  └─ server.c       # HTTP 服務層：包裝 jail，對外提供跟 Piston 相容的
│                     #       /api/v2/execute JSON API（見〈sandbox-server〉）
├─ test/             # 驗證用的靜態編譯測試程式（隔離驗證、資源限制、
│                     #       權限丟棄、逃逸攻擊模擬）
├─ deploy/
│  └─ sandbox-server.service   # 正式環境 systemd unit
├─ shadow_replay.py  # 獨立驗證工具：重放歷史提交，比對 Piston vs 這個沙箱的判決
└─ Makefile
```

## 核心機制：`jail`

```
jail <rootfs-dir> <mem-limit-mb> <pids-max> <timeout-ms> <seccomp-profile> <program-path-in-rootfs> [args...]
```

單一一支 C 程式，做完以下所有事才 `execve` 執行受評測的程式：

1. **`clone3()` 一次性建立 6 種 namespace**（`CLONE_NEWUSER|CLONE_NEWPID|CLONE_NEWNS|CLONE_NEWNET|CLONE_NEWUTS|CLONE_NEWIPC`）——用一次呼叫而非依序 `unshare()`，避免建立過程中出現「部分建好」的競爭狀態。
2. 父行程幫子行程寫好 `uid_map`/`gid_map`（子行程在自己的 user namespace 裡先暫時是 ns-root）。
3. 子行程 `pivot_root` 換根目錄、掛新的 `/proc`，**在唯讀化之前**先完成所有需要寫入的設定步驟（這裡踩過一次坑：太早唯讀化會讓 `pivot_root` 自己需要的暫存目錄建立/清除失敗）。
4. cgroup v2 設好 `memory.max`、`memory.swap.max=0`、`pids.max`。
5. **順序嚴格**：先把 rootfs 唯讀化 → 從 ns-root 降到不具名的一般使用者（`setgid`/`setuid`）→ 清空所有 Linux capabilities（`capset` 全零 + bounding set 全丟）→ 設定 `PR_SET_NO_NEW_PRIVS` → 套用 seccomp 過濾器 → 最後才 `execve`。任何一步搬到後面，都可能讓受評測程式在某個瞬間仍握有不該有的權限。
6. 用 5ms 間隔的 `WNOHANG` 輪詢監控子行程；超時就寫 `cgroup.kill`（一次性 SIGKILL 整個 cgroup，不用列舉/逐一殺，對已經 fork 出一堆子行程的情況也安全）。
7. 執行結果（wall time、peak memory、逾時與否）透過**獨立的 fd 3** 回報給呼叫者（如果有開這個 fd 的話），這樣 fd 2（stderr）才能完全乾淨地保留給受評測程式自己的輸出，不會混進 jail 自己的診斷訊息——這是 `sandbox-server` 能正確拆分「使用者的 stderr」跟「系統的中繼資料」的關鍵。CLI 手動測試時沒開 fd 3，會自動退回印人類看得懂的訊息到 stderr。

## seccomp 白名單怎麼建的

**方法論**：不是憑經驗猜，是從正式站資料庫撈出真實的歷史提交，用 `strace -f` 實際觀察會用到哪些 syscall，缺什麼補什麼。踩過的坑，也是這個方法論存在的理由：

- 小範例測試全部正常，換成真正的測資（Python 讀進 100,000 筆數字、約 590KB 的 stdin）才炸——CPython 緩衝區成長到一定大小會改用 `mremap()` 而不是重新 `mmap()`，只用 hello-world 等級的樣本永遠不會發現。
- `ioctl` 沒有整支放行，只允許 `TCGETS`（stdio 判斷是否為終端機）、`FIOCLEX`（Python 設定 close-on-exec）、`FIONBIO`（Node/libuv 設定非阻塞 I/O）這幾個明確的子命令，用 seccomp 的參數過濾（`SCMP_A1(SCMP_CMP_EQ, ...)`）擋掉其他像 `TIOCSTI`（可以模擬終端機輸入）這類危險用法。
- `setuid`/`setgid` 家族**刻意不放行**：受評測程式跑起來時本來就已經沒有 capabilities 了，呼叫這些頂多是無意義的 no-op，但既然沒有正當理由需要，就整支擋掉，讓 seccomp 直接把行程殺掉，連「觀察到 EPERM」的機會都不給。

三個語言 profile 目前的差異：

| | native (C/C++) | python | node (JavaScript) |
|---|---|---|---|
| 來源 | 18 筆正式站 AC C++ 提交實測 | 8 筆正式站真實 Python 提交實測 | 合成測試（正式站當時還沒有真實 JS 提交） |
| `fork`/`clone`/`clone3` | ❌ 不放行 | ❌ 不放行 | ✅ 放行（V8/libuv 需要執行緒），fork-bomb 防線改靠 `pids.max` |
| 額外允許 | （共用基礎集合已足夠） | `stat`、`newfstatat` | `clone3`、`epoll_*`、`eventfd2`、`pipe2`、`pkey_alloc`（V8 JIT 用的記憶體保護）、`capget`、`sched_getaffinity`、`statx` |

## sandbox-server：對外的 HTTP 介面

`jail` 本身只是一支會被單次呼叫的 CLI 工具；`sandbox-server` 把它包裝成一個跟 Piston `/api/v2/execute` **欄位完全相容**的 HTTP 服務（監聽 `127.0.0.1:8090`，只綁 loopback，不對外網暴露），這樣 itouOJ 的 `judge.ts` 只需要換一個 client 模組，不用改判題邏輯本身。

- **編譯階段目前不進沙箱**（直接在 host 上跑 `gcc`/`g++`，加 `-O2 -static`）——刻意的簡化：攻擊者控制的是原始碼、不是機器碼，風險模型不同；未來要做編譯階段沙箱化不難，但這次先不做。
- Python / JavaScript 沒有編譯階段，直接用 bind mount 把 `/opt/piston-data` 裡對應版本的直譯器借進沙箱的 rootfs，執行完就 `umount`。
- 每個請求用獨立的暫存目錄 + `poll()` 多工處理 stdin/stdout/stderr（避免管線緩衝區塞滿造成死結）。
- 單執行緒（`MHD_USE_INTERNAL_POLLING_THREAD`，不開 thread-per-connection）：同一時間只判一筆，簡單但有效的併發保護。

## 語言支援現況

| 語言 | 狀態 | 備註 |
|---|---|---|
| C / C++ | ✅ 正式站使用中 | 靜態編譯，seccomp 白名單最窄 |
| Python 3.12 | ✅ 正式站使用中 | |
| JavaScript (Node 20) | ✅ 正式站使用中 | fork-bomb 防線改靠 cgroup `pids.max` |
| Java | ❌ 未實作 | JVM 的 JIT/GC/thread 需要的 syscall 面最廣，照原計畫留到最後 |

`judge.ts` 用 [`src/lib/execute.ts`](../src/lib/execute.ts) 按語言分流：上表打勾的走這個沙箱，Java 繼續走 Piston，兩條路徑互相獨立（其中一邊掛掉不影響另一邊，已用「故意關掉 sandbox-server、確認 Java 提交照樣正常」實測驗證過）。

## 驗證方式

### 逃逸測試矩陣

`test/escape.c` 針對每種攻擊向量各自嘗試，`test/checkpriv.c` 額外驗證權限丟棄。全部在正式站的 `native`/`python`/`node` 三個 profile 下實測過：

| 嘗試的動作 | 預期結果 | 實際結果 | 擋在哪一層 |
|---|---|---|---|
| `unshare(CLONE_NEWNS)` | 被殺 | `SIGSYS` | seccomp（syscall 不在白名單） |
| `ptrace(PTRACE_TRACEME)` | 被殺 | `SIGSYS` | seccomp |
| `socket(AF_INET, ...)` | 被殺 | `SIGSYS` | seccomp |
| `mount(...)` | 被殺 | `SIGSYS` | seccomp |
| `setuid(0)`（嘗試拿回權限） | 被殺 | `SIGSYS` | seccomp（`setuid` 家族整支不放行） |
| `execl("/bin/sh", ...)` | 失敗但不是被 seccomp 殺 | `ENOENT` | mount namespace / rootfs（execve 本身被允許，但 rootfs 裡沒有 shell 可執行） |
| Python `os.system("id")` | 失敗 | 先被 `sitecustomize.py` 擋下；即使拿掉，底層 `fork` 也不在白名單 | 應用層 + seccomp 雙重擋下 |
| JS `child_process.spawn()` 做 fork bomb | 被壓制、host 不受影響 | host process 數全程只多 2 個 | cgroup `pids.max`（`node` profile 允許 `clone3`，這是唯一防線） |
| 讀寫 rootfs（唯讀化後） | 失敗 | `Read-only file system` | mount namespace（唯讀 bind mount） |

`unshare`/`ptrace`/`socket`/`mount` 這四種在 `native`、`python`、`node` 三個 profile 下結果一致（都被 seccomp 攔下），沒有因為語言不同而出現防護落差。

### shadow_replay.py：跟 Piston 對答案

獨立、唯讀的重放工具，把正式站資料庫裡的歷史提交，用**完全複製自 `judge.ts` 的 `normalizeOutput`/`runVerdict` 邏輯**分別丟給 Piston 跟這個沙箱跑，比對兩邊判決是否一致。不改動 `judge.ts`、不需要重啟正式站，只寫自己的 flat log（不進 SQLite，避免多一個併發寫入者）。目前 38 筆歷史提交（30 筆 C++ + 8 筆 Python）0 mismatch。

### 正式站真實驗證（M8 切換上線）

直接用真實帳號透過 `https://oj.itousouta.me` 的正式提交流程測過 C/C++/Python/JavaScript/Java 五種語言，並且故意把 `sandbox-server` 關掉觀察對應語言的提交是否如預期變成 `IE`，確認分流真的生效、不是悄悄退回 Piston；反過來也確認關掉 `sandbox-server` 時 Java 提交完全不受影響。

## 建置與部署

```bash
apt install libseccomp-dev libmicrohttpd-dev libcjson-dev build-essential
cd sandbox-runner && make        # 產出 jail、sandbox-server 兩支執行檔
```

正式環境用 [`deploy/sandbox-server.service`](deploy/sandbox-server.service) 跑成 systemd 服務，跟 `jail` 一樣**必須用 root 執行**——建立 namespace/cgroup 需要的權限（`CAP_SYS_ADMIN` 等級），沒有辦法讓非特權使用者做到；真正的安全邊界不是「這支程式不是 root」，而是〈核心機制〉第 5 點那串「唯讀化 → 降權 → 清空 capabilities → seccomp → 才 execve」的嚴格順序，確保 root 權限只存在於短暫的 bootstrap 期間，受評測程式本身從來沒有機會拿到它。

## 已知限制 / 尚未做的事

- Java 語言支援
- 編譯階段（`gcc`/`g++`）本身還沒沙箱化
- rootfs 目前直接 bind mount 整個 host `/usr`，還沒收斂成只含實際用到的 `.so` 檔案（更小的攻擊面）
- wall-clock 逾時偵測是 5ms 間隔輪詢，不是 `timerfd`，精度夠用但不是最優
- Piston（Java 用）的三個補丁是 `docker exec ... sed -i` 直接改 container 內部檔案（見主 [README.md](../README.md#部署)），改天 Piston 官方 image 更新，`sed` 的比對字串可能悄悄不匹配、補丁靜默失效卻不會報錯。比較耐用的做法是改成維護自己的 patch 檔 + 自建 Docker image，而不是每次重建容器後手動重打；目前 Java 走的量還小，先沒有動手做這個重構
