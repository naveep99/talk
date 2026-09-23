"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Gate } from "@/components/Gate";
import { IconBack } from "@/components/Icons";
import { CHARACTERS } from "@/lib/characters";
import { formatDuration } from "@/lib/journey";
import { generateReport } from "@/lib/reporting";
import { useApp } from "@/lib/store";

function Sparkline({ trail, color }: { trail: number[]; color: string }) {
  const pts = trail.length > 1 ? trail : [trail[0] ?? 50, trail[0] ?? 50];
  const lo = Math.min(...pts) - 6;
  const hi = Math.max(...pts) + 6;
  const W = 300;
  const H = 64;
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - ((v - lo) / (hi - lo)) * H] as const);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="How her interest moved during the conversation">
      <defs>
        <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#sparkfill)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
}

function Report({ sid }: { sid: string }) {
  const router = useRouter();
  const session = useApp((s) => s.sessions.find((x) => x.id === sid));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (session && !session.report && session.endedAt) {
      generateReport(sid).catch(() => setFailed(true));
    }
  }, [sid, session]);

  if (!session) {
    return (
      <main className="page">
        <p className="muted">This conversation isn&rsquo;t here anymore.</p>
        <Link href="/" className="btn btn-ghost">Back home</Link>
      </main>
    );
  }

  const c = CHARACTERS[session.characterId];
  const r = session.report;
  const end = session.endInterest ?? session.trail[session.trail.length - 1];
  const change = end - session.startInterest;

  return (
    <main className="page" style={{ paddingBottom: 40 }}>
      <Link href="/" className="icon-btn" aria-label="Home" style={{ marginLeft: -10 }}>
        <IconBack />
      </Link>

      <div className="report-head">
        <div className="report-avatars">
          <Avatar c={{ name: "You", palette: { a: "#4b4658", b: "#2b2735", c: "#8d86a0", ink: "#fff" } }} size={52} />
          <Avatar c={c} size={52} />
        </div>
        <h1 className="h-title">You + {c.name}</h1>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          {formatDuration((session.endedAt ?? Date.now()) - session.startedAt)}
          {session.endedByHer ? ` · ${c.name} wrapped it up` : ""}
        </p>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <p className="eyebrow">Connection</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div className="big-heart">❤️ {end}</div>
          <span className={change >= 0 ? "trend-up" : "trend-down"} style={{ fontWeight: 600, fontSize: 14 }}>
            {change >= 0 ? `+${change}` : change}
          </span>
        </div>
        <Sparkline trail={session.trail} color={c.palette.b} />
        <div className="range">
          <span>Started: {session.startInterest}</span>
          <span>Ended: {end}</span>
        </div>
      </div>

      {!r ? (
        failed ? (
          <div className="card" style={{ marginTop: 12 }}>
            <p className="muted" style={{ margin: 0 }}>Couldn&rsquo;t put the debrief together right now.</p>
            <button className="link" style={{ marginTop: 10 }} onClick={() => { setFailed(false); generateReport(sid).catch(() => setFailed(true)); }}>Try again</button>
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <p className="muted" style={{ textAlign: "center", fontSize: 13.5 }}>{c.name} is thinking about how that went…</p>
            <div className="skeleton" style={{ height: 120 }} />
            <div className="skeleton" style={{ height: 150 }} />
            <div className="skeleton" style={{ height: 90 }} />
          </div>
        )
      ) : (
        <div style={{ animation: "pageIn .5s var(--ease)" }}>
          <div className="h-section">What she thought</div>
          <div className="herquote">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar c={c} size={28} />
              <span className="muted" style={{ fontSize: 13 }}>{c.name}</span>
            </div>
            <p className="q">&ldquo;{r.herTake}&rdquo;</p>
          </div>

          <div className="h-section">What worked</div>
          <div className="card">
            <ul className="list" style={{ margin: 0 }}>
              {r.worked.map((w) => (
                <li key={w}><span className="mark mark-good">✓</span>{w}</li>
              ))}
            </ul>
          </div>

          <div className="h-section">What to improve</div>
          <div className="improve">
            <p style={{ margin: 0, fontSize: 15.5 }}>{r.improve}</p>
          </div>

          <div className="h-section">Next practice</div>
          <div className="next">
            <p className="serif" style={{ margin: 0, fontSize: 20, lineHeight: 1.3 }}>&ldquo;{r.nextPractice}&rdquo;</p>
          </div>
        </div>
      )}

      <div className="actions">
        <button className="btn btn-primary btn-block" onClick={() => router.push(`/chat/${c.id}`)}>
          Talk to her again
        </button>
        <Link href="/" className="btn btn-ghost btn-block">Meet someone else</Link>
        {r && (
          <Link href={`/coach?about=${sid}`} className="btn btn-block muted" style={{ height: 40, fontSize: 14 }}>
            Talk it through with your coach →
          </Link>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  const { sid } = useParams<{ sid: string }>();
  return (
    <Gate>
      <Report sid={sid} />
    </Gate>
  );
}
