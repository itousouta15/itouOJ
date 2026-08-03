// itouOJ 收件程式 — 外觀
//
// 色票直接對應網站 globals.css 的淺色主題（[data-theme="light"]），
// 讓收件程式和 oj.itousouta.me 看起來像同一套東西。
//
// 為什麼用淺色而不是網站的預設暗色：WinForms 的原生控制項（TextBox、ListView、
// ComboBox、捲軸）不吃自訂配色，硬套暗色會變成深色框裡卡著幾塊白，比統一的
// 淺色更難看。這裡選擇做好一件事，而不是兩件都做半套。

using System;
using System.Drawing;
using System.Windows.Forms;

namespace ItouOJ
{
    public static class Theme
    {
        // ── 色票（對應 globals.css 的淺色主題）──────
        public static readonly Color Bg = ColorTranslator.FromHtml("#E9E9EE");     // --bg
        public static readonly Color Card = ColorTranslator.FromHtml("#FFFFFF");
        public static readonly Color Inset = ColorTranslator.FromHtml("#F3F4F7");
        public static readonly Color Border = ColorTranslator.FromHtml("#DCDDE3"); // --bd
        public static readonly Color Border2 = ColorTranslator.FromHtml("#C3C6D0");// --bd2
        public static readonly Color Text = ColorTranslator.FromHtml("#22262D");   // --tx
        public static readonly Color Dim = ColorTranslator.FromHtml("#494F59");    // --dim
        public static readonly Color Mute = ColorTranslator.FromHtml("#6B7280");   // --mute
        public static readonly Color Accent = ColorTranslator.FromHtml("#364A7C"); // --blue
        public static readonly Color Btn = ColorTranslator.FromHtml("#2B2F36");    // --btn
        public static readonly Color BtnText = ColorTranslator.FromHtml("#F2F4F9");// --btntx

        public static readonly Color Good = ColorTranslator.FromHtml("#1B5E20");
        public static readonly Color GoodBg = ColorTranslator.FromHtml("#E7F3E8");
        public static readonly Color Warn = ColorTranslator.FromHtml("#8A5A00");
        public static readonly Color WarnBg = ColorTranslator.FromHtml("#FDF3DF");
        public static readonly Color Bad = ColorTranslator.FromHtml("#B3261E");
        public static readonly Color BadBg = ColorTranslator.FromHtml("#FCEBEA");
        // 題目側欄的選取列底色（淺藍灰，比全彩的 GoodBg 低調，不會跟狀態色混淆）
        public static readonly Color Selection = ColorTranslator.FromHtml("#DDE4F2");

        // ── 字體 ────────────────────────────────
        const string Face = "Microsoft JhengHei UI";
        const string Mono = "Consolas";

        public static Font Body { get { return new Font(Face, 10F); } }
        public static Font BodyBold { get { return new Font(Face, 10F, FontStyle.Bold); } }
        public static Font Small { get { return new Font(Face, 9F); } }
        public static Font Title { get { return new Font(Face, 12F, FontStyle.Bold); } }
        public static Font Code { get { return new Font(Mono, 11F); } }
        public static Font CodeSmall { get { return new Font(Mono, 9.5F); } }

        // ── 元件 ────────────────────────────────

        // 白底卡片，取代 GroupBox 那圈 3D 凹線
        public static Panel CardPanel()
        {
            Panel p = new Panel();
            p.BackColor = Card;
            p.Padding = new Padding(16, 14, 16, 14);
            CardBorder(p);
            return p;
        }

        // 幫任何 Panel 掛上卡片邊框（TableLayoutPanel 直接當卡片用時也需要）
        public static void CardBorder(Panel p)
        {
            p.Paint += delegate (object s, PaintEventArgs e)
            {
                Panel me = (Panel)s;
                using (Pen pen = new Pen(Border))
                {
                    e.Graphics.DrawRectangle(pen, 0, 0, me.Width - 1, me.Height - 1);
                }
            };
        }

