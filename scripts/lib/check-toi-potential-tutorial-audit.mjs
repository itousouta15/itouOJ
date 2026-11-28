// Offline by default; statement review/live comparisons require --source.
// Run with: node --import ./scripts/ctf-test-loader.mjs <this-file> [options]
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { toiPotentialLessons } from "../../src/lib/toiPotentialLessons.ts";
import { toiPotentialProblemCatalog } from "../../src/lib/toiPotentialProblemCatalog.ts";

const args = process.argv.slice(2);
const option = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const sourcePath = option("--source");
assert.ok(
  sourcePath || (!args.includes("--inspect") && !args.includes("--live")),
  "Statement review requires an explicit --source <snapshot.json>",
);
const source = sourcePath
  ? JSON.parse(await fs.readFile(sourcePath, "utf8"))
  : undefined;
let lessons = Object.values(toiPotentialLessons);
const selected = option("--codes");
if (selected) {
  const codes = new Set(selected.split(","));
  lessons = lessons.filter((lesson) => codes.has(lesson.code));
  assert.equal(
    lessons.length,
    codes.size,
    "Unknown or duplicate code selection",
  );
}
for (const lesson of lessons) {
  const catalog = toiPotentialProblemCatalog.find(
    (entry) => entry.code === lesson.code,
  );
  assert.ok(catalog, `Missing catalog entry ${lesson.code}`);
  assert.ok(
    catalog.samples.some(
      ({ input, output }) =>
        input === lesson.sampleInput && output === lesson.sampleOutput,
    ),
    `Lesson/catalog sample drift ${lesson.code}`,
  );
  if (source) {
    const problem = source.find((entry) => entry.code === lesson.code);
    assert.ok(problem, `Missing statement ${lesson.code}`);
    assert.equal(
      problem.title.replace(new RegExp(`^${lesson.code}\\.\\s*`), ""),
      catalog.title,
      `Snapshot/catalog title drift ${lesson.code}`,
    );
    assert.deepEqual(
      problem.samples,
      catalog.samples,
      `Snapshot/catalog drift ${lesson.code}`,
    );
  }
}
console.log(
  source
    ? `Matched ${lessons.length} lesson titles and public sample sets to the selected source snapshot.`
    : `Checked ${lessons.length} lesson sample references against the bundled catalog (offline).`,
);
if (lessons.some(({ code }) => code === "a344"))
  console.log(
    "a344 remains an unresolved source contradiction; catalog equality is not solution verification.",
  );
if (args.includes("--inspect")) {
  for (const lesson of lessons) {
    const problem = source.find((entry) => entry.code === lesson.code);
    const compact = args.includes("--compact");
    console.log(
      `\n${lesson.code}: ${problem.statement.split("\n來源\n")[0].replace(/\n+/g, " ")}\nEXPLANATION ${lesson.explanation.join(" ")}\nCOMPLEXITY ${lesson.complexity}\nPITFALL ${lesson.pitfall}\nTRACE ${JSON.stringify(compact ? lesson.trace.map(({ description, cells, variables }) => ({ description, cells, variables })) : lesson.trace)}\nPYTHON\n${lesson.python}\nC++\n${compact ? lesson.cpp.replace(/\s+/g, " ") : lesson.cpp}`,
    );
  }
}
if (args.includes("--live")) {
  const decode = (html) =>
    html
      .replace(
        /&(?:amp|lt|gt|quot|apos|#39|nbsp);/g,
        (entity) =>
          ({
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": '"',
            "&apos;": "'",
            "&#39;": "'",
            "&nbsp;": " ",
          })[entity],
      )
      .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, value) =>
        String.fromCodePoint(
          value[0].toLowerCase() === "x"
            ? parseInt(value.slice(1), 16)
            : Number(value),
        ),
      );
  const plain = (html) =>
    decode(
      html
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<br\s*\/?\s*>/g, "\n")
        .replace(/<\/(p|h[1-6]|li|tr)>/g, "\n")
        .replace(/<[^>]+>/g, ""),
    );
  let index = 0;
  const failures = [];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (index < lessons.length) {
        const { code } = lessons[index++];
        try {
          const response = await fetch(
            `https://oj.itousouta.me/problems/${code}`,
            { signal: AbortSignal.timeout(20000) },
          );
          assert.ok(response.ok, `HTTP ${response.status}`);
          const html = await response.text();
          const main = (
            /<main[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1] ?? ""
          ).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
          const start = main.indexOf("題目描述");
          const end = main.indexOf("出題者", start);
          assert.ok(
            start >= 0 && main.includes("範例測資"),
            "Missing statement/sample sections",
          );
          const statement = plain(
            main.slice(start, end > start ? end : main.indexOf("範例測資")),
          ).trim();
          const values = [
            ...main
              .slice(main.indexOf("範例測資"))
              .matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g),
          ].map((match) => plain(match[1]).replace(/\r\n/g, "\n"));
          const samples = [];
          for (let i = 0; i + 1 < values.length; i += 2)
            samples.push({ input: values[i], output: values[i + 1] });
          const saved = source.find((entry) => entry.code === code);
          assert.equal(statement, saved.statement, "Live statement changed");
          assert.deepEqual(samples, saved.samples, "Live samples changed");
          console.log(`${code}: live statement and samples unchanged`);
        } catch (error) {
          failures.push(code);
          console.error(
            `${code}: live recheck failed: ${error.message}${error.cause ? ` (${error.cause.message})` : ""}`,
          );
        }
      }
    }),
  );
  assert.equal(failures.length, 0, `Live recheck gaps: ${failures.join(",")}`);
}
if (args.includes("--regressions")) {
  execFileSync(
    option("--python") ?? "python3",
    [
      fileURLToPath(
        new URL("./check-toi-potential-tutorial-audit.py", import.meta.url),
      ),
      ...(option("--cxx") ? ["--cxx", option("--cxx")] : []),
      ...(option("--temp-root") ? ["--temp-root", option("--temp-root")] : []),
      ...(args.includes("--limits") ? ["--limits"] : []),
    ],
    {
      input: JSON.stringify(lessons),
      stdio: ["pipe", "inherit", "inherit"],
      timeout: 900000,
    },
  );
}
