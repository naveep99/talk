import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeMessage, extractMemories, countQuestions } from "../lib/analysis";
import { CHARACTERS, CHARACTER_ORDER } from "../lib/characters";
import { applyDeltas, startingState } from "../lib/dynamics";
import { localChat } from "../lib/engine/local/chat";
import { localHelp } from "../lib/engine/local/help";
import { localReport } from "../lib/engine/local/report";
import { localCoach } from "../lib/engine/local/coach";
import { allStatuses } from "../lib/life";
import { skillReads } from "../lib/journey";
import type { CharacterId, ChatRequest, HiddenState, Session, TurnSignals } from "../lib/types";

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function req(id: CharacterId, userText: string, over: Partial<ChatRequest> = {}): ChatRequest {
  return {
    characterId: id,
    event: "message",
    userText,
    history: [],
    state: { ...CHARACTERS[id].baseState },
    perception: { impression: "", likes: [], unsure: [], vibe: { emoji: "🙂", label: "" } },
    memories: [],
    usedLines: [],
    toldBeats: [],
    dayIndex: 0,
    hour: 20,
    sessionTurn: 0,
    sessionsCount: 0,
    userName: "",
    recentSignals: [],
    ...over,
  };
}

/** Play a scripted conversation through the local engine. */
function play(id: CharacterId, lines: string[], seed = 1) {
  const rand = seeded(seed);
  let state: HiddenState = { ...CHARACTERS[id].baseState };
  const history: { from: "user" | "her"; text: string }[] = [];
  let used: string[] = [];
  let told: string[] = [];
  const sigs: TurnSignals[] = [];
  const replies: string[] = [];
  const trail = [state.interest];
  let wrapped = false;
  lines.forEach((t, i) => {
    if (wrapped) return;
    const res = localChat(req(id, t, { history: [...history], state, usedLines: used, toldBeats: told, sessionTurn: i, recentSignals: sigs.slice(-6) }), rand);
    history.push({ from: "user", text: t });
    res.messages.forEach((m) => history.push({ from: "her", text: m }));
    replies.push(...res.messages);
    state = applyDeltas(state, res.deltas, rand);
    trail.push(state.interest);
    used = res.usedLines;
    told = res.toldBeats;
    if (res.signals) sigs.push(res.signals);
    wrapped = res.wrapUp;
  });
  return { replies, trail, state, wrapped, history };
}

const BATTERY = [
  "hey!",
  "haha I'm still recovering from that night honestly",
  "I love trekking, did Kudremukh last month and it nearly killed me",
  "what do you do for work?",
  "how long have you been doing that?",
  "do you like it?",
  "what are you up to this weekend?",
  "I'm an engineer. I mostly break things and then fix them 😅",
  "you're kind of cute when you're competitive",
  "want to grab momos sometime?",
  "ok",
  "tell me about yourself",
];

describe("analysis", () => {
  it("reads nervous self-doubt as validation-seeking, not rudeness", () => {
    const s = analyzeMessage("sorry am i boring you?");
    assert.equal(s.validationSeeking, true);
    assert.equal(s.rude, false);
  });
  it("flags crude messages", () => {
    assert.equal(analyzeMessage("hey sexy send pics").tooForward, true);
    assert.equal(analyzeMessage("want some hot chocolate?").tooForward, false);
  });
  it("counts questions", () => {
    assert.equal(countQuestions("what do you do? and where?"), 2);
    assert.equal(countQuestions("what do you do"), 1);
    assert.equal(countQuestions("I like dogs."), 0);
  });
  it("separates sharing from asking", () => {
    assert.equal(analyzeMessage("I once got lost in Lisbon for six hours on purpose").disclosure, true);
    assert.equal(analyzeMessage("what do I do? I don't know").disclosure, false);
  });
  it("extracts clean memories", () => {
    assert.deepEqual(extractMemories("I love trekking actually."), ["He loves trekking"]);
    assert.ok(extractMemories("I'm an engineer").includes("He's an engineer"));
    assert.ok(extractMemories("honestly I can't stand coffee").includes("He can't stand coffee"));
  });
});

