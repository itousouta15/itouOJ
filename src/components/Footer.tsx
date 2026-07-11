import { Fragment } from "react";
import Link from "next/link";

// 同 itousouta15.tw 的 footer（跑馬燈 + 四欄式），連結換成 OJ 的頁面
const MARQUEE = [
  "ciallo (∠·ω )⌒★",
  "I'm itouSouta",
  "人間になりたい",
  "DEVELOPER",
  "VOCALO-P",
  "ILLUSTRATOR",
  "情熱を失っては、何もできない。",
  "Zzzz",
];

const NAV_LINKS = [
  { label: "首頁", href: "/" },
  { label: "題目", href: "/problems" },
  { label: "課程", href: "/courses" },
  { label: "紀錄", href: "/submissions" },
  { label: "排行", href: "/ranking" },
];

const PROJECT_LINKS = [
  { label: "itouSouta15.tw", href: "https://itousouta15.tw" },
  { label: "itouLinks", href: "https://links.itousouta15.tw" },
  { label: "itouSlides", href: "https://slides.itousouta15.tw/" },
  { label: "itouCards", href: "https://cards.itousouta15.tw/" },
  { label: "itouBLoGa", href: "https://blog.itousouta15.tw/" },
];

const SOCIAL_LINKS = [
  {
    icon: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/itou.souta15",
  },
  { icon: "github", label: "GitHub", href: "https://github.com/itousouta15" },
  { icon: "x", label: "X", href: "https://x.com/itou_souta15" },
  { icon: "discord", label: "Discord", href: "https://DC.itousouta15.tw" },
  { icon: "telegram", label: "Telegram", href: "https://t.me/itousouta15" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="marquee">
        {[0, 1].map((g) => (
          <div
            className="marquee-group"
            key={g}
            aria-hidden={g === 1 ? true : undefined}
          >
            {MARQUEE.map((m, i) => (
              <Fragment key={i}>
                <span>{m}</span>
                <span className="star">★</span>
              </Fragment>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              itouOJ
            </Link>
            <p className="footer-tagline">
              情熱を失っては、
              <br />
              何もできない。
            </p>
          </div>

          <nav className="footer-col" aria-label="站內導覽">
            <div className="footer-section-label">Site Map</div>
            <div className="footer-link-list footer-link-list--two-col">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav className="footer-col" aria-label="My Projects">
            <div className="footer-section-label">My Projects</div>
            <div className="footer-link-list">
              {PROJECT_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener nofollow noreferrer"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="footer-col">
            <div className="footer-section-label">Social Media</div>
            <div className="footer-socials" aria-label="Social links">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.href}
                  className={`footer-si si-${s.icon}`}
                  href={s.href}
                  target="_blank"
                  rel="noopener nofollow noreferrer"
                  aria-label={s.label}
                >
                  <span className="footer-si-icon" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <div className="footer-copyright">
            <span className="icon-copyright" />
            2026
            <span className="footer-heart">♥</span>
            <span>itouSouta</span>
          </div>
          <div>Powered by Next.js + Piston</div>
        </div>
      </div>
    </footer>
  );
}
