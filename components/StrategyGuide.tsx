"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/progress";
import { topicStats } from "@/lib/stats";
import { studyPlan, PAPER_MARKS, PAPER_MINUTES, PAPER_SECTIONS, PASS_BANDS, PASS_MARK, MERIT_MARK, DISTINCTION_MARK } from "@/lib/strategy";
import { topicMeta } from "@/lib/topics";
import type { QuestionSummary, ProgressState } from "@/lib/types";
import type { StudySlot } from "@/lib/strategy";

export function StrategyGuide({ bank }: { bank: QuestionSummary[] }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const plan: StudySlot[] = studyPlan(topicStats(bank, progress?.attempts ?? []));
  const anyAttempt = (progress?.attempts.length ?? 0) > 0;

  return (
    <div className="page">
      <div className="narrow">
        <p className="kicker">Grade 5 Music Theory</p>
        <h1>Pass strategy</h1>
        <p className="lede">
          The written paper is {PAPER_MINUTES / 60} hours and {PAPER_MARKS} marks. Pass is {PASS_MARK}, merit is{" "}
          {MERIT_MARK}, and distinction is {DISTINCTION_MARK}. The mock in this app is a shorter rehearsal, not a copy of
          that paper.
        </p>

        <section className="section">
          <h2>Result bands</h2>
          <table className="mark-table">
            <thead>
              <tr>
                <th>Result</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {PASS_BANDS.map((band) => (
                <tr key={band.name}>
                  <td>{band.name}</td>
                  <td>{band.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section">
          <h2>Where the marks sit</h2>
          <p className="section-intro">
            Seven sections. Keys and scales carry 15 marks. Each of the others carries 10. The piano practical set in
            this app is not on the theory paper.
          </p>
          <table className="mark-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Marks</th>
                <th>Suggested time</th>
              </tr>
            </thead>
            <tbody>
              {PAPER_SECTIONS.map((section) => (
                <tr key={section.id}>
                  <td>{section.title}</td>
                  <td>{section.marks}</td>
                  <td>{section.minutes} min</td>
                </tr>
              ))}
              <tr>
                <td>Check through</td>
                <td>—</td>
                <td>15 min</td>
              </tr>
            </tbody>
          </table>
          <p className="muted">
            14 minutes for each 10-mark section, 21 minutes for keys and scales, and 15 minutes to check comes to two
            hours. That split is a study plan, not an official clock.
          </p>
        </section>

        <section className="section">
          <h2>How to spend the two hours</h2>
          <div className="breakdown">
            {PAPER_SECTIONS.map((section) => (
              <div key={section.id}>
                <span>{section.title}</span>
                <span>{section.minutes} min</span>
              </div>
            ))}
            <div>
              <span>Read back answers and fix slips</span>
              <span>15 min</span>
            </div>
          </div>
          <p className="section-intro">
            If a section is finished early, bank the spare minutes for keys and scales or for the check. Do not sit on a
            single cadence while the rest of the paper is blank.
          </p>
        </section>

        <section className="section">
          <h2>Tips by section</h2>
          {PAPER_SECTIONS.map((section) => (
            <article key={section.id} className="card tip-card">
              <h3>
                {section.title}{" "}
                <span className="muted">
                  {section.marks} marks
                </span>
              </h3>
              <ul className="tip-list">
                {section.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <p className="topic-meta">
                {section.topics.map((topic, index) => (
                  <span key={topic}>
                    {index > 0 ? " · " : ""}
                    <Link href={`/practice/${topic}`}>{topicMeta(topic)?.title ?? topic}</Link>
                  </span>
                ))}
              </p>
            </article>
          ))}
        </section>

        <section className="section">
          <h2>Your next hour</h2>
          <p className="section-intro">
            {progress === null
              ? "Loading saved results…"
              : anyAttempt
                ? "This hour is weighted towards the sections you are scoring lowest, with extra time where the paper itself is worth more."
                : "Nothing is saved on this device yet, so the hour follows the mark scheme. Keys and scales get the longest block."}
          </p>
          {progress === null ? null : (
            <div className="breakdown">
              {plan.map((slot) => (
                <div key={slot.id}>
                  <span>
                    <strong>{slot.title}</strong>
                    <span className="muted"> · {slot.reason}</span>
                    <span className="topic-meta">
                      {slot.topics.map((topic, index) => (
                        <span key={topic}>
                          {index > 0 ? " · " : ""}
                          <Link href={`/practice/${topic}`}>{topicMeta(topic)?.title ?? topic}</Link>
                        </span>
                      ))}
                    </span>
                  </span>
                  <span>{slot.minutes} min</span>
                </div>
              ))}
            </div>
          )}
          <div className="row-actions">
            <Link className="btn primary" href="/practice/weak">
              Train weak spots
            </Link>
            <Link className="btn ghost" href="/progress">
              Mastery dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
