import { readConfig, writeConfig, computeNextRun } from "./schedule-store";
import type { ScheduleConfig } from "@/types";

let activeJob: ReturnType<typeof import("node-cron").schedule> | null = null;

function buildCronExpression(config: ScheduleConfig): string {
  if (config.frequency === "daily") {
    return `0 ${config.hour} * * *`;
  }
  return `0 ${config.hour} * * ${config.dayOfWeek}`;
}

async function runCleanup(): Promise<string[]> {
  const log: string[] = [];
  const config = readConfig();

  if (!config.targetDirectory) {
    log.push("No target directory configured");
    return log;
  }

  try {
    const { walkDirectory, buildScanResult } = await import("./file-scanner");
    const { moveFiles } = await import("./file-mover");
    const { detectDuplicates } = await import("./duplicate-detector");
    const { findLargeFiles } = await import("./large-file-finder");
    const { unlinkSync } = await import("fs");

    log.push(`Scanning: ${config.targetDirectory}`);
    const files = walkDirectory(config.targetDirectory, config.targetDirectory);
    const scan = buildScanResult(config.targetDirectory, files);
    log.push(`Found ${scan.totalFiles} files`);

    const sortResult = moveFiles(files, config.targetDirectory);
    log.push(`Sorted: ${sortResult.moved} moved, ${sortResult.skipped} skipped`);

    if (config.autoDeleteDuplicates) {
      const dupResult = detectDuplicates(files);
      let deleted = 0;
      for (const group of dupResult.groups) {
        const toDelete = group.files.slice(1);
        for (const f of toDelete) {
          try {
            unlinkSync(f.path);
            deleted++;
          } catch { /* skip locked files */ }
        }
      }
      log.push(`Duplicates: deleted ${deleted} files`);
    }

    if (config.autoDeleteLargeFiles) {
      const largeResult = findLargeFiles(files, config.largeFileThresholdMB);
      let deleted = 0;
      for (const f of largeResult.files) {
        if (f.score >= 70) {
          try {
            unlinkSync(f.path);
            deleted++;
          } catch { /* skip locked files */ }
        }
      }
      log.push(`Large files: deleted ${deleted} high-score files`);
    }

    log.push("Cleanup complete");
  } catch (err) {
    log.push(`Error: ${(err as Error).message}`);
  }

  const updatedConfig = readConfig();
  updatedConfig.lastRunAt = new Date().toISOString();
  updatedConfig.runLog = [
    `[${new Date().toLocaleString()}] ${log.join(" | ")}`,
    ...(updatedConfig.runLog ?? []),
  ].slice(0, 10);
  const next = computeNextRun(updatedConfig);
  updatedConfig.nextRunAt = next ? next.toISOString() : null;
  writeConfig(updatedConfig);

  return log;
}

export async function initCronManager(): Promise<void> {
  const cron = await import("node-cron");
  const config = readConfig();
  if (config.enabled && config.targetDirectory) {
    const expr = buildCronExpression(config);
    activeJob = cron.schedule(expr, runCleanup);
    console.log(`[ChaosKiller] Cron scheduled: ${expr}`);
  }
}

export async function rescheduleJob(config: ScheduleConfig): Promise<void> {
  const cron = await import("node-cron");
  if (activeJob) {
    activeJob.stop();
    activeJob = null;
  }
  if (config.enabled && config.targetDirectory) {
    const expr = buildCronExpression(config);
    activeJob = cron.schedule(expr, runCleanup);
    console.log(`[ChaosKiller] Rescheduled: ${expr}`);
  }
}

export { runCleanup };
