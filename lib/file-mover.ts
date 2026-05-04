import fs from "fs";
import path from "path";
import type { ScannedFile, MoveOperation, SortResult } from "@/types";

function resolveConflict(targetPath: string): string {
  if (!fs.existsSync(targetPath)) return targetPath;
  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const base = path.basename(targetPath, ext);
  let i = 1;
  while (true) {
    const candidate = path.join(dir, `${base}_${i}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    i++;
  }
}

export function buildMovePreview(files: ScannedFile[]): MoveOperation[] {
  return files
    .filter((f) => f.path !== path.join(f.destinationDir, f.name))
    .map((f) => ({
      from: f.path,
      to: path.join(f.destinationDir, f.name),
      category: f.category,
    }));
}

export function moveFiles(files: ScannedFile[], scanRoot: string): SortResult {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(scanRoot, ".chaos-killer-backup", timestamp);

  const ops = buildMovePreview(files);
  if (ops.length === 0) {
    return { moved: 0, skipped: files.length, errors: [], backupDir };
  }

  // Write manifest
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(
      path.join(backupDir, "manifest.json"),
      JSON.stringify({ timestamp, moves: ops }, null, 2)
    );
  } catch {
    // Non-fatal: proceed without manifest
  }

  let moved = 0;
  let skipped = 0;
  const errors: Array<{ path: string; error: string }> = [];

  for (const file of files) {
    const dest = path.join(file.destinationDir, file.name);
    if (file.path === dest) {
      skipped++;
      continue;
    }
    try {
      fs.mkdirSync(file.destinationDir, { recursive: true });
      const finalDest = resolveConflict(dest);
      try {
        fs.renameSync(file.path, finalDest);
      } catch {
        // Cross-device move fallback
        fs.copyFileSync(file.path, finalDest);
        fs.unlinkSync(file.path);
      }
      moved++;
    } catch (err) {
      errors.push({ path: file.path, error: (err as Error).message });
    }
  }

  return { moved, skipped, errors, backupDir };
}
