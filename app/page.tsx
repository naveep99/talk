"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Gate } from "@/components/Gate";
import { Status } from "@/components/Status";
import { TabBar } from "@/components/TabBar";
import { CHARACTERS, CHARACTER_ORDER } from "@/lib/characters";
import { currentFocus } from "@/lib/journey";
import { allStatuses, nextOnline } from "@/lib/life";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";

function greeting(h: number) {
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const now = useNow();
  const profile = useApp((s) => s.profile)!;
  const chars = useApp((s) => s.chars);
  const sessions = useApp((s) => s.sessions);
  const statuses = allStatuses(now);
  const focus = currentFocus(profile, sessions);

  return (
    <>
      <main className="page">
        <p className="eyebrow">{greeting(now.getHours())}{profile.name ? `, ${profile.name}` : ""}</p>
        <h1 className="h-display" style={{ marginTop: 10 }}>Who do you want to talk to?</h1>

        <Link href="/journey" className="focus" style={{ marginTop: 20 }}>
          <span style={{ fontSize: 18 }}>◎</span>
          <div>
            <span className="eyebrow" style={{ fontSize: 10.5 }}>Your current focus</span>
            <p>{focus}</p>
          </div>
        </Link>

        <div className="people" style={{ marginTop: 22 }}>
          {CHARACTER_ORDER.map((id) => {
            const c = CHARACTERS[id];
            const rt = chars[id];
            const { status, activity } = statuses[id];
            const last = [...sessions].reverse().find((s) => s.characterId === id && s.endedAt);
            const inProgress = !!rt.activeSessionId && rt.messages.some((m) => m.sessionId === rt.activeSessionId);
            return (
              <Link key={id} href={`/chat/${id}`} className="person" aria-label={`Talk to ${c.name}`}>
                <div
                  className="person-glow"
                  style={{ background: `radial-gradient(120% 90% at 0% 0%, ${c.palette.a}, transparent 55%), radial-gradient(80% 80% at 100% 100%, ${c.palette.b}, transparent 60%)` }}
                />
                <div className="person-inner">
                  <Avatar c={c} size={76} status={status} breathe={status === "online"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span className="person-name">{c.name}</span>
                      <span className="muted" style={{ fontSize: 14 }}>{c.age}</span>
                    </div>
                    <div className="person-meta">{c.profession}</div>
                    <div style={{ marginTop: 6 }}>
                      <Status status={status} />
                    </div>
                    <div className="person-traits">{c.traits.join(" · ")}</div>
                    <div className="person-hint">&ldquo;{c.hint}&rdquo;</div>
                  </div>
                </div>
                <div className="person-foot">
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "58%" }}>
                    {inProgress
                      ? "Conversation in progress"
                      : status === "offline"
                        ? `Back ${nextOnline(c, now)}`
                        : activity}
                  </span>
                  {last?.endInterest !== undefined ? (
                    <span className="connection-pill">❤️ {last.endInterest}</span>
                  ) : (
                    <span className="difficulty" title={`Difficulty: ${c.difficulty}`}>
                      {c.difficulty}
                      <span>{[1, 2, 3, 4].map((n) => <b key={n} className={n <= c.difficultyLevel ? "on" : ""} />)}</span>
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <p className="faint" style={{ fontSize: 12, textAlign: "center", marginTop: 22 }}>
          They&rsquo;re AI characters with their own lives — sometimes they&rsquo;re busy.
        </p>
      </main>
      <TabBar />
    </>
  );
}

export default function Page() {
  return (
    <Gate>
      <Home />
    </Gate>
  );
}
