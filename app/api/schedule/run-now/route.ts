import { NextResponse } from "next/server";
import { runCleanup } from "@/lib/cron-manager";

export async function POST() {
  try {
    const log = await runCleanup();
    return NextResponse.json({ startedAt: new Date().toISOString(), log });
  } catch (err) {
    console.error("[POST /api/schedule/run-now]", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
