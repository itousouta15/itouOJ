// 收件程式的端對端測試（只在開發時建置，不會進到發給選手的 exe）。
//
// 跟 OfflineSubmit.cs 一起編譯，用 /main:ItouOJ.TestHarness 換掉進入點，
// 這樣測到的是 GUI 實際會用的同一份 Api / Store 程式碼，而不是另外寫的仿冒品。
//
// 用法：TestHarness.exe <伺服器網址> <帳號> <密碼>

using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace ItouOJ
{
    public static class TestHarness
    {
        static int failures = 0;

        [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true)]
        static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);

        static void Check(string name, bool ok, string detail)
        {
            Console.WriteLine((ok ? "  [PASS] " : "  [FAIL] ") + name +
                              (detail == null ? "" : "  -> " + detail));
            if (!ok) failures++;
        }

        // 與伺服器 judge.ts 的 normalizeOutput 對照用；兩邊必須逐字一致，
        // 否則選手本機看到「通過」、上傳後卻拿到 WA
        public static readonly string[] NormalizeCases = {
            "1\n2\n",
            "1\n2",
            "1 \n2  ",
            "1\r\n2\r\n",
            "1\n\n\n",
            "",
            "\n\n",
            "  a  \n  b  ",
            "a\tb\t",
            "x\n \n y",
            "\n",
            "no-newline",
        };

        public static int Main(string[] args)
        {
            // GUI（winexe）模式下沒有主控台，StandardInput 的編碼行為和主控台程式
            // 不同。這個模式把結果寫檔，讓 winexe 版本也能被驗證。
            // 把視窗畫成圖檔。介面調整光看程式碼看不出結果，得真的把畫面存下來看。
            if (args.Length >= 2 && args[0] == "--screenshot")
            {
                string outPng = args[1];
                int tabIndex = args.Length >= 3 ? int.Parse(args[2]) : 0;
                System.Threading.Thread th = new System.Threading.Thread(delegate ()
                {
                    try
                    {
                        Application.EnableVisualStyles();
                        Application.SetCompatibleTextRenderingDefault(false);
                        using (MainForm f = new MainForm())
                        {
                            f.StartPosition = FormStartPosition.Manual;
                            f.Location = new Point(-4000, -4000);
                            f.Show();
                            Application.DoEvents();
                            TabControl tc = FindByName<TabControl>(f, "tabs");
                            if (tc != null && tabIndex < tc.TabPages.Count)
                            {
                                tc.SelectedIndex = tabIndex;
                                Application.DoEvents();
                                System.Threading.Thread.Sleep(400);
                                Application.DoEvents();
                            }
                            // 診斷遮罩狀態
                            Config c = Store.LoadConfig();
                            Panel gate = FindByName<Panel>(f, "pnlGate");
                            File.WriteAllText(outPng + ".info",
                                "phase=" + Phase.Of(c) + "\r\n" +
                                "start=" + c.StartTimeUtc + "\r\n" +
                                "gate.Visible=" + (gate == null ? "null" : gate.Visible.ToString()) + "\r\n" +
                                "gate.Bounds=" + (gate == null ? "null" : gate.Bounds.ToString()) + "\r\n" +
                                "gate.index=" + (gate == null || gate.Parent == null
                                    ? "?" : gate.Parent.Controls.GetChildIndex(gate).ToString()) + "\r\n",
                                new UTF8Encoding(false));

                            // 用 PrintWindow(PW_RENDERFULLCONTENT) 讓視窗自己把內容畫進點陣圖。
                            //
                            // 不用 DrawToBitmap：它不會合成重疊的同層控制項，蓋在 TabControl
                            // 上的遮罩會被忽略，拍出來與實際畫面不符。
                            // 更不用 CopyFromScreen：那是抓螢幕座標上的畫面，會拍到使用者
                            // 當下在做的任何事，而且視窗沒在最上層就整張都是別的東西。
                            Application.DoEvents();
                            System.Threading.Thread.Sleep(500);
                            Application.DoEvents();

                            Rectangle r = f.Bounds;
                            using (Bitmap bmp = new Bitmap(r.Width, r.Height))
                            {
                                using (Graphics g = Graphics.FromImage(bmp))
                                {
                                    IntPtr hdc = g.GetHdc();
                                    try { PrintWindow(f.Handle, hdc, 2 /* PW_RENDERFULLCONTENT */); }
                                    finally { g.ReleaseHdc(hdc); }
                                }
                                bmp.Save(outPng, System.Drawing.Imaging.ImageFormat.Png);
                            }
                            f.Hide();
                        }
                    }
                    catch (Exception ex)
                    {
                        File.WriteAllText(outPng + ".err", ex.ToString());
                    }
                });
                th.SetApartmentState(System.Threading.ApartmentState.STA);
                th.Start();
                th.Join(60000);
                return 0;
            }

            if (args.Length >= 2 && args[0] == "--probe-stdin")
            {
                string log = args[1];
                StringBuilder sb = new StringBuilder();
                try
                {
                    string probeCc = Runner.FindCompiler();
                    sb.AppendLine("compiler=" + (probeCc ?? "(none)"));
                    if (probeCc != null)
                    {
                        string dir = Path.Combine(Store.Root, "probe");
                        Directory.CreateDirectory(dir);
                        string src = Path.Combine(dir, "p.cpp");
                        File.WriteAllText(src,
                            "#include <bits/stdc++.h>\nusing namespace std;\n" +
                            "int main(){long long a=-1,b=-1;cin>>a>>b;cout<<a<<\" \"<<b<<\" \"<<a+b<<endl;return 0;}\n",
                            new UTF8Encoding(false));
                        RunOutcome r = Runner.CompileAndRun(probeCc, src, "3 4\n", 8000);
                        sb.AppendLine("compileFailed=" + r.CompileFailed);
                        sb.AppendLine("compileError=" + (r.CompileError ?? ""));
                        sb.AppendLine("exit=" + r.ExitCode);
                        sb.AppendLine("timedOut=" + r.TimedOut);
                        sb.AppendLine("stdout=" + Runner.Normalize(r.Stdout));
                    }
                }
                catch (Exception ex)
                {
                    sb.AppendLine("exception=" + ex.GetType().Name + ": " + ex.Message);
                }
                File.WriteAllText(log, sb.ToString(), new UTF8Encoding(false));
                return 0;
            }

            // 建構整個主視窗（不顯示）並走一遍控制項樹。版面程式碼在建構期就
            // 丟例外是常見的失敗模式，而自動化測試點不到按鈕，至少要確認建得起來。
            if (args.Length >= 2 && args[0] == "--probe-ui")
            {
                string outPath = args[1];
                StringBuilder sb = new StringBuilder();
                System.Threading.Thread t = new System.Threading.Thread(delegate ()
                {
                    try
                    {
                        Application.EnableVisualStyles();
                        using (MainForm f = new MainForm())
                        {
                            sb.AppendLine("constructed=ok");
                            sb.AppendLine("title=" + f.Text);
                            WalkControls(f, sb, 0);

                            // 模擬切到「從檔案」，檢查相關控制項有沒有跟著啟用
                            RadioButton rbFile = FindByText<RadioButton>(f, "從檔案");
                            TextBox path = FindByName<TextBox>(f, "txtFile");
                            Button browse = FindByText<Button>(f, "瀏覽…");
                            sb.AppendLine("--- 切換到「從檔案」之前 ---");
                            sb.AppendLine("txtFile.Enabled=" + (path == null ? "?" : path.Enabled.ToString()));
                            sb.AppendLine("browse.Enabled=" + (browse == null ? "?" : browse.Enabled.ToString()));
                            if (rbFile != null) rbFile.Checked = true;
                            sb.AppendLine("--- 之後 ---");
                            sb.AppendLine("rbFile.Checked=" + (rbFile == null ? "?" : rbFile.Checked.ToString()));
                            sb.AppendLine("txtFile.Enabled=" + (path == null ? "?" : path.Enabled.ToString()));
                            sb.AppendLine("browse.Enabled=" + (browse == null ? "?" : browse.Enabled.ToString()));

                            // 版面實測：把視窗移到畫面外顯示一次，強制跑完 dock/anchor 計算，
                            // 再檢查按鈕是不是真的落在可見範圍內
                            f.StartPosition = FormStartPosition.Manual;
                            f.Location = new Point(-4000, -4000);
                            f.Show();
                            Application.DoEvents();

                            // PIN 鎖：登入必須維持可用，只有比賽選擇與管理員設定該被鎖
                            sb.AppendLine("--- PIN 鎖範圍 ---");
                            Config lockCfg = Store.LoadConfig();
                            lockCfg.AdminPinHash = AdminLock.Hash("1234");
                            lockCfg.Locked = true;
                            SetField(f, "cfg", lockCfg);
                            InvokePrivate(f, "ApplyLockState");
                            foreach (string n in new string[] {
                                "txtServer", "txtUser", "btnLogin",
                                "cboContest", "btnSettings", "btnUnlock" })
                            {
                                Control c = FindByName<Control>(f, n);
                                sb.AppendLine(string.Format("  {0,-12} Enabled={1}",
                                    n, c == null ? "?" : c.Enabled.ToString()));
                            }

                            sb.AppendLine("--- 解鎖後 ---");
                            SetField(f, "unlockedThisSession", true);
                            InvokePrivate(f, "ApplyLockState");
                            foreach (string n in new string[] {
                                "cboContest", "btnSettings", "btnUnlock" })
                            {
                                Control c = FindByName<Control>(f, n);
                                sb.AppendLine(string.Format("  {0,-12} Enabled={1}",
                                    n, c == null ? "?" : c.Enabled.ToString()));
                            }

                            sb.AppendLine("--- 未設定 PIN 時（不該鎖）---");
                            Config open = Store.LoadConfig();
                            open.Locked = true;
                            open.AdminPinHash = "";
                            SetField(f, "cfg", open);
                            SetField(f, "unlockedThisSession", false);
                            InvokePrivate(f, "ApplyLockState");
                            foreach (string n in new string[] { "cboContest", "btnSettings" })
                            {
                                Control c = FindByName<Control>(f, n);
                                sb.AppendLine(string.Format("  {0,-12} Enabled={1}",
                                    n, c == null ? "?" : c.Enabled.ToString()));
                            }
                            sb.AppendLine("--- 版面實測 ---");
                            ReportBounds(sb, "btnUpload", FindByName<Button>(f, "btnUpload"));
                            ReportBounds(sb, "btnSubmit", FindByName<Button>(f, "btnSubmit"));
                            ReportBounds(sb, "btnTest", FindByName<Button>(f, "btnTest"));
                            ReportBounds(sb, "btnBrowse", FindByName<Button>(f, "btnBrowse"));
                            ReportBounds(sb, "btnRefresh", FindByName<Button>(f, "btnRefresh"));
                            f.Hide();
                        }
                    }
                    catch (Exception ex)
                    {
                        sb.AppendLine("exception=" + ex.GetType().Name + ": " + ex.Message);
                        sb.AppendLine(ex.StackTrace);
                    }
                });
                t.SetApartmentState(System.Threading.ApartmentState.STA);
                t.Start();
                t.Join(60000);
                File.WriteAllText(outPath, sb.ToString(), new UTF8Encoding(false));
                return 0;
            }

            if (args.Length >= 1 && args[0] == "--normalize")
            {
                // 印出正規化結果供跨語言比對（\n -> \\n 方便逐行 diff）
                foreach (string c in NormalizeCases)
                {
                    Console.WriteLine(Runner.Normalize(c)
                        .Replace("\\", "\\\\").Replace("\n", "\\n").Replace("\t", "\\t"));
                }
                return 0;
            }

            if (args.Length < 3)
            {
                Console.WriteLine("用法: TestHarness.exe <伺服器網址> <帳號> <密碼>");
                return 2;
            }
            string baseUrl = args[0].TrimEnd('/');
            string user = args[1];
            string pass = args[2];

            Api.InitTls();
            JavaScriptSerializer ser = new JavaScriptSerializer();
            ser.MaxJsonLength = 32 * 1024 * 1024;

            // ── 0. 重新登入時的比賽選擇 ───────────────
            // 賽後 session 過期、重新登入換發時，不能把選手切到別場比賽
            Console.WriteLine("\n[0] 重新登入後的比賽選擇（純邏輯）");
            List<int> listed = new List<int>() { 3, 2, 1 }; // API 依 startTime 倒序
            Check("已設定 #2 -> 停在 #2 而不是清單第一筆",
                  Selection.ChooseContestIndex(listed, 2) == 1,
                  "index=" + Selection.ChooseContestIndex(listed, 2));
            Check("已設定 #3 -> 停在 #3",
                  Selection.ChooseContestIndex(listed, 3) == 0, null);
            Check("尚未設定 -> 選第一筆",
                  Selection.ChooseContestIndex(listed, 0) == 0, null);
            Check("已設定但清單裡沒有 -> 回 -1（不要動選擇）",
                  Selection.ChooseContestIndex(new List<int>() { 3, 1 }, 2) == -1,
                  "index=" + Selection.ChooseContestIndex(new List<int>() { 3, 1 }, 2));
            Check("空清單 -> 回 -1",
                  Selection.ChooseContestIndex(new List<int>(), 0) == -1, null);

            // ── 0a. 題目檔路徑解析與草稿 ──────────────
            Console.WriteLine("\n[0a] 題目檔路徑與草稿保存");
            string tmpDir = Path.Combine(Store.Root, "doctest");
            Directory.CreateDirectory(tmpDir);
            File.WriteAllText(Path.Combine(tmpDir, "A.pdf"), "fake");
            File.WriteAllText(Path.Combine(tmpDir, "custom-B.pdf"), "fake");

            Config c0 = new Config();
            Check("沒設定資料夾 -> null", ProblemDoc.Resolve(c0, "A") == null, null);

            c0.ProblemDir = tmpDir;
            Check("依代號找到 A.pdf",
                  ProblemDoc.Resolve(c0, "A") == Path.Combine(tmpDir, "A.pdf"), null);
            Check("找不到對應檔案 -> null（UI 會停用開啟鈕）",
                  ProblemDoc.Resolve(c0, "Z") == null, null);

            // export-problems.mjs 產出的是 .html，也要能直接當題目檔
            File.WriteAllText(Path.Combine(tmpDir, "D.html"), "fake");
            Check("沒有 PDF 時退而找 D.html",
                  ProblemDoc.Resolve(c0, "D") == Path.Combine(tmpDir, "D.html"), null);
            File.WriteAllText(Path.Combine(tmpDir, "A.html"), "fake");
            Check("PDF 與 HTML 並存時優先用 PDF",
                  ProblemDoc.Resolve(c0, "A") == Path.Combine(tmpDir, "A.pdf"), null);

            ProblemFile pf = new ProblemFile();
            pf.Label = "B";
            pf.Path = "custom-B.pdf"; // 相對路徑
            c0.ProblemFiles.Add(pf);
            Check("個別覆寫（相對路徑）解析成功",
                  ProblemDoc.Resolve(c0, "B") == Path.Combine(tmpDir, "custom-B.pdf"), null);

            ProblemFile pf2 = new ProblemFile();
            pf2.Label = "C";
            pf2.Path = Path.Combine(tmpDir, "does-not-exist.pdf");
            c0.ProblemFiles.Add(pf2);
            Check("覆寫指到不存在的檔 -> null", ProblemDoc.Resolve(c0, "C") == null, null);

            Store.WriteDraft(999, "A", "int main(){}// 草稿測試\n");
            Check("草稿寫入後可讀回",
                  Store.ReadDraft(999, "A").Contains("草稿測試"), null);
            Store.WriteDraft(999, "A", "");
            Check("草稿可清空", Store.ReadDraft(999, "A") == "", null);
            Check("沒有草稿的題目讀回空字串", Store.ReadDraft(999, "ZZ") == "", null);

            // ── 0a2. 管理員 PIN 鎖 ────────────────────
            Console.WriteLine("\n[0a2] 管理員 PIN 鎖");
            Config cl = new Config();
            Check("預設不鎖", !AdminLock.IsLocked(cl), null);
            Check("沒設 PIN 時任何輸入都放行（避免鎖死）",
                  AdminLock.Verify(cl, "whatever"), null);

            cl.AdminPinHash = AdminLock.Hash("1234");
            cl.Locked = true;
            Check("設定後為鎖定狀態", AdminLock.IsLocked(cl), null);
            Check("正確 PIN 可解鎖", AdminLock.Verify(cl, "1234"), null);
            Check("錯誤 PIN 被拒絕", !AdminLock.Verify(cl, "1235"), null);
            Check("空 PIN 被拒絕", !AdminLock.Verify(cl, ""), null);
            Check("PIN 不以明碼存放",
                  cl.AdminPinHash != "1234" && cl.AdminPinHash.Length == 64,
                  cl.AdminPinHash.Substring(0, 16) + "…");

            cl.Locked = true;
            cl.AdminPinHash = "";
            Check("標記鎖定但沒有 PIN -> 視為未鎖（否則永遠打不開）",
                  !AdminLock.IsLocked(cl), null);

            // ── 0a3. 瀏覽器登入的 loopback 接收端 ─────
            Console.WriteLine("\n[0a3] 瀏覽器登入 loopback");
            string st1 = Loopback.NewState();
            string st2 = Loopback.NewState();
            Check("state 每次不同", st1 != st2, null);
            Check("state 符合授權頁的格式要求 [A-Za-z0-9_-]{8,64}",
                  System.Text.RegularExpressions.Regex.IsMatch(st1, "^[A-Za-z0-9_-]{8,64}$"),
                  st1);
            int p1 = Loopback.FindFreePort();
            Check("能取得可用的本機連接埠", p1 >= 1024 && p1 <= 65535, "port=" + p1);

            // 正確的 state -> 收下 token
            LoopbackResult good = ProbeCallback(p1, st1, st1, "tok-abc123");
            Check("正確 state：收下 token", good.Ok && good.Token == "tok-abc123",
                  good.Ok ? good.Token : good.Error);

            // 錯誤的 state -> 必須拒絕，否則別的網頁也能把使用者登入成別人的帳號
            int p2 = Loopback.FindFreePort();
            LoopbackResult bad = ProbeCallback(p2, st1, st2, "tok-evil");
            Check("錯誤 state：拒絕並不回傳 token",
                  !bad.Ok && string.IsNullOrEmpty(bad.Token), bad.Error);

            // 沒人來就要逾時，不能無限等下去把程式卡住
            int p3 = Loopback.FindFreePort();
            DateTime t0 = DateTime.UtcNow;
            LoopbackResult timeout = Loopback.WaitForCallback(p3, st1, 1500);
            double waited = (DateTime.UtcNow - t0).TotalMilliseconds;
            Check("沒有回呼時會逾時結束",
                  !timeout.Ok && waited >= 1400 && waited < 8000,
                  Math.Round(waited) + " ms");

            // ── 0a4. 比賽階段（統一開始 / 時間到關閉）──
            Console.WriteLine("\n[0a4] 比賽階段判斷");
            Func<int, int, Config> mk = delegate (int startMin, int endMin)
            {
                Config c = new Config();
                c.ContestId = 1;
                c.Problems.Add(new ProblemEntry());
                c.StartTimeUtc = DateTime.UtcNow.AddMinutes(startMin)
                    .ToString("yyyy-MM-ddTHH:mm:ss.fffZ", System.Globalization.CultureInfo.InvariantCulture);
                c.EndTimeUtc = DateTime.UtcNow.AddMinutes(endMin)
                    .ToString("yyyy-MM-ddTHH:mm:ss.fffZ", System.Globalization.CultureInfo.InvariantCulture);
                return c;
            };
            Check("開賽前 -> Waiting", Phase.Of(mk(10, 130)) == ContestPhase.Waiting, null);
            Check("進行中 -> Running", Phase.Of(mk(-10, 110)) == ContestPhase.Running, null);
            Check("已結束 -> Ended", Phase.Of(mk(-130, -10)) == ContestPhase.Ended, null);

            Config noContest = new Config();
            Check("還沒設定比賽 -> NotReady",
                  Phase.Of(noContest) == ContestPhase.NotReady, null);

            Config noTimes = new Config();
            noTimes.ContestId = 1;
            noTimes.Problems.Add(new ProblemEntry());
            Check("有比賽但沒有時間資訊 -> 當作 Running（不把選手擋在門外）",
                  Phase.Of(noTimes) == ContestPhase.Running, null);

            // 時鐘校正必須真的影響判斷 —— 這是「統一開始」的基礎
            Config skewed = mk(5, 125);          // 本機時間看是 5 分鐘後開始
            skewed.ClockOffsetMs = 10 * 60000;   // 但伺服器比本機快 10 分鐘
            Check("時鐘校正納入判斷：本機以為還沒開始，校正後其實已開始",
                  Phase.Of(skewed) == ContestPhase.Running, null);

            Config skewed2 = mk(-5, 115);
            skewed2.ClockOffsetMs = -10 * 60000; // 伺服器比本機慢 10 分鐘
            Check("反向校正：本機以為開始了，校正後其實還沒",
                  Phase.Of(skewed2) == ContestPhase.Waiting, null);

            TimeSpan left = Phase.Until(mk(-10, 50), noTimes.EndTimeUtc);
            Check("倒數格式化", Phase.Clock(TimeSpan.FromSeconds(3725)) == "01:02:05",
                  Phase.Clock(TimeSpan.FromSeconds(3725)));
            Check("負數倒數顯示為 00:00:00",
                  Phase.Clock(TimeSpan.FromSeconds(-5)) == "00:00:00", null);

            // ── 0a5. 換人登入的隔離 ───────────────────
            // 同一台機器換人用時，不能讓後面那位看到或拿走前一位的東西
            Console.WriteLine("\n[0a5] 登出後的資料隔離");
            Store.WriteDraft(777, "A", "// 甲同學的解法\nint main(){}\n");
            Store.WriteDraft(777, "B", "// 甲同學的另一題\n");
            Check("草稿寫入後讀得到",
                  Store.ReadDraft(777, "A").Contains("甲同學"), null);
            int clearedDrafts = Store.ClearDrafts();
            Check("登出會清掉草稿（否則下一位直接看到上一位的程式碼）",
                  Store.ReadDraft(777, "A") == "" && Store.ReadDraft(777, "B") == "",
                  "清掉 " + clearedDrafts + " 份");

            // 提交要綁擁有者
            foreach (string f in Directory.Exists(Store.PendingDir)
                     ? Directory.GetFiles(Store.PendingDir, "*.json") : new string[0])
                File.Delete(f);
            SpoolItem a1 = new SpoolItem();
            a1.ClientKey = Guid.NewGuid().ToString("N");
            a1.ProblemId = 1; a1.Label = "A"; a1.Language = "cpp";
            a1.Code = "int main(){}"; a1.FileName = "a.cpp";
            a1.SubmittedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ",
                System.Globalization.CultureInfo.InvariantCulture);
            a1.Owner = "studentA";
            Store.WritePending(a1);

            List<SpoolItem> readBack = Store.ReadDir(Store.PendingDir);
            Check("提交有記錄擁有者",
                  readBack.Count == 1 && readBack[0].Owner == "studentA",
                  readBack.Count > 0 ? readBack[0].Owner : "無");

            // 模擬 studentB 登入後的過濾邏輯（與 OnUpload 相同）
            string me = "studentB";
            int mineCount = 0, othersCount = 0;
            foreach (SpoolItem it in readBack)
            {
                if (string.IsNullOrEmpty(it.Owner) || it.Owner == me) mineCount++;
                else othersCount++;
            }
            Check("換人登入後，他人的提交不會被算成自己的",
                  mineCount == 0 && othersCount == 1,
                  "自己的 " + mineCount + " 筆／他人的 " + othersCount + " 筆");

            // 舊版沒有 Owner 的資料要當成自己的，不能讓既有提交上傳不了
            SpoolItem legacy = new SpoolItem();
            legacy.ClientKey = Guid.NewGuid().ToString("N");
            legacy.ProblemId = 1; legacy.Label = "A"; legacy.Language = "cpp";
            legacy.Code = "int main(){}"; legacy.FileName = "old.cpp";
            legacy.SubmittedAt = a1.SubmittedAt;
            Store.WritePending(legacy);
            int legacyMine = 0;
            foreach (SpoolItem it in Store.ReadDir(Store.PendingDir))
                if (string.IsNullOrEmpty(it.Owner) || it.Owner == me) legacyMine++;
            Check("舊版沒有 Owner 的提交仍可上傳（不因升級而卡住）",
                  legacyMine == 1, legacyMine + " 筆");

            foreach (string f in Directory.GetFiles(Store.PendingDir, "*.json"))
                File.Delete(f);

            // ── 0a6. 關閉程式時的重設判斷 ─────────────
            // 清錯的代價不對稱：少清一次只是髒；多清一次會讓斷網中的選手
            // 再也登不回來、交不出東西。所以每個分支都要有測試釘住。
            Console.WriteLine("\n[0a6] 關掉程式要不要回到初始狀態");

            Config xc = new Config();
            xc.ServerUrl = "https://oj.itousouta.me";
            Check("沒登入就沒東西好清",
                  !Flow.ShouldResetOnExit(xc, 0), null);

            xc.Cookie = "c"; xc.Username = "oj07";
            Check("登入了但還沒選比賽 -> 清",
                  Flow.ShouldResetOnExit(xc, 0), null);

            xc.ContestId = 3;
            xc.Problems = new List<ProblemEntry>();
            ProblemEntry pe0 = new ProblemEntry();
            pe0.ProblemId = 1; pe0.Label = "A";
            xc.Problems.Add(pe0);

            string fmt = "yyyy-MM-ddTHH:mm:ss.fffZ";
            System.Globalization.CultureInfo inv =
                System.Globalization.CultureInfo.InvariantCulture;

            // 等待開賽：網路這時已經斷了，清掉就再也登不回來
            xc.StartTimeUtc = DateTime.UtcNow.AddMinutes(20).ToString(fmt, inv);
            xc.EndTimeUtc = DateTime.UtcNow.AddMinutes(200).ToString(fmt, inv);
            Check("等待開賽中 -> 不清（斷網後無法重新登入）",
                  !Flow.ShouldResetOnExit(xc, 0), Flow.Current(xc).ToString());

            // 作答中：同上，而且還會連草稿一起消失
            xc.StartTimeUtc = DateTime.UtcNow.AddMinutes(-20).ToString(fmt, inv);
            xc.EndTimeUtc = DateTime.UtcNow.AddMinutes(100).ToString(fmt, inv);
            Check("作答中 -> 不清",
                  !Flow.ShouldResetOnExit(xc, 0), Flow.Current(xc).ToString());

            // 比賽結束且都傳完了：網路已恢復，可以放心交還給下一位
            xc.StartTimeUtc = DateTime.UtcNow.AddMinutes(-200).ToString(fmt, inv);
            xc.EndTimeUtc = DateTime.UtcNow.AddMinutes(-20).ToString(fmt, inv);
            Check("比賽結束且全部上傳完 -> 清",
                  Flow.ShouldResetOnExit(xc, 0), Flow.Current(xc).ToString());

            Check("比賽結束但還有沒上傳的 -> 不清（清了就要重登才傳得出去）",
                  !Flow.ShouldResetOnExit(xc, 3), "待上傳 3 筆");

            // ── 0b. 輸出比對規則 ──────────────────────
            Console.WriteLine("\n[0b] 輸出正規化（必須與伺服器 judge.ts 一致）");
            Check("忽略結尾換行", Runner.Normalize("1\n2\n") == "1\n2", null);
            Check("去掉行尾空白", Runner.Normalize("1 \n2  ") == "1\n2", null);
            Check("CRLF 視同 LF", Runner.Normalize("1\r\n2\r\n") == "1\n2", null);
            Check("保留行首空白", Runner.Normalize("  a  ") == "  a", null);
            Check("全空白輸入 -> 空字串", Runner.Normalize("\n\n") == "", null);
            Check("null 不會爆", Runner.Normalize(null) == "", null);

            // ── 0c. 編譯器偵測與實際編譯執行 ──────────
            Console.WriteLine("\n[0c] 測試執行（編譯 + 跑 + 比對）");
            string cc = Runner.FindCompiler();
            if (cc == null)
            {
                Console.WriteLine("      這台機器沒有 g++，跳過（測試執行會顯示提示，不影響提交上傳）");
            }
            else
            {
                Console.WriteLine("      編譯器：" + cc);
                RunLocalTests(cc);
            }

            string setCookie;
            DateTime? serverDate;

            try
            {
                // ── 1. 登入 ───────────────────────────────
                Console.WriteLine("\n[1] 登入");
                Dictionary<string, object> login = new Dictionary<string, object>();
                login["username"] = user;
                login["password"] = pass;
                Api.Send(baseUrl + "/api/auth/login", "POST", null,
                         ser.Serialize(login), out setCookie, out serverDate);

                string cookie = Api.ExtractSessionCookie(setCookie);
                Check("拿到 session cookie", !string.IsNullOrEmpty(cookie),
                      cookie == null ? "null" : cookie.Substring(0, Math.Min(24, cookie.Length)) + "...");
                Check("伺服器 Date 標頭可解析（時鐘校正靠它）", serverDate.HasValue,
                      serverDate.HasValue ? serverDate.Value.ToString("o") : "無");

                long offset = serverDate.HasValue
                    ? (long)(serverDate.Value - DateTime.UtcNow).TotalMilliseconds : 0;
                Check("時鐘偏移在合理範圍（<5 分鐘）", Math.Abs(offset) < 300000,
                      offset + " ms");

                // ── 2. 比賽清單 ───────────────────────────
                Console.WriteLine("\n[2] 取得比賽清單");
                string body = Api.Send(baseUrl + "/api/me/contests", "GET", cookie, null,
                                       out setCookie, out serverDate);
                Dictionary<string, object> root =
                    ser.Deserialize<Dictionary<string, object>>(body);
                List<Dictionary<string, object>> cs = Json.Array(root["contests"]);
                Check("回傳比賽陣列", cs.Count > 0, cs.Count + " 場");

                // 挑有報名的那場：清單第一筆不一定是自己能交的比賽
                Dictionary<string, object> contest = null;
                foreach (Dictionary<string, object> c in cs)
                {
                    if (Convert.ToBoolean(c["joined"])) { contest = c; break; }
                }
                Check("找得到已報名的比賽", contest != null, null);
                if (contest == null)
                {
                    Console.WriteLine("\n  沒有已報名的比賽，先跑 setup-test-contest.mjs");
                    return 1;
                }
                int contestId = Convert.ToInt32(contest["id"]);
                Console.WriteLine("      使用比賽 #" + contestId + " " + contest["title"] +
                                  "  (scoreMode=" + contest["scoreMode"] +
                                  ", joined=" + contest["joined"] + ")");

                // ── 3. 題目清單 ───────────────────────────
                Console.WriteLine("\n[3] 取得題目清單");
                body = Api.Send(baseUrl + "/api/contests/" + contestId + "/problems", "GET",
                                cookie, null, out setCookie, out serverDate);
                root = ser.Deserialize<Dictionary<string, object>>(body);
                List<Dictionary<string, object>> ps = Json.Array(root["problems"]);
                Check("回傳題目陣列", ps.Count > 0, ps.Count + " 題");

                List<string> allowed = new List<string>();
                System.Collections.IEnumerable la =
                    root["allowedLanguages"] as System.Collections.IEnumerable;
                if (la != null) foreach (object o in la) allowed.Add(Convert.ToString(o));
                Check("回傳可用語言限制", allowed.Count > 0,
                      allowed.Count == 0 ? "（不限制）" : string.Join(",", allowed.ToArray()));

                List<ProblemEntry> problems = new List<ProblemEntry>();
                foreach (Dictionary<string, object> p in ps)
                {
                    ProblemEntry pe = new ProblemEntry();
                    pe.ProblemId = Convert.ToInt32(p["problemId"]);
                    pe.Label = Convert.ToString(p["label"]);
                    pe.Title = p["title"] == null ? "" : Convert.ToString(p["title"]);
                    problems.Add(pe);
                    Console.WriteLine("      " + pe.Label + " -> problemId=" + pe.ProblemId +
                                      "  " + pe.Title);
                }

                // ── 4. 離線寫入 spool ─────────────────────
                Console.WriteLine("\n[4] 離線提交（寫入本機 spool）");
                Console.WriteLine("      spool 位置: " + Store.Root);
                foreach (string f in Directory.Exists(Store.PendingDir)
                         ? Directory.GetFiles(Store.PendingDir, "*.json") : new string[0])
                    File.Delete(f);
                foreach (string f in Directory.Exists(Store.UploadedDir)
                         ? Directory.GetFiles(Store.UploadedDir, "*.json") : new string[0])
                    File.Delete(f);

                DateTime baseTime = DateTime.UtcNow.AddMilliseconds(offset);
                List<SpoolItem> written = new List<SpoolItem>();
                for (int i = 0; i < 3; i++)
                {
                    ProblemEntry pe = problems[i % problems.Count];
                    SpoolItem item = new SpoolItem();
                    item.ClientKey = Guid.NewGuid().ToString("N");
                    item.ProblemId = pe.ProblemId;
                    item.Label = pe.Label;
                    item.Language = "cpp";
                    item.Code = "// 測試提交 " + i + "\nint main(){return 0;}\n";
                    item.SubmittedAt = baseTime.AddMinutes(-30 + i * 5)
                        .ToString("yyyy-MM-ddTHH:mm:ss.fffZ",
                                  System.Globalization.CultureInfo.InvariantCulture);
                    item.FileName = "test" + i + ".cpp";
                    Store.WritePending(item);
                    written.Add(item);
                }
                List<SpoolItem> pending = Store.ReadDir(Store.PendingDir);
                Check("spool 寫入後可讀回", pending.Count == 3, pending.Count + " 筆");
                Check("讀回的內容含中文且未損毀",
                      pending.All(x => x.Code.Contains("測試提交")), null);
                Check("依提交時間排序",
                      pending.SequenceEqual(pending.OrderBy(x => x.SubmittedAt)), null);

                // ── 5. 上傳 ───────────────────────────────
                Console.WriteLine("\n[5] 上傳到伺服器");
                string res1 = Upload(baseUrl, contestId, cookie, pending, ser);
                Dictionary<string, object> r1 =
                    ser.Deserialize<Dictionary<string, object>>(res1);
                Check("第一次上傳全部收下",
                      Convert.ToInt32(r1["accepted"]) == 3 &&
                      Convert.ToInt32(r1["duplicates"]) == 0,
                      "accepted=" + r1["accepted"] + " duplicates=" + r1["duplicates"]);

                // ── 6. 重複上傳 ───────────────────────────
                Console.WriteLine("\n[6] 重複上傳（測去重）");
                string res2 = Upload(baseUrl, contestId, cookie, pending, ser);
                Dictionary<string, object> r2 =
                    ser.Deserialize<Dictionary<string, object>>(res2);
                Check("第二次全部判定為重複",
                      Convert.ToInt32(r2["accepted"]) == 0 &&
                      Convert.ToInt32(r2["duplicates"]) == 3,
                      "accepted=" + r2["accepted"] + " duplicates=" + r2["duplicates"]);

                // ── 6b. 提交編號對應 ──────────────────────
                Console.WriteLine("\n[6b] 網站提交編號對應（查看結果連結要用）");
                Dictionary<string, int> idOf = new Dictionary<string, int>();
                foreach (Dictionary<string, object> r in Json.Array(r2["results"]))
                    idOf[Convert.ToString(r["clientKey"])] = Convert.ToInt32(r["submissionId"]);
                Check("每一筆都對得到編號", idOf.Count == pending.Count,
                      idOf.Count + " / " + pending.Count);
                Check("重複上傳時仍回傳既有編號（不是 0）",
                      idOf.Values.All(v => v > 0),
                      string.Join(",", idOf.Values.Select(v => v.ToString()).ToArray()));
                Check("編號各不相同", idOf.Values.Distinct().Count() == idOf.Count, null);

                // ── 7. 標記已上傳 ─────────────────────────
                Console.WriteLine("\n[7] 標記已上傳");
                foreach (SpoolItem it in pending)
                {
                    int sid;
                    if (!idOf.TryGetValue(it.ClientKey, out sid)) sid = 0;
                    Store.MarkUploaded(it.ClientKey, sid);
                }
                Check("pending 已清空", Store.ReadDir(Store.PendingDir).Count == 0, null);
                List<SpoolItem> done = Store.ReadDir(Store.UploadedDir);
                Check("uploaded 有 3 筆", done.Count == 3, null);
                Check("編號有寫進已上傳的檔案裡（重開程式後仍點得到連結）",
                      done.All(x => x.SubmissionId > 0),
                      string.Join(",", done.Select(x => "#" + x.SubmissionId).ToArray()));

                // ── 7b. 語言限制 ──────────────────────────
                Console.WriteLine("\n[7b] 語言限制（本比賽只開放 C++）");
                SpoolItem py = new SpoolItem();
                py.ClientKey = Guid.NewGuid().ToString("N");
                py.ProblemId = problems[0].ProblemId;
                py.Label = problems[0].Label;
                py.Language = "python";
                py.Code = "print(1)\n";
                py.SubmittedAt = baseTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ",
                    System.Globalization.CultureInfo.InvariantCulture);
                py.FileName = "bad.py";
                try
                {
                    Upload(baseUrl, contestId, cookie,
                           new List<SpoolItem>() { py }, ser);
                    Check("Python 提交應被伺服器拒絕", false, "竟然收下了");
                }
                catch (Exception ex)
                {
                    Check("Python 提交被伺服器拒絕", ex.Message.Contains("只開放"),
                          ex.Message);
                }

                SpoolItem cpp = new SpoolItem();
                cpp.ClientKey = Guid.NewGuid().ToString("N");
                cpp.ProblemId = problems[0].ProblemId;
                cpp.Label = problems[0].Label;
                cpp.Language = "cpp";
                cpp.Code = "int main(){}\n";
                cpp.SubmittedAt = py.SubmittedAt;
                cpp.FileName = "ok.cpp";
                try
                {
                    string r = Upload(baseUrl, contestId, cookie,
                                      new List<SpoolItem>() { cpp }, ser);
                    Dictionary<string, object> rr =
                        ser.Deserialize<Dictionary<string, object>>(r);
                    Check("C++ 提交仍然收下", Convert.ToInt32(rr["accepted"]) == 1,
                          "accepted=" + rr["accepted"]);
                }
                catch (Exception ex)
                {
                    Check("C++ 提交仍然收下", false, ex.Message);
                }

                // ── 8. 錯誤處理 ───────────────────────────
                Console.WriteLine("\n[8] 錯誤處理");
                try
                {
                    Api.Send(baseUrl + "/api/me/contests", "GET", "oj_session=bogus", null,
                             out setCookie, out serverDate);
                    Check("壞掉的 cookie 應該被拒絕", false, "竟然通過了");
                }
                catch (Exception ex)
                {
                    Check("壞掉的 cookie 被拒絕且有中文錯誤訊息",
                          ex.Message.Contains("登入"), ex.Message);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("\n  [FAIL] 未預期的例外: " + ex.GetType().Name +
                                  ": " + ex.Message);
                failures++;
            }

            Console.WriteLine("\n===== " + (failures == 0
                ? "全部通過" : failures + " 項失敗") + " =====");
            return failures == 0 ? 0 : 1;
        }

        // 起一條背景執行緒模擬瀏覽器導回，主執行緒等 WaitForCallback 的結果
        static LoopbackResult ProbeCallback(int port, string expectedState,
                                            string sendState, string token)
        {
            System.Threading.ThreadPool.QueueUserWorkItem(delegate
            {
                System.Threading.Thread.Sleep(400); // 等監聽起來
                try
                {
                    using (System.Net.Sockets.TcpClient c =
                           new System.Net.Sockets.TcpClient("127.0.0.1", port))
                    using (System.Net.Sockets.NetworkStream s = c.GetStream())
                    {
                        string req = "GET /callback?state=" +
                            Uri.EscapeDataString(sendState) + "&token=" +
                            Uri.EscapeDataString(token) +
                            " HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n";
                        byte[] b = Encoding.ASCII.GetBytes(req);
                        s.Write(b, 0, b.Length);
                        s.Flush();
                        // 讀掉回應，讓伺服器端寫得完
                        byte[] buf = new byte[1024];
                        try { s.Read(buf, 0, buf.Length); } catch { }
                    }
                }
                catch { }
            });
            return Loopback.WaitForCallback(port, expectedState, 8000);
        }

        static void SetField(Form form, string name, object value)
        {
            System.Reflection.FieldInfo fi = form.GetType().GetField(name,
                System.Reflection.BindingFlags.Instance |
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Public);
            if (fi != null) fi.SetValue(form, value);
        }

        static void InvokePrivate(Form form, string method)
        {
            System.Reflection.MethodInfo mi = form.GetType().GetMethod(method,
                System.Reflection.BindingFlags.Instance |
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Public);
            if (mi != null) mi.Invoke(form, null);
        }

        static void ReportBounds(StringBuilder sb, string name, Control c)
        {
            if (c == null) { sb.AppendLine(name + " = (找不到)"); return; }
            Control p = c.Parent;
            string parentSize = p == null ? "?" : p.ClientSize.Width + "x" + p.ClientSize.Height;
            bool visible = p != null && c.Left >= 0 && c.Top >= 0 &&
                           c.Right <= p.ClientSize.Width && c.Bottom <= p.ClientSize.Height;
            sb.AppendLine(string.Format("{0}: bounds={1} 父容器={2} {3}",
                name, c.Bounds.ToString(), parentSize,
                visible ? "可見" : "★ 超出父容器範圍，看不到"));
        }

        static T FindByText<T>(Control parent, string text) where T : Control
        {
            foreach (Control c in parent.Controls)
            {
                if (c is T && c.Text == text) return (T)c;
                T found = FindByText<T>(c, text);
                if (found != null) return found;
            }
            return null;
        }

        // 靠私有欄位名稱找（同一個組件，反射拿得到）
        static T FindByName<T>(Form form, string fieldName) where T : Control
        {
            System.Reflection.FieldInfo fi = form.GetType().GetField(fieldName,
                System.Reflection.BindingFlags.Instance |
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Public);
            return fi == null ? null : fi.GetValue(form) as T;
        }

        static void WalkControls(Control parent, StringBuilder sb, int depth)
        {
            foreach (Control c in parent.Controls)
            {
                string kind = c.GetType().Name;
                // 只記錄有意義的節點，避免輸出被 Label/Panel 淹沒
                if (kind == "TabPage" || kind == "Button" || kind == "RadioButton" ||
                    kind == "ComboBox" || kind == "ListView" || kind == "TabControl" ||
                    (kind == "TextBox" && ((TextBox)c).Multiline))
                {
                    sb.AppendLine(new string(' ', depth * 2) + kind + ": " +
                        (c.Text.Length > 0 ? c.Text : "(no text)"));
                }
                WalkControls(c, sb, depth + 1);
            }
        }

        static string WriteTemp(string name, string code)
        {
            string dir = Path.Combine(Store.Root, "srctest");
            Directory.CreateDirectory(dir);
            string p = Path.Combine(dir, name);
            File.WriteAllText(p, code, new System.Text.UTF8Encoding(false));
            return p;
        }

        static void RunLocalTests(string cc)
        {
            // 1) 正常程式：讀兩個數相加
            string ok = WriteTemp("ok.cpp",
                "#include <bits/stdc++.h>\nusing namespace std;\n" +
                "int main(){long long a,b;cin>>a>>b;cout<<a+b<<endl;return 0;}\n");
            RunOutcome r = Runner.CompileAndRun(cc, ok, "3 4\n", 5000);
            Check("正常程式編譯成功", !r.CompileFailed,
                  r.CompileFailed ? r.CompileError : null);
            Check("讀 stdin 並輸出正確結果",
                  Runner.Normalize(r.Stdout) == "7", "stdout=" + Json2(r.Stdout));
            Check("exit code 0", r.ExitCode == 0, "exit=" + r.ExitCode);

            // 2) 輸出比對：AC 與 WA 都要判對
            Check("輸出比對 AC（結尾換行差異不算錯）",
                  Runner.Normalize(r.Stdout) == Runner.Normalize("7\n"), null);
            Check("輸出比對 WA（答案不同要判錯）",
                  Runner.Normalize(r.Stdout) != Runner.Normalize("8"), null);

            // 3) 編譯錯誤
            string bad = WriteTemp("bad.cpp", "int main(){ this is not c++ }\n");
            RunOutcome rb = Runner.CompileAndRun(cc, bad, "", 5000);
            Check("編譯錯誤被攔下並帶出訊息",
                  rb.CompileFailed && !string.IsNullOrEmpty(rb.CompileError),
                  rb.CompileFailed ? "有訊息" : "竟然編過了");

            // 4) 無窮迴圈 -> 逾時中止
            string loop = WriteTemp("loop.cpp",
                "int main(){ while(true){} return 0; }\n");
            DateTime t0 = DateTime.UtcNow;
            RunOutcome rl = Runner.CompileAndRun(cc, loop, "", 2000);
            double waited = (DateTime.UtcNow - t0).TotalMilliseconds;
            Check("無窮迴圈被逾時中止", rl.TimedOut, null);
            Check("逾時後有真的把行程殺掉（沒有卡住）", waited < 30000,
                  Math.Round(waited) + " ms");

            // 5) 執行期錯誤（非零結束碼）
            string re = WriteTemp("re.cpp", "int main(){ return 3; }\n");
            RunOutcome rr = Runner.CompileAndRun(cc, re, "", 5000);
            Check("非零結束碼被回報", !rr.CompileFailed && rr.ExitCode == 3,
                  "exit=" + rr.ExitCode);

            // 6) 大量輸出不會卡死（非同步讀取的重點）
            string big = WriteTemp("big.cpp",
                "#include <cstdio>\nint main(){for(int i=0;i<20000;i++)printf(\"%d\\n\",i);return 0;}\n");
            RunOutcome rg = Runner.CompileAndRun(cc, big, "", 10000);
            string[] lines = Runner.Normalize(rg.Stdout).Split('\n');
            Check("大量輸出（2 萬行）不會卡死且完整",
                  !rg.TimedOut && lines.Length == 20000 && lines[19999] == "19999",
                  "行數=" + lines.Length);

            // 7) 程式不讀 stdin 也不該卡住
            string noin = WriteTemp("noin.cpp",
                "#include <cstdio>\nint main(){printf(\"hi\\n\");return 0;}\n");
            RunOutcome rn = Runner.CompileAndRun(cc, noin, "some input\n", 5000);
            Check("程式不讀 stdin 也能正常結束",
                  !rn.TimedOut && Runner.Normalize(rn.Stdout) == "hi", null);
        }

        static string Json2(string s)
        {
            if (s == null) return "null";
            return "\"" + s.Replace("\r", "\\r").Replace("\n", "\\n") + "\"";
        }

        static string Upload(string baseUrl, int contestId, string cookie,
                             List<SpoolItem> items, JavaScriptSerializer ser)
        {
            List<Dictionary<string, object>> subs = new List<Dictionary<string, object>>();
            foreach (SpoolItem it in items)
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

            string setCookie;
            DateTime? serverDate;
            return Api.Send(baseUrl + "/api/contests/" + contestId + "/offline-submissions",
                            "POST", cookie, ser.Serialize(payload), out setCookie, out serverDate);
        }
    }
}
