// itouOJ 收件程式 — 主視窗

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace ItouOJ
{
    // 一般 TextBox 貼上 LF-only（沒有 \r）的文字時，Win32 EDIT 控制項不認得
    // 單獨的 \n 是換行，整段程式碼會擠成一行。很多編輯器/網頁複製出來的程式碼
    // 就是 LF-only，貼上題目程式碼是這支程式最核心的操作，這個問題不能留著。
    //
    // 攔在 WM_PASTE 這一層，不管是 Ctrl+V、右鍵選單、還是滑鼠中鍵貼上都會經過
    // 這裡，比只處理 Ctrl+V 的 KeyDown 更保險。
    class PasteNormalizingTextBox : TextBox
    {
        const int WM_PASTE = 0x0302;

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_PASTE)
            {
                if (Clipboard.ContainsText())
                {
                    string text = Clipboard.GetText();
                    // 統一先收斂成 \n，再展開成 \r\n，不管來源是 \n、\r\n 還是混用都會一致
                    text = text.Replace("\r\n", "\n").Replace("\r", "\n").Replace("\n", "\r\n");
                    SelectedText = text; // 有選取範圍就取代，沒有就插入在游標位置，跟預設貼上行為一致
                }
                return; // 吃掉這個訊息，不讓預設處理再貼一次
            }
            base.WndProc(ref m);
        }
    }

    public class MainForm : Form
    {
        Config cfg;

        TabControl tabs;
        TextBox txtServer, txtUser, txtFile, txtLoginUser, txtLoginPass;
        PasteNormalizingTextBox txtCode;
        RadioButton rbTyped, rbFile;
        ComboBox cboContest, cboProblem;
        Button btnLogin, btnPasswordLogin, btnBrowse, btnTest, btnSubmit, btnUpload, btnRefresh,
               btnOpenProblem, btnOpenSubmission, btnOpenBoard;
        ListView listView;
        Label lblStatus, lblAccount, lblLangHint, lblDraft, lblLock, lblWho, lblWhere;
        Panel setupPanel, pnlIdentity, lockableGroup, pnlGate;
        Label lblGateTitle, lblGateClock, lblGateHint, lblRemain;
        // 校正後的現在時間。放在狀態列 —— 那是唯一每個階段都看得到的地方，
        // 連等待/結束的全屏遮罩也蓋不到它。
        Label lblClock;
        readonly ToolTip clockTip = new ToolTip();
        // 目前連不連得上伺服器，跟時鐘一樣常駐狀態列，不必等有東西要上傳才看得到
        Label lblNet;
        readonly ToolTip netTip = new ToolTip();
        Panel pnlGateAction;
        Button btnGateAction;
        ComboBox cboGateContest;
        System.Windows.Forms.Timer phaseTimer;
        Screen lastScreen = Screen.NeedLogin;
        // 由 itouoj:// 帶進來、待登入後自動選取的比賽
        int pendingContestId = 0;
        // 由 itouoj:// 帶進來的瀏覽器目前登入帳號，僅供比對用，不是憑證
        string launchUser = null;
        // 監考臨時離開等待畫面去改設定的寬限時間
        DateTime gateSuppressedUntil = DateTime.MinValue;
        Button btnSettings, btnUnlock, btnCheckin, btnLogout, btnRefreshContest;
        Button btnBackToCountdown;
        // 解鎖只在本次執行有效，不寫回 config
        bool unlockedThisSession = false;
        // 這次執行是否已成功向伺服器回報就緒
        bool checkedIn = false;

        // 目前編輯區對應到哪一題；切題時要先把草稿存起來
        string draftLabel = null;
        System.Windows.Forms.Timer draftTimer;

        List<Dictionary<string, object>> contests = new List<Dictionary<string, object>>();

        System.Windows.Forms.Timer netTimer;
        bool probing = false;
        bool lastOnline = false;

        public MainForm() : this(null) { }

        // launchUrl：從網站按「開啟收件程式」時，作業系統會用
        // itouoj://start?server=...&contest=... 把程式叫起來並帶上這個參數。
        public MainForm(string launchUrl)
        {
            Store.EnsureDirs();
            cfg = Store.LoadConfig();
            ApplyLaunchUrl(launchUrl);
            BuildUi();
            LoadFromConfig();
            RefreshList();
            CheckForUpdateIfLaunchedFromBrowser(launchUrl);
            WarnIfAccountMismatch();

            // 網路一回來就主動提示，狀態列的連線指示燈也靠它更新。
            // 沒有這層的話，沒聽到監考宣布的選手可能就這樣關掉程式離場，
            // 提交永遠留在本機。
            netTimer = new System.Windows.Forms.Timer();
            netTimer.Interval = 5000;
            netTimer.Tick += OnNetTick;
            netTimer.Start();
            OnNetTick(null, EventArgs.Empty); // 開程式就先探一次，指示燈不必等 5 秒才有內容

            // 啟動就回報一次。監考巡檢時只會「打開程式看一眼」，如果只在選比賽時
            // 才回報，昨天設定好的機器今天永遠顯示未回報，這個功能就沒用了。
            SendCheckinAsync(false);

            // 每秒判斷比賽階段：時間到就自動開放作答、結束就自動關閉提交入口
            phaseTimer = new System.Windows.Forms.Timer();
            phaseTimer.Interval = 1000;
            phaseTimer.Tick += OnPhaseTick;
            phaseTimer.Start();
            OnPhaseTick(null, EventArgs.Empty);

            // 重新打開程式的第一件事：核對比賽現在的真實狀態，而不是只信任
            // 上面那行用本機快取算出來的畫面。監考可能在程式沒開著的時候
            // 延長、提早結束、或改動了這場比賽。
            RefreshContestStateAsync();
        }

        // itouoj://start?server=https%3A%2F%2Foj.itousouta.me&contest=3
        //
        // 只接受伺服器網址與比賽編號 —— 這是使用者可控的輸入，不該讓它帶進
        // token 之類的東西。登入仍然要走瀏覽器授權那條路。
        void ApplyLaunchUrl(string url)
        {
            if (string.IsNullOrEmpty(url)) return;
            try
            {
                int q = url.IndexOf('?');
                if (q < 0) return;
                string server = null;
                int contest = 0;
                foreach (string pair in url.Substring(q + 1).Split('&'))
                {
                    int eq = pair.IndexOf('=');
                    if (eq <= 0) continue;
                    string k = pair.Substring(0, eq);
                    string v = Uri.UnescapeDataString(pair.Substring(eq + 1));
                    if (k == "server") server = v;
                    else if (k == "contest") int.TryParse(v, out contest);
                    else if (k == "user") launchUser = v;
                }

                if (!string.IsNullOrEmpty(server) &&
                    (server.StartsWith("http://") || server.StartsWith("https://")))
                {
                    cfg.ServerUrl = server.TrimEnd('/');
                }
                // 比賽編號只是記下來，真正的題目與時間仍要登入後向伺服器要
                if (contest > 0 && contest != cfg.ContestId)
                {
                    pendingContestId = contest;
                }
                Store.SaveConfig(cfg);
            }
            catch { /* 參數壞掉不該讓程式開不起來 */ }
        }

        // 從網站「開啟收件程式」按鈕啟動時，帶進來的帳號如果跟這台機器目前
        // 登入的不一樣，就提醒一下——避免上一位選手（或監考測試用）的帳號
        // 忘了登出，這一位整場比賽都用錯帳號送出而不自知。
        //
        // launchUser 只是「使用者可控的比對用資訊」，不是憑證，所以這裡只警告、
        // 不自動登出：自動清掉草稿/選比賽這種有副作用的動作不該由網址參數觸發。
        void WarnIfAccountMismatch()
        {
            if (string.IsNullOrEmpty(launchUser)) return;
            if (string.IsNullOrEmpty(cfg.Username)) return; // 這台還沒登入過，之後走登入流程自然就是對的帳號
            if (cfg.Username == launchUser) return;

            MessageBox.Show(this,
                string.Format(
                    "網站上目前登入的帳號是「{0}」，但這台機器的收件程式登入的是「{1}」。\r\n\r\n" +
                    "如果不是你本人的帳號，請到「賽前設定」分頁按「登出」，再重新登入。",
                    launchUser, cfg.Username),
                "登入帳號不一致", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        // 只在從網站「開啟收件程式」按鈕啟動時查——那正是賽前設定、還有網路的
        // 時候，過了這個時間點通常就斷網了，查了也沒意義。查不到（沒有網路、
        // GitHub API 限流）就當作沒事，不能讓版本檢查擋住正常使用。
        void CheckForUpdateIfLaunchedFromBrowser(string launchUrl)
        {
            if (string.IsNullOrEmpty(launchUrl)) return;
            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                string latestTag = UpdateCheck.FetchLatestTag();
                if (!UpdateCheck.IsOlderThan(UpdateCheck.ClientVersion, latestTag)) return;

                try
                {
                    BeginInvoke((MethodInvoker)delegate
                    {
                        MessageBox.Show(this,
                            string.Format(
                                "這台機器安裝的收件程式是 v{0}，GitHub 上已經有更新的 {1}。\r\n\r\n" +
                                "建議比賽開始前先更新到最新版再繼續設定。\r\n" +
                                "下載：https://github.com/itousouta15/itouOJ/releases",
                                UpdateCheck.ClientVersion, latestTag),
                            "偵測到新版本",
                            MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    });
                }
                catch { /* 視窗已關閉 */ }
            });
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (draftTimer != null) draftTimer.Stop();

            if (Flow.ShouldResetOnExit(cfg, Store.ReadDir(Store.PendingDir).Count))
            {
                // 草稿按「比賽+題號」存、不綁使用者，留著等於把上一位的程式碼
                // 直接攤在下一位面前，所以連同身分一起清掉。
                Store.ClearDrafts();
                ClearSession();
                Store.SaveConfig(cfg);
            }
            else
            {
                // 沒有要重設就一定要把最後一秒打的字寫下來
                SaveDraft();
            }

            base.OnFormClosing(e);
        }

        void OnNetTick(object sender, EventArgs e)
        {
            if (probing) return;
            if (string.IsNullOrEmpty(cfg.ServerUrl))
            {
                SetNetLabel(null); // 還沒設定伺服器網址，無從得知
                return;
            }

            probing = true;
            string url = cfg.ServerUrl + "/api/me/contests";
            string cookie = cfg.Cookie;
            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                bool online = false;
                try
                {
                    // 連得上就算數，回 401 也代表伺服器在線
                    HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                    req.Method = "GET";
                    req.Timeout = 5000;
                    req.ReadWriteTimeout = 5000;
                    if (!string.IsNullOrEmpty(cookie)) req.Headers["Cookie"] = cookie;
                    try { using (req.GetResponse()) { online = true; } }
                    catch (WebException ex)
                    {
                        online = ex.Response != null;
                        if (ex.Response != null) ex.Response.Close();
                    }
                }
                catch { online = false; }

                try
                {
                    BeginInvoke((MethodInvoker)delegate
                    {
                        probing = false;
                        OnNetProbeResult(online);
                    });
                }
                catch { probing = false; } // 視窗已關閉
            });
        }

        void OnNetProbeResult(bool online)
        {
            SetNetLabel(online);

            if (online == lastOnline) return;
            lastOnline = online;
            if (!online) return;

            int pending = Store.ReadDir(Store.PendingDir).Count;
            if (pending == 0) return;

            btnUpload.BackColor = Theme.Warn; // 提示色：有東西還沒上傳
            Status(string.Format(
                "偵測到網路已恢復，有 {0} 筆提交還沒上傳 —— 請按右下角「上傳到伺服器」",
                pending), false);
        }

        // online 為 null 代表還沒偵測過（例如伺服器網址還沒設定）
        void SetNetLabel(bool? online)
        {
            if (lblNet == null) return;
            if (online == null)
            {
                lblNet.Text = "● 尚未偵測";
                lblNet.ForeColor = Theme.Mute;
            }
            else if (online.Value)
            {
                lblNet.Text = "● 已連線";
                lblNet.ForeColor = Theme.Good;
            }
            else
            {
                lblNet.Text = "● 離線";
                lblNet.ForeColor = Theme.Bad;
            }
        }

        void BuildUi()
        {
            Text = "itouOJ 收件程式";
            Font = Theme.Body;
            BackColor = Theme.Bg;

            // 全螢幕：比賽時佔滿畫面，選手不會被其他視窗分心，也少一個誤觸的機會。
            // 用 Maximized 而不是無邊框全螢幕 —— 選手仍需要切到瀏覽器登入、
            // 開題目 PDF，把視窗鎖死反而卡住正常流程。
            WindowState = FormWindowState.Maximized;
            MinimumSize = new Size(900, 640);
            StartPosition = FormStartPosition.CenterScreen;

            tabs = new TabControl();
            tabs.Dock = DockStyle.Fill;
            tabs.Font = Theme.Body;
            tabs.Padding = new Point(18, 8);

            tabs.TabPages.Add(BuildAnswerTab());
            tabs.TabPages.Add(BuildRecordsTab());
            tabs.TabPages.Add(BuildSetupTab());
            Controls.Add(tabs);

            // 狀態列固定在底部，切換分頁時訊息不會消失
            Panel bottom = new Panel();
            bottom.Dock = DockStyle.Bottom;
            bottom.Height = 34;
            bottom.BackColor = Theme.Card;
            bottom.Paint += delegate (object s, PaintEventArgs e)
            {
                using (Pen pen = new Pen(Theme.Border))
                    e.Graphics.DrawLine(pen, 0, 0, ((Panel)s).Width, 0);
            };

            // 目前是否連得上伺服器，跟時鐘一樣任何階段都看得到。
            //
            // 斷網比賽最需要知道的就是「現在到底斷了沒」——以前這件事只在
            // 網路剛恢復、又剛好有東西要上傳時才會用一則提示訊息閃過去，
            // 平常根本看不到目前狀態。
            lblNet = new Label();
            lblNet.Dock = DockStyle.Right;
            lblNet.Width = 90;
            lblNet.Font = Theme.BodyBold;
            lblNet.TextAlign = ContentAlignment.MiddleRight;
            lblNet.Padding = new Padding(0, 0, 10, 0);
            bottom.Controls.Add(lblNet);
            netTip.SetToolTip(lblNet,
                "目前是否連得上 itouOJ 伺服器。\r\n" +
                "比賽期間預期是「離線」；比賽結束、網路恢復後應變成「已連線」。");
            SetNetLabel(null);

            // 校正後的現在時間，任何階段都看得到。
            //
            // 「統一開始」整套機制就是靠每台機器對過同一個伺服器時鐘，但在這之前
            // 那個值只存在 config.json 裡，監考沒辦法確認各機是否真的一致。
            // 擺出來之後巡一遍場就能核對。
            lblClock = new Label();
            lblClock.Dock = DockStyle.Right;
            lblClock.Width = 160;
            lblClock.Font = new Font("Consolas", 11F, FontStyle.Bold);
            lblClock.ForeColor = Theme.Text;
            lblClock.TextAlign = ContentAlignment.MiddleRight;
            lblClock.Padding = new Padding(0, 0, 10, 0);
            bottom.Controls.Add(lblClock);
            clockTip.SetToolTip(lblClock,
                "這台機器校正後的時間（以伺服器為準）。\r\n" +
                "全場每一台都應該顯示同一個時間。");

            // 剩餘時間固定在右下角，作答時隨時看得到
            lblRemain = new Label();
            lblRemain.Dock = DockStyle.Right;
            lblRemain.Width = 150;
            lblRemain.Font = new Font("Consolas", 11F, FontStyle.Bold);
            lblRemain.ForeColor = Theme.Dim;
            lblRemain.TextAlign = ContentAlignment.MiddleRight;
            lblRemain.Padding = new Padding(0, 0, 14, 0);
            lblRemain.Visible = false;
            bottom.Controls.Add(lblRemain);

            // 比賽還沒開始時，「賽前設定」是從倒數畫面按過來的（暫時讓開
            // 60 秒，見 BuildGateOverlay 的 toSetup）。放在狀態列而不是
            // 「賽前設定」分頁裡——分頁裡的話切到別的分頁就看不到，回不去。
            btnBackToCountdown = Theme.Secondary("回到倒數畫面");
            btnBackToCountdown.Dock = DockStyle.Right;
            btnBackToCountdown.Width = 130;
            btnBackToCountdown.Visible = false;
            btnBackToCountdown.Click += delegate
            {
                gateSuppressedUntil = DateTime.MinValue;
                OnPhaseTick(null, EventArgs.Empty);
            };
            bottom.Controls.Add(btnBackToCountdown);

            lblStatus = new Label();
            lblStatus.Dock = DockStyle.Fill;
            lblStatus.Font = Theme.Body;
            lblStatus.ForeColor = Theme.Dim;
            lblStatus.TextAlign = ContentAlignment.MiddleLeft;
            lblStatus.Padding = new Padding(14, 0, 14, 0);
            bottom.Controls.Add(lblStatus);
            lblStatus.BringToFront();

            Controls.Add(bottom);

            // 等待 / 結束畫面蓋住整個視窗（狀態列除外）。
            // 放在 Form 而不是分頁裡：分頁內的 Dock=Fill 只拿得到其他面板分完後
            // 剩下的空間，題目下拉和提交按鈕會露在外面。
            Controls.Add(BuildGateOverlay());
            pnlGate.BringToFront();
        }

        // ── 等待 / 結束的全屏遮罩 ─────────────────────
        //
        // 比賽尚未開始時蓋住整個作答分頁，時間到之後也一樣。這不只是提示：
        // 遮罩擋住的是「題目與提交按鈕」本身，選手在時間外根本點不到。
        // 判斷靠校正過的本機時鐘，所以斷網也準，而且每台機器同一刻切換。
        Panel BuildGateOverlay()
        {
            pnlGate = new Panel();
            pnlGate.Dock = DockStyle.Fill;
            pnlGate.BackColor = Theme.Bg;
            pnlGate.Visible = false;

            // 監考在等待期間可能還要改設定，留一個入口（鎖了的話仍需 PIN）
            Button toSetup = Theme.Secondary("賽前設定");
            toSetup.Size = new Size(110, 32);
            toSetup.Click += delegate
            {
                pnlGate.Visible = false;
                tabs.SelectedIndex = 2;
                gateSuppressedUntil = DateTime.UtcNow.AddSeconds(60);
                Status("已暫時離開等待畫面（60 秒後自動返回）", false);
            };
            FlowLayoutPanel gateBar = MakeActionBar();
            gateBar.Dock = DockStyle.Bottom;
            gateBar.Padding = new Padding(0, 0, 20, 20);
            gateBar.Controls.Add(toSetup);
            pnlGate.Controls.Add(gateBar);


            lblGateTitle = new Label();
            lblGateTitle.Font = new Font("Microsoft JhengHei UI", 22F, FontStyle.Bold);
            lblGateTitle.TextAlign = ContentAlignment.MiddleCenter;
            lblGateTitle.Dock = DockStyle.Top;
            lblGateTitle.Height = 56;

            lblGateClock = new Label();
            lblGateClock.Font = new Font("Consolas", 46F, FontStyle.Bold);
            lblGateClock.TextAlign = ContentAlignment.MiddleCenter;
            lblGateClock.Dock = DockStyle.Top;
            lblGateClock.Height = 84;

            lblGateHint = new Label();
            lblGateHint.Font = new Font("Microsoft JhengHei UI", 11F);
            lblGateHint.ForeColor = Theme.Dim;
            lblGateHint.TextAlign = ContentAlignment.MiddleCenter;
            lblGateHint.Dock = DockStyle.Top;
            lblGateHint.Height = 60;

            // 精靈式流程的主要動作鈕（登入 / 選比賽 / 上傳），置中大顆
            pnlGateAction = new Panel();
            pnlGateAction.Dock = DockStyle.Top;
            pnlGateAction.Height = 96;
            pnlGateAction.BackColor = Theme.Bg;

            btnGateAction = Theme.Primary("");
            btnGateAction.Size = new Size(240, 46);
            btnGateAction.Click += OnGateAction;
            pnlGateAction.Controls.Add(btnGateAction);
            pnlGateAction.Resize += delegate
            {
                btnGateAction.Location = new Point(
                    (pnlGateAction.Width - btnGateAction.Width) / 2, 10);
            };

            cboGateContest = Theme.Select();
            cboGateContest.Size = new Size(420, 28);
            cboGateContest.Visible = false;
            cboGateContest.SelectedIndexChanged += OnContestChanged;
            pnlGateAction.Controls.Add(cboGateContest);
            pnlGateAction.Resize += delegate
            {
                cboGateContest.Location = new Point(
                    (pnlGateAction.Width - cboGateContest.Width) / 2, 62);
            };

            Panel spacer = new Panel();
            spacer.Dock = DockStyle.Top;
            spacer.Height = 90;
            spacer.BackColor = Theme.Bg;

            // Dock=Top 後加的在上面，所以由下往上加
            pnlGate.Controls.Add(pnlGateAction);
            pnlGate.Controls.Add(lblGateHint);
            pnlGate.Controls.Add(lblGateClock);
            pnlGate.Controls.Add(lblGateTitle);
            pnlGate.Controls.Add(spacer);

            return pnlGate;
        }

        // 每秒重新決定該顯示哪個畫面。整個流程的狀態只在這裡判斷，
        // 各分頁不自己做判斷，避免出現互相矛盾的畫面。
        void OnPhaseTick(object sender, EventArgs e)
        {
            UpdateClock();

            Screen s = Flow.Current(cfg);

            // 比賽還沒開始時才需要「回到倒數畫面」——開賽後倒數畫面本來就
            // 已經自動收起，沒有頁面好回去。
            btnBackToCountdown.Visible = s == Screen.Waiting;

            // 監考按了「賽前設定」，暫時讓開
            if (DateTime.UtcNow < gateSuppressedUntil)
            {
                pnlGate.Visible = false;
                return;
            }

            switch (s)
            {
                case Screen.NeedLogin:
                    ShowGate("歡迎使用 itouOJ 收件程式", "", Theme.Text,
                        "請先登入。會開啟瀏覽器讓你用 itouOJ 帳號登入，\r\n" +
                        "帳號密碼、Google、Discord 都可以。",
                        "用瀏覽器登入", false);
                    break;

                case Screen.NeedContest:
                    ShowGate("選擇比賽", "", Theme.Text,
                        "已登入為 " + cfg.Username + "。\r\n" +
                        "請選擇你要參加的比賽（需要先在 itouOJ 網站上報名）。",
                        "重新整理比賽清單", true);
                    break;

                case Screen.Waiting:
                    // 監考巡場時光看這個畫面就要能確認「這台機器是誰、考哪一場」，
                    // 不必另外切去「賽前設定」分頁查帳號。
                    ShowGate("比賽尚未開始",
                        Phase.Clock(Phase.Until(cfg, cfg.StartTimeUtc)), Theme.Accent,
                        cfg.Username + "　·　" + cfg.ContestTitle +
                        "\r\n時間一到會自動開放作答，請不要關閉程式。",
                        null, false);
                    break;

                case Screen.Ended:
                    int pending = Store.ReadDir(Store.PendingDir).Count;
                    ShowGate("比賽已結束", "00:00:00", Theme.Bad,
                        cfg.Username + "　·　" + cfg.ContestTitle + "\r\n" +
                        (pending > 0
                            ? "還有 " + pending + " 筆提交未上傳。網路恢復後請按下方按鈕回傳。"
                            : "所有提交都已上傳，可以到 itouOJ 網站查看判題結果。"),
                        pending > 0 ? "回傳到伺服器" : "前往 itouOJ 查看結果", false);
                    if (lastScreen == Screen.Answering)
                    {
                        SaveDraft();
                        Status("時間到，提交入口已關閉", true);
                    }
                    break;

                case Screen.Answering:
                    if (pnlGate.Visible)
                    {
                        pnlGate.Visible = false;
                        if (lastScreen == Screen.Waiting)
                        {
                            tabs.SelectedIndex = 0;
                            FillProblems();
                            Status("比賽開始！", false);
                            RefreshContestStateAsync();
                            // 「開啟題目」在賽前是鎖住的（就算檔案早就佈署在機器上），
                            // 這一刻要立刻解鎖，不必等使用者手動切題目才刷新
                            UpdateProblemButton();
                        }
                    }
                    TimeSpan left = Phase.Until(cfg, cfg.EndTimeUtc);
                    if (left.TotalSeconds > 0 && left.TotalMinutes < 10080)
                    {
                        lblRemain.Text = "剩餘 " + Phase.Clock(left);
                        lblRemain.ForeColor = left.TotalMinutes <= 5 ? Theme.Bad : Theme.Dim;
                        lblRemain.Visible = true;
                    }
                    else lblRemain.Visible = false;
                    break;
            }

            lastScreen = s;
        }

        // 校正後的現在時間。沒對過時鐘（還沒登入過）就講明是本機時間，
        // 否則監考會以為看到的是校正值而誤判各機一致。
        void UpdateClock()
        {
            DateTime now = Phase.NowUtc(cfg).ToLocalTime();
            bool calibrated = cfg != null && cfg.ClockOffsetMs != 0;
            string text = now.ToString("HH:mm:ss");

            lblClock.Text = calibrated ? "現在 " + text : text + " 未校正";
            lblClock.ForeColor = calibrated ? Theme.Text : Theme.Mute;
        }

        void ShowGate(string title, string clock, Color clockColor,
                      string hint, string actionText, bool showContestPicker)
        {
            pnlGate.Visible = true;
            pnlGate.BringToFront();
            lblGateTitle.Text = title;
            lblGateTitle.ForeColor = clockColor == Theme.Bad ? Theme.Bad : Theme.Text;
            lblGateClock.Text = clock;
            lblGateClock.ForeColor = clockColor;
            lblGateClock.Visible = clock.Length > 0;
            lblGateHint.Text = hint;
            btnGateAction.Visible = actionText != null;
            if (actionText != null) btnGateAction.Text = actionText;
            cboGateContest.Visible = showContestPicker;
            lblRemain.Visible = false;
        }

        // 精靈畫面上那顆大按鈕，依目前階段做不同的事
        void OnGateAction(object sender, EventArgs e)
        {
            switch (Flow.Current(cfg))
            {
                case Screen.NeedLogin:
                    OnLogin(sender, e);
                    break;
                case Screen.NeedContest:
                    try { LoadContests(); Status("已更新比賽清單", false); }
                    catch (Exception ex) { Status("取得比賽清單失敗：" + ex.Message, true); }
                    break;
                case Screen.Ended:
                    if (Store.ReadDir(Store.PendingDir).Count > 0) OnUpload(sender, e);
                    else if (!string.IsNullOrEmpty(cfg.ServerUrl))
                        OpenUrl(cfg.ServerUrl + "/submissions?mine=1&contest=" + cfg.ContestId);
                    break;
            }
        }

        // 時間外不准提交。UI 已經被遮罩擋住，這裡是第二道 —— 鍵盤快捷或
        // 程式流程萬一繞過遮罩，這裡還會攔下來。
        bool SubmissionOpen()
        {
            ContestPhase p = Phase.Of(cfg);
            return p == ContestPhase.Running || p == ContestPhase.NotReady;
        }

        // ── 分頁一：作答 ─────────────────────────────
        TabPage BuildAnswerTab()
        {
            TabPage tab = new TabPage("作答");
            tab.Padding = new Padding(16);
            tab.BackColor = Theme.Bg;

            // ── 身分列 ──────────────────────────────
            // 一進畫面就要看得出「我是誰、在哪一場比賽、有沒有設定好」。
            // 開賽前監考逐台巡檢時，這一條就是判斷依據。
            pnlIdentity = new Panel();
            pnlIdentity.Dock = DockStyle.Top;
            pnlIdentity.Height = 62;
            pnlIdentity.Padding = new Padding(14, 10, 10, 10);

            lblWho = new Label();
            lblWho.SetBounds(14, 9, 620, 22);
            lblWho.Font = Theme.Title;
            pnlIdentity.Controls.Add(lblWho);

            lblWhere = new Label();
            lblWhere.SetBounds(14, 33, 620, 18);
            lblWhere.Font = Theme.Small;
            pnlIdentity.Controls.Add(lblWhere);

            btnCheckin = Theme.Secondary("重新回報就緒");
            btnCheckin.Size = new Size(118, 30);
            btnCheckin.Click += delegate { SendCheckinAsync(true); };
            FlowLayoutPanel idBar = MakeActionBar();
            idBar.Padding = new Padding(0, 14, 12, 0);
            idBar.Controls.Add(btnCheckin);
            pnlIdentity.Controls.Add(idBar);

            Panel gap1 = new Panel();
            gap1.Dock = DockStyle.Top;
            gap1.Height = 14;
            gap1.BackColor = Theme.Bg;

            // ── 題目與來源 ──────────────────────────
            Panel head = Theme.CardPanel();
            head.Dock = DockStyle.Top;
            head.Height = 106;

            Label lp = Theme.FieldLabel("題目");
            lp.SetBounds(16, 16, 46, 26);
            head.Controls.Add(lp);

            cboProblem = Theme.Select();
            cboProblem.SetBounds(64, 15, 330, 26);
            cboProblem.SelectedIndexChanged += OnProblemChanged;
            head.Controls.Add(cboProblem);

            btnOpenProblem = Theme.Secondary("開啟題目");
            btnOpenProblem.SetBounds(404, 14, 104, 28);
            btnOpenProblem.Click += OnOpenProblem;
            head.Controls.Add(btnOpenProblem);

            lblLangHint = new Label();
            lblLangHint.SetBounds(522, 19, 300, 20);
            lblLangHint.Font = Theme.Small;
            lblLangHint.AutoSize = false;
            head.Controls.Add(lblLangHint);

            Panel sep = Theme.Divider();
            sep.SetBounds(16, 54, 800, 1);
            sep.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            head.Controls.Add(sep);

            Label ls = Theme.FieldLabel("程式碼");
            ls.SetBounds(16, 68, 46, 26);
            head.Controls.Add(ls);

            rbTyped = new RadioButton();
            rbTyped.SetBounds(64, 68, 96, 26);
            rbTyped.Text = "直接輸入";
            rbTyped.Font = Theme.Body;
            rbTyped.ForeColor = Theme.Text;
            rbTyped.Checked = true;
            rbTyped.CheckedChanged += OnSourceModeChanged;
            head.Controls.Add(rbTyped);

            rbFile = new RadioButton();
            rbFile.SetBounds(166, 68, 84, 26);
            rbFile.Text = "從檔案";
            rbFile.Font = Theme.Body;
            rbFile.ForeColor = Theme.Text;
            head.Controls.Add(rbFile);

            txtFile = Theme.Input();
            txtFile.SetBounds(254, 69, 226, 24);
            txtFile.ReadOnly = true;
            txtFile.BackColor = Theme.Inset;
            head.Controls.Add(txtFile);

            btnBrowse = Theme.Secondary("瀏覽…");
            btnBrowse.SetBounds(490, 67, 72, 28);
            btnBrowse.Click += OnBrowse;
            head.Controls.Add(btnBrowse);

            Panel gap2 = new Panel();
            gap2.Dock = DockStyle.Top;
            gap2.Height = 14;
            gap2.BackColor = Theme.Bg;

            // Dock=Top 是「後加的排在上面」，所以要照視覺順序由下往上加：
            // gap2 → head → gap1 → 身分列，畫面上才會是 身分列 / gap1 / head / gap2。
            tab.Controls.Add(gap2);
            tab.Controls.Add(head);
            tab.Controls.Add(gap1);
            tab.Controls.Add(pnlIdentity);

            // ── 動作列 ──────────────────────────────
            Panel foot = new Panel();
            foot.Dock = DockStyle.Bottom;
            foot.Height = 56;
            foot.BackColor = Theme.Bg;
            foot.Padding = new Padding(0, 12, 0, 0);

            btnTest = Theme.Secondary("測試執行");
            btnTest.Size = new Size(112, 36);
            btnTest.Click += OnTestRun;

            btnSubmit = Theme.Primary("提交");
            btnSubmit.Size = new Size(140, 36);
            btnSubmit.Click += OnSubmit;

            // 用 FlowLayoutPanel 靠右排，不要對 Panel 的子控制項用絕對座標 + Right 錨點：
            // 加入時 Panel 還沒被 dock 撐開（預設寬 200），錨點記下的右邊距會是負值，
            // 面板變寬後按鈕會被推到可視範圍外。
            FlowLayoutPanel actions = MakeActionBar();
            actions.Padding = new Padding(0, 12, 0, 0);
            actions.Controls.Add(btnSubmit); // RightToLeft：先加的在最右邊
            actions.Controls.Add(btnTest);
            foot.Controls.Add(actions);

            lblDraft = new Label();
            lblDraft.Dock = DockStyle.Fill;
            lblDraft.Font = Theme.Small;
            lblDraft.TextAlign = ContentAlignment.MiddleLeft;
            lblDraft.ForeColor = Theme.Mute;
            foot.Controls.Add(lblDraft);
            lblDraft.BringToFront();

            tab.Controls.Add(foot);

            // ── 編輯區 ──────────────────────────────
            Panel editorWrap = Theme.CardPanel();
            editorWrap.Dock = DockStyle.Fill;
            editorWrap.Padding = new Padding(1);

            txtCode = new PasteNormalizingTextBox();
            txtCode.Dock = DockStyle.Fill;
            txtCode.Multiline = true;
            txtCode.AcceptsTab = true;
            txtCode.WordWrap = false;
            txtCode.ScrollBars = ScrollBars.Both;
            txtCode.Font = Theme.Code;
            txtCode.BorderStyle = BorderStyle.None;
            txtCode.BackColor = Theme.Card;
            txtCode.ForeColor = Theme.Text;
            txtCode.TextChanged += OnCodeChanged;
            editorWrap.Controls.Add(txtCode);

            tab.Controls.Add(editorWrap);
            editorWrap.BringToFront();

            return tab;
        }

        // ── 分頁二：收件紀錄 ─────────────────────────
        TabPage BuildRecordsTab()
        {
            TabPage tab = new TabPage("收件紀錄");
            tab.Padding = new Padding(16);
            tab.BackColor = Theme.Bg;

            Panel foot = new Panel();
            foot.Dock = DockStyle.Bottom;
            foot.Height = 58;
            foot.BackColor = Theme.Bg;

            btnUpload = Theme.Primary("上傳到伺服器");
            btnUpload.Size = new Size(178, 38);
            btnUpload.Click += OnUpload;

            btnOpenSubmission = Theme.Secondary("查看判題結果");
            btnOpenSubmission.Size = new Size(124, 38);
            btnOpenSubmission.Enabled = false;
            btnOpenSubmission.Click += OnOpenSubmission;

            btnOpenBoard = Theme.Secondary("計分板");
            btnOpenBoard.Size = new Size(88, 38);
            btnOpenBoard.Click += OnOpenScoreboard;

            FlowLayoutPanel actions = MakeActionBar();
            actions.Padding = new Padding(0, 14, 0, 0);
            actions.Controls.Add(btnUpload); // RightToLeft：先加的在最右邊
            actions.Controls.Add(btnOpenSubmission);
            actions.Controls.Add(btnOpenBoard);
            foot.Controls.Add(actions);

            btnRefresh = Theme.Secondary("重新整理");
            btnRefresh.SetBounds(0, 14, 92, 38);
            btnRefresh.Click += delegate { RefreshList(); };
            foot.Controls.Add(btnRefresh);

            lblAccount = new Label();
            lblAccount.SetBounds(104, 14, 360, 38);
            lblAccount.Font = Theme.Body;
            lblAccount.TextAlign = ContentAlignment.MiddleLeft;
            foot.Controls.Add(lblAccount);

            Label hint = Theme.Hint("雙擊任一列可開啟該筆的判題結果");
            hint.Dock = DockStyle.Bottom;
            hint.Height = 24;

            // Dock=Bottom 是「後加的更靠近底邊」，所以按鈕列要最後加，
            // 提示文字才會落在清單與按鈕之間。
            tab.Controls.Add(hint);
            tab.Controls.Add(foot);

            listView = new ListView();
            listView.Dock = DockStyle.Fill;
            listView.View = View.Details;
            listView.FullRowSelect = true;
            listView.GridLines = false;
            listView.BorderStyle = BorderStyle.FixedSingle;
            listView.BackColor = Theme.Card;
            listView.ForeColor = Theme.Text;
            listView.Font = Theme.Body;
            Theme.SetRowHeight(listView, 26);
            listView.Columns.Add("題目", 60);
            listView.Columns.Add("提交時間", 160);
            listView.Columns.Add("語言", 90);
            listView.Columns.Add("來源", 220);
            listView.Columns.Add("狀態", 100);
            listView.Columns.Add("網站編號", 96);
            listView.DoubleClick += OnOpenSubmission;
            listView.SelectedIndexChanged += delegate { UpdateOpenButton(); };
            tab.Controls.Add(listView);
            listView.BringToFront();

            return tab;
        }

        // ── 分頁三：賽前設定 ─────────────────────────
        TabPage BuildSetupTab()
        {
            TabPage tab = new TabPage("賽前設定");
            tab.Padding = new Padding(16);
            tab.BackColor = Theme.Bg;

            setupPanel = new Panel();
            setupPanel.Dock = DockStyle.Fill;
            setupPanel.BackColor = Theme.Bg;

            // ── 帳號：永遠可用 ───────────────────────
            // 不能跟著鎖。選手的 session 過期後必須重新登入才能上傳，
            // 把登入一起鎖住等於讓他交不出東西。
            Panel g = Theme.CardPanel();
            g.SetBounds(0, 0, 860, 194);
            g.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            Label t1 = Theme.SectionTitle("帳號");
            t1.Location = new Point(16, 14);
            g.Controls.Add(t1);

            Label t1s = Theme.Hint("賽前登入一次即可；session 過期時可重新登入");
            t1s.SetBounds(16, 34, 500, 18);
            g.Controls.Add(t1s);

            Label l1 = Theme.FieldLabel("伺服器");
            l1.SetBounds(16, 62, 62, 26);
            g.Controls.Add(l1);

            txtServer = Theme.Input();
            txtServer.SetBounds(84, 63, 340, 24);
            txtServer.Text = "https://oj.itousouta.me";
            g.Controls.Add(txtServer);

            Label l2 = Theme.FieldLabel("目前帳號");
            l2.SetBounds(16, 96, 62, 26);
            g.Controls.Add(l2);

            txtUser = Theme.Input();
            txtUser.SetBounds(84, 97, 200, 24);
            txtUser.ReadOnly = true;
            txtUser.BackColor = Theme.Inset;
            g.Controls.Add(txtUser);

            btnLogin = Theme.Primary("用瀏覽器登入");
            btnLogin.SetBounds(298, 94, 140, 30);
            btnLogin.Click += OnLogin;
            g.Controls.Add(btnLogin);

            btnLogout = Theme.Secondary("登出");
            btnLogout.SetBounds(448, 94, 84, 30);
            btnLogout.Click += OnLogout;
            g.Controls.Add(btnLogout);

            Label loginHint = Theme.Hint(
                "會開啟瀏覽器讓你登入（帳號密碼、Google、Discord 都可以），" +
                "收件程式本身不會接觸你的密碼。");
            loginHint.SetBounds(544, 100, 300, 34);
            g.Controls.Add(loginHint);

            Panel sep1 = Theme.Divider();
            sep1.SetBounds(16, 140, 828, 1);
            sep1.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            g.Controls.Add(sep1);

            // 不用開瀏覽器也能登入：機器沒有預設瀏覽器、或選手不想離開這個
            // 視窗時可以用。帳號要先在 itouOJ 網站的「帳號設定」裡設定密碼
            // 才能用（Google/Discord 專用帳號預設沒有密碼）。
            Label lPw = Theme.FieldLabel("帳密登入");
            lPw.SetBounds(16, 156, 62, 26);
            g.Controls.Add(lPw);

            txtLoginUser = Theme.Input();
            txtLoginUser.SetBounds(84, 157, 140, 24);
            g.Controls.Add(txtLoginUser);

            txtLoginPass = Theme.Input();
            txtLoginPass.SetBounds(232, 157, 140, 24);
            txtLoginPass.UseSystemPasswordChar = true;
            txtLoginPass.KeyDown += delegate (object s, KeyEventArgs e)
            {
                if (e.KeyCode == Keys.Enter) { e.SuppressKeyPress = true; OnPasswordLogin(s, EventArgs.Empty); }
            };
            g.Controls.Add(txtLoginPass);

            btnPasswordLogin = Theme.Secondary("登入");
            btnPasswordLogin.SetBounds(380, 156, 84, 28);
            btnPasswordLogin.Click += OnPasswordLogin;
            g.Controls.Add(btnPasswordLogin);

            Label loginHint2 = Theme.Hint(
                "帳號還沒設定密碼的話，到 itouOJ 網站「帳號設定」設定一組即可。");
            loginHint2.SetBounds(480, 160, 364, 18);
            g.Controls.Add(loginHint2);

            setupPanel.Controls.Add(g);

            // ── 比賽與管理員設定：可鎖 ───────────────
            // 這兩項才是比賽中被亂改會出事的：比賽選錯，整批提交會送到別場去。
            lockableGroup = Theme.CardPanel();
            lockableGroup.SetBounds(0, 208, 860, 186);
            lockableGroup.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            Label t2 = Theme.SectionTitle("比賽與管理員設定");
            t2.Location = new Point(16, 14);
            lockableGroup.Controls.Add(t2);

            Label l3 = Theme.FieldLabel("比賽");
            l3.SetBounds(16, 46, 62, 26);
            lockableGroup.Controls.Add(l3);

            cboContest = Theme.Select();
            cboContest.SetBounds(84, 46, 340, 26);
            cboContest.SelectedIndexChanged += OnContestChanged;
            lockableGroup.Controls.Add(cboContest);

            // 刻意不受 PIN 鎖影響：重抓比賽資訊改不壞任何東西，而比賽被延長時
            // 正是鎖著的狀態下最需要它。
            btnRefreshContest = Theme.Secondary("更新比賽資訊");
            btnRefreshContest.SetBounds(436, 45, 128, 28);
            btnRefreshContest.Click += OnRefreshContest;
            lockableGroup.Controls.Add(btnRefreshContest);

            Label refreshHint = Theme.Hint(
                "監考改了比賽時間或題目後按這裡更新，不必登出重登。");
            refreshHint.SetBounds(576, 50, 400, 20);
            lockableGroup.Controls.Add(refreshHint);

            Panel sep2 = Theme.Divider();
            sep2.SetBounds(16, 86, 828, 1);
            sep2.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            lockableGroup.Controls.Add(sep2);

            btnSettings = Theme.Secondary("題目路徑與編譯器設定");
            btnSettings.SetBounds(16, 100, 172, 34);
            btnSettings.Click += OnSettings;
            lockableGroup.Controls.Add(btnSettings);

            Label hint = Theme.Hint(
                "設定題目 PDF 資料夾後，選手就能在「作答」分頁直接開啟題目。\r\n" +
                "設定存在 config.json，可複製到其他機器省去逐台設定。");
            hint.SetBounds(200, 102, 640, 36);
            lockableGroup.Controls.Add(hint);

            lblLock = new Label();
            lblLock.SetBounds(16, 146, 480, 24);
            lblLock.Font = Theme.Body;
            lblLock.ForeColor = Theme.Warn;
            lockableGroup.Controls.Add(lblLock);

            btnUnlock = Theme.Secondary("輸入 PIN 解鎖");
            btnUnlock.SetBounds(504, 143, 124, 30);
            btnUnlock.Visible = false;
            btnUnlock.Click += OnUnlock;
            lockableGroup.Controls.Add(btnUnlock);

            setupPanel.Controls.Add(lockableGroup);

            Label where = Theme.Hint("資料存放位置：" + Store.Root);
            where.SetBounds(2, 406, 860, 36);
            where.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            setupPanel.Controls.Add(where);

            tab.Controls.Add(setupPanel);

            return tab;
        }

        // 靠右的按鈕列。AutoSize + RightToLeft 讓按鈕永遠貼齊右緣，
        // 不會因為父容器尺寸變化而跑位。
        static FlowLayoutPanel MakeActionBar()
        {
            FlowLayoutPanel bar = new FlowLayoutPanel();
            bar.Dock = DockStyle.Right;
            bar.FlowDirection = FlowDirection.RightToLeft;
            bar.WrapContents = false;
            bar.AutoSize = true;
            bar.AutoSizeMode = AutoSizeMode.GrowAndShrink;
            bar.Padding = new Padding(0, 6, 0, 0);
            return bar;
        }

        static Label MakeLabel(string text, int x, int y)
        {
            Label l = new Label();
            l.Text = text;
            l.SetBounds(x, y, 60, 20);
            l.AutoSize = false;
            return l;
        }

        // ── 草稿：直接輸入模式的自動保存 ─────────────
        //
        // 選手可能在編輯區打半小時才按提交。中途當機、誤關視窗、或不小心切到
        // 別題都不能讓那些字消失，所以每次輸入後延遲 1 秒落地一次
        // （每按一個鍵就寫檔太耗，延遲合併批次寫入）。
        void OnCodeChanged(object sender, EventArgs e)
        {
            if (draftTimer == null)
            {
                draftTimer = new System.Windows.Forms.Timer();
                draftTimer.Interval = 1000;
                draftTimer.Tick += delegate
                {
                    draftTimer.Stop();
                    SaveDraft();
                };
            }
            draftTimer.Stop();
            draftTimer.Start();
            lblDraft.Text = "編輯中…";
        }

        void SaveDraft()
        {
            if (draftLabel == null || cfg.ContestId <= 0) return;
            Store.WriteDraft(cfg.ContestId, draftLabel, txtCode.Text);
            lblDraft.Text = "草稿已保存 " + DateTime.Now.ToString("HH:mm:ss");
        }

        void OnProblemChanged(object sender, EventArgs e)
        {
            // 切題前先把目前這題的草稿收好
            if (draftTimer != null) draftTimer.Stop();
            SaveDraft();

            int i = cboProblem.SelectedIndex;
            if (i < 0 || i >= cfg.Problems.Count)
            {
                draftLabel = null;
                return;
            }
            draftLabel = cfg.Problems[i].Label;
            txtCode.TextChanged -= OnCodeChanged;
            txtCode.Text = Store.ReadDraft(cfg.ContestId, draftLabel);
            txtCode.TextChanged += OnCodeChanged;
            lblDraft.Text = txtCode.TextLength > 0 ? "已載入先前的草稿" : "";
            UpdateProblemButton();
        }

        // 題目檔就算已經放在機器上（例如監考為了穩定，提前把整包題目連同
        // 收件程式一起佈署），比賽開始前也不能給選手打開——不然「先裝好」
        // 就等於「先洩題」。所以按鈕能不能按不是只看檔案存不存在，還要看
        // 現在是不是已經開賽。
        void UpdateProblemButton()
        {
            if (Flow.Current(cfg) == Screen.Waiting)
            {
                btnOpenProblem.Enabled = false;
                btnOpenProblem.Text = "比賽尚未開始";
                return;
            }
            string path = draftLabel == null ? null : ProblemDoc.Resolve(cfg, draftLabel);
            btnOpenProblem.Enabled = path != null;
            btnOpenProblem.Text = path != null ? "開啟題目" : "題目未設定";
        }

        // ── 跳到網站看結果 ───────────────────────────
        void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                Status("開啟瀏覽器失敗：" + ex.Message, true);
            }
        }

        // 目前選取那一列對應的提交編號；0 = 沒選或還沒上傳
        int SelectedSubmissionId()
        {
            if (listView.SelectedItems.Count == 0) return 0;
            object tag = listView.SelectedItems[0].Tag;
            return tag is int ? (int)tag : 0;
        }

        void UpdateOpenButton()
        {
            btnOpenSubmission.Enabled =
                SelectedSubmissionId() > 0 && !string.IsNullOrEmpty(cfg.ServerUrl);
        }

        void OnOpenSubmission(object sender, EventArgs e)
        {
            int id = SelectedSubmissionId();
            if (id <= 0)
            {
                Status("這一筆還沒上傳，上傳後才會有網站編號", true);
                return;
            }
            if (string.IsNullOrEmpty(cfg.ServerUrl))
            {
                Status("還沒設定伺服器網址", true);
                return;
            }
            OpenUrl(cfg.ServerUrl + "/submissions/" + id);
        }

        void OnOpenScoreboard(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(cfg.ServerUrl) || cfg.ContestId <= 0)
            {
                Status("還沒設定伺服器或比賽", true);
                return;
            }
            OpenUrl(cfg.ServerUrl + "/contests/" + cfg.ContestId + "/scoreboard");
        }

        void OnOpenProblem(object sender, EventArgs e)
        {
            // 按鈕理論上該擋的它都擋了，這裡再驗一次是防呆：萬一按鈕狀態
            // 沒即時更新（例如剛好卡在階段切換的瞬間），也不能真的開得了檔案。
            if (Flow.Current(cfg) == Screen.Waiting)
            {
                Status("比賽還沒開始，現在還不能看題目", true);
                return;
            }
            string path = draftLabel == null ? null : ProblemDoc.Resolve(cfg, draftLabel);
            if (path == null)
            {
                Status("這題還沒設定題目檔，請到「賽前設定」分頁的管理員設定指定", true);
                return;
            }
            try
            {
                // 有 .pass 這個 sidecar 檔代表快取存的是加密過的位元組（見
                // ProblemDoc.DownloadAndCache）——直接開只會看到亂碼，
                // 要先用同一份密碼解密到暫存檔，再開那份暫存檔。
                string passPath = path + ".pass";
                string openPath = path;
                if (File.Exists(passPath))
                {
                    string password = File.ReadAllText(passPath);
                    byte[] plain = PdfCrypto.Decrypt(File.ReadAllBytes(path), password);
                    string tempDir = Path.Combine(Path.GetTempPath(), "itouoj-open");
                    Directory.CreateDirectory(tempDir);
                    openPath = Path.Combine(tempDir, draftLabel + ".pdf");
                    File.WriteAllBytes(openPath, plain);
                }
                Process.Start(new ProcessStartInfo(openPath) { UseShellExecute = true });
                Status("已開啟 " + Path.GetFileName(path), false);
            }
            catch (Exception ex)
            {
                Status("開啟失敗：" + ex.Message, true);
            }
        }

        void OnSettings(object sender, EventArgs e)
        {
            using (SettingsDialog dlg = new SettingsDialog(cfg))
            {
                dlg.ShowDialog(this);
            }
            cfg = Store.LoadConfig();
            UpdateProblemButton();
            ApplyLockState();
            Status("設定已儲存", false);
        }

        // 只鎖「管理員設定」。登入必須永遠開著——選手的 session
        // 過期後要重新登入才能上傳，鎖住等於讓他交不出東西。
        // 比賽選擇也不鎖：選錯比賽要能自己改回來，鎖住反而卡住需要臨時換場的情況。
        void ApplyLockState()
        {
            bool locked = AdminLock.IsLocked(cfg) && !unlockedThisSession;
            btnSettings.Enabled = !locked;
            btnUnlock.Visible = locked;
            lblLock.Text = locked ? "🔒 已由監考鎖定，比賽期間不需要更動" : "";
        }

        void OnUnlock(object sender, EventArgs e)
        {
            using (PinDialog d = new PinDialog("解鎖賽前設定",
                       "請輸入監考設定的管理員 PIN。", false))
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                if (!AdminLock.Verify(cfg, d.Pin))
                {
                    MessageBox.Show(this, "PIN 不正確。", "解鎖失敗",
                        MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
                // 只在這次執行期間解開，不改動 config：關掉程式重開又是鎖著的，
                // 監考忘記重新鎖也不會整場比賽都是開的
                unlockedThisSession = true;
                ApplyLockState();
                Status("已解鎖（僅本次執行；重新開啟程式會恢復鎖定）", false);
            }
        }

        void OnSourceModeChanged(object sender, EventArgs e)
        {
            bool typed = rbTyped.Checked;
            txtCode.ReadOnly = !typed;
            txtCode.BackColor = typed ? SystemColors.Window : SystemColors.Control;
            txtFile.Enabled = !typed;
            btnBrowse.Enabled = !typed;
            if (typed && draftLabel != null)
            {
                txtCode.TextChanged -= OnCodeChanged;
                txtCode.Text = Store.ReadDraft(cfg.ContestId, draftLabel);
                txtCode.TextChanged += OnCodeChanged;
            }
        }

        // 取得目前要提交/測試的程式碼；回傳 null 表示有問題（已顯示訊息）
        string CurrentCode(out string sourceName)
        {
            sourceName = null;
            if (rbTyped.Checked)
            {
                if (txtCode.TextLength == 0)
                {
                    Status("編輯區是空的", true);
                    return null;
                }
                sourceName = (draftLabel ?? "code") + ".cpp";
                return txtCode.Text;
            }

            string path = txtFile.Text.Trim();
            if (path.Length == 0 || !File.Exists(path))
            {
                Status("請選擇要提交的程式碼檔案", true);
                return null;
            }
            try
            {
                sourceName = Path.GetFileName(path);
                // 每次都重讀檔案：選手很可能在 IDE 又改又存了好幾輪，
                // 送出的必須是磁碟上的最新版本，同時把編輯區同步成一樣的內容，
                // 免得畫面顯示的和實際送出的不一致。
                string code = File.ReadAllText(path, Encoding.UTF8);
                if (txtCode.Text != code)
                {
                    txtCode.TextChanged -= OnCodeChanged;
                    txtCode.Text = code;
                    txtCode.TextChanged += OnCodeChanged;
                }
                return code;
            }
            catch (Exception ex)
            {
                Status("讀取檔案失敗：" + ex.Message, true);
                return null;
            }
        }

        void LoadFromConfig()
        {
            if (!string.IsNullOrEmpty(cfg.ServerUrl)) txtServer.Text = cfg.ServerUrl;
            if (!string.IsNullOrEmpty(cfg.Username)) txtUser.Text = cfg.Username;

            if (cfg.ContestId > 0)
            {
                cboContest.Items.Clear();
                cboContest.Items.Add(cfg.ContestTitle + "  (#" + cfg.ContestId + ")");
                cboContest.SelectedIndex = 0;
            }
            FillProblems();
            UpdateAccountLabel();
            UpdateLanguageHint();
            OnSourceModeChanged(null, EventArgs.Empty);
            OnProblemChanged(null, EventArgs.Empty);
            ApplyLockState();
            UpdateIdentityStrip();
        }

        // 作答分頁最上方那條身分列。三種狀態要一眼分得出來：
        // 沒登入（紅）、登入了但沒選比賽（橘）、都好了（綠）。
        void UpdateIdentityStrip()
        {
            bool loggedIn = !string.IsNullOrEmpty(cfg.Username) &&
                            !string.IsNullOrEmpty(cfg.Cookie);
            bool hasContest = cfg.ContestId > 0 && cfg.Problems.Count > 0;

            if (!loggedIn)
            {
                lblWho.Text = "尚未登入";
                lblWho.ForeColor = Theme.Bad;
                lblWhere.Text = "請到「賽前設定」分頁登入，否則無法提交";
                lblWhere.ForeColor = Theme.Bad;
                pnlIdentity.BackColor = Theme.BadBg;
                return;
            }
            if (!hasContest)
            {
                lblWho.Text = cfg.Username + "　·　尚未選擇比賽";
                lblWho.ForeColor = Theme.Warn;
                lblWhere.Text = "請到「賽前設定」分頁選擇比賽";
                lblWhere.ForeColor = Theme.Warn;
                pnlIdentity.BackColor = Theme.WarnBg;
                return;
            }

            lblWho.Text = cfg.Username + "　·　" + cfg.ContestTitle;
            lblWho.ForeColor = Theme.Good;
            string drift = Math.Abs(cfg.ClockOffsetMs) >= 1000
                ? string.Format("　·　時鐘校正 {0:+0;-0} 秒", cfg.ClockOffsetMs / 1000.0)
                : "";
            string langs = cfg.AllowedLanguages.Count > 0
                ? "　·　限用 " + LanguageNames(cfg.AllowedLanguages) : "";
            lblWhere.Text = string.Format("{0} 題{1}{2}{3}",
                cfg.Problems.Count, langs, drift,
                checkedIn ? "　·　已回報就緒" : "");
            lblWhere.ForeColor = Theme.Good;
            pnlIdentity.BackColor = Theme.GoodBg;
        }

        // 向伺服器回報「這台機器準備好了」，讓監考在管理頁一眼看出哪台還沒設定。
        //
        // 三個時機都要送，缺一不可：
        //   選好比賽時 —— 首次設定
        //   程式啟動時 —— 昨天設定好、今天只是打開程式的機器，不送就永遠顯示未回報
        //   上傳成功後 —— 順便更新一次「這台還活著」
        // 失敗不影響作答，只是狀態頁上會顯示未回報。
        //
        // 走背景執行緒：啟動時同步打網路會讓視窗卡住好幾秒，機房網路慢的話更明顯。
        void SendCheckinAsync(bool announce)
        {
            if (string.IsNullOrEmpty(cfg.Cookie) || cfg.ContestId <= 0) return;
            if (string.IsNullOrEmpty(cfg.ServerUrl)) return;

            string url = cfg.ServerUrl + "/api/contests/" + cfg.ContestId + "/checkin";
            string cookie = cfg.Cookie;
            string host = Environment.MachineName;

            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                bool ok = false;
                bool registered = false;
                string error = null;
                try
                {
                    JavaScriptSerializer ser = new JavaScriptSerializer();
                    Dictionary<string, object> payload = new Dictionary<string, object>();
                    payload["host"] = host;
                    payload["clientVersion"] = UpdateCheck.ClientVersion;

                    string setCookie;
                    DateTime? serverDate;
                    string body = Api.Send(url, "POST", cookie, ser.Serialize(payload),
                                           out setCookie, out serverDate);
                    Dictionary<string, object> res =
                        ser.Deserialize<Dictionary<string, object>>(body);
                    ok = true;
                    registered = !res.ContainsKey("registered") ||
                                 Convert.ToBoolean(res["registered"]);
                }
                catch (Exception ex) { error = ex.Message; }

                try
                {
                    BeginInvoke((MethodInvoker)delegate
                    {
                        checkedIn = ok && registered;
                        if (ok && !registered)
                        {
                            Status("注意：這個帳號尚未報名此比賽，提交會被拒絕", true);
                        }
                        else if (ok && announce)
                        {
                            Status("已向伺服器回報就緒（" + host + "）", false);
                        }
                        else if (!ok && announce)
                        {
                            Status("回報就緒失敗（不影響作答）：" + error, true);
                        }
                        UpdateIdentityStrip();
                    });
                }
                catch { /* 視窗已關閉 */ }
            });
        }

        void UpdateAccountLabel()
        {
            if (string.IsNullOrEmpty(cfg.Username))
            {
                lblAccount.Text = "尚未登入";
                lblAccount.ForeColor = Color.Firebrick;
                return;
            }
            string drift = "";
            if (Math.Abs(cfg.ClockOffsetMs) >= 1000)
            {
                drift = string.Format("・時鐘校正 {0:+0;-0} 秒", cfg.ClockOffsetMs / 1000.0);
            }
            lblAccount.Text = cfg.Username + drift;
            lblAccount.ForeColor = Color.DarkGreen;
        }

        public static string ProblemItemText(string label, string title)
        {
            if (!string.IsNullOrEmpty(title)) return label + " - " + title;
            // 理論上不會發生：伺服器現在賽前就會給標題，選比賽當下就抓得到，
            // 留著這個 fallback 只是防機器帶的是升級前存下來的舊 config.json。
            return label + "（題名請見題目 PDF）";
        }

        void FillProblems()
        {
            // 保留原本選的那一題。比賽中按「更新比賽資訊」也會走到這裡，
            // 重設成第一題的話，正在寫第 C 題的人會被跳回 A 題並載入 A 的草稿。
            int keep = cboProblem.SelectedIndex;
            cboProblem.Items.Clear();

            foreach (ProblemEntry p in cfg.Problems)
                cboProblem.Items.Add(ProblemItemText(p.Label, p.Title));
            if (cboProblem.Items.Count > 0)
                cboProblem.SelectedIndex =
                    (keep >= 0 && keep < cboProblem.Items.Count) ? keep : 0;
        }

        void Status(string text, bool error)
        {
            lblStatus.Text = text;
            lblStatus.ForeColor = error ? Color.Firebrick : Color.DimGray;
            Application.DoEvents();
        }

        string BaseUrl()
        {
            string u = txtServer.Text.Trim();
            while (u.EndsWith("/")) u = u.Substring(0, u.Length - 1);
            return u;
        }

        // ── 賽前：登入 → 抓比賽清單 ────────────────
        // 瀏覽器登入：程式本身不碰密碼，也讓只有 Google/Discord、沒有密碼的帳號
        // 能夠登入收件程式（正式站上六個帳號裡有四個是這種）。
        void OnLogin(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(BaseUrl())) { Status("請先填伺服器網址", true); return; }

            int port;
            string state;
            try
            {
                port = Loopback.FindFreePort();
                state = Loopback.NewState();
            }
            catch (Exception ex)
            {
                Status("無法開啟本機連接埠：" + ex.Message, true);
                return;
            }

            string url = BaseUrl() + "/desktop-auth?port=" + port +
                         "&state=" + Uri.EscapeDataString(state);
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                Status("無法開啟瀏覽器：" + ex.Message, true);
                return;
            }

            btnLogin.Enabled = false;
            btnLogin.Text = "等待瀏覽器授權…";
            Status("已開啟瀏覽器，請在網頁上登入並按「授權」（3 分鐘內）", false);

            string baseUrl = BaseUrl();
            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                LoopbackResult r = Loopback.WaitForCallback(port, state, 180000);
                try
                {
                    BeginInvoke((MethodInvoker)delegate { OnLoginCallback(r, baseUrl); });
                }
                catch { /* 視窗已關閉 */ }
            });
        }

        // 登出。同一台機器換人用時，要確保下一位看不到也拿不走前一位的東西。
        // 清掉「這是誰、在考哪一場」。管理員設定（題目路徑、編譯器、PIN）、
        // 伺服器網址與時鐘校正值屬於這台機器而不屬於某個人，一律保留 ——
        // 否則每換一位選手就要重做一次賽前設定。
        void ClearSession()
        {
            cfg.Cookie = "";
            cfg.Username = "";
            cfg.ContestId = 0;
            cfg.ContestTitle = "";
            cfg.Problems = new List<ProblemEntry>();
            cfg.AllowedLanguages = new List<string>();
            cfg.StartTimeUtc = "";
            cfg.EndTimeUtc = "";
        }

        void OnLogout(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(cfg.Username))
            {
                Status("目前沒有登入的帳號", false);
                return;
            }

            List<SpoolItem> mine = new List<SpoolItem>();
            foreach (SpoolItem it in Store.ReadDir(Store.PendingDir))
            {
                if (string.IsNullOrEmpty(it.Owner) || it.Owner == cfg.Username)
                    mine.Add(it);
            }

            string warn = "要登出 " + cfg.Username + " 嗎？\n\n" +
                          "・尚未送出的草稿會被清除\n" +
                          "・比賽選擇會重設";
            if (mine.Count > 0)
            {
                // 提交本身保留在本機且綁著原帳號，別人登入也上傳不了；
                // 但一定要講清楚，不然選手會以為東西不見了。
                warn += "\n\n注意：你還有 " + mine.Count + " 筆提交尚未上傳。\n" +
                        "它們會保留在這台電腦上，但只有你重新登入後才能上傳。";
            }

            if (MessageBox.Show(this, warn, "確認登出",
                    MessageBoxButtons.OKCancel,
                    mine.Count > 0 ? MessageBoxIcon.Warning : MessageBoxIcon.Question)
                != DialogResult.OK) return;

            // 草稿一定要清：它按「比賽+題號」存、不綁使用者，
            // 留著等於把上一位的程式碼直接攤在下一位面前。
            if (draftTimer != null) draftTimer.Stop();
            int cleared = Store.ClearDrafts();

            ClearSession();
            Store.SaveConfig(cfg);

            checkedIn = false;
            draftLabel = null;
            txtUser.Text = "";
            txtCode.TextChanged -= OnCodeChanged;
            txtCode.Text = "";
            txtCode.TextChanged += OnCodeChanged;
            cboContest.Items.Clear();
            cboGateContest.Items.Clear();
            cboProblem.Items.Clear();
            contests.Clear();

            LoadFromConfig();
            RefreshList();
            OnPhaseTick(null, EventArgs.Empty);
            Status(string.Format("已登出（清除 {0} 份草稿）", cleared), false);
        }

        void OnLoginCallback(LoopbackResult r, string baseUrl)
        {
            btnLogin.Enabled = true;
            btnLogin.Text = "用瀏覽器登入";

            if (!r.Ok)
            {
                Status("登入未完成：" + (r.Error ?? "未知原因"), true);
                return;
            }

            cfg.ServerUrl = baseUrl;
            cfg.Cookie = "oj_session=" + r.Token;
            FinishLogin();
        }

        // 不開瀏覽器、直接帳號密碼登入：機器沒有預設瀏覽器、或不想離開這個視窗
        // 時可以用。帳號要先在 itouOJ 網站「帳號設定」裡設定密碼才能用——
        // Google/Discord 專用帳號預設沒有密碼，這是刻意的（見 /api/auth/password）。
        void OnPasswordLogin(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(BaseUrl())) { Status("請先填伺服器網址", true); return; }
            string username = txtLoginUser.Text.Trim();
            string password = txtLoginPass.Text;
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                Status("請輸入帳號與密碼", true);
                return;
            }

            btnPasswordLogin.Enabled = false;
            try
            {
                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> payload = new Dictionary<string, object>();
                payload["username"] = username;
                payload["password"] = password;

                string setCookie;
                DateTime? serverDate;
                Api.Send(BaseUrl() + "/api/auth/login", "POST", null, ser.Serialize(payload),
                         out setCookie, out serverDate);

                string sessionCookie = Api.ExtractSessionCookie(setCookie);
                if (string.IsNullOrEmpty(sessionCookie))
                {
                    Status("登入失敗：伺服器沒有回傳登入憑證", true);
                    return;
                }

                cfg.ServerUrl = BaseUrl();
                cfg.Cookie = sessionCookie;
                txtLoginPass.Text = ""; // 密碼不留在畫面上
                FinishLogin();
            }
            catch (Exception ex)
            {
                Status("登入失敗：" + ex.Message, true);
            }
            finally
            {
                btnPasswordLogin.Enabled = true;
            }
        }

        // 瀏覽器登入、帳密登入收尾都靠這個：用目前 cfg.ServerUrl / cfg.Cookie
        // 打一次 /api/me，確認憑證有效並取得帳號名稱與伺服器時間。
        void FinishLogin()
        {
            Cursor = Cursors.WaitCursor;
            try
            {
                string setCookie;
                DateTime? serverDate;
                string body = Api.Send(cfg.ServerUrl + "/api/me", "GET", cfg.Cookie, null,
                                       out setCookie, out serverDate);
                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> me =
                    ser.Deserialize<Dictionary<string, object>>(body);
                cfg.Username = Convert.ToString(me["username"]);
                if (serverDate.HasValue)
                {
                    cfg.ClockOffsetMs =
                        (long)(serverDate.Value - DateTime.UtcNow).TotalMilliseconds;
                }

                Store.SaveConfig(cfg);
                txtUser.Text = cfg.Username;
                UpdateAccountLabel();
                UpdateIdentityStrip();

                LoadContests();
                Status("已登入為 " + cfg.Username + "，請選擇比賽", false);
            }
            catch (Exception ex)
            {
                Status("登入失敗：" + ex.Message, true);
            }
            finally
            {
                Cursor = Cursors.Default;
            }
        }

        void LoadContests()
        {
            string setCookie;
            DateTime? serverDate;
            string body = Api.Send(cfg.ServerUrl + "/api/me/contests", "GET",
                                   cfg.Cookie, null, out setCookie, out serverDate);

            JavaScriptSerializer ser = new JavaScriptSerializer();
            Dictionary<string, object> root = ser.Deserialize<Dictionary<string, object>>(body);

            contests.Clear();
            cboContest.Items.Clear();
            cboGateContest.Items.Clear();
            List<int> ids = new List<int>();
            foreach (Dictionary<string, object> c in Json.Array(root["contests"]))
            {
                bool joined = Convert.ToBoolean(c["joined"]);
                int id = Convert.ToInt32(c["id"]);
                ids.Add(id);
                contests.Add(c);
                string label = string.Format("{0}  (#{1}){2}",
                    Convert.ToString(c["title"]), id, joined ? "" : "  ※尚未報名");
                cboContest.Items.Add(label);
                cboGateContest.Items.Add(label); // 精靈畫面上的選單同步
            }

            // 從網站跳轉進來時指定了比賽，登入後自動選它
            if (pendingContestId > 0 && ids.Contains(pendingContestId))
            {
                cfg.ContestId = pendingContestId;
                pendingContestId = 0;
            }

            int pick = Selection.ChooseContestIndex(ids, cfg.ContestId);
            if (pick >= 0)
            {
                cboContest.SelectedIndex = pick;
            }
            else if (cfg.ContestId > 0)
            {
                Status(string.Format(
                    "注意：伺服器清單裡找不到原本設定的比賽 #{0}，" +
                    "請確認登入的帳號是否正確；未確認前請勿更動比賽選擇。",
                    cfg.ContestId), true);
            }
        }

        void OnContestChanged(object sender, EventArgs e)
        {
            // 兩個選單（設定分頁、精靈畫面）共用這個處理常式，看是哪一個觸發的
            int i = sender == cboGateContest
                ? cboGateContest.SelectedIndex
                : cboContest.SelectedIndex;
            if (i < 0 || i >= contests.Count) return;
            if (string.IsNullOrEmpty(cfg.Cookie)) return;

            LoadContestState(Convert.ToInt32(contests[i]["id"]));
        }

        // 重新向伺服器要這場比賽的題目、起訖時間與語言限制。
        //
        // 監考臨時延長比賽、加題、改語言限制之後，選手機上的快取就過期了 ——
        // 而起訖時間正是斷網後判斷開始與結束的唯一依據。以前唯一的更新方式是
        // 登出再登入，那會連帶清掉草稿，代價太大。
        void OnRefreshContest(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(cfg.Cookie))
            {
                Status("尚未登入，無法更新比賽資訊", true);
                return;
            }
            if (cfg.ContestId <= 0)
            {
                Status("尚未選擇比賽", true);
                return;
            }
            LoadContestState(cfg.ContestId);
        }

        void LoadContestState(int contestId)
        {
            Cursor = Cursors.WaitCursor;
            try
            {
                Dictionary<string, object> root = FetchContestState(contestId);
                ApplyContestState(contestId, root);
            }
            catch (Exception ex)
            {
                Status("取得題目失敗：" + ex.Message, true);
            }
            finally
            {
                Cursor = Cursors.Default;
            }
        }

        // 純網路 + 解析，不摸任何 UI 控制項，背景執行緒也能安全呼叫。
        Dictionary<string, object> FetchContestState(int contestId)
        {
            string setCookie;
            DateTime? serverDate;
            string body = Api.Send(
                cfg.ServerUrl + "/api/contests/" + contestId + "/problems",
                "GET", cfg.Cookie, null, out setCookie, out serverDate);

            JavaScriptSerializer ser = new JavaScriptSerializer();
            return ser.Deserialize<Dictionary<string, object>>(body);
        }

        // 把抓回來的比賽資訊套用到 cfg 並更新畫面。只能在 UI 執行緒呼叫。
        void ApplyContestState(int contestId, Dictionary<string, object> root)
        {
            bool sameContest = cfg.ContestId == contestId;
            string prevStart = cfg.StartTimeUtc;
            string prevEnd = cfg.EndTimeUtc;
            int prevProblems = cfg.Problems == null ? 0 : cfg.Problems.Count;

            cfg.ContestId = contestId;
            cfg.ContestTitle = Convert.ToString(root["title"]);
            // 起訖時間要存下來：斷網後就是靠它們判斷開始與結束
            cfg.StartTimeUtc = root.ContainsKey("startTime")
                ? Convert.ToString(root["startTime"]) : "";
            cfg.EndTimeUtc = root.ContainsKey("endTime")
                ? Convert.ToString(root["endTime"]) : "";

            cfg.AllowedLanguages = new List<string>();
            if (root.ContainsKey("allowedLanguages") && root["allowedLanguages"] != null)
            {
                System.Collections.IEnumerable langs =
                    root["allowedLanguages"] as System.Collections.IEnumerable;
                if (langs != null)
                    foreach (object l in langs)
                        cfg.AllowedLanguages.Add(Convert.ToString(l));
            }

            cfg.Problems = new List<ProblemEntry>();
            foreach (Dictionary<string, object> p in Json.Array(root["problems"]))
            {
                ProblemEntry pe = new ProblemEntry();
                pe.ProblemId = Convert.ToInt32(p["problemId"]);
                pe.Label = Convert.ToString(p["label"]);
                pe.Title = p["title"] == null ? "" : Convert.ToString(p["title"]);
                if (p.ContainsKey("timeLimitMs") && p["timeLimitMs"] != null)
                    pe.TimeLimitMs = Convert.ToInt32(p["timeLimitMs"]);
                // 範例測資會一起存進 config.json，斷網時測試執行才有東西可比對
                if (p.ContainsKey("samples"))
                {
                    foreach (Dictionary<string, object> s in Json.Array(p["samples"]))
                    {
                        SampleCase sc = new SampleCase();
                        sc.Input = Convert.ToString(s["input"]);
                        sc.Output = Convert.ToString(s["output"]);
                        pe.Samples.Add(sc);
                    }
                }
                cfg.Problems.Add(pe);
            }
            Store.SaveConfig(cfg);
            FillProblems();
            UpdateLanguageHint();
            OnProblemChanged(null, EventArgs.Empty);
            // 時間可能被監考改過，畫面要立刻跟上——比賽被延長就從「已結束」變回
            // 作答中；重新打開程式時發現已經超過結束時間（或還沒到開始時間），
            // 就要回到全螢幕畫面，不能讓選手留在舊的作答畫面上。
            OnPhaseTick(null, EventArgs.Empty);

            if (sameContest)
            {
                // 更新的重點就是「到底有沒有變」，沒講清楚等於沒更新
                List<string> changes = new List<string>();
                if (prevStart != cfg.StartTimeUtc) changes.Add("開始時間");
                if (prevEnd != cfg.EndTimeUtc) changes.Add("結束時間");
                if (prevProblems != cfg.Problems.Count)
                    changes.Add("題數 " + prevProblems + " → " + cfg.Problems.Count);

                Status(changes.Count > 0
                    ? "比賽資訊已更新：" + string.Join("、", changes.ToArray())
                    : "比賽資訊已是最新，沒有變動", false);
            }
            else
            {
                string langNote = cfg.AllowedLanguages.Count > 0
                    ? "，限用 " + LanguageNames(cfg.AllowedLanguages)
                    : "";
                Status(string.Format("已載入「{0}」的 {1} 道題目{2}，可以斷網作答了",
                    cfg.ContestTitle, cfg.Problems.Count, langNote), false);
            }

            // 設定完成 = 這台機器準備好了，回報給監考
            SendCheckinAsync(false);

            // 題目文件能下載就先下載存起來（伺服器自己決定准不准，賽前又沒開
            // allowEarlyProblemDownload 就會被擋，這裡就當作那題暫時沒有文件）。
            // 背景執行，不能讓下載卡住 UI——這個方法本身也會被背景執行緒的
            // RefreshContestStateAsync 呼叫到，同步做的話會卡住整個訊息迴圈。
            DownloadProblemDocsAsync(contestId, cfg.Problems, cfg.ServerUrl, cfg.Cookie);
        }

        void DownloadProblemDocsAsync(
            int contestId, List<ProblemEntry> problems, string serverUrl, string cookie)
        {
            if (problems == null || problems.Count == 0) return;
            if (string.IsNullOrEmpty(serverUrl) || string.IsNullOrEmpty(cookie)) return;

            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                int downloaded = 0;
                foreach (ProblemEntry pe in problems)
                {
                    if (ProblemDoc.DownloadAndCache(serverUrl, cookie, contestId, pe.Label) != null)
                        downloaded++;
                }
                if (downloaded == 0) return;

                try
                {
                    BeginInvoke((MethodInvoker)delegate
                    {
                        // 下載期間使用者可能換了比賽，這批結果就不再相關
                        if (cfg.ContestId != contestId) return;
                        // 只在管理員沒手動指定過「題目路徑」時才接管，不覆蓋監考自己選的資料夾
                        if (string.IsNullOrEmpty(cfg.ProblemDir))
                        {
                            cfg.ProblemDir = ProblemDoc.CacheDir(contestId);
                            Store.SaveConfig(cfg);
                        }
                        UpdateProblemButton();
                    });
                }
                catch { /* 視窗已關閉 */ }
            });
        }

        // 重新打開程式時第一件事：背景向伺服器核對這場比賽現在的狀態。
        // 不能同步做——選手機上這時多半還沒連上網路（比賽期間機房斷網是常態），
        // 同步查會讓視窗卡住等到逾時。查得到就套用最新結果（可能因此從快取
        // 顯示的「作答中」變回全螢幕的「尚未開始」或「已結束」）；查不到就
        // 維持原本用本機快取算出來的畫面，不打擾使用者。
        void RefreshContestStateAsync()
        {
            if (string.IsNullOrEmpty(cfg.Cookie) || cfg.ContestId <= 0) return;
            if (string.IsNullOrEmpty(cfg.ServerUrl)) return;

            int contestId = cfg.ContestId;

            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                Dictionary<string, object> root = null;
                try { root = FetchContestState(contestId); }
                catch { /* 開程式當下多半還沒連網，維持本機快取即可 */ }
                if (root == null) return;

                try
                {
                    BeginInvoke((MethodInvoker)delegate
                    {
                        // 抓取期間使用者已經手動換了比賽，這筆結果就作廢
                        if (cfg.ContestId != contestId) return;
                        ApplyContestState(contestId, root);
                    });
                }
                catch { /* 視窗已關閉 */ }
            });
        }

        // ── 比賽中：選檔 → 提交到本機 ──────────────
        static readonly string[] AllLanguages =
            { "cpp", "c", "python", "java", "javascript" };

        static string ExtensionsFor(string lang)
        {
            if (lang == "cpp") return "*.cpp;*.cc;*.cxx";
            if (lang == "c") return "*.c";
            if (lang == "python") return "*.py";
            if (lang == "java") return "*.java";
            if (lang == "javascript") return "*.js";
            return "";
        }

        static string DisplayName(string lang)
        {
            if (lang == "cpp") return "C++";
            if (lang == "c") return "C";
            if (lang == "python") return "Python";
            if (lang == "java") return "Java";
            if (lang == "javascript") return "JavaScript";
            return lang;
        }

        static string LanguageNames(List<string> langs)
        {
            List<string> names = new List<string>();
            foreach (string l in langs) names.Add(DisplayName(l));
            return string.Join("、", names.ToArray());
        }

        List<string> EffectiveLanguages()
        {
            if (cfg.AllowedLanguages != null && cfg.AllowedLanguages.Count > 0)
                return cfg.AllowedLanguages;
            return new List<string>(AllLanguages);
        }

        void OnBrowse(object sender, EventArgs e)
        {
            List<string> langs = EffectiveLanguages();
            List<string> pats = new List<string>();
            foreach (string l in langs)
            {
                string ext = ExtensionsFor(l);
                if (ext.Length > 0) pats.Add(ext);
            }
            string joined = string.Join(";", pats.ToArray());

            OpenFileDialog dlg = new OpenFileDialog();
            // 比賽限定語言時，對話框就只列得出那些副檔名，減少交錯檔案的機會
            dlg.Filter = LanguageNames(langs) + " 程式碼|" + joined + "|所有檔案|*.*";
            dlg.Title = "選擇要提交的程式碼";
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            txtFile.Text = dlg.FileName;
            // 把內容載進編輯區給選手確認。不顯示的話畫面毫無變化，
            // 選手根本不知道檔案有沒有被讀到、讀到的是不是最新存檔的版本。
            try
            {
                string code = File.ReadAllText(dlg.FileName, Encoding.UTF8);
                txtCode.TextChanged -= OnCodeChanged;
                txtCode.Text = code;
                txtCode.TextChanged += OnCodeChanged;
                lblDraft.Text = string.Format("已載入 {0}（{1} 行）",
                    Path.GetFileName(dlg.FileName),
                    code.Split('\n').Length);
                Status("已載入檔案，確認內容後按「提交」", false);
            }
            catch (Exception ex)
            {
                Status("讀取檔案失敗：" + ex.Message, true);
            }
        }

        static string LanguageFromPath(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            if (ext == ".cpp" || ext == ".cc" || ext == ".cxx") return "cpp";
            if (ext == ".c") return "c";
            if (ext == ".py") return "python";
            if (ext == ".java") return "java";
            if (ext == ".js") return "javascript";
            return null;
        }

        void UpdateLanguageHint()
        {
            if (cfg.AllowedLanguages != null && cfg.AllowedLanguages.Count > 0)
            {
                lblLangHint.Text = "本比賽限用 " + LanguageNames(cfg.AllowedLanguages);
                lblLangHint.ForeColor = Color.SaddleBrown;
            }
            else
            {
                lblLangHint.Text = "";
            }
        }

        void OnTestRun(object sender, EventArgs e)
        {
            if (cfg.Problems.Count == 0)
            {
                Status("還沒設定比賽，請先在上方登入並選擇比賽", true);
                return;
            }
            int pi = cboProblem.SelectedIndex;
            if (pi < 0) { Status("請選擇題目", true); return; }

            string sourceName;
            string code = CurrentCode(out sourceName);
            if (code == null) return;
            if (!rbTyped.Checked && LanguageFromPath(txtFile.Text.Trim()) != "cpp")
            {
                Status("測試執行目前只支援 C++（.cpp）", true);
                return;
            }

            // 直接輸入的內容要先落地成檔案才能餵給編譯器
            string path;
            try
            {
                string dir = Path.Combine(Store.Root, "build");
                Directory.CreateDirectory(dir);
                path = Path.Combine(dir, "current.cpp");
                File.WriteAllText(path, code, new UTF8Encoding(false));
            }
            catch (Exception ex)
            {
                Status("準備編譯檔案失敗：" + ex.Message, true);
                return;
            }

            string compiler = string.IsNullOrEmpty(cfg.CompilerPath)
                ? Runner.FindCompiler() : cfg.CompilerPath;
            if (compiler == null || !File.Exists(compiler))
            {
                MessageBox.Show(this,
                    "找不到 g++ 編譯器。\n\n" +
                    "測試執行需要本機有 C++ 編譯器（Dev-C++、MinGW、MSYS2 等）。\n" +
                    "已檢查 PATH 以及 Dev-C++ / MinGW / MSYS2 / TDM-GCC 的常見安裝位置。\n\n" +
                    "可以到「賽前設定」分頁的管理員設定手動指定 g++.exe。\n" +
                    "沒有編譯器不影響提交與上傳，只是無法在本機先試跑。",
                    "找不到編譯器", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            using (RunDialog dlg = new RunDialog(cfg.Problems[pi], path, sourceName, compiler))
            {
                dlg.ShowDialog(this);
            }
        }

        void OnSubmit(object sender, EventArgs e)
        {
            if (cfg.ContestId <= 0 || cfg.Problems.Count == 0)
            {
                Status("還沒設定比賽，請先在上方登入並選擇比賽", true);
                return;
            }
            int pi = cboProblem.SelectedIndex;
            if (pi < 0) { Status("請選擇題目", true); return; }

            // 第二道防線：遮罩已經擋住 UI，但流程萬一繞過去，這裡還會攔下來
            if (!SubmissionOpen())
            {
                Status(Phase.Of(cfg) == ContestPhase.Waiting
                    ? "比賽尚未開始，還不能提交"
                    : "比賽已結束，提交入口已關閉", true);
                return;
            }

            string sourceName;
            string code = CurrentCode(out sourceName);
            if (code == null) return;

            // 直接輸入時沒有副檔名可判，比賽限一種語言就用它，否則預設 C++
            string lang;
            if (rbTyped.Checked)
            {
                List<string> eff = EffectiveLanguages();
                lang = eff.Count == 1 ? eff[0] : "cpp";
            }
            else
            {
                lang = LanguageFromPath(txtFile.Text.Trim());
            }
            if (lang == null)
            {
                Status("不支援的副檔名（支援 .cpp .c .py .java .js）", true);
                return;
            }
            // 伺服器也會擋，但在這裡就攔下來，選手才不會以為交成功了、賽後才發現
            if (!EffectiveLanguages().Contains(lang))
            {
                Status(string.Format("本比賽只收 {0}，這是 {1} 檔案",
                    LanguageNames(cfg.AllowedLanguages), DisplayName(lang)), true);
                return;
            }

            if (code.Trim().Length == 0) { Status("程式碼是空的", true); return; }
            if (code.Length > 65536) { Status("程式碼超過 64KB，伺服器不會收", true); return; }

            ProblemEntry pe = cfg.Problems[pi];
            // 用校正過的時間：機房時鐘不準時，原始本機時間會被伺服器夾制到比賽邊界
            DateTime stamp = DateTime.UtcNow.AddMilliseconds(cfg.ClockOffsetMs);

            SpoolItem item = new SpoolItem();
            item.ClientKey = Guid.NewGuid().ToString("N");
            item.ProblemId = pe.ProblemId;
            item.Label = pe.Label;
            item.Language = lang;
            item.Code = code;
            item.SubmittedAt = stamp.ToString("yyyy-MM-ddTHH:mm:ss.fffZ",
                                              CultureInfo.InvariantCulture);
            item.FileName = rbTyped.Checked ? "（程式內輸入）" : sourceName;
            item.Owner = cfg.Username;

            try
            {
                Store.WritePending(item);
            }
            catch (Exception ex)
            {
                Status("寫入失敗：" + ex.Message, true);
                return;
            }

            RefreshList();
            Status(string.Format("已收件：{0} 題 · {1} · 記錄時間 {2}",
                pe.Label, item.FileName, stamp.ToLocalTime().ToString("HH:mm:ss")), false);
        }

        // ── 賽後：整批上傳 ─────────────────────────
        void OnUpload(object sender, EventArgs e)
        {
            List<SpoolItem> all = Store.ReadDir(Store.PendingDir);

            // 只上傳屬於目前登入者的。同一台機器換人登入時，不能把前一位選手
            // 還沒上傳的提交當成自己的送出去 —— 那會變成冒領。
            List<SpoolItem> pending = new List<SpoolItem>();
            List<SpoolItem> others = new List<SpoolItem>();
            foreach (SpoolItem it in all)
            {
                // Owner 為空的是舊版存下來的，視為目前使用者的
                if (string.IsNullOrEmpty(it.Owner) || it.Owner == cfg.Username)
                    pending.Add(it);
                else others.Add(it);
            }

            if (others.Count > 0)
            {
                MessageBox.Show(this,
                    string.Format(
                        "有 {0} 筆提交是其他帳號（{1}）留下的，不會被上傳。\n\n" +
                        "請那位選手重新登入後自行上傳。",
                        others.Count, others[0].Owner),
                    "略過他人的提交", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }

            if (pending.Count == 0) { Status("沒有待上傳的提交", false); return; }
            if (string.IsNullOrEmpty(cfg.Cookie) || cfg.ContestId <= 0)
            {
                Status("尚未登入或未設定比賽，無法上傳", true);
                return;
            }

            DialogResult ok = MessageBox.Show(this,
                string.Format("要把 {0} 筆提交上傳到伺服器嗎？", pending.Count),
                "確認上傳", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
            if (ok != DialogResult.OK) return;

            Cursor = Cursors.WaitCursor;
            btnUpload.Enabled = false;
            int accepted = 0, dup = 0;
            try
            {
                JavaScriptSerializer ser = new JavaScriptSerializer();
                ser.MaxJsonLength = 32 * 1024 * 1024;

                // 伺服器一次最多收 100 筆
                for (int off = 0; off < pending.Count; off += 100)
                {
                    List<SpoolItem> chunk = pending.Skip(off).Take(100).ToList();
                    List<Dictionary<string, object>> subs =
                        new List<Dictionary<string, object>>();
                    foreach (SpoolItem it in chunk)
                    {
                        Dictionary<string, object> d = new Dictionary<string, object>();
                        d["clientKey"] = it.ClientKey;
                        d["problemId"] = it.ProblemId;
                        d["language"] = it.Language;
                        d["code"] = it.Code;
                        d["submittedAt"] = it.SubmittedAt;
                        subs.Add(d);
                    }
                    Dictionary<string, object> payload = new Dictionary<string, object>();
                    payload["submissions"] = subs;

                    Status(string.Format("上傳中… {0}/{1}",
                        Math.Min(off + chunk.Count, pending.Count), pending.Count), false);

                    string setCookie;
                    DateTime? serverDate;
                    string body = Api.Send(
                        cfg.ServerUrl + "/api/contests/" + cfg.ContestId + "/offline-submissions",
                        "POST", cfg.Cookie, ser.Serialize(payload), out setCookie, out serverDate);

                    Dictionary<string, object> res =
                        ser.Deserialize<Dictionary<string, object>>(body);
                    accepted += Convert.ToInt32(res["accepted"]);
                    dup += Convert.ToInt32(res["duplicates"]);

                    // 把伺服器的提交編號對回本機每一筆，之後才點得到「查看結果」
                    Dictionary<string, int> idOf = new Dictionary<string, int>();
                    if (res.ContainsKey("results"))
                    {
                        foreach (Dictionary<string, object> r in Json.Array(res["results"]))
                        {
                            string key = Convert.ToString(r["clientKey"]);
                            if (!string.IsNullOrEmpty(key))
                                idOf[key] = Convert.ToInt32(r["submissionId"]);
                        }
                    }

                    // 伺服器收下了（新收或判定重複）就標記，重傳也會被 clientKey 擋掉
                    foreach (SpoolItem it in chunk)
                    {
                        int sid;
                        if (!idOf.TryGetValue(it.ClientKey, out sid)) sid = 0;
                        Store.MarkUploaded(it.ClientKey, sid);
                    }
                }

                RefreshList();
                SendCheckinAsync(false); // 順便更新一次「這台還活著」
                string msg = string.Format("上傳完成：新收 {0} 筆", accepted);
                if (dup > 0) msg += string.Format("，已存在 {0} 筆（重複上傳會自動略過）", dup);
                Status(msg, false);
                MessageBox.Show(this, msg + "\n\n可以到網站上查看判題結果。", "完成",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                Status("上傳失敗：" + ex.Message + "（提交仍保留在本機，可稍後重試）", true);
            }
            finally
            {
                btnUpload.Enabled = true;
                Cursor = Cursors.Default;
            }
        }

        void RefreshList()
        {
            listView.Items.Clear();
            List<SpoolItem> pending = Store.ReadDir(Store.PendingDir);
            List<SpoolItem> done = Store.ReadDir(Store.UploadedDir);

            foreach (SpoolItem it in pending) AddRow(it, "待上傳", Color.DarkOrange);
            foreach (SpoolItem it in done) AddRow(it, "已上傳", Color.DarkGreen);

            btnUpload.Text = pending.Count > 0
                ? string.Format("上傳到伺服器 ({0})", pending.Count)
                : "上傳到伺服器";
            if (pending.Count == 0) btnUpload.BackColor = Theme.Btn; // 清掉提示色
            UpdateOpenButton();
        }

        void AddRow(SpoolItem it, string state, Color color)
        {
            string shown = it.SubmittedAt;
            DateTime t;
            if (DateTime.TryParse(it.SubmittedAt, CultureInfo.InvariantCulture,
                    DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out t))
            {
                shown = t.ToLocalTime().ToString("MM/dd HH:mm:ss");
            }
            ListViewItem row = new ListViewItem(it.Label);
            row.SubItems.Add(shown);
            row.SubItems.Add(it.Language);
            row.SubItems.Add(it.FileName);
            row.SubItems.Add(state);
            row.SubItems.Add(it.SubmissionId > 0 ? "#" + it.SubmissionId : "—");
            row.Tag = it.SubmissionId; // 雙擊時用來組網址
            row.ForeColor = color;
            listView.Items.Add(row);
        }

        [STAThread]
        static void Main(string[] args)
        {
            Api.InitTls();
            // 開程式前先查有沒有新版：有的話直接背景下載換掉、重開新版，
            // 這個行程就結束在這裡，不用再往下開 MainForm（不然新舊兩個視窗
            // 會同時跑）。查不到新版、沒有網路、下載失敗都會直接回傳 false，
            // 照舊往下開目前這一份，版本檢查不能變成「開不了程式」。
            if (UpdateCheck.CheckAndSelfUpdate(args)) return;

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm(args.Length > 0 ? args[0] : null));
        }
    }
}
