import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { walkDirectory } from "@/lib/file-scanner";
import { findLargeFiles } from "@/lib/large-file-finder";
import { validateDirectoryPath } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dirPath = body.directoryPath as string;
    const thresholdMB = Number(body.thresholdMB) || 50;

    const validationError = validateDirectoryPath(dirPath);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const resolved = path.resolve(dirPath);
    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "Directory not found" }, { status: 404 });
    }
    if (!fs.statSync(resolved).isDirectory()) {
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 });
    }

    const files = walkDirectory(resolved, resolved);
    const result = findLargeFiles(files, thresholdMB);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/large-files]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
