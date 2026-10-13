import type { Attempt, Question } from "@/lib/types";
import { conceptTitle } from "@/lib/lessons";
import { shuffle } from "@/lib/random";
import { conceptStats, type ConceptStat } from "@/lib/stats";

export interface WeakDrillBlock {
  topic: string;
  subtopic: string;
  title: string;
  accuracy: number;
  attempted: number;
  questions: Question[];
}

function quota(stat: ConceptStat): number {
  if (stat.attempted === 0) return 2;
  if (stat.accuracy < 50) return 4;
  if (stat.accuracy < 80) return 3;
  return 1;
}

function rankConcepts(stats: ConceptStat[], rng: () => number): ConceptStat[] {
  const weak = stats
    .filter((stat) => stat.attempted > 0 && stat.accuracy < 80)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted || a.subtopic.localeCompare(b.subtopic));
  const fresh = shuffle(
    stats.filter((stat) => stat.attempted === 0),
    rng,
  );
  const secure = stats
    .filter((stat) => stat.attempted > 0 && stat.accuracy >= 80)
    .sort((a, b) => a.accuracy - b.accuracy || a.subtopic.localeCompare(b.subtopic));
  return [...weak, ...fresh, ...secure];
}

function pickFromConcept(questions: Question[], attempts: Attempt[], stat: ConceptStat, rng: () => number): Question[] {
  const pool = questions.filter((question) => question.topic === stat.topic && question.subtopic === stat.subtopic);
  const latest = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const previous = latest.get(attempt.questionId);
    if (!previous || attempt.at >= previous.at) latest.set(attempt.questionId, attempt);
  }
  const wrong = shuffle(
    pool.filter((question) => latest.get(question.id)?.correct === false),
    rng,
  );
  const unseen = shuffle(
    pool.filter((question) => !latest.has(question.id)),
    rng,
  );
  const correct = shuffle(
    pool.filter((question) => latest.get(question.id)?.correct === true),
    rng,
  );
  return [...wrong, ...unseen, ...correct].slice(0, Math.min(quota(stat), pool.length));
}

/** Up to three concepts, with more questions from the lowest scores. Blocks stay grouped for the lesson card. */
export function buildWeakDrill(questions: Question[], attempts: Attempt[], rng: () => number): WeakDrillBlock[] {
  const summaries = questions.map((question) => ({
    id: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
  }));
  const ranked = rankConcepts(conceptStats(summaries, attempts, conceptTitle), rng);
  const blocks: WeakDrillBlock[] = [];
  for (const stat of ranked) {
    if (blocks.length >= 3) break;
    const picked = pickFromConcept(questions, attempts, stat, rng);
    if (picked.length === 0) continue;
    blocks.push({
      topic: stat.topic,
      subtopic: stat.subtopic,
      title: stat.title,
      accuracy: stat.accuracy,
      attempted: stat.attempted,
      questions: picked,
    });
  }
  return blocks;
}
