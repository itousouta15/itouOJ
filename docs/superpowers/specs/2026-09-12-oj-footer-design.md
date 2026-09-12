# OJ Footer Design

## Goal

Replace the personal-site-derived footer with an Online Judge footer that helps
people navigate the platform, understand its technical foundation, and star the
open-source repository.

## Scope

- Remove the marquee, personal-project links, and personal social links.
- Keep the footer on web layouts and keep it hidden for the native App layout.
- Preserve the existing dark/light theme variables and responsive behavior.

## Layout

Desktop uses a three-column resource layout inside the existing footer width.
Mobile collapses the columns into one vertical stack.

### itouOJ

- Platform name linking to the home page.
- Short description: a platform for practice, contests, submissions, and judging.
- A clear external GitHub button to `https://github.com/itousouta15/itouOJ`.
- Supporting copy: "如果覺得不錯的話可以到 GitHub 上按個 Star！"

### Explore

Internal links for Problems, Contests, Recognition, Ranking, and Submissions.
They use Next `Link` so navigation remains client-side where appropriate.

### Resources

- Source code link to the repository.
- Issue-reporting link to the repository issue creation page.
- Documentation link to the repository README.
- Non-interactive technical labels for Next.js, Prisma, and Sandbox Runner.

All external links open in a new tab with `rel="noopener noreferrer"`.

## Footer bottom line

Show the current footer identity (`© 2026 itouOJ`) and a compact open-source
statement. Do not include personal branding, personal social profiles, or a
marquee.

## Accessibility and responsiveness

- Each navigation group is a named `nav` landmark or labelled resource region.
- The GitHub call to action has descriptive accessible text.
- Keyboard focus stays visible through existing global focus styles.
- At narrow web widths the grid becomes one column; the native App continues to
  hide the entire footer via its existing selector.

## Validation

- Run TypeScript, lint, and production build checks.
- Confirm the footer has no remaining personal-project, personal-social, or
  marquee markup or styles.
- Confirm every GitHub target uses the itouOJ repository URL.
