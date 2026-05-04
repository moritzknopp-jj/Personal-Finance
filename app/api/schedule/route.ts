import { NextResponse } from "next/server";
import { readConfig, writeConfig, computeNextRun } from "@/lib/schedule-store";
import { rescheduleJob } from "@/lib/cron-manager";
import type { ScheduleConfig } from "@/types";

export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error("[GET /api/schedule]", err);
    return NextResponse.json({ error: "Failed to read schedule config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = readConfig();
    const updated: ScheduleConfig = { ...existing, ...body };

    const nextRun = computeNextRun(updated);
    updated.nextRunAt = nextRun ? nextRun.toISOString() : null;

    writeConfig(updated);
    await rescheduleJob(updated);

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/schedule]", err);
    return NextResponse.json({ error: "Failed to save schedule config" }, { status: 500 });
  }
}
