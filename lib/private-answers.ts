import fs from "fs";
import path from "path";
import { requestIndependentAnswer } from "@/lib/answer-check";
import { explanationsAreComplete } from "@/lib/answer-check";
import type { PrivateAnswer, Question, QuestionOption } from "@/lib/types";
import { privateBankDir } from "@/lib/private-bank";

type Env = Record<string, string | undefined>;

export function normaliseChoice(value: string | undefined, options: QuestionOption[]): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const letter = /^(?:\(([A-F])\)|([A-F])\b)/i.exec(trimmed);
  const id = (letter?.[1] || letter?.[2] || "").toUpperCase();
  if (id && options.some((option) => option.id === id)) return id;
  const byText = options.find((option) => option.text.trim().toLowerCase() === trimmed.toLowerCase());
  return byText?.id ?? null;
}

export function applyGeneratedPrivateAnswer(input: {
  question: Question;
  proposal: { answer: string; explanation: string; optionExplanations: Record<string, string> };
  model: string;
  checkedAt: string;
}): Question {
  const existingAnswer = input.question.correctAnswer.trim();
  const correctAnswer = existingAnswer || input.proposal.answer;
  const student = normaliseChoice(input.question.studentAnswer, input.question.options);
  const studentDisagrees = Boolean(input.question.studentAnswer?.trim()) && student !== correctAnswer;
  const privateAnswer: PrivateAnswer = {
    checkedAt: input.checkedAt,
    model: input.model,
    claudeAnswer: input.proposal.answer,
    studentDisagrees,
    note: studentDisagrees
      ? `Handwritten answer ${input.question.studentAnswer?.trim()} differs from Claude's answer ${input.proposal.answer}.`
      : input.question.studentAnswer?.trim()
        ? "Handwritten answer matches Claude."
        : "No handwritten answer was on the scan. Claude's answer was stored.",
  };
  return {
    ...input.question,
    correctAnswer,
    explanation: input.question.explanation.trim() || input.proposal.explanation.trim(),
    options: input.question.options.map((option) => {
      if (option.explanation.trim()) return option;
      const generated = input.proposal.optionExplanations[option.id]?.trim();
      return generated ? { ...option, explanation: generated } : option;
    }),
    privateAnswer,
  };
}

function needsGeneration(question: Question): boolean {
  if (!question.correctAnswer.trim()) return true;
  return !explanationsAreComplete(question);
}

export interface PrivateFillResult {
  skipped: boolean;
  reason?: string;
  filled: string[];
  flagged: string[];
  failed: string[];
  written: string[];
}

export async function fillPrivateAnswers(options: {
  env: Env;
  dir?: string;
  fetchImpl?: typeof fetch;
  dryRun?: boolean;
  checkedAt?: string;
}): Promise<PrivateFillResult> {
  const apiKey = options.env.ANTHROPIC_API_KEY?.trim();
  const dir = options.dir ?? privateBankDir(options.env);
  if (!apiKey) {
    return {
      skipped: true,
      reason:
        "ANTHROPIC_API_KEY is not set. No private questions were changed. Add the key to .env.local and run npm run check-private again.",
      filled: [],
      flagged: [],
      failed: [],
      written: [],
    };
  }
  if (!fs.existsSync(dir)) {
    return {
      skipped: true,
      reason: `Private bank folder not found (${dir}). Import a MinerU folder first.`,
      filled: [],
      flagged: [],
      failed: [],
      written: [],
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  const filled: string[] = [];
  const flagged: string[] = [];
  const failed: string[] = [];
  const written: string[] = [];
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".json") && name !== "import-report.json").sort();

  for (const name of files) {
    const filePath = path.join(dir, name);
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) continue;
    const questions = parsed as Question[];
    let dirty = false;
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (!question || !needsGeneration(question)) continue;
      const independent = await requestIndependentAnswer(question, options.env, fetchImpl).catch(() => null);
      if (!independent) {
        failed.push(question.id);
        continue;
      }
      const next = applyGeneratedPrivateAnswer({
        question,
        proposal: independent.proposal,
        model: independent.model,
        checkedAt,
      });
      if (question.correctAnswer.trim() && next.correctAnswer !== question.correctAnswer) {
        throw new Error(`Refusing to replace the stored answer for ${question.id}`);
      }
      questions[index] = next;
      dirty = true;
      filled.push(question.id);
      if (next.privateAnswer?.studentDisagrees) flagged.push(question.id);
    }
    if (dirty && !options.dryRun) {
      fs.writeFileSync(filePath, `${JSON.stringify(questions, null, 2)}\n`);
      written.push(filePath);
    }
  }

  return { skipped: false, filled, flagged, failed, written };
}