        // 卡片但不要內距（內部用 TableLayoutPanel 自己控制間距）
        public static Panel CardPanelNoPad()
        {
            Panel p = CardPanel();
            p.Padding = new Padding(0);
            return p;
        }

        // 統一的 TableLayoutPanel：無邊距、白底。
        //
        // 注意：這裡不預設任何 Column/RowStyle——TableLayoutPanel 的樣式集合
        // 是空的，設定 ColumnCount/RowCount 也不會自動補樣式（預設 Percent 100）。
        // 呼叫端必須自行 Add 與行列數相符的樣式，加錯順序會整個錯位。
        public static TableLayoutPanel Table()
        {
            TableLayoutPanel t = new TableLayoutPanel();
            t.BackColor = Bg;
            t.Padding = new Padding(0);
            t.Margin = new Padding(0);
            t.ColumnCount = 1;
            t.RowCount = 1;
            return t;
        }

        public static Label SectionTitle(string text)
        {
            Label l = new Label();
            l.Text = text;
            l.Font = BodyBold;
            l.ForeColor = Text;
            l.AutoSize = true;
            return l;
        }

        public static Label FieldLabel(string text)
        {
            Label l = new Label();
            l.Text = text;
            l.Font = Body;
            l.ForeColor = Dim;
            l.AutoSize = false;
            l.TextAlign = ContentAlignment.MiddleLeft;
            return l;
        }

        public static Label Hint(string text)
        {
            Label l = new Label();
            l.Text = text;
            l.Font = Small;
            l.ForeColor = Mute;
            l.AutoSize = false;
            return l;
        }

        // 深色實心主按鈕（同網站的 .btn-primary）
        public static Button Primary(string text)
        {
            Button b = new Button();
            b.Text = text;
            b.Font = BodyBold;
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 0;
            b.BackColor = Btn;
            b.ForeColor = BtnText;
            b.Cursor = Cursors.Hand;
            b.UseVisualStyleBackColor = false;
            return b;
        }

        // 白底外框次要按鈕（同網站的 .btn-secondary）
        public static Button Secondary(string text)
        {
            Button b = new Button();
            b.Text = text;
            b.Font = Body;
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 1;
            b.FlatAppearance.BorderColor = Border2;
            b.BackColor = Card;
            b.ForeColor = Text;
            b.Cursor = Cursors.Hand;
            b.UseVisualStyleBackColor = false;
            return b;
        }

        public static TextBox Input()
        {
            TextBox t = new TextBox();
            t.Font = Body;
            t.BorderStyle = BorderStyle.FixedSingle;
            t.BackColor = Card;
            t.ForeColor = Text;
            return t;
        }

        public static ComboBox Select()
        {
            ComboBox c = new ComboBox();
            c.Font = Body;
            c.DropDownStyle = ComboBoxStyle.DropDownList;
            c.FlatStyle = FlatStyle.Flat;
            c.BackColor = Card;
            c.ForeColor = Text;
            return c;
        }

        // 水平分隔線
        public static Panel Divider()
        {
            Panel p = new Panel();
            p.Height = 1;
            p.BackColor = Border;
            return p;
        }

        // 小色塊標籤（就緒 / 未回報 / 待上傳…）
        public static Label Pill(string text, Color fg, Color bg)
        {
            Label l = new Label();
            l.Text = text;
            l.Font = Small;
            l.ForeColor = fg;
            l.BackColor = bg;
            l.TextAlign = ContentAlignment.MiddleCenter;
            l.AutoSize = false;
            return l;
        }

        // ListView 的列高預設太擠，用一張透明 ImageList 撐開
        public static void SetRowHeight(ListView lv, int height)
        {
            ImageList spacer = new ImageList();
            spacer.ImageSize = new Size(1, height);
            lv.SmallImageList = spacer;
        }
    }
}
