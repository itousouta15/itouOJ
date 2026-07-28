// itouOJ 斷網比賽收件程式
//
// 比賽期間選手機沒有網路，這支程式只把程式碼存在本機 spool；等重新連網後
// 一次送到伺服器的 /api/contests/{id}/offline-submissions 由 judge 補判。
//
// 刻意用 Windows 內建的 .NET Framework 編譯器（csc.exe）建置：產出的 exe 只有
// 幾十 KB，而 .NET Framework 4.x 是 Windows 10/11 內建的，選手機不用裝任何東西。
// 代價是只能用 C# 5 語法——不要用字串內插、?. 或運算式主體成員，csc 會編不過。
//
// 建置：client\build.ps1

using System;
using System.Collections.Generic;
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
    public class Config
    {
        public string ServerUrl { get; set; }
        public string Cookie { get; set; }
        public string Username { get; set; }
        public int ContestId { get; set; }
        public string ContestTitle { get; set; }
        // 伺服器時間減去本機時間。機房電腦時鐘不準是常態，提交時間要用
        // 校正後的值，否則整批都會被伺服器夾制到比賽邊界。
        public long ClockOffsetMs { get; set; }
        public List<ProblemEntry> Problems { get; set; }
        // 比賽限定的語言 key（例如只有 "cpp"）。空清單 = 不限制。
        public List<string> AllowedLanguages { get; set; }

        public Config()
        {
            ServerUrl = "";
            Cookie = "";
            Username = "";
            ContestId = 0;
            ContestTitle = "";
            ClockOffsetMs = 0;
            Problems = new List<ProblemEntry>();
            AllowedLanguages = new List<string>();
        }
    }

    public class ProblemEntry
    {
        public int ProblemId { get; set; }
        public string Label { get; set; }
        public string Title { get; set; }
    }

    public class SpoolItem
    {
        public string ClientKey { get; set; }
        public int ProblemId { get; set; }
        public string Label { get; set; }
        public string Language { get; set; }
        public string Code { get; set; }
        public string SubmittedAt { get; set; } // ISO 8601 UTC
        public string FileName { get; set; }
    }

    public static class Store
    {
        // 預設放在 %LOCALAPPDATA%\itouOJ。設 ITOUOJ_HOME 可以改到別的位置——
        // 監考想把 spool 放隨身碟、或自動化測試不想污染真實資料時用得到。
        public static string Root
        {
            get
            {
                string custom = Environment.GetEnvironmentVariable("ITOUOJ_HOME");
                if (!string.IsNullOrEmpty(custom)) return custom;
                return Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "itouOJ");
            }
        }

        public static string PendingDir { get { return Path.Combine(Root, "pending"); } }
        public static string UploadedDir { get { return Path.Combine(Root, "uploaded"); } }
        public static string ConfigPath { get { return Path.Combine(Root, "config.json"); } }

        public static void EnsureDirs()
        {
            Directory.CreateDirectory(Root);
            Directory.CreateDirectory(PendingDir);
            Directory.CreateDirectory(UploadedDir);
        }

        public static Config LoadConfig()
        {
            try
            {
                if (!File.Exists(ConfigPath)) return new Config();
                string json = File.ReadAllText(ConfigPath, Encoding.UTF8);
                Config c = new JavaScriptSerializer().Deserialize<Config>(json);
                if (c == null) return new Config();
                if (c.Problems == null) c.Problems = new List<ProblemEntry>();
                if (c.AllowedLanguages == null) c.AllowedLanguages = new List<string>();
                return c;
            }
            catch
            {
                return new Config();
            }
        }

        public static void SaveConfig(Config c)
        {
            EnsureDirs();
            JavaScriptSerializer ser = new JavaScriptSerializer();
            File.WriteAllText(ConfigPath, ser.Serialize(c), new UTF8Encoding(false));
        }

        // 一筆提交一個檔：整批寫在同一個 manifest 的話，寫到一半當掉會整包壞掉
        public static void WritePending(SpoolItem item)
        {
            EnsureDirs();
            JavaScriptSerializer ser = new JavaScriptSerializer();
            ser.MaxJsonLength = 32 * 1024 * 1024;
            string path = Path.Combine(PendingDir, item.ClientKey + ".json");
            File.WriteAllText(path, ser.Serialize(item), new UTF8Encoding(false));
        }

        public static List<SpoolItem> ReadDir(string dir)
        {
            List<SpoolItem> list = new List<SpoolItem>();
            if (!Directory.Exists(dir)) return list;
            JavaScriptSerializer ser = new JavaScriptSerializer();
            ser.MaxJsonLength = 32 * 1024 * 1024;
            foreach (string f in Directory.GetFiles(dir, "*.json"))
            {
                try
                {
                    SpoolItem item = ser.Deserialize<SpoolItem>(File.ReadAllText(f, Encoding.UTF8));
                    if (item != null) list.Add(item);
                }
                catch { /* 壞掉的單一檔案不該讓整個清單消失 */ }
            }
            return list.OrderBy(x => x.SubmittedAt).ToList();
        }

        public static void MarkUploaded(string clientKey)
        {
            string from = Path.Combine(PendingDir, clientKey + ".json");
            string to = Path.Combine(UploadedDir, clientKey + ".json");
            try
            {
                if (File.Exists(from))
                {
                    if (File.Exists(to)) File.Delete(to);
                    File.Move(from, to);
                }
            }
            catch { /* 搬失敗頂多下次重傳，伺服器會用 clientKey 去重 */ }
        }
    }

    public static class Selection
    {
        // 重新登入抓回比賽清單後，該把下拉選單停在第幾筆。
        //
        //   已設定過比賽且清單裡有 -> 停在那一筆
        //   已設定過比賽但清單裡沒有 -> 回 -1，代表「不要動選擇」。無腦選第 0 筆的話，
        //     賽後為了換發過期 session 而重新登入的選手會被切到清單最上面那場
        //     （API 依 startTime 倒序），整包提交就送錯比賽。
        //   還沒設定過 -> 有東西就選第一筆
        public static int ChooseContestIndex(List<int> ids, int currentContestId)
        {
            if (currentContestId > 0) return ids.IndexOf(currentContestId);
            return ids.Count > 0 ? 0 : -1;
        }
    }

    public static class Json
    {
        // JavaScriptSerializer 把 JSON 陣列還原成 ArrayList（不是 object[]），
        // 直接轉型會丟 InvalidCastException。統一走這裡。
        public static List<Dictionary<string, object>> Array(object value)
        {
            List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
            System.Collections.IEnumerable seq = value as System.Collections.IEnumerable;
            if (seq == null) return list;
            foreach (object item in seq)
            {
                Dictionary<string, object> d = item as Dictionary<string, object>;
                if (d != null) list.Add(d);
            }
            return list;
        }
    }

    public static class Api
    {
        public static void InitTls()
        {
            try
            {
                // .NET Framework 舊版預設只開 TLS 1.0，會連不上現代 HTTPS 伺服器。
                // 用數值而非具名列舉，編譯期不依賴較新的 framework 參照。
                ServicePointManager.SecurityProtocol =
                    (SecurityProtocolType)3072 | (SecurityProtocolType)768;
            }
            catch { }
        }

        static HttpWebRequest Build(string url, string method, string cookie)
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
            req.Method = method;
            req.Timeout = 20000;
            req.ReadWriteTimeout = 60000;
            req.UserAgent = "itouOJ-OfflineSubmit/1.0";
            req.Accept = "application/json";
            if (!string.IsNullOrEmpty(cookie)) req.Headers["Cookie"] = cookie;
            return req;
        }

        // 回傳 body，並把回應的 Date 標頭（伺服器時間）交出去給時鐘校正用
        public static string Send(string url, string method, string cookie, string body,
                                  out string setCookie, out DateTime? serverDate)
        {
            setCookie = null;
            serverDate = null;
            HttpWebRequest req = Build(url, method, cookie);
            if (body != null)
            {
                req.ContentType = "application/json";
                byte[] data = Encoding.UTF8.GetBytes(body);
                req.ContentLength = data.Length;
                using (Stream s = req.GetRequestStream()) s.Write(data, 0, data.Length);
            }

            HttpWebResponse resp = null;
            try
            {
                resp = (HttpWebResponse)req.GetResponse();
            }
            catch (WebException ex)
            {
                resp = ex.Response as HttpWebResponse;
                if (resp == null) throw;
            }

            using (resp)
            {
                string raw = resp.Headers["Date"];
                if (!string.IsNullOrEmpty(raw))
                {
                    DateTime parsed;
                    if (DateTime.TryParseExact(raw, "r", CultureInfo.InvariantCulture,
                            DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal,
                            out parsed))
                    {
                        serverDate = parsed;
                    }
                }
                string sc = resp.Headers["Set-Cookie"];
                if (!string.IsNullOrEmpty(sc)) setCookie = sc;

                using (StreamReader sr = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                {
                    string text = sr.ReadToEnd();
                    if ((int)resp.StatusCode >= 400)
                    {
                        throw new ApplicationException(ExtractError(text, (int)resp.StatusCode));
                    }
                    return text;
                }
            }
        }

        static string ExtractError(string body, int status)
        {
            try
            {
                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> d =
                    ser.Deserialize<Dictionary<string, object>>(body);
                if (d != null && d.ContainsKey("error") && d["error"] != null)
                    return Convert.ToString(d["error"]);
            }
            catch { }
            return "伺服器回應 HTTP " + status;
        }

        public static string ExtractSessionCookie(string setCookieHeader)
        {
            if (string.IsNullOrEmpty(setCookieHeader)) return null;
            foreach (string part in setCookieHeader.Split(','))
            {
                int i = part.IndexOf("oj_session=", StringComparison.OrdinalIgnoreCase);
                if (i < 0) continue;
                string frag = part.Substring(i);
                int semi = frag.IndexOf(';');
                if (semi >= 0) frag = frag.Substring(0, semi);
                return frag.Trim();
            }
            return null;
        }
    }

    public class MainForm : Form
    {
        Config cfg;

        TextBox txtServer, txtUser, txtPass, txtFile;
        ComboBox cboContest, cboProblem;
        Button btnLogin, btnBrowse, btnSubmit, btnUpload, btnRefresh;
        ListView listView;
        Label lblStatus, lblAccount, lblLangHint;

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
            Size = new Size(680, 620);
            MinimumSize = new Size(620, 560);
            Font = new Font("Microsoft JhengHei UI", 9F);
            StartPosition = FormStartPosition.CenterScreen;

            // ── 連線設定 ──────────────────────────────
            GroupBox gSetup = new GroupBox();
            gSetup.Text = "1. 賽前設定（需要網路）";
            gSetup.SetBounds(12, 8, 640, 132);
            gSetup.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            gSetup.Controls.Add(MakeLabel("伺服器", 12, 26));
            txtServer = new TextBox();
            txtServer.SetBounds(70, 23, 300, 23);
            txtServer.Text = "https://oj.itousouta.me";
            gSetup.Controls.Add(txtServer);

            gSetup.Controls.Add(MakeLabel("帳號", 12, 56));
            txtUser = new TextBox();
            txtUser.SetBounds(70, 53, 130, 23);
            gSetup.Controls.Add(txtUser);

            gSetup.Controls.Add(MakeLabel("密碼", 210, 56));
            txtPass = new TextBox();
            txtPass.SetBounds(258, 53, 112, 23);
            txtPass.UseSystemPasswordChar = true;
            gSetup.Controls.Add(txtPass);

            btnLogin = new Button();
            btnLogin.Text = "登入並取得題目";
            btnLogin.SetBounds(380, 52, 130, 26);
            btnLogin.Click += OnLogin;
            gSetup.Controls.Add(btnLogin);

            gSetup.Controls.Add(MakeLabel("比賽", 12, 89));
            cboContest = new ComboBox();
            cboContest.SetBounds(70, 86, 300, 23);
            cboContest.DropDownStyle = ComboBoxStyle.DropDownList;
            cboContest.SelectedIndexChanged += OnContestChanged;
            gSetup.Controls.Add(cboContest);

            Controls.Add(gSetup);

            // ── 提交 ──────────────────────────────────
            GroupBox gSubmit = new GroupBox();
            gSubmit.Text = "2. 比賽中提交（不需要網路）";
            gSubmit.SetBounds(12, 148, 640, 104);
            gSubmit.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            gSubmit.Controls.Add(MakeLabel("題目", 12, 30));
            cboProblem = new ComboBox();
            cboProblem.SetBounds(70, 27, 300, 23);
            cboProblem.DropDownStyle = ComboBoxStyle.DropDownList;
            gSubmit.Controls.Add(cboProblem);

            gSubmit.Controls.Add(MakeLabel("檔案", 12, 63));
            txtFile = new TextBox();
            txtFile.SetBounds(70, 60, 300, 23);
            txtFile.ReadOnly = true;
            gSubmit.Controls.Add(txtFile);

            btnBrowse = new Button();
            btnBrowse.Text = "瀏覽…";
            btnBrowse.SetBounds(380, 59, 70, 26);
            btnBrowse.Click += OnBrowse;
            gSubmit.Controls.Add(btnBrowse);

            lblLangHint = new Label();
            lblLangHint.SetBounds(380, 27, 240, 20);
            lblLangHint.AutoSize = false;
            gSubmit.Controls.Add(lblLangHint);

            btnSubmit = new Button();
            btnSubmit.Text = "提  交";
            btnSubmit.SetBounds(462, 40, 160, 42);
            btnSubmit.Font = new Font(Font, FontStyle.Bold);
            btnSubmit.Click += OnSubmit;
            gSubmit.Controls.Add(btnSubmit);

            Controls.Add(gSubmit);

            // ── 清單 ──────────────────────────────────
            listView = new ListView();
            listView.SetBounds(12, 282, 640, 232);
            listView.Anchor = AnchorStyles.Top | AnchorStyles.Bottom |
                              AnchorStyles.Left | AnchorStyles.Right;
            listView.View = View.Details;
            listView.FullRowSelect = true;
            listView.GridLines = true;
            listView.Columns.Add("題目", 60);
            listView.Columns.Add("提交時間", 150);
            listView.Columns.Add("語言", 80);
            listView.Columns.Add("檔案", 200);
            listView.Columns.Add("狀態", 110);
            Controls.Add(listView);

            Label lblList = MakeLabel("3. 已收件（重新連網後按右下角上傳）", 12, 262);
            lblList.Width = 400;
            Controls.Add(lblList);

            btnRefresh = new Button();
            btnRefresh.Text = "重新整理";
            btnRefresh.SetBounds(12, 522, 90, 30);
            btnRefresh.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            btnRefresh.Click += delegate { RefreshList(); };
            Controls.Add(btnRefresh);

            btnUpload = new Button();
            btnUpload.Text = "上傳到伺服器";
            btnUpload.SetBounds(462, 520, 190, 34);
            btnUpload.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
            btnUpload.Font = new Font(Font, FontStyle.Bold);
            btnUpload.Click += OnUpload;
            Controls.Add(btnUpload);

            lblAccount = MakeLabel("", 110, 528);
            lblAccount.Width = 340;
            lblAccount.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            Controls.Add(lblAccount);

            lblStatus = MakeLabel("", 12, 562);
            lblStatus.Width = 640;
            lblStatus.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            Controls.Add(lblStatus);
        }

        static Label MakeLabel(string text, int x, int y)
        {
            Label l = new Label();
            l.Text = text;
            l.SetBounds(x, y, 56, 20);
            l.AutoSize = false;
            return l;
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
        void OnLogin(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(BaseUrl())) { Status("請先填伺服器網址", true); return; }
            if (txtUser.Text.Trim().Length == 0 || txtPass.Text.Length == 0)
            {
                Status("請輸入帳號與密碼", true);
                return;
            }

            Cursor = Cursors.WaitCursor;
            btnLogin.Enabled = false;
            try
            {
                Status("登入中…", false);
                JavaScriptSerializer ser = new JavaScriptSerializer();
                Dictionary<string, object> payload = new Dictionary<string, object>();
                payload["username"] = txtUser.Text.Trim();
                payload["password"] = txtPass.Text;

                string setCookie;
                DateTime? serverDate;
                Api.Send(BaseUrl() + "/api/auth/login", "POST", null,
                         ser.Serialize(payload), out setCookie, out serverDate);

                string cookie = Api.ExtractSessionCookie(setCookie);
                if (string.IsNullOrEmpty(cookie))
                {
                    Status("登入成功但沒拿到 session，請確認伺服器設定", true);
                    return;
                }

                cfg.ServerUrl = BaseUrl();
                cfg.Cookie = cookie;
                cfg.Username = txtUser.Text.Trim();
                if (serverDate.HasValue)
                {
                    cfg.ClockOffsetMs =
                        (long)(serverDate.Value - DateTime.UtcNow).TotalMilliseconds;
                }
                Store.SaveConfig(cfg);
                UpdateAccountLabel();

                LoadContests();
                Status("登入成功，請選擇比賽", false);
            }
            catch (Exception ex)
            {
                Status("登入失敗：" + ex.Message, true);
            }
            finally
            {
                btnLogin.Enabled = true;
                Cursor = Cursors.Default;
                txtPass.Text = "";
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
            int keepIndex = -1;
            foreach (Dictionary<string, object> c in Json.Array(root["contests"]))
            {
                bool joined = Convert.ToBoolean(c["joined"]);
                int id = Convert.ToInt32(c["id"]);
                if (id == cfg.ContestId) keepIndex = contests.Count;
                contests.Add(c);
                cboContest.Items.Add(string.Format("{0}  (#{1}){2}",
                    Convert.ToString(c["title"]), id, joined ? "" : "  ※尚未報名"));
            }

            // 已經設定過比賽就維持原選擇。這裡若無腦選第 0 筆，賽後為了換發過期的
            // session 而重新登入的選手，會被切到清單最上面那場（依開始時間倒序，
            // 通常不是他要交的那場），整包提交就會送錯比賽。
            if (cfg.ContestId > 0)
            {
                if (keepIndex >= 0)
                {
                    cboContest.SelectedIndex = keepIndex;
                }
                else
                {
                    Status(string.Format(
                        "注意：伺服器清單裡找不到原本設定的比賽 #{0}，" +
                        "請確認登入的帳號是否正確；未確認前請勿更動比賽選擇。",
                        cfg.ContestId), true);
                }
            }
            else if (cboContest.Items.Count > 0)
            {
                cboContest.SelectedIndex = 0;
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
                    cfg.Problems.Add(pe);
                }
                Store.SaveConfig(cfg);
                FillProblems();
                UpdateLanguageHint();
                string langNote = cfg.AllowedLanguages.Count > 0
                    ? "，限用 " + LanguageNames(cfg.AllowedLanguages)
                    : "";
                Status(string.Format("已載入「{0}」的 {1} 道題目{2}，可以斷網作答了",
                    cfg.ContestTitle, cfg.Problems.Count, langNote), false);
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
            if (dlg.ShowDialog(this) == DialogResult.OK) txtFile.Text = dlg.FileName;
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

        void OnSubmit(object sender, EventArgs e)
        {
            if (cfg.ContestId <= 0 || cfg.Problems.Count == 0)
            {
                Status("還沒設定比賽，請先在上方登入並選擇比賽", true);
                return;
            }
            int pi = cboProblem.SelectedIndex;
            if (pi < 0) { Status("請選擇題目", true); return; }

            string path = txtFile.Text.Trim();
            if (path.Length == 0 || !File.Exists(path))
            {
                Status("請選擇要提交的程式碼檔案", true);
                return;
            }

            string lang = LanguageFromPath(path);
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

            string code;
            try
            {
                code = File.ReadAllText(path, Encoding.UTF8);
            }
            catch (Exception ex)
            {
                Status("讀取檔案失敗：" + ex.Message, true);
                return;
            }
            if (code.Trim().Length == 0) { Status("這個檔案是空的", true); return; }
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
            item.FileName = Path.GetFileName(path);

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

                    // 伺服器收下了（新收或判定重複）就標記，重傳也會被 clientKey 擋掉
                    foreach (SpoolItem it in chunk) Store.MarkUploaded(it.ClientKey);
                }

                RefreshList();
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
