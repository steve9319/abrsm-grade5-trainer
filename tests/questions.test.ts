import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadQuestions } from "@/lib/questions.server";
import { TOPIC_IDS } from "@/lib/types";
import { validateQuestion } from "@/lib/validate";
import { EXAM_PER_TOPIC, EXAM_TOPICS } from "@/lib/exam";

describe("question bank", () => {
  const questions = loadQuestions();

  it("contains at least 60 original questions across every topic", () => {
    assert.ok(questions.length >= 60, `expected at least 60 questions, found ${questions.length}`);
    for (const topic of TOPIC_IDS) {
      const count = questions.filter((question) => question.topic === topic).length;
      assert.ok(count >= 4, `${topic} has only ${count} questions`);
    }
    for (const topic of EXAM_TOPICS) {
      const count = questions.filter((question) => question.topic === topic).length;
      assert.ok(count >= EXAM_PER_TOPIC, `${topic} cannot fill a mock paper`);
    }
  });

  it("gives every question one correct answer and an explanation for every option", () => {
    const ids = new Set<string>();
    for (const question of questions) {
      assert.equal(ids.has(question.id), false, `duplicate id ${question.id}`);
      ids.add(question.id);
      assert.ok(question.source.trim());
      assert.ok(question.explanation.trim(), `${question.id} is missing the main explanation`);
      const matches = question.options.filter((option) => option.id === question.correctAnswer);
      assert.equal(matches.length, 1, `${question.id} must have exactly one correct answer`);
      for (const option of question.options) {
        assert.ok(option.explanation.trim(), `${question.id} option ${option.id} is not explained`);
      }
    }
  });

  it("includes staff notation on pitch, keys, intervals and chords", () => {
    for (const topic of ["pitch", "keys", "intervals", "chords", "rhythm"]) {
      assert.ok(
        questions.some((question) => question.topic === topic && question.notation),
        `${topic} should include at least one ABC example`,
      );
    }
  });

  it("rejects a question whose correct answer is ambiguous or unexplained", () => {
    const duplicate = validateQuestion(
      {
        id: "bad-duplicate",
        topic: "rhythm",
        source: "original",
        question: "Which rest?",
        explanation: "Because.",
        correctAnswer: "A",
        options: [
          { id: "A", text: "Minim", explanation: "Yes." },
          { id: "A", text: "Crotchet", explanation: "No." },
        ],
      },
      "bad.json",
    );
    assert.ok(duplicate.some((issue) => issue.message.includes("duplicate")));

    const missing = validateQuestion(
      {
        id: "bad-blank",
        topic: "rhythm",
        source: "original",
        question: "Which rest?",
        explanation: "",
        correctAnswer: "C",
        options: [
          { id: "A", text: "Minim", explanation: "" },
          { id: "B", text: "Crotchet", explanation: "Too short." },
        ],
      },
      "bad.json",
    );
    assert.ok(missing.some((issue) => issue.message.includes("explanation")));
    assert.ok(missing.some((issue) => issue.message.includes("exactly one")));
  });
});
