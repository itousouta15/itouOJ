import type { LanguageKey } from "@/lib/languages";

let clangReady: Promise<typeof import("@wasm-fmt/clang-format/web")> | undefined;
let pythonReady: Promise<typeof import("@wasm-fmt/ruff_fmt/web")> | undefined;

// 只在第一次美化時下載對應語言的格式化工具；初始化失敗後允許重試。
function loadClang() {
  return clangReady ??= import("@wasm-fmt/clang-format/web").then(async (formatter) => {
    await formatter.default();
    return formatter;
  }).catch((error) => {
    clangReady = undefined;
    throw error;
  });
}

function loadPython() {
  return pythonReady ??= import("@wasm-fmt/ruff_fmt/web").then(async (formatter) => {
    await formatter.default();
    return formatter;
  }).catch((error) => {
    pythonReady = undefined;
    throw error;
  });
}

export async function formatEditorCode(code: string, language: LanguageKey): Promise<string> {
  if (!code.trim()) return code;

  switch (language) {
    case "c":
    case "cpp": {
      const formatter = await loadClang();
      return formatter.format(code, language === "c" ? "main.c" : "main.cpp", JSON.stringify({
        BasedOnStyle: "LLVM",
        IndentWidth: 4,
        TabWidth: 4,
        UseTab: "Never",
        ColumnLimit: 100,
        SortIncludes: "Never",
        AllowShortFunctionsOnASingleLine: "Empty",
      }));
    }
    case "python": {
      const formatter = await loadPython();
      return formatter.format(code, "main.py", {
        indent_style: "space",
        indent_width: 4,
        line_width: 100,
        quote_style: "preserve",
      });
    }
    case "javascript": {
      const [prettier, babel, estree] = await Promise.all([
        import("prettier/standalone"),
        import("prettier/plugins/babel"),
        import("prettier/plugins/estree"),
      ]);
      return prettier.format(code, {
        parser: "babel",
        plugins: [babel.default, estree.default],
        tabWidth: 4,
        printWidth: 100,
      });
    }
    case "itoulang":
      // 尚無 itouLang 格式化器，原樣回傳。
      return code;
  }
}
