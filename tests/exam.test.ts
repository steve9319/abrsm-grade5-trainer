import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { examQuestionCount, formatClock, pickExamQuestions, scoreAnswers, sectionQuestionQuota } from "@/lib/exam";
import { mulberry32 } from "@/lib/random";
import { PAPER_SECTIONS } from "@/lib/strategy";
import type { Question } from "@/lib/types";

function question(id: string, topic: string): Question {
  return {
    id,
    topic,
    subtopic: "from-paper",
    source: "My papers",
    question: id,
    options: [
      { id: "A", text: "Yes", explanation: "Yes." },
      { id: "B", text: "No", explanation: "No." },
    ],
    correctAnswer: "A",
    explanation: "Because.",
    private: true,
  };
}

function bank(): Question[] {
  const topics = ["rhythm", "pitch", "transposition", "keys", "intervals", "chords", "terms", "ornaments", "context", "practical"];
  return topics.flatMap((topic) => [1, 2, 3, 4].map((n) => question(`${topic}-${n}`, topic)));
}

describe("mock paper", () => {
  it("draws a paper-shaped set from the private bank and leaves the practical set out", () => {
    const questions = bank();
    const first = pickExamQuestions(questions, mulberry32(5));
    const second = pickExamQuestions(questions, mulberry32(5));
    assert.deepEqual(
      first.map((item) => item.id),
      second.map((item) => item.id),
    );
    assert.equal(first.filter((item) => item.topic === "practical").length, 0);
    let expected = 0;
    for (const section of PAPER_SECTIONS) {
      const quota = sectionQuestionQuota(section.marks);
      const drawn = first.filter((item) => section.topics.includes(item.topic));
      assert.equal(drawn.length, quota, section.id);
      expected += quota;
    }
    assert.equal(first.length, expected);
    assert.equal(sectionQuestionQuota(10), 2);
    assert.equal(sectionQuestionQuota(15), 3);
    assert.equal(examQuestionCount(questions), expected);
  });

  it("uses only the questions a section actually has", () => {
    const thin = [question("rhythm-1", "rhythm"), question("keys-1", "keys")];
    const paper = pickExamQuestions(thin, mulberry32(1));
    assert.deepEqual(
      paper.map((item) => item.id).sort(),
      ["keys-1", "rhythm-1"],
    );
    assert.equal(examQuestionCount([]), 0);
    assert.equal(pickExamQuestions([], mulberry32(1)).length, 0);
  });

  it("scores only the chosen option and formats the clock", () => {
    const paper = bank().slice(0, 3);
    const [one, two, three] = paper;
    assert.ok(one && two && three);
    const scored = scoreAnswers(paper, {
      [one.id]: one.correctAnswer,
      [two.id]: two.options.find((option) => option.id !== two.correctAnswer)?.id ?? "",
    });
    assert.equal(scored.total, 3);
    assert.equal(scored.score, 1);
    assert.equal(scored.rows[2]?.chosen, null);
    assert.equal(scored.rows[2]?.correct, false);
    assert.equal(formatClock(185), "3:05");
    assert.equal(formatClock(-4), "0:00");
  });
});
