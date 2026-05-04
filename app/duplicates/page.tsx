import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { DuplicatesPanel } from "@/components/DuplicatesPanel";

export default function DuplicatesPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-orange-500" />
            <h1 className="text-lg font-semibold text-slate-900">Duplicate Files</h1>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-slate-500 mb-6">
          Find exact duplicate files using SHA-256 content hashing. The oldest copy is marked as the
          keeper — all others are pre-selected for deletion.
        </p>
        <DuplicatesPanel />
      </main>
    </div>
  );
}
