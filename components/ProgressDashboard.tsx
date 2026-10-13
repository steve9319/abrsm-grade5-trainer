"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyBank } from "@/components/EmptyBank";
import { clearProgress, loadProgress } from "@/lib/progress";
import { conceptTitle } from "@/lib/lessons";
import { conceptStats, MASTERY_LABELS, overallStats, topicStats, weakestTopics } from "@/lib/stats";
import { formatClock } from "@/lib/exam";
import { topicMeta } from "@/lib/topics";
import type { ProgressState, QuestionSummary } from "@/lib/types";

export function ProgressDashboard({ bank }: { bank: QuestionSummary[] }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) {
    return (
      <div className="page">
        <div className="narrow">
          <p className="muted">Loading saved progress…</p>
        </div>
      </div>
    );
  }

  const overall = overallStats(bank, progress.attempts);
  const topics = topicStats(bank, progress.attempts);
  const concepts = conceptStats(bank, progress.attempts, conceptTitle);
  const weak = weakestTopics(topics, 4);
  const byTopic = topics.map((topic) => ({
    ...topic,
    concepts: concepts.filter((concept) => concept.topic === topic.topic),
  }));

  return (
    <div className="page">
      <div className="narrow">
        <p className="kicker">This browser</p>
        <h1>Progress</h1>
        {bank.length === 0 ? <EmptyBank /> : null}
        <div className="card score-hero">
          <strong>{overall.attempted === 0 ? "—" : `${overall.accuracy}%`}</strong>
          <p>
            {overall.correct} correct out of {overall.attempted} questions attempted, from a bank of {overall.total}.
            Latest answer only: a retry replaces the older result.
          </p>
        </div>

        <section className="section">
          <h2>By topic</h2>
          <div className="breakdown">
            {topics.map((topic) => (
              <div key={topic.topic}>
                <span>
                  <Link href={`/practice/${topic.topic}`}>{topic.title}</Link>
                  <span className="muted">
                    {" "}
                    · {topic.attempted}/{topic.total} tried
                  </span>
                </span>
                <span>{topic.attempted === 0 ? "—" : `${topic.accuracy}%`}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Mastery</h2>
          <p className="section-intro">
            Latest answer for each question. Learning is under 50%. Developing is from 50% until you have two results at
            80% or better. Secure needs at least two attempts and 80%.
          </p>
          {byTopic.map((topic) => {
            const secure = topic.concepts.filter((concept) => concept.band === "secure").length;
            const learning = topic.concepts.filter((concept) => concept.band === "learning").length;
            return (
              <details key={topic.topic} className="concept-group">
                <summary>
                  {topic.title}
                  <span className="muted">
                    {" "}
                    · {secure} secure
                    {learning > 0 ? `, ${learning} learning` : ""}
                  </span>
                </summary>
                <div className="breakdown">
                  {topic.concepts.map((concept) => (
                    <div key={concept.subtopic}>
                      <span>
                        {concept.title}
                        <span className="muted">
                          {" "}
                          · {concept.attempted === 0 ? "not tried" : `${concept.correct}/${concept.attempted}`}
                        </span>
                      </span>
                      <span className={`band ${concept.band}`}>{MASTERY_LABELS[concept.band]}</span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
          <div className="row-actions">
            <Link className="btn primary" href="/practice/weak">
              Train weak spots
            </Link>
            <Link className="btn ghost" href="/strategy">
              Study plan
            </Link>
          </div>
        </section>

        <section className="section">
          <h2>Needs work</h2>
          {weak.length === 0 ? (
            <p className="section-intro">No weak topics yet. Miss a few, and they will show up here.</p>
          ) : (
            <div className="topic-grid">
              {weak.map((topic) => (
                <Link key={topic.topic} href={`/practice/${topic.topic}`} className="topic-card">
                  <span className="topic-index">{topic.accuracy}%</span>
                  <span>
                    <h3>{topic.title}</h3>
                    <p>
                      {topic.correct} of {topic.attempted} correct.
                    </p>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2>Mock papers</h2>
          {progress.exams.length === 0 ? (
            <p className="section-intro">
              No papers yet. <Link href="/exam">Start a timed mock.</Link>
            </p>
          ) : (
            <div className="breakdown">
              {[...progress.exams].reverse().map((exam) => (
                <div key={exam.id}>
                  <span>
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(exam.at)}
                    <span className="muted"> · {formatClock(exam.secondsUsed)}</span>
                  </span>
                  <span>
                    {exam.score}/{exam.total}
                  </span>
                </div>
              ))}
            </div>
          )}
          {progress.exams[0]?.byTopic ? (
            <p className="muted">
              Latest paper:{" "}
              {progress.exams[progress.exams.length - 1]?.byTopic
                .map((topic) => `${topicMeta(topic.topic)?.title ?? topic.topic} ${topic.score}/${topic.total}`)
                .join(", ")}
            </p>
          ) : null}
        </section>

        <div className="row-actions">
          {confirming ? (
            <>
              <button
                className="btn danger"
                type="button"
                onClick={() => {
                  clearProgress();
                  setProgress(loadProgress());
                  setConfirming(false);
                }}
              >
                Clear saved progress
              </button>
              <button className="btn ghost" type="button" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn ghost" type="button" onClick={() => setConfirming(true)}>
              Reset this browser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
