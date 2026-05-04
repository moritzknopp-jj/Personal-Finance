import fs from "fs";
import path from "path";
import type { ScheduleConfig } from "@/types";

const CONFIG_PATH = path.join(process.cwd(), "data", "schedule-config.json");

const DEFAULT_CONFIG: ScheduleConfig = {
  enabled: false,
  frequency: "weekly",
  hour: 9,
  dayOfWeek: 6,
  targetDirectory: "",
  autoDeleteDuplicates: false,
  autoDeleteLargeFiles: false,
  largeFileThresholdMB: 50,
  lastRunAt: null,
  nextRunAt: null,
  runLog: [],
};

export function readConfig(): ScheduleConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function writeConfig(config: ScheduleConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = CONFIG_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2));
  fs.renameSync(tmp, CONFIG_PATH);
}

export function computeNextRun(config: ScheduleConfig): Date | null {
  if (!config.enabled) return null;
  const now = new Date();
  const next = new Date();
  next.setSeconds(0, 0);
  next.setMinutes(0);
  next.setHours(config.hour);

  if (config.frequency === "daily") {
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  // Weekly
  const targetDay = config.dayOfWeek;
  const currentDay = next.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;
  if (daysUntil === 0 && next <= now) daysUntil = 7;
  next.setDate(next.getDate() + daysUntil);
  return next;
}
