import type { Question } from "@/lib/types";
import { shuffle } from "@/lib/random";
import { PAPER_SECTIONS } from "@/lib/strategy";

/** How many questions a section contributes when the private bank can fill it. A 10-mark section takes two; the 15-mark keys section takes three. */
export function sectionQuestionQuota(marks: number): number {
  return Math.max(1, Math.round(marks / 5));
}

export const EXAM_MINUTES = 30;

export const EXAM_SECONDS = EXAM_MINUTES * 60;

export function examQuestionCount(questions: Question[]): number {
  return PAPER_SECTIONS.reduce((sum, section) => {
    const available = questions.filter((question) => section.topics.includes(question.topic)).length;
    return sum + Math.min(sectionQuestionQuota(section.marks), available);
  }, 0);
}

/** A short paper in the shape of the Grade 5 theory sections, drawn from whatever the private bank holds. */
export function pickExamQuestions(questions: Question[], rng: () => number = Math.random): Question[] {
  const picked: Question[] = [];
  for (const section of PAPER_SECTIONS) {
    const pool = shuffle(
      questions.filter((question) => section.topics.includes(question.topic)),
      rng,
    );
    picked.push(...pool.slice(0, sectionQuestionQuota(section.marks)));
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