describe("interest dynamics", () => {
  it("never swings more than a few points on one message", () => {
    const s = CHARACTERS.riya.baseState;
    const up = applyDeltas(s, { interest: 40 }, () => 0.5);
    const down = applyDeltas(s, { interest: -40 }, () => 0.5);
    assert.ok(up.interest - s.interest <= 9);
    assert.ok(s.interest - down.interest <= 16);
  });
  it("gets harder to gain near the top", () => {
    const low = applyDeltas({ ...CHARACTERS.riya.baseState, interest: 40 }, { interest: 8 }, () => 0.5).interest - 40;
    const high = applyDeltas({ ...CHARACTERS.riya.baseState, interest: 88 }, { interest: 8 }, () => 0.5).interest - 88;
    assert.ok(high < low);
  });
  it("carries part of the last conversation into the next", () => {
    const base = CHARACTERS.meera.baseState;
    const next = startingState(base, { ...base, interest: 80 }, 1);
    assert.ok(next.interest > base.interest && next.interest < 80);
    assert.equal(startingState(base, { ...base, interest: 80 }, 0).interest, base.interest);
  });
});

describe("the women stay in character", () => {
  const FOURTH_WALL = /\b(score|interest level|as an ai|language model|practice session|this is a (test|simulation)|your coach|you should ask|points?\b(?! to you)|percent|%)/i;
  for (const id of CHARACTER_ORDER) {
    it(`${id} never breaks the fourth wall or coaches him`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const { replies } = play(id, BATTERY, seed);
        for (const r of replies) assert.doesNotMatch(r, FOURTH_WALL, `${id}: "${r}"`);
        assert.ok(replies.every((r) => r.trim().length > 0));
      }
    });
  }

  it("doesn't repeat herself within a conversation", () => {
    for (const id of CHARACTER_ORDER) {
      const { replies } = play(id, BATTERY, 7);
      const counts = new Map<string, number>();
      for (const r of replies) counts.set(r, (counts.get(r) ?? 0) + 1);
      const repeats = [...counts.entries()].filter(([t, n]) => n > 1 && t.length > 12);
      assert.deepEqual(repeats, [], `${id} repeated: ${JSON.stringify(repeats)}`);
    }
  });
});

describe("behaviour moves her", () => {
  it("rewards sharing and humour more than an interview", () => {
    const good = play("riya", ["hey!", "haha honestly I'm still recovering, you were ruthless at Codenames", "I did a solo trip to Hampi once, got lost for hours and found the best dosa of my life", "what about you, ever travelled alone?"], 3);
    const interview = play("riya", ["hey!", "what do you do?", "where do you live?", "do you have siblings?", "what's your favourite food?"], 3);
    assert.ok(good.state.interest > interview.state.interest, `${good.state.interest} vs ${interview.state.interest}`);
  });
  it("Ananya pulls back from rapid-fire questions", () => {
    const { trail, replies } = play("ananya", ["hi", "what do you do?", "where do you work?", "how long have you been there?", "do you like it?"], 5);
    assert.ok(trail[trail.length - 1] < trail[2]);
    assert.ok(replies.some((r) => /questions|doing all the talking/i.test(r)));
  });
  it("sets a boundary on crude messages and drops sharply", () => {
    const r = localChat(req("riya", "you're so sexy, send pics", { sessionTurn: 3, history: [{ from: "her", text: "haha okay" }] }), seeded(2));
    assert.ok((r.deltas.interest ?? 0) <= -8);
    assert.ok(r.perception.unsure.some((u) => /too far/i.test(u)));
  });
  it("ends the conversation after repeated crude messages", () => {
    const { wrapped } = play("meera", ["hey", "you're hot", "send nudes"], 4);
    assert.equal(wrapped, true);
  });
  it("reacts to him answering her question", () => {
    const history = [{ from: "her" as const, text: "would you rather have amazing chemistry with someone or never argue with them" }];
    const r = localChat(req("sara", "chemistry, obviously. arguing is just flirting with extra steps", { history, sessionTurn: 2 }), seeded(9));
    assert.ok((r.deltas.interest ?? 0) > 0);
    assert.ok(r.messages.some((m) => /correct answer|respect that|you pass/i.test(m)), r.messages.join(" | "));
  });
  it("says no to an early date without being cruel", () => {
    const r = localChat(req("ananya", "want to grab coffee this week?", { sessionTurn: 1, history: [{ from: "her", text: "Hi 🙂" }] }), seeded(1));
    assert.doesNotMatch(r.messages.join(" "), /\b(yes|sure)\b.*\?$/i);
    assert.doesNotMatch(r.messages.join(" "), /(loser|ugly|pathetic|creep)/i);
  });
});

