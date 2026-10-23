import styles from "./architecture.module.css";

const modules = [
  {
    path: "src/app/",
    title: "頁面與 API",
    detail: "App Router 頁面、登入與題目等路由；API 處理提交、識讀作答、CTF、草稿與管理操作。",
  },
  {
    path: "src/components/",
    title: "互動介面",
    detail: "題目編輯器、Terminal、競賽與課程介面等可重用元件。",
  },
  {
    path: "src/lib/",
    title: "業務邏輯",
    detail: "身分驗證、競賽規則、判題佇列、評分核心，以及沙箱與遠端 worker 通訊。",
  },
  {
    path: "prisma/",
    title: "持久資料",
    detail: "SQLite 資料模型與 migrations；保存使用者、題目、測資、提交、答題、課程及競賽資料。",
  },
  {
    path: "sandbox-runner/",
    title: "隔離執行",
    detail: "Linux 沙箱及互動式服務，以 namespace、cgroup v2 與 seccomp 限制不受信任的程式。",
  },
  {
    path: "client/ · android/",
    title: "其他使用端",
    detail: "Windows 離線收件程式及以 Capacitor WebView 載入網站的 Android App。",
  },
  {
    path: "deploy/ · scripts/",
    title: "部署與維護",
    detail: "Nginx、systemd、部署腳本與題庫匯入／測試等維護工具。",
  },
  {
    path: "vendor/itoulang/",
    title: "喵++ 語言核心",
    detail: "語言子模組；判題時由網站包裝原始碼，透過 Node 執行其 C++／Wasm 核心。",
  },
];

const submissionSteps = [
  {
    title: "撰寫與送出",
    path: "編輯器 → /api/submissions",
    detail: "使用者從題目或競賽頁提交原始碼；API 驗證登入、題目權限、語言及排隊額度。",
  },
  {
    title: "建立持久工作",
    path: "Prisma → SQLite",
    detail: "建立狀態為 PENDING 的 Submission。提交紀錄本身就是佇列，不依賴瀏覽器持續連線。",
  },
  {
    title: "領取並保有租約",
    path: "worker → 判題協調器",
    detail: "本機 worker 或遠端 worker 領取工作，轉為 JUDGING；心跳維持租約，逾期工作可重新排隊。",
  },
  {
    title: "在沙箱執行測資",
    path: "judgeCore → sandbox-server :8090",
    detail: "依語言編譯或執行，套用時間／記憶體限制，比對輸出並計算子題分數與判定結果。",
  },
  {
    title: "寫回並呈現結果",
    path: "協調器 → SQLite → 提交頁",
    detail: "協調器以租約識別碼確認結果，將 verdict、資源用量及測資結果一起寫回；提交頁和競賽計分再讀取結果。",
  },
];

const domainFlows = [
  {
    title: "帳號與權限",
    route: "/api/auth · src/lib/auth.ts",
    source: "帳密／OAuth",
    process: "Session 與角色驗證",
    result: "User",
  },
  {
    title: "題庫與程式評測",
    route: "/problems · /api/submissions",
    source: "Problem／測資／原始碼",
    process: "Submission → Worker → 沙箱",
    result: "TestResult",
  },
  {
    title: "識讀練習",
    route: "/recognition · /api/recognition-answers",
    source: "選擇題作答",
    process: "API 即時判定",
    result: "RecognitionAnswer／RecognitionReview",
  },
  {
    title: "CTF 練習",
    route: "/ctf · /api/ctf",
    source: "Flag 提交",
    process: "伺服器比對",
    result: "CtfAttempt／CtfSolve",
  },
  {
    title: "課程與競賽",
    route: "/courses · /contests",
    source: "課程／競賽題目",
    process: "選題、報名與計分",
    result: "CourseMember／Contest",
  },
  {
    title: "社群與管理",
    route: "/messages · /reports · /admin",
    source: "留言／訊息／回報",
    process: "權限檢查與管理",
    result: "ProblemComment／Message／BugReport",
  },
  {
    title: "草稿與離線提交",
    route: "/api/drafts · /api/contests/[id]/offline-submissions",
    source: "編輯草稿／離線收件",
    process: "帳號同步／復網補傳",
    result: "CodeDraft／Submission",
  },
];

