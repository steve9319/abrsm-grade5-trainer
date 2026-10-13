import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mulberry32 } from "@/lib/random";
import { masteryBand } from "@/lib/stats";
import { PAPER_SECTIONS, studyPlan } from "@/lib/strategy";
import type { Question } from "@/lib/types";
import type { TopicStat } from "@/lib/stats";
import { buildWeakDrill } from "@/lib/weak";

function question(id: string, topic: string, subtopic: string): Question {
  return {
    id,
    topic,
    subtopic,
    source: "original",
    question: id,
    options: [
      { id: "A", text: "Yes", explanation: "Yes." },
      { id: "B", text: "No", explanation: "No." },
    ],
    correctAnswer: "A",
    explanation: "Because.",
  };
}

function stat(topic: string, accuracy: number, attempted = 4): TopicStat {
  return {
    topic,
    title: topic,
    attempted,
    correct: Math.round((accuracy / 100) * attempted),
    total: 8,
    accuracy,
  };
}

describe("mastery and weak-spot drills", () => {
  it("bands a single perfect score as developing and two solid scores as secure", () => {
    assert.equal(masteryBand(0, 0), "not-started");
    assert.equal(masteryBand(2, 40), "learning");
    assert.equal(masteryBand(1, 100), "developing");
    assert.equal(masteryBand(5, 70), "developing");
    assert.equal(masteryBand(2, 80), "secure");
    assert.equal(masteryBand(2, 79), "developing");
  });

  it("serves more questions from the lower-scoring concept", () => {
    const questions = [
      ...[1, 2, 3, 4].map((n) => question(`chords-0${n}`, "chords", "cadences")),
      ...[1, 2, 3, 4].map((n) => question(`keys-0${n}`, "keys", "key-signatures")),
    ];
    const attempts = [
      ...questions
        .filter((item) => item.subtopic === "cadences")
        .map((item) => ({
          questionId: item.id,
          topic: item.topic,
          subtopic: item.subtopic,
          correct: false,
          chosen: "B",
          mode: "practice" as const,
          at: 10,
        })),
      ...questions
        .filter((item) => item.subtopic === "key-signatures")
        .map((item) => ({
          questionId: item.id,
          topic: item.topic,
          subtopic: item.subtopic,
          correct: true,
          chosen: "A",
          mode: "practice" as const,
          at: 20,
        })),
    ];
    const blocks = buildWeakDrill(questions, attempts, mulberry32(1));
    assert.equal(blocks[0]?.subtopic, "cadences");
    assert.equal(blocks[0]?.questions.length, 4);
    assert.equal(blocks[1]?.subtopic, "key-signatures");
    assert.equal(blocks[1]?.questions.length, 1);
    assert.ok(blocks[0]?.questions.length > (blocks[1]?.questions.length ?? 0));
  });

  it("still builds a drill when nothing has been attempted", () => {
    const questions = [
      question("rhythm-01", "rhythm", "compound-time"),
      question("rhythm-02", "rhythm", "compound-time"),
      question("pitch-01", "pitch", "alto-clef"),
      question("pitch-02", "pitch", "alto-clef"),
      question("keys-01", "keys", "relative-keys"),
      question("keys-02", "keys", "relative-keys"),
    ];
    const blocks = buildWeakDrill(questions, [], mulberry32(4));
    assert.equal(blocks.length, 3);
    assert.ok(blocks.every((block) => block.questions.length === 2));
  });
});

describe("study plan", () => {
  it("follows the mark scheme before any answers are saved", () => {
    const plan = studyPlan([]);
    assert.equal(
      plan.reduce((sum, slot) => sum + slot.minutes, 0),
      60,
    );
    const keys = plan.find((slot) => slot.id === "keys");
    const rhythm = plan.find((slot) => slot.id === "rhythm");
    assert.ok(keys && rhythm && keys.minutes > rhythm.minutes);
  });

  it("gives a weak 15-mark section more of the hour than the default plan", () => {
    const baseline = studyPlan([]);
    const topics = [...new Set(PAPER_SECTIONS.flatMap((section) => section.topics))];
    const stats = topics.map((topic) => stat(topic, topic === "keys" ? 0 : 100));
    const plan = studyPlan(stats);
    assert.equal(
      plan.reduce((sum, slot) => sum + slot.minutes, 0),
      60,
    );
    const keys = plan.find((slot) => slot.id === "keys");
    const baseKeys = baseline.find((slot) => slot.id === "keys");
    assert.ok(keys && baseKeys && keys.minutes > baseKeys.minutes);
    assert.match(keys.reason, /under 50%/);
  });

  it("gives a missed section more of the hour than a section that has not been tried", () => {
    const plan = studyPlan([stat("keys", 0, 2)]);
    const keys = plan.find((slot) => slot.id === "keys");
    const rhythm = plan.find((slot) => slot.id === "rhythm");
    assert.ok(keys && rhythm);
    assert.ok(keys.minutes >= rhythm.minutes + 4, `${keys.minutes} vs ${rhythm.minutes}`);
    assert.match(keys.reason, /under 50%/);
    assert.match(rhythm.reason, /Not tried yet/);
  });
});
