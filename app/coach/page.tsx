"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Avatar, COACH_LOOK } from "@/components/Avatar";
import { Gate } from "@/components/Gate";
import { IconSend } from "@/components/Icons";
import { Markdown } from "@/components/Markdown";
import { TabBar } from "@/components/TabBar";
import { api } from "@/lib/api";
import { CHARACTERS } from "@/lib/characters";
import { completedSessions, useApp } from "@/lib/store";
import type { CoachSessionSummary, Session } from "@/lib/types";

const STARTERS = [
  "How am I doing?",
  "Why do I freeze when I approach someone?",
  "She hasn't replied in 6 hours. Should I text again?",
  "I don't know how to flirt.",
  "I went on a date and it felt awkward.",
  "Why do I keep running out of things to say?",
];

function summarize(s: Session): CoachSessionSummary {
  return {
    characterId: s.characterId,
    startInterest: s.startInterest,
    endInterest: s.endInterest ?? s.startInterest,
    durationMin: Math.max(1, Math.round(((s.endedAt ?? s.startedAt) - s.startedAt) / 60000)),
    stats: s.stats,
    pattern: s.report?.pattern,
    improve: s.report?.improve,
    coachNote: s.report?.coachNote,
    skills: s.report?.skills,
    endedAt: s.endedAt ?? s.startedAt,
  };
}

function opening(name: string, sessions: Session[]): string {
  const hi = name ? `Hey ${name}.` : "Hey.";
  if (!sessions.length)
    return `${hi} I'm your coach. I'll watch how your practice conversations go and help you spot what's working.\n\nYou can ask me anything — about practice, or about real life. Something on your mind?`;
  const last = sessions[sessions.length - 1];
  const who = CHARACTERS[last.characterId].name;
  return `${hi} I saw your chat with ${who}.${last.report ? ` ${last.report.coachNote}` : ""}\n\nWhat do you want to work on?`;
}

function Coach() {
  const params = useSearchParams();
  const profile = useApp((s) => s.profile)!;
  const coach = useApp((s) => s.coach);
  const all = useApp((s) => s.sessions);
  const sessions = completedSessions(all);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const about = params.get("about");
    const st = useApp.getState();
    const s = about ? st.sessions.find((x) => x.id === about) : undefined;
    if (s?.report) {
      const who = CHARACTERS[s.characterId].name;
      st.addCoachMessage({ from: "coach", text: `Let's talk about your chat with ${who}. The main thing I noticed: ${s.report.improve.charAt(0).toLowerCase()}${s.report.improve.slice(1)}\n\n${s.report.pattern}\n\nHow did it feel from your side?` });
    } else if (!st.coach.length) {
      st.addCoachMessage({ from: "coach", text: opening(st.profile?.name ?? "", completedSessions(st.sessions)) });
    }
  }, [params]);

  useLayoutEffect(() => {
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }));
  }, [coach.length, thinking]);

  const ask = async (text: string) => {
    const msg = text.trim();
    if (!msg || thinking) return;
    const st = useApp.getState();
    const history = st.coach.map((m) => ({ from: m.from, text: m.text }));
    st.addCoachMessage({ from: "user", text: msg });
    setDraft("");
    setThinking(true);
    try {
      const res = await api.coach({ profile, sessions: completedSessions(st.sessions).map(summarize), history, message: msg });
      useApp.getState().addCoachMessage({ from: "coach", text: res.text });
    } catch {
      useApp.getState().addCoachMessage({ from: "coach", text: "Sorry — I lost my train of thought there. Ask me again?" });
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="chat coach">
      <header className="chat-head">
        <div className="chat-head-row" style={{ paddingLeft: 6 }}>
          <Avatar c={COACH_LOOK} size={42} />
          <div>
            <div className="chat-name">Your coach</div>
            <span className="status">
              {sessions.length ? `Knows your last ${sessions.length} conversation${sessions.length === 1 ? "" : "s"}` : "Always here"}
            </span>
          </div>
        </div>
      </header>

      <div className="thread" ref={threadRef}>
        <div className="thread-inner">
          {coach.map((m) => (
            <div key={m.id} className={`row ${m.from === "user" ? "me" : "her"}`}>
              <div className="bubble">{m.from === "coach" ? <Markdown text={m.text} /> : m.text}</div>
            </div>
          ))}
          {thinking && (
            <div className="row her" style={{ marginTop: 8 }}>
              <div className="typing"><i /><i /><i /></div>
            </div>
          )}
        </div>
      </div>

      <div style={{ paddingBottom: 84 }}>
        {coach.filter((m) => m.from === "user").length < 2 && (
          <div className="starters">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => void ask(s)}>{s}</button>
            ))}
          </div>
        )}
        <div className="composer" style={{ paddingBottom: 6 }}>
          <div className="composer-box">
            <textarea
              rows={1}
              value={draft}
              placeholder="Ask your coach anything"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(draft);
                }
              }}
              aria-label="Message your coach"
            />
            <button className="send" onClick={() => void ask(draft)} disabled={!draft.trim() || thinking} aria-label="Send">
              <IconSend />
            </button>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}

export default function Page() {
  return (
    <Gate>
      <Suspense>
        <Coach />
      </Suspense>
    </Gate>
  );
}
