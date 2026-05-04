import Link from "next/link";
import { ArrowLeft, FolderInput } from "lucide-react";
import { SortPanel } from "@/components/SortPanel";

export default function ScanPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <FolderInput className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-semibold text-slate-900">Auto-Sort Files</h1>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-slate-500 mb-6">
          Scan a directory, preview how files will be sorted into category subfolders, then execute.
          A manifest is saved so you know exactly what moved.
        </p>
        <SortPanel />
      </main>
    </div>
  );
}
