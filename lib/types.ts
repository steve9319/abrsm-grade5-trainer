export const TOPIC_IDS = [
  "rhythm",
  "pitch",
  "keys",
  "intervals",
  "chords",
  "transposition",
  "terms",
  "ornaments",
  "context",
  "practical",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export interface QuestionOption {
  id: string;
  text: string;
  explanation: string;
}

export interface Question {
  id: string;
  topic: TopicId | string;
  source: string;
  question: string;
  /** ABC notation, rendered with abcjs. Omit for text-only questions. */
  notation?: string;
  /** Describes the staff without giving away the answer. */
  notationAlt?: string;
  options: QuestionOption[];
  /** Option id of the single correct answer. */
  correctAnswer: string;
  /** Why the correct answer is correct. May be empty if a generated explanation is expected. */
  explanation: string;
}

export interface Attempt {
  questionId: string;
  topic: string;
  correct: boolean;
  chosen: string;
  mode: "practice" | "exam";
  at: number;
}

export interface ExamRecord {
  id: string;
  at: number;
  score: number;
  total: number;
  secondsUsed: number;
  byTopic: { topic: string; score: number; total: number }[];
}

export interface ExplanationCacheEntry {
  hash: string;
  explanation: string;
  optionExplanations: Record<string, string>;
  model: string;
  at: number;
}

export interface ProgressState {
  attempts: Attempt[];
  exams: ExamRecord[];
  explanationCache: Record<string, ExplanationCacheEntry>;
}

export interface QuestionSummary {
  id: string;
  topic: string;
}
