import fs from "fs";
import path from "path";
import type { FileCategory, ScannedFile, ScanResult, CategorySummary } from "@/types";

const EXTENSION_MAP: Record<string, FileCategory> = {
  // Images
  jpg: "Images", jpeg: "Images", png: "Images", gif: "Images",
  bmp: "Images", webp: "Images", svg: "Images", tiff: "Images",
  ico: "Images", heic: "Images", avif: "Images", raw: "Images",
  // Videos
  mp4: "Videos", mkv: "Videos", avi: "Videos", mov: "Videos",
  wmv: "Videos", flv: "Videos", webm: "Videos", m4v: "Videos",
  mpeg: "Videos", mpg: "Videos", "3gp": "Videos",
  // PDFs
  pdf: "PDFs",
  // Documents
  doc: "Documents", docx: "Documents", xls: "Documents", xlsx: "Documents",
  ppt: "Documents", pptx: "Documents", odt: "Documents", ods: "Documents",
  odp: "Documents", txt: "Documents", rtf: "Documents", csv: "Documents",
  // Archives
  zip: "Archives", tar: "Archives", gz: "Archives", bz2: "Archives",
  "7z": "Archives", rar: "Archives", xz: "Archives", zst: "Archives",
  dmg: "Archives", iso: "Archives",
  // Audio
  mp3: "Audio", wav: "Audio", flac: "Audio", aac: "Audio",
  ogg: "Audio", m4a: "Audio", wma: "Audio", opus: "Audio",
  // Code
  ts: "Code", tsx: "Code", js: "Code", jsx: "Code", py: "Code",
  rs: "Code", go: "Code", java: "Code", cpp: "Code", c: "Code",
  h: "Code", cs: "Code", rb: "Code", php: "Code", swift: "Code",
  kt: "Code", html: "Code", css: "Code", scss: "Code", json: "Code",
  yml: "Code", yaml: "Code", sh: "Code", sql: "Code",
};

function categorize(filename: string): FileCategory {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return EXTENSION_MAP[ext] ?? "Other";
}

export function walkDirectory(
  dirPath: string,
  scanRoot: string,
  maxDepth = 5,
  currentDepth = 0
): ScannedFile[] {
  if (currentDepth > maxDepth) return [];

  const results: ScannedFile[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    // Skip hidden files, backup dirs, and node_modules
    if (
      entry.name.startsWith(".") ||
      entry.name === ".chaos-killer-backup" ||
      entry.name === "node_modules"
    ) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const subFiles = walkDirectory(fullPath, scanRoot, maxDepth, currentDepth + 1);
      results.push(...subFiles);
    } else if (entry.isFile()) {
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }
      const category = categorize(entry.name);
      results.push({
        path: fullPath,
        name: entry.name,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        category,
        destinationDir: path.join(scanRoot, category),
      });
    }
  }

  return results;
}

export function buildScanResult(directoryPath: string, files: ScannedFile[]): ScanResult {
  const byCategory: Partial<Record<FileCategory, ScannedFile[]>> = {};
  let totalSizeBytes = 0;

  for (const file of files) {
    if (!byCategory[file.category]) byCategory[file.category] = [];
    byCategory[file.category]!.push(file);
    totalSizeBytes += file.size;
  }

  const summary: CategorySummary[] = (Object.keys(byCategory) as FileCategory[]).map((cat) => ({
    category: cat,
    count: byCategory[cat]!.length,
    totalBytes: byCategory[cat]!.reduce((sum, f) => sum + f.size, 0),
  })).sort((a, b) => b.totalBytes - a.totalBytes);

  return {
    directoryPath,
    totalFiles: files.length,
    totalSizeBytes,
    byCategory,
    summary,
  };
}
