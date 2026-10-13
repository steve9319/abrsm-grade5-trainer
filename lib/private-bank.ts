import fs from "fs";
import path from "path";
import { loadQuestions } from "@/lib/questions.server";
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

/** Public bank plus every valid question in the private folder. Private ids never replace a public id. */
export function loadAllQuestions(dirs?: { publicDir?: string; privateDir?: string }): Question[] {
  const published = dirs?.publicDir ? loadQuestions(dirs.publicDir) : loadQuestions();
  const personal = loadPrivateQuestions(dirs?.privateDir ?? privateBankDir());
  const seen = new Set(published.map((question) => question.id));
  const merged = [...published];
  for (const question of personal) {
    if (seen.has(question.id)) continue;
    merged.push(question);
    seen.add(question.id);
  }
  return merged.sort((a, b) => a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id));
}

export function hasStoredAnswer(question: Question): boolean {
  return question.correctAnswer.trim().length > 0;
}
