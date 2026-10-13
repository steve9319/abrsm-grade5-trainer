"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/progress";
import { overallStats, topicStats, weakestTopics } from "@/lib/stats";
import { TOPICS } from "@/lib/topics";
import { EmptyBank } from "@/components/EmptyBank";
import { EXAM_MINUTES } from "@/lib/exam";
import type { ProgressState, QuestionSummary } from "@/lib/types";

export function HomeDashboard({
  bank,
  draftCount = 0,
  examCount = 0,
}: {
  bank: QuestionSummary[];
  draftCount?: number;
  examCount?: number;
}) {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const attempts = progress?.attempts ?? [];
  const overall = overallStats(bank, attempts);
  const topics = topicStats(bank, attempts);
  const weak = progress ? weakestTopics(topics) : [];

  return (
    <div className="page">
      <div className="wrap">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Unofficial practice room</p>
            <h1>Grade 5 theory</h1>
            <p className="lede">
              The written paper pianists take before Grade 6. Practice comes from the papers you keep
              on this computer, then a timed mock in the shape of the Grade 5 paper.
            </p>
            <div className="actions">
              <a className="btn primary" href="#topics">
                Practise by topic
              </a>
              <Link className="btn ghost" href="/practice/weak">
                Train weak spots
              </Link>
              <Link className="btn ghost" href="/exam">
                Start a {EXAM_MINUTES}-minute mock
              </Link>
            </div>
          </div>
          <aside className="hero-aside">
            <div>
              <p className="stat-label">Questions in the bank</p>
              <p className="stat-value">{bank.length}</p>
            </div>
            <div>
              <p className="stat-label">Answered on this device</p>
              <p className="stat-value">{progress ? `${overall.attempted}` : "—"}</p>
              <p className="stat-note">
                {progress && overall.attempted > 0
                  ? `${overall.accuracy}% correct on the latest try`
                  : "Progress stays in this browser."}
              </p>
            </div>
            <div>
              <p className="stat-label">Mock papers</p>
              <p className="stat-value">{progress ? progress.exams.length : "—"}</p>
              <p className="stat-note">
                {examCount > 0
                  ? `${examCount} questions in the shape of the theory paper, ${EXAM_MINUTES} minutes.`
                  : "No questions loaded."}
              </p>
            </div>
          </aside>
        </section>

        <section className="section" id="topics">
          <h2>Topics</h2>
          {bank.length === 0 ? <EmptyBank /> : null}
          <p className="section-intro">
            Rhythm, pitch, keys, intervals, chords, transposition, terms, ornaments and music in
            context, plus a short piano aural and sight-reading set.{" "}
            <Link href="/practice/mixed">Mix the whole bank.</Link>
            {bank.length > 0
              ? ` ${bank.length} ${bank.length === 1 ? "question is" : "questions are"} loaded from your private papers.`
              : ""}
            {draftCount > 0
              ? ` ${draftCount} ${draftCount === 1 ? "does" : "do"} not have an answer yet, so ${draftCount === 1 ? "it stays" : "they stay"} in topic practice until one is stored.`
              : ""}
          </p>
          <div className="topic-grid">
            {TOPICS.map((topic, index) => {
              const stat = topics.find((item) => item.topic === topic.id);
              return (
                <Link key={topic.id} href={`/practice/${topic.id}`} className="topic-card">
                  <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <h3>
                      {topic.title}
                      {topic.id === "practical" ? <span className="tag">Practical</span> : null}
                    </h3>
                    <p>{topic.blurb}</p>
                    <span className="topic-meta">
                      {stat ? `${stat.total} questions` : "0 questions"}
                      {stat && stat.attempted > 0 ? ` · ${stat.correct}/${stat.attempted} correct` : ""}
                    </span>
                    {stat && stat.attempted > 0 ? (
                      <span className="bar" aria-hidden="true">
                        <span style={{ width: `${stat.accuracy}%` }} />
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section">
          <h2>Needs work</h2>
          <p className="section-intro">
            <Link href="/strategy">Pass strategy</Link> turns these results into an hour of study.{" "}
            <Link href="/progress">Mastery</Link> splits them by subtopic.
          </p>
          {weak.length === 0 ? (
            <p className="section-intro">
              Answer a few questions and the topics you miss most often will collect here.
            </p>
          ) : (
            <div className="topic-grid">
              {weak.map((topic) => (
                <Link key={topic.topic} href={`/practice/${topic.topic}`} className="topic-card">
                  <span className="topic-index">{topic.accuracy}%</span>
                  <span>
                    <h3>{topic.title}</h3>
                    <p>
                      {topic.correct} of {topic.attempted} correct on the latest try.
                    </p>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
