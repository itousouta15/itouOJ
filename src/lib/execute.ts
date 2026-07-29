import { pistonExecute } from "@/lib/piston";
import { sandboxExecute } from "@/lib/sandbox";
import type { PistonResult } from "@/lib/piston";
import type { LanguageKey } from "@/lib/languages";

// M8 cutover: sandbox-runner (this project's own namespace/cgroup/seccomp
// sandbox) has replaced Piston for the languages it supports. Java still
// goes through Piston until sandbox-runner grows a Java seccomp profile --
// see sandbox-runner/README and the M7 milestone notes.
const SANDBOX_LANGUAGES: ReadonlySet<LanguageKey> = new Set([
  "c",
  "cpp",
  "python",
  "javascript",
]);

export async function execute(
  languageKey: LanguageKey,
  params: {
    language: string;
    version: string;
    filename: string;
    code: string;
    stdin: string;
    runTimeoutMs: number;
    runMemoryLimitBytes: number;
    // 只有 sandbox-runner 支援；Piston（目前只剩 Java 走這條）沒有這個機制，
    // 傳了也沒用，pistonExecute 本來就不認得這個欄位。
    precompiledBinary?: string;
  }
): Promise<PistonResult> {
  if (SANDBOX_LANGUAGES.has(languageKey)) {
    return sandboxExecute(params);
  }
  return pistonExecute(params);
}
