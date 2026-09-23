import { CHARACTERS } from "../../characters";
import type { CoachRequest, CoachResponse, CoachSessionSummary } from "../../types";

// The offline coach: intent routing to hand-written advice, personalised
// with what we actually know from his practice sessions.

const STRUGGLE_LABEL: Record<string, string> = {
  starting: "starting conversations",
  what_to_say: "knowing what to say",
  flirting: "flirting",
  keeping_going: "keeping conversations going",
  reading_interest: "knowing if she's interested",
  rejection: "handling rejection",
  asking_out: "asking someone out",
  confidence: "confidence",
  overthinking: "overthinking",
};

function observation(sessions: CoachSessionSummary[]): string | undefined {
  if (!sessions.length) return undefined;
  const recent = sessions.slice(-3);
  const q = recent.reduce((a, s) => a + s.stats.questions, 0);
  const d = recent.reduce((a, s) => a + s.stats.disclosures, 0);
  const h = recent.reduce((a, s) => a + s.stats.humour, 0);
  const help = recent.reduce((a, s) => a + s.stats.helpUsed, 0);
  const last = sessions[sessions.length - 1];
  const who = CHARACTERS[last.characterId].name;
  if (q >= 6 && d * 2 < q)
    return `Across your last ${recent.length === 1 ? "conversation" : `${recent.length} conversations`}, you asked ${q} questions and shared ${d} things about yourself. You're curious, which is great — but people connect with what you share, not just what you ask.`;
  if (help >= 4) return `You've leaned on Help ${help} times recently. That's fine while you're learning, but I've noticed your own replies are usually better than you think.`;
  if (h === 0 && recent.length >= 2) return `You're consistently genuine and respectful — that's the hard part. What's missing is a bit of play. None of your last few chats had much humour in them.`;
  if (last.endInterest - last.startInterest >= 12) return `Your last chat with ${who} went well — she warmed up a lot as it went on. You do better once you relax into it.`;
  return `Your last chat with ${who} ended at ${last.endInterest}. ${last.improve ?? ""}`.trim();
}