describe("help", () => {
  it("offers openers before anything is said", () => {
    const h = localHelp({ characterId: "riya", history: [], state: CHARACTERS.riya.baseState, memories: [] });
    assert.ok(h.options.length >= 2 && h.options.length <= 4);
  });
  it("uses question-specific suggestions", () => {
    const h = localHelp({ characterId: "riya", history: [{ from: "her", text: "what's the most spontaneous thing you've ever done?" }], state: CHARACTERS.riya.baseState, memories: [], helpKey: "riya-spontaneous" });
    assert.equal(h.options[0].tone, "Playful");
    assert.match(h.options.map((o) => o.text).join(" "), /earned that story/);
  });
});

describe("report", () => {
  it("grounds the improvement in real counts", () => {
    const history = [
      { from: "user" as const, text: "hey" },
      { from: "her" as const, text: "hi!" },
      { from: "user" as const, text: "what do you do?" },
      { from: "her" as const, text: "designer" },
      { from: "user" as const, text: "where do you live?" },
      { from: "her" as const, text: "Indiranagar" },
      { from: "user" as const, text: "do you like it?" },
      { from: "her" as const, text: "yeah" },
      { from: "user" as const, text: "what else do you do?" },
    ];
    const r = localReport({
      characterId: "riya",
      history,
      stats: { userMessages: 5, questions: 4, disclosures: 0, humour: 0, followUps: 0, flirts: 0, helpOpened: 0, helpUsed: 0, tooForward: 0 },
      startInterest: 50,
      endInterest: 47,
      durationMs: 300000,
      perception: { impression: "", likes: [], unsure: ["You haven't shared much about yourself"], vibe: { emoji: "😐", label: "" } },
      profile: { experience: "never", struggles: [], goals: [] },
    }).report;
    assert.match(r.improve, /asked 4 questions but only volunteered 0 things/);
    for (const v of Object.values(r.skills)) assert.ok(v >= 0 && v <= 100);
    assert.doesNotMatch(r.herTake, /score|interest/i);
  });
});

describe("coach", () => {
  it("answers common questions without shaming", () => {
    const profile = { name: "A", experience: "never" as const, struggles: ["starting"], goals: [], onboardedAt: 0 };
    for (const q of ["Why do I freeze when I approach someone?", "She hasn't replied in 6 hours. Should I text again?", "I don't know how to flirt.", "How am I doing?"]) {
      const r = localCoach({ profile, sessions: [], history: [], message: q });
      assert.ok(r.text.length > 80);
      assert.doesNotMatch(r.text, /(something wrong with you|pathetic|loser|you'?re broken)/i);
    }
  });
});

describe("availability", () => {
  it("always leaves someone reachable", () => {
    for (let day = 0; day < 7; day++) {
      for (let h = 0; h < 24; h++) {
        const d = new Date(2026, 8, 20 + day, h, 30);
        const st = allStatuses(d);
        assert.ok(Object.values(st).some((s) => s.status !== "offline"), `nobody at day ${day} ${h}:30`);
      }
    }
  });
});

describe("journey", () => {
  it("shows trends only once there's history to compare", () => {
    const mk = (v: number): Session => ({
      id: String(v), characterId: "riya", startedAt: 0, endedAt: 1, startInterest: 50, endInterest: 60, trail: [], signals: [],
      stats: { userMessages: 1, questions: 0, disclosures: 0, humour: 0, followUps: 0, flirts: 0, helpOpened: 0, helpUsed: 0, tooForward: 0 },
      report: { herTake: "", worked: [], improve: "", nextPractice: "", pattern: "", coachNote: "", skills: { conversation: v, confidence: v, listening: v, selfExpression: v, flirting: v, awkwardness: v } },
    });
    assert.equal(skillReads([mk(50)])[0].trend, "new");
    assert.equal(skillReads([mk(40), mk(42), mk(60), mk(64)])[0].trend, "up");
    assert.equal(skillReads([mk(70), mk(70), mk(50), mk(52)])[0].trend, "down");
  });
});
