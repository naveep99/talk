import { CHARACTERS, CHARACTER_ORDER } from "./characters";
import { vibeFromState } from "./dynamics";
import type { AppState } from "./store";
import type { CharacterId, CharacterRuntime, ChatMessage, HiddenState, Perception, Session, SessionReport, UserProfile } from "./types";

// A believable few days of practice, so the dashboard, coach and memory can be
// explored without playing through them first.

const DAY = 86400000;
const id = () => Math.random().toString(36).slice(2, 10);

interface Script {
  who: CharacterId;
  daysAgo: number;
  minutes: number;
  lines: [("u" | "h"), string][];
  trail: number[];
  state: HiddenState;
  perception: Perception;
  memories: string[];
  told: string[];
  report: SessionReport;
  stats: Partial<Session["stats"]>;
}

const SCRIPTS: Script[] = [
  {
    who: "riya",
    daysAgo: 3,
    minutes: 11,
    lines: [
      ["u", "Hey! It's the guy from board game night"],
      ["h", "heyy it's the guy from board game night 👀"],
      ["h", "I was wondering if you'd actually text"],
      ["u", "How long have you been playing Codenames?"],
      ["h", "since college. I'm very competitive. it's a problem"],
      ["u", "What else do you do for fun?"],
      ["h", "I started pottery and I'm genuinely terrible at it"],
      ["h", "what about you?"],
      ["u", "I like trekking. Did Kudremukh last month"],
      ["h", "wait that's cool. was it hard?"],
      ["u", "Kind of. What do you do for work?"],
      ["h", "I design payment screens at a fintech startup. it sounds boring but I get weirdly emotional about buttons"],
      ["u", "Haha emotional about buttons is the most designer thing I've ever heard"],
      ["h", "😂😂 okay fair"],
      ["h", "what's the most spontaneous thing you've ever done?"],
      ["u", "Honestly booked a solo trip to Hampi two days before leaving once. Best decision that year. Got lost, found the best dosa of my life"],
      ["h", "okay that's unexpectedly interesting"],
      ["h", "I've never travelled solo. lowkey my next goal"],
      ["u", "Where would you go?"],
      ["h", "probably Pondi. I love it there"],
      ["u", "What do you like about Pondi?"],
      ["h", "the cafés, the quiet, the fact that nobody's in a hurry"],
      ["u", "Do you go often?"],
      ["h", "okay wait this is starting to feel like a job interview 😂"],
      ["u", "Haha sorry. I get curious. I've never been, I'd probably just eat my way through it"],
      ["h", "okay you're forgiven. that's the correct way to do Pondi"],
      ["h", "okay I have to go, Tanvi is calling about the playlist crisis"],
      ["h", "this was fun though 😄"],
    ],
    trail: [48, 49, 51, 52, 56, 55, 61, 66, 67, 68, 63, 71, 74],
    state: { interest: 74, comfort: 68, curiosity: 66, attraction: 55, trust: 60, playfulness: 70 },
    perception: {
      impression: "You're funny, but a little difficult to read.",
      likes: ["Your sense of humour", "You seem genuinely curious", "You're not trying too hard"],
      unsure: ["You haven't shared much about yourself"],
      vibe: { emoji: "🙂", label: "Curious" },
    },
    memories: ["He loves trekking", "He's been to Kudremukh", "He did a solo trip to Hampi"],
    told: [],
    stats: { userMessages: 12, questions: 8, disclosures: 3, humour: 2, followUps: 4, helpOpened: 1, helpUsed: 0 },
    report: {
      herTake: "You became more comfortable as the conversation went on. I liked your humour, but I wasn't sure what you were actually interested in. Talk soon? 😄",
      worked: ["You followed up on things she said.", "You made the conversation more playful with the buttons joke.", "You didn't panic when she teased you about the interview."],
      improve: "You asked 8 questions but only volunteered 3 things about yourself.",
      nextPractice: "Next time, try telling a short story instead of asking another question.",
      skills: { conversation: 64, confidence: 55, listening: 70, selfExpression: 41, flirting: 38, awkwardness: 62 },
      pattern: "You tend to ask questions when you're nervous. Try sharing your own experience before asking the next question.",
      coachNote: "You've practiced keeping conversations going. Next, let's work on sharing more of yourself.",
    },
  },
  {
    who: "ananya",
    daysAgo: 2,
    minutes: 8,
    lines: [
      ["u", "Hi Ananya! I still think about that staircase. Where was it even going?"],
      ["h", "Hi. The staircase guy?"],
      ["h", "Honestly, I think it was a structural apology."],
      ["u", "Haha a structural apology. So is that the architect diagnosis?"],
      ["h", "Haha. Okay, that was funny."],
      ["u", "What are you working on these days?"],
      ["h", "Deadline week. We're submitting drawings for a library competition."],
      ["u", "What's the library like?"],
      ["h", "Lots of light. Quiet corners."],
      ["u", "How long have you been working on it?"],
      ["h", "That's a lot of questions."],
      ["u", "Sorry! I just think it's cool. I spent most of college hiding in the library, so I have strong opinions about quiet corners"],
      ["h", "Hm. I relate to that a bit."],
      ["h", "What makes a good corner, then?"],
      ["u", "Near a window, but not in the sun. And far enough from the door that nobody walks past every two minutes"],
      ["h", "That's… actually exactly how we designed one of them."],
      ["h", "I should sleep. Early site visit tomorrow."],
      ["h", "This was nice, though."],
    ],
    trail: [45, 45, 49, 50, 49, 45, 50, 55, 52],
    state: { interest: 52, comfort: 50, curiosity: 52, attraction: 44, trust: 49, playfulness: 40 },
    perception: {
      impression: "You're funny, but it's a lot of questions.",
      likes: ["Your sense of humour", "You're not trying too hard"],
      unsure: ["It's a lot of questions at once"],
      vibe: { emoji: "🤔", label: "Figuring you out" },
    },
    memories: ["He spent college hiding in the library"],
    told: ["ananya-deadline"],
    stats: { userMessages: 7, questions: 5, disclosures: 2, humour: 2, followUps: 3, helpOpened: 2, helpUsed: 1 },
    report: {
      herTake: "Hm, I'm still figuring you out, honestly. I liked the staircase joke, but it was a lot of questions.",
      worked: ["You opened with something specific from when you met.", "Your answer about quiet corners really landed.", "You recovered well after she said it was a lot of questions."],
      improve: "Three questions in a row made her pull back. She opened up when you shared something instead.",
      nextPractice: "With Ananya, share first and leave space. She'll ask when she's curious.",
      skills: { conversation: 55, confidence: 52, listening: 66, selfExpression: 50, flirting: 30, awkwardness: 64 },
      pattern: "When a conversation slows down, you fill the gap with questions. Try sharing something instead.",
      coachNote: "You handle the awkward moments well. Next, let's work on sharing more of yourself.",
    },
  },
  {
    who: "meera",
    daysAgo: 1,
    minutes: 13,
    lines: [
      ["u", "Okay I've recovered from the name tag roast. Mostly."],
      ["h", "Name tag guy. Hi."],
      ["h", "Did you recover?"],
      ["u", "Mostly. I've decided the font was the problem, not me"],
      ["h", "Hah. Fine. Point to you."],
      ["h", "Okay, give me a genuinely unpopular opinion. Not a safe one."],
      ["u", "Brunch is overrated. It's just breakfast that costs three times more and makes you wait 40 minutes"],
      ["h", "Wow. My entire friend group would block you."],
      ["h", "Sunday brunch is sacred."],
      ["u", "I stand by it. But I'd go to one if someone promised it turns into dinner"],
      ["h", "Okay, that's actually the correct answer. That's literally what we do."],
      ["u", "What's the hardest part of running Kaapi Club right now?"],
      ["h", "Fundraising. Pitching on Thursday. I'm not nervous."],
      ["u", "You're a little nervous"],
      ["h", "…Okay, a little. Don't tell anyone."],
      ["h", "What do you actually want? Not from me. In general."],
      ["u", "Good question. I guess I want a job I'm proud of and people around me who make it feel worth it"],
      ["h", "That's honest. I like honest."],
      ["u", "I'd also accept a brunch that turns into dinner"],
      ["h", "You're cute when you try 😏"],
      ["h", "I need to sleep, boxing at 7."],
      ["h", "You did alright tonight."],
    ],
    trail: [44, 46, 51, 54, 57, 58, 63, 62, 61],
    state: { interest: 61, comfort: 58, curiosity: 57, attraction: 55, trust: 52, playfulness: 66 },
    perception: {
      impression: "You're funny. There's a bit of a spark.",
      likes: ["Your sense of humour", "A real opinion", "You didn't back down"],
      unsure: ["She hasn't seen you flirt back yet"],
      vibe: { emoji: "😄", label: "Playful" },
    },
    memories: ["He thinks brunch is overrated", "He wants a job he's proud of"],
    told: ["meera-pitch"],
    stats: { userMessages: 8, questions: 1, disclosures: 4, humour: 3, followUps: 2, helpOpened: 0, helpUsed: 0 },
    report: {
      herTake: "Not bad. I liked that you had an actual opinion and didn't fold when I pushed back. Don't get cocky.",
      worked: ["You gave a real opinion and held it.", "You called her nervousness out playfully — and she liked it.", "You found your own words — no Help needed."],
      improve: "When she flirted ('you're cute when you try'), the conversation ended before you flirted back.",
      nextPractice: "Next time she teases you, tease back. Light and playful is enough.",
      skills: { conversation: 70, confidence: 68, listening: 62, selfExpression: 66, flirting: 45, awkwardness: 70 },
      pattern: "You're much more confident when you have an opinion to defend. Lean into that.",
      coachNote: "You've practiced keeping conversations going. Next, let's work on playful banter.",
    },
  },
];

