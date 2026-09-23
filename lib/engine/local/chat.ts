import { analyzeMessage, extractMemories, isGreeting, keywords } from "../../analysis";
import { CHARACTERS } from "../../characters";
import { vibeFromState } from "../../dynamics";
import { currentBeat, openerBeat, pastBeats } from "../../life";
import type {
  ChatRequest,
  ChatResponse,
  CharacterId,
  HiddenState,
  Perception,
  StateDeltas,
  TurnSignals,
} from "../../types";
import { BANKS, TOPIC_WORDS, type BankQuestion } from "./banks";
import { MET, QUESTION_FOLLOW, VOICE } from "./voice";

type Rand = () => number;

const ABOUT_YOU = /\b(what about you|how about you|and you\??$|wbu|hbu|you\?$|tell me (about|something about) (yourself|you)|what'?s your (story|deal)|about yourself)\b/i;
const HOW_ARE_YOU = /\b(how are you|how'?s (it going|your (day|week|evening|night|weekend))|how (was|is) your (day|week|evening|weekend)|what are you (up to|doing)|what'?s up|wyd|sup\b|how have you been)\b/i;
const OPINION = /\b(i think|honestly|i feel like|in my opinion|i'd say|i believe|i reckon|actually|unpopular|hot take|i disagree|i don't think)\b/i;

interface Tuning {
  flirtThreshold: number;
  weights: Partial<Record<keyof TurnSignals | "story" | "interview" | "opinion" | "safe", number>>;
  questionBackChance: number;
}

// How much each behaviour moves her interest. Other dimensions follow from these.
const TUNING: Record<CharacterId, Tuning> = {
  riya: {
    flirtThreshold: 52,
    weights: { humour: 6, disclosure: 4, story: 4, followUp: 4, flirt: 4, question: 1, interview: -5, lowEffort: -4, bragging: -6, validationSeeking: -3, tooForward: -12, rude: -14, opinion: 2 },
    questionBackChance: 0.6,
  },
  ananya: {
    flirtThreshold: 62,
    weights: { humour: 3, disclosure: 5, story: 5, followUp: 6, flirt: 3, question: 1, interview: -6, lowEffort: -2, bragging: -5, validationSeeking: -2, tooForward: -14, rude: -14, opinion: 2 },
    questionBackChance: 0.35,
  },
  meera: {
    flirtThreshold: 50,
    weights: { humour: 6, disclosure: 3, story: 4, followUp: 4, flirt: 4, question: 0, interview: -6, lowEffort: -7, bragging: -8, validationSeeking: -7, tooForward: -12, rude: -14, opinion: 6, safe: -4 },
    questionBackChance: 0.5,
  },
  sara: {
    flirtThreshold: 45,
    weights: { humour: 7, disclosure: 2, story: 5, followUp: 3, flirt: 5, question: 1, interview: -4, lowEffort: -7, bragging: -5, validationSeeking: -4, tooForward: -10, rude: -14, opinion: 2 },
    questionBackChance: 0.55,
  },
};

function pick<T>(arr: T[], used: Set<string>, rand: Rand, keyOf: (t: T) => string = (t) => JSON.stringify(t)): T {
  const fresh = arr.filter((x) => !used.has(keyOf(x)));
  const pool = fresh.length ? fresh : arr;
  const choice = pool[Math.floor(rand() * pool.length)];
  used.add(keyOf(choice));
  return choice;
}

function detectTopic(text: string): string | undefined {
  for (const [topic, re] of Object.entries(TOPIC_WORDS)) if (re.test(text)) return topic;
  return undefined;
}

/** "He loves trekking" -> "love trekking", for her to say back. */
export function memoryAsYou(m: string): string {
  return m
    .replace(/^He's been to /, "have been to ")
    .replace(/^He's from /, "are from ")
    .replace(/^He's into /, "are into ")
    .replace(/^He's an? /, (x) => (x.endsWith("an ") ? "are an " : "are a "))
    .replace(/^He mentioned his /, "have a ")
    .replace(/^He can't stand /, "can't stand ")
    .replace(/^He (\w+)s /, "$1 ")
    .replace(/ \((\w+)\)$/, " called $1");
}

function composeQuestion(q: BankQuestion, rand: Rand): string {
  return Array.isArray(q.text) ? q.text[Math.floor(rand() * q.text.length)] : q.text;
}

export function localChat(req: ChatRequest, rand: Rand = Math.random): ChatResponse {
  const c = CHARACTERS[req.characterId];
  const bank = BANKS[req.characterId];
  const voice = VOICE[req.characterId];
  const tune = TUNING[req.characterId];
  const used = new Set(req.usedLines);
  const told = new Set(req.toldBeats);
  const s = req.state;
  const lines = (arr: string[]) => pick(arr, used, rand);

  // ---- She opens or comes back -------------------------------------------
  if (req.event === "open") {
    const beat = openerBeat(c, req.dayIndex, req.toldBeats);
    let messages: string[];
    if (beat?.opener) {
      messages = [beat.opener];
      told.add(beat.id);
    } else {
      const prev = pastBeats(c, req.dayIndex).find((b) => !told.has(b.id) && voice.pastBeatLines[b.id]);
      if (prev) {
        messages = [...pick(bank.returnGreeting, used, rand), voice.pastBeatLines[prev.id]];
        told.add(prev.id);
      } else messages = pick(bank.returnGreeting, used, rand);
    }
    return finish(req, messages, {}, [], undefined, false, false, used, told);
  }
  if (req.event === "return") {
    const back = bank.comeBack ? pick(bank.comeBack, used, rand) : ["sorry, back"];
    return finish(req, back, {}, [], undefined, false, false, used, told);
  }

  // ---- Read his message ---------------------------------------------------
  const text = (req.userText ?? "").trim();
  const herLast = [...req.history].reverse().find((m) => m.from === "her")?.text;
  // Only things she said a while ago count as "remembering".
  const herEarlier = req.history.filter((m) => m.from === "her").slice(0, -3).map((m) => m.text).join(" ");
  const sig = analyzeMessage(text, herLast);
  const words = text.split(/\s+/).filter(Boolean).length;
  // "how long have you been doing that?" is about whatever she just said.
  const topic = detectTopic(text) ?? (sig.question && herLast && /\b(that|it|there|this)\b/i.test(text) ? detectTopic(herLast) : undefined);
  const askedAboutHer = sig.question && (ABOUT_YOU.test(text) || /\byou\b|\byour\b/i.test(text));
  const howAreYou = HOW_ARE_YOU.test(text);
  const story = sig.disclosure && text.length > 90;
  const opinion = OPINION.test(text) && words >= 6;
  const herAskedQuestion = !!herLast && /\?|^(okay )?(what|why|how|would|describe|be honest|you have|if you)/i.test(herLast);
  const safe = req.characterId === "meera" && herAskedQuestion && words < 7 && !sig.humour && !opinion && !sig.question;
  const recent = [...req.recentSignals.slice(-2), sig];
  const interview =
    recent.length >= 3 && recent.every((r) => r.question && !r.disclosure) && !sig.humour;
  // Remembering something she said earlier (not just replying to the last line) is a big deal.
  const rememberedHer =
    !!herEarlier && keywords(text).some((w) => w.length > 4 && herEarlier.toLowerCase().includes(w)) && !(herLast && keywords(herLast).some((w) => text.toLowerCase().includes(w)));
  const firstMeeting = req.sessionsCount === 0 && req.sessionTurn === 0;
  const firstOfSession = req.sessionTurn === 0 && !req.history.some((m) => m.from === "her");
  const metRef =
    req.sessionsCount === 0 && req.sessionTurn <= 2 && MET[req.characterId].re.test(text) && MET[req.characterId].lines.every((l) => !used.has(JSON.stringify(l)));
  // Did he just answer one of her questions?
  const herQ = herLast ? bank.questions.find((q) => herLast.includes(composeQuestion(q, () => 0))) : undefined;
  const follow = herQ ? QUESTION_FOLLOW[herQ.key] : undefined;
  const answeredHerQ = !!follow && !sig.lowEffort && words >= 3 && !sig.tooForward && !sig.rude && !(sig.question && !sig.disclosure);

  // ---- Move her state -----------------------------------------------------
  const w = tune.weights;
  let di = 0.5; // a normal, pleasant exchange nudges things forward a little
  const d: StateDeltas = { comfort: 1 };
  const add = (k: keyof HiddenState, v: number) => (d[k] = (d[k] ?? 0) + v);

  if (sig.humour) { di += w.humour ?? 0; add("playfulness", 4); add("attraction", 2); add("comfort", 2); }
  if (sig.disclosure) { di += w.disclosure ?? 0; add("trust", 3); add("comfort", 2); add("curiosity", 2); }
  if (story) { di += w.story ?? 0; add("curiosity", 3); }
  if (sig.followUp) { di += w.followUp ?? 0; add("trust", 2); }
  if (rememberedHer) { di += 4; add("trust", 4); add("attraction", 2); }
  if (opinion) { di += w.opinion ?? 0; add("attraction", req.characterId === "meera" ? 3 : 1); }
  if (sig.question && !interview) { di += w.question ?? 0; add("curiosity", 1); }
  if (answeredHerQ) { di += 2; add("curiosity", 2); add("comfort", 1); }
  if (metRef) { di += 2; add("playfulness", 2); }
  if (interview) { di += w.interview ?? 0; add("comfort", -3); add("curiosity", -2); }
  if (sig.lowEffort) { di += w.lowEffort ?? 0; add("curiosity", -3); }
  if (sig.bragging) { di += w.bragging ?? 0; add("attraction", -3); add("trust", -2); }
  if (sig.validationSeeking) { di += w.validationSeeking ?? 0; add("attraction", -3); }
  if (safe) { di += w.safe ?? 0; }
  if (req.characterId === "sara" && text.length > 350) { di -= 2; }
  if (req.characterId === "ananya" && text.length > 120 && sig.disclosure) { di += 1; }

  let flirtLanded: boolean | undefined;
  if (sig.flirt && !sig.tooForward && !sig.askOut) {
    const readiness = (s.attraction + s.comfort + s.interest) / 3;
    flirtLanded = readiness >= tune.flirtThreshold - (sig.humour ? 5 : 0);
    if (flirtLanded) { di += w.flirt ?? 0; add("attraction", 5); add("playfulness", 2); }
    else { di -= 3; add("comfort", req.characterId === "ananya" ? -5 : -2); }
  }
  if (sig.tooForward) { di += w.tooForward ?? 0; add("comfort", -12); add("trust", -10); add("attraction", -6); }
  if (sig.rude) { di += w.rude ?? 0; add("trust", -12); add("comfort", -10); }

  // Greetings don't move much on their own.
  if (firstOfSession && isGreeting(text)) di = 0;
  else if (firstMeeting && words >= 7 && !sig.tooForward && !sig.rude) di += 2; // a real opener

  let askOutAnswer: "yes" | "maybe" | "no" | undefined;
  if (sig.askOut && !sig.tooForward && !sig.rude) {
    const score = s.interest * 0.5 + s.trust * 0.3 + s.attraction * 0.2;
    const early = req.sessionsCount === 0 && req.sessionTurn < 5 && req.characterId !== "sara";
    askOutAnswer = score > 64 && !early ? "yes" : score > 46 ? "maybe" : "no";
    di += askOutAnswer === "yes" ? 4 : askOutAnswer === "maybe" ? 1 : -2;
    if (askOutAnswer === "yes") add("attraction", 3);
  }
  d.interest = Math.round(di);

  const projectedInterest = s.interest + (d.interest ?? 0);

  // ---- Compose her reply ------------------------------------------------------
  const out: string[] = [];
  let helpKey: string | undefined;
  let wrapUp = false;
  let stepAway = false;

  const lowInterest = projectedInterest < 36;
  const openedUp = s.comfort > 55;

  if (sig.rude) {
    out.push(lines(bank.react.rude));
    if (projectedInterest < 40 || s.trust < 35) {
      out.push(req.characterId === "sara" ? "anyway gotta go" : req.characterId === "meera" ? "I'm going to go." : "I think I'm going to head off.");
      wrapUp = true;
    }
    return finish(req, out, d, [], sig, wrapUp, false, used, told, undefined, flirtLanded);
  }
  if (sig.tooForward) {
    out.push(lines(bank.react.tooForward));
    if (s.trust < 30 || req.recentSignals.some((r) => r.tooForward)) {
      out.push(req.characterId === "ananya" ? "I'm going to go now." : req.characterId === "meera" ? "We're done for tonight." : "okay I'm gonna go");
      wrapUp = true;
    }
    return finish(req, out, d, [], sig, wrapUp, false, used, told, undefined, flirtLanded);
  }

  if (metRef) {
    out.push(...pick(MET[req.characterId].lines, used, rand));
  } else if (firstOfSession && req.sessionsCount === 0) {
    out.push(...pick(bank.firstReply, used, rand));
  } else if (firstOfSession) {
    out.push(...pick(bank.returnGreeting, used, rand));
    const prev = pastBeats(c, req.dayIndex).find((b) => !told.has(b.id) && voice.pastBeatLines[b.id]);
    if (prev && rand() < 0.6) { out.push(voice.pastBeatLines[prev.id]); told.add(prev.id); }
  }

  // Her reaction to how he's showing up.
  const reaction = (() => {
    if (askOutAnswer) return lines(bank.askOut[askOutAnswer]);
    if (interview) return lines(bank.react.interview);
    if (sig.bragging) return lines(bank.react.brag);
    if (sig.validationSeeking) return lines(bank.react.validation);
    if (safe && voice.safeCallout) return lines(voice.safeCallout);
    if (flirtLanded === true) return lines(bank.react.flirtWarm);
    if (flirtLanded === false) return lines(bank.react.flirtCool);
    if (answeredHerQ && follow) return lines(follow.react);
    if (story && rand() < 0.8) return lines(bank.react.story);
    if (sig.humour && rand() < 0.85) return lines(bank.react.humour);
    if (rememberedHer) return lines(bank.react.followUp);
    if (sig.followUp && sig.question && rand() < 0.4) return lines(bank.react.followUp);
    if (sig.disclosure && rand() < 0.55) return lines(bank.react.disclosure);
    if (sig.lowEffort) return lines(bank.react.lowEffort);
    if (!sig.question && !firstOfSession && rand() < 0.35) return lines(bank.react.generic);
    return undefined;
  })();
  if (reaction && !(firstOfSession && isGreeting(text)) && !metRef) out.push(reaction);

  // She shares her own answer to the question she asked.
  let sharedMine = false;
  if (answeredHerQ && follow?.mine && !used.has(follow.mine) && rand() < 0.65) {
    out.push(follow.mine);
    used.add(follow.mine);
    sharedMine = true;
  }

  // Answer if he asked her something.
  let answered = false;
  if (sig.question && !interview && !askOutAnswer) {
    if (howAreYou) {
      const beat = currentBeat(c, req.dayIndex);
      const bl = voice.beatLines[beat.id];
      if (bl) { out.push(lines(bl)); told.add(beat.id); answered = true; }
    } else if (topic && bank.topics[topic]) {
      out.push(lines(bank.topics[topic]));
      answered = true;
    } else if (askedAboutHer && ABOUT_YOU.test(text)) {
      out.push(lines(bank.aboutYouAnswers));
      answered = true;
    } else if (askedAboutHer) {
      const fallback: Record<CharacterId, string[]> = {
        riya: ["hmm good question actually. let me think", "honestly? depends on the day 😅", "ooh okay I have to think about that one"],
        ananya: ["Hm. I'm not sure. I'd have to think about it.", "I don't know. I've never really thought about it that way."],
        meera: ["Depends. Why do you want to know?", "Good question. I'll answer it when you answer yours first."],
        sara: ["hmm depends on my mood honestly", "okay that's a good question. I refuse to answer it yet 😏"],
      };
      out.push(lines(fallback[req.characterId]));
      answered = true;
    }
  } else if (interview) {
    // She still answers, but pointedly doesn't carry it.
    if (topic && bank.topics[topic] && req.characterId !== "meera") { out.push(lines(bank.topics[topic])); answered = true; }
  }

  // He shared something on a topic she has thoughts on: she relates.
  if (!answered && sig.disclosure && topic && bank.topics[topic] && rand() < (openedUp ? 0.55 : 0.3)) {
    out.push(lines(bank.topics[topic]));
  }

  // Occasionally she opens up — only when trust is genuinely there.
  const canDeepShare = s.trust > 62 && s.comfort > 60 && req.sessionTurn >= 4 && !used.has(voice.deepShare[0]) && rand() < 0.3;
  if (canDeepShare && !lowInterest) {
    out.push(voice.deepShare[0]);
    used.add(voice.deepShare[0]);
  }

  // Memory callback: she remembers something he told her before.
  if (req.memories.length && req.sessionTurn >= 2 && !lowInterest && rand() < 0.18) {
    const mem = req.memories.find((m) => !used.has(`mem:${m}`));
    if (mem) {
      used.add(`mem:${mem}`);
      out.push(lines(bank.react.rememberedYou).replace("{memory}", memoryAsYou(mem)));
    }
  }

  // Keep the conversation going (or not).
  const lastIsQuestion = out.length > 0 && /\?$/.test(out[out.length - 1]);
  const curiousEnough = !lowInterest && (s.curiosity + (d.curiosity ?? 0)) > 35;
  const openingBurst = firstOfSession && out.length >= 2;
  const herLastWasQuestion = !!herLast && /\?\s*$/.test(herLast);
  const shouldAsk = !lastIsQuestion && curiousEnough && !(askOutAnswer === "yes") && !interview && !openingBurst;
  if (shouldAsk) {
    const sara = req.characterId === "sara";
    if (sara && req.sessionTurn >= 2 && req.sessionTurn % 4 === 2 && bank.randomQs?.length) {
      const q = pick(bank.randomQs, used, rand, (x) => x.key);
      out.push(lines(["okay random question", "wait. random question", "unrelated but", "okay new topic", "important question"]), composeQuestion(q, rand));
      helpKey = q.key;
    } else if (answered && !/\b(that|it|there)\b/i.test(text) && rand() < tune.questionBackChance && !(req.characterId === "ananya" && s.comfort < 45 && rand() < 0.5)) {
      out.push(lines(voice.yourTurn));
    } else if (sig.disclosure && !sig.question && rand() < 0.55) {
      out.push(lines(voice.followUpQs));
    } else if (!sig.question && (rand() < (sharedMine || herLastWasQuestion ? 0.3 : 0.55) || out.length === 0)) {
      const fresh = bank.questions.filter((q) => !used.has(q.key));
      if (fresh.length) {
        const q = pick(fresh, used, rand, (x) => x.key);
        out.push(composeQuestion(q, rand));
        helpKey = q.key;
      } else {
        out.push(lines(voice.followUpQs));
      }
    }
  }

  if (out.length === 0) out.push(lines(sig.lowEffort ? bank.react.lowEffort : bank.react.generic));

  // Low interest: she gets brief. Ananya is brief early regardless.
  let messages = out;
  if (lowInterest) messages = out.slice(0, 1);
  else if (req.characterId === "ananya" && s.comfort < 45) messages = out.slice(0, 2);
  else messages = out.slice(0, 3);

  // Sara sometimes disappears for a bit.
  if (req.characterId === "sara" && req.sessionTurn >= 3 && !req.usedLines.includes("__stepped_away") && rand() < 0.15 && bank.stepAway) {
    messages = [messages[0], lines(bank.stepAway)];
    used.add("__stepped_away");
    stepAway = true;
    helpKey = undefined;
  }

  // She wraps up: if the energy's gone, or after a good long chat.
  if (!stepAway && ((projectedInterest < 24 && req.sessionTurn >= 3) || (req.sessionTurn >= 16 && rand() < 0.2))) {
    messages = [...messages.slice(0, 1), ...pick(bank.wrapUp, used, rand)];
    wrapUp = true;
    helpKey = undefined;
  }

  const newMemories = extractMemories(text).filter((m) => !req.memories.includes(m));
  return finish(req, messages, d, newMemories, sig, wrapUp, stepAway, used, told, helpKey, flirtLanded);
}

function finish(
  req: ChatRequest,
  messages: string[],
  deltas: StateDeltas,
  newMemories: string[],
  sig: TurnSignals | undefined,
  wrapUp: boolean,
  stepAway: boolean,
  used: Set<string>,
  told: Set<string>,
  helpKey?: string,
  flirtLanded?: boolean,
): ChatResponse {
  const signals = [...req.recentSignals, ...(sig ? [sig] : [])];
  const projected: HiddenState = { ...req.state };
  for (const [k, v] of Object.entries(deltas)) projected[k as keyof HiddenState] += v ?? 0;
  return {
    messages,
    deltas,
    perception: localPerception(req.characterId, projected, signals, flirtLanded, req.perception),
    newMemories,
    signals: sig,
    wrapUp,
    stepAway,
    usedLines: [...used],
    toldBeats: [...told],
    helpKey,
    engine: "local",
  };
}

// ---- "What she thinks about you" -----------------------------------------------

export function localPerception(
  id: CharacterId,
  s: HiddenState,
  signals: TurnSignals[],
  flirtLanded: boolean | undefined,
  prev?: Perception,
): Perception {
  const n = signals.length;
  const count = (k: keyof TurnSignals) => signals.filter((x) => x[k]).length;
  const q = count("question");
  const disc = count("disclosure");
  const likes: string[] = [];
  const unsure: string[] = [];

  if (count("humour") >= 1) likes.push("Your sense of humour");
  if (count("followUp") >= 2) likes.push("You actually listen");
  else if (count("followUp") === 1 && q >= 1) likes.push("You seem genuinely curious");
  if (disc >= 2) likes.push("You share things about yourself");
  if (flirtLanded || (count("flirt") >= 1 && s.attraction > 58)) likes.push("A little flirty, in a good way");
  if (n >= 3 && !count("bragging") && !count("validationSeeking") && !count("tooForward")) likes.push("You're not trying too hard");

  if (count("tooForward")) unsure.push("You pushed things too far, too fast");
  if (count("rude")) unsure.push("That comment didn't sit well");
  if (count("bragging")) unsure.push("You seem keen to impress");
  if (count("validationSeeking")) unsure.push("You seem to need a lot of reassurance");
  if (q >= 3 && disc <= Math.floor(q / 3)) unsure.push("You haven't shared much about yourself");
  if (count("lowEffort") >= 2) unsure.push("Some replies feel a bit short");
  if (flirtLanded === false) unsure.push("The flirting felt a bit early");
  if (n >= 5 && !count("humour") && (id === "riya" || id === "sara")) unsure.push("She hasn't seen your playful side yet");
  if (id === "meera" && n >= 3 && !signals.some((x) => x.disclosure) ) unsure.push("Your answers play it safe");
  if (id === "ananya" && q >= 4 && s.comfort < 50) unsure.push("It's a lot of questions at once");

  const likePhrase: Record<string, string> = {
    "Your sense of humour": "You're funny",
    "You actually listen": "You actually listen",
    "You seem genuinely curious": "You seem genuinely curious",
    "You share things about yourself": "You're easy to get to know",
    "A little flirty, in a good way": "There's a bit of a spark",
    "You're not trying too hard": "You seem relaxed",
  };
  const unsurePhrase: Record<string, string> = {
    "You haven't shared much about yourself": "a little difficult to read",
    "Some replies feel a bit short": "a bit hard to get going",
    "You seem keen to impress": "you might be trying a bit hard",
    "You seem to need a lot of reassurance": "you seem a bit nervous",
    "The flirting felt a bit early": "that felt a little early",
    "She hasn't seen your playful side yet": "you're being quite serious",
    "Your answers play it safe": "you're playing it very safe",
    "It's a lot of questions at once": "it's a lot of questions",
    "You pushed things too far, too fast": "that crossed a line",
    "That comment didn't sit well": "that comment didn't land well",
  };

  let impression: string;
  if (n === 0) impression = prev?.impression ?? "First impressions are still forming.";
  else if (count("tooForward") || count("rude")) impression = `That wasn't great. ${unsure[0]}.`;
  else if (likes.length && unsure.length) impression = `${likePhrase[likes[0]]}, but ${unsurePhrase[unsure[0]] ?? unsure[0].toLowerCase()}.`;
  else if (likes.length >= 2) impression = `${likePhrase[likes[0]]}. ${likePhrase[likes[1]]}. This is going well.`;
  else if (likes.length) impression = `${likePhrase[likes[0]]}. She's warming up to you.`;
  else if (unsure.length) impression = `Still unsure — ${unsurePhrase[unsure[0]] ?? unsure[0].toLowerCase()}.`;
  else if (s.interest >= 58) impression = "Easy to talk to so far.";
  else impression = "Still figuring you out.";

  return {
    impression,
    likes: likes.slice(0, 3),
    unsure: unsure.slice(0, 2),
    vibe: vibeFromState(s),
  };
}
