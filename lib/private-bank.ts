import fs from "fs";
import path from "path";
import type { Question } from "@/lib/types";
import { validateQuestion } from "@/lib/validate";

export function privateBankDir(env: Record<string, string | undefined> = process.env, cwd = process.cwd()): string {
  const configured = env.PRIVATE_BANK_DIR?.trim();
  return path.resolve(cwd, configured && configured.length > 0 ? configured : "private-bank");
}

export function loadPrivateQuestions(dir = privateBankDir()): Question[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name !== "import-report.json")
    .sort();
  const questions: Question[] = [];
  for (const name of files) {
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(data)) continue;
    for (const item of data) {
      const issues = validateQuestion(item, name, { requireExplanations: false, requireCorrectAnswer: false });
      if (issues.length > 0) continue;
      questions.push({ ...(item as Question), private: true });
    }
  }
  return questions;
}

/** The practice room serves only the private folder. A missing folder is an empty bank. */
export function loadAllQuestions(dirs?: { privateDir?: string }): Question[] {
  return loadPrivateQuestions(dirs?.privateDir ?? privateBankDir()).sort(
    (a, b) => a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id),
  );
}

export function hasStoredAnswer(question: Question): boolean {
  return question.correctAnswer.trim().length > 0;
}
