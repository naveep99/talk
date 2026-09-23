"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Gate } from "@/components/Gate";
import { IconBack, IconSend } from "@/components/Icons";
import { Sheet } from "@/components/Sheet";
import { Status } from "@/components/Status";
import { api } from "@/lib/api";
import { CHARACTERS, getCharacter, type Character } from "@/lib/characters";
import { allStatuses, dayIndexSince, nextOnline, openerBeat } from "@/lib/life";
import { generateReport } from "@/lib/reporting";
import { activeSession, useApp } from "@/lib/store";
import type { CharacterId, ChatMessage, ChatRequest, HelpOption } from "@/lib/types";
import { useNow } from "@/lib/useNow";

const IDLE_END_MS = 45 * 60 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function typingMs(c: Character, text: string) {
  const pace = c.id === "ananya" ? 1.35 : c.id === "sara" ? 0.75 : c.id === "meera" ? 0.9 : 1;
  return Math.min(3800, Math.max(700, (500 + text.length * 32) * pace));
}

function sessionLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}

function ChatScreen({ id }: { id: CharacterId }) {
  const c = CHARACTERS[id];
  const router = useRouter();
  const now = useNow(30_000);
  const rt = useApp((s) => s.chars[id]);
  const session = useApp((s) => activeSession(s, id));
  const sessions = useApp((s) => s.sessions);
  const { status, activity } = allStatuses(now)[id];

  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [seenId, setSeenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "perception" | "help" | "end">(null);
  const [help, setHelp] = useState<{ loading: boolean; options: HelpOption[]; nudge: boolean }>({ loading: false, options: [], nudge: false });
  const [pulse, setPulse] = useState<"up" | "down" | null>(null);
  const [steppedAway, setSteppedAway] = useState(false);
  const [error, setError] = useState(false);

  const pending = useRef<string[]>([]); // user message ids not yet answered
  const busy = useRef(false);
  const helpPick = useRef<string | null>(null);
  const helpStreak = useRef(0);
  const opened = useRef(false);
  const runTurnRef = useRef<() => Promise<void>>(async () => {});
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const herLeft = !!session?.endedByHer;
  const sessionHasUser = (session?.stats.userMessages ?? 0) > 0;
  const offline = status === "offline";

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));
  }, []);
  useLayoutEffect(scrollDown, [rt.messages.length, typing, scrollDown]);

  const buildRequest = useCallback(
    (event: ChatRequest["event"], userText?: string, pendingCount = 0): ChatRequest => {
      const st = useApp.getState();
      const r = st.chars[id];
      const sess = activeSession(st, id);
      const history = r.messages.slice(0, r.messages.length - pendingCount).slice(-40).map((m) => ({ from: m.from, text: m.text }));
      const sessUserCount = sess ? sess.signals.length : 0;
      return {
        characterId: id,
        event,
        userText,
        history,
        state: r.state,
        perception: r.perception,
        memories: r.memories.map((m) => m.text),
        usedLines: r.usedLines,
        toldBeats: r.toldBeats,
        dayIndex: dayIndexSince(st.profile!.onboardedAt, Date.now(), st.dayOffset),
        hour: new Date().getHours(),
        sessionTurn: Math.max(0, sessUserCount - pendingCount),
        sessionsCount: r.sessionsCount,
        userName: st.profile?.name ?? "",
        recentSignals: sess ? sess.signals.slice(0, Math.max(0, sess.signals.length - pendingCount)).slice(-6) : [],
      };
    },
    [id],
  );

  /** Show her bubbles one by one with believable typing time. */
  const deliver = useCallback(
    async (messages: string[], helpKey?: string) => {
      const { addMessage } = useApp.getState();
      for (let i = 0; i < messages.length; i++) {
        setTyping(true);
        await sleep(typingMs(c, messages[i]) * (i === 0 ? 0.6 : 1));
        setTyping(false);
        addMessage(id, { from: "her", text: messages[i], helpKey: i === messages.length - 1 ? helpKey : undefined });
        if (i < messages.length - 1) await sleep(250 + Math.random() * 400);
      }
    },
    [c, id],
  );

  const comeBack = useCallback(async () => {
    await sleep(14_000 + Math.random() * 10_000);
    try {
      const res = await api.chat(buildRequest("return"));
      await deliver(res.messages);
      useApp.getState().applyTurn(id, { ...res, deltas: {} });
    } finally {
      setSteppedAway(false);
      if (pending.current.length) void runTurnRef.current();
    }
  }, [buildRequest, deliver, id]);

  const runTurn = useCallback(async () => {
    if (busy.current || !pending.current.length) return;
    busy.current = true;
    setError(false);
    const ids = [...pending.current];
    const st = useApp.getState();
    const texts = st.chars[id].messages.filter((m) => ids.includes(m.id)).map((m) => m.text);
    const req = buildRequest("message", texts.join("\n"), ids.length);
    const away = allStatuses(new Date())[id].status === "away";
    try {
      const call = api.chat(req);
      await sleep((away ? 3500 : 700) + Math.random() * (away ? 4000 : 900));
      setSeenId(ids[ids.length - 1]);
      await sleep(300 + Math.random() * 600);
      const res = await call;
      pending.current = pending.current.filter((x) => !ids.includes(x));
      const before = useApp.getState().chars[id].state.interest;
      // Her state shifts as she reads, then she replies.
      useApp.getState().applyTurn(id, res, ids[ids.length - 1]);
      const after = useApp.getState().chars[id].state.interest;
      if (after !== before) {
        setPulse(after > before ? "up" : "down");
        setTimeout(() => setPulse(null), 1600);
      }
      await deliver(res.messages, res.helpKey);
      if (res.wrapUp) useApp.getState().markHerLeft(id);
      if (res.stepAway) {
        setSteppedAway(true);
        void comeBack();
      }
    } catch {
      setError(true);
    } finally {
      setTyping(false);
      busy.current = false;
    }
    if (pending.current.length && !useApp.getState().sessions.find((s) => s.id === useApp.getState().chars[id].activeSessionId)?.endedByHer) {
      void runTurn();
    }
  }, [buildRequest, comeBack, deliver, id]);
  runTurnRef.current = runTurn;

  // On arrival: close out a stale conversation, and sometimes she texts first.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const st = useApp.getState();
    const r = st.chars[id];
    if (r.activeSessionId && r.lastSeenAt && Date.now() - r.lastSeenAt > IDLE_END_MS) {
      const ended = st.endSession(id);
      if (ended) void generateReport(ended.id);
    }
    const fresh = useApp.getState().chars[id];
    const statusNow = allStatuses(new Date())[id].status;
    if (fresh.activeSessionId || statusNow === "offline" || fresh.sessionsCount === 0) return;
    const day = dayIndexSince(st.profile!.onboardedAt, Date.now(), st.dayOffset);
    const hasNews = !!openerBeat(c, day, fresh.toldBeats);
    if (Math.random() < (hasNews ? 0.85 : 0.4)) {
      (async () => {
        await sleep(1200);
        useApp.getState().startSession(id);
        try {
          const res = await api.chat(buildRequest("open"));
          await deliver(res.messages, res.helpKey);
          useApp.getState().applyTurn(id, { ...res, deltas: {} });
        } catch {
          /* she just doesn't text first this time */
        }
      })();
    }
  }, [buildRequest, c, deliver, id]);

  const send = () => {
    const text = draft.trim();
    if (!text || herLeft || offline) return;
    const st = useApp.getState();
    st.startSession(id);
    const { message } = st.recordUserMessage(id, text);
    if (helpPick.current) {
      st.markHelp(id, "used");
      helpStreak.current = text === helpPick.current ? helpStreak.current + 1 : 0;
    } else helpStreak.current = 0;
    helpPick.current = null;
    setDraft("");
    setSeenId(null);
    pending.current.push(message.id);
    if (!steppedAway) void runTurn();
    inputRef.current?.focus();
  };

  const openHelp = async (force = false) => {
    const st = useApp.getState();
    const sess = activeSession(st, id);
    if (sess) st.markHelp(id, "opened");
    setSheet("help");
    const used = sess?.stats.helpUsed ?? 0;
    const own = (sess?.stats.userMessages ?? 0) - used;
    const nudge = !force && (helpStreak.current >= 2 || (used >= 3 && own < used));
    if (nudge) {
      setHelp({ loading: false, options: [], nudge: true });
      return;
    }
    setHelp({ loading: true, options: [], nudge: false });
    const r = st.chars[id];
    const lastHer = [...r.messages].reverse().find((m) => m.from === "her");
    const inSession = r.messages.filter((m) => m.sessionId === r.activeSessionId);
    try {
      const res = await api.help({
        characterId: id,
        history: (inSession.length ? inSession : []).slice(-16).map((m) => ({ from: m.from, text: m.text })),
        state: r.state,
        helpKey: lastHer?.helpKey,
        memories: r.memories.map((m) => m.text),
      });
      setHelp({ loading: false, options: res.options, nudge: false });
    } catch {
      setHelp({ loading: false, options: [], nudge: false });
    }
  };

  const pickOption = (o: HelpOption) => {
    setDraft(o.text);
    helpPick.current = o.text;
    setSheet(null);
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 50);
  };

  const finish = () => {
    const ended = useApp.getState().endSession(id);
    if (ended) router.push(`/report/${ended.id}`);
    else router.push("/");
  };

  // Autosize the composer.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(140, el.scrollHeight)}px`;
  }, [draft]);

  const firstEver = rt.sessionsCount === 0 && !rt.messages.length;
  const thread = useMemo(() => {
    const out: (ChatMessage | { divider: string; sid: string; ended?: number; reportId?: string })[] = [];
    let lastSid = "";
    for (const m of rt.messages) {
      if (m.sessionId !== lastSid) {
        const prev = sessions.find((s) => s.id === lastSid);
        if (prev?.endedAt) out.push({ divider: "", sid: `end-${prev.id}`, ended: prev.endInterest, reportId: prev.id });
        out.push({ divider: sessionLabel(m.at), sid: m.sessionId });
        lastSid = m.sessionId;
      }
      out.push(m);
    }
    const last = sessions.find((s) => s.id === lastSid);
    if (last?.endedAt) out.push({ divider: "", sid: `end-${last.id}`, ended: last.endInterest, reportId: last.id });
    return out;
  }, [rt.messages, sessions]);

  const interest = rt.state.interest;
  const displayStatus = steppedAway ? "away" : status;

  return (
    <div className="chat">
      <header className="chat-head">
        <div className="chat-head-row">
          <Link href="/" className="icon-btn" aria-label="Back">
            <IconBack />
          </Link>
          <Avatar c={c} size={42} status={displayStatus} />
          <div style={{ minWidth: 0 }}>
            <div className="chat-name">{c.name}</div>
            <Status status={displayStatus} activity={typing ? "typing…" : steppedAway ? "stepped away" : undefined} />
          </div>
          {session && sessionHasUser && !herLeft && (
            <button className="end-btn" onClick={() => setSheet("end")}>
              End
            </button>
          )}
        </div>
        <button className={`interest${pulse ? ` ${pulse}` : ""}`} onClick={() => setSheet("perception")} aria-label={`What ${c.name} thinks about you`}>
          <span className="heart">❤️</span>
          <span className="num">{interest}</span>
          <span>Interest</span>
          <span className="vibe">
            {rt.perception.vibe.emoji} {rt.perception.vibe.label}
          </span>
        </button>
      </header>

      <div className="thread" ref={threadRef}>
        <div className="thread-inner">
          {(firstEver || rt.sessionsCount === 0) && (
            <div className="met">
              <span className="serif">How you met</span>
              {c.howYouMet}
            </div>
          )}
          {thread.map((m) =>
            "divider" in m ? (
              m.ended !== undefined ? (
                <Link key={m.sid} href={`/report/${m.reportId}`} className="sys">
                  Conversation ended · ❤️ {m.ended} · <span className="link" style={{ fontSize: 12 }}>See how it went</span>
                </Link>
              ) : (
                <div key={m.sid} className="divider">{m.divider}</div>
              )
            ) : (
              <div key={m.id}>
                <div className={`row ${m.from === "user" ? "me" : "her"}`}>
                  <div className="bubble">{m.text}</div>
                </div>
                {m.id === seenId && !typing && <div className="sys" style={{ textAlign: "right", margin: "3px 4px 0" }}>Seen</div>}
              </div>
            ),
          )}
          {typing && (
            <div className="row her" style={{ marginTop: 8 }}>
              <div className="typing" aria-label={`${c.name} is typing`}>
                <i /><i /><i />
              </div>
            </div>
          )}
          {error && (
            <div className="sys">
              Message didn&rsquo;t go through.{" "}
              <button className="link" onClick={() => void runTurn()}>Try again</button>
            </div>
          )}
        </div>
      </div>

      {herLeft ? (
        <div className="notice">
          <p>{c.name} has left the chat.</p>
          <button className="btn btn-primary btn-block" onClick={finish}>See how it went</button>
        </div>
      ) : offline && sessionHasUser ? (
        <div className="notice">
          <p>{c.name} has gone offline — {activity.toLowerCase()}.</p>
          <button className="btn btn-primary btn-block" onClick={finish}>See how it went</button>
        </div>
      ) : offline ? (
        <div className="notice">
          <p>
            {c.name} is offline{activity ? ` — ${activity.toLowerCase()}` : ""}. She&rsquo;s usually back {nextOnline(c, now)}.
          </p>
          <Link href="/" className="btn btn-ghost btn-block">Meet someone else</Link>
        </div>
      ) : (
        <>
          {status === "away" && !steppedAway && <div className="banner">{c.name} is {activity.toLowerCase()} — replies might be slow.</div>}
          <div className="composer">
            <div className="composer-row">
              <button className="help-btn" onClick={() => void openHelp()} aria-label="Help: ideas for what to say">
                💡 Help
              </button>
              <div className="composer-box">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  placeholder={rt.messages.length ? "Message" : `Say hi to ${c.name}…`}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  aria-label={`Message ${c.name}`}
                />
                <button className="send" onClick={send} disabled={!draft.trim()} aria-label="Send">
                  <IconSend />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Sheet open={sheet === "perception"} onClose={() => setSheet(null)} label={`What ${c.name} thinks about you`}>
        <p className="eyebrow">What {c.name} thinks about you</p>
        <p className="quote">&ldquo;{rt.perception.impression}&rdquo;</p>
        {rt.perception.likes.length > 0 && (
          <div className="sheet-section">
            <div className="h-section" style={{ margin: "0 0 8px" }}>She likes</div>
            <ul className="list">
              {rt.perception.likes.map((l) => (
                <li key={l}><span className="mark mark-good">✓</span>{l}</li>
              ))}
            </ul>
          </div>
        )}
        {rt.perception.unsure.length > 0 && (
          <div className="sheet-section">
            <div className="h-section" style={{ margin: "0 0 8px" }}>She&rsquo;s unsure about</div>
            <ul className="list">
              {rt.perception.unsure.map((l) => (
                <li key={l}><span className="mark mark-unsure">?</span>{l}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="sheet-section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="h-section" style={{ margin: 0 }}>Current vibe</span>
          <span className="chip" style={{ fontSize: 14 }}>{rt.perception.vibe.emoji} {rt.perception.vibe.label}</span>
        </div>
        <p className="fine">
          This is {c.name}&rsquo;s simulated read of the conversation so far — a practice signal, not a prediction of what any real person would think.
        </p>
      </Sheet>

      <Sheet open={sheet === "help"} onClose={() => setSheet(null)} label="What could you say?">
        {help.nudge ? (
          <div className="nudge">
            <p className="eyebrow">💡 Help</p>
            <p className="big">You&rsquo;ve got this.</p>
            <p className="muted" style={{ margin: "0 0 22px" }}>Try your own answer first — even an imperfect one. That&rsquo;s the part that transfers to real life.</p>
            <div style={{ display: "grid", gap: 10 }}>
              <button className="btn btn-primary btn-block" onClick={() => { setSheet(null); inputRef.current?.focus(); }}>I&rsquo;ll write my own</button>
              <button className="btn btn-block muted" style={{ height: 40 }} onClick={() => void openHelp(true)}>Show ideas anyway</button>
            </div>
          </div>
        ) : (
          <>
            <h3>What could you say?</h3>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>A few directions. Use one, tweak it, or ignore them all.</p>
            <div className="options">
              {help.loading
                ? [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 74 }} />)
                : help.options.map((o) => (
                    <button key={o.text} className="option" onClick={() => pickOption(o)}>
                      <div className="tone">{o.tone}</div>
                      <div className="txt">{o.text}</div>
                    </button>
                  ))}
              {!help.loading && !help.options.length && <p className="muted">Couldn&rsquo;t come up with anything just now. Trust your gut.</p>}
            </div>
            <p className="fine" style={{ textAlign: "center" }}>Your own words usually land better than you think.</p>
          </>
        )}
      </Sheet>

      <Sheet open={sheet === "end"} onClose={() => setSheet(null)} label="End conversation">
        <h3>End the conversation?</h3>
        <p className="muted" style={{ margin: "8px 0 22px" }}>
          You&rsquo;ll see how it went with {c.name} — what worked, and what to try next time.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <button className="btn btn-primary btn-block" onClick={finish}>End & see how it went</button>
          <button className="btn btn-ghost btn-block" onClick={() => setSheet(null)}>Keep talking</button>
        </div>
      </Sheet>
    </div>
  );
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const c = getCharacter(params.id);
  if (!c) notFound();
  return (
    <Gate>
      <ChatScreen id={c.id} />
    </Gate>
  );
}
