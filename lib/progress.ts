import type { Attempt, ExamRecord, ExplanationCacheEntry, ProgressState } from "@/lib/types";

export const PROGRESS_KEY = "abrsm-g5-progress-v1";

export const EMPTY_PROGRESS: ProgressState = {
  attempts: [],
  exams: [],
  explanationCache: {},
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadProgress(): ProgressState {
  const store = storage();
  if (!store) return { ...EMPTY_PROGRESS, explanationCache: {} };
  try {
    const raw = store.getItem(PROGRESS_KEY);
    if (!raw) return { ...EMPTY_PROGRESS, explanationCache: {} };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
      explanationCache:
        parsed.explanationCache && typeof parsed.explanationCache === "object"
          ? parsed.explanationCache
          : {},
    };
  } catch {
    return { ...EMPTY_PROGRESS, explanationCache: {} };
  }
}

export function saveProgress(progress: ProgressState): void {
  const store = storage();
  if (!store) return;
  const attempts = progress.attempts.slice(-2000);
  store.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, attempts }));
}

export function recordAttempt(attempt: Attempt): ProgressState {
  const progress = loadProgress();
  progress.attempts = [...progress.attempts, attempt].slice(-2000);
  saveProgress(progress);
  return progress;
}

export function recordExam(exam: ExamRecord, attempts: Attempt[]): ProgressState {
  const progress = loadProgress();
  progress.exams = [...progress.exams, exam].slice(-50);
  progress.attempts = [...progress.attempts, ...attempts].slice(-2000);
  saveProgress(progress);
  return progress;
}

export function cacheExplanation(questionId: string, entry: ExplanationCacheEntry): ProgressState {
  const progress = loadProgress();
  progress.explanationCache = { ...progress.explanationCache, [questionId]: entry };
  saveProgress(progress);
  return progress;
}

export function clearProgress(): void {
  const store = storage();
  if (!store) return;
  store.removeItem(PROGRESS_KEY);
}