export default function ProjectArchitecture() {
  return (
    <div className="space-y-8" id="architecture">
      <section className="card space-y-5 p-5 sm:p-7" aria-labelledby="architecture-title">
        <div>
          <p className="page-kicker">SYSTEM OVERVIEW</p>
          <h2 id="architecture-title" className="section-title mt-2">專案架構總覽</h2>
          <p className="mt-3 leading-relaxed text-dim">
            itouOJ 以 Next.js 16（App Router）、React 19、TypeScript 與 Tailwind CSS 4 建立網站；
            Prisma 7 連接 SQLite。網站負責介面、權限與資料協調，使用者程式則交由獨立的 Linux 沙箱執行。
          </p>
        </div>

        <figure className={styles.figure} aria-labelledby="overview-caption">
          <figcaption id="overview-caption" className={styles.figureHeading}>
            <span className={styles.figureIndex}>01 / 系統元件圖</span>
            <span>從使用者端到資料與執行服務</span>
          </figcaption>

          <div className={styles.clientGrid}>
            <div className={styles.node}>
              <span className={styles.nodeLabel}>WEB</span>
              <strong>瀏覽器</strong>
              <span>題目、編輯器、競賽及管理頁</span>
            </div>
            <div className={styles.node}>
              <span className={styles.nodeLabel}>MOBILE</span>
              <strong>Android App</strong>
              <span>Capacitor WebView 載入網站</span>
            </div>
            <div className={styles.node}>
              <span className={styles.nodeLabel}>OFFLINE</span>
              <strong>Windows 收件程式</strong>
              <span>本機保存，復網後補傳提交</span>
            </div>
          </div>

          <div className={styles.connector}><span aria-hidden="true">↓</span> HTTPS／API</div>

          <div className={styles.serverNode}>
            <div className={styles.serverTitle}>
              <span className={styles.nodeLabel}>APPLICATION · NEXT.JS</span>
              <strong>網站與協調器</strong>
            </div>
            <div className={styles.serverGrid}>
              <div>
                <strong>頁面與元件</strong>
                <span>App Router、CodeMirror、課程與比賽 UI</span>
              </div>
              <div>
                <strong>API 與業務邏輯</strong>
                <span>登入驗證、權限、題目、提交、判題協調</span>
              </div>
            </div>
          </div>

          <div className={styles.connector}><span aria-hidden="true">↓</span> 讀寫資料／派送執行</div>

          <div className={styles.serviceGrid}>
            <div className={styles.node}>
              <span className={styles.nodeLabel}>DATA</span>
              <strong>Prisma → SQLite</strong>
              <span>帳號、題庫、比賽與 Submission 持久佇列</span>
            </div>
            <div className={styles.node}>
              <span className={styles.nodeLabel}>JUDGE</span>
              <strong>Worker → 沙箱 :8090</strong>
              <span>本機或遠端領取工作，隔離執行正式提交</span>
            </div>
            <div className={styles.node}>
              <span className={styles.nodeLabel}>LIVE EXECUTION</span>
              <strong>測試／Terminal</strong>
              <span>範例測試走 :8090；互動服務走 :8091</span>
            </div>
          </div>
          <p className={styles.figureNote}>
            遠端 worker 透過受驗證的協調 API 領取工作，不直接連線 SQLite；沙箱服務也不向瀏覽器開放。
          </p>
        </figure>
      </section>

      <section className="card space-y-5 p-5 sm:p-7" aria-labelledby="flow-title">
        <div>
          <p className="page-kicker">SUBMISSION LIFECYCLE</p>
          <h2 id="flow-title" className="section-title mt-2">一筆程式提交如何完成評測</h2>
          <p className="mt-3 leading-relaxed text-dim">
            正式提交會經過持久佇列與 worker；編輯器的「測試執行」則由
            <code className={styles.inlineCode}>/api/run</code> 直接向沙箱送出範例或自訂輸入，不建立正式 Submission。
          </p>
        </div>

        <figure className={styles.figure} aria-labelledby="flow-caption">
          <figcaption id="flow-caption" className={styles.figureHeading}>
            <span className={styles.figureIndex}>02 / 提交時序圖</span>
            <span>正式提交的資料與工作流向</span>
          </figcaption>
          <ol className={styles.steps}>
            {submissionSteps.map((step, index) => (
              <li className={styles.step} key={step.title}>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.stepContent}>
                  <span className={styles.stepPath}>{step.path}</span>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </figure>

        <div>
          <h3 className="font-semibold text-tx">其他題型與執行路徑</h3>
          <div className={styles.branchGrid}>
            <div className={styles.branch}>
              <strong>識讀練習</strong>
              <p>由 API 即時判定選項，更新 RecognitionAnswer 與複習紀錄；不建立程式提交。</p>
            </div>
            <div className={styles.branch}>
              <strong>CTF 練習</strong>
              <p>伺服器比對 Flag 並記錄嘗試與解出狀態；不送進程式判題佇列。</p>
            </div>
            <div className={styles.branch}>
              <strong>互動式 Terminal</strong>
              <p>經登入 API 轉送至 sandbox-interactive :8091，逐行輸入並即時接收輸出。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card space-y-5 p-5 sm:p-7" aria-labelledby="domains-title">
        <div>
          <p className="page-kicker">FUNCTIONAL DOMAINS</p>
          <h2 id="domains-title" className="section-title mt-2">功能模組與資料歸屬</h2>
          <p className="mt-3 leading-relaxed text-dim">
            不同練習共用帳號與網站入口，但各自保存合適的作答紀錄；只有程式題的正式提交會進入沙箱判題。
          </p>
        </div>
        <figure className={styles.figure} aria-labelledby="domains-caption">
          <figcaption id="domains-caption" className={styles.figureHeading}>
            <span className={styles.figureIndex}>03 / 功能資料流圖</span>
            <span>入口 → 處理 → 資料去向</span>
          </figcaption>
          <div className={styles.domainHub}>
            <span className={styles.nodeLabel}>SHARED APPLICATION</span>
            <strong>Next.js API · 共用帳號與權限</strong>
          </div>
          <div className={styles.connector}><span aria-hidden="true">↓</span> 依功能分流</div>
          <div className={styles.domainLanes}>
            {domainFlows.map((domain, index) => (
              <div className={styles.domainLane} key={domain.title}>
                <div className={styles.domainLaneHeading}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{domain.title}</strong>
                  <code>{domain.route}</code>
                </div>
                <div className={styles.domainSequence}>
                  <div className={styles.domainStage}><span>入口</span><strong>{domain.source}</strong></div>
                  <span className={styles.domainArrow} aria-hidden="true">→</span>
                  <div className={styles.domainStage}><span>處理</span><strong>{domain.process}</strong></div>
                  <span className={styles.domainArrow} aria-hidden="true">→</span>
                  <div className={styles.domainStage}><span>紀錄</span><strong>{domain.result}</strong></div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.connector}><span aria-hidden="true">↓</span> 持久保存</div>
          <div className={styles.domainStorage}>
            <span className={styles.nodeLabel}>DATA LAYER</span>
            <strong>Prisma → SQLite</strong>
            <span>各模組共用資料庫；只有程式題提交進入 Worker／沙箱路徑。</span>
          </div>
        </figure>
      </section>

      <section className="card space-y-5 p-5 sm:p-7" aria-labelledby="modules-title">
        <div>
          <p className="page-kicker">SOURCE MAP</p>
          <h2 id="modules-title" className="section-title mt-2">程式碼與資料在哪裡</h2>
          <p className="mt-3 leading-relaxed text-dim">
            由使用者介面往下追查功能時，可以先從路由找到入口，再到共用邏輯與資料模型，最後查看沙箱或部署設定。
          </p>
        </div>
        <div className={styles.moduleGrid}>
          {modules.map((module) => (
            <div className={styles.module} key={module.path}>
              <code>{module.path}</code>
              <h3>{module.title}</h3>
              <p>{module.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-5 p-5 sm:p-7" aria-labelledby="deployment-title">
        <div>
          <p className="page-kicker">OPERATIONS</p>
          <h2 id="deployment-title" className="section-title mt-2">部署邊界與可靠性</h2>
        </div>
        <div className={styles.operations}>
          <div>
            <span className={styles.operationNumber}>01</span>
            <h3>對外流量</h3>
            <p>Nginx 接收 HTTPS 並反向代理至 Next.js；帳號 session、題目權限與 worker 驗證皆由伺服器端處理。</p>
          </div>
          <div>
            <span className={styles.operationNumber}>02</span>
            <h3>獨立服務</h3>
            <p>正式環境以 systemd 運行網站、判題 worker 與沙箱。互動式 Terminal 使用獨立服務；遠端 worker 可各自連到自己的沙箱。</p>
          </div>
          <div>
            <span className={styles.operationNumber}>03</span>
            <h3>故障後續跑</h3>
            <p>Submission 保存在 SQLite；worker 以租約、心跳與過期回收避免工作遺失，結果以交易寫入並拒絕過期租約重複覆蓋。</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-dim">
          想深入了解架設、評測協定與各功能的實作方式，可參考
          {" "}<a className="text-blue underline underline-offset-4 hover:text-tx" href="https://github.com/itousouta15/itouOJ#系統怎麼運作" target="_blank" rel="noopener noreferrer">專案 README</a>
          {" "}及
          {" "}<a className="text-blue underline underline-offset-4 hover:text-tx" href="https://github.com/itousouta15/itouOJ/blob/main/docs/judge-reliability.md" target="_blank" rel="noopener noreferrer">分散式判題文件</a>。
        </p>
      </section>
    </div>
  );
}
