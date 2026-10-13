import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { describe, it } from "node:test";
import { CONCEPTS } from "@/lib/lessons";
import { loadQuestions } from "@/lib/questions.server";
import { validateQuestion } from "@/lib/validate";

const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "questions");

describe("question schema", () => {
  const questions = loadQuestions(fixtureDir);

  it("keeps past-paper questions out of the repository", () => {
    const shipped = path.join(process.cwd(), "data", "questions");
    const files = fs.existsSync(shipped) ? fs.readdirSync(shipped).filter((name) => name.endsWith(".json")) : [];
    assert.deepEqual(files, []);
    assert.ok(questions.length >= 6);
    assert.equal(JSON.stringify(questions).includes("ABRSM"), false);
  });

  it("gives every fixture question one correct answer and an explanation for every option", () => {
    const ids = new Set<string>();
    for (const question of questions) {
      assert.equal(ids.has(question.id), false, `duplicate id ${question.id}`);
      ids.add(question.id);
      assert.match(question.subtopic, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${question.id} needs a subtopic`);
      assert.ok(
        CONCEPTS.some((concept) => concept.topic === question.topic && concept.id === question.subtopic),
        `${question.id} subtopic ${question.subtopic} has no lesson`,
      );
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
        source: "fixture",
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
        source: "fixture",
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
