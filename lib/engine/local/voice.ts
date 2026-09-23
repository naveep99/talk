import type { CharacterId, HelpOption } from "../../types";

// Extra per-character voice used by the local engine: how she talks about
// what's going on in her life, her small follow-up questions, the moment she
// opens up, and ways for him to start the conversation.

const g = (tone: string, text: string): HelpOption => ({ tone, text });

export interface Voice {
  beatLines: Record<string, string[]>;
  pastBeatLines: Record<string, string>;
  followUpQs: string[];
  yourTurn: string[];
  deepShare: string[];
  openers: HelpOption[];
  safeCallout?: string[];
}

export const VOICE: Record<CharacterId, Voice> = {
  riya: {
    beatLines: {
      "riya-birthday": ["okay so Tanvi's birthday is this weekend and I've been put in charge of the playlist. the pressure is immense", "honestly just stressing about a birthday playlist. and a work launch. mostly the playlist"],
      "riya-pottery": ["I went to pottery to make a bowl and made an ashtray. by accident. my teacher said 'try a smaller bowl' 🙃", "recovering emotionally from pottery class"],
      "riya-pondi": ["I'm thinking of going to Pondi alone this weekend. I've never travelled solo and I'm kind of scared lol", "planning something impulsive. a solo trip. maybe. probably"],
    },
    pastBeatLines: {
      "riya-birthday": "oh and Tanvi's birthday ended up being insane 😂 karaoke till 3am",
      "riya-pottery": "my accidental ashtray is now on display. I'm calling it abstract",
    },
    followUpQs: ["wait how did you get into that?", "okay and do you actually enjoy it?", "that's cool. what's the best part?", "hmm okay, and what happened next?"],
    yourTurn: ["what about you?", "your turn", "okay your turn, same question"],
    deepShare: [
      "okay random honest thing. I've never travelled alone and I really want to, but I think I'm scared I'll be bored of my own company 🙃",
      "honestly I act super chill but I overthink texts way more than I'd admit",
    ],
    openers: [
      g("Playful", "So are you still undefeated at Codenames or was that a one-time thing?"),
      g("Genuine", "Hey! It was really fun meeting you at game night. How's your week going?"),
      g("Curious", "Okay I have to ask — how were you so good at Codenames? Is that a skill or pure chaos?"),
    ],
  },
  ananya: {
    beatLines: {
      "ananya-deadline": ["Deadline week. We're submitting drawings for a library competition.", "Tired. It's a deadline week. But it's a project I really care about."],
      "ananya-site": ["I went on a site visit today. I saw something I designed two years ago, half-built. It was a strange feeling.", "Good. Quiet. I saw one of my buildings under construction today."],
      "ananya-arjun": ["My brother is visiting. The fridge is already empty.", "Arjun's here for the weekend. He's asleep on my couch at 4pm."],
    },
    pastBeatLines: {
      "ananya-deadline": "We submitted the library drawings, by the way. I slept eleven hours after.",
      "ananya-site": "I keep thinking about seeing that building half-built.",
    },
    followUpQs: ["What drew you to that?", "Do you still enjoy it?", "What's that like?", "How did that feel?"],
    yourTurn: ["And you?", "What about you?", "You?"],
    deepShare: [
      "Actually… that's something I've been thinking about a lot recently. Whether I like my work, or just the idea of it. Seeing that building helped, I think.",
      "I'm not very good at this, honestly. Texting someone new. I overthink what I say. But this is… nice.",
    ],
    openers: [
      g("Playful", "I've been thinking about that staircase. I still don't understand where it was going."),
      g("Genuine", "Hi Ananya — it was nice talking to you at the housewarming, even if it was short. How's your week been?"),
      g("Curious", "Okay, professional opinion: was that staircase a design choice or a cry for help?"),
    ],
  },
  meera: {
    beatLines: {
      "meera-pitch": ["Pitching investors on Thursday. I've rewritten the deck four times. I'm not nervous.", "Deck, deck, deck. Thursday is the big pitch."],
      "meera-sparring": ["I sparred for the first time today. Got punched in the face. Loved it.", "Slight bruise on my cheek. Boxing. I'm proud of it, don't ask."],
      "meera-goa": ["Fighting my co-founder about whether a Goa offsite should be 'productive'. It should not.", "Planning an offsite. Dev wants workshops. I want a beach."],
    },
    pastBeatLines: {
      "meera-pitch": "The pitch went weirdly well, by the way. I don't trust it yet.",
      "meera-sparring": "Bruise is fading. I'm almost sad about it.",
    },
    followUpQs: ["Why?", "And do you actually like it or is that just the answer you give?", "What's the part nobody sees?", "Okay, and what did you learn from that?"],
    yourTurn: ["Your turn.", "You?", "Same question. Don't dodge it."],
    deepShare: [
      "Honest answer? Some days I'm terrified Kaapi Club fails and everyone who said 'get a real job' was right. I don't say that out loud much.",
      "The last guy I dated couldn't handle that I work this much. So I'm a bit… guarded, I guess. There. Happy?",
    ],
    openers: [
      g("Playful", "I've recovered from the name tag roast. Mostly. Ready for round two?"),
      g("Confident", "Hey Meera. You owe me an explanation for what exactly was wrong with my name tag."),
      g("Genuine", "Hey, it was fun meeting you at the mixer. How's the cold-brew empire doing?"),
    ],
    safeCallout: ["Okay, that's a very safe answer.", "That's the answer you give your aunt. What's the real one?", "Hm. Try again, with an opinion this time."],
  },
  sara: {
    beatLines: {
      "sara-wedding": ["shooting a sangeet this weekend and I've heard rumours about an uncle who breakdances", "prepping for a wedding shoot. emotionally preparing for uncles"],
      "sara-gokarna": ["Zoya and I might drive to Gokarna tomorrow with zero planning", "packing for a trip I decided on 20 minutes ago"],
      "sara-gallery": ["I submitted photos to a gallery show and now I'm pretending I don't care", "refreshing my email every 4 minutes. unrelated"],
    },
    pastBeatLines: {
      "sara-wedding": "the uncle breakdanced into the cake btw. I got the shot",
      "sara-gokarna": "I'm still sunburnt from Gokarna in the shape of my camera strap",
    },
    followUpQs: ["wait why", "okay and?? what happened", "that's so random I love it", "okay but would you do it again"],
    yourTurn: ["wbu", "you??", "okay your turn"],
    deepShare: [
      "okay unhinged honesty hour. everyone thinks I'm just chaotic but I kind of want someone who's fun AND actually shows up, you know",
      "I act like I don't care about the gallery thing but I really really do",
    ],
    openers: [
      g("Playful", "Okay I've looked at the photo 14 times. When do I get to see the rest of your portfolio?"),
      g("Genuine", "Hey Sara! Thanks for the photo — honestly it's the best picture anyone's taken of me."),
      g("Flirty", "So about that drink I owe you… what's your order? 😏"),
    ],
  },
};

