// itouOJ 收件程式 — 對話框（測試執行、管理員設定）

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
    // 輸入 / 設定 PIN 的小對話框
    public class PinDialog : Form
    {
        TextBox txtPin, txtConfirm;
        public string Pin { get; private set; }

        public PinDialog(string title, string message, bool confirm)
        {
            Text = title;
            Size = new Size(420, confirm ? 250 : 210);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterParent;
            Font = new Font("Microsoft JhengHei UI", 9F);
            Pin = "";

            Label lbl = new Label();
            lbl.SetBounds(16, 14, 380, 56);
            lbl.Text = message;
            Controls.Add(lbl);

            Label l1 = new Label();
            l1.SetBounds(16, 78, 60, 20);
            l1.Text = "PIN";
            Controls.Add(l1);

            txtPin = new TextBox();
            txtPin.SetBounds(80, 75, 200, 23);
            txtPin.UseSystemPasswordChar = true;
            txtPin.MaxLength = 32;
            Controls.Add(txtPin);

            if (confirm)
            {
                Label l2 = new Label();
                l2.SetBounds(16, 110, 60, 20);
                l2.Text = "再一次";
                Controls.Add(l2);

                txtConfirm = new TextBox();
                txtConfirm.SetBounds(80, 107, 200, 23);
                txtConfirm.UseSystemPasswordChar = true;
                txtConfirm.MaxLength = 32;
                Controls.Add(txtConfirm);
            }

            Button ok = new Button();
            ok.SetBounds(190, confirm ? 155 : 120, 90, 30);
            ok.Text = "確定";
            ok.Click += delegate
            {
                if (txtPin.Text.Length < 4)
                {
                    MessageBox.Show(this, "PIN 至少 4 個字元。", "PIN 太短");
                    return;
                }
                if (txtConfirm != null && txtPin.Text != txtConfirm.Text)
                {
                    MessageBox.Show(this, "兩次輸入不一致。", "請重新輸入");
                    return;
                }
                Pin = txtPin.Text;
                DialogResult = DialogResult.OK;
                Close();
            };
            Controls.Add(ok);
            AcceptButton = ok;

            Button cancel = new Button();
            cancel.SetBounds(290, confirm ? 155 : 120, 90, 30);
            cancel.Text = "取消";
            cancel.DialogResult = DialogResult.Cancel;
            Controls.Add(cancel);
            CancelButton = cancel;
        }
    }

    // 管理員設定：題目 PDF 位置與編譯器路徑。
    //
    // 設定寫在 config.json，所以監考在一台機器上設好之後，可以直接把那個檔案
    // 複製到其他機器（或把整個 ITOUOJ_HOME 指到共用資料夾）省去逐台設定。
    public class SettingsDialog : Form
    {
        readonly Config cfg;
        TextBox txtDir, txtCompiler;
        ListView lvProblems;
        Label lblCompilerStatus;

        public SettingsDialog(Config cfg)
        {
            this.cfg = cfg;
            BuildUi();
            Reload();
        }

        void BuildUi()
        {
            Text = "管理員設定";
            Size = new Size(640, 520);
            MinimumSize = new Size(560, 440);
            Font = new Font("Microsoft JhengHei UI", 9F);
            StartPosition = FormStartPosition.CenterParent;

            Label l1 = new Label();
            l1.SetBounds(12, 14, 560, 20);
            l1.Text = "題目 PDF 資料夾（檔名用題目代號，例如 A.pdf、B.pdf）";
            Controls.Add(l1);

            txtDir = new TextBox();
            txtDir.SetBounds(12, 36, 500, 23);
            txtDir.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            txtDir.TextChanged += delegate { cfg.ProblemDir = txtDir.Text.Trim(); Reload(); };
            Controls.Add(txtDir);

            Button bDir = new Button();
            bDir.SetBounds(520, 35, 90, 25);
            bDir.Text = "瀏覽…";
            bDir.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            bDir.Click += delegate
            {
                FolderBrowserDialog d = new FolderBrowserDialog();
                d.Description = "選擇放題目 PDF 的資料夾";
                if (Directory.Exists(txtDir.Text.Trim())) d.SelectedPath = txtDir.Text.Trim();
                if (d.ShowDialog(this) == DialogResult.OK) txtDir.Text = d.SelectedPath;
            };
            Controls.Add(bDir);

            Label l2 = new Label();
            l2.SetBounds(12, 70, 560, 20);
            l2.Text = "各題對應（雙擊可個別指定檔案；找不到的會顯示為未設定）";
            Controls.Add(l2);

            lvProblems = new ListView();
            lvProblems.SetBounds(12, 92, 598, 240);
            lvProblems.View = View.Details;
            lvProblems.FullRowSelect = true;
            lvProblems.GridLines = true;
            lvProblems.Anchor = AnchorStyles.Top | AnchorStyles.Bottom |
                                AnchorStyles.Left | AnchorStyles.Right;
            lvProblems.Columns.Add("代號", 60);
            lvProblems.Columns.Add("題目", 180);
            lvProblems.Columns.Add("檔案", 340);
            lvProblems.DoubleClick += OnPickFile;
            Controls.Add(lvProblems);

            Label l3 = new Label();
            l3.SetBounds(12, 344, 560, 20);
            l3.Text = "C++ 編譯器（留空 = 自動偵測 PATH 與常見安裝位置）";
            l3.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            Controls.Add(l3);

            txtCompiler = new TextBox();
            txtCompiler.SetBounds(12, 366, 500, 23);
            txtCompiler.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            txtCompiler.TextChanged += delegate
            {
                cfg.CompilerPath = txtCompiler.Text.Trim();
                UpdateCompilerStatus();
            };
            Controls.Add(txtCompiler);

            Button bCc = new Button();
            bCc.SetBounds(520, 365, 90, 25);
            bCc.Text = "瀏覽…";
            bCc.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
            bCc.Click += delegate
            {
                OpenFileDialog d = new OpenFileDialog();
                d.Filter = "g++.exe|g++.exe|所有檔案|*.*";
                d.Title = "選擇 g++.exe";
                if (d.ShowDialog(this) == DialogResult.OK) txtCompiler.Text = d.FileName;
            };
            Controls.Add(bCc);

            lblCompilerStatus = new Label();
            lblCompilerStatus.SetBounds(12, 394, 598, 20);
            lblCompilerStatus.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            Controls.Add(lblCompilerStatus);

            Button bLock = new Button();
            bLock.SetBounds(12, 424, 150, 32);
            bLock.Text = AdminLock.IsLocked(cfg) ? "變更 PIN / 解除鎖定" : "設定 PIN 並鎖定";
            bLock.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            bLock.Click += OnLockClicked;
            Controls.Add(bLock);

            Label hint = new Label();
            hint.SetBounds(172, 430, 320, 36);
            hint.Text = "鎖定後選手看不到「賽前設定」的內容。";
            hint.ForeColor = Color.Gray;
            hint.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
            Controls.Add(hint);

            Button bOk = new Button();
            bOk.SetBounds(500, 428, 110, 32);
            bOk.Text = "完成";
            bOk.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
            bOk.Click += delegate { Store.SaveConfig(cfg); DialogResult = DialogResult.OK; Close(); };
            Controls.Add(bOk);
            AcceptButton = bOk;
        }

        void Reload()
        {
            if (txtDir.Text != cfg.ProblemDir) txtDir.Text = cfg.ProblemDir;
            if (txtCompiler.Text != cfg.CompilerPath) txtCompiler.Text = cfg.CompilerPath;

            lvProblems.Items.Clear();
            foreach (ProblemEntry p in cfg.Problems)
            {
                string resolved = ProblemDoc.Resolve(cfg, p.Label);
                ListViewItem it = new ListViewItem(p.Label);
                it.SubItems.Add(string.IsNullOrEmpty(p.Title) ? "（未公開）" : p.Title);
                it.SubItems.Add(resolved ?? "未設定 / 找不到檔案");
                it.ForeColor = resolved == null ? Color.Firebrick : Color.DarkGreen;
                it.Tag = p.Label;
                lvProblems.Items.Add(it);
            }
            if (cfg.Problems.Count == 0)
            {
                ListViewItem it = new ListViewItem("");
                it.SubItems.Add("尚未載入比賽題目");
                it.SubItems.Add("請先在主畫面登入並選擇比賽");
                it.ForeColor = Color.Gray;
                lvProblems.Items.Add(it);
            }
            UpdateCompilerStatus();
        }

        void UpdateCompilerStatus()
        {
            string cc = string.IsNullOrEmpty(cfg.CompilerPath)
                ? Runner.FindCompiler() : cfg.CompilerPath;
            if (!string.IsNullOrEmpty(cc) && File.Exists(cc))
            {
                lblCompilerStatus.Text = "找到編譯器：" + cc;
                lblCompilerStatus.ForeColor = Color.DarkGreen;
            }
            else
            {
                lblCompilerStatus.Text =
                    "找不到編譯器 —— 測試執行會停用（不影響提交與上傳）";
                lblCompilerStatus.ForeColor = Color.Firebrick;
            }
        }

        void OnLockClicked(object sender, EventArgs e)
        {
            if (AdminLock.IsLocked(cfg))
            {
                if (MessageBox.Show(this,
                        "要解除鎖定嗎？解除後選手就看得到「賽前設定」的內容。",
                        "解除鎖定", MessageBoxButtons.OKCancel,
                        MessageBoxIcon.Question) != DialogResult.OK) return;
                cfg.Locked = false;
                cfg.AdminPinHash = "";
                Store.SaveConfig(cfg);
                MessageBox.Show(this, "已解除鎖定。", "完成");
                ((Button)sender).Text = "設定 PIN 並鎖定";
                return;
            }

            using (PinDialog d = new PinDialog("設定管理員 PIN",
                       "設定後「賽前設定」分頁會被鎖住，要輸入這組 PIN 才能開啟。\n" +
                       "請記住它——忘記的話只能手動刪掉 config.json 重新設定。", true))
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                cfg.AdminPinHash = AdminLock.Hash(d.Pin);
                cfg.Locked = true;
                Store.SaveConfig(cfg);
                MessageBox.Show(this,
                    "已鎖定。關閉這個視窗後「賽前設定」分頁就會需要 PIN 才能開啟。",
                    "完成");
                ((Button)sender).Text = "變更 PIN / 解除鎖定";
            }
        }

        void OnPickFile(object sender, EventArgs e)
        {
            if (lvProblems.SelectedItems.Count == 0) return;
            string label = lvProblems.SelectedItems[0].Tag as string;
            if (label == null) return;

            OpenFileDialog d = new OpenFileDialog();
            d.Filter = "題目檔|*.pdf;*.html;*.htm;*.txt;*.md|所有檔案|*.*";
            d.Title = label + " 題的題目檔";
            if (Directory.Exists(cfg.ProblemDir)) d.InitialDirectory = cfg.ProblemDir;
            if (d.ShowDialog(this) != DialogResult.OK) return;

            cfg.ProblemFiles.RemoveAll(delegate (ProblemFile pf)
            { return pf != null && pf.Label == label; });
            ProblemFile np = new ProblemFile();
            np.Label = label;
            np.Path = d.FileName;
            cfg.ProblemFiles.Add(np);
            Reload();
        }
    }

    public class RunDialog : Form
    {
        readonly ProblemEntry problem;
        readonly string sourcePath;
        readonly string displayName;
        readonly string compiler;

        RadioButton rbSamples, rbCustom;
        TextBox txtInput;
        Button btnRun;
        RichTextBox rtbResult;
        Label lblCompiler;

        // sourcePath 可能是選手選的檔案，也可能是「直接輸入」模式落地的暫存檔；
        // displayName 是要顯示給選手看的名稱，兩者不一定相同。
        public RunDialog(ProblemEntry problem, string sourcePath,
                         string displayName, string compiler)
        {
            this.problem = problem;
            this.sourcePath = sourcePath;
            this.displayName = displayName;
            this.compiler = compiler;
            BuildUi();
        }

        void BuildUi()
        {
            Text = "測試執行 － " + problem.Label + " 題";
            Size = new Size(720, 640);
            MinimumSize = new Size(620, 520);
            Font = new Font("Microsoft JhengHei UI", 9F);
            StartPosition = FormStartPosition.CenterParent;

            Label lblFile = new Label();
            lblFile.SetBounds(12, 12, 680, 20);
            lblFile.Text = "來源：" + displayName;
            lblFile.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            Controls.Add(lblFile);

            lblCompiler = new Label();
            lblCompiler.SetBounds(12, 34, 680, 20);
            lblCompiler.Text = "編譯器：" + compiler;
            lblCompiler.ForeColor = Color.Gray;
            lblCompiler.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            Controls.Add(lblCompiler);

            int sampleCount = problem.Samples == null ? 0 : problem.Samples.Count;

            rbSamples = new RadioButton();
            rbSamples.SetBounds(12, 62, 200, 24);
            rbSamples.Text = string.Format("範例測資（{0} 筆）", sampleCount);
            rbSamples.Enabled = sampleCount > 0;
            rbSamples.Checked = sampleCount > 0;
            rbSamples.CheckedChanged += delegate { txtInput.Enabled = rbCustom.Checked; };
            Controls.Add(rbSamples);

            rbCustom = new RadioButton();
            rbCustom.SetBounds(220, 62, 150, 24);
            rbCustom.Text = "自訂輸入";
            rbCustom.Checked = sampleCount == 0;
            Controls.Add(rbCustom);

            if (sampleCount == 0)
            {
                Label warn = new Label();
                warn.SetBounds(380, 64, 320, 20);
                warn.Text = "（沒有範例測資，請自行從題目 PDF 貼上）";
                warn.ForeColor = Color.SaddleBrown;
                Controls.Add(warn);
            }

            txtInput = new TextBox();
            txtInput.SetBounds(12, 92, 680, 110);
            txtInput.Multiline = true;
            txtInput.ScrollBars = ScrollBars.Vertical;
            txtInput.Font = new Font("Consolas", 9.5F);
            txtInput.Enabled = rbCustom.Checked;
            txtInput.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            Controls.Add(txtInput);

            btnRun = new Button();
            btnRun.SetBounds(566, 210, 126, 32);
            btnRun.Text = "執  行";
            btnRun.Font = new Font(Font, FontStyle.Bold);
            btnRun.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnRun.Click += OnRun;
            Controls.Add(btnRun);

            rtbResult = new RichTextBox();
            rtbResult.SetBounds(12, 250, 680, 340);
            rtbResult.ReadOnly = true;
            rtbResult.Font = new Font("Consolas", 9.5F);
            rtbResult.BackColor = Color.White;
            rtbResult.Anchor = AnchorStyles.Top | AnchorStyles.Bottom |
                               AnchorStyles.Left | AnchorStyles.Right;
            Controls.Add(rtbResult);
        }

        void Append(string text, Color color, bool bold)
        {
            rtbResult.SelectionStart = rtbResult.TextLength;
            rtbResult.SelectionLength = 0;
            rtbResult.SelectionColor = color;
            rtbResult.SelectionFont = new Font(rtbResult.Font,
                bold ? FontStyle.Bold : FontStyle.Regular);
            rtbResult.AppendText(text + "\n");
            rtbResult.SelectionColor = rtbResult.ForeColor;
        }

        void OnRun(object sender, EventArgs e)
        {
            rtbResult.Clear();
            btnRun.Enabled = false;
            Cursor = Cursors.WaitCursor;
            try
            {
                // 時限放寬一倍再加緩衝：本機沒有沙箱，跟評測機效能也不同，
                // 這裡只是要抓出無窮迴圈，不是拿來判 TLE
                int timeout = Math.Max(2000, problem.TimeLimitMs * 2 + 1000);

                if (rbCustom.Checked)
                {
                    Append("── 自訂輸入 ──", Color.DimGray, true);
                    RunOutcome r = Runner.CompileAndRun(
                        compiler, sourcePath, txtInput.Text, timeout);
                    if (ShowCompileError(r)) return;
                    ShowRun(r, null);
                    return;
                }

                int pass = 0;
                for (int i = 0; i < problem.Samples.Count; i++)
                {
                    SampleCase s = problem.Samples[i];
                    Append(string.Format("── 範例 {0} ──", i + 1), Color.DimGray, true);
                    RunOutcome r = Runner.CompileAndRun(
                        compiler, sourcePath, s.Input, timeout);
                    if (ShowCompileError(r)) return;
                    if (ShowRun(r, s.Output)) pass++;
                }
                Append("", Color.Black, false);
                bool all = pass == problem.Samples.Count;
                Append(string.Format("{0} / {1} 筆範例通過{2}",
                        pass, problem.Samples.Count,
                        all ? "" : "  ← 範例沒過，提交前先檢查"),
                    all ? Color.ForestGreen : Color.Firebrick, true);
                Append("提醒：範例通過不代表會 AC，隱藏測資還是要靠伺服器判題。",
                    Color.Gray, false);
            }
            catch (Exception ex)
            {
                Append("執行失敗：" + ex.Message, Color.Firebrick, true);
            }
            finally
            {
                btnRun.Enabled = true;
                Cursor = Cursors.Default;
            }
        }

        bool ShowCompileError(RunOutcome r)
        {
            if (!r.CompileFailed) return false;
            Append("編譯錯誤", Color.Firebrick, true);
            Append(r.CompileError, Color.Firebrick, false);
            return true;
        }

        // 回傳這筆是否通過（自訂輸入模式沒有預期輸出，一律回 false 不計數）
        bool ShowRun(RunOutcome r, string expected)
        {
            if (r.TimedOut)
            {
                Append(string.Format("逾時（超過 {0} ms 未結束，可能有無窮迴圈）",
                    r.ElapsedMs), Color.DarkOrange, true);
                return false;
            }
            if (r.ExitCode != 0)
            {
                Append(string.Format("程式非正常結束（exit code {0}）", r.ExitCode),
                    Color.Firebrick, true);
                if (!string.IsNullOrEmpty(r.Stderr))
                    Append(r.Stderr.TrimEnd(), Color.Firebrick, false);
                return false;
            }

            if (expected == null)
            {
                Append(string.Format("執行完成（{0} ms）", r.ElapsedMs),
                    Color.ForestGreen, true);
                Append("輸出：", Color.DimGray, false);
                Append(r.Stdout.Length == 0 ? "（沒有輸出）" : r.Stdout.TrimEnd(),
                    Color.Black, false);
                if (!string.IsNullOrEmpty(r.Stderr))
                {
                    Append("stderr：", Color.DimGray, false);
                    Append(r.Stderr.TrimEnd(), Color.Firebrick, false);
                }
                return false;
            }

            bool ok = Runner.Normalize(r.Stdout) == Runner.Normalize(expected);
            if (ok)
            {
                Append(string.Format("通過（{0} ms）", r.ElapsedMs),
                    Color.ForestGreen, true);
                return true;
            }
            Append(string.Format("答案錯誤（{0} ms）", r.ElapsedMs), Color.Firebrick, true);
            Append("你的輸出：", Color.DimGray, false);
            Append(r.Stdout.Length == 0 ? "（沒有輸出）" : r.Stdout.TrimEnd(),
                Color.Black, false);
            Append("預期輸出：", Color.DimGray, false);
            Append(expected.TrimEnd(), Color.Black, false);
            return false;
        }
    }
}
