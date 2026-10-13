import fs from "fs";
import path from "path";
import { questionFromCsvRow } from "@/lib/csv";
import { parseCsv } from "@/lib/csv";
import type { Question } from "@/lib/types";
import { formatIssues, validateQuestion, type ValidationIssue } from "@/lib/validate";

export interface ImportOptions {
  inputPath: string;
  outPath: string;
  bankDir: string;
  replace?: boolean;
  allowMissingExplanations?: boolean;
  dryRun?: boolean;
}

export interface ImportResult {
  added: string[];
  replaced: string[];
  written: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseQuestionDocument(text: string, filename: string): unknown[] {
  if (filename.toLowerCase().endsWith(".csv")) {
    return parseCsv(text).map(questionFromCsvRow);
  }
  const data = JSON.parse(text) as unknown;
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.questions)) return data.questions;
  if (isRecord(data) && typeof data.id === "string") return [data];
  throw new Error("JSON must be a question, an array of questions, or { \"questions\": [] }");
}

export function sanitiseQuestion(value: Question): Question {
  const notation = value.notation?.trim();
  const notationAlt = value.notationAlt?.trim();
  return {
    id: value.id.trim(),
    topic: value.topic.trim(),
    source: value.source.trim(),
    question: value.question.trim(),
    ...(notation ? { notation } : {}),
    ...(notationAlt ? { notationAlt } : {}),
    options: value.options.map((option) => ({
      id: option.id.trim(),
      text: option.text.trim(),
      explanation: option.explanation.trim(),
    })),
    correctAnswer: value.correctAnswer.trim(),
    explanation: value.explanation.trim(),
  };
}

interface BankFile {
  filePath: string;
  questions: Question[];
  dirty: boolean;
}

function readBank(bankDir: string): BankFile[] {
  if (!fs.existsSync(bankDir)) fs.mkdirSync(bankDir, { recursive: true });
  return fs
    .readdirSync(bankDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const filePath = path.join(bankDir, name);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
      if (!Array.isArray(data)) {
        throw new Error(`${name} must be a JSON array of questions`);
      }
      return { filePath, questions: data as Question[], dirty: false };
    });
}

export function importQuestionFile(options: ImportOptions): ImportResult {
  const text = fs.readFileSync(options.inputPath, "utf8");
  const incoming = parseQuestionDocument(text, options.inputPath);
  const requireExplanations = !options.allowMissingExplanations;
  const issues: ValidationIssue[] = [];
  const questions: Question[] = [];

  incoming.forEach((item, index) => {
    const itemIssues = validateQuestion(item, path.basename(options.inputPath), { requireExplanations });
    if (itemIssues.length > 0) {
      issues.push(...itemIssues.map((issue) => ({ ...issue, id: issue.id ?? `row ${index + 1}` })));
      return;
    }
    questions.push(sanitiseQuestion(item as Question));
  });

  const seenIncoming = new Set<string>();
  for (const question of questions) {
    if (seenIncoming.has(question.id)) {
      issues.push({ file: path.basename(options.inputPath), id: question.id, message: "duplicate id in the import file" });
    }
    seenIncoming.add(question.id);
  }
  if (issues.length > 0) {
    throw new Error(`Import failed validation:\n${formatIssues(issues)}`);
  }

  const files = readBank(options.bankDir);
  const location = new Map<string, BankFile>();
  for (const file of files) {
    for (const question of file.questions) {
      if (location.has(question.id)) {
        throw new Error(`Question bank already contains duplicate id ${question.id}`);
      }
      location.set(question.id, file);
    }
  }

  let target = files.find((file) => path.resolve(file.filePath) === path.resolve(options.outPath));
  if (!target) {
    target = { filePath: options.outPath, questions: [], dirty: false };
    files.push(target);
  }

  const added: string[] = [];
  const replaced: string[] = [];
  for (const question of questions) {
    const existing = location.get(question.id);
    if (existing) {
      if (!options.replace) {
        throw new Error(
          `Question ${question.id} already exists. Re-run with --replace to overwrite it, or choose a new id.`,
        );
      }
      const index = existing.questions.findIndex((item) => item.id === question.id);
      existing.questions[index] = question;
      existing.dirty = true;
      replaced.push(question.id);
    } else {
      target.questions.push(question);
      target.dirty = true;
      location.set(question.id, target);
      added.push(question.id);
    }
  }

  const written: string[] = [];
  if (!options.dryRun) {
    for (const file of files) {
      if (!file.dirty) continue;
      fs.mkdirSync(path.dirname(file.filePath), { recursive: true });
      fs.writeFileSync(file.filePath, `${JSON.stringify(file.questions, null, 2)}\n`);
      written.push(file.filePath);
    }
  }

  return { added, replaced, written };
}
