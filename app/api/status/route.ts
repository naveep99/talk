import { NextResponse } from "next/server";
import { claudeEnabled, MODEL } from "@/lib/engine/llm/client";

export function GET() {
  return NextResponse.json({ engine: claudeEnabled() ? "claude" : "local", model: claudeEnabled() ? MODEL : null });
}
