import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";

let client: Anthropic | null = null;

export function claudeEnabled(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

/**
 * One structured call. Throws on refusal / unparseable output so the caller can
 * fall back to the local engine — the user should never see a broken bubble.
 */
export async function structured<T extends z.ZodType>(opts: {
  system: string;
  user: string;
  schema: T;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<z.infer<T>> {
  const params = {
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4000,
    system: opts.system,
    messages: [{ role: "user" as const, content: opts.user }],
    output_config: { format: zodOutputFormat(opts.schema), effort: opts.effort ?? "low" },
    // Latency matters for chat; let the server re-route a declined request.
    fallbacks: "default",
  };
  const response = await getClient().messages.parse(
    params as unknown as Parameters<Anthropic["messages"]["parse"]>[0],
    { headers: { "anthropic-beta": "server-side-fallback-2026-07-01" }, timeout: 45_000 },
  );
  if (response.stop_reason === "refusal") throw new Error("refusal");
  if (response.stop_reason === "max_tokens") throw new Error("truncated");
  const parsed = (response as unknown as { parsed_output: z.infer<T> | null }).parsed_output;
  if (!parsed) throw new Error("unparseable");
  return parsed;
}

/** Plain-text call (the coach). */
export async function text(opts: { system: string; messages: Anthropic.MessageParam[]; effort?: "low" | "medium" | "high" }) {
  const params = {
    model: MODEL,
    max_tokens: 4000,
    system: opts.system,
    messages: opts.messages,
    output_config: { effort: opts.effort ?? "medium" },
    fallbacks: "default",
  };
  const response = await getClient().messages.create(
    params as unknown as Anthropic.MessageCreateParamsNonStreaming,
    { headers: { "anthropic-beta": "server-side-fallback-2026-07-01" }, timeout: 60_000 },
  );
  if (response.stop_reason === "refusal") throw new Error("refusal");
  const out = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!out) throw new Error("empty");
  return out;
}
