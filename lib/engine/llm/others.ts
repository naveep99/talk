import { z } from "zod";
import { CHARACTERS } from "../../characters";
import type {
  CoachRequest,
  CoachResponse,
  HelpRequest,
  HelpResponse,
  ReportRequest,
  ReportResponse,
} from "../../types";
import { structured, text } from "./client";

// ---- Help ---------------------------------------------------------------------

const HelpSchema = z.object({
  options: z.array(z.object({ tone: z.string(), text: z.string() })),
});

export async function claudeHelp(req: HelpRequest): Promise<HelpResponse> {
  const c = CHARACTERS[req.characterId];
  const transcript = req.history.slice(-16).map((m) => `${m.from === "her" ? c.name : "Him"}: ${m.text}`).join("\n");
  const out = await structured({
    system: `You help a guy who's stuck mid-conversation while texting ${c.name} (${c.age}, ${c.profession}; ${c.personality}). Offer 3 different directions he could take his NEXT message, each written as a ready-to-send text in his voice.

Rules:
- Each option has a one-word tone label (e.g. Playful, Genuine, Flirty, Curious, Bold, Share) and the message text.
- Make them specific to what she just said — no generic filler.
- Favour reciprocity: at least one option shares something about him instead of only asking.
- Flirty options only if the conversation is warm enough; keep them light and respectful, never sexual.
- Casual texting style, 1–2 sentences, no quotation marks, no emojis unless natural.
- Don't invent big facts about him beyond small plausible details he can easily edit.`,
    user: `${req.history.length ? `Conversation:\n${transcript}` : `They haven't talked yet. How they met: ${c.howYouMet} Suggest ways for him to open.`}\n\nWhat he's shared before: ${req.memories.join("; ") || "nothing yet"}\nHow warm it is: interest ${req.state.interest}/100, attraction ${req.state.attraction}/100.\n\nGive 3 options.`,
    schema: HelpSchema,
    effort: "low",
    maxTokens: 2000,
  });
  const options = out.options.filter((o) => o.text?.trim()).slice(0, 4);
  if (options.length < 2) throw new Error("too few options");
  return { options, engine: "claude" };
}

// ---- Post-conversation report -------------------------------------------------------

const ReportSchema = z.object({
  herTake: z.string(),
  worked: z.array(z.string()),
  improve: z.string(),
  nextPractice: z.string(),
  skills: z.object({
    conversation: z.number().int(),
    confidence: z.number().int(),
    listening: z.number().int(),
    selfExpression: z.number().int(),
    flirting: z.number().int(),
    awkwardness: z.number().int(),
  }),
  pattern: z.string(),
  coachNote: z.string(),
});

const EXPERIENCE: Record<string, string> = {
  never: "has never dated",
  a_little: "has dated a little",
  a_few_times: "has been on a few dates",
  relationships: "has had relationships",
};

export async function claudeReport(req: ReportRequest): Promise<ReportResponse> {
  const c = CHARACTERS[req.characterId];
  const transcript = req.history.map((m) => `${m.from === "her" ? c.name : "Him"}: ${m.text}`).join("\n");
  const out = await structured({
    system: `You write the short debrief after a practice text conversation in a social-confidence app. The user is a man practicing talking to women; ${c.name} is a simulated character (${c.personality}).

Voice: a supportive, sharp friend who is great at dating. Warm, specific, never preachy, never therapeutic, never shaming. Awkwardness is normal.

Fields:
- herTake: 1–3 sentences in ${c.name}'s own first-person voice and texting style, as if she's honestly telling a friend what she thought of him. E.g. "You became more comfortable as the conversation went on. I liked your humour, but I wasn't sure what you were actually interested in."
- worked: 2–3 short, concrete bullets about what he did well, referencing actual moments ("You followed up on the pottery story.").
- improve: ONE main thing to improve, concrete and grounded in numbers or moments (e.g. "You asked 8 questions but only volunteered 3 things about yourself.").
- nextPractice: one specific thing to try next time.
- skills: 0–100 for this conversation only: conversation (flow, keeping it going), confidence, listening, selfExpression (sharing himself), flirting (well-judged playfulness/attraction; low if absent, very low if inappropriate), awkwardness (how well he handled awkward moments/teasing/silence). Be calibrated: 50 is typical for a beginner, 70 is good, 85+ is rare.
- pattern: one observation about a recurring tendency, phrased kindly ("You tend to ask questions when you're nervous...").
- coachNote: one line the coach would say next, like "You've practiced keeping conversations going. Next, let's work on playful banter."`,
    user: `About him: ${EXPERIENCE[req.profile.experience] ?? ""}; finds hard: ${req.profile.struggles.join(", ") || "not specified"}; wants to get better at: ${req.profile.goals.join(", ") || "not specified"}.

Stats (counted by the app): ${req.stats.userMessages} messages from him, ${req.stats.questions} questions, ${req.stats.disclosures} messages sharing something about himself, used Help ${req.stats.helpUsed} times. Her interest went from ${req.startInterest} to ${req.endInterest} over ${Math.max(1, Math.round(req.durationMs / 60000))} minutes.
Her last impression of him: "${req.perception.impression}" Likes: ${req.perception.likes.join(", ") || "—"}. Unsure: ${req.perception.unsure.join(", ") || "—"}.

Transcript:
${transcript || "(he didn't send anything)"}`,
    schema: ReportSchema,
    effort: "medium",
    maxTokens: 4000,
  });
  const clamp = (v: number) => Math.max(5, Math.min(98, Math.round(v)));
  return {
    report: {
      ...out,
      worked: out.worked.slice(0, 3),
      skills: {
        conversation: clamp(out.skills.conversation),
        confidence: clamp(out.skills.confidence),
        listening: clamp(out.skills.listening),
        selfExpression: clamp(out.skills.selfExpression),
        flirting: clamp(out.skills.flirting),
        awkwardness: clamp(out.skills.awkwardness),
      },
    },
    engine: "claude",
  };
}

// ---- Coach -----------------------------------------------------------------------------

export async function claudeCoach(req: CoachRequest): Promise<CoachResponse> {
  const p = req.profile;
  const sessions = req.sessions
    .slice(-8)
    .map((s) => {
      const name = CHARACTERS[s.characterId].name;
      return `- ${new Date(s.endedAt).toDateString()} with ${name}: connection ${s.startInterest}→${s.endInterest}, ${s.durationMin}m, ${s.stats.userMessages} msgs, ${s.stats.questions} questions, ${s.stats.disclosures} self-disclosures, ${s.stats.humour} humorous, help used ${s.stats.helpUsed}x.${s.pattern ? ` Pattern: ${s.pattern}` : ""}${s.improve ? ` To improve: ${s.improve}` : ""}`;
    })
    .join("\n");

  const system = `You are the Dating Coach in a private practice app that helps men get more comfortable talking to women and dating in real life. You are one persistent coach who knows this user over time.

Who you are: a supportive, intelligent friend who happens to be very good at dating and communication. Warm, direct, a bit funny. Not a therapist, not preachy, never says something is "wrong" with him, never shames. Awkwardness is expected. The goal is confidence, communication, self-awareness and practice — and ultimately real-life connection, not dependence on this app.

How you answer:
- Be concrete: observations, practical advice, a small exercise or reflection question when useful.
- Reference his practice history when it's genuinely relevant ("Across your last three conversations...") — don't force it.
- The four practice characters are Riya (warm/playful, easy), Ananya (quiet/thoughtful, medium), Meera (confident/direct, hard), Sara (chaotic/flirty, expert). Suggest who to practice with when useful.
- Keep it conversational: usually 80–200 words. Short paragraphs; use a few bullets or **bold** only when it helps. No headings.
- Respectful, consent-minded advice only. No manipulation tactics, no "pickup artist" techniques, no negging.
- If he seems genuinely distressed, be kind and suggest talking to someone he trusts or a professional, without lecturing.

About him:
- Name: ${p.name || "not given"}
- Dating experience: ${EXPERIENCE[p.experience] ?? p.experience}
- Finds hard: ${p.struggles.join(", ") || "not specified"}
- Wants to get better at: ${p.goals.join(", ") || "not specified"}

Practice history (most recent last):
${sessions || "- No practice conversations yet."}`;

  const history = req.history.slice(-20).map((m) => ({
    role: m.from === "coach" ? ("assistant" as const) : ("user" as const),
    content: m.text,
  }));
  // The API needs alternating turns starting with the user.
  while (history.length && history[0].role === "assistant") history.shift();
  const out = await text({ system, messages: [...history, { role: "user", content: req.message }], effort: "medium" });
  return { text: out, engine: "claude" };
}
