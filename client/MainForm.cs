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
    public class MainForm : Form
    {
        Config cfg;

        TabControl tabs;
        TextBox txtServer, txtUser, txtFile, txtCode;
        RadioButton rbTyped, rbFile;
        ComboBox cboContest, cboProblem;
        Button btnLogin, btnBrowse, btnTest, btnSubmit, btnUpload, btnRefresh,
               btnOpenProblem, btnOpenSubmission, btnOpenBoard;
        ListView listView;
        Label lblStatus, lblAccount, lblLangHint, lblDraft, lblLock, lblWho, lblWhere;
        Panel setupPanel, pnlIdentity;
        GroupBox lockableGroup;
        Button btnSettings, btnUnlock, btnCheckin;
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

        public MainForm()
        {
            Store.EnsureDirs();
            cfg = Store.LoadConfig();
            BuildUi();
            LoadFromConfig();
            RefreshList();

            // 網路一回來就主動提示。沒有這層的話，沒聽到監考宣布的選手可能
            // 就這樣關掉程式離場，提交永遠留在本機。
            netTimer = new System.Windows.Forms.Timer();
            netTimer.Interval = 15000;
            netTimer.Tick += OnNetTick;
            netTimer.Start();

            // 啟動就回報一次。監考巡檢時只會「打開程式看一眼」，如果只在選比賽時
            // 才回報，昨天設定好的機器今天永遠顯示未回報，這個功能就沒用了。
            SendCheckinAsync(false);
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            // 關視窗前一定要把還沒落地的草稿寫掉，否則最後一秒打的字會消失
            if (draftTimer != null) draftTimer.Stop();
            SaveDraft();
            base.OnFormClosing(e);
        }

        void OnNetTick(object sender, EventArgs e)
        {
            if (probing) return;
            if (string.IsNullOrEmpty(cfg.ServerUrl)) return;
            if (Store.ReadDir(Store.PendingDir).Count == 0) return;

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
            if (online == lastOnline) return;
            lastOnline = online;
            if (!online) return;

            int pending = Store.ReadDir(Store.PendingDir).Count;
            if (pending == 0) return;

            btnUpload.BackColor = Color.FromArgb(0xFF, 0xE0, 0x80);
            Status(string.Format(
                "偵測到網路已恢復，有 {0} 筆提交還沒上傳 —— 請按右下角「上傳到伺服器」",
                pending), false);
        }

        void BuildUi()
        {
            Text = "itouOJ 收件程式";
            Size = new Size(900, 720);
            MinimumSize = new Size(760, 600);
            Font = new Font("Microsoft JhengHei UI", 9F);
            StartPosition = FormStartPosition.CenterScreen;

            tabs = new TabControl();
            tabs.Dock = DockStyle.Fill;
            tabs.Padding = new Point(14, 6);

            tabs.TabPages.Add(BuildAnswerTab());
            tabs.TabPages.Add(BuildRecordsTab());
            tabs.TabPages.Add(BuildSetupTab());
            Controls.Add(tabs);

            // 狀態列固定在底部，切換分頁時訊息不會消失
            Panel bottom = new Panel();
            bottom.Dock = DockStyle.Bottom;
            bottom.Height = 30;
            lblStatus = new Label();
            lblStatus.Dock = DockStyle.Fill;
            lblStatus.TextAlign = ContentAlignment.MiddleLeft;
            lblStatus.Padding = new Padding(10, 0, 10, 0);
            bottom.Controls.Add(lblStatus);
            Controls.Add(bottom);
        }

        // ── 分頁一：作答 ─────────────────────────────
        TabPage BuildAnswerTab()
        {
            TabPage tab = new TabPage("作答");
            tab.Padding = new Padding(10);
            tab.BackColor = SystemColors.Control;

            // 一進畫面就要看得出「我是誰、在哪一場比賽、有沒有設定好」。
            // 開賽前監考逐台巡檢時，這一條就是判斷依據。
            pnlIdentity = new Panel();
            pnlIdentity.Dock = DockStyle.Top;
            pnlIdentity.Height = 46;
            pnlIdentity.BackColor = Color.FromArgb(0xF3, 0xF3, 0xF3);

            lblWho = new Label();
            lblWho.SetBounds(10, 5, 640, 20);
            lblWho.Font = new Font("Microsoft JhengHei UI", 10F, FontStyle.Bold);
            pnlIdentity.Controls.Add(lblWho);

            lblWhere = new Label();
            lblWhere.SetBounds(10, 24, 640, 18);
            lblWhere.ForeColor = Color.DimGray;
            pnlIdentity.Controls.Add(lblWhere);

            // 監考巡檢時可以按這顆強制重送，不必重新選一次比賽
            btnCheckin = new Button();
            btnCheckin.Size = new Size(110, 28);
            btnCheckin.Text = "重新回報就緒";
            btnCheckin.Click += delegate { SendCheckinAsync(true); };
            FlowLayoutPanel idBar = MakeActionBar();
            idBar.Padding = new Padding(0, 8, 4, 0);
            idBar.Controls.Add(btnCheckin);
            pnlIdentity.Controls.Add(idBar);

            tab.Controls.Add(pnlIdentity);

            Panel head = new Panel();
            head.Dock = DockStyle.Top;
            head.Height = 76;

            head.Controls.Add(MakeLabel("題目", 2, 8));
            cboProblem = new ComboBox();
            cboProblem.SetBounds(56, 5, 300, 23);
            cboProblem.DropDownStyle = ComboBoxStyle.DropDownList;
            cboProblem.SelectedIndexChanged += OnProblemChanged;
            head.Controls.Add(cboProblem);

            btnOpenProblem = new Button();
            btnOpenProblem.SetBounds(366, 4, 110, 26);
            btnOpenProblem.Text = "開啟題目";
            btnOpenProblem.Click += OnOpenProblem;
            head.Controls.Add(btnOpenProblem);

            lblLangHint = new Label();
            lblLangHint.SetBounds(490, 8, 300, 20);
            lblLangHint.AutoSize = false;
            head.Controls.Add(lblLangHint);

            rbTyped = new RadioButton();
            rbTyped.SetBounds(56, 40, 110, 24);
            rbTyped.Text = "直接輸入";
            rbTyped.Checked = true;
            rbTyped.CheckedChanged += OnSourceModeChanged;
            head.Controls.Add(rbTyped);

            rbFile = new RadioButton();
            rbFile.SetBounds(172, 40, 90, 24);
            rbFile.Text = "從檔案";
            head.Controls.Add(rbFile);

            txtFile = new TextBox();
            txtFile.SetBounds(266, 41, 210, 23);
            txtFile.ReadOnly = true;
            head.Controls.Add(txtFile);

            btnBrowse = new Button();
            btnBrowse.SetBounds(486, 40, 70, 25);
            btnBrowse.Text = "瀏覽…";
            btnBrowse.Click += OnBrowse;
            head.Controls.Add(btnBrowse);

            tab.Controls.Add(head);

            Panel foot = new Panel();
            foot.Dock = DockStyle.Bottom;
            foot.Height = 46;

            btnTest = new Button();
            btnTest.Size = new Size(110, 32);
            btnTest.Text = "測試執行";
            btnTest.Click += OnTestRun;

            btnSubmit = new Button();
            btnSubmit.Size = new Size(130, 32);
            btnSubmit.Text = "提  交";
            btnSubmit.Font = new Font(Font, FontStyle.Bold);
            btnSubmit.Click += OnSubmit;

            // 用 FlowLayoutPanel 靠右排，不要對 Panel 的子控制項用絕對座標 + Right 錨點：
            // 加入時 Panel 還沒被 dock 撐開（預設寬 200），錨點記下的右邊距會是負值，
            // 面板變寬後按鈕會被推到可視範圍外。
            FlowLayoutPanel actions = MakeActionBar();
            actions.Controls.Add(btnSubmit); // RightToLeft：先加的在最右邊
            actions.Controls.Add(btnTest);
            foot.Controls.Add(actions);

            lblDraft = new Label();
            lblDraft.Dock = DockStyle.Fill;
            lblDraft.TextAlign = ContentAlignment.MiddleLeft;
            lblDraft.ForeColor = Color.Gray;
            foot.Controls.Add(lblDraft);
            lblDraft.BringToFront();

            tab.Controls.Add(foot);

            txtCode = new TextBox();
            txtCode.Dock = DockStyle.Fill;
            txtCode.Multiline = true;
            txtCode.AcceptsTab = true;
            txtCode.WordWrap = false;
            txtCode.ScrollBars = ScrollBars.Both;
            txtCode.Font = new Font("Consolas", 11F);
            txtCode.TextChanged += OnCodeChanged;
            tab.Controls.Add(txtCode);
            txtCode.BringToFront();

            return tab;
        }

        // ── 分頁二：收件紀錄 ─────────────────────────
        TabPage BuildRecordsTab()
        {
            TabPage tab = new TabPage("收件紀錄");
            tab.Padding = new Padding(10);
            tab.BackColor = SystemColors.Control;

            Panel foot = new Panel();
            foot.Dock = DockStyle.Bottom;
            foot.Height = 46;

            btnUpload = new Button();
            btnUpload.Size = new Size(200, 36);
            btnUpload.Text = "上傳到伺服器";
            btnUpload.Font = new Font(Font, FontStyle.Bold);
            btnUpload.Click += OnUpload;

            btnOpenSubmission = new Button();
            btnOpenSubmission.Size = new Size(130, 32);
            btnOpenSubmission.Text = "查看判題結果";
            btnOpenSubmission.Enabled = false;
            btnOpenSubmission.Click += OnOpenSubmission;

            btnOpenBoard = new Button();
            btnOpenBoard.Size = new Size(100, 32);
            btnOpenBoard.Text = "計分板";
            btnOpenBoard.Click += OnOpenScoreboard;

            FlowLayoutPanel actions = MakeActionBar();
            actions.Controls.Add(btnUpload); // RightToLeft：先加的在最右邊
            actions.Controls.Add(btnOpenSubmission);
            actions.Controls.Add(btnOpenBoard);
            foot.Controls.Add(actions);

            btnRefresh = new Button();
            btnRefresh.Size = new Size(90, 32);
            btnRefresh.Text = "重新整理";
            btnRefresh.Dock = DockStyle.Left;
            btnRefresh.Click += delegate { RefreshList(); };
            foot.Controls.Add(btnRefresh);

            lblAccount = new Label();
            lblAccount.Dock = DockStyle.Fill;
            lblAccount.TextAlign = ContentAlignment.MiddleLeft;
            lblAccount.Padding = new Padding(12, 0, 0, 0);
            foot.Controls.Add(lblAccount);
            lblAccount.BringToFront();

            tab.Controls.Add(foot);

            listView = new ListView();
            listView.Dock = DockStyle.Fill;
            listView.View = View.Details;
            listView.FullRowSelect = true;
            listView.GridLines = true;
            listView.Columns.Add("題目", 60);
            listView.Columns.Add("提交時間", 150);
            listView.Columns.Add("語言", 80);
            listView.Columns.Add("來源", 200);
            listView.Columns.Add("狀態", 100);
            listView.Columns.Add("網站編號", 90);
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
            tab.Padding = new Padding(10);
            tab.BackColor = SystemColors.Control;

            setupPanel = new Panel();
            setupPanel.Dock = DockStyle.Fill;

            // ── 帳號：永遠可用 ───────────────────────
            // 不能跟著鎖。選手的 session 過期（JWT 七天）後必須重新登入才能上傳，
            // 把登入一起鎖住等於讓他交不出東西。
            GroupBox g = new GroupBox();
            g.Text = "帳號（賽前登入一次；session 過期時可重新登入）";
            g.SetBounds(12, 12, 820, 116);
            g.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            g.Controls.Add(MakeLabel("伺服器", 14, 30));
            txtServer = new TextBox();
            txtServer.SetBounds(76, 27, 340, 23);
            txtServer.Text = "https://oj.itousouta.me";
            g.Controls.Add(txtServer);

            g.Controls.Add(MakeLabel("目前帳號", 14, 62));
            txtUser = new TextBox();
            txtUser.SetBounds(90, 59, 200, 23);
            txtUser.ReadOnly = true;
            txtUser.BackColor = SystemColors.Control;
            g.Controls.Add(txtUser);

            btnLogin = new Button();
            btnLogin.SetBounds(304, 57, 140, 28);
            btnLogin.Text = "用瀏覽器登入";
            btnLogin.Click += OnLogin;
            g.Controls.Add(btnLogin);

            Label loginHint = new Label();
            loginHint.SetBounds(14, 90, 780, 20);
            loginHint.Text = "會開啟瀏覽器讓你登入（帳號密碼、Google、Discord 都可以），" +
                             "收件程式本身不會接觸你的密碼。";
            loginHint.ForeColor = Color.Gray;
            g.Controls.Add(loginHint);

            setupPanel.Controls.Add(g);

            // ── 比賽與管理員設定：可鎖 ───────────────
            // 這兩項才是比賽中被亂改會出事的：比賽選錯，整批提交會送到別場去。
            lockableGroup = new GroupBox();
            lockableGroup.Text = "比賽與管理員設定";
            lockableGroup.SetBounds(12, 132, 820, 150);
            lockableGroup.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            lockableGroup.Controls.Add(MakeLabel("比賽", 14, 32));
            cboContest = new ComboBox();
            cboContest.SetBounds(76, 29, 340, 23);
            cboContest.DropDownStyle = ComboBoxStyle.DropDownList;
            cboContest.SelectedIndexChanged += OnContestChanged;
            lockableGroup.Controls.Add(cboContest);

            btnSettings = new Button();
            btnSettings.SetBounds(14, 66, 170, 34);
            btnSettings.Text = "題目路徑與編譯器設定";
            btnSettings.Click += OnSettings;
            lockableGroup.Controls.Add(btnSettings);

            Label hint = new Label();
            hint.SetBounds(200, 62, 600, 44);
            hint.Text = "設定題目 PDF 資料夾後，選手就能在「作答」分頁直接開啟題目。\n" +
                        "設定存在 config.json，可複製到其他機器省去逐台設定。";
            hint.ForeColor = Color.Gray;
            lockableGroup.Controls.Add(hint);

            lblLock = new Label();
            lblLock.SetBounds(14, 110, 500, 24);
            lblLock.ForeColor = Color.SaddleBrown;
            lockableGroup.Controls.Add(lblLock);

            btnUnlock = new Button();
            btnUnlock.SetBounds(520, 106, 130, 28);
            btnUnlock.Text = "輸入 PIN 解鎖";
            btnUnlock.Visible = false;
            btnUnlock.Click += OnUnlock;
            lockableGroup.Controls.Add(btnUnlock);

            setupPanel.Controls.Add(lockableGroup);

            Label where = new Label();
            where.SetBounds(14, 296, 820, 40);
            where.Text = "資料存放位置：" + Store.Root;
            where.ForeColor = Color.Gray;
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

        void UpdateProblemButton()
        {
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
            string path = draftLabel == null ? null : ProblemDoc.Resolve(cfg, draftLabel);
            if (path == null)
            {
                Status("這題還沒設定題目檔，請到「賽前設定」分頁的管理員設定指定", true);
                return;
            }
            try
            {
                Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
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

        // 只鎖「比賽選擇」和「管理員設定」。登入必須永遠開著——選手的 session
        // 過期後要重新登入才能上傳，鎖住等於讓他交不出東西。
        void ApplyLockState()
        {
            bool locked = AdminLock.IsLocked(cfg) && !unlockedThisSession;
            cboContest.Enabled = !locked;
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
                lblWho.Text = "⚠ 尚未登入";
                lblWho.ForeColor = Color.Firebrick;
                lblWhere.Text = "請到「賽前設定」分頁登入，否則無法提交";
                pnlIdentity.BackColor = Color.FromArgb(0xFD, 0xEC, 0xEA);
                return;
            }
            if (!hasContest)
            {
                lblWho.Text = "⚠ " + cfg.Username + "　尚未選擇比賽";
                lblWho.ForeColor = Color.SaddleBrown;
                lblWhere.Text = "請到「賽前設定」分頁選擇比賽";
                pnlIdentity.BackColor = Color.FromArgb(0xFF, 0xF6, 0xE0);
                return;
            }

            lblWho.Text = "✓ " + cfg.Username + "　" + cfg.ContestTitle;
            lblWho.ForeColor = Color.FromArgb(0x1B, 0x5E, 0x20);
            string drift = Math.Abs(cfg.ClockOffsetMs) >= 1000
                ? string.Format("・時鐘校正 {0:+0;-0} 秒", cfg.ClockOffsetMs / 1000.0)
                : "";
            string langs = cfg.AllowedLanguages.Count > 0
                ? "・限用 " + LanguageNames(cfg.AllowedLanguages) : "";
            lblWhere.Text = string.Format("{0} 題{1}{2}{3}",
                cfg.Problems.Count, langs, drift,
                checkedIn ? "・已回報就緒" : "");
            pnlIdentity.BackColor = Color.FromArgb(0xE8, 0xF5, 0xE9);
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

        void FillProblems()
        {
            cboProblem.Items.Clear();
            foreach (ProblemEntry p in cfg.Problems)
            {
                string t = string.IsNullOrEmpty(p.Title) ? "" : " - " + p.Title;
                cboProblem.Items.Add(p.Label + t);
            }
            if (cboProblem.Items.Count > 0) cboProblem.SelectedIndex = 0;
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

        void OnLoginCallback(LoopbackResult r, string baseUrl)
        {
            btnLogin.Enabled = true;
            btnLogin.Text = "用瀏覽器登入";

            if (!r.Ok)
            {
                Status("登入未完成：" + (r.Error ?? "未知原因"), true);
                return;
            }

            Cursor = Cursors.WaitCursor;
            try
            {
                cfg.ServerUrl = baseUrl;
                cfg.Cookie = "oj_session=" + r.Token;

                // 用 token 打一次 API，確認它有效並取得自己的帳號名稱與伺服器時間
                string setCookie;
                DateTime? serverDate;
                string body = Api.Send(baseUrl + "/api/me", "GET", cfg.Cookie, null,
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
            List<int> ids = new List<int>();
            foreach (Dictionary<string, object> c in Json.Array(root["contests"]))
            {
                bool joined = Convert.ToBoolean(c["joined"]);
                int id = Convert.ToInt32(c["id"]);
                ids.Add(id);
                contests.Add(c);
                cboContest.Items.Add(string.Format("{0}  (#{1}){2}",
                    Convert.ToString(c["title"]), id, joined ? "" : "  ※尚未報名"));
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
            int i = cboContest.SelectedIndex;
            if (i < 0 || i >= contests.Count) return;
            if (string.IsNullOrEmpty(cfg.Cookie)) return;

            Cursor = Cursors.WaitCursor;
            try
            {
                int contestId = Convert.ToInt32(contests[i]["id"]);
                string setCookie;
                DateTime? serverDate;
                string body = Api.Send(
                    cfg.ServerUrl + "/api/contests/" + contestId + "/problems",
                    "GET", cfg.Cookie, null, out setCookie, out serverDate);

                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> root =
                    ser.Deserialize<Dictionary<string, object>>(body);

                cfg.ContestId = contestId;
                cfg.ContestTitle = Convert.ToString(root["title"]);

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
                string langNote = cfg.AllowedLanguages.Count > 0
                    ? "，限用 " + LanguageNames(cfg.AllowedLanguages)
                    : "";
                Status(string.Format("已載入「{0}」的 {1} 道題目{2}，可以斷網作答了",
                    cfg.ContestTitle, cfg.Problems.Count, langNote), false);

                // 設定完成 = 這台機器準備好了，回報給監考
                SendCheckinAsync(false);
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
            List<SpoolItem> pending = Store.ReadDir(Store.PendingDir);
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
            if (pending.Count == 0) btnUpload.UseVisualStyleBackColor = true; // 清掉提示色
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
        static void Main()
        {
            Api.InitTls();
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
