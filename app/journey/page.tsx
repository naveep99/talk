"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Gate } from "@/components/Gate";
import { TabBar } from "@/components/TabBar";
import { CHARACTERS } from "@/lib/characters";
import { currentFocus, relativeDay, shortDuration, skillReads, type Trend } from "@/lib/journey";
import { completedSessions, useApp } from "@/lib/store";

const TREND: Record<Trend, string> = { up: "↑ Improving", flat: "→ Stable", down: "↓ Needs work", new: "First read" };

function Journey() {
  const profile = useApp((s) => s.profile);
  const all = useApp((s) => s.sessions);
  const sessions = completedSessions(all);
  const dayOffset = useApp((s) => s.dayOffset);
  const { advanceDay, loadSample, reset } = useApp.getState();
  const [engine, setEngine] = useState<string>("…");
  const [confirmReset, setConfirmReset] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then((j) => setEngine(j.engine === "claude" ? `Claude (${j.model})` : "Local simulation")).catch(() => setEngine("unknown"));
  }, []);

  const reads = skillReads(sessions).filter((r) => r.key !== "awkwardness" || sessions.length > 0);
  const latest = [...sessions].reverse().find((s) => s.report);
  const recent = [...sessions].reverse().slice(0, 6);

  return (
    <>
      <main className="page">
        <p className="eyebrow">Your dating journey</p>
        <h1 className="h-display" style={{ marginTop: 10 }}>
          {sessions.length === 0 ? "It starts with one conversation." : sessions.length < 3 ? "You've started." : "You're building something."}
        </h1>

        <div className="focus" style={{ marginTop: 22 }}>
          <span style={{ fontSize: 18 }}>◎</span>
          <div>
            <span className="eyebrow" style={{ fontSize: 10.5 }}>Current focus</span>
            <p>{currentFocus(profile, sessions)}</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="card card-quiet" style={{ marginTop: 22, textAlign: "center", padding: 26 }}>
            <p className="serif" style={{ fontSize: 22, margin: 0 }}>Nothing to reflect on yet.</p>
            <p className="muted" style={{ margin: "8px 0 18px", fontSize: 14 }}>
              Have one conversation and this becomes your mirror: how you come across, what&rsquo;s improving, and what to work on next.
            </p>
            <Link href="/chat/riya" className="btn btn-primary btn-block">Start with Riya</Link>
            <button className="btn btn-block muted" style={{ height: 40, marginTop: 6, fontSize: 13.5 }} onClick={() => void loadSample()}>
              Or explore with a sample journey
            </button>
          </div>
        ) : (
          <>
            <div className="h-section">
              <span>Your progress</span>
              <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>{sessions.length} conversation{sessions.length === 1 ? "" : "s"}</span>
            </div>
            <div className="card" style={{ padding: "4px 18px" }}>
              <div className="skills">
                {reads.slice(0, 5).map((r) => (
                  <div key={r.key} className="skill">
                    <span className="name">{r.label}</span>
                    <span className="bar" aria-hidden><i style={{ width: `${r.value}%` }} /></span>
                    <span className={`trend trend-${r.trend}`}>{r.trend === "new" ? r.level : TREND[r.trend]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-section">Recent conversations</div>
            <div className="card" style={{ padding: "4px 18px" }}>
              {recent.map((s) => {
                const c = CHARACTERS[s.characterId];
                return (
                  <Link key={s.id} href={`/report/${s.id}`} className="convo">
                    <Avatar c={c} size={40} />
                    <div className="who">
                      <b>{c.name}</b>
                      <span>Connection {s.endInterest} · {shortDuration((s.endedAt ?? 0) - s.startedAt)}</span>
                    </div>
                    <span className="when">{relativeDay(s.endedAt ?? s.startedAt)}</span>
                  </Link>
                );
              })}
            </div>

            {latest?.report && (
              <>
                <div className="h-section">Pattern noticed</div>
                <div className="insight">
                  <span className="eyebrow" style={{ fontSize: 10.5 }}>From your conversations</span>
                  <p className="q">&ldquo;{latest.report.pattern}&rdquo;</p>
                </div>

                <div className="h-section">Coach recommendation</div>
                <div className="insight" style={{ background: "linear-gradient(135deg, rgba(255,139,118,.10), rgba(255,111,145,.03))", borderColor: "rgba(255,139,118,.2)" }}>
                  <p className="q" style={{ marginTop: 0 }}>&ldquo;{latest.report.coachNote}&rdquo;</p>
                  <Link href="/coach" className="link" style={{ display: "inline-block", marginTop: 12 }}>Talk to your coach →</Link>
                </div>
              </>
            )}
          </>
        )}

        <details className="proto">
          <summary>Prototype controls</summary>
          <p style={{ margin: "10px 0 0" }}>Engine: {engine}. Day {dayOffset > 0 ? `+${dayOffset}` : "0"} of their lives.</p>
          <div className="btns">
            <button className="btn btn-ghost btn-sm" onClick={advanceDay}>Skip ahead a day</button>
            <button className="btn btn-ghost btn-sm" onClick={() => void loadSample()}>Load sample journey</button>
            {confirmReset ? (
              <>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--warn)" }} onClick={() => { reset(); router.replace("/welcome"); }}>Yes, clear everything</button>
                <button className="btn btn-sm muted" onClick={() => setConfirmReset(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>Reset</button>
            )}
          </div>
        </details>
      </main>
      <TabBar />
    </>
  );
}

export default function Page() {
  return (
    <Gate>
      <Journey />
    </Gate>
  );
}
