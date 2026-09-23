import type { HiddenState, StateDeltas } from "./types";

// Turns raw engine deltas into believable movement. Whatever the engine
// says, a single message can't swing her more than a few points, gains get
// harder near the top, and there's a little noise so the meter never feels
// like arithmetic.

const KEYS: (keyof HiddenState)[] = ["interest", "comfort", "curiosity", "attraction", "trust", "playfulness"];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function applyDeltas(state: HiddenState, deltas: StateDeltas, rand = Math.random): HiddenState {
  const next = { ...state };
  for (const k of KEYS) {
    let d = deltas[k] ?? 0;
    if (d === 0) continue;
    // Big negative moves (crossing a line) are allowed to bite harder.
    d = clamp(d, -14, 9);
    if (d > 0) d *= clamp((100 - state[k]) / 45, 0.25, 1);
    else d *= clamp(state[k] / 50, 0.5, 1.1);
    const noise = k === "interest" ? (rand() - 0.5) * 1.6 : 0;
    next[k] = clamp(Math.round(state[k] + d + noise), 5, 97);
  }
  return next;
}

/** Where she starts a new conversation: her baseline, pulled toward how the last one ended. */
export function startingState(base: HiddenState, previous: HiddenState | undefined, sessions: number): HiddenState {
  if (!previous || sessions === 0) return { ...base };
  const out = { ...base };
  for (const k of KEYS) {
    // Keep ~60% of the gains/losses from before; trust and comfort stick better.
    const keep = k === "trust" || k === "comfort" ? 0.75 : 0.6;
    out[k] = Math.round(base[k] + (previous[k] - base[k]) * keep);
  }
  return out;
}

export function vibeFromState(s: HiddenState): { emoji: string; label: string } {
  if (s.interest < 30) return { emoji: "😶", label: "Checked out" };
  if (s.trust < 30 && s.comfort < 35) return { emoji: "😬", label: "Guarded" };
  if (s.interest < 42) return { emoji: "😐", label: "Lukewarm" };
  if (s.attraction > 68 && s.playfulness > 60) return { emoji: "😏", label: "Flirty" };
  if (s.playfulness > 70) return { emoji: "😄", label: "Playful" };
  if (s.comfort > 70 && s.trust > 62) return { emoji: "☺️", label: "Comfortable" };
  if (s.curiosity > 62) return { emoji: "🙂", label: "Curious" };
  if (s.interest > 65) return { emoji: "😊", label: "Into it" };
  return { emoji: "🤔", label: "Figuring you out" };
}
