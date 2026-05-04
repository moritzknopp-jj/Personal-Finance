import { NextResponse } from "next/server";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paths: string[] = body.paths ?? [];

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: "No paths provided" }, { status: 400 });
    }

    let deleted = 0;
    const errors: Array<{ path: string; error: string }> = [];

    for (const filePath of paths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      } catch (err) {
        errors.push({ path: filePath, error: (err as Error).message });
      }
    }

    return NextResponse.json({ deleted, errors });
  } catch (err) {
    console.error("[/api/large-files/delete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
