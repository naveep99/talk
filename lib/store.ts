"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { accumulateStats, analyzeMessage, emptyStats } from "./analysis";
import { CHARACTERS, CHARACTER_ORDER } from "./characters";
import { applyDeltas, startingState, vibeFromState } from "./dynamics";
import type {
  CharacterId,
  CharacterRuntime,
  ChatMessage,
  ChatResponse,
  CoachMessage,
  Session,
  SessionReport,
  TurnSignals,
  UserProfile,
} from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function freshRuntime(id: CharacterId): CharacterRuntime {
  const base = CHARACTERS[id].baseState;
  return {
    state: { ...base },
    perception: { impression: "First impressions are still forming.", likes: [], unsure: [], vibe: vibeFromState(base) },
    memories: [],
    messages: [],
    usedLines: [],
    sessionsCount: 0,
    toldBeats: [],
  };
}

const freshChars = () =>
  Object.fromEntries(CHARACTER_ORDER.map((id) => [id, freshRuntime(id)])) as Record<CharacterId, CharacterRuntime>;

export interface AppState {
  profile?: UserProfile;
  chars: Record<CharacterId, CharacterRuntime>;
  sessions: Session[];
  coach: CoachMessage[];
  /** Prototype control: pretend more days have passed (moves her life forward). */
  dayOffset: number;

  completeOnboarding: (p: Omit<UserProfile, "onboardedAt">) => void;
  startSession: (id: CharacterId) => string;
  addMessage: (id: CharacterId, m: Omit<ChatMessage, "id" | "at" | "sessionId">) => ChatMessage;
  recordUserMessage: (id: CharacterId, text: string) => { message: ChatMessage; signals: TurnSignals };
  applyTurn: (id: CharacterId, res: ChatResponse, userMessageId?: string) => void;
  markHelp: (id: CharacterId, kind: "opened" | "used") => void;
  markHerLeft: (id: CharacterId) => void;
  endSession: (id: CharacterId, opts?: { endedByHer?: boolean }) => Session | undefined;
  setReport: (sessionId: string, report: SessionReport) => void;
  addCoachMessage: (m: Omit<CoachMessage, "id" | "at">) => void;
  advanceDay: () => void;
  loadSample: () => Promise<void>;
  reset: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      chars: freshChars(),
      sessions: [],
      coach: [],
      dayOffset: 0,

      completeOnboarding: (p) => set({ profile: { ...p, onboardedAt: Date.now() } }),

      startSession: (id) => {
        const rt = get().chars[id];
        if (rt.activeSessionId) return rt.activeSessionId;
        const state = startingState(CHARACTERS[id].baseState, rt.state, rt.sessionsCount);
        const session: Session = {
          id: uid(),
          characterId: id,
          startedAt: Date.now(),
          startInterest: state.interest,
          trail: [state.interest],
          stats: emptyStats(),
          signals: [],
        };
        set((s) => ({
          sessions: [...s.sessions, session],
          chars: {
            ...s.chars,
            [id]: {
              ...rt,
              state,
              perception: rt.sessionsCount === 0 ? rt.perception : { ...rt.perception, vibe: vibeFromState(state) },
              activeSessionId: session.id,
            },
          },
        }));
        return session.id;
      },

      addMessage: (id, m) => {
        const rt = get().chars[id];
        const msg: ChatMessage = { ...m, id: uid(), at: Date.now(), sessionId: rt.activeSessionId ?? "" };
        set((s) => ({ chars: { ...s.chars, [id]: { ...s.chars[id], messages: [...s.chars[id].messages, msg], lastSeenAt: Date.now() } } }));
        return msg;
      },

      recordUserMessage: (id, text) => {
        const rt = get().chars[id];
        const herLast = [...rt.messages].reverse().find((m) => m.from === "her")?.text;
        const signals = analyzeMessage(text, herLast);
        const message = get().addMessage(id, { from: "user", text });
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === rt.activeSessionId ? { ...x, stats: accumulateStats(x.stats, text, signals), signals: [...x.signals, signals] } : x,
          ),
        }));
        return { message, signals };
      },

      applyTurn: (id, res, userMessageId) => {
        set((s) => {
          const rt = s.chars[id];
          const prev = rt.state.interest;
          const state = applyDeltas(rt.state, res.deltas);
          const now = Date.now();
          const memories = [
            ...rt.memories,
            ...res.newMemories.filter((t) => !rt.memories.some((m) => m.text === t)).map((text) => ({ text, at: now })),
          ].slice(-30);
          const messages = userMessageId
            ? rt.messages.map((m) => (m.id === userMessageId ? { ...m, delta: state.interest - prev } : m))
            : rt.messages;
          return {
            chars: {
              ...s.chars,
              [id]: { ...rt, state, perception: res.perception, memories, messages, usedLines: res.usedLines.slice(-200), toldBeats: res.toldBeats },
            },
            sessions: s.sessions.map((x) =>
              x.id === rt.activeSessionId && userMessageId ? { ...x, trail: [...x.trail, state.interest] } : x,
            ),
          };
        });
      },

      markHelp: (id, kind) => {
        const sid = get().chars[id].activeSessionId;
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === sid
              ? { ...x, stats: { ...x.stats, [kind === "opened" ? "helpOpened" : "helpUsed"]: x.stats[kind === "opened" ? "helpOpened" : "helpUsed"] + 1 } }
              : x,
          ),
        }));
      },

      markHerLeft: (id) => {
        const sid = get().chars[id].activeSessionId;
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, endedByHer: true } : x)) }));
      },

      endSession: (id, opts) => {
        const rt = get().chars[id];
        const sid = rt.activeSessionId;
        if (!sid) return undefined;
        const session = get().sessions.find((x) => x.id === sid);
        if (!session) return undefined;
        const hasUserMessages = session.stats.userMessages > 0;
        const ended: Session = { ...session, endedAt: Date.now(), endInterest: rt.state.interest, endedByHer: opts?.endedByHer ?? session.endedByHer };
        set((s) => ({
          // A conversation where he never said anything isn't worth keeping as a session.
          sessions: hasUserMessages ? s.sessions.map((x) => (x.id === sid ? ended : x)) : s.sessions.filter((x) => x.id !== sid),
          chars: {
            ...s.chars,
            [id]: {
              ...rt,
              activeSessionId: undefined,
              sessionsCount: hasUserMessages ? rt.sessionsCount + 1 : rt.sessionsCount,
            },
          },
        }));
        return hasUserMessages ? ended : undefined;
      },

      setReport: (sessionId, report) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, report } : x)) })),

      addCoachMessage: (m) => set((s) => ({ coach: [...s.coach, { ...m, id: uid(), at: Date.now() }] })),

      advanceDay: () => set((s) => ({ dayOffset: s.dayOffset + 1 })),

      loadSample: async () => {
        const { buildSample } = await import("./sample");
        const profile = get().profile;
        set(buildSample(profile));
      },

      reset: () => set({ profile: undefined, chars: freshChars(), sessions: [], coach: [], dayOffset: 0 }),
    }),
    {
      name: "talk-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function activeSession(s: AppState, id: CharacterId): Session | undefined {
  const sid = s.chars[id].activeSessionId;
  return sid ? s.sessions.find((x) => x.id === sid) : undefined;
}

export function completedSessions(sessions: Session[]): Session[] {
  return sessions.filter((x) => x.endedAt);
}

/** True once saved state has loaded from this device. */
export function useHydrated() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const unsub = useApp.persist.onFinishHydration(() => setDone(true));
    setDone(useApp.persist.hasHydrated());
    return unsub;
  }, []);
  return done;
}
