"use client";

import React, { useState } from "react";
import { Trash2, Loader2, CheckCircle } from "lucide-react";
import { DirectoryInput } from "./DirectoryInput";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CategoryBadge } from "./CategoryBadge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { useToast } from "./ui/toast";
import { formatBytes, formatAge } from "@/lib/utils";
import type { LargeFileScanResult, LargeFile } from "@/types";

type SortKey = "size" | "score" | "age";

export function LargeFilesPanel() {
  const [result, setResult] = useState<LargeFileScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [thresholdMB, setThresholdMB] = useState(50);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("size");
  const { addToast } = useToast();

  async function handleScan(dirPath: string) {
    setIsScanning(true);
    setResult(null);
    setSelectedPaths(new Set());
    setCurrentPath(dirPath);
    try {
      const res = await fetch("/api/large-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryPath: dirPath, thresholdMB }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setResult(await res.json());
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleRescan() {
    if (currentPath) handleScan(currentPath);
  }

  async function handleDelete() {
    setConfirmOpen(false);
    setIsDeleting(true);
    try {
      const res = await fetch("/api/large-files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [...selectedPaths] }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      addToast(`Deleted ${data.deleted} files`, "success");
      if (result) {
        setResult({
          ...result,
          files: result.files.filter((f) => !selectedPaths.has(f.path)),
        });
      }
      setSelectedPaths(new Set());
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setIsDeleting(false);
    }
  }

  function togglePath(filePath: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  }

  function toggleAll() {
    if (!result) return;
    if (selectedPaths.size === result.files.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(result.files.map((f) => f.path)));
    }
  }

  const sortedFiles = result
    ? [...result.files].sort((a, b) => {
        if (sortBy === "size") return b.size - a.size;
        if (sortBy === "score") return b.score - a.score;
        return a.mtimeMs - b.mtimeMs; // oldest first
      })
    : [];

  const selectedBytes = result
    ? result.files.filter((f) => selectedPaths.has(f.path)).reduce((s, f) => s + f.size, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <DirectoryInput onSubmit={handleScan} isLoading={isScanning} submitLabel="Scan" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-slate-500 whitespace-nowrap">Min size:</span>
          <Input
            type="number"
            min={1}
            max={10240}
            value={thresholdMB}
            onChange={(e) => setThresholdMB(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-slate-500">MB</span>
          {currentPath && (
            <Button variant="outline" size="sm" onClick={handleRescan} disabled={isScanning}>
              Apply
            </Button>
          )}
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold dark:text-white">{result.totalFiles}</div>
                <div className="text-xs text-slate-500 mt-1">Large Files Found</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-red-500">{formatBytes(result.totalSizeBytes)}</div>
                <div className="text-xs text-slate-500 mt-1">Total Size</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-orange-500">{formatBytes(selectedBytes)}</div>
                <div className="text-xs text-slate-500 mt-1">Selected to Free</div>
              </CardContent>
            </Card>
          </div>

          {result.totalFiles === 0 ? (
            <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>No large files found above {thresholdMB} MB!</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {(["size", "score", "age"] as SortKey[]).map((key) => (
                    <Button
                      key={key}
                      variant={sortBy === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(key)}
                    >
                      {key === "size" ? "By Size" : key === "score" ? "By Junk Score" : "By Age"}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedPaths.size === 0 || isDeleting}
                  onClick={() => setConfirmOpen(true)}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete {selectedPaths.size > 0 ? selectedPaths.size : ""} Selected
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="p-3 w-10">
                            <input
                              type="checkbox"
                              checked={selectedPaths.size === result.files.length && result.files.length > 0}
                              onChange={toggleAll}
                              className="h-4 w-4 rounded"
                            />
                          </th>
                          <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-400">File</th>
                          <th className="p-3 text-right font-medium text-slate-600 dark:text-slate-400">Size</th>
                          <th className="p-3 text-center font-medium text-slate-600 dark:text-slate-400">Age</th>
                          <th className="p-3 text-center font-medium text-slate-600 dark:text-slate-400">Category</th>
                          <th className="p-3 text-center font-medium text-slate-600 dark:text-slate-400">Junk Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedFiles.map((file) => (
                          <LargeFileRow
                            key={file.path}
                            file={file}
                            selected={selectedPaths.has(file.path)}
                            onToggle={() => togglePath(file.path)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <DeleteConfirmDialog
        open={confirmOpen}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        fileCount={selectedPaths.size}
        totalBytes={selectedBytes}
      />
    </div>
  );
}

function LargeFileRow({
  file,
  selected,
  onToggle,
}: {
  file: LargeFile;
  selected: boolean;
  onToggle: () => void;
}) {
  const scoreColor =
    file.score >= 70 ? "bg-red-500" : file.score >= 40 ? "bg-orange-500" : "bg-yellow-400";

  return (
    <tr
      className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
        selected ? "bg-red-50 dark:bg-red-950/20" : ""
      }`}
    >
      <td className="p-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 rounded" />
      </td>
      <td className="p-3">
        <div className="font-medium truncate max-w-[240px] dark:text-white" title={file.path}>
          {file.name}
        </div>
        <div className="text-xs text-slate-400 truncate max-w-[240px]">{file.path}</div>
      </td>
      <td className="p-3 text-right font-mono font-medium dark:text-white">{formatBytes(file.size)}</td>
      <td className="p-3 text-center text-slate-500 dark:text-slate-400">{formatAge(file.mtimeMs)}</td>
      <td className="p-3 text-center">
        <CategoryBadge category={file.category} />
      </td>
      <td className="p-3 w-28">
        <div className="flex items-center gap-2">
          <Progress value={file.score} indicatorClassName={scoreColor} className="h-2" />
          <span className="text-xs text-slate-500 w-6 shrink-0">{file.score}</span>
        </div>
      </td>
    </tr>
  );
}
