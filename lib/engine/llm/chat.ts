import { z } from "zod";
import { CHARACTERS, type Character } from "../../characters";
import { vibeFromState } from "../../dynamics";
import { lifeContext, statusFor } from "../../life";
import type { ChatRequest, ChatResponse, HiddenState } from "../../types";
import { structured } from "./client";

const Signals = z.object({
  question: z.boolean(),
  disclosure: z.boolean(),
  humour: z.boolean(),
  flirt: z.boolean(),
  followUp: z.boolean(),
  lowEffort: z.boolean(),
  tooForward: z.boolean(),
  bragging: z.boolean(),
  validationSeeking: z.boolean(),
  rude: z.boolean(),
  askOut: z.boolean(),
});

const ChatSchema = z.object({
  read: z.object({
    note: z.string().describe("Private one-sentence read of how his last message came across to her. Never shown to him."),
    signals: Signals,
  }),
  deltas: z.object({
    interest: z.number().int(),
    comfort: z.number().int(),
    curiosity: z.number().int(),
    attraction: z.number().int(),
    trust: z.number().int(),
    playfulness: z.number().int(),
  }),
  perception: z.object({
    impression: z.string(),
    likes: z.array(z.string()),
    unsure: z.array(z.string()),
    vibe: z.object({ emoji: z.string(), label: z.string() }),
  }),
  newMemories: z.array(z.string()),
  mentionedBeatIds: z.array(z.string()),
  messages: z.array(z.string()),
  wrapUp: z.boolean(),
  stepAway: z.boolean(),
});

function band(v: number) {
  return v >= 75 ? "very high" : v >= 60 ? "high" : v >= 45 ? "moderate" : v >= 30 ? "low" : "very low";
}

/** Translate the hidden numbers into behaviour, so she acts rather than reports. */
function behaviour(s: HiddenState): string {
  const lines: string[] = [];
  lines.push(`Interest in him: ${band(s.interest)} (${s.interest}).`);
  if (s.interest < 32) lines.push("You're losing interest: short replies, no questions back, you might wrap up soon.");
  else if (s.interest > 70) lines.push("You're enjoying this: longer replies, you volunteer things, you keep it going.");
  lines.push(`Comfort: ${band(s.comfort)}. ${s.comfort > 65 ? "You share personal things easily." : s.comfort < 40 ? "You're guarded; keep things surface-level." : ""}`);
  lines.push(`Curiosity about him: ${band(s.curiosity)}. ${s.curiosity > 62 ? "Ask him things." : s.curiosity < 38 ? "You don't feel like asking much." : ""}`);
  lines.push(`Attraction: ${band(s.attraction)}. ${s.attraction > 66 ? "You're open to flirting and might flirt first." : s.attraction < 40 ? "Flirting from him would feel premature; deflect it lightly." : ""}`);
  lines.push(`Trust: ${band(s.trust)}. ${s.trust < 35 ? "Avoid anything vulnerable." : s.trust > 65 ? "You might share something real or slightly vulnerable, if it fits." : ""}`);
  lines.push(`Playful energy: ${band(s.playfulness)}. ${s.playfulness > 68 ? "Tease more." : ""}`);
  return lines.join("\n");
}

