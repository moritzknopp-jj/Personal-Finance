"use client";

import React, { useState, useEffect } from "react";
import { Clock, Play, Loader2, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { useToast } from "./ui/toast";
import { formatDuration } from "@/lib/utils";
import type { ScheduleConfig } from "@/types";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SchedulePanel() {
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => setConfig({ ...DEFAULT_CONFIG, ...data }))
      .catch(() => {});
  }, []);

  function update<K extends keyof ScheduleConfig>(key: K, value: ScheduleConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const saved = await res.json();
      setConfig(saved);
      setIsDirty(false);
      addToast("Schedule saved", "success");
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRunNow() {
    setIsRunning(true);
    setRunLog([]);
    try {
      const res = await fetch("/api/schedule/run-now", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setRunLog(data.log);
      addToast("Cleanup complete", "success");
      // Refresh config to get updated lastRunAt
      const cfgRes = await fetch("/api/schedule");
      if (cfgRes.ok) setConfig(await cfgRes.json());
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Auto-Clean Schedule
              </CardTitle>
              <CardDescription className="mt-1">
                Configure recurring cleanup to run automatically
              </CardDescription>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {config.enabled ? "Enabled" : "Disabled"}
              </span>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  config.enabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
                onClick={() => update("enabled", !config.enabled)}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    config.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
              Target Directory
            </label>
            <div className="flex gap-2">
              <Input
                value={config.targetDirectory}
                onChange={(e) => update("targetDirectory", e.target.value)}
                placeholder="/home/user/Downloads"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Frequency</label>
              <div className="flex gap-2">
                {(["daily", "weekly"] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => update("frequency", freq)}
                    className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                      config.frequency === freq
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                Run at hour
              </label>
              <Input
                type="number"
                min={0}
                max={23}
                value={config.hour}
                onChange={(e) => update("hour", Number(e.target.value))}
              />
            </div>
          </div>

          {config.frequency === "weekly" && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Day of week</label>
              <div className="flex gap-2">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => update("dayOfWeek", i)}
                    className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      config.dayOfWeek === i
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-actions</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoDeleteDuplicates}
                onChange={(e) => update("autoDeleteDuplicates", e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Auto-delete duplicate files</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoDeleteLargeFiles}
                onChange={(e) => update("autoDeleteLargeFiles", e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Auto-delete large junk files</span>
                <span className="text-xs text-slate-400 ml-2">(score ≥ 70)</span>
              </div>
            </label>
            {config.autoDeleteLargeFiles && (
              <div className="flex items-center gap-2 ml-7">
                <span className="text-sm text-slate-500">Threshold:</span>
                <Input
                  type="number"
                  min={1}
                  max={10240}
                  value={config.largeFileThresholdMB}
                  onChange={(e) => update("largeFileThresholdMB", Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-slate-500">MB</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={!isDirty || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Schedule
            </Button>
            <Button
              variant="outline"
              onClick={handleRunNow}
              disabled={!config.targetDirectory || isRunning}
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NextRunDisplay nextRunAt={config.nextRunAt} enabled={config.enabled} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Last Run</CardTitle>
          </CardHeader>
          <CardContent>
            {config.lastRunAt ? (
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {new Date(config.lastRunAt).toLocaleString()}
              </div>
            ) : (
              <div className="text-sm text-slate-400">Never run</div>
            )}
          </CardContent>
        </Card>
      </div>

      {(runLog.length > 0 || config.runLog?.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Run Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-slate-600 dark:text-slate-400">
              {runLog.length > 0
                ? runLog.map((line, i) => <div key={i}>{line}</div>)
                : config.runLog?.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NextRunDisplay({ nextRunAt, enabled }: { nextRunAt: string | null; enabled: boolean }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!nextRunAt || !enabled) return;
    function update() {
      if (!nextRunAt) return;
      const ms = new Date(nextRunAt).getTime() - Date.now();
      if (ms <= 0) {
        setCountdown("Running soon...");
        return;
      }
      setCountdown(formatDuration(ms));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextRunAt, enabled]);

  if (!enabled) return <div className="text-sm text-slate-400">Schedule is disabled</div>;
  if (!nextRunAt) return <div className="text-sm text-slate-400">Not configured</div>;
  return (
    <div>
      <div className="text-lg font-semibold dark:text-white">{countdown}</div>
      <div className="text-xs text-slate-400 mt-1">{new Date(nextRunAt).toLocaleString()}</div>
    </div>
  );
}
