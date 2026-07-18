import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LANGUAGES, LANGUAGE_KEYS, isLanguageKey } from "@/lib/languages";
import { pistonExecute } from "@/lib/piston";
import { runVerdict } from "@/lib/judge";
import { assertContestProblemAccess } from "@/lib/contest";

const schema = z.object({
  problemId: z.number().int().positive(),
  language: z.enum(LANGUAGE_KEYS as [string, ...string[]]),
  code: z.string().min(1, "程式碼不能是空的").max(65536, "程式碼過長"),
  // null / 不給 = 跑範例測資；給字串 = 用自訂輸入跑一次
  customInput: z.string().max(65536, "自訂輸入過長").nullish(),
  contestId: z.number().int().positive().optional(),
});

const MAX_SAMPLES = 5;
const clip = (s: string, n = 4000) =>
  s.length > n ? s.slice(0, n) + "\n…（輸出過長，已截斷）" : s;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problemId, language, code, customInput, contestId } = parsed.data;
  if (!isLanguageKey(language)) {
    return Response.json({ error: "不支援的語言" }, { status: 400 });
  }

  if (contestId !== undefined) {
    const access = await assertContestProblemAccess(session, contestId, problemId);
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }
  }

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        where: { isSample: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        take: MAX_SAMPLES,
      },
    },
  });
  if (
    !problem ||
    (contestId === undefined && !problem.isPublic && session.role !== "ADMIN")
  ) {
    return Response.json({ error: "題目不存在" }, { status: 404 });
  }

  const lang = LANGUAGES[language];
  const timeLimitMs = problem.timeLimitMs * lang.timeMultiplier;
  const memoryLimitBytes =
    problem.memoryLimitMb * lang.memoryMultiplier * 1024 * 1024;

  const exec = (stdin: string) =>
    pistonExecute({
      language: lang.piston,
      version: lang.version,
      filename: lang.filename,
      code,
      stdin,
      runTimeoutMs: timeLimitMs,
      runMemoryLimitBytes: memoryLimitBytes,
    });

  try {
    // ---- 自訂輸入：跑一次，回傳原始輸出 ----
    if (customInput != null) {
      const result = await exec(customInput);
      if (result.compile && result.compile.code !== 0) {
        return Response.json({
          mode: "custom",
          compileError: clip(
            result.compile.stderr || result.compile.output || "編譯失敗"
          ),
        });
      }
      const run = result.run;
      return Response.json({
        mode: "custom",
        stdout: clip(run.stdout),
        stderr: clip(run.stderr),
        exitCode: run.code,
        killed: run.signal === "SIGKILL",
        timeMs: Math.round(run.cpu_time ?? run.wall_time ?? 0),
      });
    }

    // ---- 範例測資：逐筆跑完、逐筆回報 ----
    if (problem.testCases.length === 0) {
      return Response.json(
        { error: "此題沒有範例測資，請改用自訂輸入" },
        { status: 400 }
      );
    }
    const results = [];
    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      const result = await exec(tc.input);
      if (result.compile && result.compile.code !== 0) {
        return Response.json({
          mode: "samples",
          compileError: clip(
            result.compile.stderr || result.compile.output || "編譯失敗"
          ),
        });
      }
      const run = result.run;
      const verdict = runVerdict(run, timeLimitMs, memoryLimitBytes, tc.output);
      results.push({
        order: i + 1,
        verdict,
        timeMs: Math.round(run.cpu_time ?? run.wall_time ?? 0),
        stdout: clip(run.stdout),
        expected: clip(tc.output),
        stderr: verdict === "RE" ? clip(run.stderr) : "",
      });
    }
    return Response.json({ mode: "samples", results });
  } catch (err) {
    console.error("[run] internal error:", err);
    return Response.json(
      { error: "評測系統暫時無法使用，請稍後再試" },
      { status: 502 }
    );
  }
}
