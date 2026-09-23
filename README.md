# Talk — practice, privately

A V1 prototype of a consumer app that helps men get more comfortable talking to women. It's **not** an AI girlfriend app. It's somewhere private to practise conversations, see how you're coming across, get unstuck, and build real-world confidence.

> "I can talk to someone, see how I'm coming across, get unstuck when I need help, and understand how I can get better."

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # engine, dynamics, availability & journey tests
```

**AI engine.** Set `ANTHROPIC_API_KEY` (see `.env.example`) and the women, Help, debriefs and coach all run on Claude (`claude-opus-5` by default; override it with `CLAUDE_MODEL`). Without a key, the app runs on a hand-written **local simulation engine**, so it works out of the box. If a Claude call fails, that call falls back to the local engine automatically, so the conversation never dead-ends. **Journey → Prototype controls** shows which engine is active. It also lets you skip a day ahead (their lives move on), load a sample journey, or reset.

---

## The product in one picture

| Layer | Principle | Where |
| --- | --- | --- |
| **The women** (Riya, Ananya, Meera, Sara) | The simulation. They feel alive and independent. | `/chat/[id]` |
| **The coach** | The intelligence. It understands you over time. | `/coach` |
| **The dashboard** | The mirror. It shows you what happened. | `/journey`, `/report/[sid]` |
| **Help** | A safety net. It helps without taking over. | 💡 in every conversation |

## User journey

1. **Onboarding** (`/welcome`). The coach asks your name, dating experience, what's hard, and what you want to get better at. It's four taps and doesn't feel like a questionnaire. It ends with: *"Got it. We'll use your conversations to figure out what actually helps you."*
2. **Home: "Who do you want to talk to?"** Four distinct cards show each woman's aura avatar, age, job, live status (🟢/🟡/⚪), what she's doing right now, her traits, a one-line hint, and difficulty. After you've talked, the difficulty is replaced by your last connection score.
3. **Conversation.** The first time, a "How you met" card sets the scene and you make the first move. On later visits she may text first with news from her life. The ❤️ interest chip sits under her name; tap it for **What she thinks about you**. 💡 Help is visually secondary to writing your own reply.
4. **Debrief** (`/report/[sid]`). Shows the connection score (start → end, with a sparkline), *what she thought* in her own voice, what worked, **one** thing to improve, and a next practice. Then: *Talk to her again* / *Meet someone else* / *Talk it through with your coach*.
5. **Journey** (`/journey`). Shows your current focus, 5 skill dimensions as trends (↑ Improving / → Stable / ↓ Needs work), recent conversations, the pattern noticed, and the coach's recommendation.
6. **Coach.** A persistent chat that knows your profile and every debrief.

Navigation is a three-tab bar (**Talk · Journey · Coach**). It's hidden during conversations and debriefs, so the woman fills the screen.

## The four women

Every character is defined in `lib/characters.ts`: personality, what she likes and dislikes in people, interests, the people in her life, relationship history, texting style, sample lines, baseline hidden state, weekly schedule, and a timeline of life events ("beats").

| | Archetype | What she teaches |
| --- | --- | --- |
| **Riya**, 25, product designer | Warm · playful · Easy | Curiosity without interviewing, stories, laughing at yourself |
| **Ananya**, 27, architect | Quiet · thoughtful · Medium | Patience, listening, sharing first, tolerating quiet. Rapid-fire questions make her pull back. |
| **Meera**, 26, founder | Confident · direct · Hard | Opinions, banter, security. She calls out safe answers and flexing. |
| **Sara**, 24, photographer | Chaotic · flirty · Expert | Spontaneity, playing along, handling curveballs. She changes topic and steps away mid-chat. |

**They have lives.** Each woman has a schedule, so she's online, away (replies are slower and a banner says so), or offline (you can read the history but can't message; it tells you when she's usually back). The rules guarantee someone is always reachable. Her beats advance by day: *"I'm in charge of Tanvi's birthday playlist"* today becomes *"that birthday ended up being insane 😂"* a few days later. She tracks which beats she has already told you, so she doesn't repeat herself.

**No manipulation.** She never guilt-trips, never "was waiting for you", never invents emergencies, and there are no notifications. The prompts and local lines are written to that rule.

## Core mechanics

### Hidden state → behaviour
Each woman carries `interest, comfort, curiosity, attraction, trust, playfulness` (`HiddenState`). Only interest is ever shown, as a number with no maths attached. The state drives her behaviour:
- low interest → short replies, no questions, she may wrap up
- high comfort → she shares more
- high trust → the occasional vulnerable moment
- high attraction → she flirts back or flirts first

In Claude mode the numbers are translated into behavioural guidance for the prompt (`lib/engine/llm/chat.ts → behaviour()`), so she *acts* on them rather than reports them.

### Believable movement (`lib/dynamics.ts`)
Engines propose deltas; `applyDeltas` makes them feel human:
- one message moves her at most about **+9 / −14**
- gains shrink near the top
- there's a little noise, so the meter never reads like arithmetic
- a new conversation starts partway between her baseline and where the last one ended (trust and comfort stick better)

When the number moves, the chip glows briefly up or down. It never shows a "+3".

### What moves her
Reciprocity, curiosity, following up on what she said, remembering earlier details, humour, stories, real opinions, well-timed light flirting, and answering *her* questions all raise her interest. It drops for interview strings (3+ questions with no sharing), low-effort replies, bragging, validation-seeking ("am I boring you?"), flirting before there's rapport, and crude or rude messages. Crude or rude messages get a firm boundary, and repeated ones end the conversation. All of this is weighted per character: Meera punishes safe answers, Ananya punishes pushiness, Sara punishes boring.

### "What she thinks about you"
Tapping the chip shows her current impression (*"You're funny, but a little difficult to read."*), what she likes, what she's unsure about, and the current vibe. A footnote says it's a simulated practice signal, not a prediction of what any real person would think.

### Help (`/api/help`)
Help gives 2–4 directions with tone labels (Playful / Genuine / Flirty / Curious…). Tapping one fills the composer; it doesn't send. You can use it, edit it, or ignore it. With no conversation yet, it suggests openers. **It nudges you to think for yourself:** after two replies in a row sent verbatim from Help (or heavy reliance overall), it first says *"You've got this. Try your own answer first."* with a quieter *Show ideas anyway*. Debriefs call out heavy Help use.

### Memory
Facts you reveal ("He loves trekking", "He can't stand coffee") are stored per woman and passed back on every turn. She uses them naturally, e.g. *"hold on, you told me you love trekking. how's that going?"*. The Claude prompt also forbids contradicting them.

### In character, always
The women never mention scores, practice, coaches or AI, and never teach you how to talk to them. The tests enforce this for the local engine across 100 randomised conversations.

### Debrief (`/api/report`)
The numbers come from the transcript, e.g. *"You asked 8 questions but only volunteered 3 things about yourself."* The debrief also rates six skills for this conversation (conversation, confidence, listening, self-expression, flirting, handling awkwardness) and gives a pattern and a coach note.

### Dashboard calculations (`lib/journey.ts`)
- **Trend:** the mean of your last 2 debriefs vs the 2 before (±4 counts as a change). With one conversation you get a "first read" level (Emerging / Developing / Solid / Strong) instead of a fake trend.
- **Current focus:** starts from your onboarding answers, then switches to your weakest dimension once you have ≥2 debriefs.

## Architecture

```
app/
  welcome/        onboarding
  page.tsx        home: who do you want to talk to?
  chat/[id]/      the conversation (typing, double-texting, Seen, step-away, wrap-up)
  report/[sid]/   post-conversation debrief
  journey/        dashboard
  coach/          coach chat
  api/{chat,help,report,coach,status}   stateless engine endpoints
