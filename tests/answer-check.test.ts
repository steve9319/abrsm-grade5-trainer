import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, it } from "node:test";
import { applyAnswerCheck, buildAnswerPrompt, parseIndependentAnswer, runAnswerCheck } from "@/lib/answer-check";
import { loadDotEnv } from "@/lib/env";
import { requestLesson } from "@/lib/lesson";
import type { Question } from "@/lib/types";

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: "keys-99",
    topic: "keys",
    subtopic: "key-signatures",
    source: "original",
    question: "How many sharps are there in D major?",
    options: [
      { id: "A", text: "One", explanation: "G major has one sharp." },
      { id: "B", text: "Two", explanation: "D major has F sharp and C sharp." },
    ],
    correctAnswer: "B",
    explanation: "D major takes two sharps.",
    ...overrides,
  };
}

describe("answer check", () => {
  it("flags a disagreement and keeps the stored answer and explanations", () => {
    const original = question();
    const result = applyAnswerCheck({
      question: original,
      proposal: {
        answer: "A",
        explanation: "Claude thought one sharp.",
        optionExplanations: { A: "Claude's reason", B: "Claude dismissed two." },
      },
      model: "claude-sonnet-5-5",
      checkedAt: "2026-10-13T00:00:00.000Z",
    });
    assert.equal(result.disagreement, true);
    assert.equal(result.filledExplanation, false);
    assert.equal(result.question.correctAnswer, "B");
    assert.equal(result.question.explanation, original.explanation);
    assert.equal(result.question.options[0]?.explanation, original.options[0]?.explanation);
    assert.equal(result.question.answerCheck?.agreed, false);
    assert.match(result.question.answerCheck?.note ?? "", /Disagreement/);
    assert.equal(result.question.answerCheck?.claudeAnswer, "A");
  });

  it("fills only blank explanations when Claude agrees", () => {
    const result = applyAnswerCheck({
      question: question({
        explanation: "",
        options: [
          { id: "A", text: "One", explanation: "Already written." },
          { id: "B", text: "Two", explanation: "" },
        ],
      }),
      proposal: {
        answer: "B",
        explanation: "Two sharps: F and C.",
        optionExplanations: { A: "Should not replace", B: "This is the match." },
      },
      model: "claude-sonnet-5-5",
      checkedAt: "2026-10-13T00:00:00.000Z",
    });
    assert.equal(result.disagreement, false);
    assert.equal(result.filledExplanation, true);
    assert.equal(result.question.correctAnswer, "B");
    assert.equal(result.question.explanation, "Two sharps: F and C.");
    assert.equal(result.question.options[0]?.explanation, "Already written.");
    assert.equal(result.question.options[1]?.explanation, "This is the match.");
  });

  it("does not copy a disagreeing explanation into blank fields", () => {
    const result = applyAnswerCheck({
      question: question({ explanation: "", options: [
        { id: "A", text: "One", explanation: "" },
        { id: "B", text: "Two", explanation: "" },
      ] }),
      proposal: {
        answer: "A",
        explanation: "Wrong explanation",
        optionExplanations: { A: "Wrong", B: "Also wrong" },
      },
      model: "claude-sonnet-5-5",
      checkedAt: "2026-10-13T00:00:00.000Z",
    });
    assert.equal(result.question.explanation, "");
    assert.equal(result.question.options[1]?.explanation, "");
    assert.equal(result.question.correctAnswer, "B");
  });

  it("fills blanks from the official-answer call when Claude disagrees", () => {
    const result = applyAnswerCheck({
      question: question({
        explanation: "",
        options: [
          { id: "A", text: "One", explanation: "" },
          { id: "B", text: "Two", explanation: "" },
        ],
      }),
      proposal: {
        answer: "A",
        explanation: "Independent and wrong",
        optionExplanations: { A: "No", B: "No" },
      },
      officialExplanation: {
        explanation: "Stored answer, two sharps.",
        optionExplanations: { A: "One sharp is G major.", B: "F sharp and C sharp." },
      },
      model: "claude-sonnet-5-5",
      checkedAt: "2026-10-13T00:00:00.000Z",
    });
    assert.equal(result.question.correctAnswer, "B");
    assert.equal(result.question.explanation, "Stored answer, two sharps.");
    assert.equal(result.question.options[0]?.explanation, "One sharp is G major.");
    assert.match(result.question.answerCheck?.note ?? "", /Disagreement/);
  });

  it("does not tell the independent check which option is stored", () => {
    const prompt = buildAnswerPrompt(question());
    assert.equal(prompt.includes("Correct option id"), false);
    assert.equal(prompt.includes(question().correctAnswer) ? prompt.includes("Two") : true, true);
  });

  it("rejects an answer id that is not an option", () => {
    assert.equal(parseIndependentAnswer('{"answer":"Z","explanation":"x","optionExplanations":{}}', ["A", "B"]), null);
  });

  it("leaves the bank untouched when the API key is missing", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grade5-check-"));
    const file = path.join(dir, "keys.json");
    fs.writeFileSync(file, `${JSON.stringify([question()], null, 2)}\n`);
    let called = false;
    const result = await runAnswerCheck({
      env: {},
      questionsDir: dir,
      fetchImpl: async () => {
        called = true;
        return new Response("no");
      },
    });
    assert.equal(result.skipped, true);
    assert.match(result.reason ?? "", /ANTHROPIC_API_KEY is not set/);
    assert.equal(called, false);
    assert.equal(result.written.length, 0);
    const after = fs.readFileSync(file, "utf8");
    assert.equal(after.includes("answerCheck"), false);
  });

  it("writes a disagreement flag without changing the stored answer", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grade5-check-"));
    const file = path.join(dir, "keys.json");
    fs.writeFileSync(file, `${JSON.stringify([question()], null, 2)}\n`);
    const result = await runAnswerCheck({
      env: { ANTHROPIC_API_KEY: "test-key", ANTHROPIC_MODEL: "claude-sonnet-5-5" },
      questionsDir: dir,
      checkedAt: "2026-10-13T00:00:00.000Z",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  answer: "A",
                  explanation: "One sharp.",
                  optionExplanations: { A: "G major.", B: "Not D." },
                }),
              },
            ],
          }),
          { status: 200 },
        ),
    });
    assert.equal(result.checked, 1);
    assert.deepEqual(result.disagreements, ["keys-99"]);
    assert.equal(result.filled.length, 0);
    const saved = JSON.parse(fs.readFileSync(file, "utf8")) as Question[];
    assert.equal(saved[0]?.correctAnswer, "B");
    assert.equal(saved[0]?.explanation, "D major takes two sharps.");
    assert.equal(saved[0]?.answerCheck?.agreed, false);
    assert.match(saved[0]?.answerCheck?.note ?? "", /Disagreement/);
  });

  it("loads .env.local without overriding a key that is already set", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grade5-env-"));
    fs.writeFileSync(path.join(dir, ".env"), "ANTHROPIC_API_KEY=from-env\nANTHROPIC_MODEL=from-env\n");
    fs.writeFileSync(path.join(dir, ".env.local"), "ANTHROPIC_API_KEY=from-local\n");
    const env: Record<string, string | undefined> = { ANTHROPIC_MODEL: "already" };
    loadDotEnv(dir, env);
    assert.equal(env.ANTHROPIC_API_KEY, "from-local");
    assert.equal(env.ANTHROPIC_MODEL, "already");
  });

  it("does not call Claude for a lesson when the key is missing", async () => {
    let called = false;
    const result = await requestLesson({ topic: "keys", subtopic: "key-signatures", title: "Key signatures" }, {}, async () => {
      called = true;
      return new Response("no");
    });
    assert.equal(called, false);
    assert.equal(result.body.available, false);
    if (!result.body.available) assert.equal(result.body.message, "explanation unavailable");
  });
});
