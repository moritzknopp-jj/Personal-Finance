"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { formatBytes } from "@/lib/utils";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fileCount: number;
  totalBytes: number;
  title?: string;
}

export function DeleteConfirmDialog({ open, onConfirm, onCancel, fileCount, totalBytes, title = "Confirm Delete" }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            You are about to permanently delete{" "}
            <strong>{fileCount} file{fileCount !== 1 ? "s" : ""}</strong>{" "}
            ({formatBytes(totalBytes)}). This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete {fileCount} file{fileCount !== 1 ? "s" : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
