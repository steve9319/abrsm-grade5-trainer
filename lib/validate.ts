import { isTopicId } from "@/lib/topics";
import type { Question, QuestionOption } from "@/lib/types";

export interface ValidationIssue {
  file: string;
  id?: string;
  message: string;
}

export interface ValidateOptions {
  /** When false, blank explanations are allowed (draft questions that use the API fallback). */
  requireExplanations?: boolean;
  /** When false, a blank correctAnswer is allowed until Claude fills a private question. */
  requireCorrectAnswer?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(file: string, id: string | undefined, message: string): ValidationIssue {
  return { file, id, message };
}

export function validateQuestion(
  value: unknown,
  file: string,
  settings: ValidateOptions = {},
): ValidationIssue[] {
  const requireExplanations = settings.requireExplanations !== false;
  const requireCorrectAnswer = settings.requireCorrectAnswer !== false;
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return [issue(file, undefined, "Question must be a JSON object")];
  }

  const id = typeof value.id === "string" ? value.id.trim() : "";
  if (!id || !/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
    issues.push(issue(file, id || undefined, "id must be a non-empty slug (letters, numbers, hyphens)"));
  }

  const topic = typeof value.topic === "string" ? value.topic.trim() : "";
  if (!topic || !isTopicId(topic)) {
    issues.push(
      issue(
        file,
        id || undefined,
        `topic must be one of the known topics (received ${topic ? JSON.stringify(topic) : "nothing"})`,
      ),
    );
  }

