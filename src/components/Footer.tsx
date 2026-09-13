import Image from "next/image";
import Link from "next/link";

const EXPLORE_LINKS = [
  { label: "實作", href: "/problems" },
  { label: "比賽", href: "/contests" },
  { label: "識讀", href: "/recognition" },
  { label: "排行榜", href: "/ranking" },
  { label: "提交紀錄", href: "/submissions" },
  { label: "關於 itouOJ", href: "/about" },
];

const RESOURCE_LINKS = [
  {
    label: "GitHub 原始碼",
    href: "https://github.com/itousouta15/itouOJ",
  },
  {
    label: "回報問題",
    href: "https://github.com/itousouta15/itouOJ/issues/new/choose",
  },
  {
    label: "使用文件",
    href: "https://github.com/itousouta15/itouOJ#readme",
  },
];

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.78.61-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.55 9.55 0 0 1 12 6.8a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.9.68 1.81v2.69c0 .26.18.57.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="footer oj-footer">
      <div className="footer-inner oj-footer-inner">
        <div className="oj-footer-grid">
          <section className="oj-footer-intro" aria-labelledby="oj-footer-title">
            <Link href="/" className="oj-footer-logo" id="oj-footer-title">
              <Image
                className="oj-footer-logo-image"
                src="/brand/itouOJ.png"
                alt=""
                width={32}
                height={32}
              />
            itouOJ
            </Link>
            <p className="oj-footer-description">
              練習、比賽、提交，專心每一次嘗試
            </p>
            <a
              className="oj-footer-star"
              href="https://github.com/itousouta15/itouOJ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubMark />
              <span>Star on GitHub</span>
            </a>
            <p className="oj-footer-star-note">
              如果覺得不錯的話可以到 GitHub 上按個 Star！
            </p>
          </section>

          <nav className="oj-footer-column" aria-label="OJ 導覽">
            <p className="oj-footer-heading">Explore</p>
            <div className="oj-footer-links">
              {EXPLORE_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav className="oj-footer-column" aria-label="OJ 資源">
            <p className="oj-footer-heading">Resources</p>
            <div className="oj-footer-links">
              {RESOURCE_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
            <div className="oj-footer-stack" aria-label="技術架構">
              <span>Next.js</span>
              <span>Prisma</span>
              <span>Sandbox Runner</span>
            </div>
          </nav>
        </div>

        <div className="oj-footer-divider" />

        <div className="oj-footer-bottom">
          <span>© 2026 itouOJ</span>
          <span>Open source · Build By itouSouta</span>
        </div>
      </div>
    </footer>
  );
}
