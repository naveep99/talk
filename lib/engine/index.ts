import type {
  ChatRequest,
  ChatResponse,
  CoachRequest,
  CoachResponse,
  HelpRequest,
  HelpResponse,
  ReportRequest,
  ReportResponse,
} from "../types";
import { localChat } from "./local/chat";
import { localCoach } from "./local/coach";
import { localHelp } from "./local/help";
import { localReport } from "./local/report";
import { claudeChat } from "./llm/chat";
import { claudeEnabled } from "./llm/client";
import { claudeCoach, claudeHelp, claudeReport } from "./llm/others";

// Claude when configured; the hand-written local engine otherwise, or if a
// call fails. The experience should never dead-end on an API error.

async function withFallback<T>(name: string, remote: () => Promise<T>, local: () => T): Promise<T> {
  if (!claudeEnabled()) return local();
  try {
    return await remote();
  } catch (err) {
    console.warn(`[engine] ${name} fell back to local:`, (err as Error).message);
    return local();
  }
}

export const engine = {
  chat: (r: ChatRequest): Promise<ChatResponse> => withFallback("chat", () => claudeChat(r), () => localChat(r)),
  help: (r: HelpRequest): Promise<HelpResponse> => withFallback("help", () => claudeHelp(r), () => localHelp(r)),
  report: (r: ReportRequest): Promise<ReportResponse> => withFallback("report", () => claudeReport(r), () => localReport(r)),
  coach: (r: CoachRequest): Promise<CoachResponse> => withFallback("coach", () => claudeCoach(r), () => localCoach(r)),
};
