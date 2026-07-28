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
            // PDF 優先；沒有的話收 HTML（scripts/export-problems.mjs 的輸出格式），
            // 兩者都能用系統預設程式開啟
            foreach (string ext in new string[] { ".pdf", ".PDF", ".html", ".htm" })
            {
                string p = Path.Combine(cfg.ProblemDir, label + ext);
                if (File.Exists(p)) return p;
            }
            return null;
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
}