export function buildSample(existing?: UserProfile): Partial<AppState> {
  const now = Date.now();
  const profile: UserProfile = {
    name: existing?.name ?? "Arjun",
    experience: existing?.experience ?? "a_little",
    struggles: existing?.struggles ?? ["starting", "keeping_going", "overthinking"],
    goals: existing?.goals ?? ["Starting conversations", "Flirting"],
    onboardedAt: now - 4 * DAY,
  };

  const chars = {} as Record<CharacterId, CharacterRuntime>;
  const sessions: Session[] = [];
  for (const cid of CHARACTER_ORDER) {
    const base = CHARACTERS[cid].baseState;
    chars[cid] = {
      state: { ...base },
      perception: { impression: "First impressions are still forming.", likes: [], unsure: [], vibe: vibeFromState(base) },
      memories: [],
      messages: [],
      usedLines: [],
      sessionsCount: 0,
      toldBeats: [],
    };
  }

  for (const s of SCRIPTS) {
    const sid = id();
    const start = now - s.daysAgo * DAY - 2 * 3600000;
    const step = (s.minutes * 60000) / s.lines.length;
    let ui = 0;
    const messages: ChatMessage[] = s.lines.map(([from, text], i) => {
      const m: ChatMessage = { id: id(), from: from === "u" ? "user" : "her", text, at: start + i * step, sessionId: sid };
      if (from === "u") {
        m.delta = (s.trail[ui + 1] ?? s.trail[ui]) - s.trail[ui];
        ui++;
      }
      return m;
    });
    const stats = { userMessages: 0, questions: 0, disclosures: 0, humour: 0, followUps: 0, flirts: 0, helpOpened: 0, helpUsed: 0, tooForward: 0, ...s.stats };
    sessions.push({
      id: sid,
      characterId: s.who,
      startedAt: start,
      endedAt: start + s.minutes * 60000,
      startInterest: s.trail[0],
      endInterest: s.trail[s.trail.length - 1],
      trail: s.trail,
      stats,
      report: s.report,
      endedByHer: true,
      signals: [],
    });
    chars[s.who] = {
      ...chars[s.who],
      state: s.state,
      perception: s.perception,
      memories: s.memories.map((text) => ({ text, at: start })),
      messages,
      sessionsCount: 1,
      toldBeats: s.told,
      usedLines: s.lines.filter(([f]) => f === "h").map(([, t]) => JSON.stringify(t)),
      lastSeenAt: start + s.minutes * 60000,
    };
  }

  return {
    profile,
    chars,
    sessions,
    dayOffset: 0,
    coach: [
      {
        id: id(),
        from: "coach",
        at: now - DAY + 3600000,
        text: "I've noticed something across your first three conversations: you actually do well once things get going — Meera warmed up a lot once you gave her a real opinion. Your bigger challenge is sharing yourself early, before the questions pile up.\n\nWant to try something next time? Before each question, share one small thing about yourself first.",
      },
    ],
  };
}
