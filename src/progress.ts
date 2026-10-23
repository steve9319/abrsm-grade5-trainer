import { MOCK_SECTIONS, TOPICS, type TopicId } from './questions/types';

export interface TopicStats {
  attempted: number;
  correct: number;
}

export interface SectionScore {
  title: string;
  correct: number;
  total: number;
}

export interface MockResult {
  at: string;
  correct: number;
  total: number;
  band: string;
  sections: SectionScore[];
}

export interface Learner {
  topics: Record<TopicId, TopicStats>;
  mocks: MockResult[];
}

interface Store {
  active: string;
  learners: Record<string, Learner>;
}

const STORAGE_KEY = 'abrsm-g5-trainer-v1';

function emptyTopics(): Record<TopicId, TopicStats> {
  return Object.fromEntries(TOPICS.map((topic) => [topic.id, { attempted: 0, correct: 0 }])) as Record<TopicId, TopicStats>;
}

export function emptyLearner(): Learner {
  return { topics: emptyTopics(), mocks: [] };
}

function emptyStore(): Store {
  return { active: 'Me', learners: { Me: emptyLearner() } };
}

function normalise(raw: Store): Store {
  const learners: Record<string, Learner> = {};
  for (const [name, learner] of Object.entries(raw.learners ?? {})) {
    const topics = emptyTopics();
    for (const topic of TOPICS) {
      const stats = learner.topics?.[topic.id];
      topics[topic.id] = {
        attempted: stats?.attempted ?? 0,
        correct: stats?.correct ?? 0,
      };
    }
    learners[name] = { topics, mocks: learner.mocks ?? [] };
  }
  if (Object.keys(learners).length === 0) return emptyStore();
  const active = learners[raw.active] ? raw.active : (Object.keys(learners)[0] as string);
  return { active, learners };
}

export function loadStore(): Store {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyStore();
    return normalise(JSON.parse(saved) as Store);
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function recordAnswer(store: Store, topic: TopicId, correct: boolean): Store {
  const learner = store.learners[store.active] ?? emptyLearner();
  const stats = learner.topics[topic];
  const next: Learner = {
    ...learner,
    topics: {
      ...learner.topics,
      [topic]: {
        attempted: stats.attempted + 1,
        correct: stats.correct + (correct ? 1 : 0),
      },
    },
  };
  return { ...store, learners: { ...store.learners, [store.active]: next } };
}

export function recordMock(store: Store, result: MockResult): Store {
  const learner = store.learners[store.active] ?? emptyLearner();
  const next: Learner = { ...learner, mocks: [result, ...learner.mocks].slice(0, 12) };
  return { ...store, learners: { ...store.learners, [store.active]: next } };
}

export function examBand(correct: number, total: number): string {
  if (total <= 0) return 'Below pass';
  const ratio = correct / total;
  if (ratio >= 65 / 75) return 'Distinction';
  if (ratio >= 60 / 75) return 'Merit';
  if (ratio >= 50 / 75) return 'Pass';
  return 'Below pass';
}

export function percent(correct: number, attempted: number): number {
  if (attempted <= 0) return 0;
  return Math.round((correct / attempted) * 100);
}

export const MOCK_LENGTH = MOCK_SECTIONS.reduce((sum, section) => sum + section.count, 0);
