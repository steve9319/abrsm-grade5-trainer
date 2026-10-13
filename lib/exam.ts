import { TOPIC_IDS } from "@/lib/types";
import type { Question } from "@/lib/types";
import { shuffle } from "@/lib/random";

/** Theory topics only. The piano-practical set stays in practice mode. */
export const EXAM_TOPICS = TOPIC_IDS.filter((topic) => topic !== "practical");

export const EXAM_PER_TOPIC = 2;

export const EXAM_MINUTES = 30;

export const EXAM_SECONDS = EXAM_MINUTES * 60;

export function examQuestionCount(questions: Question[] = []): number {
  if (questions.length === 0) return EXAM_TOPICS.length * EXAM_PER_TOPIC;
  return EXAM_TOPICS.reduce((sum, topic) => {
    const available = questions.filter((question) => question.topic === topic).length;
    return sum + Math.min(EXAM_PER_TOPIC, available);
  }, 0);
}

export function pickExamQuestions(questions: Question[], rng: () => number = Math.random): Question[] {
  const picked: Question[] = [];
  for (const topic of EXAM_TOPICS) {
    const pool = shuffle(
      questions.filter((question) => question.topic === topic),
      rng,
    );
    picked.push(...pool.slice(0, EXAM_PER_TOPIC));
  }
  return shuffle(picked, rng);
}

export interface ScoredRow {
  question: Question;
  chosen: string | null;
  correct: boolean;
}

export interface TopicScore {
  topic: string;
  score: number;
  total: number;
}

export function scoreAnswers(questions: Question[], answers: Record<string, string>): {
  rows: ScoredRow[];
  score: number;
  total: number;
  byTopic: TopicScore[];
} {
  const rows = questions.map((question) => {
    const chosen = answers[question.id] ?? null;
    return { question, chosen, correct: chosen === question.correctAnswer };
  });
  const topics = [...new Set(questions.map((question) => question.topic))];
  const byTopic = topics.map((topic) => {
    const subset = rows.filter((row) => row.question.topic === topic);
    return {
      topic,
      score: subset.filter((row) => row.correct).length,
      total: subset.length,
    };
  });
  return {
    rows,
    score: rows.filter((row) => row.correct).length,
    total: rows.length,
    byTopic,
  };
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
