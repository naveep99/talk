import { CHARACTERS } from "../../characters";
import type { CharacterId, HelpOption, HelpRequest, HelpResponse } from "../../types";
import { findQuestion, TOPIC_WORDS } from "./banks";
import { TOPIC_HELP, VOICE } from "./voice";

const FALLBACK: Record<CharacterId, HelpOption[]> = {
  riya: [
    { tone: "Curious", text: "Wait, go back — how did that even happen?" },
    { tone: "Share", text: "Okay, confession: something very similar happened to me once. It did not go well." },
    { tone: "Playful", text: "You're way too good at this. I'm keeping score now." },
  ],
  ananya: [
    { tone: "Curious", text: "What's that been like for you?" },
    { tone: "Share", text: "I know that feeling a bit. I've been thinking about something similar lately." },
    { tone: "Gentle", text: "I like how you put that." },
  ],
  meera: [
    { tone: "Bold", text: "Okay, I'm going to disagree with you on that. Respectfully. Mostly." },
    { tone: "Honest", text: "Honestly? That's more interesting than I expected. Tell me the part you're leaving out." },
    { tone: "Playful", text: "You say that like you've won the argument already." },
  ],
  sara: [
    { tone: "Playful", text: "Okay that's chaotic and I'm here for it." },
    { tone: "Share", text: "Okay my turn for a weird confession. Ready?" },
    { tone: "Flirty", text: "You're very distracting, you know that? 😏" },
  ],
};

export function localHelp(req: HelpRequest): HelpResponse {
  const voice = VOICE[req.characterId];
  const herMsgs = req.history.filter((m) => m.from === "her");

  // Nothing said yet: help him open.
  if (req.history.length === 0 || herMsgs.length === 0) {
    return { options: voice.openers, engine: "local" };
  }

  const authored = findQuestion(req.helpKey);
  if (authored) return { options: authored.help, engine: "local" };

  const lastHer = herMsgs.slice(-2).map((m) => m.text).join(" ");
  const topic = Object.entries(TOPIC_WORDS).find(([, re]) => re.test(lastHer))?.[0];
  const name = CHARACTERS[req.characterId].name;

  if (topic && TOPIC_HELP[topic]) {
    const t = TOPIC_HELP[topic];
    const options = [
      { tone: "Curious", text: t.curious },
      { tone: "Share", text: t.relate },
      { tone: "Playful", text: t.playful },
    ];
    return { options, engine: "local" };
  }

  // She asked something we don't have authored help for.
  if (/\?\s*$/.test(lastHer)) {
    return {
      options: [
        { tone: "Genuine", text: "Honestly? I've never been asked that. Give me a second — okay, I think my answer is…" },
        { tone: "Playful", text: "That's a dangerous question. I'll answer, but you're answering it next." },
        { tone: "Turn it around", text: `I have an answer, but I want to hear yours first, ${name}.` },
      ],
      engine: "local",
    };
  }
  return { options: FALLBACK[req.characterId], engine: "local" };
}
