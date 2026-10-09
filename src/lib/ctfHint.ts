// Existing CTF challenges store the hint as a Markdown section in description.
// Keep the database schema and admin editor unchanged; hide only the rendered
// section until the learner explicitly opens it.
export function splitCtfHint(source: string): { description: string; hint: string | null } {
  const lines = source.split(/\r?\n/);
  let fence: string | null = null;
  let start = -1;
  let end = lines.length;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    const marker = line.match(/^(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    if (start < 0 && /^#{1,6}\s*(?:小提示|提示|Hints?)\s*#*\s*$/i.test(line)) {
      start = index;
      continue;
    }
    if (start >= 0 && /^#{1,6}\s+\S/.test(line)) {
      end = index;
      break;
    }
  }
  if (start < 0) return { description: source, hint: null };
  const section = lines.slice(start + 1, end);
  const point = section.findIndex(line => /^\s*\*\*練習重點[：:]\*\*/.test(line));
  const hint = (point < 0 ? section : section.slice(0, point)).join("\n").trim();
  if (!hint) return { description: source, hint: null };
  const before = lines.slice(0, start).join("\n").trimEnd();
  const after = [...(point < 0 ? [] : section.slice(point)), ...lines.slice(end)].join("\n").trim();
  return { description: [before, after].filter(Boolean).join("\n\n"), hint };
}
