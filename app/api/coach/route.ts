import { NextResponse } from "next/server";
import { bad, readJson } from "@/lib/api-util";
import { engine } from "@/lib/engine";
import type { CoachRequest } from "@/lib/types";

export async function POST(req: Request) {
  const body = await readJson<CoachRequest>(req);
  if (!body || typeof body.message !== "string" || !body.message.trim() || !body.profile) return bad("invalid request");
  return NextResponse.json(await engine.coach({ ...body, sessions: body.sessions ?? [], history: body.history ?? [] }));
}