  const subtopic = typeof value.subtopic === "string" ? value.subtopic.trim() : "";
  if (!subtopic || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subtopic)) {
    issues.push(
      issue(
        file,
        id || undefined,
        "subtopic is required and must be a slug such as \"cadences\" or \"clarinet-bb\"",
      ),
    );
  }

  const source = typeof value.source === "string" ? value.source.trim() : "";
  if (!source) {
    issues.push(issue(file, id || undefined, "source is required, for example \"original\""));
  }

  const question = typeof value.question === "string" ? value.question.trim() : "";
  if (!question) {
    issues.push(issue(file, id || undefined, "question text is required"));
  }

  if (value.notation !== undefined) {
    if (typeof value.notation !== "string" || !value.notation.trim()) {
      issues.push(issue(file, id || undefined, "notation, when present, must be a non-empty ABC string"));
    }
  }

  if (value.notationAlt !== undefined && typeof value.notationAlt !== "string") {
    issues.push(issue(file, id || undefined, "notationAlt, when present, must be a string"));
  }

  const explanation = typeof value.explanation === "string" ? value.explanation.trim() : "";
  if (value.explanation !== undefined && typeof value.explanation !== "string") {
    issues.push(issue(file, id || undefined, "explanation must be a string"));
  } else if (requireExplanations && !explanation) {
    issues.push(issue(file, id || undefined, "explanation must say why the correct answer is correct"));
  }

  if (!Array.isArray(value.options)) {
    issues.push(issue(file, id || undefined, "options must be an array"));
    return issues;
  }

  if (value.options.length < 2 || value.options.length > 6) {
    issues.push(issue(file, id || undefined, "options must contain between 2 and 6 choices"));
  }

  const seen = new Set<string>();
  const parsedOptions: QuestionOption[] = [];
  value.options.forEach((option, index) => {
    if (!isRecord(option)) {
      issues.push(issue(file, id || undefined, `option ${index + 1} must be an object`));
      return;
    }
    const optionId = typeof option.id === "string" ? option.id.trim() : "";
    const text = typeof option.text === "string" ? option.text.trim() : "";
    const optionExplanation = typeof option.explanation === "string" ? option.explanation.trim() : "";
    if (!optionId) {
      issues.push(issue(file, id || undefined, `option ${index + 1} needs an id`));
    } else if (seen.has(optionId)) {
      issues.push(issue(file, id || undefined, `duplicate option id ${optionId}`));
    } else {
      seen.add(optionId);
    }
    if (!text) {
      issues.push(issue(file, id || undefined, `option ${optionId || index + 1} needs text`));
    }
    if (option.explanation !== undefined && typeof option.explanation !== "string") {
      issues.push(issue(file, id || undefined, `option ${optionId || index + 1} needs an explanation string`));
    } else if (requireExplanations && !optionExplanation) {
      issues.push(
        issue(
          file,
          id || undefined,
          `option ${optionId || index + 1} must explain why it is right or wrong`,
        ),
      );
    }
    parsedOptions.push({ id: optionId, text, explanation: optionExplanation });
  });

  const correctAnswer = typeof value.correctAnswer === "string" ? value.correctAnswer.trim() : "";
  const matches = parsedOptions.filter((option) => option.id === correctAnswer);
  if (requireCorrectAnswer || correctAnswer) {
    if (matches.length !== 1) {
      issues.push(
        issue(
          file,
          id || undefined,
          `correctAnswer must match exactly one option id (received ${JSON.stringify(correctAnswer)})`,
        ),
      );
    }
  }

  if (value.year !== undefined && (typeof value.year !== "number" || !Number.isInteger(value.year))) {
    issues.push(issue(file, id || undefined, "year, when present, must be an integer"));
  }
  if (value.paper !== undefined && (typeof value.paper !== "string" || !value.paper.trim())) {
    issues.push(issue(file, id || undefined, "paper, when present, must be a non-empty string"));
  }
  if (value.questionNumber !== undefined && (typeof value.questionNumber !== "string" || !value.questionNumber.trim())) {
    issues.push(issue(file, id || undefined, "questionNumber, when present, must be a non-empty string"));
  }
  if (value.marks !== undefined && (typeof value.marks !== "number" || !Number.isInteger(value.marks) || value.marks < 1)) {
    issues.push(issue(file, id || undefined, "marks, when present, must be a positive integer"));
  }
  if (value.imagePath !== undefined) {
    if (typeof value.imagePath !== "string" || !value.imagePath.trim() || value.imagePath.includes("..")) {
      issues.push(issue(file, id || undefined, "imagePath, when present, must be a relative path inside the private bank"));
    }
  }
  if (value.studentAnswer !== undefined && typeof value.studentAnswer !== "string") {
    issues.push(issue(file, id || undefined, "studentAnswer, when present, must be a string"));
  }
  if (value.privateAnswer !== undefined) {
    if (!isRecord(value.privateAnswer)) {
      issues.push(issue(file, id || undefined, "privateAnswer, when present, must be an object"));
    } else {
      const generated = value.privateAnswer;
      if (typeof generated.claudeAnswer !== "string" || !generated.claudeAnswer.trim()) {
        issues.push(issue(file, id || undefined, "privateAnswer.claudeAnswer must be an option id"));
      }
      if (typeof generated.model !== "string" || !generated.model.trim()) {
        issues.push(issue(file, id || undefined, "privateAnswer.model is required"));
      }
      if (typeof generated.checkedAt !== "string" || !generated.checkedAt.trim()) {
        issues.push(issue(file, id || undefined, "privateAnswer.checkedAt is required"));
      }
      if (typeof generated.studentDisagrees !== "boolean") {
        issues.push(issue(file, id || undefined, "privateAnswer.studentDisagrees must be true or false"));
      }
      if (typeof generated.note !== "string" || !generated.note.trim()) {
        issues.push(issue(file, id || undefined, "privateAnswer.note is required"));
      } else if (generated.studentDisagrees === true && !generated.note.toLowerCase().includes("differs")) {
        issues.push(issue(file, id || undefined, "a handwritten answer that differs must be flagged in privateAnswer.note"));
      }
    }
  }

  if (value.answerCheck !== undefined) {
    if (!isRecord(value.answerCheck)) {
      issues.push(issue(file, id || undefined, "answerCheck, when present, must be an object"));
    } else {
      const check = value.answerCheck;
      if (typeof check.agreed !== "boolean") {
        issues.push(issue(file, id || undefined, "answerCheck.agreed must be true or false"));
      }
      if (typeof check.claudeAnswer !== "string" || !check.claudeAnswer.trim()) {
        issues.push(issue(file, id || undefined, "answerCheck.claudeAnswer must be an option id"));
      }
      if (typeof check.model !== "string" || !check.model.trim()) {
        issues.push(issue(file, id || undefined, "answerCheck.model is required"));
      }
      if (typeof check.checkedAt !== "string" || !check.checkedAt.trim()) {
        issues.push(issue(file, id || undefined, "answerCheck.checkedAt is required"));
      }
      if (typeof check.note !== "string" || !check.note.trim()) {
        issues.push(issue(file, id || undefined, "answerCheck.note is required"));
      } else if (check.agreed === false && !check.note.toLowerCase().includes("disagreement")) {
        issues.push(issue(file, id || undefined, "a disagreement must be flagged in answerCheck.note"));
      }
    }
  }

  return issues;
}

export function formatIssues(issues: ValidationIssue[]): string {
  return issues
    .map((item) => `${item.file}${item.id ? ` [${item.id}]` : ""}: ${item.message}`)
    .join("\n");
}

export function assertUniqueIds(questions: Question[], file = "bank"): ValidationIssue[] {
  const seen = new Map<string, string>();
  const issues: ValidationIssue[] = [];
  for (const question of questions) {
    const previous = seen.get(question.id);
    if (previous) {
      issues.push(issue(file, question.id, `duplicate id (also in ${previous})`));
    } else {
      seen.set(question.id, question.topic);
    }
  }
  return issues;
}
