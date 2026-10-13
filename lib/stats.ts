import { TOPICS } from "@/lib/topics";
import type { Attempt, QuestionSummary } from "@/lib/types";

export interface TopicStat {
  topic: string;
  title: string;
  attempted: number;
  correct: number;
  total: number;
  accuracy: number;
}

export function percent(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}

export function latestByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const latest = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const previous = latest.get(attempt.questionId);
    if (!previous || attempt.at >= previous.at) latest.set(attempt.questionId, attempt);
  }
  return latest;
}

export function topicStats(bank: QuestionSummary[], attempts: Attempt[]): TopicStat[] {
  const latest = latestByQuestion(attempts);
  const known = TOPICS.map((topic) => topic.id);
  const extra = [...new Set(bank.map((item) => item.topic))].filter((topic) => !known.includes(topic as (typeof known)[number]));
  const order = [...known, ...extra];

  return order
    .map((topic) => {
      const inBank = bank.filter((item) => item.topic === topic);
      if (inBank.length === 0 && !known.includes(topic as (typeof known)[number])) return null;
      const answered = inBank
        .map((item) => latest.get(item.id))
        .filter((attempt): attempt is Attempt => Boolean(attempt));
      const correct = answered.filter((attempt) => attempt.correct).length;
      const meta = TOPICS.find((item) => item.id === topic);
      return {
        topic,
        title: meta?.title ?? topic,
        attempted: answered.length,
        correct,
        total: inBank.length,
        accuracy: percent(correct, answered.length),
      };
    })
    .filter((item): item is TopicStat => item !== null && item.total > 0);
}

export function overallStats(bank: QuestionSummary[], attempts: Attempt[]): {
  attempted: number;
  correct: number;
  accuracy: number;
  total: number;
} {
  const latest = latestByQuestion(attempts);
  const ids = new Set(bank.map((item) => item.id));
  const answered = [...latest.values()].filter((attempt) => ids.has(attempt.questionId));
  const correct = answered.filter((attempt) => attempt.correct).length;
  return {
    attempted: answered.length,
    correct,
    accuracy: percent(correct, answered.length),
    total: bank.length,
  };
}

export function weakestTopics(stats: TopicStat[], limit = 3): TopicStat[] {
  return stats
    .filter((topic) => topic.attempted > 0 && topic.accuracy < 100)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted)
    .slice(0, limit);
}
