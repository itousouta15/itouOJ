// 收件程式的端對端測試（只在開發時建置，不會進到發給選手的 exe）。
//
// 跟 OfflineSubmit.cs 一起編譯，用 /main:ItouOJ.TestHarness 換掉進入點，
// 這樣測到的是 GUI 實際會用的同一份 Api / Store 程式碼，而不是另外寫的仿冒品。
//
// 用法：TestHarness.exe <伺服器網址> <帳號> <密碼>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Script.Serialization;

namespace ItouOJ
{
    public static class TestHarness
    {
        static int failures = 0;

        static void Check(string name, bool ok, string detail)
        {
            Console.WriteLine((ok ? "  [PASS] " : "  [FAIL] ") + name +
                              (detail == null ? "" : "  -> " + detail));
            if (!ok) failures++;
        }

        public static int Main(string[] args)
        {
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

                Dictionary<string, object> contest = cs[0];
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

                // ── 7. 標記已上傳 ─────────────────────────
                Console.WriteLine("\n[7] 標記已上傳");
                foreach (SpoolItem it in pending) Store.MarkUploaded(it.ClientKey);
                Check("pending 已清空", Store.ReadDir(Store.PendingDir).Count == 0, null);
                Check("uploaded 有 3 筆", Store.ReadDir(Store.UploadedDir).Count == 3, null);

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
