import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatAge(mtimeMs: number): string {
  const now = Date.now();
  const diffMs = now - mtimeMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const SYSTEM_PATH_BLOCKLIST = ["/etc", "/usr", "/bin", "/sbin", "/proc", "/sys", "/dev", "/boot", "/lib", "/lib64"];

export function validateDirectoryPath(dirPath: string): string | null {
  if (!dirPath || typeof dirPath !== "string") return "Path is required";
  if (!dirPath.startsWith("/") && !dirPath.match(/^[A-Za-z]:\\/)) {
    if (!dirPath.startsWith("~")) return "Path must be absolute";
  }
  for (const blocked of SYSTEM_PATH_BLOCKLIST) {
    if (dirPath === blocked || dirPath.startsWith(blocked + "/")) {
      return `Cannot operate on system path: ${blocked}`;
    }
  }
  return null;
}
