"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConceptLesson } from "@/components/ConceptLesson";
import { EmptyBank } from "@/components/EmptyBank";
import { QuestionView } from "@/components/QuestionView";
import { useExplanation } from "@/components/useExplanation";
import { loadProgress, recordAttempt } from "@/lib/progress";
import { mulberry32 } from "@/lib/random";
import { buildWeakDrill, type WeakDrillBlock } from "@/lib/weak";
import type { Question } from "@/lib/types";

export function WeakSession({ questions }: { questions: Question[] }) {
  const [blocks, setBlocks] = useState<WeakDrillBlock[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState<Record<string, boolean>>({});
  const [session, setSession] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    setBlocks(buildWeakDrill(questions, loadProgress().attempts, mulberry32(Date.now() % 100000)));
  }, [questions]);

  const drill = blocks?.flatMap((block) => block.questions) ?? [];
  const question = drill[index] ?? null;
  const explanation = useExplanation(question, locked);
  const blockKey = question ? `${question.topic}/${question.subtopic}` : "";
  const block = blocks?.find((item) => `${item.topic}/${item.subtopic}` === blockKey);

  useEffect(() => {
    if (!locked) return;
    document.getElementById("feedback")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [locked, index]);

  function check() {
    if (!question || !selected || locked) return;
    const correct = selected === question.correctAnswer;
    recordAttempt({
      questionId: question.id,
      topic: question.topic,
      subtopic: question.subtopic,
      correct,
      chosen: selected,
      mode: "practice",
      at: Date.now(),
    });
    setSession((current) => ({ ...current, [question.id]: correct }));
    setLocked(true);
  }

  function go(nextIndex: number) {
    setIndex(nextIndex);
    setSelected(null);
    setLocked(false);
  }

  if (!blocks) {
    return (
      <div className="page">
        <div className="narrow">
          <p className="muted">Building a drill from your saved results…</p>
        </div>
      </div>
    );
  }

  if (drill.length === 0) {
    return (
      <div className="page">
        <div className="narrow">
          <h1>Train weak spots</h1>
          <EmptyBank detail="No questions loaded with a stored answer. A draft can still be opened in topic practice. The drill starts once an answer is stored." />
          <Link className="btn ghost" href="/">
            Back to topics
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    const correctCount = Object.values(session).filter(Boolean).length;
    const total = Object.keys(session).length;
    return (
      <div className="page">
        <div className="narrow">
          <p className="kicker">Weak-spot drill</p>
          <div className="card score-hero">
            <strong>
              {correctCount}/{total}
            </strong>
            <p>These results are saved with the rest of your progress, by topic and subtopic.</p>
            <div className="row-actions">
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setDone(false);
                  setSession({});
                  setStarted({});
                  setBlocks(buildWeakDrill(questions, loadProgress().attempts, Math.random));
                  go(0);
                }}
              >
                Drill again
              </button>
              <Link className="btn ghost" href="/strategy">
                Study plan
              </Link>
              <Link className="btn ghost" href="/progress">
                Mastery
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="narrow">
        <div className="question-head">
          <div>
            <p className="kicker">
              Question {index + 1} of {drill.length}
            </p>
            <h1>Train weak spots</h1>
          </div>
          <p className="muted">
            {Object.values(session).filter(Boolean).length}/{Object.keys(session).length || 0} this drill
          </p>
        </div>
        <p className="syllabus">
          More questions come from the concepts you score lowest. Each concept starts with a short lesson.
        </p>
        {question && block && !started[blockKey] ? (
          <ConceptLesson
            topic={question.topic}
            subtopic={question.subtopic}
            onStart={() => setStarted((current) => ({ ...current, [blockKey]: true }))}
            onBack={index > 0 ? () => go(index - 1) : undefined}
          />
        ) : null}
        {question && started[blockKey] ? (
          <QuestionView
            question={question}
            selected={selected}
            locked={locked}
            onSelect={setSelected}
            generated={explanation.generated}
            generating={explanation.generating}
            unavailable={explanation.unavailable}
          />
        ) : null}
        {started[blockKey] ? (
          <div className="row-actions">
            <button className="btn ghost" type="button" disabled={index === 0} onClick={() => go(index - 1)}>
              Previous
            </button>
            {locked ? (
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  if (index + 1 >= drill.length) setDone(true);
                  else go(index + 1);
                }}
              >
                {index + 1 >= drill.length ? "See score" : "Next question"}
              </button>
            ) : (
              <button className="btn primary" type="button" disabled={!selected} onClick={check}>
                Check answer
              </button>
            )}
          </div>
        ) : null}
        {block ? (
          <p className="source-line">
            {block.title}
            {block.attempted > 0 ? ` · ${block.accuracy}% on your latest tries` : " · not started yet"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
