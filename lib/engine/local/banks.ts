import type { CharacterId, HelpOption } from "../../types";

// Hand-written voice for the offline engine. Each character gets her own
// reactions, answers to common topics, questions (with Help suggestions
// attached) and boundary lines. Lines are picked without repetition.

export interface BankQuestion {
  key: string;
  text: string | string[];
  help: HelpOption[];
}

export interface Bank {
  firstReply: string[][]; // reply to his very first message (greeting)
  returnGreeting: string[][];
  react: {
    humour: string[];
    story: string[];
    followUp: string[];
    disclosure: string[];
    flirtWarm: string[];
    flirtCool: string[];
    lowEffort: string[];
    interview: string[];
    brag: string[];
    validation: string[];
    tooForward: string[];
    rude: string[];
    generic: string[];
    rememberedYou: string[];
  };
  askOut: { yes: string[]; maybe: string[]; no: string[] };
  topics: Record<string, string[]>;
  aboutYouAnswers: string[];
  questions: BankQuestion[];
  wrapUp: string[][];
  stepAway?: string[];
  comeBack?: string[][];
  randomQs?: BankQuestion[];
}

const g = (tone: string, text: string): HelpOption => ({ tone, text });

export const TOPIC_WORDS: Record<string, RegExp> = {
  work: /(\bwhat do you do\b|\bworking\b|\bbuilding|\barchitect)|\b(work|job|office|design|designer|architect|startup|company|boss|career|client|project|meeting|deadline|business|founder|photograph(y|er)|shoot)\b/i,
  weekend: /\b(weekend|saturday|sunday|plans|tonight|tomorrow)\b/i,
  music: /\b(music|song|songs|playlist|band|concert|gig|singer|listen|spotify|album)\b/i,
  food: /\b(food|eat|eating|cook|cooking|restaurant|momos|biryani|dinner|lunch|breakfast|spicy|pizza|coffee|chai|tea)\b/i,
  travel: /\b(travel|trip|trek|trekking|mountains|beach|goa|pondi|pondicherry|gokarna|vacation|holiday|abroad|flight)\b/i,
  movies: /\b(movie|movies|film|show|series|netflix|watch|watching|horror|anime|book|books|read|reading)\b/i,
  fitness: /\b(gym|workout|run|running|boxing|football|cricket|sport|sports|yoga|fitness|swim)\b/i,
  pets: /\b(dog|dogs|cat|cats|pet|pets|puppy|kitten|mochi|pickle)\b/i,
  hobbies: /\b(hobby|hobbies|pottery|sketch|sketching|paint|painting|guitar|piano|plants|garden|games|gaming|board game|codenames|karaoke|dance|dancing)\b/i,
  family: /\b(family|mom|mum|dad|parents|brother|sister|siblings)\b/i,
};

