import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXAM_PER_TOPIC, EXAM_TOPICS, formatClock, pickExamQuestions, scoreAnswers } from "@/lib/exam";
import { loadQuestions } from "@/lib/questions.server";
import { mulberry32 } from "@/lib/random";
import { TOPIC_IDS } from "@/lib/types";

describe("mock paper", () => {
  const questions = loadQuestions();

  it("draws two questions from each theory topic and leaves the practical set out", () => {
    const first = pickExamQuestions(questions, mulberry32(5));
    const second = pickExamQuestions(questions, mulberry32(5));
    assert.equal(first.length, EXAM_TOPICS.length * EXAM_PER_TOPIC);
    assert.deepEqual(
      first.map((question) => question.id),
      second.map((question) => question.id),
    );
    for (const topic of EXAM_TOPICS) {
      assert.equal(first.filter((question) => question.topic === topic).length, EXAM_PER_TOPIC);
    }
    assert.equal(first.filter((question) => question.topic === "practical").length, 0);
    assert.ok(TOPIC_IDS.includes("practical"));
  });

  it("scores only the chosen option and formats the clock", () => {
    const paper = questions.slice(0, 3);
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