// Generic suggestions keyed by topic, used when she hasn't asked an authored question.
export const TOPIC_HELP: Record<string, { curious: string; relate: string; playful: string }> = {
  work: {
    curious: "Wait, what's the part of your work you actually love? Not the LinkedIn answer.",
    relate: "I get that. Work's been intense for me too — though I secretly like it when it's busy.",
    playful: "Okay but on a scale of 1 to 10, how dramatic is your workplace right now?",
  },
  weekend: {
    curious: "That sounds fun. Are you more of a plan-everything person or a see-what-happens person?",
    relate: "My weekend plan is dangerously close to 'nothing', which I'm kind of excited about.",
    playful: "Sounds like a weekend that needs a good story at the end of it.",
  },
  music: {
    curious: "Okay, what's the one song you'd never skip, no matter what?",
    relate: "I've had the same three songs on repeat for a week. It's getting embarrassing.",
    playful: "I'm scared to show you my playlist now. I feel like I'd be judged.",
  },
  food: {
    curious: "Okay, best place you've eaten in the city? I need recommendations.",
    relate: "I'm a Maggi-at-midnight person, honestly. Not proud, just honest.",
    playful: "This is important information. I'll be taking notes.",
  },
  travel: {
    curious: "What's the best trip you've ever taken? And why that one?",
    relate: "I've been wanting to do a trip like that for ages. I keep planning and not booking.",
    playful: "Okay, now I'm jealous. Take me with you next time — as a travel critic.",
  },
  movies: {
    curious: "What's something you've watched or read recently that actually stuck with you?",
    relate: "I rewatch the same comfort shows way too often. It's a lifestyle.",
    playful: "Okay I'm going to need your full list of recommendations, with ratings.",
  },
  fitness: {
    curious: "How did you get into that? I feel like you need a story for it.",
    relate: "I keep telling myself I'll get into running. Any day now.",
    playful: "Okay, I'm slightly intimidated now.",
  },
  pets: {
    curious: "Okay I need to know everything about this pet immediately.",
    relate: "I'm fully a dog person. I say hi to every dog on the street.",
    playful: "I'm going to need photo evidence, obviously.",
  },
  hobbies: {
    curious: "How did you get into that? And are you actually good at it?",
    relate: "I tried something like that once. It did not go well, but I respect it.",
    playful: "Okay, now I want to see your work. For quality control purposes.",
  },
  family: {
    curious: "Are you close with them?",
    relate: "Same, honestly. My family is a whole group chat of chaos.",
    playful: "Okay, that's adorable and slightly chaotic.",
  },
};


