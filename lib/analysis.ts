import type { SessionStats, TurnSignals } from "./types";

// Lightweight heuristics for reading a user's message. Used by the local
// engine for everything, and by the client for session stats in both modes
// (so "you asked 8 questions" is always a real count).

const Q_WORDS = /^(what|why|how|when|where|who|which|do|does|did|are|is|was|were|have|has|would|could|can|will|should|any|tell me)\b/i;
const FIRST_PERSON = /\b(i|i'm|im|i've|ive|i'd|i'll|my|me|mine|myself)\b/i;
const HUMOUR = /(haha|hehe|lol|lmao|rofl|😂|🤣|😅|😆|😜|😛|🙃|jk\b|kidding|joking|\bplot twist\b|honestly though|allegedly|in my defen[cs]e)/i;
const FLIRT = /(😏|😉|😘|😍|🥰|\bcute\b|\bpretty\b|\bbeautiful\b|\bgorgeous\b|\bstunning\b|\bcharming\b|\bdate\b|\bdinner\b|\bdrinks?\b|\bmiss(ed)? you\b|\bthinking about you\b|\bearned\b|\bimpress(ed)? me\b|trouble\b|\bdangerous\b)/i;
const TOO_FORWARD = /(\bsexy\b|\bhot\b(?! chocolate| coffee| weather| day| sauce)|\bnudes?\b|\bboobs?\b|\bass\b|\bsex\b|\bbed\b(?!room)|\bkiss(ing)? you\b|\bnaked\b|\bbody\b|\bhook ?up\b|\bspend the night\b|\bmy place\b|\bsend (a )?pic|\bwhat are you wearing\b|\bturn(s|ed)? me on\b|\bhorny\b)/i;
const BRAG = /(\bi earn\b|\bmy salary\b|\bmy (bmw|merc|audi|porsche|car)\b|\bi'?m (rich|loaded|the best|a catch|a great catch)\b|\bgirls (always|love me)\b|\bwomen (always|love me)\b|\bi bench\b|\bsix[- ]?pack\b|\bi'?m kind of a big deal\b|\bnot to brag\b|\bi'?m (very|really) (successful|good looking|handsome))/i;
const VALIDATION = /(\bdo you (even )?like me\b|\bam i boring\b|\bam i annoying\b|\bplease reply\b|\bwhy (aren'?t|arent) you replying\b|\byou probably (don'?t|dont|think)\b|\bsorry\b.*\bsorry\b|\bi'?m (so )?(boring|awkward|bad at this)\b|\bare you (mad|angry|upset) (at|with) me\b|\bdid i say something wrong\b|\bhope (that'?s|thats) ok\b|\bno one (ever )?likes me\b)/i;
const RUDE = /(\bshut up\b|\bstupid\b|\bdumb\b|\bidiot\b|\bbitch\b|\bwhore\b|\bslut\b|\bf+u+c+k+ (you|off)\b|\bugly\b|\bfat\b|\byou'?re (so )?boring\b|\bwhatever\b|\bwho cares\b|\bmake me a sandwich\b|\bfemales\b)/i;
const ASK_OUT = /(\b(grab|get) (a )?(coffee|drink|drinks|dinner|lunch|food|momos|beer)\b|\bmeet (up|sometime|this|next)\b|\bgo out\b|\bhang out\b|\bwould you (like|want) to\b.*\b(meet|go|come|grab|get)\b|\bare you free\b|\blet'?s (meet|go|get|grab)\b|\bsee you (this|next|on|sometime)\b|\btake you (out|to)\b)/i;
const GREETING = /^(hi+|hey+|hello+|heyy+|yo|hola|namaste|good (morning|evening|afternoon))\b/i;

const STOP = new Set(
  "the a an and or but so to of in on at for with you your i me my is it that this was are be have has do did just really very what how why when where who not no yes its it's i'm im about like get got can would could should will from they them there then than too also more some any one out up actually honestly really think wondering something okay pretty maybe still thing things being going doing people today yeah sure kind sort guess know mean feel much well good great nice cool haha right even ever".split(
    " ",
  ),
);

export function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

export function countQuestions(text: string): number {
  const marks = (text.match(/\?/g) || []).length;
  if (marks > 0) return marks;
  return Q_WORDS.test(text.trim()) ? 1 : 0;
}

export function isGreeting(text: string): boolean {
  return GREETING.test(text.trim()) && text.trim().split(/\s+/).length <= 5;
}

export function analyzeMessage(text: string, herLast?: string): TurnSignals {
  const t = text.trim();
  const words = t.split(/\s+/).filter(Boolean);
  const questions = countQuestions(t);
  const firstPerson = FIRST_PERSON.test(t);
  // A "disclosure" is when he actually offers something about himself —
  // not just "i'm good" or a question that happens to contain "I".
  const nonQuestionPart = t.replace(/[^.!?]*\?/g, " ").trim();
  const disclosure =
    firstPerson &&
    nonQuestionPart.split(/\s+/).filter(Boolean).length >= 5 &&
    !/^(i'?m (good|fine|ok|okay|great|alright)[.!]?)$/i.test(nonQuestionPart);

  let followUp = false;
  if (herLast) {
    const hers = new Set(keywords(herLast));
    followUp = keywords(t).some((w) => hers.has(w)) || /\b(that sounds|that's (so|really)|wait,? (you|what)|no way|how did (it|that)|what happened|tell me more|why\b.*\?)/i.test(t);
  }
  const lowEffort =
    words.length <= 2 && !GREETING.test(t) && !/\?/.test(t) ? true : /^(ok|okay|k|hmm+|cool|nice|lol|haha|yeah|yes|no|sure|nothing|idk)[.!]*$/i.test(t);

  return {
    question: questions > 0,
    disclosure,
    humour: HUMOUR.test(t),
    flirt: FLIRT.test(t),
    followUp,
    lowEffort,
    tooForward: TOO_FORWARD.test(t),
    bragging: BRAG.test(t),
    validationSeeking: VALIDATION.test(t),
    rude: RUDE.test(t),
    askOut: ASK_OUT.test(t),
  };
}

export function emptyStats(): SessionStats {
  return {
    userMessages: 0,
    questions: 0,
    disclosures: 0,
    humour: 0,
    followUps: 0,
    flirts: 0,
    helpOpened: 0,
    helpUsed: 0,
    tooForward: 0,
  };
}

export function accumulateStats(stats: SessionStats, text: string, s: TurnSignals): SessionStats {
  return {
    ...stats,
    userMessages: stats.userMessages + 1,
    questions: stats.questions + countQuestions(text),
    disclosures: stats.disclosures + (s.disclosure ? 1 : 0),
    humour: stats.humour + (s.humour ? 1 : 0),
    followUps: stats.followUps + (s.followUp ? 1 : 0),
    flirts: stats.flirts + (s.flirt ? 1 : 0),
    tooForward: stats.tooForward + (s.tooForward ? 1 : 0),
  };
}

/** Facts about the user worth remembering, pulled from what he said. */
export function extractMemories(text: string): string[] {
  const out: string[] = [];
  const t = text.replace(/\s+/g, " ").trim();
  const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\bi (?:really |absolutely |kind of |kinda )?(love|like|enjoy|hate|can'?t stand) ([a-z][a-z\s'-]{2,40}?)(?:[.,!?]|\band\b|\bbut\b|$)/i, (m) => {
      const v = m[1].toLowerCase();
      const verb = v.startsWith("can") ? "can't stand" : `${v}s`;
      return `He ${verb} ${m[2].trim()}`;
    }],
    [/\bi work (?:as|at|in) (?:an? )?([a-z0-9][a-z0-9\s&'-]{2,40}?)(?:[.,!?]|\band\b|$)/i, (m) => `He works ${/\bat\b/i.test(m[0]) ? "at" : "as/in"} ${m[1].trim()}`],
    [/\bi'?m (?:an? )(engineer|developer|designer|doctor|teacher|student|consultant|analyst|lawyer|writer|founder|chef|manager|photographer|musician|artist|nurse|accountant|marketer|researcher)\b/i, (m) => `He's a ${m[1].toLowerCase()}`],
    [/\bi'?m from ([a-z][a-z\s]{2,30}?)(?:[.,!?]|\band\b|$)/i, (m) => `He's from ${m[1].trim()}`],
    [/\bi live in ([a-z][a-z\s]{2,30}?)(?:[.,!?]|\band\b|$)/i, (m) => `He lives in ${m[1].trim()}`],
    [/\bmy (dog|cat|sister|brother|mom|mum|dad|best friend|roommate|flatmate)(?: is| named| called)? ?([A-Z][a-z]+)?/i, (m) => `He mentioned his ${m[1].toLowerCase()}${m[2] ? ` (${m[2]})` : ""}`],
    [/\bi (?:play|played) (?:the )?([a-z][a-z\s]{2,25}?)(?:[.,!?]|\band\b|$)/i, (m) => `He plays ${m[1].trim()}`],
    [/\bi(?:'ve| have)? (?:been|went) (?:to )?([A-Z][a-z]+(?: [A-Z][a-z]+)?)/, (m) => `He's been to ${m[1]}`],
    [/\bi(?:'m| am) (?:into|obsessed with) ([a-z][a-z\s'-]{2,40}?)(?:[.,!?]|$)/i, (m) => `He's into ${m[1].trim()}`],
  ];
  for (const [re, fmt] of patterns) {
    const m = t.match(re);
    if (m) {
      const fact = fmt(m)
        .replace(/\s+(actually|too|a lot|so much|honestly|really|lol|haha)$/i, "")
        .replace(/\ba ([aeiou])/i, "an $1")
        .replace(/\s+/g, " ");
      if (fact.length < 90) out.push(fact);
    }
  }
  return out;
}
