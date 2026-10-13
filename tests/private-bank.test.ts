import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, it } from "node:test";
import { DEFAULT_ANTHROPIC_MODEL } from "@/lib/explain";
import { importMineru } from "@/lib/mineru";
import { applyGeneratedPrivateAnswer, fillPrivateAnswers } from "@/lib/private-answers";
import { loadAllQuestions, loadPrivateQuestions } from "@/lib/private-bank";
import type { Question } from "@/lib/types";

const fixture = path.join(process.cwd(), "tests", "fixtures", "mineru-synthetic");
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function copyFixture(target: string) {
  fs.cpSync(fixture, target, { recursive: true });
  fs.mkdirSync(path.join(target, "images"), { recursive: true });
  fs.writeFileSync(path.join(target, "images", "bar.png"), PNG);
}

function draft(): Question {
  return {
    id: "private-2024-a-1-1",
    topic: "rhythm",
    subtopic: "from-paper",
    source: "My papers",
    question: "In this invented drill, how many crotchet beats are in a minim?",
    options: [
      { id: "A", text: "One", explanation: "" },
      { id: "B", text: "Two", explanation: "" },
    ],
    correctAnswer: "",
    explanation: "",
    studentAnswer: "A",
    private: true,
  };
}

describe("MinerU private bank", () => {
  it("keeps the private folder out of git", () => {
    const ignore = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf8");
    assert.match(ignore, /^private-bank\/$/m);
  });

  it("turns a synthetic MinerU folder into private questions and a low-confidence report", () => {
    const input = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-in-"));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-out-"));
    copyFixture(input);
    const result = importMineru({ inputDir: input, outDir: out, year: 2024, paper: "A" });

    assert.deepEqual(result.report.written, ["private-2024-a-1-1"]);
    assert.ok(result.report.skipped.includes("2.1"));
    const low = result.report.lowConfidence.find((item) => item.questionNumber === "2.1");
    assert.ok(low);
    assert.ok(low.reasons.includes("missing options"));
    assert.ok(low.reasons.includes("unreadable notation"));
    assert.ok(low.reasons.includes("garbled OCR"));

    const saved = JSON.parse(fs.readFileSync(result.writtenFile, "utf8")) as Question[];
    assert.equal(saved.length, 1);
    const question = saved[0];
    assert.ok(question);
    assert.equal(question.source, "My papers");
    assert.equal(question.year, 2024);
    assert.equal(question.paper, "A");
    assert.equal(question.questionNumber, "1.1");
    assert.equal(question.marks, 2);
    assert.equal(question.studentAnswer, "B");
    assert.equal(question.correctAnswer, "");
    assert.equal(question.topic, "rhythm");
    assert.equal(question.options.length, 4);
    assert.equal(question.imagePath, "images/private-2024-a-1-1.png");
    assert.equal(fs.existsSync(path.join(out, question.imagePath)), true);
    assert.match(question.question, /invented drill/);
    assert.equal(JSON.stringify(saved).includes("ABRSM"), false);
  });

  it("can import the synthetic markdown when no content list is present", () => {
    const input = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-md-"));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-md-out-"));
    fs.mkdirSync(path.join(input, "images"), { recursive: true });
    fs.copyFileSync(path.join(fixture, "synthetic.md"), path.join(input, "synthetic.md"));
    fs.writeFileSync(path.join(input, "images", "bar.png"), PNG);
    const result = importMineru({ inputDir: input, outDir: out, year: 2024, paper: "A" });
    assert.equal(result.questions[0]?.questionNumber, "1.1");
    assert.equal(result.questions[0]?.options.length, 4);
    assert.equal(result.questions[0]?.imagePath, "images/private-2024-a-1-1.png");
  });

  it("keeps a cached Claude answer when the same paper is imported again", () => {
    const input = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-rerun-"));
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-rerun-out-"));
    copyFixture(input);
    const first = importMineru({ inputDir: input, outDir: out, year: 2024, paper: "A" });
    const saved = JSON.parse(fs.readFileSync(first.writtenFile, "utf8")) as Question[];
    const question = saved[0];
    assert.ok(question);
    question.correctAnswer = "B";
    question.explanation = "A minim lasts two crotchet beats.";
    question.options = question.options.map((option) => ({
      ...option,
      explanation: option.id === "B" ? "A minim lasts two crotchets." : "That count does not match a minim.",
    }));
    question.studentAnswer = "A";
    question.privateAnswer = {
      checkedAt: "2026-10-13T00:00:00.000Z",
      model: "claude-fable-5-1",
      claudeAnswer: "B",
      studentDisagrees: true,
      note: "Handwritten answer A differs from Claude's answer B.",
    };
    fs.writeFileSync(first.writtenFile, `${JSON.stringify(saved, null, 2)}\n`);

    const second = importMineru({ inputDir: input, outDir: out, year: 2024, paper: "A" });
    const again = JSON.parse(fs.readFileSync(second.writtenFile, "utf8")) as Question[];
    assert.equal(again.length, 1);
    assert.equal(again[0]?.correctAnswer, "B");
    assert.equal(again[0]?.explanation, "A minim lasts two crotchet beats.");
    assert.equal(again[0]?.options[1]?.explanation, "A minim lasts two crotchets.");
    assert.equal(again[0]?.imagePath, "images/private-2024-a-1-1.png");
    assert.equal(again[0]?.studentAnswer, "B");
    assert.equal(again[0]?.privateAnswer?.claudeAnswer, "B");
    assert.equal(again[0]?.privateAnswer?.studentDisagrees, false);
    assert.match(again[0]?.privateAnswer?.note ?? "", /matches Claude/);
  });

  it("serves only the private folder, including when that folder is missing", () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-merge-"));
    const input = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-merge-in-"));
    copyFixture(input);
    importMineru({ inputDir: input, outDir: out, year: 2024, paper: "A" });
    const loaded = loadAllQuestions({ privateDir: out });
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0]?.private, true);
    assert.equal(loaded[0]?.source, "My papers");
    assert.equal(loaded[0]?.id, "private-2024-a-1-1");
    const missing = fs.mkdtempSync(path.join(os.tmpdir(), "mineru-missing-"));
    fs.rmdirSync(missing);
    assert.deepEqual(loadAllQuestions({ privateDir: missing }), []);
    assert.equal(loadPrivateQuestions(out).length, 1);
  });

  it("stores Claude's answer for a blank private question and flags a different handwritten answer", async () => {
    const flagged = applyGeneratedPrivateAnswer({
      question: draft(),
      proposal: {
        answer: "B",
        explanation: "A minim is two crotchet beats.",
        optionExplanations: { A: "One crotchet beat is a crotchet.", B: "A minim lasts two crotchets." },
      },
      model: "claude-fable-5-1",
      checkedAt: "2026-10-13T00:00:00.000Z",
    });
    assert.equal(flagged.correctAnswer, "B");
    assert.equal(flagged.privateAnswer?.studentDisagrees, true);
    assert.match(flagged.privateAnswer?.note ?? "", /differs/);
    assert.equal(flagged.studentAnswer, "A");
    assert.equal(flagged.options[1]?.explanation.includes("two crotchets"), true);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "private-answers-"));
    fs.writeFileSync(path.join(dir, "mineru.json"), `${JSON.stringify([draft()], null, 2)}\n`);
    let calls = 0;
    const fetchImpl: typeof fetch = async (_url, init) => {
      calls += 1;
      const body = JSON.parse(String(init?.body)) as { model: string };
      assert.equal(body.model, DEFAULT_ANTHROPIC_MODEL);
      assert.equal(body.model, "claude-fable-5-1");
      return Response.json({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              answer: "B",
              explanation: "A minim is two crotchet beats.",
              optionExplanations: { A: "That is one beat.", B: "That is two beats." },
            }),
          },
        ],
      });
    };
    const first = await fillPrivateAnswers({
      env: { ANTHROPIC_API_KEY: "test-key" },
      dir,
      fetchImpl,
      checkedAt: "2026-10-13T00:00:00.000Z",
    });
    assert.deepEqual(first.filled, ["private-2024-a-1-1"]);
    assert.deepEqual(first.flagged, ["private-2024-a-1-1"]);
    const second = await fillPrivateAnswers({
      env: { ANTHROPIC_API_KEY: "test-key" },
      dir,
      fetchImpl,
    });
    assert.equal(calls, 1);
    assert.deepEqual(second.filled, []);
    const saved = JSON.parse(fs.readFileSync(path.join(dir, "mineru.json"), "utf8")) as Question[];
    assert.equal(saved[0]?.correctAnswer, "B");
    assert.equal(saved[0]?.privateAnswer?.model, "claude-fable-5-1");
  });

  it("does not call Claude or write the private bank when the key is missing", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "private-nokey-"));
    const file = path.join(dir, "mineru.json");
    fs.writeFileSync(file, `${JSON.stringify([draft()], null, 2)}\n`);
    let calls = 0;
    const result = await fillPrivateAnswers({
      env: {},
      dir,
      fetchImpl: async () => {
        calls += 1;
        return new Response("no");
      },
    });
    assert.equal(result.skipped, true);
    assert.match(result.reason ?? "", /ANTHROPIC_API_KEY is not set/);
    assert.equal(calls, 0);
    assert.equal(fs.readFileSync(file, "utf8").includes("privateAnswer"), false);
  });
});
