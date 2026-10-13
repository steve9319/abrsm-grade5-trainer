import type { Question } from "@/lib/types";

/** Stable hash of the stem, so a cached explanation is dropped if the question changes. */
export function questionContentHash(
  question: Pick<Question, "question" | "correctAnswer" | "options" | "notation">,
): string {
  const raw = [
    question.question,
    question.notation ?? "",
    question.correctAnswer,
    ...question.options.map((option) => `${option.id}:${option.text}`),
  ].join("\n");
  let hash = 5381;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 33) ^ raw.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}