// When he answers one of her questions: how she reacts, and her own answer.
export const QUESTION_FOLLOW: Record<string, { react: string[]; mine?: string }> = {
  "riya-spontaneous": { react: ["okay that's actually impressive", "wait I love that", "hmm okay you're more chaotic than you look"], mine: "mine is dyeing my hair blue the night before a family wedding. my mom still brings it up" },
  "riya-weekend": { react: ["okay that's a solid weekend", "honestly that sounds nice", "hmm respectable"], mine: "mine is momos, pottery, and pretending I'll go to the gym" },
  "riya-music": { react: ["okay that's… actually good taste. annoyingly", "hmm I'm judging a little. affectionately", "okay adding that to a playlist"], mine: "I'm in a Prateek Kuhad phase and an embarrassing 2000s Bollywood phase at the same time" },
  "riya-food": { react: ["okay I respect that", "valid. extremely valid", "hmm controversial but I'll allow it"], mine: "momos. obviously. I'm on a mission to find the best ones in Koramangala" },
  "riya-talent": { react: ["okay that's oddly specific, I love it", "wait that's actually useful", "😂 okay that's a real skill"], mine: "I can tell Helvetica from Arial across a room. nobody has ever been impressed" },
  "riya-ideal-sunday": { react: ["okay that sounds perfect honestly", "hmm yeah I could get behind that", "okay you've clearly thought about this"], mine: "mine is a late breakfast, a long walk with Mochi, and a nap I didn't plan" },
  "ananya-notice": { react: ["That's a nice one.", "Hm. I like that you noticed that.", "That sounds lovely, actually."], mine: "Mine was the rain this morning. I sat on the balcony with coffee and didn't look at my phone for twenty minutes." },
  "ananya-place": { react: ["That sounds like a good place.", "Hm. I can picture it.", "I like that."], mine: "For me it's a small café near Church Street. The back table. Nobody bothers you there." },
  "ananya-why": { react: ["That's an honest answer.", "Hm. I didn't expect that.", "I like that you've thought about it."], mine: "I used to draw houses as a kid and never really stopped. It's less romantic than it sounds." },
  "ananya-rain": { react: ["Good answer.", "Hm. Same, mostly.", "That's very specific. I like it."], mine: "I love it. I walk in it on purpose sometimes. My mother thinks that's strange." },
  "meera-opinion": { react: ["Okay. That's a real opinion. I disagree, but I respect it.", "Hm. Fine. That's actually defensible.", "Bold. Wrong, but bold."], mine: "Mine: most networking events are adults pretending to enjoy warm wine." },
  "meera-want": { react: ["That's honest. I like honest.", "Hm. Better answer than most people give.", "Okay. I believe you."], mine: "Me? To build something that outlasts my stubbornness." },
  "meera-risk": { react: ["Okay, respect.", "That's a real one.", "Hm. Didn't expect that from you."], mine: "Quitting consulting to sell coffee out of my apartment. My parents still haven't recovered." },
  "meera-safe": { react: ["Hm. Okay. Better.", "That's fair. I can be a lot.", "Okay, noted."], mine: "Good. Careful is boring." },
  "meera-spice": { react: ["Noted. I'll be testing that.", "Hm. We'll see.", "Okay, that's either brave or a lie."], mine: "Mine is 'tears, but no regrets'." },
  "sara-redflag": { react: ["okay that's barely a red flag, that's like a pink flag", "noted. adding it to your file 📝", "LMAO okay honest"], mine: "mine is I will absolutely say yes to a 2am road trip on a work night" },
  "sara-30sec": { react: ["okay fine. you're interesting. slightly", "hmm acceptable", "okay that was actually a good pitch"] },
  "sara-embarrassing": { react: ["NO 😭", "okay that's iconic", "LMAO I'm screenshotting this"], mine: "I once pretended I could skateboard. I could not skateboard. I have a scar" },
  "sara-chemistry": { react: ["correct answer", "hmm okay I respect that", "okay you pass"], mine: "chemistry. obviously. I'm not built for boring" },
  "sara-2am": { react: ["LMAO relatable", "okay that's so specific", "hmm that's either cute or concerning"], mine: "I'm usually editing photos or watching a horror movie I'll regret" },
  "sara-superpower": { react: ["okay that's so useless I love it", "wait that's actually genius", "hmm solid choice"], mine: "mine would be making Pickle like other people. useless. impossible" },
};

// When his message references how they met.
export const MET: Record<CharacterId, { re: RegExp; lines: string[][] }> = {
  riya: { re: /codenames|game night|board game|destroyed|ruthless|won|beat (me|us|everyone)/i, lines: [["haha I'm a menace at Codenames, I know", "in my defence, everyone else was terrible"], ["okay in my defence I warned everyone I was competitive 😂"]] },
  ananya: { re: /stair|housewarming|apartment|interrupted/i, lines: [["Hi. The staircase guy? 🙂", "Honestly, I think it was a structural apology."], ["Hi 🙂", "I still don't know where that staircase was going. I've thought about it more than I should."]] },
  meera: { re: /name ?tag|mixer|roast|font/i, lines: [["The name tag deserved it.", "Hi, by the way."], ["Name tag guy. I was wondering if you'd survived."]] },
  sara: { re: /photo|pic|picture|gig|drink|owe/i, lines: [["the photo is objectively a masterpiece. you're welcome", "and yes you still owe me that drink"], ["okay I'm glad you liked it because I did NOT ask permission 😭"]] },
};
