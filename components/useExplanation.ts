"use client";

import { useEffect, useState } from "react";
import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";
import { questionContentHash } from "@/lib/hash";
import { cacheExplanation, loadProgress } from "@/lib/progress";
import type { ExplanationCacheEntry, Question } from "@/lib/types";

export function useExplanation(question: Question | null, enabled: boolean) {
  const [generated, setGenerated] = useState<ExplanationCacheEntry | null>(null);
  const [generating, setGenerating] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const questionId = question?.id;

  useEffect(() => {
    if (!question || !enabled) {
      setGenerating(false);
      return;
    }
    const missing =
      !question.explanation.trim() || question.options.some((option) => !option.explanation.trim());
    if (!missing) {
      setGenerated(null);
      setUnavailable(false);
      setGenerating(false);
      return;
    }

    const hash = questionContentHash(question);
    const cached = loadProgress().explanationCache[question.id];
    if (cached && cached.hash === hash) {
      setGenerated(cached);
      setUnavailable(false);
      setGenerating(false);
      return;
    }

    let cancelled = false;
    setGenerating(true);
    setUnavailable(false);
    setGenerated(null);

    (async () => {
      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: question.id,
            topic: question.topic,
            question: question.question,
            notation: question.notation,
            options: question.options.map((option) => ({ id: option.id, text: option.text })),
            correctAnswer: question.correctAnswer,
          }),
        });
        const body = (await response.json()) as {
          available?: boolean;
          explanation?: string;
          optionExplanations?: Record<string, string>;
          model?: string;
        };
        if (cancelled) return;
        if (body.available && body.explanation?.trim()) {
          const entry: ExplanationCacheEntry = {
            hash,
            explanation: body.explanation.trim(),
            optionExplanations: body.optionExplanations ?? {},
            model: body.model ?? "claude",
            at: Date.now(),
          };
          cacheExplanation(question.id, entry);
          setGenerated(entry);
        } else {
          setUnavailable(true);
        }
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [question, questionId, enabled]);

  return { generated, generating, unavailable, unavailableText: EXPLANATION_UNAVAILABLE_TEXT };
}
