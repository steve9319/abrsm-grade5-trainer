import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";

export const DEFAULT_ANTHROPIC_MODEL = "claude-fable-5-1";

export interface ExplainInput {
  id?: string;
  topic?: string;
  question?: string;
  notation?: string;
  options?: { id?: string; text?: string }[];
  correctAnswer?: string;
}

export interface ParsedExplanation {
  explanation: string;
  optionExplanations: Record<string, string>;
}

export type ExplainBody =
  | {
      available: true;
      explanation: string;
      optionExplanations: Record<string, string>;
      model: string;
    }
  | { available: false; message: typeof EXPLANATION_UNAVAILABLE_TEXT };

type Env = {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
};

function unavailable(status: number): { status: number; body: ExplainBody } {
  return { status, body: { available: false, message: EXPLANATION_UNAVAILABLE_TEXT } };
}

export function buildExplainPrompt(input: ExplainInput): string {
  const options = (input.options ?? [])
    .map((option) => `${option.id ?? "?"}. ${option.text ?? ""}`)
    .join("\n");
  return [
    "You are a careful ABRSM Grade 5 music theory teacher helping a piano student.",
    "Use British note names (semibreve, minim, crotchet, quaver, semiquaver) and British theory terms.",
    "The correct option is given. Do not change it. Explain why it is correct, and why every other option is wrong.",
    "Reply with JSON only, no markdown, in this shape:",
    '{"explanation":"...","optionExplanations":{"A":"...","B":"..."}}',
    "The explanation field says why the correct answer is correct.",
    "Each optionExplanations value says why that option is right or wrong.",
    "",
    `Topic: ${input.topic ?? ""}`,
    `Question: ${input.question ?? ""}`,
    input.notation ? `ABC notation:\n${input.notation}` : "",
    "Options:",
    options,
    `Correct option id: ${input.correctAnswer ?? ""}`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function parseExplainPayload(text: string): ParsedExplanation | null {
  const stripped = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1)) as {
      explanation?: unknown;
      optionExplanations?: unknown;
    };
    if (typeof parsed.explanation !== "string") return null;
    const optionExplanations: Record<string, string> = {};
    if (parsed.optionExplanations && typeof parsed.optionExplanations === "object") {
      for (const [key, value] of Object.entries(parsed.optionExplanations)) {
        if (typeof value === "string") optionExplanations[key] = value.trim();
      }
    }
    return { explanation: parsed.explanation.trim(), optionExplanations };
  } catch {
    return null;
  }
}

function inputIsUsable(input: ExplainInput): boolean {
  if (!input || typeof input.question !== "string" || input.question.trim().length === 0) return false;
  if (input.question.length > 4000) return false;
  if (typeof input.correctAnswer !== "string" || !input.correctAnswer.trim()) return false;
  if (!Array.isArray(input.options) || input.options.length < 2 || input.options.length > 6) return false;
  return input.options.every(
    (option) => typeof option?.text === "string" && option.text.trim().length > 0 && option.text.length < 1000,
  );
}

export async function requestExplanation(
  input: ExplainInput,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; body: ExplainBody }> {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return unavailable(200);
  if (!inputIsUsable(input)) return unavailable(400);

  const model = env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  try {
    const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        messages: [{ role: "user", content: buildExplainPrompt(input) }],
      }),
    });
    if (!response.ok) return unavailable(200);
    const data = (await response.json()) as { content?: { type?: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n");
    const parsed = parseExplainPayload(text);
    if (!parsed?.explanation) return unavailable(200);
    return {
      status: 200,
      body: {
        available: true,
        explanation: parsed.explanation,
        optionExplanations: parsed.optionExplanations,
        model,
      },
    };
  } catch {
    return unavailable(200);
  }
}
