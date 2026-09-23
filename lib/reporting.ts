"use client";

import { api } from "./api";
import { useApp } from "./store";

const inflight = new Map<string, Promise<void>>();

/** Build the debrief for a finished conversation (once), and store it on the session. */
export function generateReport(sessionId: string): Promise<void> {
  const existing = inflight.get(sessionId);
  if (existing) return existing;
  const job = (async () => {
    const st = useApp.getState();
    const session = st.sessions.find((s) => s.id === sessionId);
    if (!session || session.report || !session.endedAt) return;
    const rt = st.chars[session.characterId];
    const history = rt.messages.filter((m) => m.sessionId === sessionId).map((m) => ({ from: m.from, text: m.text }));
    const res = await api.report({
      characterId: session.characterId,
      history,
      stats: session.stats,
      startInterest: session.startInterest,
      endInterest: session.endInterest ?? rt.state.interest,
      durationMs: session.endedAt - session.startedAt,
      perception: rt.perception,
      profile: { experience: st.profile?.experience ?? "a_little", struggles: st.profile?.struggles ?? [], goals: st.profile?.goals ?? [] },
    });
    useApp.getState().setReport(sessionId, res.report);
  })().finally(() => inflight.delete(sessionId));
  inflight.set(sessionId, job);
  return job;
}
