import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, it } from "node:test";
import { questionFromCsvRow, parseCsv } from "@/lib/csv";
import { importQuestionFile } from "@/lib/import-bank";
import { validateQuestion } from "@/lib/validate";

const exampleJson = path.join(process.cwd(), "data", "examples", "question.json");
const exampleCsv = path.join(process.cwd(), "data", "examples", "question.csv");

describe("question import", () => {
  it("parses the example CSV into a valid question", () => {
    const rows = parseCsv(fs.readFileSync(exampleCsv, "utf8"));
    assert.equal(rows.length, 1);
    const question = questionFromCsvRow(rows[0] ?? {});
    assert.deepEqual(validateQuestion(question, "question.csv"), []);
    assert.equal(question.correctAnswer, "B");
    assert.equal(question.options.length, 4);
  });

  it("writes new questions and refuses a duplicate id unless replace is set", () => {
    const bankDir = fs.mkdtempSync(path.join(os.tmpdir(), "grade5-bank-"));
    const outPath = path.join(bankDir, "imported.json");
    const preview = importQuestionFile({
      inputPath: exampleJson,
      outPath,
      bankDir,
      dryRun: true,
    });
    assert.deepEqual(preview.added, ["example-interval-01"]);
    assert.equal(fs.existsSync(outPath), false);

    importQuestionFile({ inputPath: exampleJson, outPath, bankDir });
    const written = JSON.parse(fs.readFileSync(outPath, "utf8")) as { id: string }[];
    assert.equal(written.length, 1);
    assert.equal(written[0]?.id, "example-interval-01");

    assert.throws(
      () => importQuestionFile({ inputPath: exampleCsv, outPath, bankDir }),
      /already exists/,
    );

    const replaced = importQuestionFile({
      inputPath: exampleCsv,
      outPath,
      bankDir,
      replace: true,
    });
    assert.deepEqual(replaced.replaced, ["example-interval-01"]);
    const after = JSON.parse(fs.readFileSync(outPath, "utf8")) as unknown[];
    assert.equal(after.length, 1);
  });
});
