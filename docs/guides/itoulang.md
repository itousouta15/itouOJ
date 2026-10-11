# 喵++ 0.3：中文 C++ 結構與喵串流

## 寫程式

```text
整數 主程式() {
  整數 左邊;
  整數 右邊;
  喵in >> 左邊 >> 右邊;
  喵out << 左邊 + 右邊 << 喵endl;
  回傳 0;
}
```

輸入 `20 22`，輸出 `42`。`主程式()` 在全域初始化後自動執行，參數必須為空；
英文 `main()` 也可使用，但同一份程式只能宣告一個入口。

| 操作 | 寫法 |
| --- | --- |
| 讀入數字／字串／布林 | `喵in >> 數值 >> 文字;` |
| 輸出 | `喵out << "答案：" << 數值 << 喵endl;` |
| 錯誤／紀錄輸出 | `喵err << "提醒";`／`喵log << "紀錄";` |
| 讀入整行 | `喵getline(喵in, 文字);` |
| 迴圈 | `迴圈 (整數 索引 = 0; 索引 < 5; ++索引) { ... }` |
| 函式型別 | `函式<整數(整數)>` |
| 閉包 | `[&](整數 增量) -> 整數 { 回傳 增量 + 1; }` |

`喵out` 不會自動加空白／換行，`喵endl` 會換行。`喵err`、`喵log` 不會進入判題的
標準輸出。基本型別前置宣告可以省略初始值；`自動`／`任意` 與函式型別仍須給初始值。
`喵in` 按宣告型別讀取；任意型別取得字串。讀完 token 後使用 `喵getline` 會讀到
同一行的剩餘內容，可能是空字串。EOF、格式錯誤或型別錯誤會回報執行期診斷。

數值沿用喵++ 的 binary64 模型，`整數`／`浮點數`／`小數` 是同一數值型別的
拼法，`5 / 2` 仍為 `2.5`。語言代號仍是 `itoulang`（未改名），完整規則見
[語言規格](../../vendor/itoulang/docs/LANGUAGE.md)。

遊樂場的標準輸入和程式草稿一起保存在此裝置，按執行時使用該次的快照。
載入時會將完全未修改的舊預設範例（`喵("Hello, world!");` 或改名前含
`你好，itouLang！` 的版本）一次性更新成目前的 `主程式()`／`喵out`／
`你好，喵++！` 寫法，並保留自訂程式、其他語言草稿與輸入。
題目頁可使用既有的「測試執行」自訂輸入或題目測資。

## 核心與判題接口

```text
喵++ 原始碼 + 測資
  → src/lib/itoulang.ts：產生 main.js
  → sandbox-runner：Node 20 的 namespace / cgroup / seccomp 沙箱
  → /opt/runtime/itoulang/src/wasm-transport.js
  → C++ 核心的 Wasm request({ type: "run", options: { input } })
  → 精確的 stdout／stderr + 結束碼
```

這個接口直接載入 Wasm，使用子模組相同的 lexer、parser、checker、compiler 與 VM。
`src/index.js` 在 Node 上會啟動原生 transport，不作為 OJ 沙箱入口。
Wrapper 保留沒有結尾換行的輸出，也保留錯誤前的部分輸出；失敗以結束碼 1 回傳。
判題核心沿用既有 AC／WA／RE、時限與記憶體規則。喵++ 不使用逐行互動 Terminal。

## 本機建置與驗證

安裝 CMake 3.20+、Ninja 和 Emscripten 4.0.23，並載入 `emsdk_env`：

```sh
git submodule update --init --recursive
npm run build:itoulang
npm run test:itoulang
npm run test:playground
npm run test:judge
npx tsc --noEmit
```

`test:itoulang` 使用真正的 Wasm 和 Node 子程序執行 wrapper，包含中文入口、
串流、精確 stdout／stderr、錯誤前的輸出、舊語法、closure、AC／WA／RE，
以及 CodeMirror 中文補全與註解／字串排除。CI 另以判題使用的 Node 20.11.1 跑此測試。

## 部署

先提交 OJ 修改與 `vendor/itoulang` gitlink，再於啟用 Emscripten 的 shell 執行部署。
部署腳本預設使用 `HEAD`；也可用 `-Revision <Git tree 或 commit>` 指定已驗證的
固定快照，網站與語言 gitlink 會取自同一份快照。
`deploy/deploy.ps1` 會呼叫 `scripts/package-itoulang.mjs`：

1. 從 **OJ HEAD 的 gitlink** 匯出語言來源，不使用未提交的子模組內容。
2. 在獨立暫存目錄建置 Wasm，驗證輸入／輸出和錯誤處理。
3. 將 tracked sources 與 `web/native/itou.js`、`itou.wasm` 打包；不包含建置快取。
4. 上傳後，`remote-release.sh` 在停站前使用實際判題 Node 驗證這份 runtime。
5. 安裝到 `/opt/piston-data/packages/node/20.11.1/itoulang/`，沿用現有回復流程。

也可單獨產生部署檔案：

```sh
npm run package:itoulang
# artifacts/itoulang.tar.gz
```

沙箱預設入口是 `file:///opt/runtime/itoulang/src/wasm-transport.js`。
`ITOULANG_RUNTIME_URL` 的自訂值也應指向 Wasm transport；`ITOULANG_MAX_STEPS`
是正的安全整數，未設定時為 100,000,000，讓沙箱的時限能先處理一般無窮迴圈。
多台 remote worker 的 Node runtime 目錄都需要安裝同一份部署套件。
