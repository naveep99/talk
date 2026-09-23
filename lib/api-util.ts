import { NextResponse } from "next/server";
import { CHARACTERS } from "./characters";

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function validCharacter(id: unknown): boolean {
  return typeof id === "string" && id in CHARACTERS;
}

export function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