const RULES: { re: RegExp; reply: (ctx: Ctx) => string }[] = [
  {
    re: /\b(freeze|froze|approach|nervous|anxious|scared|panic|blank)\b/i,
    reply: (c) =>
      `Freezing is really common, and it's not a sign something's wrong with you — your brain is just treating a normal conversation like a test.\n\nA few things that actually help:\n\n• **Lower the stakes.** You're not trying to get a date, you're just trying to have one nice exchange. That's it.\n• **Have a boring opener ready.** "Hey, how's your day going?" is completely fine. The opener matters way less than what comes after.\n• **Say what's true.** "I'm a bit nervous, but I wanted to say hi" is disarming, not weak.\n\n${c.obs ? `${c.obs}\n\n` : ""}**Try this:** start your next chat with ${c.suggest} and send your first message within 30 seconds of opening it. No drafting.`,
  },
  {
    re: /\b(hasn'?t replied|no reply|not replying|left on read|ghost|text again|double text|haven'?t heard)\b/i,
    reply: () =>
      `Six hours of silence feels like forever, but it's usually just life — work, friends, a phone in another room.\n\nMy honest take:\n\n• **Don't send "hey?" or "did I say something wrong?"** It puts pressure on her and makes you look anxious.\n• **Wait about a day.** If you want to text again, send something new and light — a callback to something she said, or a funny thing from your day. Not a follow-up on the unanswered message.\n• **If there's still nothing after that, let it go.** It's not a verdict on you. Her silence is information about her bandwidth, not your worth.\n\nOne double-text is normal. Three is a pattern she'll notice.`,
  },
  {
    re: /\b(flirt|flirting|flirty|tease|teasing|banter)\b/i,
    reply: (c) =>
      `Flirting is mostly just **playfulness plus a little bit of intention**. It's not lines, and it's definitely not compliments about her body.\n\nThree easy starting points:\n\n• **Playful disagreement.** She says chai > coffee — you say "I'm not sure this is going to work out then." It creates a fun little tension.\n• **Tease, then warm up.** "You're very competitive. It's slightly terrifying. I respect it."\n• **Compliment choices, not looks.** "Okay, your taste in music is annoyingly good."\n\nIf she laughs or plays along, keep going. If she goes quiet or changes the subject, dial it back — no big deal.\n\n${c.obs ? `${c.obs}\n\n` : ""}**Practice:** Sara and Meera are great for this. Sara will throw weird questions at you — play along instead of answering seriously.`,
  },
  {
    re: /\b(awkward|went badly|bad date|date (was|felt)|cringe|embarrass)/i,
    reply: () =>
      `First: awkward dates happen to everyone, including people who are "good at dating." Awkwardness usually just means two people who both care about how it's going.\n\nLet's look at it without beating yourself up:\n\n• **Was it awkward the whole time, or at certain moments?** Usually it's a few specific moments — a silence, a joke that didn't land.\n• **What did you do in those moments?** Most people either panic-ask questions or go quiet.\n• **What's one thing that went okay?** There's almost always something.\n\nTell me a bit about what happened and I'll give you a specific read on it. And next time a silence hits, try naming it lightly: "Okay, that was a very dramatic pause." It breaks the tension instantly.`,
  },
  {
    re: /\b(run out|ran out|nothing to say|what to say|keep (the )?conversation|keep it going|dry|conversation dies|boring)\b/i,
    reply: (c) =>
      `Running out of things to say usually isn't a lack of topics — it's that you're treating each message like it has to start something new.\n\nTry **threading**: every message has 2–3 little hooks in it. Pick one and pull on it.\n\nShe says: *"Long day, I had back-to-back meetings and then pottery class."*\nThat's three threads — the long day, meetings, pottery. "Wait, you do pottery? Are you actually good or is it chaos?" beats "Nice, what else did you do?" every time.\n\nAnd **share before you ask**. "I tried pottery once and made something that looked like a sad ashtray. How's yours going?" gives her something to react to.\n\n${c.obs ? `${c.obs}\n\n` : ""}**Exercise:** In your next chat, before every question you ask, share one small thing about yourself first.`,
  },
  {
    re: /\b(reject|rejection|turned down|said no|not interested)\b/i,
    reply: () =>
      `Rejection stings, and pretending it doesn't just makes it weirder. But here's the reframe that actually helps: **a "no" means the question got answered**. You're not stuck wondering anymore.\n\nThings that make it easier:\n\n• **Ask in a way that makes "no" easy for her.** "Would you want to get a coffee sometime? Totally fine if not." Less pressure for both of you.\n• **Respond to a no with grace.** "Fair enough — it was nice talking to you." That's genuinely attractive, and it's how you want to be remembered.\n• **Count attempts, not outcomes.** Every time you ask, you're getting better at asking.\n\nIn practice, try asking one of the women out when it feels right. Sometimes she'll say maybe or no — notice that the world doesn't end.`,
  },
  {
    re: /\b(ask (her|someone|them) out|asking out|ask for (a )?date|ask for (her )?number)\b/i,
    reply: () =>
      `The best time to ask someone out is **when the conversation is going well** — not after it's already fizzled.\n\nKeep it simple and specific:\n\n• ❌ "So, would you maybe want to hang out sometime or whatever?"\n• ✅ "I'm enjoying this. Want to continue it over momos this week?"\n\nSpecific plans are easier to say yes to. Tie it to something you talked about — she mentioned a café, a food, a place — and it feels natural, not random.\n\n**Practice:** next time a chat is going well (you'll see it in how she's replying), ask her out. Notice what happens.`,
  },
  {
    re: /\b(is she interested|she likes me|signs|into me|does she like|mixed signals)\b/i,
    reply: () =>
      `The most reliable signs someone is interested aren't mysterious:\n\n• **She asks you questions back.** Curiosity is the clearest signal there is.\n• **Her replies get longer or more personal over time.**\n• **She references things you said earlier.**\n• **She keeps the conversation going when it could have ended.**\n\nWhat's *not* a reliable sign: reply speed. People are busy.\n\nThat's actually what the interest indicator in practice is simulating — watch how her replies change when it goes up or down. That skill of reading the conversation transfers directly to real life.`,
  },
  {
    re: /\b(confidence|confident|insecure|not good enough|overthink|overthinking|in my head)\b/i,
    reply: (c) =>
      `Confidence isn't feeling no nerves — it's being okay with the nerves and talking anyway.\n\nOverthinking usually comes from treating every message like it'll be judged. Here's what I'd try:\n\n• **Set a 30-second rule.** Write, reread once, send. Most "perfect" messages aren't better than your first draft.\n• **Aim for honest, not impressive.** Impressive is exhausting. Honest is easy to keep up.\n• **Notice evidence.** ${c.obs ?? "Every conversation you finish is proof you can do this."}\n\nYou're practicing here so that real conversations feel less new. That's how confidence actually builds — through reps, not pep talks.`,
  },
  {
    re: /\b(how am i doing|progress|improving|getting better|my patterns|feedback)\b/i,
    reply: (c) => {
      if (!c.sessions.length)
        return `We haven't got much to go on yet — you haven't finished a practice conversation. Talk to ${c.suggest} for 5 minutes and come back; I'll have something real to tell you.`;
      const n = c.sessions.length;
      const avg = Math.round(c.sessions.reduce((a, s) => a + s.endInterest, 0) / n);
      const first = c.sessions[0].endInterest;
      const last = c.sessions[n - 1].endInterest;
      return `You've had **${n} practice conversation${n === 1 ? "" : "s"}**, with an average connection of **${avg}**.${n > 1 ? ` Your first ended at ${first}, your most recent at ${last}${last > first ? " — that's real progress." : "."}` : ""}\n\n${c.obs ?? ""}\n\nWhat I'd focus on next: **${c.focus}**. Want a specific exercise for that?`;
    },
  },
];

