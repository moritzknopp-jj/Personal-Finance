import Link from "next/link";
import { ArrowLeft, HardDrive } from "lucide-react";
import { LargeFilesPanel } from "@/components/LargeFilesPanel";

export default function LargeFilesPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-red-500" />
            <h1 className="text-lg font-semibold text-slate-900">Large Junk Files</h1>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-slate-500 mb-6">
          Find files above a size threshold. The junk score (0–100) weighs size, age, and file type
          to help you prioritize what to delete first.
        </p>
        <LargeFilesPanel />
      </main>
    </div>
  );
}
