import type { Session, SkillKey, UserProfile } from "./types";

export const SKILLS: { key: SkillKey; label: string }[] = [
  { key: "conversation", label: "Conversation" },
  { key: "confidence", label: "Confidence" },
  { key: "listening", label: "Listening" },
  { key: "selfExpression", label: "Self-expression" },
  { key: "flirting", label: "Flirting" },
  { key: "awkwardness", label: "Handling awkwardness" },
];

export type Trend = "up" | "flat" | "down" | "new";

export interface SkillRead {
  key: SkillKey;
  label: string;
  level: string;
  value: number;
  trend: Trend;
}

function levelWord(v: number) {
  return v >= 80 ? "Strong" : v >= 65 ? "Solid" : v >= 48 ? "Developing" : "Emerging";
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Trend = recent conversations vs the ones before them. With one conversation
 * there's no trend yet, only a first read.
 */
export function skillReads(sessions: Session[]): SkillRead[] {
  const scored = sessions.filter((s) => s.report);
  return SKILLS.map(({ key, label }) => {
    const vals = scored.map((s) => s.report!.skills[key]);
    if (!vals.length) return { key, label, level: "—", value: 0, trend: "new" as Trend };
    const recent = vals.slice(-2);
    const before = vals.slice(-4, -2);
    const value = Math.round(mean(recent));
    let trend: Trend = "new";
    if (before.length) {
      const diff = mean(recent) - mean(before);
      trend = diff > 4 ? "up" : diff < -4 ? "down" : "flat";
    }
    return { key, label, level: levelWord(value), value, trend };
  });
}

const STRUGGLE_FOCUS: Record<string, string> = {
  starting: "Getting more comfortable starting conversations.",
  what_to_say: "Knowing what to say next without overthinking it.",
  flirting: "Flirting in a light, natural way.",
  keeping_going: "Keeping conversations going.",
  reading_interest: "Reading how interested she is.",
  rejection: "Getting comfortable with a 'no'.",
  asking_out: "Asking someone out.",
  confidence: "Feeling more confident in conversation.",
  overthinking: "Texting without overthinking every message.",
};

const SKILL_FOCUS: Record<SkillKey, string> = {
  conversation: "Keeping conversations flowing.",
  confidence: "Saying what you think with a little more confidence.",
  listening: "Following up on what she actually says.",
  selfExpression: "Sharing more of yourself, not just asking questions.",
  flirting: "Playful banter and light flirting.",
  awkwardness: "Staying relaxed when things get awkward.",
};

export function currentFocus(profile: UserProfile | undefined, sessions: Session[]): string {
  const scored = sessions.filter((s) => s.report);
  if (scored.length >= 2) {
    const reads = skillReads(scored).filter((r) => r.trend !== "new" || scored.length >= 2);
    const weakest = [...reads].sort((a, b) => a.value - b.value)[0];
    if (weakest) return SKILL_FOCUS[weakest.key];
  }
  const first = profile?.struggles[0];
  return (first && STRUGGLE_FOCUS[first]) || "Getting more comfortable starting conversations.";
}

export function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export function shortDuration(ms: number) {
  const m = Math.max(1, Math.round(ms / 60000));
  return `${m}m`;
}

export function relativeDay(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}