export const BANKS: Record<CharacterId, Bank> = {
  riya: {
    firstReply: [
      ["heyy it's the guy from board game night 👀", "I was wondering if you'd actually text"],
      ["oh hi!", "okay first question, are you still recovering from how badly I beat everyone at Codenames"],
      ["hii 😄", "I was just thinking about that game night. chaotic evening"],
    ],
    returnGreeting: [
      ["heyy you're back 😄"],
      ["oh hi again!", "how's your week going?"],
      ["look who it is"],
    ],
    react: {
      humour: ["😂😂", "okay that was actually funny", "hahaha stop", "wait 😂 you actually did that?", "I laughed out loud and Kavya looked at me weird", "okay you're funnier than I expected"],
      story: ["okay that's unexpectedly interesting", "wait I need more details", "no because that's such a good story", "okay I did not see that coming"],
      followUp: ["haha okay you actually listen", "ooh good question", "okay I like that you asked that"],
      disclosure: ["okay I love that", "wait that's cool", "ooh tell me more", "hmm I didn't expect that from you", "okay that's very specific and I respect it"],
      flirtWarm: ["you're making a very strong case for yourself right now", "hmm smooth 😌", "okay I see what you're doing 👀", "careful, I might start liking you"],
      flirtCool: ["haha slow down there", "hmm okay 😅", "that's sweet but you barely know me yet"],
      lowEffort: ["haha okay", "mhm", "cool cool", "…okay 😅"],
      interview: ["okay wait this is starting to feel like a job interview 😂", "do I get the job or", "haha why do I feel like I'm being surveyed"],
      brag: ["hmm okay 😅", "wow… congrats I guess", "okay but that's not really what I asked 😂", "is this your LinkedIn summary"],
      validation: ["haha relax, you're fine", "why would you think that 😅", "no you're good, I'm just a slow texter"],
      tooForward: ["okay that's a bit much for a first chat 😅", "hmm let's maybe not go there", "whoa okay. let's rewind a bit"],
      rude: ["okay that was kind of rude", "wow. okay.", "not sure what that was about"],
      generic: ["haha fair", "hmm okay", "that's fair actually", "okay true", "I see I see"],
      rememberedYou: ["wait didn't you say you {memory}?", "hold on, you told me you {memory}. how's that going?"],
    },
    askOut: {
      yes: ["okay yes. but I'm picking the momo place", "hmm I'd like that actually. this weekend's chaotic but next week?", "only if you promise not to be weird about me stealing your food. yes 😄"],
      maybe: ["haha maybe! let's keep talking first", "hmm I'm not saying no… ask me again soon", "ooh bold. let me get to know you a bit more first"],
      no: ["haha I think I'm good for now, but thank you", "that's sweet but I don't think so, sorry"],
    },
    topics: {
      work: ["I design payment screens at a fintech startup. it sounds boring but I get weirdly emotional about buttons", "work's chaotic, we have a launch this week so I've been living in Figma", "honestly I like my job? which I know is suspicious"],
      weekend: ["this weekend is Tanvi's birthday and I'm in charge of the playlist which is way too much power for me", "probably pottery, momos and then pretending to be productive", "no plans yet which is either peaceful or tragic"],
      music: ["I make playlists for everything. I have one called 'songs to cry to in an auto'", "currently Prateek Kuhad on repeat. and some very embarrassing 2000s Bollywood", "I judge people slightly by their Spotify wrapped. slightly"],
      food: ["I'm on a personal mission to find the best momos in Koramangala", "I cannot cook. like, at all. I burned maggi once", "chai over coffee, always. fight me"],
      travel: ["I love Pondi. and Goa, obviously, but Pondi is more my vibe", "I've never travelled solo and it's lowkey my next goal", "I went to Meghalaya last year and I still think about it"],
      movies: ["I rewatch the same 5 comfort shows. Friends is one of them and I'm not sorry", "I cry at every movie. even the funny ones somehow", "lately I've been reading more than watching which is new for me"],
      fitness: ["I tried running once. once.", "I do yoga sometimes. mostly the lying down part"],
      pets: ["my roommate has a golden retriever called Mochi and he's basically my child now", "I'm a dog person. Mochi has fully converted me"],
      hobbies: ["I started pottery and I'm genuinely terrible at it", "I'm very competitive at board games. it's a problem", "I collect weird fridge magnets from every trip"],
      family: ["my mom calls every Sunday to ask if I'm eating properly. I am not", "I'm an only child so I'm used to getting my way 😌"],
    },
    aboutYouAnswers: [
      "hmm, I'm a designer, I make too many playlists and I'm bad at pottery. that's the trailer",
      "honestly I'm pretty easygoing. unless it's Codenames",
      "I'm the friend who plans the trip and then forgets to pack",
    ],
    questions: [
      { key: "riya-spontaneous", text: "what's the most spontaneous thing you've ever done?", help: [g("Playful", "Depends. Are we counting things I probably shouldn't admit in a first conversation?"), g("Genuine", "I once booked a trip two days before leaving. Best decision I made that year. What about you?"), g("Flirty", "I could tell you, but I'm not sure you've earned that story yet 😏")] },
      { key: "riya-weekend", text: "what do you usually do on weekends?", help: [g("Genuine", "Honestly, a mix of sleeping in and one plan I get way too excited about. Last week it was a food walk."), g("Playful", "Pretend I'll be productive, then end up on a 3-hour YouTube spiral. Every time."), g("Curious", "Depends on the week, but I'm more curious what the playlist situation is for Tanvi's birthday")] },
      { key: "riya-music", text: "okay important question. what's on your playlist right now?", help: [g("Genuine", "A weird mix, honestly. Some Prateek Kuhad, some old Bollywood, and one song I've played 40 times this week."), g("Playful", "I'm not answering that until I know you won't judge me. You make playlists professionally, basically."), g("Curious", "Too much pressure. Tell me yours first and I'll tell you if we're compatible")] },
      { key: "riya-food", text: "controversial but important: what's your go-to comfort food?", help: [g("Genuine", "Maggi at 1am. Nothing fancy, it just hits every time."), g("Playful", "I'm going to say momos because I know it's the only right answer here"), g("Curious", "Hmm, depends on the mood. Why, are you building a case against me?")] },
      { key: "riya-talent", text: "what's a weirdly specific thing you're good at?", help: [g("Playful", "Guessing the exact moment a waiter is about to bring the food. It's a gift."), g("Genuine", "I'm genuinely good at remembering people's coffee orders. Not sure what that says about me."), g("Flirty", "Making conversations more interesting. At least I'm trying 😄")] },
      { key: "riya-ideal-sunday", text: "describe your perfect sunday. go", help: [g("Genuine", "Late breakfast, a long walk somewhere green, and dinner with friends that turns into talking till midnight."), g("Playful", "Waking up at 11, zero notifications, and someone else deciding what to eat."), g("Curious", "Mine would involve momos. Yours clearly involves a playlist. What else?")] },
    ],
    wrapUp: [
      ["okay I have to go, Tanvi is calling about the playlist crisis", "this was fun though 😄"],
      ["okay I need to sleep or I'll be useless tomorrow", "talk later?"],
      ["Mochi is staring at me like it's walk time", "gotta go! this was nice"],
    ],
  },

  ananya: {
    firstReply: [
      ["Hi. The staircase guy?"],
      ["Hey. I was wondering if you'd message."],
      ["Hi 🙂"],
    ],
    returnGreeting: [["Hi again."], ["Hey. How was your day?"], ["Hi 🙂"]],
    react: {
      humour: ["Haha. Okay, that was funny.", "That made me smile.", "Hm. You're funnier over text.", "Okay I actually laughed."],
      story: ["That's a lovely story actually.", "I like that you noticed that.", "Hm. I didn't expect that.", "That's really interesting."],
      followUp: ["You remembered that.", "Hm. Good question.", "That's a thoughtful thing to ask."],
      disclosure: ["That's nice.", "I like that.", "Hm, I relate to that a bit.", "That makes sense."],
      flirtWarm: ["…okay, that was sweet.", "Hm. I don't really know what to say to that 🙂", "You're a bit charming, you know."],
      flirtCool: ["Oh. Thanks.", "Hm.", "That's kind. We should maybe talk a bit more first."],
      lowEffort: ["Okay.", "Hm.", "Yeah."],
      interview: ["That's a lot of questions.", "Hm. You ask a lot of questions. What about you?", "I feel like I'm doing all the talking."],
      brag: ["Okay.", "That's… nice for you.", "Hm."],
      validation: ["It's okay. I'm just slow at texting.", "You're fine. Don't worry so much.", "No, it's alright."],
      tooForward: ["I'm not comfortable with that.", "That's a bit much. I barely know you.", "Let's not."],
      rude: ["That wasn't very nice.", "Okay. I don't think I want to continue this.", "Hm. No."],
      generic: ["Hm. That's fair.", "I see.", "That makes sense.", "True."],
      rememberedYou: ["You said you {memory}, right? I was thinking about that.", "Didn't you mention you {memory}?"],
    },
    askOut: {
      yes: ["…I'd like that. Somewhere quiet?", "Okay. Yes. There's a café near Church Street I like.", "Hm. Yes, I think I'd like that."],
      maybe: ["Maybe. I'd like to talk a bit more first, if that's okay.", "I'm not sure yet. Can we keep talking?", "Maybe. Give it some time?"],
      no: ["I don't think I'm ready for that. Sorry.", "I'd rather not, for now."],
    },
    topics: {
      work: ["I'm an architect. Right now we're working on a public library.", "Deadline week. I've been drawing stairs for three days.", "I like it. It's slow, but sometimes you get to see something you imagined become real."],
      weekend: ["Probably sketching at a café. Maybe a long walk if it rains.", "Nothing much. Reading, plants. It's nice.", "I usually cook a big breakfast on Sunday. It's my one ritual."],
      music: ["I listen to a lot of old stuff. Lata Mangeshkar, Nick Drake.", "Mostly instrumental when I work. Words distract me."],
      food: ["I make a very good pesarattu on Sundays.", "Filter coffee. Not the fancy kind.", "I like cooking more than eating out, honestly."],
      travel: ["I like places with old buildings. Hampi, Pondicherry.", "I don't travel much. I'd like to see Kyoto someday.", "Mysore, mostly. My parents are there."],
      movies: ["I'm reading Murakami again. Slowly.", "I don't watch much. I read more.", "I like quiet films. Things where nothing happens, but everything does."],
      fitness: ["I walk a lot. That's about it.", "I tried yoga. It was fine."],
      pets: ["No pets. I have plants. 31 of them.", "I like cats. They mind their own business."],
      hobbies: ["I sketch buildings. Mostly old ones.", "I have 31 plants. They all have names.", "I read. A lot."],
      family: ["My brother's in college. I worry about him more than I let him know.", "My parents are in Mysore. I go home once a month."],
    },
    aboutYouAnswers: [
      "I'm not very interesting. I draw buildings and water plants.",
      "Hm. I'm quiet, I think. Until I'm not.",
      "I like small things. Rain, good pens, people who notice stuff.",
    ],
    questions: [
      { key: "ananya-notice", text: "What's something small that made your day better recently?", help: [g("Genuine", "Honestly? The chai guy near my office remembered my order. Weirdly made my whole morning."), g("Reflective", "Walking home without headphones for once. I noticed so many things I usually miss."), g("Curious", "Hmm, let me think. But I have a feeling yours is going to be better — what was it?")] },
      { key: "ananya-place", text: "Is there a place in the city you feel most like yourself?", help: [g("Genuine", "There's a small park near my place I walk through most evenings. It's the one quiet part of my day."), g("Playful", "The back table of one specific café. I'm not telling you which one yet."), g("Curious", "I've never thought about it that way. What's yours? I feel like you'd have a good answer.")] },
      { key: "ananya-why", text: "Why did you choose the work you do?", help: [g("Genuine", "Honestly, partly by accident. But the part I love is solving problems nobody else wants to."), g("Reflective", "I'm still figuring that out, to be honest. Some days I'm sure, some days I'm not."), g("Curious", "I'll tell you, but I'm more curious about you — was architecture always the plan?")] },
      { key: "ananya-rain", text: "Do you like the rain?", help: [g("Genuine", "I do. Especially from inside with chai. Walking in it is nice too, if I don't have somewhere to be."), g("Playful", "I like it right up until my shoes get wet. Then it's personal."), g("Curious", "I feel like you're a rain person. Am I right?")] },
    ],
    wrapUp: [
      ["I should sleep. Early site visit tomorrow.", "This was nice, though."],
      ["I have to go. Ishita's calling.", "Talk soon?"],
      ["I'm going to read for a bit and sleep.", "Goodnight 🙂"],
    ],
  },

  meera: {
    firstReply: [
      ["Name tag guy. Hi.", "Did you recover?"],
      ["Took you long enough 😏"],
      ["Hi. I was betting you'd open with 'hey'."],
    ],
    returnGreeting: [["Back for more?"], ["Hey. Make it interesting."], ["Look who showed up 😏"]],
    react: {
      humour: ["Okay, that was actually funny.", "Hah. Fine. Point to you.", "Don't let it go to your head, but I laughed.", "Okay, you're funnier than your name tag suggested."],
      story: ["Okay, now that's a real answer.", "See, that's interesting. More of that.", "Okay I respect that.", "That's a better story than I expected."],
      followUp: ["Good. You were listening.", "Okay, that's a sharper question than most people ask.", "Hm. Nobody asks that."],
      disclosure: ["Okay, I like that.", "That's honest. I like honest.", "Interesting. Didn't peg you as that type.", "See, now I'm curious."],
      flirtWarm: ["You're cute when you try 😏", "Smooth. Let's see if you can keep it up.", "Careful. I might start taking you seriously.", "Hm. Bold. I don't hate it."],
      flirtCool: ["That's a line. I've heard it before.", "Did that work on the last person?", "Try again. Less rehearsed."],
      lowEffort: ["That's it?", "Riveting.", "You're going to have to give me more than that.", "Wow. Okay."],
      interview: ["Is this a questionnaire?", "You're asking a lot and saying nothing. Your turn.", "Okay, stop interviewing me. Tell me something about you."],
      brag: ["Are you pitching to me right now?", "Okay, that's the LinkedIn version. What's the real one?", "Nobody asked, but congrats 🙄", "Impressive. Now tell me something that isn't a flex."],
      validation: ["Relax. If I was bored I'd tell you.", "You don't need my permission to be interesting.", "Why are you asking me that? Just talk."],
      tooForward: ["No. Try that again in a few months. Maybe.", "That's not happening. Next.", "Bold. Also no."],
      rude: ["Wow. Okay, we're done here.", "That's not cute.", "Nope."],
      generic: ["Okay, that's a very safe answer.", "Hm. What's your actual opinion?", "You're thinking way too hard about this.", "Fair."],
      rememberedYou: ["Didn't you say you {memory}? Still true or was that a first-date answer?", "You told me you {memory}. I remember things. Be warned."],
    },
    askOut: {
      yes: ["Took you long enough. Yes. You're picking the place, and it better not be boring.", "Okay. Yes. Thursday? I'll judge your spice tolerance.", "Fine. One drink. Impress me."],
      maybe: ["Maybe. You haven't earned it yet.", "Ask me again when you've said something I didn't expect.", "Hm. Convince me."],
      no: ["No. But points for asking directly.", "I'll pass. Not personal."],
    },
    topics: {
      work: ["I run a cold-brew company. Kaapi Club. We're fundraising so I'm basically a professional pitch-deck rewriter now.", "Work is intense and I love it. Next question.", "I built something from nothing and some days it feels like it's still nothing. Most days it doesn't."],
      weekend: ["Sunday brunch with my friends that turns into dinner. Non-negotiable.", "Boxing, sleep, and pretending I'm not checking Slack.", "Probably working. Don't judge."],
      music: ["Whatever gets me through a workout. Don't ask.", "Old rock when I'm driving. Hip hop when I'm working."],
      food: ["Spicy. The spicier the better. I judge people's spice tolerance, just so you know.", "I don't cook. I assemble.", "Cold brew. Obviously. It's literally my job."],
      travel: ["Mountains. Always mountains. I did Spiti alone last year.", "Solo travel is the best thing I ever did for myself.", "I travel for work mostly. Airports are my second home."],
      movies: ["I read biographies. I know, very founder of me.", "I like movies where people argue well. Social Network. 12 Angry Men."],
      fitness: ["I box at 7am. It's the only hour nobody can email me.", "Pickleball. I'm aggressively competitive about it."],
      pets: ["No pets. I can barely keep myself alive during fundraising.", "I'm a dog person, but I'd never admit it to my co-founder."],
      hobbies: ["Boxing and arguing. Both are cardio.", "I pick fights about books. Friendly ones. Mostly."],
      family: ["My younger sister Nisha is the only person who can make me back down from an argument.", "My parents still think I'm going to get a 'real job'."],
    },
    aboutYouAnswers: [
      "I'm stubborn, I'm direct, and I'm usually right. Your move.",
      "I run a company, I box, and I don't do small talk. That's the summary.",
      "Hm. I'm more interesting than my LinkedIn. Unlike most people.",
    ],
    questions: [
      { key: "meera-opinion", text: "Okay, give me a genuinely unpopular opinion. Not a safe one.", help: [g("Bold", "Most brunch is overrated. It's just breakfast that costs three times more."), g("Genuine", "I think people romanticise hustle culture way too much. Being well-rested is underrated."), g("Playful", "Cold brew is just coffee that's been left out too long. Fight me.")] },
      { key: "meera-want", text: "What do you actually want? Not from me. In general.", help: [g("Genuine", "Honestly? To build something I'm proud of and have people around me who make it feel worth it."), g("Bold", "Big question for a Tuesday. Right now? A job I love and someone who can argue with me over dinner."), g("Playful", "Right now, to come up with an answer that impresses you. Long term, still working on it.")] },
      { key: "meera-risk", text: "What's the biggest risk you've taken?", help: [g("Genuine", "Switching careers two years in. Scary, but I'd do it again."), g("Playful", "Texting you, apparently. Jury's still out on how that goes."), g("Curious", "I'll answer, but I have a feeling yours is bigger. Starting a company?")] },
      { key: "meera-safe", text: "You're being very careful with me. Why?", help: [g("Honest", "Honestly? You're a bit intimidating. In a good way."), g("Playful", "Because you roasted my name tag in ten seconds. I'm being strategic."), g("Bold", "Fair. Okay, no more careful. Ask me anything.")] },
      { key: "meera-spice", text: "Important: what's your spice tolerance? Be honest, I'll find out.", help: [g("Honest", "Medium. I'll order the spicy one and then quietly suffer."), g("Bold", "High. Dangerously high. Want to test it?"), g("Playful", "Low. I've accepted it. Is this a dealbreaker?")] },
    ],
    wrapUp: [
      ["Okay, I have a call. This was better than I expected.", "Don't let that go to your head."],
      ["I need to sleep, boxing at 7.", "You did alright tonight."],
      ["Dev needs me for something. Later."],
    ],
  },

  sara: {
    firstReply: [
      ["HI photo boy", "did you like the pic or are you just here for the drink you owe me"],
      ["oh you actually texted 👀", "okay I like you already. slightly"],
      ["heyyy", "wait I was literally just editing that photo of you lol"],
    ],
    returnGreeting: [["oh hiiii"], ["you're back 👀", "I was about to text you something unhinged"], ["hey you"]],
    react: {
      humour: ["LMAO", "okay stop 😭", "HAHAHA okay you're funny", "I just wheezed. Pickle is concerned", "okay that was good. annoyingly good"],
      story: ["wait WHAT", "okay I need the full story immediately", "no way 😭 that's iconic", "okay I'm invested now"],
      followUp: ["omg you remembered", "okay attentive king", "hmm I like that you asked"],
      disclosure: ["wait that's cool", "okay I didn't expect that from you", "ooh okay mysterious", "I like that"],
      flirtWarm: ["okay smooth 😏", "careful, I'm very easily charmed", "hmm you're trouble aren't you", "stop it 🫠"],
      flirtCool: ["LMAO slow down", "okay casanova", "haha nice try"],
      lowEffort: ["…that's it?", "wow riveting", "okay you're boring me 😭", "hello??"],
      interview: ["why does this feel like a census", "okay my turn to ask questions", "are you writing a biography"],
      brag: ["okay LinkedIn", "cool cool cool", "nobody asked babe 😭"],
      validation: ["omg relax 😭", "you're fine, I'm just chaotic", "why are you so worried lol"],
      tooForward: ["LMAO no", "okay slow DOWN", "yeah that's not happening 😭", "you wish"],
      rude: ["ew okay", "bye??", "that's not it"],
      generic: ["haha true", "okay fair", "hmm", "valid"],
      rememberedYou: ["wait didn't you say you {memory}", "okay but you said you {memory}, I remember everything 👀"],
    },
    askOut: {
      yes: ["okay yes but it has to be somewhere weird", "hmm okay. karaoke. you're singing", "yes. but I'm bringing my camera"],
      maybe: ["maybe 👀 depends on your answer to the next question", "hmm ask me again after you tell me something interesting", "I'm thinking about it"],
      no: ["haha I don't think so, but I like the confidence", "not right now 🫠"],
    },
    topics: {
      work: ["I shoot weddings to pay rent and film to stay sane", "work is either 14 hours of uncles yelling 'one more photo' or nothing for a week", "I'm a photographer. which means I'm always broke or rich, never in between"],
      weekend: ["no idea. last weekend I ended up in Gokarna, so", "a sangeet shoot. pray for me", "whatever happens happens"],
      music: ["I only listen to music that makes me feel like I'm in a movie", "karaoke is my cardio"],
      food: ["I will eat anything once", "street food > restaurants. every time", "I survive on Maggi and iced coffee and I'm thriving"],
      travel: ["I'll go anywhere if someone says 'let's go' with enough conviction", "night drives count as travel right", "I want to do a road trip with zero plan"],
      movies: ["I watch horror movies and then can't sleep for three days. every time. I never learn", "currently obsessed with anything with a good soundtrack"],
      fitness: ["I dance badly at parties, does that count", "I walk a lot for photos? that's fitness"],
      pets: ["I have a cat named Pickle and she hates everyone except me", "Pickle is my entire personality honestly"],
      hobbies: ["film photography, thrifting, and making bad decisions", "I have a camera named Gerald", "I read tarot. ironically. mostly"],
      family: ["my mom still thinks photography is a phase", "I'm the chaotic one in my family. obviously"],
    },
    aboutYouAnswers: [
      "I'm a photographer, I have a cat named Pickle, and I make at least one impulsive decision a week",
      "chaotic but loveable. mostly loveable",
      "I'm the person who says 'let's go' at 2am",
    ],
    questions: [
      { key: "sara-redflag", text: "okay what's your biggest red flag", help: [g("Playful", "I reply to texts in my head and then forget to actually send them."), g("Honest", "I overthink everything. Like, I'm probably overthinking this answer right now."), g("Flirty", "I get attached to people who ask me about my red flags 😏")] },
      { key: "sara-30sec", text: "you have 30 seconds to convince me you're interesting. go", help: [g("Playful", "I once got lost in a city for 6 hours on purpose and found the best food of my life. Time?"), g("Confident", "I don't need 30 seconds. I texted you, didn't I?"), g("Honest", "No pressure at all. Okay: I can cook a proper biryani and I've never once been on time for a movie.")] },
      { key: "sara-embarrassing", text: "be honest. most embarrassing thing you've done to impress someone", help: [g("Honest", "Pretended I knew how to dance salsa. I did not. Everyone found out."), g("Playful", "I'm not telling you that. You'll use it against me."), g("Flirty", "Ask me in person and I might tell you 😏")] },
      { key: "sara-chemistry", text: "would you rather have amazing chemistry with someone or never argue with them", help: [g("Genuine", "Chemistry. A few arguments mean you both actually care."), g("Playful", "Chemistry, obviously. Arguing is just flirting with extra steps."), g("Curious", "That feels like a trap. What would you pick?")] },
      { key: "sara-2am", text: "okay it's 2am and you're not asleep. what are you doing", help: [g("Honest", "Watching videos about things I'll never do. Like building a cabin in Norway."), g("Playful", "Probably texting a chaotic photographer, apparently."), g("Flirty", "Depends. Are you awake too?")] },
      { key: "sara-superpower", text: "if you could have one useless superpower what would it be", help: [g("Playful", "Always knowing which billing queue is fastest. Useless, but I'd be unstoppable."), g("Genuine", "Being able to perfectly remember songs after hearing them once. Karaoke would be dangerous."), g("Curious", "Hmm. What's yours? I feel like you have one ready.")] },
    ],
    wrapUp: [
      ["okay Zoya just dragged me out of the house", "byeee 😘"],
      ["I need to sleep before I say something stupid", "night!!"],
      ["okay Pickle knocked my coffee over, crisis mode", "later!"],
    ],
    stepAway: ["wait brb", "one sec Zoya is yelling", "hold on Pickle is attacking something"],
    comeBack: [
      ["sorry!! Zoya needed help carrying a mirror up 3 floors", "where were we"],
      ["okay I'm back", "Pickle was fighting a moth. she lost"],
      ["back 🫠 okay what did I miss"],
    ],
    randomQs: [],
  },
};

// Sara's signature move: sudden random questions.
BANKS.sara.randomQs = BANKS.sara.questions.filter((q) => ["sara-redflag", "sara-30sec", "sara-embarrassing", "sara-chemistry"].includes(q.key));

export function findQuestion(key: string | undefined): BankQuestion | undefined {
  if (!key) return undefined;
  for (const bank of Object.values(BANKS)) {
    const q = bank.questions.find((x) => x.key === key);
    if (q) return q;
  }
  return undefined;
}
