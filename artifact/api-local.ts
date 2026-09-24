// In the single-page build there's no server: call the local engine directly.
import { localChat } from "@/lib/engine/local/chat";
import { localCoach } from "@/lib/engine/local/coach";
import { localHelp } from "@/lib/engine/local/help";
import { localReport } from "@/lib/engine/local/report";
import type { ChatRequest, CoachRequest, HelpRequest, ReportRequest } from "@/lib/types";

const later = <T,>(fn: () => T, ms: number) => new Promise<T>((resolve) => setTimeout(() => resolve(fn()), ms));

export const api = {
  chat: (b: ChatRequest) => later(() => localChat(b), 150),
  help: (b: HelpRequest) => later(() => localHelp(b), 350),
  report: (b: ReportRequest) => later(() => localReport(b), 1200),
  coach: (b: CoachRequest) => later(() => localCoach(b), 900),
};
