"use client";

import { useEffect, useState } from "react";
import { cacheLesson, loadProgress } from "@/lib/progress";
import { conceptTitle, fallbackLesson } from "@/lib/lessons";

export function ConceptLesson({
  topic,
  subtopic,
  onStart,
  onBack,
}: {
  topic: string;
  subtopic: string;
  onStart: () => void;
  onBack?: () => void;
}) {
  const fallback = fallbackLesson(topic, subtopic);
  const [text, setText] = useState(fallback);
  const [fromClaude, setFromClaude] = useState(false);
  const title = conceptTitle(topic, subtopic);

  useEffect(() => {
    const cached = loadProgress().lessonCache[`${topic}/${subtopic}`];
    if (cached?.lesson.trim()) {
      setText(cached.lesson.trim());
      setFromClaude(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/lesson", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ topic, subtopic, title }),
        });
        const body = (await response.json()) as { available?: boolean; lesson?: string; model?: string };
        if (cancelled || !body.available || !body.lesson?.trim()) return;
        cacheLesson(topic, subtopic, {
          lesson: body.lesson.trim(),
          model: body.model ?? "claude",
          at: Date.now(),
        });
        setText(body.lesson.trim());
        setFromClaude(true);
      } catch {
        // The built-in lesson stays on screen.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topic, subtopic, title]);

  return (
    <section className="card lesson-card">
      <p className="kicker">Concept lesson</p>
      <h2>{title}</h2>
      <p>{text}</p>
      <p className="generated-note">
        {fromClaude
          ? "Lesson generated with Claude and saved in this browser."
          : "Short lesson from the built-in notes. A Claude lesson is saved here once ANTHROPIC_API_KEY is set."}
      </p>
      <div className="row-actions">
        {onBack ? (
          <button className="btn ghost" type="button" onClick={onBack}>
            Previous
          </button>
        ) : null}
        <button className="btn primary" type="button" onClick={onStart}>
          Practise this concept
        </button>
      </div>
    </section>
  );
}
