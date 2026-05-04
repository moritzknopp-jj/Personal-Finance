export type FileCategory =
  | "Images"
  | "Videos"
  | "PDFs"
  | "Documents"
  | "Archives"
  | "Audio"
  | "Code"
  | "Other";

export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  mtimeMs: number;
  category: FileCategory;
  destinationDir: string;
}

export interface CategorySummary {
  category: FileCategory;
  count: number;
  totalBytes: number;
}

export interface ScanResult {
  directoryPath: string;
  totalFiles: number;
  totalSizeBytes: number;
  byCategory: Partial<Record<FileCategory, ScannedFile[]>>;
  summary: CategorySummary[];
}

export interface MoveOperation {
  from: string;
  to: string;
  category: FileCategory;
}

export interface SortResult {
  moved: number;
  skipped: number;
  errors: Array<{ path: string; error: string }>;
  backupDir: string;
  preview?: MoveOperation[];
}

export interface DuplicateFile {
  path: string;
  name: string;
  size: number;
  mtimeMs: number;
}

export interface DuplicateGroup {
  hash: string;
  files: DuplicateFile[];
  wastedBytes: number;
}

export interface DuplicateScanResult {
  totalGroups: number;
  totalWastedBytes: number;
  groups: DuplicateGroup[];
}

export interface LargeFile {
  path: string;
  name: string;
  size: number;
  mtimeMs: number;
  score: number;
  category: FileCategory;
}

export interface LargeFileScanResult {
  thresholdBytes: number;
  totalFiles: number;
  totalSizeBytes: number;
  files: LargeFile[];
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: "daily" | "weekly";
  hour: number;
  dayOfWeek: number;
  targetDirectory: string;
  autoDeleteDuplicates: boolean;
  autoDeleteLargeFiles: boolean;
  largeFileThresholdMB: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runLog: string[];
}
