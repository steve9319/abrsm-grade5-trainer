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

/** Recorded when Claude checks a stored answer. Never replaces correctAnswer. */
export interface AnswerCheck {
  checkedAt: string;
  model: string;
  /** Option id Claude chose without being told the stored answer. */
  claudeAnswer: string;
  agreed: boolean;
  /** When agreed is false, this flags the disagreement. */
  note: string;
}

export interface Question {
  id: string;
  topic: TopicId | string;
  /** Concept inside the topic, used for mastery and weak-spot drills. */
  subtopic: string;
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
  /** Cached Claude check. Present only after `npm run check-answers` has run with a key. */
  answerCheck?: AnswerCheck;
}

export interface Attempt {
  questionId: string;
  topic: string;
  subtopic?: string;
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

export interface LessonCacheEntry {
  lesson: string;
  model: string;
  at: number;
}

export interface ProgressState {
  attempts: Attempt[];
  exams: ExamRecord[];
  explanationCache: Record<string, ExplanationCacheEntry>;
  lessonCache: Record<string, LessonCacheEntry>;
}

export interface QuestionSummary {
  id: string;
  topic: string;
  subtopic: string;
}
