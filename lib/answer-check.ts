import fs from "fs";
import path from "path";
import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";
import { DEFAULT_ANTHROPIC_MODEL, requestExplanation } from "@/lib/explain";
import type { AnswerCheck, Question } from "@/lib/types";

type Env = Record<string, string | undefined>;

export interface IndependentAnswer {
  answer: string;
  explanation: string;
  optionExplanations: Record<string, string>;
}

export function explanationsAreComplete(question: Question): boolean {
  return Boolean(question.explanation.trim()) && question.options.every((option) => option.explanation.trim());
}

export function buildAnswerPrompt(question: Question): string {
  const options = question.options.map((option) => `${option.id}. ${option.text}`).join("\n");
  return [
    "You are checking an ABRSM Grade 5 music theory multiple-choice question for a piano student.",
    "Use British note names and British theory terms.",
    "You are not told which option is correct. Choose the single best option id yourself.",
    "Explain why your chosen option is right, and why every other option is wrong.",
    "Reply with JSON only, no markdown, in this shape:",
    '{"answer":"B","explanation":"...","optionExplanations":{"A":"...","B":"..."}}',
    "answer must be one of the option ids.",
    "optionExplanations must include every option id.",
    "",
    `Topic: ${question.topic}`,
    `Concept: ${question.subtopic}`,
    `Question: ${question.question}`,
    question.notation ? `ABC notation:\n${question.notation}` : "",
    "Options:",
    options,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function parseIndependentAnswer(text: string, optionIds: string[]): IndependentAnswer | null {
  const stripped = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1)) as {
      answer?: unknown;
      explanation?: unknown;
      optionExplanations?: unknown;
    };
    if (typeof parsed.answer !== "string" || !optionIds.includes(parsed.answer.trim())) return null;
    if (typeof parsed.explanation !== "string") return null;
    const optionExplanations: Record<string, string> = {};
    if (parsed.optionExplanations && typeof parsed.optionExplanations === "object") {
      for (const [key, value] of Object.entries(parsed.optionExplanations)) {
        if (typeof value === "string") optionExplanations[key] = value.trim();
      }
    }
    return {
      answer: parsed.answer.trim(),
      explanation: parsed.explanation.trim(),
      optionExplanations,
    };
  } catch {
    return null;
  }
}

function fillBlanks(question: Question, explanation: string, optionExplanations: Record<string, string>): Question {
  return {
    ...question,
    explanation: question.explanation.trim() ? question.explanation : explanation.trim() || question.explanation,
    options: question.options.map((option) => {
      if (option.explanation.trim()) return option;
      const generated = optionExplanations[option.id]?.trim();
      if (!generated) return option;
      return { ...option, explanation: generated };
    }),
  };
}

export interface ApplyAnswerCheckInput {
  question: Question;
  proposal: IndependentAnswer;
  /** Used only when Claude disagrees and some explanations are still blank. */
  officialExplanation?: { explanation: string; optionExplanations: Record<string, string> } | null;
  model: string;
  checkedAt: string;
}

export interface ApplyAnswerCheckResult {
  question: Question;
  disagreement: boolean;
  filledExplanation: boolean;
}

/**
 * Never changes correctAnswer.
 * Fills blank explanations from Claude only when Claude agrees.
 * On a disagreement, blank explanations may be filled from a second call that was told the stored answer.
 * Existing explanation text is left as it is.
 */
export function applyAnswerCheck(input: ApplyAnswerCheckInput): ApplyAnswerCheckResult {
  const agreed = input.proposal.answer === input.question.correctAnswer;
  let next: Question = { ...input.question, options: input.question.options.map((option) => ({ ...option })) };
  const before = JSON.stringify({ explanation: next.explanation, options: next.options });

  if (agreed) {
    next = fillBlanks(next, input.proposal.explanation, input.proposal.optionExplanations);
  } else if (input.officialExplanation) {
    next = fillBlanks(next, input.officialExplanation.explanation, input.officialExplanation.optionExplanations);
  }

  const note = agreed
    ? "Claude chose the same option as the stored answer."
    : `Disagreement: Claude chose ${input.proposal.answer}; the stored answer ${input.question.correctAnswer} was kept.`;

  const answerCheck: AnswerCheck = {
    checkedAt: input.checkedAt,
    model: input.model,
    claudeAnswer: input.proposal.answer,
    agreed,
    note,
  };

  const filledExplanation =
    JSON.stringify({ explanation: next.explanation, options: next.options }) !== before;

  return {
    question: { ...next, correctAnswer: input.question.correctAnswer, answerCheck },
    disagreement: !agreed,
    filledExplanation,
  };
}

