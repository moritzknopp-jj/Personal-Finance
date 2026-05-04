"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, FolderInput, Copy, HardDrive, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DirectoryInput } from "@/components/DirectoryInput";
import { formatBytes } from "@/lib/utils";

interface QuickScanResult {
  totalFiles: number;
  totalSizeBytes: number;
  categories: number;
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">{icon}</div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <p className="text-sm text-slate-500">{description}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
            Open tool <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const [quickScan, setQuickScan] = useState<QuickScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuickScan(dirPath: string) {
    setIsScanning(true);
    setError(null);
    setQuickScan(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryPath: dirPath }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setQuickScan({
        totalFiles: data.totalFiles,
        totalSizeBytes: data.totalSizeBytes,
        categories: data.summary.length,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">File Chaos Killer</span>
          </div>
          <nav className="flex items-center gap-1 ml-6 sm:flex">
            <NavLink href="/scan" label="Sort Files" icon={<FolderInput className="h-4 w-4" />} />
            <NavLink href="/duplicates" label="Duplicates" icon={<Copy className="h-4 w-4" />} />
            <NavLink href="/large-files" label="Large Files" icon={<HardDrive className="h-4 w-4" />} />
            <NavLink href="/schedule" label="Schedule" icon={<Calendar className="h-4 w-4" />} />
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Kill the Chaos.{" "}
            <span className="text-orange-500">Own Your Files.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Scan any folder. Sort by type, find duplicates, surface large junk files, and schedule automatic cleanups.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Quick Scan</CardTitle>
            <CardDescription>Enter a directory path to get a snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DirectoryInput
              onSubmit={handleQuickScan}
              isLoading={isScanning}
              submitLabel="Scan"
              placeholder="/home/user/Downloads"
            />
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>
            )}
            {quickScan && (
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{quickScan.totalFiles}</div>
                  <div className="text-xs text-slate-500">Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{formatBytes(quickScan.totalSizeBytes)}</div>
                  <div className="text-xs text-slate-500">Total Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{quickScan.categories}</div>
                  <div className="text-xs text-slate-500">Categories</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureCard
            href="/scan"
            icon={<FolderInput className="h-6 w-6 text-blue-500" />}
            title="Auto-Sort Files"
            description="Organize photos, videos, PDFs, and more into neat subfolders. Preview before you commit."
          />
          <FeatureCard
            href="/duplicates"
            icon={<Copy className="h-6 w-6 text-orange-500" />}
            title="Find Duplicates"
            description="SHA-256 content hashing finds exact duplicates. See wasted space and delete in bulk."
          />
          <FeatureCard
            href="/large-files"
            icon={<HardDrive className="h-6 w-6 text-red-500" />}
            title="Large Junk Files"
            description="Surface files eating your disk. Junk scoring shows which are safe to delete first."
          />
          <FeatureCard
            href="/schedule"
            icon={<Calendar className="h-6 w-6 text-green-500" />}
            title="Auto Schedule"
            description="Set a daily or weekly cleanup to run automatically while the app is running."
          />
        </div>
      </main>
    </div>
  );
}
