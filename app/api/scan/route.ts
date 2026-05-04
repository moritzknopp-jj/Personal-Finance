import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { walkDirectory, buildScanResult } from "@/lib/file-scanner";
import { validateDirectoryPath } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dirPath = body.directoryPath as string;

    const validationError = validateDirectoryPath(dirPath);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const resolved = path.resolve(dirPath);
    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "Directory not found" }, { status: 404 });
    }
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 });
    }

    const files = walkDirectory(resolved, resolved, body.maxDepth ?? 5);
    const result = buildScanResult(resolved, files);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    console.error("[/api/scan]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