async function readMessage(response: Response): Promise<string> {
  const data = (await response.json()) as { content?: { type?: string; text?: string }[] };
  return (data.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
}

export async function requestIndependentAnswer(
  question: Question,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ proposal: IndependentAnswer; model: string } | null> {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  const model = env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1600,
      messages: [{ role: "user", content: buildAnswerPrompt(question) }],
    }),
  });
  if (!response.ok) return null;
  const proposal = parseIndependentAnswer(await readMessage(response), question.options.map((option) => option.id));
  if (!proposal) return null;
  return { proposal, model };
}

export interface AnswerCheckRunResult {
  skipped: boolean;
  reason?: string;
  checked: number;
  disagreements: string[];
  filled: string[];
  failed: string[];
  written: string[];
}

function needsCheck(question: Question, force: boolean): boolean {
  if (force) return true;
  if (!question.answerCheck) return true;
  return !explanationsAreComplete(question);
}

export async function runAnswerCheck(options: {
  env: Env;
  questionsDir: string;
  fetchImpl?: typeof fetch;
  dryRun?: boolean;
  force?: boolean;
  ids?: string[];
  checkedAt?: string;
  delayMs?: number;
}): Promise<AnswerCheckRunResult> {
  const apiKey = options.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return {
      skipped: true,
      reason:
        "ANTHROPIC_API_KEY is not set. No questions were checked and the bank was not changed. Add the key to .env.local and run npm run check-answers again.",
      checked: 0,
      disagreements: [],
      filled: [],
      failed: [],
      written: [],
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const checkedAt = options.checkedAt ?? new Date().toISOString();
  const wanted = options.ids ? new Set(options.ids) : null;
  const files = fs
    .readdirSync(options.questionsDir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  const disagreements: string[] = [];
  const filled: string[] = [];
  const failed: string[] = [];
  const written: string[] = [];
  let checked = 0;

  for (const name of files) {
    const filePath = path.join(options.questionsDir, name);
    const questions = JSON.parse(fs.readFileSync(filePath, "utf8")) as Question[];
    if (!Array.isArray(questions)) continue;
    let dirty = false;
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (!question || (wanted && !wanted.has(question.id))) continue;
      if (!needsCheck(question, Boolean(options.force))) continue;

      const independent = await requestIndependentAnswer(question, options.env, fetchImpl).catch(() => null);
      if (!independent) {
        failed.push(question.id);
        continue;
      }

      let official: { explanation: string; optionExplanations: Record<string, string> } | null = null;
      const disagreed = independent.proposal.answer !== question.correctAnswer;
      if (disagreed && !explanationsAreComplete(question)) {
        const explained = await requestExplanation(
          {
            id: question.id,
            topic: question.topic,
            question: question.question,
            notation: question.notation,
            options: question.options.map((option) => ({ id: option.id, text: option.text })),
            correctAnswer: question.correctAnswer,
          },
          options.env,
          fetchImpl,
        );
        if (explained.body.available) {
          official = {
            explanation: explained.body.explanation,
            optionExplanations: explained.body.optionExplanations,
          };
        }
      }

      const applied = applyAnswerCheck({
        question,
        proposal: independent.proposal,
        officialExplanation: official,
        model: independent.model,
        checkedAt,
      });
      if (applied.question.correctAnswer !== question.correctAnswer) {
        throw new Error(`Refusing to change the stored answer for ${question.id}`);
      }
      questions[index] = applied.question;
      dirty = true;
      checked += 1;
      if (applied.disagreement) disagreements.push(question.id);
      if (applied.filledExplanation) filled.push(question.id);

      if (options.delayMs && options.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.delayMs));
      }
    }
    if (dirty && !options.dryRun) {
      fs.writeFileSync(filePath, `${JSON.stringify(questions, null, 2)}\n`);
      written.push(filePath);
    }
  }

  return {
    skipped: false,
    reason: failed.length > 0 ? EXPLANATION_UNAVAILABLE_TEXT : undefined,
    checked,
    disagreements,
    filled,
    failed,
    written,
  };
}
