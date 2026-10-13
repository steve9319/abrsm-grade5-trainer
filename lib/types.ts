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

/** Cached Claude answer for a private question that had no stored key. */
export interface PrivateAnswer {
  checkedAt: string;
  model: string;
  claudeAnswer: string;
  /** True when the handwritten scan answer does not match Claude. */
  studentDisagrees: boolean;
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
  /** Printed paper year, when this question was imported from a local extract. */
  year?: number;
  /** Paper label, for example "A". */
  paper?: string;
  /** Printed number, for example "2.1". */
  questionNumber?: string;
  /** How many marks the printed question was worth. */
  marks?: number;
  /** Image path relative to the private bank, for a score excerpt. */
  imagePath?: string;
  /** Handwritten answer read from the scan, when MinerU captured one. */
  studentAnswer?: string;
  /** Stamped by the loader for questions read from PRIVATE_BANK_DIR. Not stored in the public bank. */
  private?: boolean;
  /** Cached result of generating an answer for a private question. */
  privateAnswer?: PrivateAnswer;
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
  private?: boolean;
}
