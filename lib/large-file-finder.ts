import type { LargeFile, LargeFileScanResult, ScannedFile } from "@/types";

const CATEGORY_SCORE: Record<string, number> = {
  Archives: 80,
  Videos: 60,
  Images: 30,
  Code: 10,
  Other: 50,
  PDFs: 40,
  Documents: 35,
  Audio: 45,
};

function computeScore(file: ScannedFile, thresholdBytes: number): number {
  const sizeScore = Math.min((file.size / thresholdBytes - 1) / 9, 1) * 100;
  const daysSince = (Date.now() - file.mtimeMs) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(Math.max((daysSince - 30) / 335, 0), 1) * 100;
  const catScore = CATEGORY_SCORE[file.category] ?? 40;
  return Math.round(sizeScore * 0.5 + ageScore * 0.3 + catScore * 0.2);
}

export function findLargeFiles(
  files: ScannedFile[],
  thresholdMB = 50
): LargeFileScanResult {
  const thresholdBytes = thresholdMB * 1024 * 1024;
  const large = files
    .filter((f) => f.size >= thresholdBytes)
    .map((f): LargeFile => ({
      path: f.path,
      name: f.name,
      size: f.size,
      mtimeMs: f.mtimeMs,
      score: computeScore(f, thresholdBytes),
      category: f.category,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 200);

  return {
    thresholdBytes,
    totalFiles: large.length,
    totalSizeBytes: large.reduce((s, f) => s + f.size, 0),
    files: large,
  };
}
