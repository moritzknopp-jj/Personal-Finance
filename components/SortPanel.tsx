"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle, Loader2, FolderInput } from "lucide-react";
import { DirectoryInput } from "./DirectoryInput";
import { CategoryBadge } from "./CategoryBadge";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/toast";
import { formatBytes } from "@/lib/utils";
import type { ScanResult, MoveOperation, SortResult } from "@/types";

export function SortPanel() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<MoveOperation[] | null>(null);
  const [sortResult, setSortResult] = useState<SortResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const { addToast } = useToast();

  async function handleScan(dirPath: string) {
    setIsScanning(true);
    setScanResult(null);
    setPreview(null);
    setSortResult(null);
    setCurrentPath(dirPath);
    try {
      const [scanRes, previewRes] = await Promise.all([
        fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ directoryPath: dirPath }) }),
        fetch("/api/sort", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ directoryPath: dirPath, dryRun: true }) }),
      ]);
      if (!scanRes.ok) throw new Error((await scanRes.json()).error);
      if (!previewRes.ok) throw new Error((await previewRes.json()).error);
      const [scan, prev] = await Promise.all([scanRes.json(), previewRes.json()]);
      setScanResult(scan);
      setPreview(prev.preview);
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSort() {
    setConfirmOpen(false);
    setIsSorting(true);
    try {
      const res = await fetch("/api/sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryPath: currentPath, dryRun: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const result: SortResult = await res.json();
      setSortResult(result);
      setPreview(null);
      addToast(`Sorted ${result.moved} files successfully`, "success");
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setIsSorting(false);
    }
  }

  const groupedPreview = preview
    ? preview.reduce<Record<string, MoveOperation[]>>((acc, op) => {
        if (!acc[op.category]) acc[op.category] = [];
        acc[op.category].push(op);
        return acc;
      }, {})
    : null;

  return (
    <div className="space-y-6">
      <DirectoryInput onSubmit={handleScan} isLoading={isScanning} submitLabel="Scan & Preview" />

      {scanResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold dark:text-white">{scanResult.totalFiles}</div>
              <div className="text-xs text-slate-500 mt-1">Total Files</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold dark:text-white">{formatBytes(scanResult.totalSizeBytes)}</div>
              <div className="text-xs text-slate-500 mt-1">Total Size</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold dark:text-white">{scanResult.summary.length}</div>
              <div className="text-xs text-slate-500 mt-1">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-orange-500">{preview?.length ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Files to Move</div>
            </CardContent>
          </Card>
        </div>
      )}

      {groupedPreview && Object.keys(groupedPreview).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderInput className="h-5 w-5" />
                Sort Preview — {preview?.length} files will be organized
              </CardTitle>
              <Button onClick={() => setConfirmOpen(true)} disabled={isSorting}>
                {isSorting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Execute Sort
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedPreview)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([category, ops]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryBadge category={category as import("@/types").FileCategory} />
                      <span className="text-sm text-slate-500">{ops.length} file{ops.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-1 ml-2">
                      {ops.slice(0, 5).map((op) => (
                        <div key={op.from} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[200px]">{op.from.split("/").pop()}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[200px] text-slate-400">{op.to.split("/").slice(-2).join("/")}</span>
                        </div>
                      ))}
                      {ops.length > 5 && (
                        <div className="text-xs text-slate-400">+{ops.length - 5} more</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {scanResult && preview?.length === 0 && !sortResult && (
        <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span>All files are already organized!</span>
        </div>
      )}

      {sortResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Sort Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{sortResult.moved}</div>
                <div className="text-xs text-slate-500">Moved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-500">{sortResult.skipped}</div>
                <div className="text-xs text-slate-500">Skipped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{sortResult.errors.length}</div>
                <div className="text-xs text-slate-500">Errors</div>
              </div>
            </div>
            {sortResult.errors.length > 0 && (
              <div className="mt-4 space-y-1">
                {sortResult.errors.map((e) => (
                  <div key={e.path} className="text-xs text-red-600">{e.path}: {e.error}</div>
                ))}
              </div>
            )}
            <div className="mt-4 text-xs text-slate-400">
              Manifest saved to: {sortResult.backupDir}
            </div>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={confirmOpen}
        onConfirm={handleSort}
        onCancel={() => setConfirmOpen(false)}
        fileCount={preview?.length ?? 0}
        totalBytes={0}
        title="Execute File Sort?"
      />
    </div>
  );
}
