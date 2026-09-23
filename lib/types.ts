// Shared domain types. The client is the source of truth for all state in V1
// (persisted locally); the server engines are stateless functions of it.

export type CharacterId = "riya" | "ananya" | "meera" | "sara";

export type Availability = "online" | "away" | "offline";

export type DatingExperience = "never" | "a_little" | "a_few_times" | "relationships";

export interface UserProfile {
  name: string;
  experience: DatingExperience;
  struggles: string[];
  goals: string[];
  onboardedAt: number;
}

/** Hidden conversational state. Only `interest` is ever surfaced (as a number). */
export interface HiddenState {
  interest: number;
  comfort: number;
  curiosity: number;
  attraction: number;
  trust: number;
  playfulness: number;
}

export type StateDeltas = Partial<Record<keyof HiddenState, number>>;

export interface Perception {
  impression: string;
  likes: string[];
  unsure: string[];
  vibe: { emoji: string; label: string };
}

export interface Memory {
  text: string;
  at: number;
}

export type Sender = "user" | "her";

export interface ChatMessage {
  id: string;
  from: Sender;
  text: string;
  at: number;
  sessionId: string;
  /** Change in interest caused by this user message (never shown in-line). */
  delta?: number;
  /** Local engine: canned suggestions attached to a question she asked. */
  helpKey?: string;
  /** She stepped away mid-conversation; she comes back later. */
  away?: boolean;
}

/** Per-message conversational signals, produced by analysis (local or LLM). */
export interface TurnSignals {
  question: boolean;
  disclosure: boolean;
  humour: boolean;
  flirt: boolean;
  followUp: boolean;
  lowEffort: boolean;
  tooForward: boolean;
  bragging: boolean;
  validationSeeking: boolean;
  rude: boolean;
  askOut: boolean;
}

export interface SessionStats {
  userMessages: number;
  questions: number;
  disclosures: number;
  humour: number;
  followUps: number;
  flirts: number;
  helpOpened: number;
  helpUsed: number;
  tooForward: number;
}

export type SkillKey =
  | "conversation"
  | "confidence"
  | "listening"
  | "selfExpression"
  | "flirting"
  | "awkwardness";

export type SkillScores = Record<SkillKey, number>;

export interface SessionReport {
  herTake: string;
  worked: string[];
  improve: string;
  nextPractice: string;
  skills: SkillScores;
  pattern: string;
  coachNote: string;
}

export interface Session {
  id: string;
  characterId: CharacterId;
  startedAt: number;
  endedAt?: number;
  startInterest: number;
  endInterest?: number;
  trail: number[];
  stats: SessionStats;
  report?: SessionReport;
  /** She wrapped the conversation up herself. */
  endedByHer?: boolean;
  /** Per-message read of the user's messages, for pattern-level reactions. */
  signals: TurnSignals[];
}

export interface CharacterRuntime {
  state: HiddenState;
  perception: Perception;
  memories: Memory[];
  messages: ChatMessage[];
  activeSessionId?: string;
  /** Local engine bookkeeping: lines already used, so she doesn't repeat herself. */
  usedLines: string[];
  lastSeenAt?: number;
  sessionsCount: number;
  /** Life beats she has already told the user about. */
  toldBeats: string[];
}

export interface CoachMessage {
  id: string;
  from: "user" | "coach";
  text: string;
  at: number;
}

// ---- API contracts ---------------------------------------------------------

export interface ChatRequest {
  characterId: CharacterId;
  event: "message" | "open" | "return";
  userText?: string;
  history: { from: Sender; text: string }[];
  state: HiddenState;
  perception: Perception;
  memories: string[];
  usedLines: string[];
  toldBeats: string[];
  dayIndex: number;
  hour: number;
  sessionTurn: number;
  sessionsCount: number;
  userName: string;
  /** Recent user signals this session, for pattern-level reactions (interviewing etc.). */
  recentSignals: TurnSignals[];
}

export interface ChatResponse {
  messages: string[];
  deltas: StateDeltas;
  perception: Perception;
  newMemories: string[];
  signals?: TurnSignals;
  wrapUp: boolean;
  stepAway: boolean;
  usedLines: string[];
  toldBeats: string[];
  helpKey?: string;
  engine: "claude" | "local";
}

export interface HelpOption {
  tone: string;
  text: string;
}

export interface HelpRequest {
  characterId: CharacterId;
  history: { from: Sender; text: string }[];
  state: HiddenState;
  helpKey?: string;
  memories: string[];
}

export interface HelpResponse {
  options: HelpOption[];
  engine: "claude" | "local";
}

export interface ReportRequest {
  characterId: CharacterId;
  history: { from: Sender; text: string }[];
  stats: SessionStats;
  startInterest: number;
  endInterest: number;
  durationMs: number;
  perception: Perception;
  profile: Pick<UserProfile, "experience" | "struggles" | "goals">;
}

export interface ReportResponse {
  report: SessionReport;
  engine: "claude" | "local";
}

export interface CoachSessionSummary {
  characterId: CharacterId;
  startInterest: number;
  endInterest: number;
  durationMin: number;
  stats: SessionStats;
  pattern?: string;
  improve?: string;
  coachNote?: string;
  skills?: SkillScores;
  endedAt: number;
}

export interface CoachRequest {
  profile: UserProfile;
  sessions: CoachSessionSummary[];
  history: { from: "user" | "coach"; text: string }[];
  message: string;
}

export interface CoachResponse {
  text: string;
  engine: "claude" | "local";
}
