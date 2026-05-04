"use client";

import React, { useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Props {
  onSubmit: (path: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  submitLabel?: string;
  defaultValue?: string;
}

export function DirectoryInput({ onSubmit, isLoading, placeholder, submitLabel = "Scan", defaultValue = "" }: Props) {
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? "/home/user/Downloads"}
          className="pl-9"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading || !value.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );
}
