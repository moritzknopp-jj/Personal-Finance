"use client";

import React, { useState } from "react";
import { Copy, Trash2, Loader2, CheckCircle } from "lucide-react";
import { DirectoryInput } from "./DirectoryInput";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import { useToast } from "./ui/toast";
import { formatBytes, formatAge } from "@/lib/utils";
import type { DuplicateScanResult, DuplicateGroup } from "@/types";

export function DuplicatesPanel() {
  const [result, setResult] = useState<DuplicateScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  async function handleScan(dirPath: string) {
    setIsScanning(true);
    setResult(null);
    setSelectedPaths(new Set());
    try {
      const res = await fetch("/api/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryPath: dirPath }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data: DuplicateScanResult = await res.json();
      setResult(data);
      // Auto-select all non-keep files
      const autoSelected = new Set<string>();
      data.groups.forEach((g) => g.files.slice(1).forEach((f) => autoSelected.add(f.path)));
      setSelectedPaths(autoSelected);
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleDelete() {
    setConfirmOpen(false);
    setIsDeleting(true);
    try {
      const res = await fetch("/api/duplicates/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [...selectedPaths] }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      addToast(`Deleted ${data.deleted} duplicate files`, "success");
      // Remove deleted files from result
      if (result) {
        const remaining = result.groups
          .map((g) => ({
            ...g,
            files: g.files.filter((f) => !selectedPaths.has(f.path)),
          }))
          .filter((g) => g.files.length > 1);
        setResult({ ...result, groups: remaining, totalGroups: remaining.length });
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

  const selectedBytes = result
    ? result.groups
        .flatMap((g) => g.files)
        .filter((f) => selectedPaths.has(f.path))
        .reduce((s, f) => s + f.size, 0)
    : 0;

  return (
    <div className="space-y-6">
      <DirectoryInput onSubmit={handleScan} isLoading={isScanning} submitLabel="Find Duplicates" />

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-orange-500">{result.totalGroups}</div>
                <div className="text-xs text-slate-500 mt-1">Duplicate Groups</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-red-500">{formatBytes(result.totalWastedBytes)}</div>
                <div className="text-xs text-slate-500 mt-1">Wasted Space</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold dark:text-white">{selectedPaths.size}</div>
                <div className="text-xs text-slate-500 mt-1">Selected to Delete</div>
              </CardContent>
            </Card>
          </div>

          {result.totalGroups === 0 ? (
            <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>No duplicates found!</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedPaths.size} files selected ({formatBytes(selectedBytes)} to free)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedPaths.size === 0 || isDeleting}
                  onClick={() => setConfirmOpen(true)}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Selected
                </Button>
              </div>

              <div className="space-y-4">
                {result.groups.map((group) => (
                  <DuplicateGroupCard
                    key={group.hash}
                    group={group}
                    selectedPaths={selectedPaths}
                    onToggle={togglePath}
                  />
                ))}
              </div>
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

function DuplicateGroupCard({
  group,
  selectedPaths,
  onToggle,
}: {
  group: DuplicateGroup;
  selectedPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium dark:text-white">{group.files.length} identical files</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">{formatBytes(group.files[0].size)} each</Badge>
            <Badge variant="destructive">-{formatBytes(group.wastedBytes)} wasted</Badge>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono truncate">SHA-256: {group.hash.slice(0, 16)}...</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {group.files.map((file, i) => {
            const isKeep = i === 0;
            const isSelected = selectedPaths.has(file.path);
            return (
              <div
                key={file.path}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isKeep}
                  onChange={() => onToggle(file.path)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate dark:text-white">{file.name}</div>
                  <div className="text-xs text-slate-400 truncate">{file.path}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{formatAge(file.mtimeMs)}</span>
                  {isKeep && (
                    <Badge variant="success" className="text-xs">Keep</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
