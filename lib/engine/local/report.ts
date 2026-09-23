import { analyzeMessage, countQuestions } from "../../analysis";
import { CHARACTERS } from "../../characters";
import type { ReportRequest, ReportResponse, SkillScores } from "../../types";

const clamp = (v: number) => Math.max(12, Math.min(95, Math.round(v)));

export function localReport(req: ReportRequest): ReportResponse {
  const c = CHARACTERS[req.characterId];
  const her = c.name;

  // Re-read the transcript so the numbers are grounded in what was said.
  let q = 0, disc = 0, humour = 0, follow = 0, flirt = 0, low = 0, brag = 0, valid = 0, forward = 0, askOut = 0, user = 0;
  let herLast: string | undefined;
  for (const m of req.history) {
    if (m.from === "her") { herLast = m.text; continue; }
    const s = analyzeMessage(m.text, herLast);
    user++;
    q += countQuestions(m.text);
    if (s.disclosure) disc++;
    if (s.humour) humour++;
    if (s.followUp) follow++;
    if (s.flirt) flirt++;
    if (s.lowEffort) low++;
    if (s.bragging) brag++;
    if (s.validationSeeking) valid++;
    if (s.tooForward) forward++;
    if (s.askOut) askOut++;
  }
  const helpUsed = req.stats.helpUsed;
  const change = req.endInterest - req.startInterest;
  const teased = req.history.some((m) => m.from === "her" && /(😏|🙄|safe answer|really\?|don't believe|nice try|slow down|riveting|that's it\?|LinkedIn|census|interview|questionnaire)/i.test(m.text));

  // ---- What worked -------------------------------------------------------------
  const worked: string[] = [];
  if (follow >= 2) worked.push("You followed up on things she said.");
  if (humour >= 1) worked.push("You made the conversation more playful.");
  if (disc >= 2) worked.push("You shared things about yourself, not just questions.");
  if (teased && valid === 0) worked.push("You didn't panic when she teased you.");
  if (askOut && req.endInterest >= 60) worked.push("You asked her out directly — that takes nerve.");
  if (user >= 8 && low <= 1) worked.push("You kept the conversation going.");
  if (helpUsed === 0 && user >= 3) worked.push("You found your own words — no Help needed.");
  if (worked.length === 0) worked.push(user > 0 ? "You showed up and started the conversation. That's the hardest part." : "You opened the chat. Next time, say hi — that's the hardest part.");

  // ---- The one thing to improve ------------------------------------------
  let improve: string;
  let next: string;
  let pattern: string;
  let focus: string;
  if (forward) {
    improve = "Things got too forward, too fast. That ended the good momentum you'd built.";
    next = "Next time, let the flirting build slowly. A playful tease lands better than a direct comment early on.";
    pattern = "When a conversation feels good, you tend to jump ahead. Let it breathe a little.";
    focus = "reading the pace of a conversation";
  } else if (q >= 4 && disc * 2 < q) {
    improve = `You asked ${q} questions but only volunteered ${disc} thing${disc === 1 ? "" : "s"} about yourself.`;
    next = "Next time, try telling a short story instead of asking another question.";
    pattern = "You tend to ask questions when you're nervous. Try sharing your own experience before asking the next one.";
    focus = "self-expression — sharing more of yourself";
  } else if (valid >= 1) {
    improve = "A few times you checked whether she was still into it. It reads as nervous, even when she's enjoying it.";
    next = "Next time, when you feel the urge to ask 'am I boring?', share something about your day instead.";
    pattern = "You look for reassurance when there's a pause. Pauses are normal — people are just busy.";
    focus = "confidence in the quiet moments";
  } else if (brag >= 1) {
    improve = "Some of it came across as trying to impress her rather than getting to know her.";
    next = "Next time, swap one achievement for one story where something went wrong.";
    pattern = "You lead with achievements. The funny, imperfect stuff is usually more attractive.";
    focus = "being relaxed instead of impressive";
  } else if (low >= 2) {
    improve = "A few of your replies were very short, so she had to carry the conversation.";
    next = "Next time, add one detail or one opinion to every short reply.";
    pattern = "Short replies leave her doing the work. One extra sentence makes a big difference.";
    focus = "keeping conversations going";
  } else if (user < 4) {
    improve = "The conversation ended before it had a chance to build.";
    next = `Next time, stay for at least 6–8 messages. ${her} needs a little time to warm up.`;
    pattern = "You're getting started — the next step is staying in the conversation a little longer.";
    focus = "keeping conversations going";
  } else if (humour === 0) {
    improve = "It was pleasant, but a little serious. She didn't get to see your playful side.";
    next = "Next time, try one light tease or a funny detail from your week.";
    pattern = "You're solid at being genuine. Now add some play — it's what turns a nice chat into a fun one.";
    focus = "playful banter";
  } else if (flirt === 0 && req.endInterest >= 60) {
    improve = "The connection was there, but you kept it strictly friendly.";
    next = "Next time, try one light, playful compliment about something she said — not how she looks.";
    pattern = "You're good at connection. Flirting is the next edge — small and playful is enough.";
    focus = "flirting without overthinking it";
  } else {
    improve = "Not much to fix — just keep your momentum going for longer.";
    next = "Next time, try asking her out when the energy is high.";
    pattern = "You're finding your rhythm. The next step is being a bit bolder when it's going well.";
    focus = "asking someone out";
  }
  if (helpUsed >= 3) {
    next = `You used Help ${helpUsed} times. Next time, try your own answer first — even an imperfect one.`;
  }

  // ---- What she thought (her voice) ----------------------------------------
  const LIKED: Record<string, string> = {
    "Your sense of humour": "your humour",
    "You actually listen": "that you actually listened",
    "You seem genuinely curious": "that you seemed genuinely curious",
    "You share things about yourself": "hearing about your life",
    "A little flirty, in a good way": "the little bit of flirting",
    "You're not trying too hard": "that you weren't trying too hard",
  };
  const UNSURE: Record<string, string> = {
    "You haven't shared much about yourself": "I don't know much about you yet",
    "Some replies feel a bit short": "some of your replies were really short",
    "You seem keen to impress": "it felt like you were trying to impress me",
    "You seem to need a lot of reassurance": "you kept checking if I was still into it",
    "The flirting felt a bit early": "the flirting came a bit early",
    "She hasn't seen your playful side yet": "I haven't seen your fun side yet",
    "Your answers play it safe": "your answers were very safe",
    "It's a lot of questions at once": "it was a lot of questions",
    "You pushed things too far, too fast": "you went too far",
    "That comment didn't sit well": "that comment really didn't sit well",
  };
  const liked = LIKED[req.perception.likes[0]] ?? (humour ? "your humour" : disc ? "hearing about you" : "that you reached out");
  const wasntSure = UNSURE[req.perception.unsure[0]];
  const opening =
    forward ? "That started nicely, but you lost me at the end."
    : change >= 15 ? "You got more comfortable as the conversation went on."
    : change >= 6 ? "That was nice. I enjoyed talking to you."
    : change >= -3 ? "I'm still figuring you out, honestly."
    : "It didn't really click this time.";
  const voiceTail: Record<string, string> = {
    riya: " Talk soon? 😄",
    ananya: " I'd talk again.",
    meera: " Not bad. Don't get cocky.",
    sara: " anyway. you're interesting. slightly.",
  };
  let herTake = `${opening} I liked ${liked}`;
  herTake += wasntSure ? `, but ${wasntSure}.` : ".";
  if (change >= 6 && !forward) herTake += voiceTail[req.characterId];

  const strength =
    follow >= 2 ? "You're good at following up on what she says."
    : humour >= 1 ? "You're getting comfortable being playful."
    : disc >= 2 ? "You're getting better at sharing about yourself."
    : user >= 6 ? "You've practiced keeping conversations going."
    : `You've started practicing with ${her}.`;

  // ---- Skills for this conversation ---------------------------------------------
  const skills: SkillScores = {
    conversation: clamp(38 + Math.min(28, user * 3) + follow * 3 - low * 5),
    confidence: clamp(48 + humour * 4 + Math.min(2, flirt) * 3 + askOut * 8 - valid * 9 - brag * 5 - Math.max(0, helpUsed - 1) * 4),
    listening: clamp(40 + follow * 8 + Math.min(10, q * 2)),
    selfExpression: clamp(34 + disc * 9 - Math.max(0, q - disc * 2) * 3),
    flirting: clamp(36 + Math.min(3, flirt) * 9 + (req.endInterest > 65 ? 6 : 0) - forward * 18),
    awkwardness: clamp(50 + change * 0.6 + (teased && valid === 0 ? 8 : 0) - valid * 6),
  };

  return {
    report: {
      herTake,
      worked: worked.slice(0, 3),
      improve,
      nextPractice: next,
      skills,
      pattern,
      coachNote: `${strength} Next, let's work on ${focus}.`,
    },
    engine: "local",
  };
}
