import type {
  ChatRequest, ChatResponse, CoachRequest, CoachResponse, HelpRequest, HelpResponse, ReportRequest, ReportResponse,
} from "./types";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  chat: (b: ChatRequest) => post<ChatResponse>("/api/chat", b),
  help: (b: HelpRequest) => post<HelpResponse>("/api/help", b),
  report: (b: ReportRequest) => post<ReportResponse>("/api/report", b),
  coach: (b: CoachRequest) => post<CoachResponse>("/api/coach", b),
};