interface Ctx {
  obs?: string;
  suggest: string;
  focus: string;
  sessions: CoachSessionSummary[];
}

export function localCoach(req: CoachRequest): CoachResponse {
  const sessions = req.sessions;
  const struggles = req.profile.struggles.map((s) => STRUGGLE_LABEL[s] ?? s);
  const obs = observation(sessions);
  const easiest = sessions.length === 0 ? "Riya" : sessions.length < 3 ? "Ananya" : "Meera";
  const note = sessions[sessions.length - 1]?.coachNote?.match(/let's work on (.+?)\.?$/i)?.[1];
  const focus = note ?? struggles[0] ?? "starting conversations";
  const ctx: Ctx = { obs, suggest: easiest, focus, sessions };

  for (const rule of RULES) if (rule.re.test(req.message)) return { text: rule.reply(ctx), engine: "local" };

  if (/^(hi|hey|hello|yo|sup)\b/i.test(req.message.trim())) {
    return {
      text: `Hey${req.profile.name ? ` ${req.profile.name}` : ""}. ${obs ?? `You mentioned ${struggles[0] ?? "wanting to get more comfortable"} is the hard part.`}\n\nWhat's on your mind — something from practice, or something from real life?`,
      engine: "local",
    };
  }
  if (/\b(yes|sure|okay|ok|exercise)\b/i.test(req.message) && req.history.some((m) => m.from === "coach" && /exercise/i.test(m.text))) {
    return {
      text: `Here's one: **the share-first rule.** In your next conversation, every time you're about to ask a question, first say one small true thing about yourself. Small is fine — what you ate, a song stuck in your head, something that annoyed you today.\n\nThen ask. Watch how differently she replies. Try it with ${easiest}.`,
      engine: "local",
    };
  }
  return {
    text: `That's a good thing to think about. I don't want to give you a generic answer, so tell me a bit more — is this about someone specific, or more of a general pattern you've noticed?\n\n${obs ? `For context, here's what I've seen from your practice: ${obs}` : `And whenever you're ready, a 5-minute chat with ${easiest} will give me something concrete to work with.`}`,
    engine: "local",
  };
}
