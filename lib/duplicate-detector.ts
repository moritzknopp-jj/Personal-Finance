import fs from "fs";
import crypto from "crypto";
import type { DuplicateGroup, DuplicateScanResult } from "@/types";

function hashBuffer(buf: Buffer, algorithm = "sha256"): string {
  return crypto.createHash(algorithm).update(buf).digest("hex");
}

function readPartial(filePath: string, bytes = 65536): Buffer | null {
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(Math.min(bytes, 65536));
    const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    return buf.slice(0, bytesRead);
  } catch {
    return null;
  }
}

function hashFileFull(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath);
    return hashBuffer(content);
  } catch {
    return null;
  }
}

interface FileEntry {
  path: string;
  name: string;
  size: number;
  mtimeMs: number;
}

export function detectDuplicates(files: FileEntry[]): DuplicateScanResult {
  // Phase 1: group by size
  const bySize = new Map<number, FileEntry[]>();
  for (const f of files) {
    if (f.size === 0) continue; // skip empty files
    const arr = bySize.get(f.size) ?? [];
    arr.push(f);
    bySize.set(f.size, arr);
  }

  // Phase 2: partial hash on size candidates
  const byPartialHash = new Map<string, FileEntry[]>();
  for (const [, sizeGroup] of bySize) {
    if (sizeGroup.length < 2) continue;
    for (const file of sizeGroup) {
      const buf = readPartial(file.path);
      if (!buf) continue;
      const key = `${file.size}:${hashBuffer(buf)}`;
      const arr = byPartialHash.get(key) ?? [];
      arr.push(file);
      byPartialHash.set(key, arr);
    }
  }

  // Phase 3: full hash on partial-hash matches
  const byFullHash = new Map<string, FileEntry[]>();
  for (const [, partialGroup] of byPartialHash) {
    if (partialGroup.length < 2) continue;
    for (const file of partialGroup) {
      const hash = hashFileFull(file.path);
      if (!hash) continue;
      const arr = byFullHash.get(hash) ?? [];
      arr.push(file);
      byFullHash.set(hash, arr);
    }
  }

  // Phase 4: build DuplicateGroup[]
  const groups: DuplicateGroup[] = [];
  let totalWastedBytes = 0;

  for (const [hash, fileGroup] of byFullHash) {
    if (fileGroup.length < 2) continue;
    // Sort oldest first (keep candidate = index 0)
    const sorted = [...fileGroup].sort((a, b) => a.mtimeMs - b.mtimeMs);
    const wastedBytes = sorted[0].size * (sorted.length - 1);
    totalWastedBytes += wastedBytes;
    groups.push({
      hash,
      files: sorted.map((f) => ({
        path: f.path,
        name: f.name,
        size: f.size,
        mtimeMs: f.mtimeMs,
      })),
      wastedBytes,
    });
  }

  // Sort groups by most wasted bytes first
  groups.sort((a, b) => b.wastedBytes - a.wastedBytes);

  return {
    totalGroups: groups.length,
    totalWastedBytes,
    groups,
  };
}