lib/
  characters.ts   the four women
  life.ts         schedules, availability, life beats
  analysis.ts     message signals, stats, memory extraction
  dynamics.ts     state movement & vibe
  store.ts        zustand store, persisted to localStorage (the client is the source of truth)
  engine/
    index.ts      Claude-or-local routing with per-call fallback
    llm/          prompts + structured outputs (zod) for each endpoint
    local/        hand-written engine: voice banks, chat, help, report, coach
tests/            node:test suite
```

- **State:** everything lives in the browser (`talk-v1` in localStorage), so there's no account and no backend DB in V1. API routes are pure functions of the state the client sends.
- **Conversation state:** each character has one continuous message thread, segmented into sessions. A session records start/end interest, the interest trail, stats, per-message signals and the debrief. A session idle for 45 minutes is closed and debriefed automatically.
- **Claude calls:** one structured call per message returns a private read of your message, state deltas, her perception, new memories, the beats she mentioned, 1–3 message bubbles, and wrap-up/step-away flags. Each call checks `stop_reason` for refusals and opts into server-side fallbacks. Chat runs at low effort for latency; debriefs and the coach run at medium.

## Deliberately not in V1
Payments, social features, matchmaking, voice/video, leaderboards, XP, achievements, or more characters. The one question V1 has to answer: **do people enjoy practising repeatedly with different women, and does the feedback make them want to come back and improve?**
