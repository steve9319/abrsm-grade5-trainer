import fs from "fs";
import path from "path";
import { assertUniqueIds, formatIssues, validateQuestion } from "@/lib/validate";
import type { Question } from "@/lib/types";

export const QUESTIONS_DIR = path.join(process.cwd(), "data", "questions");

export function loadQuestions(dir = QUESTIONS_DIR): Question[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Question directory not found: ${dir}`);
  }
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
  const questions: Question[] = [];
  const issues = [];

  for (const name of files) {
    const file = path.join(dir, name);
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      throw new Error(`${name}: ${message}`);
    }
    if (!Array.isArray(data)) {
      throw new Error(`${name} must be a JSON array of questions`);
    }
    for (const item of data) {
      const itemIssues = validateQuestion(item, name);
      if (itemIssues.length > 0) {
        issues.push(...itemIssues);
        continue;
      }
      questions.push(item as Question);
    }
  }

  issues.push(...assertUniqueIds(questions));
  if (issues.length > 0) {
    throw new Error(`Question bank failed validation:\n${formatIssues(issues)}`);
  }

  return questions.sort((a, b) => a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id));
}
