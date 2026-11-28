import { readFileSync } from "node:fs";

// One artifact for deploy upgrades and imports; SQL guards every legacy field.
const sql = readFileSync(new URL(
  "../../prisma/migrations/20261108000000_correct_recognition_legacy/migration.sql",
  import.meta.url,
), "utf8");

export function applyRecognitionLegacyCorrections(db) {
  const before = db.prepare("SELECT total_changes() AS n").get().n;
  db.transaction(() => db.exec(sql))();
  return db.prepare("SELECT total_changes() AS n").get().n - before;
}
