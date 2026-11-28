export interface ImportedTestCase {
  input: string;
  output: string;
}

interface TestCaseFilePair {
  name: string;
  input?: File;
  output?: File;
}

export async function readTestCaseFiles(
  files: readonly File[]
): Promise<ImportedTestCase[]> {
  if (files.length === 0) {
    throw new Error("請選擇測資檔案");
  }

  const pairs = new Map<string, TestCaseFilePair>();

  for (const file of files) {
    const match = /^(.+)\.(in|out)$/i.exec(file.name);
    if (!match) {
      throw new Error(`不支援「${file.name}」，測資檔名必須以 .in 或 .out 結尾`);
    }

    const name = match[1];
    const kind = match[2].toLowerCase() === "in" ? "input" : "output";
    const key = name.toLowerCase();
    const pair = pairs.get(key) ?? { name };

    if (pair[kind]) {
      throw new Error(`「${name}.${match[2]}」有重複檔案`);
    }

    pair[kind] = file;
    pairs.set(key, pair);
  }

  const sortedPairs = [...pairs.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  const missingFiles = sortedPairs.flatMap((pair) => {
    const missing: string[] = [];
    if (!pair.input) missing.push(`${pair.name}.in`);
    if (!pair.output) missing.push(`${pair.name}.out`);
    return missing;
  });

  if (missingFiles.length > 0) {
    throw new Error(`找不到配對檔案：${missingFiles.join("、")}`);
  }

  return Promise.all(
    sortedPairs.map(async (pair) => {
      // The missing-file check above guarantees both files exist.
      const [input, output] = await Promise.all([
        pair.input!.text(),
        pair.output!.text(),
      ]);
      return { input, output };
    })
  );
}
