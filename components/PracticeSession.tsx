"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QuestionView } from "@/components/QuestionView";
import { useExplanation } from "@/components/useExplanation";
import { loadProgress, recordAttempt } from "@/lib/progress";
import { topicStats, weakestTopics } from "@/lib/stats";
import { TOPICS } from "@/lib/topics";
import type { Question, QuestionSummary } from "@/lib/types";

export function PracticeSession({
  questions,
  title,
  blurb,
  syllabus,
}: {
  questions: Question[];
  title: string;
  blurb: string;
  syllabus: string;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [session, setSession] = useState<Record<string, boolean>>({});
  const question = questions[index] ?? null;
  const explanation = useExplanation(question, locked);

  useEffect(() => {
    if (!locked) return;
    document.getElementById("feedback")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [locked, index]);

  function check() {
    if (!question || !selected || locked) return;
    if (!question.correctAnswer.trim()) {
      setLocked(true);
      return;
    }
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

  if (questions.length === 0) {
    return (
      <div className="page">
        <div className="narrow">
          <h1>{title}</h1>
          <p className="empty">No questions in this topic yet.</p>
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
    const bank: QuestionSummary[] = questions.map((item) => ({
      id: item.id,
      topic: item.topic,
      subtopic: item.subtopic,
    }));
    const weak = weakestTopics(topicStats(bank, loadProgress().attempts));
    return (
      <div className="page">
        <div className="narrow">
          <p className="kicker">Practice summary</p>
          <div className="card score-hero">
            <strong>
              {correctCount}/{total || questions.length}
            </strong>
            <p>
              {title}: {correctCount} correct in this round.
            </p>
            <div className="row-actions">
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setDone(false);
                  setSession({});
                  go(0);
                }}
              >
                Try this topic again
              </button>
              <Link className="btn ghost" href="/exam">
                Sit a mock paper
              </Link>
              <Link className="btn ghost" href="/progress">
                All progress
              </Link>
            </div>
          </div>
          {weak.length > 0 ? (
            <section className="section">
              <h2>Needs work</h2>
              <div className="topic-grid">
                {weak.map((topic) => (
                  <Link key={topic.topic} href={`/practice/${topic.topic}`} className="topic-card">
                    <span className="topic-index">{topic.accuracy}%</span>
                    <span>
                      <h3>{TOPICS.find((item) => item.id === topic.topic)?.title ?? topic.title}</h3>
                      <p>
                        {topic.correct} of {topic.attempted} correct.
                      </p>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
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
              Question {index + 1} of {questions.length}
            </p>
            <h1>{title}</h1>
          </div>
          <p className="muted">
            {Object.values(session).filter(Boolean).length}/{Object.keys(session).length || 0} this round
          </p>
        </div>
        <p className="syllabus">{blurb} {syllabus}</p>
        {question ? (
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
        <div className="row-actions">
          <button className="btn ghost" type="button" disabled={index === 0} onClick={() => go(index - 1)}>
            Previous
          </button>
          {locked ? (
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                if (index + 1 >= questions.length) setDone(true);
                else go(index + 1);
              }}
            >
              {index + 1 >= questions.length ? "See score" : "Next question"}
            </button>
          ) : (
            <button className="btn primary" type="button" disabled={!selected} onClick={check}>
              Check answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
