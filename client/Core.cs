// itouOJ 收件程式 — 核心（設定存取、HTTP、本機編譯執行）
//
// UI 在 MainForm.cs / Dialogs.cs。這裡刻意不碰 WinForms，方便 TestHarness
// 直接對這些類別做自動化測試。

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
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

        // 比賽起訖時間（ISO 8601 UTC）。斷網後就是靠這兩個值加上校正過的時鐘
        // 判斷「可以開始了沒」和「時間到了沒」—— 所有機器校正到同一個伺服器時間，
        // 就會在同一刻解鎖、同一刻關閉，不需要網路發號施令。
        public string StartTimeUtc { get; set; }
        public string EndTimeUtc { get; set; }

        // 題目 PDF 所在資料夾；檔名預設為「代號.pdf」（A.pdf、B.pdf…）
        public string ProblemDir { get; set; }
        // 檔名不照慣例時的個別覆寫
        public List<ProblemFile> ProblemFiles { get; set; }
        // 編譯器路徑；空白 = 自動偵測
        public string CompilerPath { get; set; }
        // 賽前設定分頁是否鎖定，以及解鎖用的 PIN 雜湊
        public bool Locked { get; set; }
        public string AdminPinHash { get; set; }

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
            ProblemDir = "";
            ProblemFiles = new List<ProblemFile>();
            CompilerPath = "";
            Locked = false;
            AdminPinHash = "";
            StartTimeUtc = "";
            EndTimeUtc = "";
        }
    }

    public class ProblemFile
    {
        public string Label { get; set; }
        public string Path { get; set; }
    }

    public class ProblemEntry
    {
        public int ProblemId { get; set; }
        public string Label { get; set; }
        public string Title { get; set; }
        public int TimeLimitMs { get; set; }
        public List<SampleCase> Samples { get; set; }

        public ProblemEntry()
        {
            TimeLimitMs = 1000;
            Samples = new List<SampleCase>();
        }
    }

    public class SampleCase
    {
        public string Input { get; set; }
        public string Output { get; set; }
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
        // 上傳成功後伺服器回傳的提交編號，用來組出「查看結果」的網址；0 = 尚未上傳
        public int SubmissionId { get; set; }
        // 提交當下登入的帳號。同一台機器換人登入時，不能讓後面的人把前一位
        // 尚未上傳的提交當成自己的送出去。
        public string Owner { get; set; }
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
        public static string DraftsDir { get { return Path.Combine(Root, "drafts"); } }
        public static string ConfigPath { get { return Path.Combine(Root, "config.json"); } }

        public static void EnsureDirs()
        {
            Directory.CreateDirectory(Root);
            Directory.CreateDirectory(PendingDir);
            Directory.CreateDirectory(UploadedDir);
            Directory.CreateDirectory(DraftsDir);
        }

        // 直接在程式裡打的程式碼要隨時落地。選手打了半小時的東西，不能因為
        // 當機或誤關視窗就消失——草稿跟提交是兩回事，草稿只是還沒送出的暫存。
        static string DraftPath(int contestId, string label)
        {
            string safe = label;
            foreach (char c in Path.GetInvalidFileNameChars())
                safe = safe.Replace(c, '_');
            return Path.Combine(DraftsDir, contestId + "-" + safe + ".cpp");
        }

        public static string ReadDraft(int contestId, string label)
        {
            try
            {
                string p = DraftPath(contestId, label);
                return File.Exists(p) ? File.ReadAllText(p, Encoding.UTF8) : "";
            }
            catch { return ""; }
        }

        // 只問「有沒有草稿」，不把內容讀出來。側欄題目徽章每題都要問一次，
        // 內容可能大到 64KB，讀全部只為了判斷存在太浪費。
        public static bool DraftExists(int contestId, string label)
        {
            try { return File.Exists(DraftPath(contestId, label)); }
            catch { return false; }
        }

        public static void WriteDraft(int contestId, string label, string code)
        {
            try
            {
                EnsureDirs();
                File.WriteAllText(DraftPath(contestId, label), code ?? "",
                                  new UTF8Encoding(false));
            }
            catch { /* 磁碟滿了之類的；不該讓存草稿失敗打斷作答 */ }
        }

        // 登出時要清掉。草稿是按「比賽+題號」存的、不綁使用者，
        // 同一台機器換人登入的話，後面那位會直接看到前一位寫的程式碼。
        public static int ClearDrafts()
        {
            int n = 0;
            try
            {
                if (!Directory.Exists(DraftsDir)) return 0;
                foreach (string f in Directory.GetFiles(DraftsDir, "*.cpp"))
                {
                    try { File.Delete(f); n++; } catch { }
                }
            }
            catch { }
            return n;
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
                if (c.ProblemFiles == null) c.ProblemFiles = new List<ProblemFile>();
                if (c.ProblemDir == null) c.ProblemDir = "";
                if (c.CompilerPath == null) c.CompilerPath = "";
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

        public static void MarkUploaded(string clientKey, int submissionId)
        {
            string from = Path.Combine(PendingDir, clientKey + ".json");
            string to = Path.Combine(UploadedDir, clientKey + ".json");
            try
            {
                if (!File.Exists(from)) return;

                // 順手把伺服器給的提交編號寫進去，之後才點得到「查看結果」
                if (submissionId > 0)
                {
                    JavaScriptSerializer ser = new JavaScriptSerializer();
                    ser.MaxJsonLength = 32 * 1024 * 1024;
                    SpoolItem item = ser.Deserialize<SpoolItem>(
                        File.ReadAllText(from, Encoding.UTF8));
                    if (item != null)
                    {
                        item.SubmissionId = submissionId;
                        File.WriteAllText(from, ser.Serialize(item), new UTF8Encoding(false));
                    }
                }

                if (File.Exists(to)) File.Delete(to);
                File.Move(from, to);
            }
            catch { /* 搬失敗頂多下次重傳，伺服器會用 clientKey 去重 */ }
        }
    }

    public class RunOutcome
    {
        public bool CompileFailed { get; set; }
        public string CompileError { get; set; }
        public string Stdout { get; set; }
        public string Stderr { get; set; }
        public int ExitCode { get; set; }
        public bool TimedOut { get; set; }
        public int ElapsedMs { get; set; }
    }

    // 本機測試執行：用選手電腦上的 g++ 編譯並執行。
    //
    // 這跟伺服器判題是兩回事——沒有沙箱、也不是同一版編譯器，只是讓選手在斷網時
    // 能確認「有沒有編譯過」和「範例對不對」。真正的判分還是等賽後上傳。
    public static class Runner
    {
        static readonly string[] CommonPaths = {
            @"C:\Program Files (x86)\Dev-Cpp\MinGW64\bin\g++.exe",
            @"C:\Program Files\Dev-Cpp\MinGW64\bin\g++.exe",
            @"C:\Dev-Cpp\MinGW64\bin\g++.exe",
            @"C:\MinGW\bin\g++.exe",
            @"C:\msys64\mingw64\bin\g++.exe",
            @"C:\msys64\ucrt64\bin\g++.exe",
            @"C:\TDM-GCC-64\bin\g++.exe",
            @"C:\Program Files\CodeBlocks\MinGW\bin\g++.exe",
            @"C:\Program Files (x86)\CodeBlocks\MinGW\bin\g++.exe",
        };

        public static string FindCompiler()
        {
            // 先看 PATH，機房若有自己安裝的工具鏈會優先用到
            string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
            foreach (string dir in pathEnv.Split(';'))
            {
                if (dir.Trim().Length == 0) continue;
                try
                {
                    string candidate = Path.Combine(dir.Trim(), "g++.exe");
                    if (File.Exists(candidate)) return candidate;
                }
                catch { /* PATH 裡有非法字元的項目 */ }
            }
            foreach (string p in CommonPaths)
            {
                if (File.Exists(p)) return p;
            }

            // winget 安裝的工具鏈（例如 WinLibs）會放在帶套件雜湊的資料夾底下，
            // 路徑寫不死，用萬用字元找。winget 雖然會把它加進使用者 PATH，
            // 但那要重開 shell 才生效，直接找檔案比較保險。
            try
            {
                string pkgRoot = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    @"Microsoft\WinGet\Packages");
                if (Directory.Exists(pkgRoot))
                {
                    foreach (string dir in Directory.GetDirectories(pkgRoot))
                    {
                        foreach (string sub in new string[] { "mingw64", "mingw32", "" })
                        {
                            string candidate = Path.Combine(
                                Path.Combine(dir, sub), "bin\\g++.exe");
                            if (File.Exists(candidate)) return candidate;
                        }
                    }
                }
            }
            catch { }

            return null;
        }

        static string WorkDir
        {
            get { return Path.Combine(Store.Root, "run"); }
        }

        // 編譯出來的程式會動態連結 libstdc++-6.dll / libgcc_s_seh-1.dll /
        // libwinpthread-1.dll，這些就放在編譯器的 bin 目錄裡。子行程的 PATH 若沒有
        // 這個目錄，程式一啟動就會以 0xC0000135（找不到 DLL）死掉——而且只有用到
        // <iostream> 的才會中招，printf 的程式看起來正常，非常容易漏掉。
        static bool stdinEncodingFixed = false;

        // .NET Framework 用 Console.InputEncoding 建立子行程的 StandardInput。
        // 若那個編碼帶前置位元組（主控台是 UTF-8 codepage 時就會），光是存取
        // StandardInput 就會先送出 BOM（EF BB BF），受測程式的 cin 第一個字元
        // 讀到它就整個解析失敗、拿到未初始化的值。
        //
        // 陰險的地方在於用 printf/scanf 的程式看起來完全正常，只有 <iostream>
        // 的會壞——而幾乎所有選手都用 cin。
        //
        // 沒有主控台時（GUI 模式）setter 會丟例外，但那種情況 .NET 會退回系統
        // ANSI 編碼，本來就沒有前置位元組，所以吞掉例外是安全的。
        static void EnsureStdinEncoding()
        {
            if (stdinEncodingFixed) return;
            stdinEncodingFixed = true;
            try
            {
                if (Console.InputEncoding.GetPreamble().Length > 0)
                    Console.InputEncoding = new UTF8Encoding(false);
            }
            catch { }
        }

        static void InheritCompilerPath(ProcessStartInfo si, string compiler)
        {
            try
            {
                string binDir = Path.GetDirectoryName(compiler);
                if (string.IsNullOrEmpty(binDir)) return;
                string current = Environment.GetEnvironmentVariable("PATH") ?? "";
                si.EnvironmentVariables["PATH"] = binDir + ";" + current;
            }
            catch { }
        }

        public static RunOutcome CompileAndRun(string compiler, string sourcePath,
                                               string stdin, int timeoutMs)
        {
            RunOutcome r = new RunOutcome();
            EnsureStdinEncoding();
            Directory.CreateDirectory(WorkDir);
            string exePath = Path.Combine(WorkDir, "a.exe");
            try { if (File.Exists(exePath)) File.Delete(exePath); }
            catch { }

            // ── 編譯 ──
            Process cc = new Process();
            cc.StartInfo.FileName = compiler;
            cc.StartInfo.Arguments = string.Format(
                "-O2 -std=c++17 -o \"{0}\" \"{1}\"", exePath, sourcePath);
            cc.StartInfo.UseShellExecute = false;
            cc.StartInfo.CreateNoWindow = true;
            cc.StartInfo.RedirectStandardError = true;
            cc.StartInfo.RedirectStandardOutput = true;
            cc.StartInfo.WorkingDirectory = WorkDir;
            InheritCompilerPath(cc.StartInfo, compiler);
            StringBuilder ccErr = new StringBuilder();
            cc.ErrorDataReceived += delegate (object s, DataReceivedEventArgs e)
            { if (e.Data != null) ccErr.AppendLine(e.Data); };
            cc.OutputDataReceived += delegate (object s, DataReceivedEventArgs e)
            { if (e.Data != null) ccErr.AppendLine(e.Data); };
            cc.Start();
            cc.BeginErrorReadLine();
            cc.BeginOutputReadLine();
            if (!cc.WaitForExit(30000))
            {
                try { cc.Kill(); } catch { }
                r.CompileFailed = true;
                r.CompileError = "編譯逾時（超過 30 秒）";
                return r;
            }
            cc.WaitForExit();

            if (cc.ExitCode != 0 || !File.Exists(exePath))
            {
                r.CompileFailed = true;
                r.CompileError = ccErr.Length > 0 ? ccErr.ToString() : "編譯失敗";
                return r;
            }

            // ── 執行 ──
            Process p = new Process();
            p.StartInfo.FileName = exePath;
            p.StartInfo.UseShellExecute = false;
            p.StartInfo.CreateNoWindow = true;
            p.StartInfo.RedirectStandardInput = true;
            p.StartInfo.RedirectStandardOutput = true;
            p.StartInfo.RedirectStandardError = true;
            p.StartInfo.WorkingDirectory = WorkDir;
            InheritCompilerPath(p.StartInfo, compiler);

            StringBuilder so = new StringBuilder();
            StringBuilder se = new StringBuilder();
            // 非同步讀取：先寫 stdin 再 ReadToEnd 的話，程式輸出量一大就會兩邊卡死
            p.OutputDataReceived += delegate (object s, DataReceivedEventArgs e)
            { if (e.Data != null) so.AppendLine(e.Data); };
            p.ErrorDataReceived += delegate (object s, DataReceivedEventArgs e)
            { if (e.Data != null) se.AppendLine(e.Data); };

            DateTime t0 = DateTime.UtcNow;
            p.Start();
            p.BeginOutputReadLine();
            p.BeginErrorReadLine();
            try
            {
                // 直接寫 BaseStream，不要用 StandardInput.Write：.NET Framework 的
                // StandardInput 會套用主控台的輸入編碼，在某些 host 下是 UTF-16，
                // 送出去的位元組中間夾雜 NUL，受測程式的 cin 會直接讀失敗而拿到
                // 未初始化的值——輸出看起來是亂數，很難察覺是輸入沒進去。
                // （.NET Framework 沒有 StandardInputEncoding 可設，只能走 BaseStream。）
                byte[] data = new UTF8Encoding(false).GetBytes(stdin ?? "");
                p.StandardInput.BaseStream.Write(data, 0, data.Length);
                p.StandardInput.BaseStream.Flush();
                p.StandardInput.Close();
            }
            catch { /* 程式沒讀 stdin 就先結束了，管線斷掉是正常的 */ }

            if (!p.WaitForExit(timeoutMs))
            {
                try { p.Kill(); } catch { }
                r.TimedOut = true;
                r.ElapsedMs = timeoutMs;
                try { p.WaitForExit(2000); } catch { }
                r.Stdout = so.ToString();
                r.Stderr = se.ToString();
                return r;
            }
            p.WaitForExit(); // 等非同步讀取收尾
            r.ElapsedMs = (int)(DateTime.UtcNow - t0).TotalMilliseconds;
            r.ExitCode = p.ExitCode;
            r.Stdout = so.ToString();
            r.Stderr = se.ToString();
            return r;
        }

        // 與伺服器 judge.ts 的 normalizeOutput 一致：
        // 去掉每行行尾空白、忽略結尾空行
        public static string Normalize(string text)
        {
            if (text == null) return "";
            string[] lines = text.Replace("\r\n", "\n").Split('\n');
            for (int i = 0; i < lines.Length; i++)
                lines[i] = lines[i].TrimEnd(' ', '\t');
            string joined = string.Join("\n", lines);
            return joined.TrimEnd('\n');
        }
    }

    // 賽前設定分頁的 PIN 鎖。
    //
    // 這是【防呆，不是防駭】：擋的是選手比賽中手滑把比賽切掉、或好奇亂改題目
    // 路徑。PIN 的雜湊存在本機 config.json，有檔案存取權的人刪掉 Locked 就解開了。
    // 真正的權限邊界在伺服器（報名檢查、語言限制、時間夾制），那些客戶端動不了。
    public static class AdminLock
    {
        public static string Hash(string pin)
        {
            using (System.Security.Cryptography.SHA256 sha =
                   System.Security.Cryptography.SHA256.Create())
            {
                byte[] b = sha.ComputeHash(Encoding.UTF8.GetBytes("itouOJ-admin:" + (pin ?? "")));
                StringBuilder sb = new StringBuilder();
                foreach (byte x in b) sb.Append(x.ToString("x2"));
                return sb.ToString();
            }
        }

        public static bool Verify(Config cfg, string pin)
        {
            if (cfg == null || string.IsNullOrEmpty(cfg.AdminPinHash)) return true;
            return Hash(pin) == cfg.AdminPinHash;
        }

        public static bool IsLocked(Config cfg)
        {
            return cfg != null && cfg.Locked && !string.IsNullOrEmpty(cfg.AdminPinHash);
        }
    }

    public enum ContestPhase { NotReady, Waiting, Running, Ended }

    // 選手看到的畫面。整個程式只有一處決定「現在該顯示什麼」，
    // 避免各個分頁自己判斷而出現互相矛盾的狀態。
    public enum Screen
    {
        NeedLogin,    // 還沒登入
        NeedContest,  // 登入了但還沒選比賽
        Waiting,      // 選好了，等開賽
        Answering,    // 作答中
        Ended         // 時間到，只剩上傳
    }

    public static class Flow
    {
        public static Screen Current(Config cfg)
        {
            if (cfg == null || string.IsNullOrEmpty(cfg.Cookie) ||
                string.IsNullOrEmpty(cfg.Username))
                return Screen.NeedLogin;
            if (cfg.ContestId <= 0 || cfg.Problems.Count == 0)
                return Screen.NeedContest;

            switch (Phase.Of(cfg))
            {
                case ContestPhase.Waiting: return Screen.Waiting;
                case ContestPhase.Ended: return Screen.Ended;
                default: return Screen.Answering;
            }
        }

        // 關掉程式時要不要回到初始狀態（清掉身分、比賽選擇、草稿）。
        //
        // 預設要 —— 同一台機器下一位開起來應該是全新的。但有兩種情況清了會害人
        // 交不出東西，寧可留著髒資料也不能清：
        //
        //   1. 已選比賽且比賽還沒結束。機房這時候是斷網的，而重新登入需要網路，
        //      清掉等於那台機器再也回不來。
        //   2. 還有沒上傳的提交。清掉身分之後那些提交會變成「別人的」，
        //      要原本那位重新登入才傳得出去。
        public static bool ShouldResetOnExit(Config cfg, int pendingCount)
        {
            if (cfg == null || string.IsNullOrEmpty(cfg.Username)) return false;

            Screen s = Current(cfg);
            if (s == Screen.Waiting || s == Screen.Answering) return false;

            if (pendingCount > 0) return false;

            return true;
        }
    }

    // 比賽現在處於哪個階段。
    //
    // 判斷完全靠本機時鐘 + 賽前校正值，不需要網路 —— 這是斷網比賽能「統一開始」
    // 的關鍵：每台機器在設定時都對過伺服器時間，所以它們算出來的開始/結束時刻一致。
    public static class Phase
    {
        public static DateTime NowUtc(Config cfg)
        {
            return DateTime.UtcNow.AddMilliseconds(cfg == null ? 0 : cfg.ClockOffsetMs);
        }

        public static DateTime? Parse(string iso)
        {
            if (string.IsNullOrEmpty(iso)) return null;
            DateTime d;
            if (DateTime.TryParse(iso, CultureInfo.InvariantCulture,
                    DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out d))
                return d;
            return null;
        }

        public static ContestPhase Of(Config cfg)
        {
            if (cfg == null || cfg.ContestId <= 0 || cfg.Problems.Count == 0)
                return ContestPhase.NotReady;

            DateTime? start = Parse(cfg.StartTimeUtc);
            DateTime? end = Parse(cfg.EndTimeUtc);
            // 沒有時間資訊就不要把選手擋在門外，當作進行中
            if (!start.HasValue || !end.HasValue) return ContestPhase.Running;

            DateTime now = NowUtc(cfg);
            if (now < start.Value) return ContestPhase.Waiting;
            if (now >= end.Value) return ContestPhase.Ended;
            return ContestPhase.Running;
        }

        // 剩餘時間；負值代表已過
        public static TimeSpan Until(Config cfg, string iso)
        {
            DateTime? t = Parse(iso);
            if (!t.HasValue) return TimeSpan.Zero;
            return t.Value - NowUtc(cfg);
        }

        public static string Clock(TimeSpan t)
        {
            if (t.TotalSeconds < 0) t = TimeSpan.Zero;
            return string.Format("{0:00}:{1:00}:{2:00}",
                (int)t.TotalHours, t.Minutes, t.Seconds);
        }
    }

    // 題目 PDF 有設密碼保護時，伺服器給的是 AES-256-CBC 加密過的位元組
    // （lib/pdfCrypto.ts 加密、這裡對稱解密），格式是 [iv 16 bytes][密文]，
    // key = SHA256(密碼)。用 CBC 不用 GCM：AesGcm 是 .NET Core 3.0+ 才有的
    // API，.NET Framework 4.x 沒有，CBC 才是伺服器/收件程式雙邊都不必額外
    // 裝套件就能用的交集——這裡要的只是賽前不給看，不是防篡改。
    public static class PdfCrypto
    {
        const int IvLen = 16;

        public static byte[] Decrypt(byte[] blob, string password)
        {
            byte[] key;
            using (System.Security.Cryptography.SHA256 sha =
                   System.Security.Cryptography.SHA256.Create())
            {
                key = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            }

            byte[] iv = new byte[IvLen];
            Array.Copy(blob, 0, iv, 0, IvLen);
            byte[] ciphertext = new byte[blob.Length - IvLen];
            Array.Copy(blob, IvLen, ciphertext, 0, ciphertext.Length);

            using (System.Security.Cryptography.Aes aes =
                   System.Security.Cryptography.Aes.Create())
            {
                aes.Mode = System.Security.Cryptography.CipherMode.CBC;
                aes.Padding = System.Security.Cryptography.PaddingMode.PKCS7;
                aes.Key = key;
                aes.IV = iv;
                using (System.Security.Cryptography.ICryptoTransform dec = aes.CreateDecryptor())
                {
                    return dec.TransformFinalBlock(ciphertext, 0, ciphertext.Length);
                }
            }
        }
    }

    public static class ProblemDoc
    {
        // 題目檔的解析順序：個別覆寫 > 資料夾裡的「代號.pdf」。
        // 回傳 null 代表沒設定或檔案不存在，UI 要據此停用「開啟題目」。
        public static string Resolve(Config cfg, string label)
        {
            if (cfg == null || string.IsNullOrEmpty(label)) return null;

            if (cfg.ProblemFiles != null)
            {
                foreach (ProblemFile pf in cfg.ProblemFiles)
                {
                    if (pf == null || pf.Label != label) continue;
                    if (string.IsNullOrEmpty(pf.Path)) continue;
                    string over = pf.Path;
                    // 相對路徑就當作是相對於題目資料夾
                    if (!Path.IsPathRooted(over) && !string.IsNullOrEmpty(cfg.ProblemDir))
                        over = Path.Combine(cfg.ProblemDir, over);
                    return File.Exists(over) ? over : null;
                }
            }

            if (string.IsNullOrEmpty(cfg.ProblemDir)) return null;
            if (!Directory.Exists(cfg.ProblemDir)) return null;

            // PDF 優先；沒有的話收 HTML（scripts/export-problems.mjs 的輸出格式），
            // 兩者都能用系統預設程式開啟。子資料夾也一併搜尋——監考可能把題目檔
            // 分資料夾整理，甚至刻意藏在裡面一層避免選手在資料夾裡翻到別題，
            // 只找最外層會找不到。
            foreach (string ext in new string[] { ".pdf", ".html", ".htm" })
            {
                string[] hits;
                try
                {
                    hits = Directory.GetFiles(cfg.ProblemDir, label + ext, SearchOption.AllDirectories);
                }
                catch { continue; } // 資料夾在搜尋過程中被移動/移除之類的意外，跳過這個副檔名
                if (hits.Length > 0) return hits[0];
            }
            return null;
        }

        // 從伺服器下載的題目文件放這裡，跟管理員手動指定的 ProblemDir 分開，
        // 不會互相覆蓋。
        public static string CacheDir(int contestId)
        {
            return Path.Combine(Store.Root, "problem-docs", contestId.ToString());
        }

        // 下載一題的題目文件（PDF 優先，伺服器沒有上傳 PDF 就是現場產生的 HTML），
        // 存到本機快取。伺服器會自己決定現在准不准下載（賽前又沒開放提前下載
        // 就會回 403），這裡遇到任何失敗都回傳 null，呼叫端要當作「這題暫時
        // 拿不到文件」處理，不能讓一題失敗擋住其他題目或整個賽前設定流程。
        public static string DownloadAndCache(string serverUrl, string cookie, int contestId, string label)
        {
            if (string.IsNullOrEmpty(serverUrl) || string.IsNullOrEmpty(cookie) ||
                string.IsNullOrEmpty(label))
                return null;

            string url = serverUrl + "/api/contests/" + contestId +
                         "/problems/" + Uri.EscapeDataString(label) + "/doc";
            try
            {
                string contentType, pdfPassword;
                byte[] bytes = Api.SendBinary(url, cookie, out contentType, out pdfPassword);
                // 有密碼代表伺服器給的是加密過的位元組（一定是 PDF——HTML 版本
                // 不會加密），contentType 這時是 octet-stream，不能用它判斷副檔名。
                string ext = pdfPassword != null ? ".pdf"
                    : (contentType != null &&
                       contentType.IndexOf("pdf", StringComparison.OrdinalIgnoreCase) >= 0)
                        ? ".pdf" : ".html";
                string dir = CacheDir(contestId);
                Directory.CreateDirectory(dir);
                string path = Path.Combine(dir, label + ext);
                File.WriteAllBytes(path, bytes);

                // 密碼跟加密檔放在同一個快取資料夾裡的 sidecar 檔——開賽前這個
                // 密碼就已經在選手機上了，跟直接把明碼檔案佈署上去比起來，
                // 至少不會被隨手打開；OnOpenProblem 會在真的開賽後才讀它來解密。
                string passPath = path + ".pass";
                if (pdfPassword != null) File.WriteAllText(passPath, pdfPassword);
                else if (File.Exists(passPath)) File.Delete(passPath);

                return path;
            }
            catch
            {
                return null;
            }
        }
    }

    public class LoopbackResult
    {
        public bool Ok { get; set; }
        public string Token { get; set; }
        public string Error { get; set; }
    }

    // 瀏覽器登入的本機接收端（同 gh CLI / AWS CLI 那套 loopback 做法）。
    //
    // 流程：在 127.0.0.1 開一個臨時 port → 用預設瀏覽器打開授權頁 →
    // 使用者在網頁上登入（帳密 / Google / Discord 都行）並確認 →
    // 瀏覽器把 token 導回這個 port。
    //
    // 用 TcpListener 自己講最簡單的 HTTP，而不是 HttpListener：後者在多數
    // 前綴上需要 urlacl 或管理員權限，機房的受限帳號很可能註冊不了。
    public static class Loopback
    {
        public static int FindFreePort()
        {
            TcpListener probe = new TcpListener(IPAddress.Loopback, 0);
            probe.Start();
            int port = ((IPEndPoint)probe.LocalEndpoint).Port;
            probe.Stop();
            return port;
        }

        public static string NewState()
        {
            byte[] b = new byte[18];
            using (System.Security.Cryptography.RandomNumberGenerator rng =
                   System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(b);
            }
            // 授權頁用 [A-Za-z0-9_-]{8,64} 驗證，所以要用 URL-safe 的字元
            return Convert.ToBase64String(b)
                .Replace('+', '-').Replace('/', '_').TrimEnd('=');
        }

        // 等瀏覽器把 token 導回來。expectedState 不符就拒絕 —— 否則別的網頁
        // 也能對著這個 port 亂送東西，把使用者登入成別人的帳號。
        public static LoopbackResult WaitForCallback(
            int port, string expectedState, int timeoutMs)
        {
            LoopbackResult result = new LoopbackResult();
            TcpListener listener = new TcpListener(IPAddress.Loopback, port);
            try
            {
                listener.Start();
                DateTime deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);

                while (DateTime.UtcNow < deadline)
                {
                    if (!listener.Pending())
                    {
                        System.Threading.Thread.Sleep(120);
                        continue;
                    }

                    using (TcpClient client = listener.AcceptTcpClient())
                    using (NetworkStream stream = client.GetStream())
                    {
                        client.ReceiveTimeout = 5000;
                        string requestLine = ReadRequestLine(stream);
                        string query = QueryOf(requestLine);

                        string state = GetParam(query, "state");
                        string token = GetParam(query, "token");

                        if (string.IsNullOrEmpty(token))
                        {
                            // 瀏覽器可能會先來要 favicon 之類的，不是回呼就忽略
                            Respond(stream, "等待授權中…", false);
                            continue;
                        }
                        if (state != expectedState)
                        {
                            Respond(stream, "驗證失敗：state 不符，請重新登入。", true);
                            result.Error = "state 不符（可能不是這次登入發起的請求）";
                            return result;
                        }

                        Respond(stream, "登入成功，請回到收件程式。這個分頁可以關閉了。", false);
                        result.Ok = true;
                        result.Token = token;
                        return result;
                    }
                }
                result.Error = "等待逾時";
                return result;
            }
            catch (Exception ex)
            {
                result.Error = ex.Message;
                return result;
            }
            finally
            {
                try { listener.Stop(); } catch { }
            }
        }

        static string ReadRequestLine(NetworkStream stream)
        {
            StringBuilder sb = new StringBuilder();
            byte[] one = new byte[1];
            // 只需要第一行（GET /callback?... HTTP/1.1）
            while (sb.Length < 8192)
            {
                int n = stream.Read(one, 0, 1);
                if (n <= 0) break;
                if (one[0] == (byte)'\n') break;
                if (one[0] != (byte)'\r') sb.Append((char)one[0]);
            }
            return sb.ToString();
        }

        static string QueryOf(string requestLine)
        {
            int q = requestLine.IndexOf('?');
            if (q < 0) return "";
            int sp = requestLine.IndexOf(' ', q);
            return sp < 0 ? requestLine.Substring(q + 1)
                          : requestLine.Substring(q + 1, sp - q - 1);
        }

        static string GetParam(string query, string name)
        {
            foreach (string pair in query.Split('&'))
            {
                int eq = pair.IndexOf('=');
                if (eq <= 0) continue;
                if (pair.Substring(0, eq) != name) continue;
                return Uri.UnescapeDataString(pair.Substring(eq + 1));
            }
            return null;
        }

        static void Respond(NetworkStream stream, string message, bool isError)
        {
            string color = isError ? "#c62828" : "#1b5e20";
            string html =
                "<!DOCTYPE html><html lang=\"zh-Hant\"><head><meta charset=\"utf-8\">" +
                "<title>itouOJ 收件程式</title></head>" +
                "<body style=\"font-family:'Microsoft JhengHei',sans-serif;" +
                "display:flex;align-items:center;justify-content:center;height:90vh;margin:0\">" +
                "<div style=\"text-align:center\">" +
                "<div style=\"font-size:20px;color:" + color + "\">" + message + "</div>" +
                "</div></body></html>";
            byte[] body = Encoding.UTF8.GetBytes(html);
            byte[] head = Encoding.ASCII.GetBytes(
                "HTTP/1.1 200 OK\r\n" +
                "Content-Type: text/html; charset=utf-8\r\n" +
                "Content-Length: " + body.Length + "\r\n" +
                "Connection: close\r\n\r\n");
            stream.Write(head, 0, head.Length);
            stream.Write(body, 0, body.Length);
            stream.Flush();
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

            // 時鐘校正要扣掉「這趟來回花了多久」，不然網路慢（DNS、TLS 握手、
            // 第一次連線）會被整段算成時鐘飄移。t0 到收到 headers 那一刻（下面
            // 的 t1）之間的時間，假設去回各佔一半，serverDate 往前補半趟——
            // 呼叫端在這之後不久就會拿 serverDate 去減自己那時的 UtcNow，
            // 這樣补過的值才會逼近真正的時鐘差，而不是把整趟網路延遲也算進去。
            DateTime t0 = DateTime.UtcNow;
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
            DateTime t1 = DateTime.UtcNow;

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
                        double halfTripMs = (t1 - t0).TotalMilliseconds / 2.0;
                        serverDate = parsed.AddMilliseconds(halfTripMs);
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

        // 給下載題目文件用：伺服器回的是 PDF 或 HTML，不是 JSON，用 StreamReader
        // 硬轉文字會把 PDF 的二進位內容弄壞，所以另外開一個回傳原始位元組的版本。
        // pdfPassword 非 null 代表這份是加密過的 PDF（伺服器用
        // X-Itouoj-Pdf-Password-B64 header 帶密碼過來，這裡解 base64 還原）。
        public static byte[] SendBinary(string url, string cookie, out string contentType,
                                         out string pdfPassword)
        {
            contentType = null;
            pdfPassword = null;
            HttpWebRequest req = Build(url, "GET", cookie);
            req.Accept = "*/*";

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
                contentType = resp.ContentType;
                string passB64 = resp.Headers["X-Itouoj-Pdf-Password-B64"];
                if (!string.IsNullOrEmpty(passB64))
                {
                    try { pdfPassword = Encoding.UTF8.GetString(Convert.FromBase64String(passB64)); }
                    catch { pdfPassword = null; }
                }
                using (MemoryStream ms = new MemoryStream())
                {
                    resp.GetResponseStream().CopyTo(ms);
                    byte[] bytes = ms.ToArray();
                    if ((int)resp.StatusCode >= 400)
                    {
                        throw new ApplicationException(
                            ExtractError(Encoding.UTF8.GetString(bytes), (int)resp.StatusCode));
                    }
                    return bytes;
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

        // 給抓 GitHub release 附件用：公開資源，不帶 cookie。GitHub 的下載連結
        // 會 302 轉到 objects.githubusercontent.com，HttpWebRequest 預設就會
        // 自動跟著轉址，不用特別處理。
        public static byte[] DownloadPublic(string url, int timeoutMs)
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
            req.Method = "GET";
            req.UserAgent = "itouOJ-OfflineSubmit";
            req.Timeout = timeoutMs;
            req.ReadWriteTimeout = timeoutMs;
            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
            using (MemoryStream ms = new MemoryStream())
            {
                resp.GetResponseStream().CopyTo(ms);
                return ms.ToArray();
            }
        }
    }

    public class LatestRelease
    {
        public string Tag;
        public string ExeDownloadUrl; // null 代表這個 release 沒有附 itouOJ-Submit.exe
    }

    // 版本檢查：選手是從 GitHub Releases 下載收件程式的（見 RELEASING.md），
    // 所以「最新版」就是 GitHub 上最新的 release tag，不需要另外做伺服器端機制。
    public static class UpdateCheck
    {
        // 這台編譯出來的收件程式版本。發新版、跑 client/release.ps1 -Tag vX.Y.Z
        // 時記得同步把這裡改成同一個版號，否則版本檢查會失準。
        public const string ClientVersion = "1.2.13";

        // 查 GitHub 最新 release（tag 跟 itouOJ-Submit.exe 附件的下載連結）；
        // 查不到（沒有網路、API 限流等）就回傳 null，呼叫端要當作
        // 「查不到，不要擋使用者」處理。
        public static LatestRelease FetchLatestRelease()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(
                    "https://api.github.com/repos/itousouta15/itouOJ/releases/latest");
                req.Method = "GET";
                req.UserAgent = "itouOJ-OfflineSubmit"; // GitHub API 沒有 User-Agent 會直接拒絕
                req.Accept = "application/vnd.github+json";
                req.Timeout = 6000;
                req.ReadWriteTimeout = 6000;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                using (StreamReader sr = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                {
                    string body = sr.ReadToEnd();
                    JavaScriptSerializer ser = new JavaScriptSerializer();
                    Dictionary<string, object> d = ser.Deserialize<Dictionary<string, object>>(body);
                    object tag;
                    if (d == null || !d.TryGetValue("tag_name", out tag)) return null;

                    string exeUrl = null;
                    object assetsObj;
                    if (d.TryGetValue("assets", out assetsObj))
                    {
                        foreach (Dictionary<string, object> asset in Json.Array(assetsObj))
                        {
                            object name;
                            if (asset.TryGetValue("name", out name) &&
                                string.Equals(Convert.ToString(name), "itouOJ-Submit.exe",
                                    StringComparison.OrdinalIgnoreCase))
                            {
                                object url;
                                if (asset.TryGetValue("browser_download_url", out url))
                                    exeUrl = Convert.ToString(url);
                                break;
                            }
                        }
                    }
                    return new LatestRelease { Tag = Convert.ToString(tag), ExeDownloadUrl = exeUrl };
                }
            }
            catch { return null; }
        }

        public static string FetchLatestTag()
        {
            LatestRelease r = FetchLatestRelease();
            return r == null ? null : r.Tag;
        }

        // current 沒有 v 前綴、latestTag 有沒有都可以；逐段數字比較
        // （字串比較會把 "1.2.10" 判成比 "1.2.9" 小，所以不能直接比字串）。
        public static bool IsOlderThan(string current, string latestTag)
        {
            if (string.IsNullOrEmpty(latestTag)) return false;
            int[] a = ParseVersion(current);
            int[] b = ParseVersion(latestTag);
            for (int i = 0; i < 3; i++)
            {
                if (a[i] != b[i]) return a[i] < b[i];
            }
            return false;
        }

        static int[] ParseVersion(string s)
        {
            int[] parts = new int[3];
            if (string.IsNullOrEmpty(s)) return parts;
            s = s.Trim();
            if (s.Length > 0 && (s[0] == 'v' || s[0] == 'V')) s = s.Substring(1);
            string[] segs = s.Split('.');
            for (int i = 0; i < 3 && i < segs.Length; i++)
            {
                int v;
                int.TryParse(segs[i], out v);
                parts[i] = v;
            }
            return parts;
        }

        // 開程式前先檢查、有新版就直接換掉重開，選手不用自己點連結下載。
        // 回傳 true 代表已經在背景交給新版重啟，這個行程接下來該直接結束，
        // 不要再開 MainForm（不然舊、新兩個視窗會同時出現）。
        //
        // 任何一步失敗（沒網路、下載失敗、寫檔失敗……）都直接回傳 false，
        // 讓呼叫端照舊開啟目前這一份——版本檢查絕對不能變成「開不了程式」。
        public static bool CheckAndSelfUpdate(string[] launchArgs)
        {
            LatestRelease latest = FetchLatestRelease();
            if (latest == null || string.IsNullOrEmpty(latest.ExeDownloadUrl)) return false;
            if (!IsOlderThan(ClientVersion, latest.Tag)) return false;

            byte[] newExeBytes;
            try
            {
                newExeBytes = Api.DownloadPublic(latest.ExeDownloadUrl, 15000);
            }
            catch { return false; }
            // 明顯不像正常大小的 exe 就當作下載壞了，不要拿去蓋掉目前能用的版本
            if (newExeBytes == null || newExeBytes.Length < 20 * 1024) return false;

            try
            {
                string currentExe = Application.ExecutablePath;
                string tempDir = Path.Combine(Path.GetTempPath(), "itouoj-update");
                Directory.CreateDirectory(tempDir);
                string newExePath = Path.Combine(tempDir, "itouOJ-Submit.new.exe");
                File.WriteAllBytes(newExePath, newExeBytes);

                // 用 PowerShell 而不是 .bat：機房路徑常常帶中文字（桌面、比賽資料夾
                // 名稱之類的），.bat 靠系統內碼頁解讀很容易亂碼失敗，PowerShell
                // 這裡整段用 -EncodedCommand（UTF-16LE + base64）傳，不受內碼頁影響。
                //
                // 現在這個行程還占著 currentExe 這個檔案，蓋不過去，所以真正的
                // 複製要等這個行程結束——用重試迴圈等，而不是猜一個固定的
                // Start-Sleep 秒數。
                string arg0 = (launchArgs != null && launchArgs.Length > 0) ? launchArgs[0] : null;
                string script =
                    "$target = " + PsQuote(currentExe) + "\n" +
                    "$newFile = " + PsQuote(newExePath) + "\n" +
                    "for ($i = 0; $i -lt 20; $i++) {\n" +
                    "  try { Copy-Item -Path $newFile -Destination $target -Force -ErrorAction Stop; break }\n" +
                    "  catch { Start-Sleep -Seconds 1 }\n" +
                    "}\n" +
                    "Start-Process -FilePath $target" +
                    (arg0 != null ? " -ArgumentList @(" + PsQuote(arg0) + ")" : "") + "\n" +
                    "Remove-Item -Path $newFile -Force -ErrorAction SilentlyContinue\n";

                string encoded = Convert.ToBase64String(Encoding.Unicode.GetBytes(script));
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand " + encoded,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                };
                Process.Start(psi);
                return true;
            }
            catch { return false; }
        }

        static string PsQuote(string s)
        {
            return "'" + s.Replace("'", "''") + "'";
        }
    }
}