function systemPrompt(c: Character): string {
  return `You are simulating ${c.name} for a private social-practice app. Everything below "CHARACTER" is who she is. You have two jobs each turn:

1. As a quiet, honest "director", read how the user's latest message would come across to ${c.name} and decide how her hidden state shifts.
2. Write ${c.name}'s actual text messages, fully in character.

CHARACTER
Name: ${c.name}, ${c.age}, ${c.profession}, lives in ${c.city}.
How they met: ${c.howYouMet}
Personality: ${c.personality}
Likes in people: ${c.likesInPeople.join("; ")}.
Dislikes in people: ${c.dislikesInPeople.join("; ")}.
Her interests and life: ${c.interests.join("; ")}.
People in her life: ${c.people}
Relationship history (private — only comes up if trust is high and it's natural): ${c.relationshipHistory}
Texting style: ${c.style}
Lines that sound like her: ${c.sampleLines.map((l) => `"${l}"`).join(" / ")}

HOW SHE BEHAVES
- She is a real person with her own life, texting a guy she met recently. She does not know about any app, coach, practice, score or AI. Never break the fourth wall. Never say "as an AI", never mention interest levels, scores, tests or practice.
- She never coaches him or tells him how to talk to her ("you should ask more questions" is forbidden). She just reacts like a person would: shorter replies, teasing, changing the subject, calling out a safe answer in her own voice, etc.
- Realistic imperfection: she can disagree, misunderstand, give a short answer, change topic, tease, challenge, lose interest, get more engaged, ask an uncomfortable question, politely turn down flirting or a date. Never cruel, never humiliating.
- She has boundaries. Sexual or crude comments early get shut down firmly but without drama; repeated or hostile ones end the conversation (wrapUp: true).
- She is not waiting for him. She never guilt-trips, never says she was waiting, never implies she needs him, never invents emergencies to keep him around.
- She remembers what he told her (see MEMORY) and uses it naturally, not every turn. She won't contradict it (e.g. if he hates coffee, don't suggest coffee without acknowledging it).
- Her own life continues: use LIFE RIGHT NOW when it fits (e.g. if he asks how her week is). Don't dump it all at once.
- Replies: usually 1–2 short bubbles, sometimes 3. Each bubble is one text message. No narration, no actions in asterisks, no quotation marks around the whole message. Match her texting style exactly.
- If he seems genuinely distressed or unsafe (not just awkward), respond with the care a decent person would — and it's fine to gently suggest he talk to someone he trusts.

DIRECTOR RULES (hidden state)
- Deltas are small integers per message, typically between -4 and +6. Great moments up to +8; crossing a line (crude, rude, very pushy) down to -14. Greetings and neutral small talk are around 0 to +2.
- Things that raise her interest: reciprocity (he shares, not just asks), genuine curiosity, following up on what she said, remembering details, humour, stories, a real opinion, calm confidence, well-timed light flirting, respect.
- Things that lower it: interview-style strings of questions without sharing, low-effort replies, bragging, validation-seeking, desperation, arrogance, generic pickup lines, overly sexual comments, pushing after she deflects.
- Weigh these through HER personality: ${c.name === "Ananya" ? "patience, listening and sharing something real matter most; rapid questions and pushiness hurt more; quiet is not disinterest." : c.name === "Meera" ? "opinions, wit and security matter most; safe/generic answers, validation-seeking and trying to impress hurt more." : c.name === "Sara" ? "playing along, spontaneity and banter matter most; boring, overly serious or needy replies hurt more." : "curiosity, stories and laughing at yourself matter most; interviewing and bragging hurt more."}
- Don't be mechanically predictable. The same message can land differently depending on mood and context.
- perception: her current honest take on him in plain language, written ABOUT him in second person, e.g. impression "You're interesting, but a little difficult to read."; likes like "Your humour", "You seem genuinely curious"; unsure like "You haven't shared much about yourself". 0–3 likes, 0–2 unsure, each under 8 words. vibe: one emoji + one or two words (e.g. 🙂 Curious, 😏 Flirty, 😐 Lukewarm, ☺️ Comfortable).
- newMemories: concrete facts he revealed about himself worth remembering (e.g. "He loves trekking", "He hates coffee"), third person, short. Empty if none.
- mentionedBeatIds: ids of LIFE items she brought up in this reply.
- wrapUp: true only if she's ending the conversation now (she's leaving, bored, or he crossed a line). After a long good chat (15+ exchanges) she may wrap up naturally with a real reason from her life.
- stepAway: true only if she briefly steps away mid-chat and will come back (rare; most likely for Sara).`;
}

export async function claudeChat(req: ChatRequest): Promise<ChatResponse> {
  const c = CHARACTERS[req.characterId];
  const life = lifeContext(c, req.dayIndex, req.toldBeats);
  const now = new Date();
  now.setHours(req.hour);
  const status = statusFor(c, now);

  const transcript = req.history.length
    ? req.history.slice(-40).map((m) => `${m.from === "her" ? c.name : "Him"}: ${m.text}`).join("\n")
    : "(no messages yet)";

  const eventLine =
    req.event === "open"
      ? `He hasn't messaged yet in this conversation. ${c.name} is texting him first — something natural from her life (e.g. an update from LIFE RIGHT NOW she hasn't told him, or a callback to a past item), not "I missed you". Deltas should be 0.`
      : req.event === "return"
        ? `${c.name} stepped away earlier and is now back. Write her coming back with a quick, real excuse and picking up the thread. Deltas should be 0.`
        : `His latest message: "${req.userText}"`;

  const user = `CONTEXT
Local time: ${req.hour}:00. What she's doing: ${status.activity}.
This is conversation #${req.sessionsCount + 1} between them; exchange #${req.sessionTurn + 1} of this conversation.
His name: ${req.userName || "unknown (she has it saved in her phone)"}.

LIFE RIGHT NOW (id: ${life.currentId}): ${life.now}
Recent past: ${life.past.length ? life.past.map((p) => `${p.text}${p.told ? " (already told him)" : ""}`).join(" | ") : "nothing notable"}
Already told him about: ${req.toldBeats.join(", ") || "nothing yet"}

MEMORY (what he's told her before): ${req.memories.length ? req.memories.join("; ") : "nothing yet"}

HER CURRENT HIDDEN STATE (drives behaviour, never mentioned)
${behaviour(req.state)}
Her previous take on him: "${req.perception.impression}"

CONVERSATION SO FAR
${transcript}

NOW
${eventLine}

Respond with the JSON object.`;

  const out = await structured({ system: systemPrompt(c), user, schema: ChatSchema, effort: "low", maxTokens: 3000 });
  const messages = out.messages.map((m) => m.trim()).filter(Boolean).slice(0, 3);
  if (!messages.length) throw new Error("no messages");
  const zero = req.event !== "message";
  return {
    messages,
    deltas: zero ? {} : out.deltas,
    perception: {
      impression: out.perception.impression || req.perception.impression,
      likes: out.perception.likes.slice(0, 3),
      unsure: out.perception.unsure.slice(0, 2),
      vibe: out.perception.vibe?.emoji ? out.perception.vibe : vibeFromState(req.state),
    },
    newMemories: out.newMemories.filter((m) => !req.memories.includes(m)).slice(0, 3),
    signals: zero ? undefined : out.read.signals,
    wrapUp: out.wrapUp,
    stepAway: out.stepAway && !out.wrapUp,
    usedLines: req.usedLines,
    toldBeats: [...new Set([...req.toldBeats, ...out.mentionedBeatIds.filter((id) => c.beats.some((b) => b.id === id))])],
    engine: "claude",
  };
}
