import { NextResponse } from "next/server";
import { bad, readJson, validCharacter } from "@/lib/api-util";
import { engine } from "@/lib/engine";
import type { ReportRequest } from "@/lib/types";

export async function POST(req: Request) {
  const body = await readJson<ReportRequest>(req);
  if (!body || !validCharacter(body.characterId) || !Array.isArray(body.history)) return bad("invalid request");
  return NextResponse.json(await engine.report(body));
}
