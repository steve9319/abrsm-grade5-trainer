"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyBank } from "@/components/EmptyBank";
import { QuestionView } from "@/components/QuestionView";
import { useExplanation } from "@/components/useExplanation";
import { cn } from "@/lib/cn";
import {
  EXAM_MINUTES,
  EXAM_SECONDS,
  examQuestionCount,
  formatClock,
  pickExamQuestions,
  scoreAnswers,
} from "@/lib/exam";
import { loadProgress, recordExam } from "@/lib/progress";
import { mulberry32 } from "@/lib/random";
import { topicMeta } from "@/lib/topics";
import type { Question } from "@/lib/types";

const STORAGE_KEY = "abrsm-g5-exam-v1";

interface StoredExam {
  id: string;
  startedAt: number;
  questionIds: string[];
  answers: Record<string, string>;
  submittedAt: number | null;
  recorded: boolean;
}

export function ExamSession({ questions }: { questions: Question[] }) {
  const byId = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const [session, setSession] = useState<StoredExam | null>(null);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [review, setReview] = useState(false);
  const recordedRef = useRef(false);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredExam;
        if (parsed.questionIds?.length && parsed.questionIds.every((id) => byId.has(id))) {
          setSession(parsed);
          recordedRef.current = Boolean(parsed.recorded);
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setNow(Date.now());
    setReady(true);
  }, [byId]);

  useEffect(() => {
    if (!session) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!session || session.submittedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [session]);

  const paper = session
    ? session.questionIds.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question))
    : [];
  const current = paper[index] ?? null;
  const remaining = session ? EXAM_SECONDS - Math.floor((now - session.startedAt) / 1000) : EXAM_SECONDS;
  const submitted = Boolean(session?.submittedAt);
  const explanation = useExplanation(current, submitted && review);
  const count = examQuestionCount(questions);

  function start() {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1_000_000_000)) >>> 0;
    const picked = pickExamQuestions(questions, mulberry32(seed));
    recordedRef.current = false;
    setIndex(0);
    setReview(false);
    setConfirming(false);
    setNow(Date.now());
    setSession({
      id: crypto.randomUUID(),
      startedAt: Date.now(),
      questionIds: picked.map((question) => question.id),
      answers: {},
      submittedAt: null,
      recorded: false,
    });
  }

  function finish(auto = false) {
    if (!session || session.submittedAt || recordedRef.current) return;
    const unanswered = paper.filter((question) => !session.answers[question.id]).length;
    if (!auto && unanswered > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    const submittedAt = Date.now();
    const scored = scoreAnswers(paper, session.answers);
    const secondsUsed = Math.min(
      EXAM_SECONDS,
      Math.max(0, Math.round((submittedAt - session.startedAt) / 1000)),
    );
    recordedRef.current = true;
    const alreadySaved = loadProgress().exams.some((exam) => exam.id === session.id);
    if (!alreadySaved) recordExam(
      {
        id: session.id,
        at: submittedAt,
        score: scored.score,
        total: scored.total,
        secondsUsed,
        byTopic: scored.byTopic,
      },
      scored.rows.map((row) => ({
        questionId: row.question.id,
        topic: row.question.topic,
        subtopic: row.question.subtopic,
        correct: row.correct,
        chosen: row.chosen ?? "",
        mode: "exam" as const,
        at: submittedAt,
      })),
    );
    setConfirming(false);
    setReview(false);
    setSession({ ...session, submittedAt, recorded: true });
  }

  useEffect(() => {
    if (!session || session.submittedAt || remaining > 0 || autoSubmitted.current) return;
    autoSubmitted.current = true;
    finish(true);
  });

  function reset() {
    sessionStorage.removeItem(STORAGE_KEY);
    recordedRef.current = false;
    setSession(null);
    setReview(false);
    setIndex(0);
    setConfirming(false);
  }

  if (!ready) {
    return (
      <div className="page">
        <div className="narrow">
          <p className="muted">Preparing the paper…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page">
        <div className="narrow">
          <p className="kicker">Timed mock</p>
          <h1>Grade 5 theory paper</h1>
          {count === 0 ? (
            <EmptyBank detail="No questions loaded with a stored answer. The mock draws a paper-shaped set from your private bank once those answers are stored. Drafts stay in topic practice." />
          ) : (
            <>
              <p className="lede">
                {count} {count === 1 ? "question" : "questions"} drawn from your papers in the shape of
                the Grade 5 theory paper, and {EXAM_MINUTES} minutes on the clock. You can move around
                the paper. Marking appears when you submit or when the time runs out.
              </p>
              <p className="syllabus">
                A 10-mark section contributes up to two questions. Keys and scales, worth 15, contributes
                up to three. Sections with nothing in the private bank are left out. The practical set
                stays in practice mode.
              </p>
              <div className="row-actions">
                <button className="btn primary" type="button" onClick={start}>
                  Start the paper
                </button>
                <Link className="btn ghost" href="/#topics">
                  Practise first
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const scored = scoreAnswers(paper, session.answers);
  const unanswered = paper.filter((question) => !session.answers[question.id]).length;

  if (submitted && !review) {
    const weak = scored.byTopic
      .filter((topic) => topic.total > 0 && topic.score < topic.total)
      .sort((a, b) => a.score / a.total - b.score / b.total);
    return (
      <div className="page">
        <div className="narrow">
          <p className="kicker">Mock result</p>
          <div className="card score-hero">
            <strong>
              {scored.score}/{scored.total}
            </strong>
            <p>
              {Math.round((scored.score / Math.max(scored.total, 1)) * 100)}% in{" "}
              {formatClock(Math.min(EXAM_SECONDS, Math.round(((session.submittedAt ?? now) - session.startedAt) / 1000)))}.
            </p>
            <div className="breakdown">
              {scored.byTopic.map((topic) => (
                <div key={topic.topic}>
                  <span>{topicMeta(topic.topic)?.title ?? topic.topic}</span>
                  <span>
                    {topic.score}/{topic.total}
                  </span>
                </div>
              ))}
            </div>
            <div className="row-actions">
              <button className="btn primary" type="button" onClick={() => { setReview(true); setIndex(0); }}>
                Review answers
              </button>
              <button className="btn ghost" type="button" onClick={reset}>
                New paper
              </button>
              <Link className="btn ghost" href="/progress">
                Progress
              </Link>
            </div>
          </div>
          {weak.length > 0 ? (
            <section className="section">
              <h2>Needs work</h2>
              <div className="topic-grid">
                {weak.slice(0, 3).map((topic) => (
                  <Link key={topic.topic} href={`/practice/${topic.topic}`} className="topic-card">
                    <span className="topic-index">
                      {topic.score}/{topic.total}
                    </span>
                    <span>
                      <h3>{topicMeta(topic.topic)?.title ?? topic.topic}</h3>
                      <p>Practise this topic before the next paper.</p>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <p className="section-intro">Every topic on this paper was secure.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="narrow">
        <div className="exam-bar">
          <div>
            <p className="kicker">{submitted ? "Review" : "Mock paper"}</p>
            <p className="muted" style={{ margin: 0 }}>
              Question {index + 1} of {paper.length}
              {submitted ? "" : ` · ${unanswered} blank`}
            </p>
          </div>
          <p className={cn("timer", !submitted && remaining < 300 && "warning")} aria-live="polite">
            {submitted ? "Marked" : formatClock(remaining)}
          </p>
        </div>
        <div className="dots" role="navigation" aria-label="Questions">
          {paper.map((question, dotIndex) => {
            const chosen = session.answers[question.id];
            const correct = submitted && chosen === question.correctAnswer;
            const wrong = submitted && chosen && chosen !== question.correctAnswer;
            return (
              <button
                key={question.id}
                type="button"
                className={cn(
                  "nav-dot",
                  index === dotIndex && "current",
                  !submitted && chosen && "answered",
                  correct && "good",
                  wrong && "bad",
                )}
                aria-label={`Question ${dotIndex + 1}`}
                aria-current={index === dotIndex ? "true" : undefined}
                onClick={() => setIndex(dotIndex)}
              >
                {dotIndex + 1}
              </button>
            );
          })}
        </div>
        {current ? (
          <QuestionView
            question={current}
            selected={session.answers[current.id] ?? null}
            locked={submitted}
            onSelect={(optionId) => {
              if (submitted) return;
              setSession({
                ...session,
                answers: { ...session.answers, [current.id]: optionId },
              });
            }}
            generated={explanation.generated}
            generating={explanation.generating}
            unavailable={explanation.unavailable}
          />
        ) : null}
        {confirming ? (
          <div className="confirm">
            <p>
              {unanswered} {unanswered === 1 ? "question is" : "questions are"} still blank. Submit the paper anyway?
            </p>
            <div className="row-actions">
              <button className="btn primary" type="button" onClick={() => finish(true)}>
                Submit anyway
              </button>
              <button className="btn ghost" type="button" onClick={() => setConfirming(false)}>
                Keep going
              </button>
            </div>
          </div>
        ) : null}
        <div className="row-actions">
          <button className="btn ghost" type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Previous
          </button>
          {index + 1 < paper.length ? (
            <button className="btn ghost" type="button" onClick={() => setIndex(index + 1)}>
              Next
            </button>
          ) : null}
          {submitted ? (
            <button className="btn primary" type="button" onClick={() => setReview(false)}>
              Back to score
            </button>
          ) : (
            <button className="btn primary" type="button" onClick={() => finish(false)}>
              Submit paper
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
